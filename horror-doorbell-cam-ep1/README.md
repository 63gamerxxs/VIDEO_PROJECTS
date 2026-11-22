# Doorbell Cam — Episode 1

Original low-poly 3D first-person horror short. 85.000 s, 1080x1920, 30 fps, 2,550 frames.
Ep 1 ends on a two-choice card: A) OPEN THE DOOR, B) STAY SILENT.

- `final/doorbell_cam_ep1_share.mp4` — compressed share copy (verified 2,550 frames, 85.000 s video and audio).
- `script.md`, `story-bible.md`, `project-state.md`, `render-manifest.json`, `reference-analysis.md` (provisional; reference videos were unavailable).
- `source/` — Three.js scene (`scene.js`), page, headless renderer (`render.mjs`), dialogue timings.
- `scripts/` — `make_voices.py` (Kokoro am_adam), `make_audio.py` (procedural SFX and mix).

Rebuild: `npm i three`, `node source/render.mjs 0 2549 frames`, then mux frames with the mix via FFmpeg.
Not included: full-quality 41 MB MP4, rendered frames, Kokoro model files, node_modules.
