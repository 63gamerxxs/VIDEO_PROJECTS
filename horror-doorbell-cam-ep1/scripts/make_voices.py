import json, subprocess, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro("voices/kokoro-v1.0.onnx", "voices/voices-v1.0.bin")
# id, start_s, speaker, text, speed
L = [("d1",6.5,"phone","Eli. It's me. Open up.",0.95),
     ("e1",11.0,"eli","I'm... home.",0.85),
     ("d2",14.5,"phone","I forgot my keys.",0.95),
     ("e2",17.0,"eli","Those are my keys.",0.85),
     ("e3",40.0,"eli","Three minutes ahead.",0.85),
     ("d3",61.0,"dry","You left them in the car. Again.",0.92),
     ("e4",67.0,"eli","How do you know that?",0.85),
     ("d4",70.0,"dry","I'm the one who knocks. You're the one who opens.",0.92),
     ("d5",76.0,"dry","Choose. I already know.",0.88)]
F = {"eli":"highpass=f=70,lowpass=f=6500,volume=0.7",
     "phone":"highpass=f=350,lowpass=f=3400,acompressor,volume=0.9",
     "dry":"highpass=f=60,equalizer=f=130:t=q:w=1:g=2"}
meta=[]
for i,t,s,txt,sp in L:
    a,sr = k.create(txt, voice="am_adam", speed=sp, lang="en-us")
    raw=f"voices/{i}_raw.wav"; out=f"voices/{i}.wav"
    sf.write(raw,a,sr)
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i",raw,"-af",F[s]+",loudnorm=I=-16:TP=-1.5","-ar","48000",out],check=True)
    d=sf.info(out).duration; meta.append({"id":i,"start":t,"end":round(t+d,2),"speaker":s,"text":txt}); print(i,t,round(d,2))
json.dump(meta,open("voices/dialogue_timing.json","w"),indent=1)
