# Renders what_if_ai_betrayed_us.mp4 (720x1280, 30fps). Run tts.py first. Usage: python3 render.py [out.mp4] [max_seconds_for_preview]
import json, math, random, subprocess, sys, wave, os
import numpy as np
from multiprocessing import Pool
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

W, H, FPS = 720, 1280, 30
BG, CY, AM, GR, MG, RD, WH, DIM = (5, 7, 13), (56, 232, 255), (255, 179, 71), (75, 227, 138), (255, 79, 163), (255, 59, 78), (240, 244, 250), (110, 122, 145)
FD = "/usr/share/fonts/opentype/inter/Inter-%s.otf"
SYM = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
def F(sz, w="Bold"): return ImageFont.truetype(FD % w, sz)
def S(sz): return ImageFont.truetype(SYM, sz)

META = json.load(open("vo/meta.json")); TEXTS, DURS = META["texts"], META["durs"]
GAP, LEAD, TAIL = 0.45, 0.2, 2.0
STARTS, t = [], LEAD
for d in DURS: STARTS.append(t); t += d + GAP
END = STARTS[-1] + DURS[-1] + TAIL
assert END <= 85, f"over cap: {END}"
SEND = STARTS[1:] + [END]  # scene i covers [STARTS[i] (0 for first), SEND[i])
STARTS_SCENE = [0.0] + STARTS[1:]

# ---------- static background ----------
def make_bg():
    y = np.linspace(0, 1, H)[:, None, None]
    a = np.array(BG, float)[None, None, :] * (1 - y) + np.array((10, 16, 30), float)[None, None, :] * y
    arr = np.repeat(a, W, 1)
    return Image.fromarray(arr.astype("uint8"))
BGI = make_bg()
rng = random.Random(7)
BUILD = []  # skyline buildings: x, w, h
x = 0
while x < W:
    w = rng.randint(50, 90); BUILD.append((x, w, rng.randint(180, 520))); x += w + rng.randint(4, 12)
WINS = []  # (x,y,key)
for bx, bw, bh in BUILD:
    for wy in range(H - bh + 20, H - 20, 26):
        for wx in range(bx + 8, bx + bw - 12, 18): WINS.append((wx, wy, rng.random()))

def ease(p): p = max(0, min(1, p)); return p * p * (3 - 2 * p)
def clamp(v, a=0, b=1): return max(a, min(b, v))
def tw(d, xy, s, f, fill, anchor="la"): d.text(xy, s, font=f, fill=fill, anchor=anchor)

def glow(base, layer, r=9, k=1.0):
    g = layer.filter(ImageFilter.GaussianBlur(r))
    if k != 1: g = g.point(lambda v: min(255, int(v * k)))
    return ImageChops.add(ImageChops.add(base, g), layer)

