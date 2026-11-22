import * as THREE from 'three';

const W = 1080, H = 1920, FPS = 30;
const glc = document.getElementById('gl'), outc = document.getElementById('out');
const ctx = outc.getContext('2d');
const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070c);
const cam = new THREE.PerspectiveCamera(68, W / H, 0.03, 40);
scene.add(cam);
cam.layers.enable(0);

// ---------- helpers ----------
const M = (c, r = 0.85, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, flatShading: true });
function box(w, h, d, mat, x, y, z, parent = scene, shadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m;
}
function cyl(rt, rb, h, seg, mat, x, y, z, parent = scene) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function setLayer(o, l) { o.traverse(c => c.layers.set(l)); }

// ---------- room ----------
const wallM = M(0x77746d, 0.95), floorM = M(0x4b3727, 0.7), ceilM = M(0x8a8780, 1);
box(7, 0.1, 9, floorM, 0, -0.05, 0.5);
box(7, 0.1, 6.9, ceilM, 0, 2.65, 1.05);
box(0.2, 2.7, 9, wallM, -3.5, 1.3, 0.5); box(0.2, 2.7, 9, wallM, 3.5, 1.3, 0.5);
box(7, 2.7, 0.2, wallM, 0, 1.3, 4.5);
const doorWall = new THREE.Group(); scene.add(doorWall);
box(3.05, 2.7, 0.2, wallM, -1.975, 1.3, -2.5, doorWall);
box(3.05, 2.7, 0.2, wallM, 1.975, 1.3, -2.5, doorWall);
box(0.9, 0.55, 0.2, wallM, 0, 2.375, -2.5, doorWall);
const frameM = M(0x2a1f18, 0.8);
const frame = new THREE.Group(); scene.add(frame);
box(0.06, 2.1, 0.24, frameM, -0.48, 1.05, -2.5, frame); box(0.06, 2.1, 0.24, frameM, 0.48, 1.05, -2.5, frame);
box(1.02, 0.06, 0.24, frameM, 0, 2.13, -2.5, frame);
// baseboards
box(7, 0.12, 0.03, M(0x2a1f18), 0, 0.06, 4.38); box(0.03, 0.12, 9, M(0x2a1f18), -3.38, 0.06, 0.5); box(0.03, 0.12, 9, M(0x2a1f18), 3.38, 0.06, 0.5);
box(1.7, 0.12, 0.03, M(0x2a1f18), -1.4, 0.06, -2.38, doorWall); box(1.7, 0.12, 0.03, M(0x2a1f18), 1.4, 0.06, -2.38, doorWall);

// door leaf (hinge at x=+0.45, swings into room)
const hinge = new THREE.Group(); hinge.position.set(0.45, 0, -2.5); scene.add(hinge);
const leaf = new THREE.Group(); hinge.add(leaf);
box(0.9, 2.08, 0.05, M(0x4a5a63, 0.6), -0.45, 1.04, 0, leaf);
box(0.7, 0.8, 0.02, M(0x42525a, 0.6), -0.45, 1.5, 0.03, leaf); box(0.7, 0.8, 0.02, M(0x42525a, 0.6), -0.45, 0.55, 0.03, leaf);
box(0.12, 0.03, 0.07, M(0xb9a77a, 0.3, 0.8), -0.78, 1.0, 0.07, leaf); // handle
cyl(0.018, 0.018, 0.03, 12, M(0x111111, 0.3, 0.7), -0.45, 1.58, 0.03, leaf).rotation.x = Math.PI / 2; // peephole
const bolt = new THREE.Group(); bolt.position.set(-0.78, 1.15, 0.03); leaf.add(bolt);
cyl(0.03, 0.03, 0.02, 14, M(0xb9a77a, 0.3, 0.8), 0, 0, 0.01, bolt).rotation.x = Math.PI / 2;
const thumb = box(0.07, 0.016, 0.02, M(0xd8c595, 0.3, 0.8), 0, 0, 0.03, bolt);
const chainM = new THREE.MeshStandardMaterial({ color: 0xb9a77a, metalness: 0.8, roughness: 0.3 });
const chain = new THREE.Mesh(new THREE.BoxGeometry(1, 0.006, 0.006), chainM); scene.add(chain);
box(0.05, 0.03, 0.03, chainM, -0.44, 1.5, -2.4); // chain track on jamb side

