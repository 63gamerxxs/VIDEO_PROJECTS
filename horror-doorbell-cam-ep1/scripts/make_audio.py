"""Procedural sound design + dialogue mix for Doorbell Cam (85.000 s, 48 kHz stereo)."""
import json, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

SR, DUR = 48000, 85
N = SR * DUR
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)

def t_(d): return np.arange(int(d * SR)) / SR
def filt(x, kind, f, order=2):
    return sosfilt(butter(order, f, btype=kind, fs=SR, output='sos'), x)
def noise(d): return rng.standard_normal(int(d * SR))
def env(d, a=0.005, r=0.2):
    n = int(d * SR); e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    nr = min(n, max(1, int(r * SR))); e[-nr:] *= np.linspace(1, 0, nr); return e
def expdecay(d, tau): return np.exp(-t_(d) / tau)
def put(x, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or i + len(x) <= 0: return
    j = min(N, i + len(x)); seg = x[:j - i] * g
    lg, rg = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[i:j] += seg * lg * 1.414; R[i:j] += seg * rg * 1.414

def add(a, b):
    n = max(len(a), len(b)); o = np.zeros(n); o[:len(a)] += a; o[:len(b)] += b; return o

def knock(f=95, d=0.22):  # wooden thud
    x = np.sin(2 * np.pi * f * t_(d)) * expdecay(d, 0.045) + filt(noise(d), 'bandpass', [300, 1400]) * expdecay(d, 0.02) * 0.6
    return x
def tone(f, d, tau, harm=(1,)):
    t = t_(d); return sum(np.sin(2 * np.pi * f * (k + 1) * t) / (k + 1) for k in range(len(harm))) * np.exp(-t / tau)
def step(g=1.0):
    d = 0.18; return (np.sin(2 * np.pi * 70 * t_(d)) * expdecay(d, 0.04) + filt(noise(d), 'bandpass', [200, 1800]) * expdecay(d, 0.025) * 0.7) * g
def cloth(d=0.25): return filt(noise(d), 'bandpass', [1500, 5000]) * env(d, 0.06, 0.15) * 0.25

# ---------- bed: room tone, HVAC, traffic ----------
bed = filt(noise(DUR), 'lowpass', 180) * 0.35
hum = (np.sin(2 * np.pi * 60 * t_(DUR)) * 0.5 + np.sin(2 * np.pi * 120 * t_(DUR)) * 0.25) * 0.02
hvac = filt(noise(DUR), 'bandpass', [90, 400]) * (0.6 + 0.4 * np.sin(2 * np.pi * t_(DUR) / 9.0)) * 0.12
amb = bed * 0.12 + hum + hvac
for tt in (3.0, 12.0, 24.0, 41.0, 63.0, 71.0):  # distant traffic swells
    d = 5.0; x = filt(noise(d), 'bandpass', [120, 900]) * np.sin(np.pi * np.linspace(0, 1, int(d * SR))) ** 2 * 0.035; put(x, tt, 1, 0.0)
# quiet section during peephole
duck = np.ones(N); i0, i1 = int(30.9 * SR), int(33.4 * SR)
duck[i0:i1] = 0.25; duck = filt(duck, 'lowpass', 20, 1)
amb *= duck
L += amb; R += amb

# ---------- cues ----------
# phone buzz + chime
for t0 in (0.5, 1.1):
    d = 0.4; x = np.sign(np.sin(2 * np.pi * 160 * t_(d))) * 0.25 * env(d, 0.01, 0.05) * (0.7 + 0.3 * np.sin(2 * np.pi * 28 * t_(d)))
    put(filt(x, 'lowpass', 1500), t0, 1, 0.5)
put(tone(988, 1.1, 0.25, (1, 2)) * 0.18 + tone(1319, 1.1, 0.3) * 0.12, 0.6, 1, 0.5)
put(cloth(0.35), 1.9, 1, 0.3); put(cloth(0.3), 3.5, 0.8, 0.3)
# feed knocks (through phone speaker) then real knocks 1.5 s later
for tt in (4.9, 5.2, 5.5):
    put(filt(knock(160, 0.15), 'bandpass', [400, 3000]) * 0.6, tt, 1, 0.5)
put(cloth(0.3), 5.9, 1, 0.3)
for tt in (6.2, 6.45, 6.7):
    put(knock(85, 0.3), tt, 0.95, -0.15)
# footsteps: slow cautious walk 15 -> 27, small steps near door, step back
for tt in np.arange(15.2, 27.5, 0.95): put(step(0.55), tt, 1, rng.uniform(-0.1, 0.1))
for tt in (30.5, 31.1, 31.7): put(step(0.35), tt, 1, 0)
for tt in (34.7, 35.1, 35.5): put(step(0.4), tt, 1, 0)
put(cloth(0.35), 35.7, 1, 0.3)
# chain rattle (reach) and peephole squeak
for k, tt in enumerate((29.3, 29.42, 29.5, 29.68, 29.8)):
    d = 0.09; put(filt(noise(d), 'highpass', 3500) * expdecay(d, 0.02) * 0.5 + tone(2400 + 300 * k, d, 0.02) * 0.1, tt, 1, -0.1)
d = 0.35; sq = np.sin(2 * np.pi * np.cumsum(np.linspace(1500, 2300, int(d * SR))) / SR) * env(d, 0.03, 0.15) * 0.08; put(sq, 30.6, 1, 0)
# clock tick, accelerating, from 38 to 56
tt, iv = 38.0, 1.0
while tt < 56.0:
    d = 0.06; click = filt(noise(d), 'bandpass', [1800, 5500]) * expdecay(d, 0.008) * (0.12 + 0.35 * (tt - 38) / 18) + tone(900, d, 0.01) * 0.06
    put(click, tt, 1, 0.8); iv = max(0.5, iv - (0.0 if tt < 45 else 0.045)); tt += iv
# drone bed: slow rise from 2 s, drop out for the deadbolt, swell 75-80, cut at 80
t = t_(DUR)
dr = (np.sin(2 * np.pi * 55 * t) + 0.6 * np.sin(2 * np.pi * 82.4 * t + 0.4 * np.sin(2 * np.pi * 0.13 * t)) + 0.25 * np.sin(2 * np.pi * 110 * t)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.2 * t))
g = np.interp(t, [0, 2, 20, 45, 55.2, 55.5, 57.4, 60, 70, 75, 79.6, 79.98, 80.0, 85], [0, 0, 0.05, 0.08, 0.1, 0.0, 0.0, 0.1, 0.12, 0.18, 0.4, 0.4, 0.0, 0.0])
dr = filt(dr, 'lowpass', 400) * g
L += dr; R += dr
# deadbolt (56.0): big clunk, nothing else
put(add(np.sin(2 * np.pi * 60 * t_(0.5)) * expdecay(0.5, 0.12) * 0.9, filt(noise(0.2), 'bandpass', [1000, 6000]) * expdecay(0.2, 0.012) * 0.7), 56.0, 1, 0)
put(filt(noise(0.15), 'bandpass', [2000, 7000]) * expdecay(0.15, 0.01) * 0.5 + tone(1700, 0.15, 0.02) * 0.1, 56.18, 1, 0)
# phone alert sting (57.0)
put(tone(466, 1.4, 0.35, (1, 2)) * 0.2 + tone(349, 1.4, 0.45) * 0.16 + np.sin(2 * np.pi * 45 * t_(1.4)) * expdecay(1.4, 0.4) * 0.4, 57.0, 1, 0.5)
put(cloth(0.3), 57.9, 1, 0.3)
# door opens on the chain: hinge creak, then chain snaps taut
d = 1.7; f0 = np.linspace(110, 260, int(d * SR)) + 12 * np.sin(2 * np.pi * 9 * t_(d))
cr = np.sign(np.sin(2 * np.pi * np.cumsum(f0) / SR)) * 0.5 + filt(noise(d), 'bandpass', [600, 2500]) * 0.5
put(filt(cr, 'lowpass', 2500) * env(d, 0.15, 0.4) * 0.22, 58.6, 1, -0.1)
put(add(filt(noise(0.12), 'highpass', 2500) * expdecay(0.12, 0.02) * 0.8, knock(70, 0.25) * 0.8), 59.7, 1, -0.1)
# heartbeat in the quiet tail
for tt in (82.0, 82.28): put(np.sin(2 * np.pi * 55 * t_(0.3)) * expdecay(0.3, 0.07) * 0.7, tt, 1, 0)

# ---------- dialogue ----------
PAN = {'eli': 0.0, 'phone': 0.35, 'dry': -0.1}
for ln in json.load(open('voices/dialogue_timing.json')):
    x, sr = sf.read(f"voices/{ln['id']}.wav"); assert sr == SR
    if x.ndim > 1: x = x.mean(1)
    # duck the bed briefly under speech
    i = int(ln['start'] * SR); j = i + len(x)
    d = np.ones(N); d[max(0, i - 2400):j + 4800] = 0.55; d = filt(d, 'lowpass', 15, 1)
    L *= (1 - 0.0); R *= (1 - 0.0)
    put(x, ln['start'], 1.35, PAN[ln['speaker']])

# ---------- master ----------
m = np.stack([L, R], 1); m = np.tanh(m * 0.9) / np.tanh(0.9)
m[: int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))[:, None]
sf.write('audio/mix_raw.wav', m.astype(np.float32), SR)
print('mix', m.shape, m.shape[0] / SR, 'peak', float(np.abs(m).max()))
