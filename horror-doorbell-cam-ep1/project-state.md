# Project State — Horror_Story_001 DOORBELL CAM

- Concept 3, Episode 1 COMPLETE (pending user review). No branch chosen yet; Ep 2A = OPEN THE DOOR, Ep 2B = STAY SILENT.
- Verified output: final/doorbell_cam_ep1.mp4 — 1080x1920, 30 fps CFR, 2,550 frames (ffprobe -count_frames), video 85.000 s, audio 85.000 s AAC 48 kHz stereo, decodes cleanly, ~41 MB.
- Pipeline: project/scene.js + render.mjs (Three.js, headless Chrome SwiftShader) -> renders/frames; scripts/make_voices.py (Kokoro am_adam) + scripts/make_audio.py (procedural SFX/mix) -> audio/final_mix.wav; FFmpeg mux.
- Known limits: reference videos never available (provisional style); voices and SFX not yet auditioned by ear; hands/Double are simple blocky models; peephole view is a plain lit porch.
- NEXT ACTION: wait for the viewer's choice (A or B), then read story-bible.md and write Ep 2 beat sheet for that branch only.