// porch (visible through doorway)
const porchM = M(0x2a2e34, 0.9);
box(5, 0.1, 5, M(0x4a505a, 0.9), 0, -0.05, -5.1); box(5, 3, 0.2, M(0x56606e, 1), 0, 1.4, -7.6);
box(0.2, 3.6, 5, M(0x30343b, 1), -2.6, 1.6, -5.1); box(0.2, 3.6, 5, M(0x30343b, 1), 2.6, 1.6, -5.1);
box(5, 0.1, 5, M(0x15171b, 1), 0, 3.4, -5.1);
box(0.8, 0.03, 0.5, M(0x222018, 1), 0.0, 0.02, -2.95);  // doormat
box(0.9, 0.7, 0.5, M(0x1f3a2c, 1), 1.7, 0.35, -3.4);    // planter/bush
const porchLight = new THREE.PointLight(0x7fb0ff, 16, 12, 2); porchLight.position.set(0.8, 2.0, -3.6); scene.add(porchLight);
const porchBack = new THREE.PointLight(0x9bbcff, 9, 10, 2); porchBack.position.set(0, 1.6, -5.8); scene.add(porchBack);
const porchFill = new THREE.PointLight(0xffd9a8, 1.4, 6, 2); porchFill.position.set(-0.6, 1.3, -2.8); scene.add(porchFill);

// living room furniture
const couchM = M(0x3b4250, 0.9);
box(2.1, 0.45, 0.9, couchM, -2.0, 0.23, 2.7); box(2.1, 0.5, 0.2, couchM, -2.0, 0.65, 3.1);
box(0.2, 0.6, 0.9, couchM, -3.0, 0.3, 2.7); box(0.2, 0.6, 0.9, couchM, -1.0, 0.3, 2.7);
box(1.2, 0.04, 0.6, M(0x5b4231), -1.8, 0.42, 1.4);
[[-2.3, 1.15], [-2.3, 1.65], [-1.3, 1.15], [-1.3, 1.65]].forEach(p => box(0.05, 0.4, 0.05, M(0x30241a), p[0], 0.2, p[1]));
box(2.4, 0.01, 1.6, M(0x7c3b3b, 1), -0.6, 0.005, 1.2); // rug
// floor lamp near the door (warm key light)
cyl(0.03, 0.03, 1.3, 8, M(0x222222), -1.5, 0.65, -1.9); cyl(0.12, 0.12, 0.03, 12, M(0x222222), -1.5, 0.02, -1.9);
const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 0.34, 10, 1, true), new THREE.MeshStandardMaterial({ color: 0xffd7a0, emissive: 0xffb866, emissiveIntensity: 1.6, side: THREE.DoubleSide, flatShading: true }));
shade.position.set(-1.5, 1.45, -1.9); scene.add(shade);
const lamp = new THREE.PointLight(0xffb870, 11, 12, 2); lamp.position.set(-1.45, 1.35, -1.7); lamp.castShadow = true;
lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -0.002; scene.add(lamp);
const fill = new THREE.PointLight(0x4a5b86, 3, 14, 2); fill.position.set(1.2, 2.3, 1.5); scene.add(fill);
scene.add(new THREE.HemisphereLight(0x2a3350, 0x1a120c, 0.5));
// key table + bowl (right of door)
box(0.55, 0.04, 0.35, M(0x5b4231), 1.0, 0.85, -2.2); [[0.78, -2.07], [1.22, -2.07], [0.78, -2.33], [1.22, -2.33]].forEach(p => box(0.04, 0.83, 0.04, M(0x30241a), p[0], 0.41, p[1]));
cyl(0.13, 0.09, 0.06, 10, M(0xc9c3b8, 0.4), 1.0, 0.9, -2.2);
box(0.12, 0.012, 0.08, M(0x9b9b9b, 0.4, 0.7), 1.25, 0.88, -2.1); // spare wallet-ish item
// coat hooks (left of door)
box(0.7, 0.12, 0.03, M(0x30241a), -1.0, 1.7, -2.38);
[-1.22, -1.0, -0.78].forEach(x => box(0.03, 0.03, 0.09, M(0x111111, 0.3, 0.7), x, 1.7, -2.32));
box(0.12, 0.55, 0.05, M(0x6a3a3a, 1), -1.22, 1.38, -2.3); // scarf on the left hook; middle hook empty
box(0.28, 0.45, 0.08, M(0x4b4f58, 1), -0.78, 1.45, -2.29); // grey bag on right hook
// picture + wall clock
box(0.8, 0.55, 0.04, M(0x1a1a1a), -2.5, 1.7, -2.38); box(0.7, 0.45, 0.02, M(0x35527a), -2.5, 1.7, -2.36);
const clockTex = new THREE.CanvasTexture(Object.assign(document.createElement('canvas'), { width: 256, height: 256 }));
const clockMat = new THREE.MeshBasicMaterial({ map: clockTex, toneMapped: false });
const clockMesh = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), clockMat);
clockMesh.position.set(3.37, 1.95, -1.8); clockMesh.rotation.y = -Math.PI / 2; scene.add(clockMesh);
cyl(0.24, 0.24, 0.03, 24, M(0x15110e), 3.40, 1.95, -1.8).rotation.z = Math.PI / 2;
function drawClock(min, sec) {
  const c = clockTex.image.getContext('2d'); c.fillStyle = '#d9d2c0'; c.fillRect(0, 0, 256, 256);
  c.strokeStyle = '#15110e'; c.lineWidth = 6;
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.beginPath(); c.moveTo(128 + Math.sin(a) * 108, 128 - Math.cos(a) * 108); c.lineTo(128 + Math.sin(a) * 124, 128 - Math.cos(a) * 124); c.stroke(); }
  const ha = ((11 + min / 60) % 12) * Math.PI / 6, ma = min * Math.PI / 30, sa = sec * Math.PI / 30;
  c.lineWidth = 10; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + Math.sin(ha) * 58, 128 - Math.cos(ha) * 58); c.stroke();
  c.lineWidth = 6; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + Math.sin(ma) * 92, 128 - Math.cos(ma) * 92); c.stroke();
  c.strokeStyle = '#a02020'; c.lineWidth = 2; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + Math.sin(sa) * 100, 128 - Math.cos(sa) * 100); c.stroke();
  clockTex.needsUpdate = true;
}

