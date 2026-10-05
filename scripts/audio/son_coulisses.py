"""Bande son du film « Coulisses » : musique et bruitages synthétisés, calés sur les images.

Usage : python3 scripts/audio/son_coulisses.py <sortie.wav> [voix.wav]
120 BPM en ré mineur : un temps toutes les 0,5 s (30 images), une mesure toutes les 2 s.
Les instants sont donnés en images (60 i/s) et reprennent src/coulisses/constants.ts.
Les instruments viennent de generer_son.py (film précédent).
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from generer_son import (  # noqa: E402
    SR,
    add,
    bass,
    bell,
    boing,
    clap,
    click,
    crash,
    engine,
    filt,
    hat,
    kick,
    pad,
    pluck,
    pop,
    reverb,
    riser,
    scribble,
    sparkle,
    thud,
    whoosh,
    zap,
)

DUR = 21.5
N = int(SR * DUR)
FPS = 60
rng = np.random.default_rng(11)


def F(frame):
    return frame / FPS


# Temps forts, repris de src/coulisses/constants.ts
IMPACT_CODE = 90
ZOOM = (116, 152)
CHIPS = [186, 201, 216, 231]
ENTER = 240
GROW = (296, 328)
RENDER = 420
DROP = 480
CUTS = [480, 510, 540, 570]
PAUSE = 600
CHECK = 700
RESUME = 720
SWAPS = [750, 840]
SWEEP = (928, 948)
WORDS = [944, 952, 960, 968, 972, 976, 986]
CURTAIN = (1062, 1082)
FINAL = 1080


def sub_boom(gain=1.0, dur=0.9):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    f = 38 + 70 * np.exp(-tt * 9)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 3.2) * gain


def glitch(dur=0.06, gain=1.0, seed=0):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    f = r.uniform(300, 2400)
    tt = np.arange(n) / SR
    s = np.sign(np.sin(2 * np.pi * f * tt)) * 0.5
    s = np.round(s * 4) / 4
    return s * np.exp(-tt * 30) * gain


def tape_stop(x, t0, dur):
    """Ralentit la musique jusqu'à l'arrêt à partir de t0, sur dur secondes."""
    i0 = int(t0 * SR)
    n = int(dur * SR)
    rate = (1 - np.linspace(0, 1, n)) ** 1.6
    pos = i0 + np.cumsum(rate)
    out = x.copy()
    for c in range(x.shape[1]):
        out[i0 : i0 + n, c] = np.interp(pos, np.arange(len(x)), x[:, c])
    out[i0 : i0 + n] *= ((1 - np.linspace(0, 1, n)) ** 0.7)[:, None]
    out[i0 + n :] = 0
    return out


# ------------------------------------------------------------------ musique

PROG = [(50, [62, 65, 69]), (46, [58, 62, 65]), (53, [65, 69, 72]), (48, [60, 64, 67])]
ARP = [0, 1, 2, 1]


def section(m, t_from, t_to):
    """Arpège, basse et batterie pour les temps compris entre t_from et t_to."""
    for b in range(10):
        t0 = b * 2.0
        root, ch = PROG[b % 4]
        # arpège en doubles croches, sombre au début, ouvert après le drop
        for k in range(16):
            t = t0 + k * 0.125
            if not (t_from <= t < t_to):
                continue
            bright = 1800 if t < 2.5 else 3500 if t < F(DROP) else 6000
            note = ch[ARP[k % 4]] + (12 if (t >= F(DROP) and k % 8 >= 4) else 0)
            add(m, pluck(note, 0.22, bright), t, 0.42 if t < F(DROP) else 0.5, pan=0.35 if k % 2 else -0.35)
        # basse en croches, à partir de 4 s
        for k in range(8):
            t = t0 + k * 0.25
            if t_from <= t < t_to and t >= 4.0:
                add(m, bass(root - 12 + (12 if k % 4 == 3 else 0), 0.22), t, 0.85)
        # batterie, à partir de 2,5 s
        for k in range(4):
            t = t0 + k * 0.5
            if not (t_from <= t < t_to and t >= 2.5):
                continue
            add(m, kick(), t, 0.95)
            add(m, hat(), t + 0.25, 0.32, pan=0.4)
            if t >= F(DROP):
                add(m, hat(), t + 0.125, 0.14, pan=-0.4)
                if k % 2 == 1:
                    add(m, clap(), t, 0.5, pan=0.1)


def musique():
    # avant la relecture, puis arrêt de bande sur la pause
    pre = np.zeros((N, 2))
    section(pre, 0.0, F(PAUSE))
    for t0 in (4.0, 6.0, 8.0):
        add(pre, pad(PROG[int(t0 / 2) % 4][1], 2.0), t0, 0.75)
    for k in range(16):
        add(pre, clap(), F(DROP) - 2.0 + k * 0.125, 0.05 + 0.28 * (k / 16) ** 2, pan=-0.1)
    pre = tape_stop(pre, F(PAUSE), 0.45)

    # relecture : nappe filtrée, très basse
    quiet = np.zeros((N, 2))
    add(quiet, pad([62, 65, 69], 1.9), F(PAUSE) + 0.25, 0.6)
    quiet = filt(quiet.T, "low", 700).T

    # reprise, question, accord final
    post = np.zeros((N, 2))
    section(post, F(RESUME), F(SWEEP[0]))
    for t0 in (12.0, 14.0):
        add(post, pad(PROG[int(t0 / 2) % 4][1], 2.0), t0, 0.75)
    add(post, pad([62, 65, 69, 72], 2.3), F(SWEEP[1]), 0.9)
    for i, f in enumerate(WORDS):
        add(post, kick(1.0), F(f), 0.9)
        add(post, bass(38 + [0, 0, 3, 5, 5, 7, 12][i], 0.3), F(f), 0.9)
    add(post, pad([50, 57, 62, 65, 69, 74], 3.5), F(FINAL), 1.25)
    add(post, bass(38, 2.4), F(FINAL), 1.0)
    add(post, kick(1.2), F(FINAL), 1.0)
    return pre + quiet + post


# ---------------------------------------------------------------- bruitages

def bruitages():
    s = np.zeros((N, 2))
    # 1. Accroche : frappe, sortie, brouillage, impact, plongée dans le « o »
    for i in range(31):
        add(s, click(0.3, 2600 + 500 * (i % 3)), F(8 + i * 1.1), pan=-0.3 + 0.6 * (i / 31))
    add(s, whoosh(0.25, 600, 3000, 0.5), F(52))
    add(s, kick(0.7), F(54))
    for i in range(10):
        add(s, glitch(0.05, 0.2, i), F(72 + i * 1.8), pan=0.4 if i % 2 else -0.4)
    add(s, thud(1.0, 48), F(IMPACT_CODE))
    add(s, sub_boom(0.7), F(IMPACT_CODE))
    add(s, crash(0.5), F(IMPACT_CODE))
    add(s, riser(F(ZOOM[0] - 96), 0.45), F(96))
    add(s, whoosh(0.65, 200, 7000, 1.2), F(ZOOM[0] - 4))
    add(s, thud(1.1, 55), F(ZOOM[1]))
    add(s, sub_boom(0.8), F(ZOOM[1]))
    add(s, crash(0.35), F(ZOOM[1]))
    # 2. Les quatre éléments tombent dans le terminal
    add(s, whoosh(0.4, 3000, 400, 0.5), F(150))
    for k, f in enumerate(CHIPS):
        add(s, whoosh(0.28, 500, 4000, 0.55), F(f) - 0.26, pan=-0.6 if k % 2 == 0 else 0.6)
        add(s, thud(0.6, 90 + k * 10), F(f))
        add(s, pop(1.0 + k * 0.18, 0.55), F(f), pan=-0.3 if k % 2 == 0 else 0.3)
    add(s, click(1.0, 1500), F(ENTER))
    add(s, click(0.7, 900), F(ENTER) + 0.012)
    for k in range(4):
        add(s, whoosh(0.22, 4000, 600, 0.35), F(ENTER + 1 + k * 3))
    add(s, zap(0.35, 0.6), F(ENTER + 14))
    # 3. Le code s'écrit, l'éditeur s'ouvre
    for i in range(170):
        f = 268 + i * 0.84
        add(s, click(0.22 + 0.1 * rng.random(), 2500 + 2500 * rng.random()), F(f), pan=rng.uniform(-0.5, 0.5))
    add(s, whoosh(0.55, 300, 3500, 0.8), F(GROW[0]))
    add(s, thud(0.5, 80), F(GROW[1]))
    # 4. Rendu : les lignes deviennent la timeline, compteur, drop
    add(s, zap(0.4, 0.8), F(RENDER))
    for k in range(10):
        add(s, whoosh(0.3, 800, 3000, 0.22), F(RENDER + 4 + k * 2.6), pan=-0.5 + k / 10)
    for k in range(9):
        add(s, pop(0.8 + k * 0.08, 0.35), F(448 + k * 1.6))
    for k in range(22):
        t = F(446) + (F(474) - F(446)) * (k / 22) ** 0.6
        add(s, click(0.4, 4500), t)
    add(s, riser(1.0, 0.55), F(DROP) - 1.0)
    add(s, thud(1.5, 45), F(DROP))
    add(s, sub_boom(1.0, 1.2), F(DROP))
    add(s, crash(0.9), F(DROP))
    for f in CUTS[1:]:
        add(s, whoosh(0.18, 2000, 6000, 0.45), F(f) - 0.12)
        add(s, thud(0.7, 70), F(f))
    add(s, pop(1.3, 0.5), F(500))
    # 5. Relecture
    add(s, click(0.9, 1200), F(PAUSE))
    add(s, scribble(0.38, 0.8, 16), F(628))
    add(s, pop(1.1, 0.6), F(644))
    for i in range(28):
        add(s, click(0.45, 3000 + 300 * (i % 4)), F(648 + i))
    add(s, thud(0.5, 110), F(664))
    add(s, thud(0.5, 100), F(669))
    add(s, whoosh(0.18, 3000, 6000, 0.35), F(674))
    for i in range(24):
        add(s, click(0.45, 2800 + 400 * (i % 3)), F(680 + i * 0.8))
    add(s, bell(81, 0.9), F(CHECK), 1.0)
    add(s, bell(88, 0.9), F(CHECK) + 0.06, 0.8)
    add(s, sparkle(0.8), F(CHECK))
    add(s, click(0.8, 1500), F(CHECK + 4))
    add(s, riser(0.3, 0.5), F(RESUME) - 0.3)
    # 6. Aux couleurs de la maison
    for f in SWAPS:
        add(s, whoosh(0.35, 300, 2500, 0.45), F(f - 2), pan=0.3)
        add(s, boing(0.35, up=False), F(f - 2))
        add(s, whoosh(0.5, 200, 5000, 0.8), F(f))
        add(s, pop(0.7, 0.8), F(f + 2))
        add(s, pop(0.9, 0.7), F(f + 6))
        add(s, sparkle(0.35), F(f + 8))
    add(s, click(0.9, 1800), F(900))
    add(s, pop(1.2, 0.5), F(900))
    # 7. Balayage, question, rideau, signature
    add(s, whoosh(0.45, 300, 6000, 1.1), F(SWEEP[0] - 2))
    add(s, thud(0.8, 60), F(SWEEP[1]))
    for i, f in enumerate(WORDS[:-1]):
        add(s, pop(0.9 + i * 0.1, 0.45), F(f))
    add(s, boing(0.7), F(WORDS[-1]))
    add(s, thud(1.0, 55), F(WORDS[-1]))
    add(s, riser(F(CURTAIN[0] - 1000), 0.4), F(1000))
    add(s, whoosh(0.5, 4000, 200, 1.0), F(CURTAIN[0]))
    add(s, thud(1.6, 42), F(FINAL))
    add(s, sub_boom(1.1, 1.6), F(FINAL))
    add(s, crash(1.0), F(FINAL))
    for i in range(14):
        add(s, click(0.35, 2000 + 200 * i), F(FINAL + i * 1.5))
    for f in (1094, 1104, 1110):
        add(s, pop(1.2, 0.35), F(f))
    add(s, engine(1.05, 70, 120, 0.7), F(1100))
    squeal = filt(rng.standard_normal(int(0.25 * SR)), "band", [2500, 3500]) * np.exp(-np.arange(int(0.25 * SR)) / (0.08 * SR))
    add(s, squeal * 0.18, F(1158))
    add(s, thud(0.4, 120), F(1162))
    return s


def lire_voix(path):
    """Piste de voix off (voix_coulisses.py), en stéréo centrée."""
    from scipy.io import wavfile

    sr, v = wavfile.read(path)
    assert sr == SR, "la voix doit être à 48 kHz"
    v = v.astype(float) / 32768
    out = np.zeros(N)
    out[: min(N, len(v))] = v[:N]
    return out


def enveloppe(v, attaque=0.03, relache=0.35):
    """Enveloppe lissée de la voix, de 0 à 1, pour baisser la musique dessous."""
    e = np.abs(v)
    e = filt(e, "low", 12)
    e = np.clip(e / (np.percentile(e[e > 1e-4], 90) + 1e-9), 0, 1)
    out = np.zeros_like(e)
    a = np.exp(-1 / (attaque * SR))
    r = np.exp(-1 / (relache * SR))
    prev = 0.0
    for i in range(0, len(e), 64):
        x = e[i : i + 64].max()
        prev = a * prev + (1 - a) * x if x > prev else r * prev + (1 - r) * x
        out[i : i + 64] = prev
    return np.clip(out * 1.6, 0, 1)


def main(out, voix=None):
    mus = musique()
    sfx = bruitages()
    mus = reverb(mus, 1.4, 0.14)
    sfx = reverb(sfx, 0.8, 0.10)
    if voix:
        v = lire_voix(voix)
        env = enveloppe(v)[:, None]
        # musique baissée d'environ 14 dB et bruitages de 7 dB pendant que la voix parle
        mix = mus * 0.55 * (1 - 0.8 * env) + sfx * 0.8 * (1 - 0.55 * env)
        mix += np.stack([v, v], axis=1) * 2.2
    else:
        mix = mus * 0.55 + sfx * 0.8
    # fondu de fin pour la boucle
    fade = np.ones(N)
    a = int((DUR - 0.8) * SR)
    fade[a:] = np.linspace(1, 0, N - a) ** 1.4
    mix *= fade[:, None]
    mix = np.tanh(mix * 1.1) * 0.9
    mix /= np.max(np.abs(mix)) + 1e-9
    mix *= 0.89
    from scipy.io import wavfile

    wavfile.write(out, SR, (mix * 32767).astype(np.int16))
    print("écrit", out)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
