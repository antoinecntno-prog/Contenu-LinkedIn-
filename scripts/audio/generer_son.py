"""Bande son du film : musique et bruitages synthétisés, calés sur les images.

Usage : python3 scripts/audio/generer_son.py <sortie.wav>
Tempo 120 BPM : un temps toutes les 0,5 s, une mesure toutes les 2 s.
Les instants sont donnés en images (60 i/s), repris du code des scènes.
"""
import sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 48000
DUR = 32.0
N = int(SR * DUR)
FPS = 60
rng = np.random.default_rng(7)


def t_of(frame):
    return frame / FPS


def env_ad(n, a, d):
    """Attaque linéaire de a échantillons puis décroissance exponentielle."""
    e = np.exp(-np.arange(n) / max(1, d))
    if a > 0:
        e[:a] *= np.linspace(0, 1, a)
    return e


def filt(x, kind, f, order=2):
    if isinstance(f, (list, tuple)):
        sos = butter(order, [f[0] / (SR / 2), f[1] / (SR / 2)], btype="band", output="sos")
    else:
        sos = butter(order, f / (SR / 2), btype=kind, output="sos")
    return sosfilt(sos, x)


def add(buf, sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= buf.shape[0] or i + len(sig) <= 0:
        return
    j0 = max(0, -i)
    sig = sig[j0:]
    i = max(0, i)
    n = min(len(sig), buf.shape[0] - i)
    left = np.cos((pan + 1) * np.pi / 4)
    right = np.sin((pan + 1) * np.pi / 4)
    buf[i : i + n, 0] += sig[:n] * gain * left * 1.414
    buf[i : i + n, 1] += sig[:n] * gain * right * 1.414


def note_hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def saw(freq, dur, detune=0.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    out = np.zeros(n)
    for dt in (-detune, 0, detune):
        ph = (tt * freq * (1 + dt)) % 1.0
        out += 2 * ph - 1
    return out / 3


# ---------------------------------------------------------------- instruments

def kick(gain=1.0):
    n = int(0.35 * SR)
    tt = np.arange(n) / SR
    f = 48 + 110 * np.exp(-tt * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-tt * 9) * gain


def clap():
    n = int(0.25 * SR)
    x = rng.standard_normal(n)
    e = np.zeros(n)
    for k in range(3):
        s = int(k * 0.011 * SR)
        e[s:] += np.exp(-np.arange(n - s) / (0.006 * SR if k < 2 else 0.05 * SR))
    return filt(x * e, "band", [900, 4000]) * 0.9


def hat(open_=False):
    n = int((0.18 if open_ else 0.05) * SR)
    x = filt(rng.standard_normal(n), "high", 7000)
    return x * np.exp(-np.arange(n) / ((0.06 if open_ else 0.012) * SR)) * 0.5


def bass(midi, dur):
    s = saw(note_hz(midi), dur, 0.003) * 0.6 + np.sin(2 * np.pi * note_hz(midi) * np.arange(int(dur * SR)) / SR)
    s = filt(s, "low", 600)
    n = len(s)
    e = np.minimum(1, np.arange(n) / (0.005 * SR)) * np.exp(-np.arange(n) / (0.35 * SR))
    e[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))
    return s * e * 0.55


def pad(midis, dur):
    n = int(dur * SR)
    s = np.zeros(n)
    for m in midis:
        s += saw(note_hz(m), dur, 0.006)
    s = filt(s / len(midis), "low", 1800)
    a = int(0.08 * SR)
    e = np.ones(n)
    e[:a] = np.linspace(0, 1, a)
    e[-a:] = np.linspace(1, 0, a)
    return s * e * 0.28


def pluck(midi, dur=0.3, bright=4000):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    s = saw(note_hz(midi), dur, 0.002)
    s = filt(s, "low", bright)
    return s * np.exp(-tt * 9) * 0.35


def bell(midi, dur=0.6):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    f = note_hz(midi)
    s = np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 8)
    return s * np.exp(-tt * 5) * env_ad(n, int(0.002 * SR), n * 10) * 0.35


# ------------------------------------------------------------- bruitages

def whoosh(dur, f0=400, f1=3000, gain=1.0):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    out = np.zeros(n)
    steps = 24
    for k in range(steps):
        a, b = k * n // steps, (k + 1) * n // steps
        fc = f0 * (f1 / f0) ** (k / (steps - 1))
        seg = filt(x, "band", [fc * 0.7, min(fc * 1.4, SR / 2 - 100)])[a:b]
        out[a:b] = seg
    e = np.sin(np.linspace(0, np.pi, n)) ** 1.5
    return out * e * gain


