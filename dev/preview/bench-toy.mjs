// CPU cost of the hero toy per frame, measured in Node with the same Three.js
// operations (raycast + 420 dust motes). Multiply by 4 for a throttled phone.
import * as T from 'three';
const ray = new T.Raycaster(new T.Vector3(0.1, 0.25, 3.4), new T.Vector3(0.1, 0.02, -1).normalize());
const make = (seg) => { const g = new T.Group(); const rim = new T.TorusGeometry(0.5, 0.2, seg[0], seg[1]); rim.rotateX(-Math.PI / 2).translate(0, 0.2, 0); const c = new T.SphereGeometry(0.44, seg[2], seg[3]); c.scale(1, 0.24, 1).translate(0, 0.12, 0); g.add(new T.Mesh(rim), new T.Mesh(c)); g.position.set(0.95, 0, 0.1); g.rotation.y = 0.4; g.updateMatrixWorld(true); return g; };
const full = make([48, 160, 72, 36]); const proxy = make([10, 24, 16, 8]);
const hits = [];
const time = (fn, n = 400) => { for (let i = 0; i < 50; i++) fn(); const t = performance.now(); for (let i = 0; i < n; i++) fn(); return (performance.now() - t) / n; };
const count = 420; const pos = new Float32Array(count * 3).map(() => Math.random()); const vel = new Float32Array(count * 3);
const p = new T.Vector3(); const c = new T.Vector3();
const dust = () => { for (let i = 0; i < count; i++) { const k = i * 3; p.set(pos[k], pos[k + 1], pos[k + 2]); ray.ray.closestPointToPoint(p, c); const d = p.distanceTo(c); if (d < 0.4) { vel[k] += 0.001; } vel[k] *= 0.94; pos[k] += vel[k]; } };
const rf = time(() => { hits.length = 0; ray.intersectObject(full, true, hits); });
const rp = time(() => { hits.length = 0; ray.intersectObject(proxy, true, hits); });
const du = time(dust);
console.log(`raycast full mesh ${rf.toFixed(3)} ms | proxy ${rp.toFixed(3)} ms | dust x${count} ${du.toFixed(3)} ms`);
console.log(`toy CPU per frame (proxy + dust): ${(rp + du).toFixed(3)} ms desktop, ~${((rp + du) * 4).toFixed(2)} ms at 4x throttling`);
