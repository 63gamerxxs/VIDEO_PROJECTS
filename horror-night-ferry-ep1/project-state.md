# Project State — Horror_Story_002 NIGHT FERRY (Ep 1)
- Concept 1 picked 2026-11-24. Cliffhanger labels: STAY ON DECK (mute icon) / GO BELOW (door icon). Part 2 waits for the viewer's choice.
- Built: story-bible.md, project/script.json (26 voiced lines, 34 subtitle chunks), project/episode.js (4 locations, entity, phone act), audio/cues.json, audio/final_mix.wav (-14 LUFS, 85.000 s, no silent gaps), 21 procedural SFX.
- Voices: ElevenLabs connector works, but its audio cannot be downloaded into the workspace (shell proxy blocks the host). Voices are LOCAL Kokoro (af_nicole hero, am_michael deckhand, af_sky PA, bm_george captain, am_adam entity) via tools/tts_kokoro.py. Not ElevenLabs. Not auditioned by ear.
- Render: 720x1280 (scale .6667) -> upscale to 1080x1920 in assemble.sh. Contact sheet checked at 21 frames before the full render.
- Known limits: hum dips are shown by light sag only (no audio dip); hits at 76.0 and 79.6 are 3.6 s apart; handle is the placeholder @yourhandle.
- DONE 2026-11-25: final/night_ferry_ep1.mp4 — 1080x1920, 30 fps, 2550 frames, 85.000 s video + audio, -15.0 LUFS, peak -0.6 dBFS, 0 silent gaps, verify.sh QC PASS. Rendered at 720x1280 and upscaled. 69 MB (re-encoded crf 31 for sharing).
- Not on Drive: MP4 exceeds the 4.2 MB per-call upload limit. Source files are on Drive; MP4 lives in the workspace only.
- NEXT ACTION: wait for the viewer's choice (A stay on deck / B go below), then write the Ep 2 beat sheet for that branch only.