// ---------- the Double (layer 2) ----------
const dbl = new THREE.Group(); dbl.position.set(-0.27, 0, -3.3); scene.add(dbl);
const olive = M(0x56603a, 0.9), skin = M(0xd8a98c, 0.8), jeans = M(0x1d2330, 0.9), dark = M(0x1a1410, 0.9);
box(0.17, 0.8, 0.2, jeans, -0.11, 0.4, 0, dbl); box(0.17, 0.8, 0.2, jeans, 0.11, 0.4, 0, dbl);
box(0.46, 0.62, 0.26, olive, 0, 1.12, 0, dbl);
box(0.46, 0.18, 0.28, M(0x4a5330, 0.9), 0, 1.38, 0, dbl);                 // collar
box(0.13, 0.55, 0.14, olive, -0.3, 1.1, 0, dbl);                          // right arm hangs
const armL = box(0.13, 0.3, 0.14, olive, 0.3, 1.2, 0.08, dbl); armL.rotation.x = -0.9; // left arm forward
box(0.06, 0.05, 0.015, M(0xd98a1f, 0.8), 0.3, 1.24, 0.17, dbl);            // sleeve patch
const hand = box(0.09, 0.09, 0.09, skin, 0.29, 1.3, 0.3, dbl);
box(0.025, 0.07, 0.01, M(0xaaaaaa, 0.3, 0.9), 0.3, 1.21, 0.33, dbl); box(0.025, 0.06, 0.01, M(0xaaaaaa, 0.3, 0.9), 0.33, 1.21, 0.33, dbl);
box(0.05, 0.07, 0.012, M(0xc02424, 0.6), 0.315, 1.14, 0.335, dbl);        // red key tag
const head = new THREE.Group(); head.position.set(0, 1.66, 0.01); dbl.add(head);
box(0.2, 0.23, 0.2, skin, 0, 0, 0, head);
box(0.28, 0.12, 0.28, olive, 0, 0.12, -0.02, head); box(0.26, 0.3, 0.1, olive, 0, -0.02, -0.12, head); // hood
box(0.05, 0.008, 0.01, dark, -0.045, 0.03, 0.101, head); box(0.05, 0.008, 0.01, dark, 0.045, 0.03, 0.101, head); // closed eyes
box(0.03, 0.05, 0.03, M(0xc99577, 0.8), 0, -0.01, 0.11, head); box(0.07, 0.008, 0.01, dark, 0, -0.07, 0.101, head);
setLayer(dbl, 2);

