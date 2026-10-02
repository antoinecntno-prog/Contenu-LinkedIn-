"""Contrôle du flou de mouvement : compare chaque image floue du film livré à la même image rendue nette.

Usage : python3 scripts/controle_flou.py <film.mp4> <dossier_de_travail> [--reparer]
Lit les fenêtres BLUR de src/coulisses/constants.ts, rend les images nettes (composition CO-SansFlou)
et signale toute image dont l'écart moyen sort de la norme : calque perdu, image vide ou noire.
Le flou HtmlInCanvas perd parfois une image au hasard. Avec --reparer, chaque image signalée est
re-rendue seule (composition Coulisses), revérifiée, puis recollée dans le film à sa place.
"""
import os
import re
import shutil
import subprocess
import sys

import numpy as np
from PIL import Image

# Écart moyen en niveaux de gris (0 à 255), sur une image réduite. Étalonné sur deux rendus :
# images saines entre 3 et 19 (19 au plus fort de la plongée dans le « o »), images cassées entre 13 et 49
# mais toujours à plus de 4 fois la médiane de leur fenêtre.
SEUIL = 22.0  # au-dessus : cassée d'office
RAPPORT = 3.0  # ou bien plus de 3 fois la médiane de sa fenêtre (et plus de 8)


def fenetres():
    src = open("src/coulisses/constants.ts").read()
    bloc = src[src.index("export const BLUR") :]
    bloc = bloc[: bloc.index("];")]
    return [(int(a), int(b)) for a, b in re.findall(r"\[(\d+),\s*(\d+)\]", bloc)]


def reduit(path):
    return np.asarray(Image.open(path).convert("L").resize((135, 169), Image.BILINEAR), dtype=float)


def stills(out_dir, comp, frames, ext="jpg"):
    env = {**os.environ, "STILL_EXT": ext}
    subprocess.run(
        ["node", "scripts/stills.mjs", out_dir, comp, *map(str, frames)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        env=env,
    )


def hors_norme(d, med):
    return d > SEUIL or (d > 8 and d > RAPPORT * med)


def main(film, work, reparer):
    os.makedirs(work, exist_ok=True)
    frames = [f for a, b in fenetres() for f in range(a, b)]
    nettes = os.path.join(work, "nettes")
    manquantes = [f for f in frames if not os.path.exists(os.path.join(nettes, f"CO-SansFlou-{f:04d}.jpg"))]
    if manquantes:
        stills(nettes, "CO-SansFlou", manquantes)
    floues = os.path.join(work, "floues")
    shutil.rmtree(floues, ignore_errors=True)
    os.makedirs(floues)
    expr = "+".join(f"eq(n\\,{f})" for f in frames)
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-i", film, "-vf", f"select='{expr}'", "-vsync", "0", os.path.join(floues, "%04d.png")],
        check=True,
    )
    nette = lambda f: reduit(os.path.join(nettes, f"CO-SansFlou-{f:04d}.jpg"))
    ecart = {f: float(np.mean(np.abs(nette(f) - reduit(os.path.join(floues, f"{i + 1:04d}.png"))))) for i, f in enumerate(frames)}
    med = {}
    casses = []
    for a, b in fenetres():
        m = float(np.median([ecart[f] for f in range(a, b)]))
        print(f"fenêtre {a} à {b} : médiane {m:.1f}, max {max(ecart[f] for f in range(a, b)):.1f}")
        for f in range(a, b):
            med[f] = m
            if hors_norme(ecart[f], m):
                casses.append(f)
    for f in casses:
        print(f"  image {f} : écart {ecart[f]:.1f}")
    print(f"{len(frames)} images contrôlées : " + ("aucune image cassée" if not casses else f"{len(casses)} image(s) cassée(s)"))
    if not casses or not reparer:
        return 1 if casses else 0

    # Réparation : rendu isolé de chaque image cassée, jusqu'à trois essais
    patch_dir = os.path.join(work, "reparees")
    bonnes = {}
    restantes = list(casses)
    for essai in range(3):
        if not restantes:
            break
        shutil.rmtree(patch_dir, ignore_errors=True)
        stills(patch_dir, "Coulisses", restantes, ext="png")
        encore = []
        for f in restantes:
            p = os.path.join(patch_dir, f"Coulisses-{f:04d}.png")
            d = float(np.mean(np.abs(reduit(p) - nette(f))))
            if hors_norme(d, med[f]):
                encore.append(f)
            else:
                keep = os.path.join(work, f"bonne-{f:04d}.png")
                shutil.copy(p, keep)
                bonnes[f] = keep
                print(f"  image {f} réparée à l'essai {essai + 1} (écart {d:.1f})")
        restantes = encore
    if restantes:
        print(f"non réparées : {restantes}")
    if bonnes:
        # Recollage : chaque image réparée recouvre la vidéo sur sa seule image
        args = ["ffmpeg", "-loglevel", "error", "-y", "-i", film]
        chain = []
        last = "0:v"
        for k, (f, p) in enumerate(sorted(bonnes.items())):
            args += ["-i", p]
            # conversion en BT.709, comme le reste du film, pour éviter un saut de teinte sur l'image recollée
            chain.append(f"[{k + 1}:v]scale=out_color_matrix=bt709:out_range=tv,format=yuv420p[p{k}]")
            chain.append(f"[{last}][p{k}]overlay=0:0:format=yuv420:enable='eq(n\\,{f})'[v{k}]")
            last = f"v{k}"
        tmp = film + ".repare.mp4"
        args += [
            "-filter_complex", ";".join(chain), "-map", f"[{last}]", "-map", "0:a?",
            "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
            "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
            "-c:a", "copy", "-movflags", "+faststart", tmp,
        ]
        subprocess.run(args, check=True)
        os.replace(tmp, film)
        print(f"{len(bonnes)} image(s) recollée(s) dans {film}")
    return 1 if restantes else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1], sys.argv[2], "--reparer" in sys.argv[3:]))
