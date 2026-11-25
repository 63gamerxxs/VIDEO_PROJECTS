// NIGHT FERRY ep1 — 4 locations along one first-person path: dock -> upper deck -> engine corridor -> lower cabin.
// Scenes sit 40 m apart; jumps happen only under fade-to-black beats. Subtitles/lines come from project/script.json.
import * as THREE from 'three';
import { setMood, trackSpot, exitSign, redPractical, dust, slatLight } from '/engine/lib/atmosphere.js';
import { wall, door, crate, floor, ceiling } from '/engine/lib/kit.js';
import { box, block, glow, cyl } from '/engine/lib/materials.js';
import { buildCharacter, buildEntity } from '/engine/lib/character.js';
import { makeWater } from '/engine/lib/water.js';
import { PAL } from '/engine/lib/style.js';
import { track, clamp, noise1 } from '/engine/lib/tl.js';

const S = await (await fetch('/project/script.json')).json();
const ramp = (t, a, b, c, d) => clamp(Math.min((t - a) / (b - a), (d - t) / (d - c))); // trapezoid 0..1..0

function textSign(scene, text, [x, y, z], rotY, w, h, { fg = '#f4ecd8', bg = '#1d2a2e', size = 120 } = {}) {
  const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w); const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); g.strokeStyle = fg; g.lineWidth = 8; g.strokeRect(8, 8, c.width - 16, c.height - 16);
  g.fillStyle = fg; g.font = `${size}px "Bebas Neue"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, c.width / 2, c.height / 2 + 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: '#ffffff', emissiveIntensity: 0.55, roughness: 0.6 }));
  m.position.set(x, y, z); m.rotation.y = rotY; scene.add(m); return m;
}
const seat = (scene, x, z) => { const b = box(0.7, 0.45, 0.7, block('#2a3b4f')); b.position.set(x, 0.225, z); const k = box(0.7, 0.8, 0.14, block('#2a3b4f')); k.position.set(x, 0.85, z + 0.3); scene.add(b, k); };

export default {
  async build({ scene }) {
    setMood(scene, { fog: '#04090c', density: 0.042, ambient: 0.32 });
    const spots = []; // lights that sag during "hum dips"
    const keep = (l, base) => { spots.push([l, base]); return l; };

    // ---------- 1+2: pier + ferry deck (origin) ----------
    const water = makeWater(scene, { size: 160, y: -1.1, color: '#08242a' });
    wall(scene, [0, -1, -5], [6, 1, 20], '#5b4a3a');                         // dock
    wall(scene, [6.95, -1.4, -14.5], [5.1, 1.4, 24.5], '#6d7778');          // ferry deck (top y=0)
    wall(scene, [6.95, -1.4, -2.2], [5.1, 1.4, 0.2], '#d8dcd8');
    wall(scene, [9.7, 0, -14.5], [0.4, 3.2, 24.5], '#d8dcd8');              // cabin block on the right
    for (let z = -4; z > -26; z -= 2.2) { const w = box(0.06, 0.7, 1.0, glow('#ffd9a3', 0.9)); w.position.set(9.47, 1.7, z); w.castShadow = false; scene.add(w); }
    wall(scene, [6.95, 0, -27.0], [5.1, 3.2, 0.4], '#8aa09a');             // far wall of the deck
    for (let z = -3; z > -26; z -= 1.8) { const p = box(0.05, 1.0, 0.05, block('#c9d0cc')); p.position.set(4.42, 0.5, z); scene.add(p); } // rail posts
    const rail = box(0.05, 0.05, 23, block('#c9d0cc')); rail.position.set(4.42, 1.0, -14.5); scene.add(rail);
    crate(scene, [8.6, 0, -10]); crate(scene, [8.4, 0, -17.5]); crate(scene, [8.55, 0.6, -17.5], 0.5);
    for (const [x, z] of [[2.5, 3], [2.5, -9]]) { const b = cyl(0.14, 0.18, 0.7, block('#2f3a3d')); b.position.set(x, 0.35, z); scene.add(b); }
    textSign(scene, 'PIER 9', [-2.7, 1.9, -3.2], Math.PI / 2, 1.6, 0.6, { size: 150 });
    textSign(scene, 'MV CALLOWAY', [9.45, 2.6, -9], -Math.PI / 2, 3.2, 0.7, { fg: '#ffb347', size: 130 });
    textSign(scene, 'LAST FERRY', [-2.7, 1.2, -9], Math.PI / 2, 1.6, 0.5, { fg: '#ff4d2e', size: 120 });
    keep(trackSpot(scene, [0.4, 4.6, -3.6], [0.8, 0, -3.6], { color: '#cfd9ff', intensity: 80, angle: 0.7 }), 80);
    keep(trackSpot(scene, [6.4, 3.4, -8], [6.4, 0, -10], { color: '#ffd9a3', intensity: 70, angle: 0.65 }), 70);
    keep(trackSpot(scene, [6.4, 3.4, -19], [6.4, 0, -21], { color: '#cfe9ff', intensity: 60, angle: 0.7, shadow: false }), 60);
    keep(trackSpot(scene, [6.2, 3.4, -25], [6.2, 0.5, -27], { color: '#bfe3d6', intensity: 90, angle: 0.8, shadow: false, cone: false }), 90);
    exitSign(scene, [6.95, 2.55, -26.7]);
    const gl = new THREE.PointLight('#ffd9a3', 7, 7, 2); gl.position.set(3.6, 2.4, -3.2); scene.add(gl); const gl2 = new THREE.PointLight('#cfe3ff', 5, 6, 2); gl2.position.set(4.4, 2.2, -6.5); scene.add(gl2);
    const gang = new THREE.Group(); gang.position.set(3.0, 0, -4.0); const plank = box(1.5, 0.08, 1.2, block('#8c7a5c')); plank.position.set(0.75, 0, 0); gang.add(plank); scene.add(gang);
    const d1 = dust(scene, { center: [4, 1.5, -8], bounds: [10, 3, 22] });

    const hand = buildCharacter({ shirt: PAL.shirts[0], sleeve: '#d9772f', hairStyle: 'cap', hat: PAL.uniformNavy, skin: PAL.skin[2], badge: true });
    scene.add(hand.group); // deckhand
    const twin = buildCharacter({ shirt: PAL.shirts[1], sleeve: PAL.sleeveHero, hairStyle: 'bun', skin: PAL.skin[0] }); // the "other Dana" holding a phone on deck
    twin.group.position.set(5.4, 0, -7.2); twin.group.rotation.y = -Math.PI / 2; scene.add(twin.group);
    const tphone = box(0.09, 0.16, 0.012, glow('#9cc4ff', 3)); tphone.position.set(0.24, 1.12, 0.33); twin.group.add(tphone);
    const tlight = new THREE.PointLight('#9cc4ff', 2.2, 3.2, 2); tlight.position.set(5.0, 1.5, -7.1); scene.add(tlight);

    // ---------- 3: engine stair/corridor (x=-40) ----------
    const X3 = -40;
    floor(scene, 3.2, 20, { a: '#2a3033', b: '#252a2d' }).position.set(X3, 0.001, -8);
    ceiling(scene, 3.2, 20, 2.8).position.set(X3, 2.8, -8);
    wall(scene, [X3 - 1.7, 0, -8], [0.2, 2.8, 20], '#3b2528'); wall(scene, [X3 + 1.7, 0, -8], [0.2, 2.8, 20], '#3b2528'); wall(scene, [X3, 0, 2], [3.6, 2.8, 0.2], '#2c3a36');
    const eng = box(1.0, 1.7, 5.5, block('#52606a', 0.5)); eng.position.set(X3 + 1.0, 0.85, -11.5); scene.add(eng); // the engine: chunky, emissive vents
    for (let i = 0; i < 5; i++) { const v = box(0.04, 0.12, 0.7, glow('#ff7a3a', 1.6)); v.position.set(X3 + 0.48, 1.0 + (i % 2) * 0.4, -9.6 - i * 0.9); v.castShadow = false; scene.add(v); }
    for (const z of [-4.2, -6.8]) { const p = cyl(0.12, 0.12, 2.8, block('#3a4650', 0.4)); p.position.set(X3 - 1.45, 1.4, z); scene.add(p); }
    crate(scene, [X3 - 1.0, 0, -8.6], 0.9); crate(scene, [X3 - 1.1, 0, -7.4], 0.7, '#6d4d2e'); // hiding spot
    textSign(scene, 'ENGINE ROOM', [X3 - 1.59, 1.9, -3], Math.PI / 2, 1.5, 0.5, { fg: '#ff4d2e', size: 110 });
    textSign(scene, 'LOWER CABIN →', [X3, 2.45, -15.2], 0, 1.8, 0.45, { fg: '#7fe3ff', size: 100 });
    const d3door = door(scene, [X3, 0, -15.6], 0, { color: '#1f2b27' }); exitSign(scene, [X3, 2.6, -15.4]);
    redPractical(scene, [X3 - 1.4, 2.5, -3], 1.6); redPractical(scene, [X3 + 1.4, 2.5, -9], 1.6); redPractical(scene, [X3 - 1.4, 2.5, -13], 1.4);
    keep(trackSpot(scene, [X3 + 0.3, 2.7, -5.4], [X3, 0, -5.4], { color: '#cfd9ff', intensity: 65, angle: 0.55 }), 65);
    slatLight(scene, [X3 - 1.58, 1.5, -11], 1.2, 1.4, Math.PI / 2, '#8fb0ff');
    const d3 = dust(scene, { center: [X3, 1.5, -7], bounds: [3, 2.6, 16] });

    // ---------- 4: lower cabin (x=+40) ----------
    const X4 = 40;
    floor(scene, 5.2, 16, { a: '#27323d', b: '#222b35' }).position.set(X4, 0.001, -6);
    ceiling(scene, 5.2, 16, 2.7).position.set(X4, 2.7, -6);
    wall(scene, [X4 - 2.7, 0, -6], [0.2, 2.7, 16], '#1f2a30'); wall(scene, [X4 + 2.7, 0, -6], [0.2, 2.7, 16], '#1f2a30'); wall(scene, [X4, 0, -14], [5.6, 2.7, 0.2], '#24343a'); wall(scene, [X4, 0, 2], [5.6, 2.7, 0.2], '#24343a');
    for (const z of [-5, -7.5, -10, -12.3]) for (const sx of [-1.4, 1.4]) seat(scene, X4 + sx, z);
    for (const [sx, z] of [[-1.4, -7.5], [1.4, -10], [1.4, -5]]) { const p = buildCharacter({ shirt: PAL.shirts[(z * -3 | 0) % 6], skin: PAL.skin[(z * -2 | 0) % 5], hairStyle: 'short' }); p.group.position.set(X4 + sx, -0.42, z + 0.05); p.group.rotation.y = Math.PI; scene.add(p.group); }
    textSign(scene, 'SEAT 4', [X4 - 1.4, 1.5, -10 + 0.36], 0, 0.7, 0.28, { fg: '#ff9ccf', size: 90 }); // reserved placard on the empty seat back
    textSign(scene, 'LOWER CABIN', [X4 - 2.58, 2.0, -4], Math.PI / 2, 1.6, 0.5, { fg: '#7fe3ff', size: 110 });
    for (const z of [-3, -8]) { const w = box(0.05, 0.6, 1.1, glow('#0b2a2f', 0.6)); w.position.set(X4 + 2.58, 1.5, z); w.castShadow = false; scene.add(w); }
    keep(trackSpot(scene, [X4, 2.6, -5], [X4, 0, -6], { color: '#cfd9ff', intensity: 75, angle: 0.7 }), 75);
    keep(trackSpot(scene, [X4, 2.6, -11], [X4, 0, -12], { color: '#ffb0a0', intensity: 50, angle: 0.7, shadow: false, cone: false }), 50);
    exitSign(scene, [X4, 2.3, -13.8]); redPractical(scene, [X4 + 2.4, 2.4, -9], 1.4);
    const d4 = dust(scene, { center: [X4, 1.5, -6], bounds: [5, 2.5, 14] });

    // ---------- the entity ----------
    const ent = buildEntity(); scene.add(ent.group); ent.group.visible = false;
    const entAt = (t) => {
      if (t >= 17.3 && t < 19.2) return [6.5, 0, -25.4];
      if (t >= 40.9 && t < 43.6) return [X3, 0, -14.6];
      if (t >= 52.5 && t < 53.1) return [X3, 0, -17.4];
      if (t >= 75.8 && t < 77.6) return [X4, 0, -12.6];
      if (t >= 77.6 && t < 85) return [X4, 0, -11.2];
      return null;
    };
    const talk = (who, t) => (S.lines.some((l) => l.who === who && t >= l.t0 && t < l.t1) ? 0.5 + 0.5 * Math.sin(t * 16) : 0);
    const dips = [[14.1, 16.6], [29.4, 29.9], [36.3, 38.6], [40.4, 41.6], [44.5, 49], [74.4, 76.4]];
    const inDip = (t) => dips.some(([a, b]) => t >= a && t < b);

    const K = (t, o) => [t, { walk: 0, pitch: 0, crouch: 0, yaw: 0, ...o }];
    const bodyTrack = track([
      K(0, { x: 0.4, z: 0, yaw: -0.6, walk: 1 }), K(3.3, { x: 0.8, z: -3.4, yaw: -0.62, walk: 1 }), K(3.7, { x: 0.9, z: -3.6, yaw: -0.2, pitch: 0.02 }),
      K(4.8, { x: 0.9, z: -3.6, yaw: -0.94, pitch: 0.04 }), K(6.0, { x: 0.9, z: -3.6, yaw: -1.3 }), K(8.6, { x: 0.9, z: -3.6, yaw: -1.5 }),
      K(9.1, { x: 1.4, z: -4.0, yaw: -1.5708, walk: 1 }), K(10.4, { x: 2.6, z: -4.0, yaw: -1.5708, walk: 1 }), K(12.8, { x: 5.6, z: -4.0, yaw: -1.5708, walk: 1 }),
      K(13.8, { x: 6.1, z: -4.6, yaw: -0.3 }), K(16.4, { x: 6.1, z: -4.8, yaw: -0.3 }), K(17.2, { x: 6.1, z: -4.8, yaw: 0 }), K(19.4, { x: 6.1, z: -4.8, yaw: 0 }),
      K(20.6, { x: 6.1, z: -5.4, yaw: 0, walk: 1 }), K(22.8, { x: 6.1, z: -9, yaw: 0.1, walk: 1 }), K(26.6, { x: 6.2, z: -11.5, yaw: -0.6 }), K(29.8, { x: 6.2, z: -12.2, yaw: -0.6 }),
      K(30.2, { x: 6.2, z: -12.6, yaw: 0, walk: 1 }), K(31.8, { x: 6.1, z: -15.4, yaw: 0, walk: 1 }), K(31.9, { x: 6.1, z: -15.5, yaw: 0, walk: 1 }),
      K(32.0, { x: X3, z: 0, yaw: 0, walk: 1 }), K(36.0, { x: X3, z: -6, walk: 1 }), K(37.4, { x: X3, z: -7, walk: 0.3 }), K(40.4, { x: X3, z: -7.4 }), K(43.0, { x: X3, z: -7.4 }),
      K(43.9, { x: X3 - 0.95, z: -8.2, yaw: 0.3, crouch: 0.8 }), K(49.0, { x: X3 - 0.95, z: -8.2, yaw: 0.3, crouch: 0.8 }), K(49.8, { x: X3, z: -7.8, yaw: 0 }),
      K(50.6, { x: X3, z: -8.2, walk: 1 }), K(52.4, { x: X3, z: -13.4, walk: 1 }), K(52.9, { x: X3, z: -14.4, walk: 0.5 }), K(53.2, { x: X3, z: -14.6 }),
      K(53.4, { x: X4, z: 0, walk: 1 }), K(55.2, { x: X4, z: -3.2, walk: 1 }), K(56.0, { x: X4, z: -3.5 }), K(75.0, { x: X4, z: -3.5 }), K(76.0, { x: X4, z: -3.5, yaw: 0, pitch: 0.04 }), K(85, { x: X4, z: -3.5, pitch: 0.04 }),
    ]);

    const faceCam = (g, cam) => { g.rotation.y = Math.atan2(cam.x - g.position.x, cam.z - g.position.z); };
    return {
      bodyTrack,
      phoneKeys: [[0, { amt: 0.5 }], [54.6, { amt: 0.5 }], [55.5, { amt: 1 }], [74.0, { amt: 1 }], [75.0, { amt: 0.5 }], [85, { amt: 0.5 }]],
      leftKeys: [[0, { vis: 0 }], [10.0, { vis: 0 }], [10.6, { vis: 1, x: -0.12, y: -0.24, z: -0.5 }], [12.4, { vis: 1, x: -0.1, y: -0.22, z: -0.5 }], [12.9, { vis: 0 }],
        [51.6, { vis: 0 }], [52.0, { vis: 1, x: 0.0, y: -0.1, z: -0.45 }], [52.9, { vis: 1, x: 0.0, y: -0.1, z: -0.5 }], [53.3, { vis: 0 }], [85, { vis: 0 }]],
      phoneScript: {
        contact: { name: 'Capt. Osei', initial: 'O', color: '#ffb347', status: 'Last seen 11:41 PM', statusColor: '#7a8296' },
        clock: (t) => (t < 56 ? '11:58' : t < 64 ? '12:01' : '12:07'), battery: 'low',
        items: [
          { t: 55.6, side: 'in', text: 'FERRYLINK: Seat 4 reserved for DANA REYES' },
          { t: 57.4, side: 'in', kind: 'voice', playFrom: 58.0, dur: 4.5 },
          { t: 63.6, side: 'in', text: 'FERRYLINK: Proceed below. You are late.' },
          { t: 68.0, side: 'out', text: "what's my dog's name", typeFrom: 66.0, receipt: 'Read' },
          { t: 69.4, side: 'in', text: 'FERRYLINK: Biscuit. Sit.' },
        ],
      },
      fade: (t) => Math.max(ramp(t, 31.2, 31.8, 32.4, 33.0), ramp(t, 44.7, 45.2, 48.6, 49.2), ramp(t, 52.8, 53.1, 53.6, 54.1)),
      update(t, f, fp) {
        water.userData.update(t); d1.userData.update(t); d3.userData.update(t); d4.userData.update(t);
        // gangway: down, slams up with the hook boom, lowered by the deckhand
        const up = t < 3.3 ? 0 : t < 3.45 ? (t - 3.3) / 0.15 : t < 8.4 ? 1 : t < 9.2 ? 1 - (t - 8.4) / 0.8 : 0; gang.rotation.z = up * 1.35;
        // hum dips -> lights sag + flicker
        const dip = inDip(t); for (const [l, b] of spots) l.intensity = dip ? b * (0.25 + 0.5 * Math.abs(noise1(t * 11, 3))) : b;
        // twin Dana on deck, visible from the boom until the gangway comes down
        const tv = t < 9.0, raised = t >= 3.25; twin.group.visible = tv; tlight.visible = tv && raised; tphone.visible = raised; twin.pose(t, { armsUp: 0 }); if (raised) twin.parts.armR.rotation.x = -1.35;
        // deckhand: on deck by the gangway, then walks beside the player
        const cam = fp.camera.position; const hv = t >= 4.4 && t < 31.8; hand.group.visible = hv;
        if (t < 12.8) hand.group.position.set(5.2, 0, -4.9); else hand.group.position.set(7.6, 0, Math.min(-6, bodyTrack(t).z - 0.9));
        faceCam(hand.group, cam); hand.pose(t, { walk: t > 20.6 && t < 26 ? 0.9 : 0, talk: talk('npc', t), lookAt: cam });
        const p = entAt(t); ent.group.visible = !!p; if (p) { ent.group.position.set(...p); ent.group.rotation.y = Math.atan2(cam.x - p[0], cam.z - p[2]); ent.pose(t, {}); ent.blink(noise1(t * 6, 9) > -0.85); }
        // corridor door swings open as the player pushes through
        d3door.setOpen(clamp((t - 52.2) / 0.5) * 1.3);
      },
      meta: {
        placeCard: { t0: 0, t1: 4.0, ...S.placeCard }, subs: S.subs, endCardStart: 79.5,
        endCard: { ...S.choice, handle: S.handle },
      },
    };
  },
};