// feed camera (doorbell) -> render target
const feedCam = new THREE.PerspectiveCamera(95, 0.47, 0.05, 30);
feedCam.position.set(0.1, 1.35, -2.66); feedCam.lookAt(-0.12, 1.3, -4); feedCam.layers.enable(2);
const rt = new THREE.WebGLRenderTarget(376, 800);

// ---------- first-person rig: phone + hands ----------
const phone = new THREE.Group(); cam.add(phone);
box(0.075, 0.155, 0.008, M(0x15161a, 0.3, 0.4), 0, 0, 0, phone, false);
box(0.012, 0.012, 0.012, M(0xd33, 0.5), -0.03, 0.07, -0.01, phone, false); // case corner nick
const feedMat = new THREE.MeshBasicMaterial({ map: rt.texture, toneMapped: false });
const hudCanvas = Object.assign(document.createElement('canvas'), { width: 376, height: 800 });
const hudTex = new THREE.CanvasTexture(hudCanvas); hudTex.colorSpace = THREE.SRGBColorSpace;
const feedPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.069, 0.147), feedMat); feedPlane.position.z = 0.0045; phone.add(feedPlane);
const hudPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.069, 0.147), new THREE.MeshBasicMaterial({ map: hudTex, transparent: true, toneMapped: false }));
hudPlane.position.z = 0.0048; phone.add(hudPlane);
const phoneGlow = new THREE.PointLight(0x9fc4ff, 0.05, 1.5, 2); phoneGlow.position.set(0, 0.03, 0.22); phone.add(phoneGlow);
// right hand holding phone
const skinH = M(0xd8a98c, 0.7), sleeveM = M(0x4f545c, 0.95);
const handR = new THREE.Group(); phone.add(handR);
box(0.08, 0.1, 0.03, skinH, 0.0, -0.045, -0.02, handR, false);
box(0.016, 0.05, 0.016, skinH, 0.045, -0.04, 0.0, handR, false).rotation.z = 0.12;
box(0.016, 0.03, 0.016, skinH, -0.043, -0.02, 0.0, handR, false); box(0.016, 0.03, 0.016, skinH, -0.043, -0.05, 0.0, handR, false);
const thumbR = box(0.018, 0.06, 0.014, skinH, 0.03, -0.075, 0.009, handR, false); thumbR.rotation.z = 0.5;
box(0.1, 0.45, 0.1, sleeveM, 0.03, -0.3, -0.07, handR, false).rotation.x = -0.15;
// left hand for reaching
const handL = new THREE.Group(); cam.add(handL);
box(0.09, 0.025, 0.1, skinH, 0, 0, 0, handL, false);
[-0.032, -0.011, 0.011, 0.032].forEach(x => box(0.017, 0.02, 0.075, skinH, x, 0, -0.085, handL, false));
box(0.02, 0.02, 0.055, skinH, -0.058, 0, -0.03, handL, false).rotation.y = 0.5;
box(0.1, 0.1, 0.45, sleeveM, 0, 0.0, 0.3, handL, false);

