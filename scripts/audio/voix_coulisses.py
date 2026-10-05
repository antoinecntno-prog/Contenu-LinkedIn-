"""Voix off du film « Coulisses » : découpe la prise ElevenLabs (voix Paul K) et cale chaque phrase sur l'image.

Usage : python3 scripts/audio/voix_coulisses.py <sortie.wav>
Source : public/voix/paulk-v3-prise2.mp3 (modèle eleven_v3, avec indications d'émotion), lue d'une traite. Les bornes de chaque phrase viennent des
silences de la prise, recoupés avec sa transcription mot à mot (ElevenLabs Scribe). Chaque phrase est accélérée sans changer la
hauteur (filtre atempo de ffmpeg), puis posée à l'instant où son texte apparaît à l'écran.
"""
import subprocess
import sys

import numpy as np
from scipy.io import wavfile

SR = 48000
DUR = 22.0
SOURCE = "public/voix/paulk-v3-prise2.mp3"

# (début, fin) dans la prise, en secondes ; image d'arrivée dans le film (60 i/s) ; accélération.
# Bornes prises dans les silences de la prise (détection ffmpeg), recoupées avec la transcription.
PHRASES = [
    ("Ma dernière vidéo de formation IA est écrite en code !", 0.00, 3.40, 3, 1.05),
    ("Claude Code l'a programmée.", 3.55, 5.35, 200, 1.0),
    ("Rémotion transforme le code en vidéo... son compris !", 5.70, 8.86, 336, 1.0),
    ("Ma part : relire, et corriger.", 9.28, 11.62, 606, 1.0),
    ("La même méthode, aux couleurs de la maison.", 12.00, 14.45, 750, 1.0),
    ("Quelle vidéo repoussez-vous, faute de temps ?", 15.27, 17.45, 944, 1.0),
    ("Antoine Contino.", 18.20, 19.43, 1080, 1.05),
    ("L'IA simplifiée, et taillée sur mesure.", 20.00, 22.70, 1152, 1.05),
]


def extrait(t0, t1, tempo):
    raw = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-ss", f"{t0}", "-to", f"{t1}", "-i", SOURCE,
         "-af", f"atempo={tempo}", "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
        capture_output=True, check=True,
    ).stdout
    x = np.frombuffer(raw, np.int16).astype(float) / 32768
    f = int(0.012 * SR)
    x[:f] *= np.linspace(0, 1, f)
    x[-f:] *= np.linspace(1, 0, f)
    return x


def main(out):
    n = int(DUR * SR)
    v = np.zeros(n)
    fin_prec = 0.0
    for texte, t0, t1, image, tempo in PHRASES:
        x = extrait(t0, t1, tempo)
        debut = image / 60
        assert debut >= fin_prec - 0.02, f"chevauchement avant « {texte} »"
        i = int(debut * SR)
        m = min(len(x), n - i)
        assert m == len(x), f"« {texte} » dépasse la fin du film"
        v[i : i + m] += x
        fin_prec = debut + len(x) / SR
        print(f"{debut:5.2f} s à {fin_prec:5.2f} s  {texte}")
    wavfile.write(out, SR, (np.clip(v, -1, 1) * 32767).astype(np.int16))
    print("écrit", out)


if __name__ == "__main__":
    main(sys.argv[1])
