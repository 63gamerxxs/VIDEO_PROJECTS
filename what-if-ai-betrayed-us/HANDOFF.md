# HANDOFF
GOAL: original ≤85s What If video "What if AI betrayed us?" (9:16)
COMPLETED (verified): script, storyboard, audio plan, research notes, render pipeline (render/tts.py, render/render.py), final mp4 80.9s
PROGRESS: v1 done; checked codec/size/duration, audio levels per section, sample frames
REMAINING: optional better VO; confirm platform; mp4 not on Drive
FILE LOCATIONS: repo 63gamerxxs/video_projects/what-if-ai-betrayed-us/ (assets/what_if_ai_betrayed_us.mp4, render/)
LAST COMMAND: python3 render.py
ERRORS: Kokoro model download blocked (502) -> used espeak-ng
NEXT STEP: ask user if voice/visuals need changes. Next Drive zip = PORTABLE_PROJECT_3.zip
RECOVERY: read project_state.md; rebuild with the REBUILD line
VERIFICATION: ffprobe 720x1280 30fps 80.9s; audio mean -18..-23 dB