def thud(gain=1.0, f=70):
    n = int(0.3 * SR)
    tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * np.cumsum(f + 60 * np.exp(-tt * 40)) / SR) * np.exp(-tt * 14)
    s += filt(rng.standard_normal(n), "low", 900) * np.exp(-tt * 40) * 0.6
    return s * gain


def pop(pitch=1.0, gain=1.0):
    n = int(0.09 * SR)
    tt = np.arange(n) / SR
    f = 500 * pitch + 900 * pitch * np.exp(-tt * 60)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 45) * gain


def boing(gain=1.0, up=True):
    n = int(0.45 * SR)
    tt = np.arange(n) / SR
    base = 180 + (260 * tt / 0.45 if up else -80 * tt / 0.45)
    f = base * (1 + 0.18 * np.sin(2 * np.pi * 14 * tt) * np.exp(-tt * 4))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 5) * gain * 0.6


def click(gain=1.0, f=3000):
    n = int(0.02 * SR)
    x = filt(rng.standard_normal(n), "band", [f * 0.6, f * 1.5])
    return x * np.exp(-np.arange(n) / (0.003 * SR)) * gain


def scribble(dur, gain=1.0, rate=22):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = filt(rng.standard_normal(n), "band", [1500, 6000])
    am = 0.5 + 0.5 * np.sin(2 * np.pi * rate * tt) ** 2
    e = np.minimum(1, tt / 0.02) * np.minimum(1, (dur - tt) / 0.03)
    return x * am * e * gain * 0.5