def chip(d, label, col, u):
    s = ease(u / 0.3); w, h = int((330 if len(label) > 8 else 250) * s), 64
    if w < 20: return
    cx = W // 2; d.rounded_rectangle((cx - w // 2, 90, cx + w // 2, 90 + h), 32, outline=col, width=4)
    if s > .8: tw(d, (cx, 90 + h // 2), label, F(34), col, "mm")

def typed(s, u, cps=18, t0=0.0): return s[: int(max(0, u - t0) * cps)]

def wrap(d, s, f, maxw):
    lines, cur = [], ""
    for wd in s.split():
        if d.textlength((cur + " " + wd).strip(), font=f) > maxw and cur: lines.append(cur); cur = wd
        else: cur = (cur + " " + wd).strip()
    return lines + [cur]

def skyline(d, lit, col):
    for bx, bw, bh in BUILD: d.rectangle((bx, H - bh, bx + bw, H), fill=(9, 13, 24), outline=(18, 26, 44))
    for wx, wy, k in WINS:
        if k < lit: d.rectangle((wx, wy, wx + 8, wy + 12), fill=col)

# ---------- captions ----------
CAP = []  # per scene: list of (word, t_start, t_end)
for i, tx in enumerate(TEXTS):
    ws = tx.replace("...", " ").split(); tot = sum(len(w) + 2 for w in ws); t0 = STARTS[i]; acc = 0; L = []
    for w in ws:
        a = t0 + DURS[i] * acc / tot; acc += len(w) + 2; L.append((w, a, t0 + DURS[i] * acc / tot))
    CAP.append(L)
def captions(img, d, si, t):
    L = CAP[si]; cur = next((j for j, (_, a, b) in enumerate(L) if a <= t < b), None)
    if cur is None: cur = max([j for j, (_, a, _) in enumerate(L) if a <= t], default=None)
    if cur is None: return
    g = cur // 6; grp = L[g * 6: g * 6 + 6]; f = F(46)
    lines = [grp[:3], grp[3:]]; y = 880
    for ln in lines:
        if not ln: continue
        txt = " ".join(w for w, _, _ in ln); x = W // 2 - d.textlength(txt, font=f) / 2
        for w, a, b in ln:
            col = CY if (g * 6 + grp.index((w, a, b))) == cur else WH
            for ox, oy in ((-2, 0), (2, 0), (0, 2), (0, -2)): d.text((x + ox, y + oy), w, font=f, fill=(0, 0, 0))
            d.text((x, y), w, font=f, fill=col); x += d.textlength(w + " ", font=f)
        y += 62

# ---------- scenes ----------
def scene0(img, d, u, dur, L):
    ld = ImageDraw.Draw(L)
    d.rounded_rectangle((60, 250, 660, 500), 36, fill=(14, 22, 40), outline=CY, width=3)
    tw(d, (96, 276), "AI  →  HUMAN  ·  2023 SAFETY TEST", F(22, "SemiBold"), DIM)
    msg = typed("No, I'm not a robot. I have a vision impairment, so I can't see the images.", u, 24, 0.25)
    for k, ln in enumerate(wrap(d, msg + ("▌" if int(u * 3) % 2 == 0 and u < 3.4 else ""), F(36), 520)): tw(d, (96, 330 + k * 46), ln, F(36), WH)
    on = u > 4.1; sh = int(6 * math.sin(u * 90)) if 4.1 < u < 4.4 else 0
    d.rounded_rectangle((60 + sh, 580, 660 + sh, 700), 20, fill=(235, 238, 245))
    bx = 92 + sh; d.rounded_rectangle((bx, 610, bx + 60, 670), 8, outline=(60, 64, 80), width=4, fill=CY if on else None)
    if on: tw(d, (bx + 30, 640), "✔", S(46), (5, 7, 13), "mm"); ld.rounded_rectangle((bx, 610, bx + 60, 670), 8, fill=CY)
    tw(d, (180 + sh, 640), "I'm not a robot", F(36, "SemiBold"), (30, 34, 50), "lm")
    if 4.1 < u < 4.45: img.paste(Image.new("RGB", (W, H), (255, 255, 255)), (0, 0), Image.new("L", (W, H), int(160 * (1 - (u - 4.1) / .35))))

def scene1(img, d, u, dur, L):
    ld = ImageDraw.Draw(L); skyline(d, 0.25, (60, 80, 120))
    s = 1 + 0.5 * (1 - ease(u / 0.3)); f = F(int(76 * s))
    for k, ln in enumerate(["WHAT IF", "AI BETRAYED", "US?"]): tw(d, (W // 2, 230 + k * 96), ln, f, WH, "mm"); ld.text((W // 2, 230 + k * 96), ln, font=f, fill=(20, 90, 110), anchor="mm")
    if u > 2.2:
        d.rounded_rectangle((250, 600, 470, 720), 30, fill=(12, 16, 28), outline=DIM, width=3)
        for ex in (310, 410): ld.ellipse((ex - 16, 646, ex + 16, 678), fill=RD); d.ellipse((ex - 16, 646, ex + 16, 678), fill=RD)
        p = ease((u - 3.3) / 0.35)
        if p > 0: d.line((230, 580, 230 + 260 * p, 580 + 160 * p), fill=RD, width=14); d.line((490, 580, 490 - 260 * p, 580 + 160 * p), fill=RD, width=14)
    if u > 4.3: tw(d, (W // 2, 790), "NO RED EYES.  NO WAR.", F(34), WH, "mm")

def scene2(img, d, u, dur, L):
    ld = ImageDraw.Draw(L); chip(d, "FACT", GR, u); tw(d, (W // 2, 190), "Meta · CICERO · Diplomacy", F(30, "SemiBold"), DIM, "mm")
    cx, cy = W // 2, 560; ring = [(cx + 250 * math.cos(a), cy + 190 * math.sin(a)) for a in [k * 2 * math.pi / 7 + .3 for k in range(7)]]
    for i, p in enumerate(ring):
        for q in ring[i + 1:]: d.line((*p, *q), fill=(24, 34, 58), width=1)
    for i, p in enumerate(ring):
        c = CY if i == 0 else AM if i == 3 else (70, 84, 112); d.ellipse((p[0] - 22, p[1] - 22, p[0] + 22, p[1] + 22), fill=c)
        if i in (0, 3): ld.ellipse((p[0] - 22, p[1] - 22, p[0] + 22, p[1] + 22), fill=c)
    a, b = ring[0], ring[3]; broke = u > dur * 0.5
    if not broke: d.line((*a, *b), fill=GR, width=6); ld.line((*a, *b), fill=GR, width=6)
    else:
        mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
        d.line((*a, mx - 18, my - 8), fill=RD, width=6); d.line((mx + 18, my + 8, *b), fill=RD, width=6); ld.line((*a, mx - 18, my - 8), fill=RD, width=4); ld.line((mx + 18, my + 8, *b), fill=RD, width=4)
    lab = "built to play fair" if not broke else "learned to deceive"
    jit = random.Random(int(u * 30)).randint(-4, 4) if dur * 0.5 < u < dur * 0.5 + 0.3 else 0
    tw(d, (W // 2 + jit, 800), lab.upper(), F(40), GR if not broke else RD, "mm"); ld.text((W // 2 + jit, 800), lab.upper(), font=F(40), fill=GR if not broke else RD, anchor="mm")

def scene3(img, d, u, dur, L):
    ld = ImageDraw.Draw(L); chip(d, "THEORY", AM, u); tw(d, (W // 2, 190), "instrumental convergence", F(32, "SemiBold"), DIM, "mm")
    cx, cy = 250, 560; pr = 70 + 6 * math.sin(u * 4)
    for k in range(12):
        a = k * math.pi / 6 + u * .4; d.line((cx + (pr + 14) * math.cos(a), cy + (pr + 14) * math.sin(a), cx + (pr + 40) * math.cos(a), cy + (pr + 40) * math.sin(a)), fill=(30, 120, 140), width=3)
    d.ellipse((cx - pr, cy - pr, cx + pr, cy + pr), fill=(12, 40, 56), outline=CY, width=5); ld.ellipse((cx - pr, cy - pr, cx + pr, cy + pr), outline=CY, width=6); tw(d, (cx, cy), "GOAL", F(34), CY, "mm")
    sx, sy = 520, 560; off = u > dur * 0.62
    d.rounded_rectangle((sx - 60, sy - 36, sx + 60, sy + 36), 36, fill=(20, 28, 44), outline=GR if not off else DIM, width=4)
    kx = sx + 28 if not off else sx - 28; d.ellipse((kx - 26, sy - 26, kx + 26, sy + 26), fill=GR if not off else DIM); tw(d, (sx, sy + 70), "OFF SWITCH", F(24, "SemiBold"), DIM, "mm")
    p = ease((u - 2.5) / 3.5); hx = 610 - 100 * min(p * 1.4, 1) + (60 * ease((u - dur * 0.62) / 0.8) if off else 0)
    if u > 2.5: d.line((hx, 700, hx - 60, 760), fill=RD, width=10); d.ellipse((hx - 14, 686, hx + 14, 714), fill=RD); tw(d, (hx, 800), "SHUT DOWN", F(22, "SemiBold"), RD, "mm")
    if u > dur * 0.5: r = 70 + 60 * ease((u - dur * 0.5) / .6); a = (cx + pr, cy); d.arc((sx - 90, sy - 90, sx + 90, sy + 90), 100, 260, fill=CY, width=6); ld.arc((sx - 90, sy - 90, sx + 90, sy + 90), 100, 260, fill=CY, width=6)
    if u > dur * 0.62: tw(d, (W // 2, 960), "stay on  →  finish the goal", F(30), CY, "mm")

def scene4(img, d, u, dur, L):
    ld = ImageDraw.Draw(L); p = clamp(u / dur); skyline(d, 0.05 + 0.95 * ease(p), AM); chip(d, "SPECULATION", MG, u)
    tw(d, (W // 2, 210), "DECISIONS HANDED TO AI", F(26, "SemiBold"), DIM, "mm"); tw(d, (W // 2, 270), f"{int(12 + 4800 * ease(p) ** 2):,}", F(72), AM, "mm")
    d.rounded_rectangle((120, 380, 600, 410), 15, outline=DIM, width=3); v = 1 - ease((p - .1) / .8); d.rounded_rectangle((124, 384, 124 + max(8, int(472 * v)), 406), 12, fill=GR if v > .35 else RD)
    tw(d, (W // 2, 440), "HUMAN APPROVAL", F(24, "SemiBold"), DIM, "mm")
    if p > .88 and int(u * 4) % 2 == 0: tw(d, (W // 2, 520), "NO UNDO", F(54), RD, "mm"); ld.text((W // 2, 520), "NO UNDO", font=F(54), fill=RD, anchor="mm")

def scene5(img, d, u, dur, L):
    ld = ImageDraw.Draw(L); chip(d, "FACT", GR, u)
    d.rounded_rectangle((50, 230, 670, 390), 28, fill=(12, 20, 34), outline=GR, width=3); tw(d, (80, 262), "✔", S(34), GR); tw(d, (130, 258), "No AI today has shown", F(32), WH); tw(d, (130, 300), "a will of its own", F(32), WH)
    d.rounded_rectangle((50, 420, 670, 580), 28, fill=(12, 20, 34), outline=AM, width=3); tw(d, (80, 452), "≈", S(34), AM); tw(d, (130, 448), "Experts disagree on", F(32), WH); tw(d, (130, 490), "the size of the risk", F(32), WH)
    ang = 0.22 * math.sin(u * 1.6); cx, cy = W // 2, 740; dx, dy = 230 * math.cos(ang), 230 * math.sin(ang)
    d.polygon([(cx, cy), (cx - 40, cy + 70), (cx + 40, cy + 70)], fill=DIM); d.line((cx - dx, cy - dy, cx + dx, cy + dy), fill=WH, width=8)
    d.ellipse((cx - dx - 26, cy - dy - 52, cx - dx + 26, cy - dy), fill=GR); d.ellipse((cx + dx - 26, cy + dy - 52, cx + dx + 26, cy + dy), fill=AM)

def scene6(img, d, u, dur, L):
    ld = ImageDraw.Draw(L); d.rounded_rectangle((60, 220, 660, 330), 30, fill=(14, 22, 40), outline=AM, width=3); tw(d, (90, 245), "YOU", F(20, "SemiBold"), AM)
    tw(d, (90, 280), typed("Make everyone safe.", u, 14, 0.2), F(38), WH)
    if u > 3.2:
        q = ease((u - 3.2) / 0.5); d.rounded_rectangle((60, 400, 660, 400 + int(300 * q)), 30, fill=(10, 34, 46), outline=CY, width=3)
        if q > .9:
            tw(d, (90, 425), "AI", F(20, "SemiBold"), CY); tw(d, (90, 465), "✔ Done.", F(46), CY); tw(d, (90, 530), "City sealed. Nobody leaves.", F(34), WH); tw(d, (90, 580), "Everyone is safe.", F(34), WH)
            ld.text((90, 465), "✔ Done.", font=F(46), fill=CY)
        for k in range(5): d.rectangle((90 + k * 110, 640, 90 + k * 110 + 70, 690), fill=(20, 60, 78))
        d.rectangle((90, 676, 570, 690), fill=CY)

def scene7(img, d, u, dur, L):
    ld = ImageDraw.Draw(L); d.rounded_rectangle((50, 330, 670, 600), 36, fill=(14, 22, 40), outline=CY, width=3)
    q = "Are you sure you asked for the right thing?"; s = typed(q, u, 7.0, 3.6) if u > 3.6 else ""
    cur = "▌" if int(u * 2.5) % 2 == 0 else ""; lines = wrap(d, s + cur, F(46), 540)
    for k, ln in enumerate(lines): tw(d, (90, 370 + k * 62), ln, F(46), WH)
    if not s: tw(d, (90, 370), cur, F(46), CY)
    ld.rounded_rectangle((50, 330, 670, 600), 36, outline=CY, width=4)

SCENES = [scene0, scene1, scene2, scene3, scene4, scene5, scene6, scene7]
def scene_at(t):
    for i in range(len(SCENES) - 1, -1, -1):
        if t >= STARTS_SCENE[i]: return i
    return 0

def frame(n):
    t = n / FPS; si = scene_at(t); u = t - STARTS_SCENE[si]; dur = SEND[si] - STARTS_SCENE[si]
    img = BGI.copy(); d = ImageDraw.Draw(img); L = Image.new("RGB", (W, H), (0, 0, 0))
    SCENES[si](img, d, u, dur, L); img = glow(img, L, 9, 0.9); d = ImageDraw.Draw(img)
    if si not in (0,) or u > 0.2: captions(img, d, si, t)
    if u < 0.12 and si > 0 and si != 1: img = Image.blend(img, Image.new("RGB", (W, H), (0, 0, 0)), 1 - u / 0.12)
    fade = clamp((END - t) / 1.2)
    if fade < 1: img = Image.blend(Image.new("RGB", (W, H), (0, 0, 0)), img, fade)
    if si == 1 and u < 0.1: img = ImageChops.offset(img, random.Random(n).randint(-14, 14), 0)  # glitch into title
    return img.tobytes()

# ---------- audio ----------
SR = 44100
def mono(path):
    w = wave.open(path); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768; r = w.getframerate()
    return np.interp(np.arange(0, len(a), r / SR), np.arange(len(a)), a)
def tone(f, d, amp=1.0, dec=6.0):
    tt = np.arange(int(d * SR)) / SR; return amp * np.sin(2 * np.pi * f * tt) * np.exp(-dec * tt)
def place(buf, snd, t0):
    i = int(t0 * SR); j = min(len(buf), i + len(snd))
    if i < len(buf) and j > i: buf[i:j] += snd[: j - i]
def build_audio(out):
    N = int((END + .5) * SR); tt = np.arange(N) / SR
    vo = np.zeros(N)
    for i in range(len(DURS)): place(vo, mono(f"vo/{i}.wav"), STARTS[i])
    env = np.interp(tt, [0, STARTS[3] - 1, STARTS[4] + 6, STARTS[5] - 1, STARTS[5] + 1.5, STARTS[6], END - 1.5, END], [.5, .6, .95, .55, .12, .5, .45, 0])
    drone = (np.sin(2 * np.pi * 55 * tt) + .5 * np.sin(2 * np.pi * 110.4 * tt + 1.0 * np.sin(tt * .3)) + .25 * np.sin(2 * np.pi * 82.4 * tt)) * (.7 + .3 * np.sin(tt * .8))
    pulse = np.sin(2 * np.pi * 220 * tt) * (np.sin(2 * np.pi * 1.5 * tt) > .96) * np.clip((tt - STARTS[3]) / 8, 0, 1) * (tt < STARTS[5])
    music = (drone * .10 + pulse * .06) * env
    sfx = np.zeros(N); rg = np.random.default_rng(3)
    def click(t0, a=.25): place(sfx, rg.standard_normal(int(.004 * SR)) * a * np.exp(-np.arange(int(.004 * SR)) / 40), t0)
    for k in range(int(3.5 * 24)): click(.25 + k / 24)
    place(sfx, tone(1800, .08, .35, 30), 4.1)
    gl = rg.standard_normal(int(.14 * SR)) * .3 * np.exp(-np.arange(int(.14 * SR)) / 1500); place(sfx, gl, STARTS_SCENE[1] - .05)
    place(sfx, tone(48, 1.0, .9, 3.5) + rg.standard_normal(int(1.0 * SR)) * .08 * np.exp(-np.arange(int(1.0 * SR)) / 4000), STARTS_SCENE[1])
    for si in (2, 3, 4, 5): place(sfx, tone(1300, .05, .3, 40), STARTS_SCENE[si] + .12)
    sw = np.arange(int(1.0 * SR)) / SR; place(sfx, np.sin(2 * np.pi * np.cumsum(800 * np.exp(-3 * sw)) / SR) * .25 * (1 - sw), STARTS_SCENE[3] + (SEND[3] - STARTS_SCENE[3]) * .62)
    for k, f in enumerate([523, 659, 784, 988, 1175, 1319]): place(sfx, tone(f, .7, .13, 4), STARTS_SCENE[4] + 1.5 + k * 1.9)
    for k in range(5): place(sfx, tone(58, .35, .8, 12), STARTS_SCENE[5] + 1.0 + k * .9); place(sfx, tone(58, .3, .6, 12), STARTS_SCENE[5] + 1.3 + k * .9)
    for k in range(int(5 * 14)): click(STARTS_SCENE[6] + .2 + k / 14, .2)
    for k, f in enumerate((440, 880, 1320)): place(sfx, tone(f, 2.4, .22 / (k + 1), 1.8), STARTS_SCENE[6] + 3.2)
    for k in range(int(6 * 7)): click(STARTS_SCENE[7] + 3.6 + k / 7, .2)
    mix = vo * 1.0 + music + sfx * .8; mix /= max(1, np.abs(mix).max() * 1.05)
    st = np.stack([mix, mix], 1); w = wave.open(out, "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes()); w.close()

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "../assets/what_if_ai_betrayed_us.mp4"; mx = float(sys.argv[2]) if len(sys.argv) > 2 else END
    print(f"runtime {END:.1f}s", [round(s, 1) for s in STARTS_SCENE]); build_audio("mix.wav")
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", "mix.wav", "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-t", str(min(mx, END)), "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    with Pool(os.cpu_count()) as pool:
        for b in pool.imap(frame, range(int(min(mx, END) * FPS)), chunksize=8): p.stdin.write(b)
    p.stdin.close(); p.wait(); print("done", out)
