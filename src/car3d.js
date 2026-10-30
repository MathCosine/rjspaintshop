// Interactive 3D car for the "Knowledgeable about every part" section.
//
// The body is a lofted surface: a rounded cross-section swept along the car's
// length, shaped by side-profile and plan-view curves (proportions of a modern
// EV crossover). The surface is cut into real panels (fascias, hood, doors,
// glass roof, liftgate) with small gaps between them, so the assembled car
// shows shut lines and each panel can be pulled away in 3D.
//
// Bundled with esbuild into assets/js/car3d.js. Rebuild after editing:
//   npm run build:car
import {
  ACESFilmicToneMapping, BackSide, BoxGeometry, BufferGeometry, CanvasTexture, CatmullRomCurve3, CircleGeometry,
  Color, CylinderGeometry, DirectionalLight, DoubleSide, Float32BufferAttribute, Group, LatheGeometry, LineBasicMaterial,
  LineSegments, MathUtils, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, PerspectiveCamera,
  PlaneGeometry, PMREMGenerator, Scene, SphereGeometry, SRGBColorSpace, TubeGeometry, Vector2, Vector3, WebGLRenderer,
} from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

/* ------------------------------------------------------------------ */
/* Shape                                                               */
/* ------------------------------------------------------------------ */

const LEN = 4.79;
const X0 = -LEN / 2;
const CAPU = 0.03; // parameter length of the rounded end caps
const CAP_FRONT = 0.08; // metres the nose cap extends
const CAP_REAR = 0.09;
const WHEEL_R = 0.365;
const ARCH_R = 0.43;
const AXLE_REAR = -1.465;
const AXLE_FRONT = 1.425;
const TRACK = 0.82;