def zap(dur=0.4, gain=1.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    f = 1800 * np.exp(-tt * 6) + 200
    s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.4 + np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    return filt(s, "low", 5000) * np.exp(-tt * 7) * gain * 0.35


def sparkle(gain=1.0):
    out = np.zeros(int(0.5 * SR))
    for k in range(6):
        b = bell(84 + [0, 4, 7, 12, 16, 19][k], 0.35)
        s = int(k * 0.035 * SR)
        out[s : s + len(b)] += b[: len(out) - s]
    return out * gain * 0.6


def riser(dur, gain=1.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    f = 200 * (8 ** (tt / dur))
    ph = np.cumsum(f) / SR
    s = (2 * (ph % 1) - 1) * 0.5 + filt(rng.standard_normal(n), "high", 2000) * 0.4
    s = filt(s, "low", 6000)
    return s * (tt / dur) ** 2 * gain


def crash(gain=1.0):
    n = int(1.6 * SR)
    x = filt(rng.standard_normal(n), "high", 3000)
    return x * np.exp(-np.arange(n) / (0.45 * SR)) * gain * 0.5


def engine(dur, f0, f1, gain=1.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    f = f0 + (f1 - f0) * tt / dur
    ph = np.cumsum(f) / SR
    s = (2 * (ph % 1) - 1) + 0.5 * np.sign(np.sin(2 * np.pi * ph * 0.5))
    s = filt(s, "low", 900)
    e = np.minimum(1, tt / 0.05) * np.minimum(1, (dur - tt) / 0.08)
    return s * e * gain * 0.25


def reverb(x, secs=1.6, mix=0.18):
    n = int(secs * SR)
    ir = rng.standard_normal((n, 2)) * np.exp(-np.arange(n) / (0.35 * SR))[:, None]
    ir = filt(ir.T, "low", 5000).T
    wet = np.stack([fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1)
    wet /= np.max(np.abs(wet)) + 1e-9
    return x + wet * mix * np.max(np.abs(x))


# ------------------------------------------------------------------ musique

def musique():
    m = np.zeros((N, 2))
    beat = 0.5
    bar = 2.0
    # La mineur, Fa, Do, Sol : une mesure par accord
    prog = [(57, [69, 72, 76]), (53, [65, 69, 72]), (48, [64, 67, 72]), (55, [67, 71, 74])]
    tension = [(50, [62, 65, 69]), (52, [64, 68, 71])]
    arp = [0, 2, 1, 2]
    for b in range(16):
        t0 = b * bar
        if 15.0 <= t0 < 19.0:
            root, ch = tension[(b - 7) % 2]
        else:
            root, ch = prog[b % 4]
        # nappe
        if t0 >= 4.0:
            add(m, pad(ch, bar), t0, 0.8 if t0 < 23 else 1.0)
        # arpège en croches
        for k in range(8):
            t = t0 + k * 0.25
            if t < 0.5 or (18.2 <= t < 19.0):
                continue
            note = ch[arp[k % 4]] + (12 if (t >= 19.0 and k % 2) else 0)
            add(m, pluck(note, 0.28, 2500 if t < 4 else 5000), t, 0.55, pan=0.3 if k % 2 else -0.3)
        # basse
        for k in range(4):
            t = t0 + k * beat
            if t < 4.0 or (18.2 <= t < 19.0):
                continue
            add(m, bass(root - 12, 0.45), t, 0.9)
        # batterie
        for k in range(4):
            t = t0 + k * beat
            if t < 0.5 or (18.2 <= t < 19.0) or t >= 31.0:
                continue
            if t >= 4.0 or k % 2 == 0:
                add(m, kick(), t, 0.9)
            if t >= 7.5 and k % 2 == 1:
                add(m, clap(), t, 0.5, pan=0.1)
            if t >= 4.0:
                add(m, hat(), t + 0.25, 0.35, pan=0.4)
            if t >= 19.0 and t < 26.0:
                add(m, hat(True), t + 0.25, 0.18, pan=-0.4)
    # roulement montant avant le gel des bulles
    for k in range(16):
        t = 16.2 + k * 0.125
        if t >= 18.2:
            break
        add(m, clap(), t, 0.12 + 0.3 * k / 16, pan=-0.1)
    # accord final tenu
    add(m, pad([57, 64, 69, 72, 76], 2.0), 30.0, 1.2)
    add(m, bass(45 - 12, 1.8), 30.0, 0.9)
    # ralenti de fin
    fade = np.ones(N)
    a = int(30.6 * SR)
    fade[a:] = np.linspace(1, 0, N - a) ** 1.5
    m *= fade[:, None]
    return m


# ---------------------------------------------------------------- bruitages

def eio(t):
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def bruitages():
    s = np.zeros((N, 2))
    F = t_of
    # Scène 1 : la route
    add(s, whoosh(0.3, 800, 4000, 0.5), F(0), pan=-0.5)
    add(s, thud(0.9), F(18))
    add(s, boing(0.5), F(18))
    add(s, engine(0.75, 60, 140, 1.0), F(18))
    add(s, whoosh(0.6, 300, 1500, 0.6), F(26), pan=0.4)
    add(s, pop(1.0, 0.5), F(46), pan=0.5)
    add(s, engine(1.6, 70, 60, 0.6), F(68))
    for k, f in enumerate([56, 58, 60, 62]):
        add(s, click(0.5, 2500), F(f), pan=0.3)
    add(s, engine(0.3, 70, 150, 0.9), F(160))
    add(s, whoosh(0.4, 400, 2000, 0.5), F(162), pan=0.4)
    add(s, filt(saw(1500, 0.3) * np.exp(-np.arange(int(0.3 * SR)) / SR * 6), "band", [1200, 3000]) * 0.08, F(186))
    add(s, thud(0.6, 90), F(204))
    add(s, whoosh(0.65, 200, 5000, 0.8), F(200))
    # Scène 2 : elle raconte, je note
    add(s, scribble(0.37, 0.9), 4.0 + F(12))
    add(s, scribble(0.30, 0.9), 4.0 + F(38))
    add(s, scribble(0.40, 0.8, 14), 4.0 + F(62))
    add(s, scribble(0.27, 0.8, 14), 4.0 + F(90))
    add(s, whoosh(0.2, 2000, 6000, 0.35), 4.0 + F(110))
    add(s, whoosh(0.55, 300, 6000, 1.0), F(418))
    add(s, thud(1.0, 55), F(450))
    add(s, crash(0.5), F(450))
    # Scène 3 : règle n° 1
    add(s, whoosh(0.3, 300, 1500, 0.6), F(458))
    add(s, thud(1.3, 50), F(476))
    add(s, boing(0.35), F(476))
    add(s, whoosh(0.2, 2000, 5000, 0.35), F(478))
    for k in range(21):
        add(s, click(0.25, 4000), F(484 + k * 1.5), pan=0.4)
    for k in range(36):
        add(s, click(0.45, 2800 + 400 * (k % 3)), F(518 + k * (34 / 36)), pan=0.3)
    add(s, whoosh(0.25, 2000, 6000, 0.4), F(590))
    add(s, whoosh(0.35, 1500, 300, 0.7), F(630))
    add(s, thud(1.0, 60), F(647))
    # Scène 4 : l'ordinateur
    add(s, whoosh(0.85, 4000, 300, 0.6), F(660))
    add(s, click(0.9, 1500), F(664))
    add(s, click(0.7, 1200), F(668))
    add(s, pop(1.2, 0.6), F(700))
    add(s, pop(1.5, 0.3), F(710))
    add(s, pop(1.6, 0.3), F(726))
    for k in range(33):
        add(s, click(0.6, 2200 + 300 * (k % 4)), F(734 + k * 48 / 33), pan=0.1)
    add(s, click(1.0, 2000), F(790))
    add(s, click(0.6, 1200), F(793))
    add(s, whoosh(0.3, 1000, 4000, 0.5), F(794))
    add(s, pop(1.3, 0.5), F(818))
    for k in range(4):
        add(s, click(0.25, 5000), F(822 + k * 10))
    add(s, whoosh(0.7, 300, 3000, 1.0), F(866))
    add(s, sparkle(0.6), F(896))
    # Scène 5 : ses questions
    for k, f in enumerate([904, 920, 944, 964, 1000, 1014, 1027, 1039]):
        add(s, pop(1.0 + k * 0.15, 0.7), F(f), pan=-0.5 + (k % 3) * 0.4)
    add(s, pop(0.7, 0.9), F(984))
    for k in range(26):
        add(s, scribble(0.05, 0.25, 40), F(962 + k * 5), pan=0.2)
    add(s, whoosh(0.35, 300, 2000, 0.6), F(1072), pan=0.6)
    add(s, sparkle(0.8), F(1092))
    add(s, thud(0.5, 120), F(1092))
    # Scène 6 : mes réponses
    add(s, whoosh(0.35, 3000, 400, 0.5), F(1140))
    scale = [72, 74, 76, 79, 81, 84, 86, 88]
    for k in range(8):
        add(s, bell(scale[k], 0.6), F(1150 + k * 9), 0.9, pan=-0.4 + k * 0.1)
        add(s, click(0.4, 6000), F(1150 + k * 9))
    for k in range(8):
        add(s, whoosh(0.4, 600, 3000, 0.25), F(1222 + k * 2), pan=0.5)
    add(s, pop(0.8, 0.8), F(1262))
    add(s, click(0.9, 1800), F(1264))
    add(s, whoosh(0.35, 1500, 5000, 0.5), F(1268))
    for base in (1306, 1332):
        for k in range(5):
            add(s, click(0.5, 2500), F(base + k * 3))
    add(s, zap(0.5, 0.8), F(1352))
    add(s, whoosh(0.6, 3000, 300, 0.9), F(1364))
    # Scène 7 : elle est contente
    add(s, zap(0.3, 0.9), F(1380))
    add(s, boing(0.5, up=False), F(1396))
    add(s, boing(0.9), F(1410))
    add(s, whoosh(0.5, 300, 3000, 0.6), F(1410))
    add(s, pop(0.6, 1.0), F(1434))
    add(s, sparkle(1.0), F(1434))
    add(s, crash(0.35), F(1434))
    add(s, thud(0.9), F(1490))
    add(s, boing(0.4), F(1514))
    add(s, thud(0.5), F(1534))
    add(s, whoosh(0.7, 200, 4000, 1.0), F(1538))
    # Scène 8 : 10 h
    for k in range(12):
        add(s, bell(79 + (k % 5) * 2, 0.25), F(1560 + k * 2.6), 0.35, pan=-0.5 + k / 12)
    for k in range(12):
        add(s, click(0.4, 3000), F(1580 + k * 2))
    add(s, pop(1.0, 0.6), F(1594))
    add(s, riser(84 / FPS, 0.6), F(1606))
    # un tic à chaque heure gagnée
    last = 0
    for fr in range(1606, 1691):
        n = int(10 * eio((fr - 1606) / 84) + 1e-6)
        if n > last:
            add(s, click(0.8, 3500), F(fr))
            add(s, pop(1.0 + n * 0.08, 0.3), F(fr))
            last = n
    add(s, thud(1.4, 45), F(1690))
    add(s, crash(0.8), F(1690))
    add(s, whoosh(0.3, 600, 3000, 0.4), F(1694))
    for f in (1720, 1750, 1780):
        add(s, click(0.7, 2200), F(f))
    add(s, whoosh(0.3, 3000, 600, 0.6), F(1786))
    # Scène 9 : signature
    add(s, whoosh(0.45, 300, 5000, 1.1), F(1800))
    add(s, pop(1.1, 0.4), F(1822))
    add(s, pop(1.3, 0.35), F(1832))
    add(s, thud(0.4, 110), F(1856))
    add(s, engine(1.0, 90, 110, 0.4), F(1858))
    return s


def main(out):
    mus = musique()
    sfx = bruitages()
    mus = reverb(mus, 1.4, 0.15)
    sfx = reverb(sfx, 0.8, 0.10)
    mix = mus * 0.55 + sfx * 0.75
    mix = np.tanh(mix * 1.1) * 0.9
    mix /= np.max(np.abs(mix)) + 1e-9
    mix *= 0.89
    wavfile.write(out, SR, (mix * 32767).astype(np.int16))
    print("écrit", out)


if __name__ == "__main__":
    main(sys.argv[1])