// ---------- timeline ----------
// t, x, y, z, yaw, pitch, phone(0 hidden..1 raised), reach, fov
const K = [
  [0.0, 0.5, 1.6, 1.4, 0.0, 0.02, 0.8, 0, 68],
  [1.3, 0.5, 1.6, 1.4, 0.0, 0.02, 0.8, 0, 68],
  [2.0, 0.5, 1.55, 1.4, 0.1, -0.55, 0.8, 0, 68],
  [2.9, 0.5, 1.55, 1.4, 0.1, -0.55, 0.8, 0, 68],
  [3.6, 0.5, 1.6, 1.4, 0.0, 0.02, 0.1, 0, 68],
  [5.0, 0.5, 1.6, 1.4, 0.0, 0.02, 0.1, 0, 68],
  [5.9, 0.5, 1.58, 1.4, 0.0, -0.4, 1.0, 0, 68],
  [10.0, 0.5, 1.58, 1.4, 0.0, -0.4, 1.0, 0, 68],
  [10.9, 0.5, 1.6, 1.4, 0.37, 0.0, 0.25, 0, 68],
  [12.3, 0.5, 1.6, 1.4, -0.14, -0.2, 0.25, 0, 68],
  [13.8, 0.5, 1.6, 1.4, 0.0, 0.02, 0.2, 0, 68],
  [15.0, 0.5, 1.6, 1.4, 0.0, 0.02, 0.2, 0, 68],
  [22.0, 0.15, 1.6, -0.2, 0.0, 0.0, 0.1, 0, 68],
  [27.0, 0.0, 1.6, -1.5, 0.0, 0.0, 0.1, 0, 68],
  [29.4, 0.0, 1.6, -1.5, 0.0, 0.0, 0.0, 1, 68],
  [30.4, 0.0, 1.6, -1.95, 0.0, -0.02, 0.0, 0, 68],
  [31.6, 0.0, 1.55, -2.3, 0.0, -0.02, 0.0, 0, 100],
  [34.2, 0.0, 1.55, -2.3, 0.0, -0.02, 0.0, 0, 100],
  [35.4, 0.0, 1.6, -1.2, 0.0, -0.3, 0.9, 0, 68],
  [44.0, 0.0, 1.6, -1.2, 0.0, -0.4, 1.0, 0, 68],
  [46.0, 0.0, 1.6, -1.2, -1.35, 0.08, 0.1, 0, 68],
  [51.5, 0.0, 1.6, -1.2, -1.35, 0.08, 0.1, 0, 68],
  [53.0, 0.0, 1.6, -1.2, 0.0, 0.02, 0.0, 0, 68],
  [57.3, 0.0, 1.6, -1.2, 0.0, 0.02, 0.0, 0, 68],
  [58.0, 0.0, 1.6, -1.2, 0.0, -0.3, 0.7, 0, 68],
  [59.6, 0.0, 1.6, -1.2, 0.0, 0.02, 0.1, 0, 68],
  [75.0, 0.0, 1.6, -1.2, 0.05, 0.02, 0.05, 0, 66],
  [79.9, -0.1, 1.64, -1.5, 0.08, 0.07, 0.0, 0, 62],
  [85.0, -0.1, 1.64, -1.5, 0.08, 0.07, 0.0, 0, 62],
];
const ease = a => a * a * (3 - 2 * a);
function kf(t) {
  let i = 0; while (i < K.length - 2 && t >= K[i + 1][0]) i++;
  const a = K[i], b = K[i + 1], s = Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0]))), e = ease(s);
  return a.map((v, j) => v + (b[j] - v) * e);
}
const clamp01 = x => Math.min(1, Math.max(0, x));
const imp = (t, t0, A, f = 22, d = 7) => t < t0 ? 0 : A * Math.exp(-(t - t0) * d) * Math.sin((t - t0) * f);
function shake(t) { // startle impulses at knock, bolt, alert
  return imp(t, 6.5, 0.012) + imp(t, 7.4, 0.01) + imp(t, 56.0, 0.03) + imp(t, 57.0, 0.014) + imp(t, 59.0, 0.02) + imp(t, 75.5, 0.01);
}

const dlg = await (await fetch('/dialogue_timing.json')).json();
const SPK = { eli: '#ffffff', phone: '#9fd0ff', dry: '#ffd9c2' };

