#!/usr/bin/env python3
"""Local voice fallback (kokoro-onnx). usage: tts_kokoro.py script.json outdir  -> one 48k mono 16-bit WAV per line + cues.json fragment.
Each line is re-rendered faster (speed<=1.35) if it would overrun its [t0,t1] window."""
import json, sys, os, wave, numpy as np
from kokoro_onnx import Kokoro
from math import gcd
from scipy.signal import resample_poly
V = {'hero': ('af_nicole', 1.0), 'npc': ('am_michael', 1.05), 'pa': ('af_sky', 0.95), 'friend': ('bm_george', 0.95), 'threat': ('am_adam', 0.8)}
k = Kokoro('/home/claude/tts_models/kokoro-v1.0.onnx', '/home/claude/tts_models/voices-v1.0.bin')
S = json.load(open(sys.argv[1])); out = sys.argv[2]; os.makedirs(out, exist_ok=True); rows = []
for l in S['lines']:
    v, sp = V[l['who']]; win = l['t1'] - l['t0']
    while True:
        x, sr = k.create(l['text'], voice=v, speed=sp, lang='en-us'); d = len(x) / sr
        if d <= win + 0.05 or sp >= 1.35: break
        sp = min(1.35, sp * d / win * 1.02)
    g = gcd(48000, sr); y = resample_poly(x, 48000 // g, sr // g); y = y / (np.max(np.abs(y)) + 1e-9) * 0.8
    p = f"{out}/{l['id']}.wav"
    with wave.open(p, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(48000); w.writeframes((y * 32767).astype('<i2').tobytes())
    rows.append({'file': p, 't': l['t0'], 'gain_db': 0, 'pan': 0, 'fx': l['fx'], 'who': l['who'], 'dur': round(len(y) / 48000, 2), 'speed': round(sp, 2)})
    print(l['id'], l['who'], f"{len(y)/48000:.2f}s/{win:.2f}s speed {sp:.2f}")
json.dump(rows, open(f'{out}/dialogue_cues.json', 'w'), indent=1)