// Monotone cubic interpolation through [u, value] pairs.
function curve(points) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const n = xs.length;
  const d = [];
  const m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return (u) => {
    if (u <= xs[0]) return ys[0];
    if (u >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (u > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (u - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

// Resample a curve and blur it so its curvature (not just its slope) is smooth;
// that is what keeps reflections running cleanly along the paint.
function smoothCurve(points, radius = 0.014) {
  const f = curve(points);
  const N = 800;
  let v = Array.from({ length: N + 1 }, (_, i) => f(i / N));
  const r = Math.max(1, Math.round(radius * N));
  for (let pass = 0; pass < 3; pass++) {
    const out = v.slice();
    for (let i = 0; i <= N; i++) {
      let sum = 0;
      let n = 0;
      for (let k = -r; k <= r; k++) {
        const j = Math.min(N, Math.max(0, i + k));
        sum += v[j];
        n++;
      }
      out[i] = sum / n;
    }
    v = out;
  }
  return (u) => {
    const t = Math.min(1, Math.max(0, u)) * N;
    const i = Math.min(N - 1, Math.floor(t));
    return v[i] + (v[i + 1] - v[i]) * (t - i);
  };
}

// Side profile (roof and underside), plan width, beltline and greenhouse taper.
// u runs from the rear bumper (0) to the nose (1).
const TOP = smoothCurve([[0, 1.08], [0.03, 1.15], [0.07, 1.21], [0.12, 1.33], [0.2, 1.48], [0.3, 1.575], [0.4, 1.625], [0.5, 1.62],
  [0.58, 1.56], [0.64, 1.43], [0.7, 1.24], [0.74, 1.13], [0.8, 1.07], [0.88, 1.02], [0.95, 0.96], [0.985, 0.9], [1, 0.84]], 0.03);
const BOTTOM = smoothCurve([[0, 0.48], [0.03, 0.39], [0.07, 0.32], [0.14, 0.26], [0.22, 0.21], [0.8, 0.21], [0.88, 0.23], [0.95, 0.255],
  [0.985, 0.29], [1, 0.33]]);
const HALF_W = smoothCurve([[0, 0.8], [0.025, 0.9], [0.07, 0.95], [0.16, 0.965], [0.5, 0.965], [0.84, 0.955], [0.91, 0.92],
  [0.95, 0.86], [0.98, 0.76], [1, 0.6]]);
const BELT = smoothCurve([[0.05, 1.14], [0.15, 1.1], [0.4, 1.05], [0.6, 1.02], [0.74, 1.0]], 0.03);
const TAPER = smoothCurve([[0, 0.08], [0.1, 0.17], [0.5, 0.18], [0.68, 0.15], [0.76, 0.07], [1, 0.05]], 0.03);

const SHOULDER = smoothCurve([[0, 0], [0.1, 0.035], [0.19, 0.06], [0.3, 0.03], [0.5, 0.012], [0.68, 0.02], [0.8, 0.055],
  [0.9, 0.04], [1, 0.0]], 0.03);

const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

// Point on the right-hand surface. phi runs from -PI/2 (underside centre)
// through 0 (widest) to PI/2 (roof centre). u outside 0..1 rounds off the ends.
function surface(u, phi, out, inset = 0) {
  const uc = u < 0 ? 0 : u > 1 ? 1 : u;
  const top = TOP(uc);
  const bot = BOTTOM(uc);
  const yc = (top + bot) / 2;
  const hb = (top - bot) / 2;
  const s = Math.sin(phi);
  const c = Math.cos(phi);
  const nv = s < 0 ? 3.6 : 3.0;
  const ys = Math.sign(s) * Math.pow(Math.abs(s), 2 / nv);
  const zs = Math.pow(Math.abs(c), 2 / (s < 0 ? 3.8 : 3.2));
  let y = yc + hb * ys;
  // raise the shoulder band (peaks around phi = 0.55) to form fender crowns
  const sh = Math.exp(-Math.pow((phi - 0.5) / 0.32, 2));
  y += SHOULDER(uc) * sh;
  const belt = BELT(uc);
  const taper = 1 - TAPER(uc) * smooth((y - belt) / Math.max(0.05, top - belt));
  let z = HALF_W(uc) * zs * taper;
  let x = X0 + uc * LEN;
  if (u < 0 || u > 1) {
    const k = Math.min(1, (u < 0 ? -u : u - 1) / CAPU);
    const sc = Math.cos(k * Math.PI / 2);
    // round off mostly in plan view so the nose and tail stay upright
    y = yc + (y - yc) * (1 - (1 - sc) * 0.3);
    z *= sc;
    x += (u < 0 ? -CAP_REAR : CAP_FRONT) * Math.sin(k * Math.PI / 2);
  }
  if (inset) {
    y = yc + (y - yc) * (1 - inset);
    z *= 1 - inset;
    x *= 1 - inset * 0.8;
  }
  out.set(x, y, z);
  return out;
}

// Wheel openings: points inside an arch are pushed out to its edge.
function archClamp(p) {
  for (const ax of [AXLE_REAR, AXLE_FRONT]) {
    const dx = p.x - ax;
    const dy = p.y - WHEEL_R;
    const r = Math.hypot(dx, dy);
    if (r >= ARCH_R) continue;
    if (dy > 0) {
      const k = ARCH_R / Math.max(r, 1e-4);
      p.x = ax + dx * k;
      p.y = WHEEL_R + dy * k;
    } else {
      p.x = ax + Math.sign(dx || 1) * Math.sqrt(ARCH_R * ARCH_R - dy * dy);
    }
  }
  return p;
}

// phi at which the section at u reaches height y (upper half).
function phiAtHeight(u, y) {
  let lo = -Math.PI / 2;
  let hi = Math.PI / 2;
  const p = new Vector3();
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (surface(u, mid, p).y < y) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

function panelGeometry({ u0, u1, phi0, phi1, nu, nv, arch = false, inset = 0, mirror = true }) {
  const pos = [];
  const idx = [];
  const p = new Vector3();
  const sides = mirror ? [1, -1] : [1];
  sides.forEach((side, si) => {
    const base = si * (nu + 1) * (nv + 1);
    for (let i = 0; i <= nu; i++) {
      const u = u0 + (u1 - u0) * (i / nu);
      const a = typeof phi0 === 'function' ? phi0(u) : phi0;
      const b = typeof phi1 === 'function' ? phi1(u) : phi1;
      for (let j = 0; j <= nv; j++) {
        surface(u, a + (b - a) * (j / nv), p, inset);
        if (arch) archClamp(p);
        pos.push(p.x, p.y, p.z * side);
      }
    }
    for (let i = 0; i < nu; i++) {
      for (let j = 0; j < nv; j++) {
        const a = base + i * (nv + 1) + j;
        const b = a + nv + 1;
        if (side > 0) idx.push(a, b, a + 1, b, b + 1, a + 1);
        else idx.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  });
  let g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  // weld the mirrored halves so normals are shared along the centre line
  if (mirror) g = mergeVertices(g, 1e-4);
  g.computeVertexNormals();
  return g;
}

/* ------------------------------------------------------------------ */
/* Materials                                                           */
/* ------------------------------------------------------------------ */

function paintMaterial(color) {
  return new MeshPhysicalMaterial({
    color, metalness: 0.6, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.5,
  });
}

function studioEnvironment(renderer) {
  // A dark room with long overhead light bars and two soft boxes, which is what
  // gives the paint its car-commercial reflections.
  const env = new Scene();
  env.add(new Mesh(new BoxGeometry(30, 14, 30), new MeshBasicMaterial({ color: 0x0b0b0d, side: BackSide })));
  const light = (w, h, intensity) => new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(intensity, intensity, intensity), side: DoubleSide }));
  for (const z of [-2.6, 0, 2.6]) {
    const bar = light(16, 0.5, 6);
    bar.position.set(0, 6.5, z);
    bar.rotation.x = Math.PI / 2;
    env.add(bar);
  }
  const left = light(9, 4, 2.2);
  left.position.set(0, 3, -12);
  env.add(left);
  const right = light(9, 4, 1.4);
  right.position.set(0, 3, 12);
  right.rotation.y = Math.PI;
  env.add(right);
  const front = light(5, 3, 1.8);
  front.position.set(13, 3, 0);
  front.rotation.y = -Math.PI / 2;
  env.add(front);
  const back = light(6, 2.5, 1.2);
  back.position.set(-13, 3, 0);
  back.rotation.y = Math.PI / 2;
  env.add(back);
  const pmrem = new PMREMGenerator(renderer);
  const tex = pmrem.fromScene(env, 0.035).texture;
  pmrem.dispose();
  return tex;
}

function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 64, 4, 128, 64, 124);
  grd.addColorStop(0, 'rgba(0,0,0,0.85)');
  grd.addColorStop(0.55, 'rgba(0,0,0,0.45)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 128);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/* ------------------------------------------------------------------ */
/* Parts                                                               */
/* ------------------------------------------------------------------ */

const LIGHTS = [];
function lightMaterial(color) {
  const m = new MeshBasicMaterial({ color });
  m.userData.base = new Color(color);
  LIGHTS.push(m);
  return m;
}

function lightBar(points, color) {
  const geo = new TubeGeometry(new CatmullRomCurve3(points), 120, 0.011, 8, false);
  return new Mesh(geo, lightMaterial(color));
}

// Trace the body at a fixed height around one end, for the light bars.
function barPoints(y, uFrom, uTo, steps, push) {
  const pts = [];
  const p = new Vector3();
  for (let i = 0; i <= steps; i++) {
    const u = uFrom + (uTo - uFrom) * (i / steps);
    if (surface(u, Math.PI / 2, p).y < y + 0.01) break;
    surface(u, phiAtHeight(u, y), p);
    pts.push(new Vector3(p.x + push, p.y, p.z * 1.004));
  }
  const last = pts[pts.length - 1];
  const mid = new Vector3(last.x + push * 2, y, 0);
  const mirrored = pts.slice().reverse().map((v) => new Vector3(v.x, v.y, -v.z));
  return pts.concat([mid], mirrored);
}

function makeWheel(materials, side) {
  const g = new Group();
  const prof = [];
  const rIn = 0.248;
  const rOut = WHEEL_R;
  const hw = 0.128;
  const rc = 0.045;
  prof.push(new Vector2(rIn, -hw));
  for (let i = 0; i <= 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * (Math.PI / 2);
    prof.push(new Vector2(rOut - rc + Math.cos(a) * rc, -hw + rc + Math.sin(a) * rc));
  }
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * (Math.PI / 2);
    prof.push(new Vector2(rOut - rc + Math.cos(a) * rc, hw - rc + Math.sin(a) * rc));
  }
  prof.push(new Vector2(rIn, hw));
  const tire = new Mesh(new LatheGeometry(prof, 72), materials.tire);
  tire.rotation.x = Math.PI / 2;
  g.add(tire);
  const barrel = new Mesh(new CylinderGeometry(rIn, rIn, 0.2, 48, 1, true), materials.trim);
  barrel.rotation.x = Math.PI / 2;
  g.add(barrel);
  const face = new Mesh(new CircleGeometry(rIn - 0.004, 72), materials.rim);
  face.position.z = 0.1 * side;
  if (side < 0) face.rotation.y = Math.PI;
  g.add(face);
  // turbine-style slots
  const slots = new Group();
  for (let i = 0; i < 10; i++) {
    const slot = new Mesh(new BoxGeometry(0.018, 0.14, 0.004), materials.accent);
    const a = (i / 10) * Math.PI * 2;
    slot.position.set(Math.cos(a) * 0.165, Math.sin(a) * 0.165, 0);
    slot.rotation.z = a + Math.PI / 2 + 0.35;
    slots.add(slot);
  }
  slots.position.z = 0.102 * side;
  g.add(slots);
  const lip = new Mesh(new CylinderGeometry(rIn, rIn, 0.012, 72, 1, true), materials.accent);
  lip.rotation.x = Math.PI / 2;
  lip.position.z = 0.098 * side;
  g.add(lip);
  const cap = new Mesh(new CircleGeometry(0.055, 32), materials.trim);
  cap.position.z = 0.104 * side;
  if (side < 0) cap.rotation.y = Math.PI;
  g.add(cap);
  const caliper = new Mesh(new BoxGeometry(0.07, 0.16, 0.05), materials.caliper);
  caliper.position.set(-0.16, 0.12, 0.05 * side);
  caliper.rotation.z = 0.6;
  g.add(caliper);
  g.userData.spin = [face, slots, cap];
  return g;
}

function buildCar(paintColor) {
  const car = new Group();
  const parts = {};
  const materials = {
    glass: new MeshPhysicalMaterial({ color: 0x0b0d12, metalness: 0.15, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.01, envMapIntensity: 2 }),
    shell: new MeshStandardMaterial({ color: 0x2b2c31, metalness: 0.5, roughness: 0.55, side: DoubleSide }),
    trim: new MeshStandardMaterial({ color: 0x0c0c0e, metalness: 0.4, roughness: 0.45 }),
    liner: new MeshStandardMaterial({ color: 0x050506, roughness: 0.9, side: BackSide }),
    tire: new MeshStandardMaterial({ color: 0x121214, roughness: 0.88, metalness: 0 }),
    rim: new MeshPhysicalMaterial({ color: 0x34373c, metalness: 0.9, roughness: 0.3, clearcoat: 0.8 }),
    accent: new MeshPhysicalMaterial({ color: 0xc9ccd0, metalness: 1, roughness: 0.2 }),
    caliper: new MeshStandardMaterial({ color: 0xc8191e, roughness: 0.4, metalness: 0.3 }),
  };
  const paints = [];
  const paint = () => { const m = paintMaterial(paintColor); paints.push(m); return m; };
  const add = (name, mesh) => {
    if (!parts[name]) { parts[name] = new Group(); parts[name].name = name; car.add(parts[name]); }
    parts[name].add(mesh);
    return mesh;
  };

  const G = 0.004; // panel gap in u
  const PG = 0.03; // panel gap in phi
  const UP = Math.PI / 2;
  const beltPhi = (u) => phiAtHeight(u, BELT(u));
  const HOOD_PHI = 0.6;
  const LEAD_Y = 0.8; // hood leading edge height
  const hoodPhi = (u) => (u < 0.93 ? HOOD_PHI : Math.max(HOOD_PHI, phiAtHeight(u, LEAD_Y)));
  const SILL_PHI = -0.98;
  const TAIL_Y = 0.86;
  const tailPhi = (u) => phiAtHeight(u, TAIL_Y);
  const tailTop = (u) => (surface(u, UP, new Vector3()).y < TAIL_Y + 0.01 ? UP : tailPhi(u) - PG);

  // inner body-in-white, visible through panel gaps and once panels come off
  add('body', new Mesh(panelGeometry({ u0: -CAPU * 0.6, u1: 1 + CAPU * 0.6, phi0: -UP, phi1: UP, nu: 160, nv: 48, arch: true, inset: 0.022 }), materials.shell));
  // fenders, quarters, sills: the bits that stay put
  add('body', new Mesh(panelGeometry({ u0: 0.708, u1: 0.931, phi0: -UP, phi1: HOOD_PHI - PG, nu: 90, nv: 56, arch: true }), paint()));
  add('body', new Mesh(panelGeometry({ u0: 0.076, u1: 0.296, phi0: -UP, phi1: (u) => beltPhi(u) - PG, nu: 90, nv: 56, arch: true }), paint()));
  add('body', new Mesh(panelGeometry({ u0: 0.296, u1: 0.708, phi0: -UP, phi1: SILL_PHI - PG, nu: 60, nv: 8 }), paint()));
  // wheel-well liners
  for (const ax of [AXLE_REAR, AXLE_FRONT]) {
    const liner = new Mesh(new CylinderGeometry(ARCH_R - 0.01, ARCH_R - 0.01, 1.86, 40, 1, true, Math.PI / 2, Math.PI), materials.liner);
    liner.rotation.x = Math.PI / 2;
    liner.position.set(ax, WHEEL_R, 0);
    add('body', liner);
  }

  const fasciaTop = (u) => { const h = hoodPhi(u); return h >= UP - 1e-3 ? UP : h - PG; };
  const intake = (u) => phiAtHeight(u, 0.4);
  add('fascia-front', new Mesh(panelGeometry({ u0: 0.935, u1: 1 + CAPU, phi0: (u) => intake(u) + 0.012, phi1: fasciaTop, nu: 50, nv: 60 }), paint()));
  add('fascia-front', new Mesh(panelGeometry({ u0: 0.935, u1: 1 + CAPU, phi0: -UP, phi1: intake, nu: 50, nv: 16 }), materials.trim));
  for (const side of [1, -1]) {
    const lu = 0.985;
    const lp = surface(lu, phiAtHeight(lu, 0.62), new Vector3());
    const lamp = new Mesh(new SphereGeometry(1, 20, 12), lightMaterial(0xfff6e8));
    lamp.scale.set(0.035, 0.03, 0.09);
    lamp.position.set(lp.x + 0.005, 0.62, lp.z * side * 0.995);
    lamp.rotation.y = side * 0.9;
    add('fascia-front', lamp);
  }
  add('fascia-front', lightBar(barPoints(LEAD_Y - 0.03, 0.9, 1 + CAPU, 80, 0.006), 0xffffff));
  add('hood', new Mesh(panelGeometry({ u0: 0.708, u1: 1 + CAPU, phi0: hoodPhi, phi1: UP, nu: 90, nv: 22 }), paint()));
  add('roof', new Mesh(panelGeometry({ u0: 0.076, u1: 0.704, phi0: (u) => beltPhi(u) + PG * 0.5, phi1: UP, nu: 180, nv: 40 }), materials.glass));
  add('liftgate', new Mesh(panelGeometry({ u0: -CAPU, u1: 0.072, phi0: tailPhi, phi1: UP, nu: 40, nv: 40 }), paint()));
  add('liftgate', lightBar(barPoints(1.08, 0.08, -CAPU, 80, -0.006), 0xff2a2a));
  const diffuser = (u) => phiAtHeight(u, 0.44);
  add('fascia-rear', new Mesh(panelGeometry({ u0: -CAPU, u1: 0.072, phi0: (u) => diffuser(u) + 0.012, phi1: tailTop, nu: 40, nv: 40 }), paint()));
  add('fascia-rear', new Mesh(panelGeometry({ u0: -CAPU, u1: 0.072, phi0: -UP, phi1: diffuser, nu: 40, nv: 12 }), materials.trim));

  // doors: separate groups per side so they can swing out sideways
  for (const side of [1, -1]) {
    const name = side > 0 ? 'doors-r' : 'doors';
    const opts = { phi0: SILL_PHI, phi1: (u) => beltPhi(u) - PG, nv: 30, mirror: false };
    const front = new Mesh(panelGeometry({ ...opts, u0: 0.478 + G, u1: 0.704, nu: 40 }), paint());
    const rear = new Mesh(panelGeometry({ ...opts, u0: 0.3, u1: 0.478 - G, nu: 40 }), paint());
    front.scale.z = rear.scale.z = side;
    add(name, front);
    add(name, rear);
    // flush handles
    for (const [hx, hy] of [[0.62, 0.99], [-0.25, 1.0]]) {
      const handle = new Mesh(new BoxGeometry(0.2, 0.025, 0.02), materials.trim);
      const p = surface((hx - X0) / LEN, phiAtHeight((hx - X0) / LEN, hy), new Vector3());
      handle.position.set(hx, hy, (p.z + 0.004) * side);
      add(name, handle);
    }
    // mirror
    const mu = 0.688;
    const mp = surface(mu, phiAtHeight(mu, 1.05), new Vector3());
    const mirror = new Mesh(new SphereGeometry(1, 24, 16), paint());
    mirror.scale.set(0.13, 0.065, 0.11);
    mirror.position.set(X0 + mu * LEN - 0.05, 1.06, (mp.z + 0.1) * side);
    add(name, mirror);
    const stalk = new Mesh(new BoxGeometry(0.08, 0.04, 0.1), materials.trim);
    stalk.position.set(X0 + mu * LEN - 0.02, 1.03, (mp.z + 0.03) * side);
    add(name, stalk);
  }

  // wheels
  for (const ax of [AXLE_REAR, AXLE_FRONT]) {
    for (const side of [1, -1]) {
      const w = makeWheel(materials, side);
      w.position.set(ax, WHEEL_R, TRACK * side);
      add(side > 0 ? 'wheels-r' : 'wheels', w);
    }
  }

  // battery pack under the floor
  const pack = new Group();
  const caseMesh = new Mesh(new BoxGeometry(2.4, 0.11, 1.46), new MeshStandardMaterial({ color: 0x4a4d54, metalness: 0.8, roughness: 0.35 }));
  pack.add(caseMesh);
  const cellMat = new MeshStandardMaterial({ color: 0x1d1e22, metalness: 0.5, roughness: 0.5, emissive: 0x6a0f0f, emissiveIntensity: 0.7 });
  cellMat.userData.keepEmissive = true;
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 2; j++) {
      const cell = new Mesh(new BoxGeometry(0.36, 0.04, 0.66), cellMat);
      cell.position.set(-1.0 + i * 0.4, 0.07, j ? 0.35 : -0.35);
      pack.add(cell);
    }
  }
  pack.position.set(-0.02, 0.27, 0);
  add('battery', pack);

  // CAD grid over the inner shell, shown while the car is apart
  const lines = [];
  const p = new Vector3();
  const q = new Vector3();
  for (let u = 0.04; u < 1; u += 0.06) {
    for (let k = 0; k < 40; k++) {
      const a = -Math.PI / 2 + (k / 40) * Math.PI;
      const b = -Math.PI / 2 + ((k + 1) / 40) * Math.PI;
      surface(u, a, p, 0.02); archClamp(p);
      surface(u, b, q, 0.02); archClamp(q);
      lines.push(p.x, p.y, p.z, q.x, q.y, q.z, p.x, p.y, -p.z, q.x, q.y, -q.z);
    }
  }
  for (let k = -6; k <= 6; k++) {
    const phi = (k / 6.5) * (Math.PI / 2);
    for (let i = 0; i < 80; i++) {
      surface(i / 80, phi, p, 0.02); archClamp(p);
      surface((i + 1) / 80, phi, q, 0.02); archClamp(q);
      lines.push(p.x, p.y, p.z, q.x, q.y, q.z, p.x, p.y, -p.z, q.x, q.y, -q.z);
    }
  }
  const gridGeo = new BufferGeometry();
  gridGeo.setAttribute('position', new Float32BufferAttribute(lines, 3));
  const gridMat = new LineBasicMaterial({ color: 0xef4b4b, transparent: true, opacity: 0, depthWrite: false });
  const grid = new LineSegments(gridGeo, gridMat);
  add('body', grid);

  return { car, parts, paints, materials, grid: gridMat, pack };
}

/* ------------------------------------------------------------------ */
/* Explode layout, label anchors                                       */
/* ------------------------------------------------------------------ */

const EXPLODE = {
  'fascia-front': { p: [0.9, 0.02, 0] },
  hood: { p: [0.35, 0.85, 0], r: [0, 0, 0.14] },
  roof: { p: [0, 1.05, 0] },
  doors: { p: [0, 0.05, -1.05] },
  'doors-r': { p: [0, 0.05, 1.05] },
  liftgate: { p: [-0.6, 0.5, 0], r: [0, 0, -0.18] },
  'fascia-rear': { p: [-0.9, 0.02, 0] },
  wheels: { p: [0, -0.02, -0.8] },
  'wheels-r': { p: [0, -0.02, 0.8] },
  battery: { p: [0.15, -0.2, -2.0] },
};

// Which mesh groups make up each part in the legend, and where its label sits.
const LEGEND = {
  'fascia-front': { groups: ['fascia-front'], anchor: [2.5, 0.62, -0.3] },
  hood: { groups: ['hood'], anchor: [1.75, 0.98, -0.3] },
  body: { groups: ['body'], anchor: [-1.45, 0.62, -0.95] },
  doors: { groups: ['doors', 'doors-r'], anchor: [0.62, 0.72, -0.98] },
  roof: { groups: ['roof'], anchor: [0.1, 1.6, -0.2] },
  liftgate: { groups: ['liftgate'], anchor: [-2.45, 1.05, -0.3] },
  'fascia-rear': { groups: ['fascia-rear'], anchor: [-2.55, 0.42, -0.25] },
  wheels: { groups: ['wheels', 'wheels-r'], anchor: [1.425, 0.365, -0.93] },
  battery: { groups: ['battery'], anchor: [0.4, 0.27, -0.73] },
};

/* ------------------------------------------------------------------ */
/* Mount                                                               */
/* ------------------------------------------------------------------ */

export function mountCar(canvas, { labels = [], paint = '#9aa0a6', onReady } = {}) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    return null;
  }
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  scene.environment = studioEnvironment(renderer);
  const camera = new PerspectiveCamera(28, 1, 0.1, 100);
  const key = new DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 6, -4);
  scene.add(key);
  const rim = new DirectionalLight(0xdfe6ff, 0.35);
  rim.position.set(-6, 2, 3);
  scene.add(rim);

  const { car, parts, paints, materials, grid, pack } = buildCar(new Color(paint));
  scene.add(car);
  const shadow = new Mesh(new PlaneGeometry(6.2, 2.9), new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  scene.add(shadow);

  // per-part emissive tint for highlighting
  const tintable = {};
  const owned = new Set(paints);
  Object.entries(LEGEND).forEach(([id, def]) => {
    tintable[id] = [];
    def.groups.forEach((g) => parts[g] && parts[g].traverse((o) => {
      if (!o.isMesh || !o.material.emissive || o.material.userData.keepEmissive) return;
      if ([materials.trim, materials.liner, materials.tire].includes(o.material)) return;
      if (!owned.has(o.material)) { o.material = o.material.clone(); owned.add(o.material); }
      tintable[id].push(o.material);
    }));
  });

  const state = { yaw: -0.5, pitch: 0.1, dist: 8.4, explode: 0, focus: null, spin: 0, lookY: 0.62, tiltX: 0, tiltY: 0, lights: 1 };
  const target = new Vector3();
  const tmp = new Vector3();
  const paintTarget = new Color(paint);
  let width = 0;
  let height = 0;
  let dirty = true;
  let running = false;
  let raf = 0;

  function resize() {
    const r = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(r.width));
    height = Math.max(1, Math.round(r.height));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 700 ? 2 : 1.75));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // keep the whole (exploded) car in frame on narrow screens
    camera.fov = camera.aspect < 1.2 ? 40 : 28;
    camera.updateProjectionMatrix();
    dirty = true;
  }

  function apply() {
    const e = state.explode;
    const ease = (t) => t * t * (3 - 2 * t);
    Object.entries(EXPLODE).forEach(([name, def], i) => {
      const g = parts[name];
      if (!g) return;
      const k = ease(MathUtils.clamp(e * 1.25 - i * 0.025, 0, 1));
      g.position.set(def.p[0] * k, def.p[1] * k, def.p[2] * k);
      if (def.r) g.rotation.set(def.r[0] * k, def.r[1] * k, def.r[2] * k);
    });
    pack.visible = e > 0.02;
    LIGHTS.forEach((m) => m.color.copy(m.userData.base).multiplyScalar(0.12 + 0.88 * state.lights));
    grid.opacity = MathUtils.clamp((e - 0.2) * 0.9, 0, 0.55);
    shadow.material.opacity = 1 - e * 0.55;
    ['wheels', 'wheels-r'].forEach((n) => parts[n].children.forEach((w) => w.userData.spin.forEach((m) => { m.rotation.z = -state.spin; })));

    const yaw = state.yaw + state.tiltX * 0.35;
    const pitch = Math.max(0.02, state.pitch + state.tiltY * 0.12);
    // pull back on tall, narrow stages so the whole car stays in frame
    const dist = state.dist * Math.pow(Math.max(1, 1.5 / camera.aspect), 0.62);
    target.set(0, state.lookY, 0);
    camera.position.set(
      target.x + dist * Math.cos(pitch) * Math.cos(yaw),
      target.y + dist * Math.sin(pitch),
      target.z + dist * Math.cos(pitch) * Math.sin(yaw),
    );
    camera.lookAt(target);

    Object.entries(tintable).forEach(([id, mats]) => {
      const on = state.focus === id;
      mats.forEach((m) => { m.emissive.setHex(on ? 0x7a1010 : 0x000000); });
    });
  }

  function placeLabels() {
    const show = MathUtils.clamp((state.explode - 0.55) / 0.3, 0, 1);
    labels.forEach((el) => {
      const id = el.getAttribute('data-label');
      const def = LEGEND[id];
      if (!def) return;
      const g = parts[def.groups[0]];
      tmp.set(def.anchor[0], def.anchor[1], def.anchor[2]);
      g.updateMatrixWorld();
      tmp.applyMatrix4(g.matrixWorld).project(camera);
      const x = (tmp.x * 0.5 + 0.5) * width;
      const y = (-tmp.y * 0.5 + 0.5) * height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.style.opacity = String(show);
      el.classList.toggle('is-active', state.focus === id);
    });
  }

  function frame() {
    raf = 0;
    let animating = false;
    paints.forEach((m) => {
      if (!m.color.equals(paintTarget)) {
        m.color.lerp(paintTarget, 0.12);
        if (Math.abs(m.color.r - paintTarget.r) + Math.abs(m.color.g - paintTarget.g) + Math.abs(m.color.b - paintTarget.b) < 0.003) m.color.copy(paintTarget);
        animating = true;
      }
    });
    if (dirty || animating) {
      apply();
      renderer.render(scene, camera);
      placeLabels();
      dirty = false;
    }
    if (running && animating) raf = requestAnimationFrame(frame);
  }

  function request() {
    dirty = true;
    if (!raf) raf = requestAnimationFrame(frame);
  }

  resize();
  const ro = new ResizeObserver(() => { resize(); request(); });
  ro.observe(canvas);
  request();
  if (onReady) onReady();

  return {
    state,
    set(next) { Object.assign(state, next); request(); },
    setPaint(hex) { paintTarget.set(hex); running = true; request(); },
    start() { running = true; request(); },
    stop() { running = false; },
    render: request,
    parts: Object.keys(LEGEND),
  };
}