// ---------- overlay helpers ----------
const noise = Object.assign(document.createElement('canvas'), { width: 256, height: 256 });
{ const n = noise.getContext('2d'), id = n.createImageData(256, 256); let s = 1234567;
  for (let i = 0; i < id.data.length; i += 4) { s = (s * 1664525 + 1013904223) >>> 0; const v = (s >>> 24); id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } n.putImageData(id, 0, 0); }
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
const FONT = '"DejaVu Sans", Arial, sans-serif';
function wrap(c, text, maxW) { const w = text.split(' '), lines = []; let l = ''; for (const x of w) { const tt = l ? l + ' ' + x : x; if (c.measureText(tt).width > maxW && l) { lines.push(l); l = x; } else l = tt; } lines.push(l); return lines; }

function drawHud(t) {
  const c = hudCanvas.getContext('2d'), w = 376, h = 800; c.clearRect(0, 0, w, h);
  const feedOn = t >= 4.9;
  if (!feedOn) {
    c.fillStyle = '#05070b'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#e8eef7'; c.font = `bold 80px ${FONT}`; c.textAlign = 'center'; c.fillText('11:44', w / 2, 170);
    c.font = `22px ${FONT}`; c.fillStyle = '#9aa7ba'; c.fillText('Tuesday', w / 2, 210);
    if (t >= 0.5) { const a = clamp01((t - 0.5) / 0.3); c.globalAlpha = a; rr(c, 20, 300, w - 40, 120, 18); c.fillStyle = '#1d2330'; c.fill(); c.fillStyle = '#ff5b5b'; c.font = `bold 20px ${FONT}`; c.textAlign = 'left'; c.fillText('DOORBELL', 40, 335); c.fillStyle = '#fff'; c.font = `bold 28px ${FONT}`; c.fillText('Person at front door', 40, 380); c.globalAlpha = 1; }
    hudTex.needsUpdate = true; return;
  }
  c.fillStyle = 'rgba(10,40,50,0.28)'; c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(0, 0, w, 64); c.fillRect(0, h - 70, w, 70);
  c.textAlign = 'left'; c.fillStyle = '#fff'; c.font = `bold 26px ${FONT}`; c.fillText('FRONT DOOR', 18, 42);
  if (Math.floor(t * 1.6) % 2 === 0) { c.fillStyle = '#ff3b3b'; c.beginPath(); c.arc(w - 62, 34, 9, 0, 7); c.fill(); }
  c.fillStyle = '#ff6b6b'; c.font = `bold 20px ${FONT}`; c.textAlign = 'right'; c.fillText('LIVE', w - 18, 42);
  const fs = 2 + Math.floor(t); const sec = fs % 60;
  c.textAlign = 'left'; c.fillStyle = '#d7f3ff'; c.font = `bold 24px ${FONT}`; c.fillText(`11:47:${String(sec).padStart(2, '0')} PM`, 18, h - 26);
  c.textAlign = 'right'; c.font = `18px ${FONT}`; c.fillStyle = '#9fc4d8'; c.fillText('+3:00', w - 18, h - 26);
  c.strokeStyle = 'rgba(215,243,255,0.8)'; c.lineWidth = 3;
  [[24, 84, 1, 1], [w - 24, 84, -1, 1], [24, h - 90, 1, -1], [w - 24, h - 90, -1, -1]].forEach(([x, y, dx, dy]) => { c.beginPath(); c.moveTo(x, y + dy * 30); c.lineTo(x, y); c.lineTo(x + dx * 30, y); c.stroke(); });
  if (t >= 57.0 && t < 60.0) { rr(c, 16, 90, w - 32, 70, 14); c.fillStyle = 'rgba(180,20,20,0.9)'; c.fill(); c.fillStyle = '#fff'; c.textAlign = 'left'; c.font = `bold 22px ${FONT}`; c.fillText('MOTION: Living room', 32, 134); }
  hudTex.needsUpdate = true;
}

function drawOverlay(t, f) {
  const c = ctx; c.drawImage(glc, 0, 0, W, H);
  // peephole mask
  const peep = clamp01((t - 31.0) / 0.5) * (1 - clamp01((t - 34.0) / 0.4));
  if (peep > 0) { const g = c.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 420); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${peep})`);
    c.fillStyle = g; c.fillRect(0, 0, W, H); c.fillStyle = `rgba(0,0,0,${peep})`; c.fillRect(0, 0, W, H / 2 - 420); c.fillRect(0, H / 2 + 420, W, H / 2 - 420);
    c.fillRect(0, 0, (W - 840) / 2 + 0, H); c.fillRect(W - (W - 840) / 2, 0, (W - 840) / 2, H);
    c.strokeStyle = `rgba(185,167,122,${peep})`; c.lineWidth = 10; c.beginPath(); c.arc(W / 2, H / 2, 421, 0, 7); c.stroke(); }
  // vignette
  const v = c.createRadialGradient(W / 2, H / 2, 500, W / 2, H / 2, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
  // grain
  c.globalAlpha = 0.05; c.globalCompositeOperation = 'overlay'; const ox = (f * 53) % 256, oy = (f * 97) % 256;
  for (let x = -ox; x < W; x += 256) for (let y = -oy; y < H; y += 256) c.drawImage(noise, x, y);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  // push-notification (top) at hook
  if (t >= 0.5 && t < 4.4) { const s = ease(clamp01((t - 0.5) / 0.35)) * (1 - ease(clamp01((t - 3.9) / 0.5))); const y = -170 + 270 * s;
    rr(c, 70, y, W - 140, 150, 34); c.fillStyle = 'rgba(24,28,38,0.94)'; c.fill();
    c.fillStyle = '#ff5b5b'; c.font = `bold 30px ${FONT}`; c.textAlign = 'left'; c.fillText('DOORBELL  •  now', 108, y + 52);
    c.fillStyle = '#fff'; c.font = `bold 46px ${FONT}`; c.fillText('Person at front door', 108, y + 112); }
  // phone clock label
  // subtitles
  const line = dlg.find(d => t >= d.start - 0.05 && t <= d.end + 0.25);
  if (line && t < 80) { c.font = `bold 54px ${FONT}`; c.textAlign = 'center'; const txt = line.speaker === 'phone' ? `📱 ${line.text}` : line.text; const L = wrap(c, line.text, 900);
    const bh = L.length * 68 + 36, y0 = 1500; rr(c, 60, y0, W - 120, bh, 26); c.fillStyle = 'rgba(0,0,0,0.62)'; c.fill();
    c.fillStyle = SPK[line.speaker]; if (line.speaker === 'phone') c.font = `italic bold 54px ${FONT}`; L.forEach((s, i) => c.fillText(s, W / 2, y0 + 64 + i * 68)); }
  // hook caption
  if (t >= 4.9 && t < 9.5) { c.font = `bold 40px ${FONT}`; c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,0.92)'; c.fillText('THE FEED IS RUNNING 3 MINUTES AHEAD', W / 2, 160); c.globalAlpha = 1; }
  // choice card
  if (t >= 80) { const a = ease(clamp01((t - 80) / 0.6)); c.fillStyle = `rgba(5,7,12,${0.78 * a})`; c.fillRect(0, 0, W, H); c.globalAlpha = a;
    c.fillStyle = '#ff5b5b'; c.font = `bold 34px ${FONT}`; c.textAlign = 'center'; c.fillText('DOORBELL CAM  •  EP 1', W / 2, 400);
    c.fillStyle = '#fff'; c.font = `bold 66px ${FONT}`; c.fillText('Choose.', W / 2, 520);
    const btn = (y, label, col, sub) => { rr(c, 110, y, W - 220, 260, 40); c.fillStyle = col; c.fill(); c.fillStyle = '#fff'; c.font = `bold 78px ${FONT}`; c.fillText(label, W / 2, y + 125); c.font = `34px ${FONT}`; c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillText(sub, W / 2, y + 190); };
    btn(680, 'OPEN THE DOOR', '#b3262b', 'Tap to see what knocks'); btn(1020, 'STAY SILENT', '#2a3a5e', 'Tap to wait it out');
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.font = `30px ${FONT}`; c.fillText('Follow for Part 2', W / 2, 1470); c.globalAlpha = 1; }
}

// ---------- frame renderer ----------
const clockSecAt = t => 22 + t;
window.renderFrame = (f) => {
  const t = f / FPS;
  const k = kf(t);
  const mv = (() => { const a = kf(Math.max(0, t - 0.1)), b = kf(t + 0.1); return Math.hypot(b[1] - a[1], b[3] - a[3]) / 0.2; })();
  const walk = clamp01(mv / 0.25);
  const bob = Math.sin(t * 2 * Math.PI * 1.7) * 0.012 * walk;
  const sh = shake(t);
  cam.position.set(k[1] + Math.sin(t * 0.6) * 0.003, k[2] + bob + sh * 0.5, k[3]);
  cam.rotation.set(k[5] + Math.sin(t * 1.1) * 0.004 + sh, k[4] + Math.sin(t * 0.7) * 0.005 + Math.sin(t * 2 * Math.PI * 0.85) * 0.006 * walk, 0, 'YXZ');
  cam.fov = k[8]; cam.updateProjectionMatrix();
  if (t >= 59.0) cam.layers.enable(2); else cam.layers.disable(2);

  // door / bolt / chain
  const bp = clamp01((t - 56.0) / 0.12); thumb.rotation.z = bp * Math.PI / 2; bolt.rotation.z = 0;
  let ang = 0; if (t >= 58.6) { const s = clamp01((t - 58.6) / 1.1); ang = 1.0 * ease(s) + (s >= 1 ? 0 : 0) + 0.04 * imp(t, 59.7, 1, 30, 6) * -1; }
  hinge.rotation.y = -ang;
  const ex = 0.45 - 0.9 * Math.cos(ang), ez = -2.5 + 0.9 * Math.sin(ang);
  const A = new THREE.Vector3(-0.44, 1.5, -2.4), B = new THREE.Vector3(ex + 0.02, 1.5, ez + 0.03);
  chain.position.copy(A).add(B).multiplyScalar(0.5); chain.scale.x = A.distanceTo(B); chain.rotation.y = -Math.atan2(B.z - A.z, B.x - A.x);
  const peep = t >= 30.9 && t < 34.4;
  leaf.visible = !peep; doorWall.visible = !peep; frame.visible = !peep; chain.visible = !peep;

  // Double animation
  dbl.rotation.y = 0.18 * Math.sin(t * 0.55) * (t > 30 ? 1.6 : 1) + (t > 74 ? -0.1 : 0);
  head.rotation.y = 0.12 * Math.sin(t * 0.8); head.rotation.x = 0.03 * Math.sin(t * 0.4);
  hand.position.y = 1.3 + Math.sin(t * 6) * 0.004;

  // phone / hands
  const ph = k[6]; const buz = (t >= 0.5 && t < 0.9) || (t >= 1.1 && t < 1.5) ? Math.sin(t * 90) * 0.003 : 0;
  phone.visible = ph > 0.02 && !peep;
  phone.position.set(0.02 + buz, -0.55 + 0.48 * ph, -0.36 + 0.09 * ph);
  phone.rotation.set(-0.75 + 0.55 * ph, 0.0, 0.0);
  thumbR.rotation.z = 0.5 + Math.sin(t * 3) * 0.05;
  handL.visible = k[7] > 0.03 && !peep;
  handL.position.set(-0.1 + 0.05 * k[7], -0.5 + 0.38 * k[7], -0.45 + 0.05 * k[7]);
  handL.rotation.set(0.35 * (1 - k[7]), 0.15, 0);

  drawClock(44 + 3 * ease(clamp01((t - 40) / 16)), clockSecAt(t) % 60);
  drawHud(t);

  // pass 1: feed camera -> RT
  const feedOn = t >= 4.9;
  if (feedOn || t > 4) {
    const pv = phone.visible, hv = handL.visible; phone.visible = false; handL.visible = false;
    renderer.setRenderTarget(rt); renderer.render(scene, feedCam); renderer.setRenderTarget(null); phone.visible = pv; handL.visible = hv;
  }
  feedPlane.visible = feedOn;
  renderer.render(scene, cam);
  drawOverlay(t, f);
  return outc.toDataURL('image/jpeg', 0.93);
};
window.ready = true;
