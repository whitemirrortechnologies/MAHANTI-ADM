/* ============================================================
   MahaNiti 3D — core: procedural stone textures, materials and
   the sculpture ("figure") builder.
   Requires THREE r128 (global).
   ============================================================ */
(function () {
  "use strict";
  if (typeof THREE === "undefined") { window.MN3D = null; return; }
  const T = THREE;
  const MN3D = (window.MN3D = {});

  /* ───────────── helpers ───────────── */
  function rng(seed) { // mulberry32
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const lin = (h) => new T.Color(h).convertSRGBToLinear();
  MN3D.lin = lin;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hex = (h) => new T.Color(h);
  function wrapAngle(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }
  MN3D.util = { rng, lerp, clamp, wrapAngle };

  /* fractal tileable value noise -> {color, height} canvases */
  function noiseCanvases(size, c1, c2, seed, octs) {
    const r = rng(seed);
    octs = octs || [[4, .42], [8, .26], [16, .16], [32, .1], [64, .06]];
    const grids = octs.map(([n]) => { const g = new Float32Array(n * n); for (let i = 0; i < g.length; i++) g[i] = r(); return g; });
    const cc = document.createElement("canvas"), hc = document.createElement("canvas");
    cc.width = cc.height = hc.width = hc.height = size;
    const cx = cc.getContext("2d"), hx = hc.getContext("2d");
    const ci = cx.createImageData(size, size), hi = hx.createImageData(size, size);
    const A = hex(c1), B = hex(c2);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      let v = 0, wsum = 0;
      for (let k = 0; k < octs.length; k++) {
        const n = octs[k][0], w = octs[k][1], g = grids[k];
        const gx = x / size * n, gy = y / size * n, x0 = Math.floor(gx), y0 = Math.floor(gy);
        const fx = gx - x0, fy = gy - y0, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
        const a = g[(y0 % n) * n + (x0 % n)], b = g[(y0 % n) * n + ((x0 + 1) % n)];
        const c = g[((y0 + 1) % n) * n + (x0 % n)], d = g[((y0 + 1) % n) * n + ((x0 + 1) % n)];
        v += w * lerp(lerp(a, b, sx), lerp(c, d, sx), sy); wsum += w;
      }
      v /= wsum;
      const grain = (r() - 0.5) * 0.08; // fine grain
      const t = clamp(v + grain, 0, 1), i = (y * size + x) * 4, tc = 0.5 + (t - 0.5) * 0.55;
      ci.data[i] = lerp(A.r, B.r, tc) * 255; ci.data[i + 1] = lerp(A.g, B.g, tc) * 255; ci.data[i + 2] = lerp(A.b, B.b, tc) * 255; ci.data[i + 3] = 255;
      const h = clamp(t, 0, 1) * 255; hi.data[i] = hi.data[i + 1] = hi.data[i + 2] = h; hi.data[i + 3] = 255;
    }
    cx.putImageData(ci, 0, 0); hx.putImageData(hi, 0, 0);
    return { color: cc, height: hc };
  }
  function texFrom(canvas, srgb, rep) {
    const t = new T.CanvasTexture(canvas);
    t.wrapS = t.wrapT = T.RepeatWrapping; if (rep) t.repeat.set(rep, rep);
    t.anisotropy = 4; if (srgb) t.encoding = T.sRGBEncoding; return t;
  }
  MN3D.noiseCanvases = noiseCanvases; MN3D.texFrom = texFrom;

  /* ───────────── materials ───────────── */
  const stoneDefs = {
    sand:  ["#d9c6a4", "#a98f68", 11], // warm sandstone
    tan:   ["#cfa97c", "#97704a", 12],
    pale:  ["#e6dccb", "#b8a98f", 13], // pale marble-like
    rose:  ["#d8b49c", "#a2786a", 14],
    dark:  ["#56627a", "#2a3347", 15], // dark blue-grey basalt (Krishna's traditional hue)
    bronze:["#8a6a3a", "#4e3a1e", 16],
    wall:  ["#cdb48d", "#8f7550", 17],
    floor: ["#e3d3b1", "#b79e73", 18],
    earth: ["#b08a5c", "#6e5232", 19]
  };
  const matCache = {};
  const M = (MN3D.mat = {});
  /* object-space 3D grain (no UV stretching): gives stone / cloth a fine mineral texture */
  function grain(mat, scale, amt, key) {
    mat.onBeforeCompile = function (sh) {
      const NL = String.fromCharCode(10);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>' + NL + 'varying vec3 vObjPos;').replace('#include <begin_vertex>', '#include <begin_vertex>' + NL + 'vObjPos = position;');
      const noise = 'varying vec3 vObjPos;' + NL + 'float h3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}' + NL +
        'float vn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}';
      const use = 'float gn=vn(vObjPos*' + scale.toFixed(1) + ')*0.55+vn(vObjPos*' + (scale * 2.7).toFixed(1) + ')*0.3+vn(vObjPos*' + (scale * 7).toFixed(1) + ')*0.15;' + NL + 'diffuseColor.rgb*=(1.0-' + amt.toFixed(2) + ')+' + (amt * 2).toFixed(2) + '*gn;';
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>' + NL + noise).replace('#include <color_fragment>', '#include <color_fragment>' + NL + use);
    };
    mat.customProgramCacheKey = function () { return 'grain' + key + scale + amt; };
    return mat;
  }
  M.stone = function (key, o) {
    o = o || {}; const k = "s:" + key + (o.rough || ""); if (matCache[k]) return matCache[k];
    const d = stoneDefs[key] || stoneDefs.sand; const col = hex(d[0]).lerp(hex(d[1]), 0.35).convertSRGBToLinear();
    const m = new T.MeshStandardMaterial({ color: col, roughness: o.rough != null ? o.rough : 0.58, metalness: 0.03 });
    return (matCache[k] = grain(m, o.scale || 38, o.amt || 0.2, "st" + key));
  };
  M.cloth = function (color, o) {
    o = o || {}; const k = "c:" + color; if (matCache[k]) return matCache[k];
    const m = new T.MeshStandardMaterial({ color: lin(color), roughness: 0.82, metalness: 0, side: T.DoubleSide });
    return (matCache[k] = grain(m, 70, 0.16, "cl"));
  };
  M.paint = function (color) { const k = 'p:' + color; return matCache[k] || (matCache[k] = new T.MeshStandardMaterial({ color: lin(color), roughness: 0.45 })); };
  M.gold = new T.MeshStandardMaterial({ color: lin(0xd9a93a), metalness: 1, roughness: 0.28 });
  M.goldDark = new T.MeshStandardMaterial({ color: lin(0xa87b22), metalness: 1, roughness: 0.4 });
  M.white = new T.MeshStandardMaterial({ color: lin(0xf1ecde), roughness: 0.6 });
  M.dark = new T.MeshStandardMaterial({ color: lin(0x1c1712), roughness: 0.5 });
  M.eye = new T.MeshStandardMaterial({ color: lin(0xf4efe2), roughness: 0.35 });
  M.iris = new T.MeshStandardMaterial({ color: lin(0x16100b), roughness: 0.25 });
  M.wood = function () { return M.stone("bronze", { rough: 0.7 }); };
  M.gem = (c) => new T.MeshStandardMaterial({ color: lin(c), roughness: 0.15, metalness: 0.3, emissive: lin(c), emissiveIntensity: 0.35 });

  /* ───────────── geometry helpers ───────────── */
  const G = (MN3D.geo = {});
  /** smooth lathe from [r,y] pairs */
  G.lathe = function (pairs, seg, smooth) {
    let pts = pairs.map((p) => new T.Vector2(p[0], p[1]));
    if (smooth !== false) pts = new T.SplineCurve(pts).getPoints(Math.max(24, pairs.length * 6));
    return new T.LatheGeometry(pts, seg || 32);
  };
  /** tapered limb hanging down from origin (y=0) to y=-len */
  G.limb = function (r0, r1, len, seg) {
    const pts = [];
    pts.push([0, -len - r1 * 0.9]);
    for (let i = 0; i <= 8; i++) {
      const t = i / 8, r = lerp(r1, r0, t) * (1 + 0.13 * Math.sin(Math.PI * t));
      pts.push([r, -len + len * t]);
    }
    pts.push([r0 * 0.7, r0 * 0.7]); pts.push([0, r0 * 0.95]);
    return G.lathe(pts, seg || 14);
  };
  G.capsule = function (r, len, seg) { // along Y, centred
    const pts = [], n = 6;
    for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (i / n) * (Math.PI / 2); pts.push(new T.Vector2(Math.cos(a) * r, Math.sin(a) * r - len / 2)); }
    for (let i = 0; i <= n; i++) { const a = (i / n) * (Math.PI / 2); pts.push(new T.Vector2(Math.cos(a) * r, Math.sin(a) * r + len / 2)); }
    pts[0].x = 0; pts[pts.length - 1].x = 0;
    return new T.LatheGeometry(pts, seg || 12);
  };
  /** mesh capsule from point a to b */
  G.between = function (a, b, r, mat, seg) {
    const d = new T.Vector3().subVectors(b, a), len = d.length();
    const m = new T.Mesh(G.capsule(r, Math.max(0.001, len - 2 * r), seg || 10), mat);
    m.position.copy(a).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
    m.castShadow = true; return m;
  };
  G.tube = function (pts, r, mat, seg, closed) {
    const curve = new T.CatmullRomCurve3(pts.map((p) => new T.Vector3(p[0], p[1], p[2])), closed);
    const m = new T.Mesh(new T.TubeGeometry(curve, seg || 24, r, 8, !!closed), mat); m.castShadow = true; return m;
  };
  function mesh(geo, mat, x, y, z) { const m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; m.receiveShadow = true; return m; }
  MN3D.mesh = mesh;
  function sph(r, mat, x, y, z, sx, sy, sz, ws, hs) {
    const m = mesh(new T.SphereGeometry(r, ws || 20, hs || 14), mat, x, y, z); m.scale.set(sx || 1, sy || 1, sz || 1); return m;
  }
  MN3D.sph = sph;

  /* peacock-feather texture (Krishna's traditional crest) */
  let featherTex;
  function feather() {
    if (featherTex) return featherTex;
    const c = document.createElement("canvas"); c.width = 128; c.height = 256; const x = c.getContext("2d");
    x.clearRect(0, 0, 128, 256);
    x.strokeStyle = "#6e5a2a"; x.lineWidth = 3; x.beginPath(); x.moveTo(64, 256); x.lineTo(64, 70); x.stroke();
    // barbs
    x.strokeStyle = "#2f7a52"; x.lineWidth = 1.2;
    for (let i = 0; i < 70; i++) { const y = 250 - i * 2.5; const w = 24 + Math.sin(i / 70 * Math.PI) * 18 * (i > 20 ? 1 : 0.4);
      x.beginPath(); x.moveTo(64, y); x.lineTo(64 - w, y - 14); x.moveTo(64, y); x.lineTo(64 + w, y - 14); x.stroke(); }
    // eye
    const g = x.createRadialGradient(64, 78, 2, 64, 78, 38);
    g.addColorStop(0, "#0b1f5a"); g.addColorStop(0.28, "#1a58b8"); g.addColorStop(0.5, "#17a58a"); g.addColorStop(0.72, "#d3a93a"); g.addColorStop(0.9, "#6b8f2d"); g.addColorStop(1, "rgba(30,90,60,0)");
    x.fillStyle = g; x.beginPath(); x.ellipse(64, 78, 36, 52, 0, 0, Math.PI * 2); x.fill();
    featherTex = new T.CanvasTexture(c); featherTex.encoding = T.sRGBEncoding; return featherTex;
  }

  /* ───────────── head ───────────── */
  function buildHead(R, o) {
    const g = new T.Group(); const skin = o.skin;
    const geo = new T.SphereGeometry(R, 56, 44); const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const ny = y / R, nz = z / R;
      const t = Math.max(0, (0.15 - ny) / 1.15);             // 0 at cheek line → 1 at chin
      x *= 1 - 0.34 * t * t - 0.05 * t; z *= 1 - 0.1 * t;   // jaw taper
      if (nz > 0) { z += R * 0.12 * t * t * (o.chin || 1); y -= R * 0.1 * t * t; } // chin forward
      if (nz < 0) z *= 0.9;                                    // flatten the back of the skull
      if (ny > 0.2 && nz > 0.4) { z += R * 0.025; }            // forehead
      const cheek = Math.exp(-Math.pow((ny + 0.12) / 0.24, 2)) * Math.max(0, nz) * Math.min(1, Math.abs(x) / (R * 0.7));
      z += R * 0.045 * cheek * (o.gaunt ? -1.2 : 1); x *= 1 + 0.03 * cheek;
      y *= 1.14;
      p.setXYZ(i, x, y, z);
    }
    geo.computeVertexNormals();
    const head = mesh(geo, skin); g.add(head);
    // brow ridge
    const brow = sph(R * 0.3, skin, 0, R * 0.22, R * 0.86, 1.8, 0.3, 0.55); brow.rotation.x = -0.1; g.add(brow);
    // nose
    const nose = mesh(new T.ConeGeometry(R * 0.2, R * 0.7, 14), skin, 0, -R * 0.02, R * 0.97); nose.rotation.x = Math.PI / 2 + 0.18; nose.scale.set(0.9, 1, 0.8); g.add(nose);
    g.add(sph(R * 0.13, skin, 0, -R * 0.2, R * 1.02, 1.2, 0.85, 0.95));
    g.add(sph(R * 0.095, skin, R * 0.17, -R * 0.2, R * 0.93, 1, 0.9, 0.9)); g.add(sph(R * 0.095, skin, -R * 0.17, -R * 0.2, R * 0.93, 1, 0.9, 0.9));
    // eyes (almond stone eyes with carved lids)
    if (o.lite) { [-1, 1].forEach((s) => g.add(sph(R * 0.14, skin, s * R * 0.38, R * 0.1, R * 0.9, 1.3, 0.5, 0.4, 8, 6))); g.add(sph(R * 0.2, skin, 0, -R * 0.52, R * 0.9, 1.5, 0.2, 0.6, 8, 6)); return g; }
    [-1, 1].forEach((s) => {
      const ex = s * R * 0.38, ey = R * 0.1, ez = R * 0.86;
      g.add(sph(R * 0.2, M.dark, ex, ey - R * 0.01, ez - R * 0.012, 1.5, 0.78, 0.35, 12, 8)); const ball = sph(R * 0.16, M.eye, ex, ey, ez, 1.35, 0.72, 0.6); ball.rotation.z = s * -0.06; g.add(ball);
      if (!o.eyesClosed) {
        const ir = sph(R * 0.088, M.iris, ex, ey - R * 0.005, ez + R * 0.06, 1, 1, 0.5); g.add(ir);
      }
      const lidU = sph(R * 0.175, skin, ex, ey + R * 0.012, ez + R * 0.012, 1.45, o.eyesClosed ? 0.95 : 0.55, 0.62); lidU.position.y += o.eyesClosed ? 0 : R * 0.035; g.add(lidU);
      const lidL = sph(R * 0.17, skin, ex, ey - R * 0.075, ez + R * 0.005, 1.4, 0.25, 0.6); g.add(lidL);
      const brw = G.tube([[ex - s * R * 0.24, R * 0.29, ez * 0.93], [ex, R * 0.33, ez * 1.0], [ex + s * R * 0.24, R * 0.27, ez * 0.91]], R * 0.045, o.hairMat || M.dark, 10); g.add(brw);
      // ear + kundala
      const ear = sph(R * 0.17, skin, s * R * 1.0, -R * 0.02, -R * 0.05, 0.38, 1.35, 0.85); g.add(ear);
      if (o.kundala !== false) { const k = mesh(new T.TorusGeometry(R * 0.13, R * 0.028, 8, 20), M.gold, s * R * 1.02, -R * 0.38, -R * 0.04); k.rotation.y = Math.PI / 2; g.add(k); }
    });
    // lips
    g.add(sph(R * 0.2, skin, 0, -R * 0.52, R * 0.9, 1.5, 0.2, 0.6));
    const lipTop = sph(R * 0.17, M.paint(0xa6483f), 0, -R * 0.45, R * 0.93, 1.55, 0.17, 0.5); g.add(lipTop);
    g.add(sph(R * 0.2, M.paint(0xa6483f), 0, -R * 0.57, R * 0.89, 1.45, 0.22, 0.55));
    return g;
  }

  /* hair, beard, moustache, crowns */
  function addHair(h, R, o) {
    const hm = o.hairMat;
    if (o.hair === "cap" || o.hair === "bun" || o.hair === "long") {
      const cap = mesh(new T.SphereGeometry(R * 1.05, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.56), hm); cap.scale.y = 1.16; cap.rotation.x = -0.42; cap.position.set(0, R * 0.02, -R * 0.02); h.add(cap);
      const back = sph(R * 1.04, hm, 0, -R * 0.1, -R * 0.12, 1, 1.05, 0.95); h.add(back);
    }
    if (o.hair === "bun") { const b = sph(R * 0.55, hm, 0, R * 1.0, -R * 0.2, 1, 1.05, 1); h.add(b); h.add(mesh(new T.TorusGeometry(R * 0.5, R * 0.07, 8, 24), M.gold, 0, R * 0.78, -R * 0.2)); h.children[h.children.length - 1].rotation.x = Math.PI / 2; }
    if (o.hair === "long") {
      for (let i = 0; i < 9; i++) { const a = -0.9 + (i / 8) * 1.8; h.add(G.tube([[Math.sin(a) * R * 1.02, R * 0.2, -R * 0.6 * Math.cos(a)], [Math.sin(a) * R * 1.12, -R * 0.6, -R * 0.75 * Math.cos(a)], [Math.sin(a) * R * 1.12, -R * 1.5, -R * 0.55 * Math.cos(a)]], R * 0.1, hm, 14)); }
    }
    if (o.braid) { // long braid for Draupadi
      h.add(G.tube([[0, R * 0.2, -R * 1.0], [0, -R * 0.9, -R * 1.25], [0.0, -R * 2.6, -R * 1.2], [0.01, -R * 4.4, -R * 1.0], [0.0, -R * 6.2, -R * 0.9]], R * 0.17, hm, 40));
    }
    if (o.beard) {
      const L = o.beard.len || 0.22, W = o.beard.w || 0.1;
      const bg = G.lathe([[0.002, -L], [W * 0.5, -L * 0.82], [W * 0.95, -L * 0.5], [W * 1.1, -L * 0.15], [W * 1.05, 0.02], [W * 0.9, 0.04]], 28);
      const bp = bg.attributes.position; for (let i = 0; i < bp.count; i++) { const x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i); const a = Math.atan2(z, x); const k = 1 + 0.07 * Math.sin(a * 9 + y * 22) * Math.min(1, -y * 12); bp.setXYZ(i, x * k, y, z * k); }
      bg.computeVertexNormals();
      const b = mesh(bg, o.beardMat || hm); b.position.set(0, -R * 0.55, R * 0.18); b.scale.set(1.0, 1, 0.78); h.add(b);
      // cheek sideburns
      [-1, 1].forEach((s) => h.add(sph(R * 0.3, o.beardMat || hm, s * R * 0.62, -R * 0.38, R * 0.35, 0.55, 1.1, 0.7)));
    }
    if (o.moustache) {
      const mm = o.beardMat || hm, up = o.moustache === "curl" ? R * 0.04 : 0;
      [-1, 1].forEach((s) => h.add(G.tube([[0, -R * 0.4, R * 0.98], [s * R * 0.22, -R * 0.43, R * 0.96], [s * R * 0.48, -R * 0.5 + up, R * 0.86], [s * R * 0.62, -R * 0.46 + up * 2, R * 0.75]], R * 0.08, mm, 12)));
    }
  }
  function addCrown(h, R, o) {
    const type = o.crown; if (!type) return;
    if (type === "kirita" || type === "mukuta") {
      const tall = type === "kirita" ? 0.72 : 0.5;
      const prof = [[R * 1.0, 0], [R * 1.08, R * 0.12], [R * 1.0, R * 0.38], [R * 0.82, R * 0.75 * tall + R * 0.3], [R * 0.55, R * 1.2 * tall + R * 0.4], [R * 0.28, R * 1.7 * tall + R * 0.4], [R * 0.1, R * 2.1 * tall + R * 0.45], [0.002, R * 2.25 * tall + R * 0.5]];
      const c = mesh(G.lathe(prof, 36), o.crownMat || M.gold); c.position.set(0, R * 0.62, -R * 0.05); c.rotation.x = -0.08; h.add(c);
      const band = mesh(new T.TorusGeometry(R * 1.08, R * 0.07, 10, 40), M.goldDark, 0, R * 0.76, -R * 0.05); band.rotation.x = Math.PI / 2 - 0.08; band.scale.set(1, 1, 1); h.add(band);
      const gm = M.gem(o.gem || 0xc02a2a);
      for (let i = 0; i < 9; i++) { const a = -1.15 + (i / 8) * 2.3; h.add(sph(R * 0.07, gm, Math.sin(a) * R * 1.1, R * 0.76, Math.cos(a) * R * 1.07 - R * 0.05, 1, 1, 1, 10, 8)); }
      // rings along the crown
      [0.4, 0.8].forEach((f) => { const rr = mesh(new T.TorusGeometry(R * (1 - f * 0.5), R * 0.035, 8, 32), M.goldDark, 0, R * 0.62 + R * 1.4 * f * tall, -R * 0.05); rr.rotation.x = Math.PI / 2; h.add(rr); });
      h.add(sph(R * 0.13, M.gem(o.gem || 0xc02a2a), 0, R * 0.95, R * 1.04, 1, 1.3, 0.6, 10, 8));
      if (o.feather) {
        const fg = new T.PlaneGeometry(R * 0.7, R * 1.9, 1, 10); const fp = fg.attributes.position;
        for (let i = 0; i < fp.count; i++) { const y = fp.getY(i) / (R * 1.9) + 0.5; fp.setZ(i, -Math.pow(y, 2) * R * 0.9); }
        fg.computeVertexNormals();
        const fm = new T.Mesh(fg, new T.MeshStandardMaterial({ map: feather(), transparent: true, alphaTest: 0.35, side: T.DoubleSide, roughness: 0.5 }));
        fm.position.set(R * 0.12, R * 1.8, -R * 0.15); fm.rotation.set(-0.35, 0.1, -0.22); fm.castShadow = false; h.add(fm);
      }
    } else if (type === "turban") {
      const tc = M.cloth(o.turbanColor || 0xc9a24a);
      for (let i = 0; i < 4; i++) { const t = mesh(new T.TorusGeometry(R * (1.02 - i * 0.04), R * (0.28 - i * 0.02), 14, 40), tc, 0, R * (0.55 + i * 0.22), -R * 0.05); t.rotation.x = Math.PI / 2 - 0.12 + i * 0.05; t.rotation.z = i * 0.7; h.add(t); }
      h.add(sph(R * 0.82, tc, 0, R * 1.2, -R * 0.1, 1, 0.82, 1));
      if (o.turbanPoint) { const pt = mesh(new T.ConeGeometry(R * 0.5, R * 1.4, 18), tc, 0, R * 1.9, -R * 0.1); pt.rotation.x = -0.15; h.add(pt); }
      h.add(sph(R * 0.11, M.gem(0x1f7a8c), 0, R * 0.98, R * 1.0, 1, 1, 0.6, 10, 8));
    } else if (type === "diadem") {
      const band = mesh(new T.TorusGeometry(R * 1.05, R * 0.05, 8, 40), M.gold, 0, R * 0.75, -R * 0.05); band.rotation.x = Math.PI / 2 - 0.3; h.add(band);
      h.add(sph(R * 0.09, M.gem(0xc02a2a), 0, R * 0.55, R * 1.02, 1, 1.2, 0.6, 10, 8));
    }
  }

  /* ───────────── hands ───────────── */
  function buildHand(skin, s, lite) {
    const hnd = new T.Group();
    const palm = sph(0.034, skin, 0, -0.045, 0, 1.1, 1.3, 0.55, 14, 10); hnd.add(palm);
    const fingers = [];
    for (let i = 0; i < (lite ? 0 : 4); i++) {
      const f = new T.Group(); f.position.set((i - 1.5) * 0.0145 * s, -0.082, 0.0);
      const f1 = mesh(G.limb(0.0085, 0.007, 0.032, 8), skin); f.add(f1);
      const f2 = new T.Group(); f2.position.y = -0.032; const f2m = mesh(G.limb(0.007, 0.006, 0.026, 8), skin); f2.add(f2m); f.add(f2);
      hnd.add(f); fingers.push(f, f2);
    }
    const th = new T.Group(); th.position.set(-0.03 * s, -0.04, 0.012); th.rotation.z = 0.5 * s; if (!lite) th.add(mesh(G.limb(0.009, 0.007, 0.04, 8), skin)); hnd.add(th);
    hnd.userData = { fingers, thumb: th };
    hnd.userData.curl = function (v) { fingers.forEach((f, i) => { f.rotation.x = -v * (i % 2 ? 1.05 : 0.7); }); th.rotation.x = -v * 0.4; };
    hnd.userData.curl(0.25);
    return hnd;
  }

  /* ───────────── figure recipes (iconography follows traditional conventions) ───────────── */
  const RECIPES = {
    krishna:      { stone: "dark", cloth: 0xe0b037, cloth2: 0xc5352f, hairColor: 0x15121a, crown: "kirita", feather: true, gem: 0x1b6fd1, hair: "long", moustache: false, build: 0.98, young: true, lipStone: "dark" },
    arjuna:       { stone: "sand", cloth: 0xf2eee4, cloth2: 0x2a4f8a, hairColor: 0x1b140f, crown: "kirita", gem: 0x2a7fd4, hair: "cap", moustache: "curl", build: 1.06, thread: true },
    bhishma:      { stone: "pale", cloth: 0xf5f1e6, cloth2: 0xf5f1e6, hairColor: 0xe9e6df, hair: "bun", beard: { len: 0.34, w: 0.11 }, build: 1.08, old: true, thread: true, gaunt: true },
    vidura:       { stone: "tan", cloth: 0xe7dfcb, cloth2: 0x7a5a30, hairColor: 0x8d8a85, hair: "bun", beard: { len: 0.16, w: 0.09 }, moustache: true, build: 0.95, old: true, staff: true, thread: true },
    yudhishthira: { stone: "sand", cloth: 0xf3efe4, cloth2: 0xc9a24a, hairColor: 0x1b140f, crown: "mukuta", gem: 0x2d8a5a, hair: "cap", moustache: true, build: 1.0 },
    duryodhana:   { stone: "tan", cloth: 0xa8352b, cloth2: 0x2b2a2e, hairColor: 0x15110e, crown: "kirita", gem: 0xe0a21a, hair: "cap", moustache: "curl", build: 1.18, mace: true },
    dhritarashtra:{ stone: "sand", cloth: 0xdccfa6, cloth2: 0x7a6a3a, hairColor: 0x8a8782, crown: "mukuta", gem: 0x8a2a2a, hair: "cap", beard: { len: 0.12, w: 0.09 }, eyesClosed: true, build: 1.02, old: true, seated: true },
    shakuni:      { stone: "rose", cloth: 0x3d5a4a, cloth2: 0xc9a24a, hairColor: 0x15110e, crown: "turban", turbanColor: 0x8a6bb0, turbanPoint: true, moustache: "curl", build: 0.9, gaunt: true, seated: true, dice: true },
    draupadi:     { stone: "rose", cloth: 0xb6283d, cloth2: 0xd9a93a, hairColor: 0x120d0b, crown: "diadem", hair: "cap", braid: true, female: true, build: 0.82, bindi: true },
    king:         { stone: "sand", cloth: 0xd5c08a, cloth2: 0x7a6a3a, hairColor: 0x1b140f, crown: "mukuta", gem: 0x8a2a2a, hair: "cap", moustache: true, build: 1.0, seated: true }
  };
  MN3D.recipes = RECIPES;

  /* ───────────── the figure ───────────── */
  MN3D.figure = function (id, over) {
    const R = Object.assign({ id: id }, RECIPES[id] || RECIPES.king, over || {});
    const root = new T.Group(); root.name = id;
    const skin = M.stone(R.stone);
    const cloth = M.cloth(R.cloth), cloth2 = M.cloth(R.cloth2 || R.cloth);
    R.hairMat = M.cloth(R.hairColor || 0x1b140f, { rep: 4 }); R.skin = skin;
    const W = R.build || 1, fem = !!R.female;
    const J = {}; const seated = !!R.seated;
    const body = new T.Group(); root.add(body);

    /* --- lower body --- */
    let waistY;
    if (!seated) {
      waistY = 0.98;
      const prof = fem
        ? [[0, 1.0], [0.16, 1.0], [0.2, 0.9], [0.24, 0.6], [0.28, 0.3], [0.31, 0.12], [0.3, 0.07]]
        : [[0, 1.0], [0.17, 1.0], [0.215, 0.92], [0.23, 0.72], [0.245, 0.45], [0.265, 0.24], [0.26, 0.15]];
      const dg = G.lathe(prof, 48); const dp = dg.attributes.position;
      for (let i = 0; i < dp.count; i++) { const x = dp.getX(i), y = dp.getY(i), z = dp.getZ(i); const a = Math.atan2(z, x), k = 1 + 0.035 * Math.sin(a * 13 + y * 5) * (1 - y); dp.setXYZ(i, x * k * W, y, z * k * 0.88); }
      dg.computeVertexNormals(); const dh = mesh(dg, cloth); body.add(dh);
      const pleat = mesh(new T.ConeGeometry(0.075, 0.6, 18), cloth2, 0, 0.64, 0.2 * 0.9); pleat.rotation.x = Math.PI; pleat.scale.set(1, 1, 0.5); body.add(pleat);
      const belt = mesh(new T.TorusGeometry(0.185 * W, 0.014, 8, 36), M.gold, 0, 0.99, 0); belt.rotation.x = Math.PI / 2; belt.scale.set(1, 0.84, 1); body.add(belt);
      [-1, 1].forEach((s) => {
        body.add(mesh(G.limb(0.055, 0.04, 0.14, 12), skin, s * 0.1 * W, 0.17, 0));
        const foot = sph(0.05, skin, s * 0.1 * W, 0.04, 0.045, 1, 0.6, 1.9, 14, 10); body.add(foot);
        const sole = sph(0.052, M.stone("bronze"), s * 0.1 * W, 0.012, 0.05, 1.05, 0.25, 2.0, 12, 8); body.add(sole);
      });
    } else {
      waistY = 0.2;
      const drape = sph(0.4, cloth, 0, 0.1, 0.1, 1.0 * W, 0.4, 0.95, 36, 20); body.add(drape);
      [-1, 1].forEach((s) => {
        const hip = new T.Vector3(s * 0.12, 0.13, 0.02), knee = new T.Vector3(s * 0.36, 0.1, 0.3), foot = new T.Vector3(-s * 0.06, 0.1, 0.34);
        body.add(G.between(hip, knee, 0.075, cloth)); body.add(G.between(knee, foot, 0.06, cloth));
        body.add(sph(0.05, skin, foot.x, 0.1, foot.z + 0.04, 1, 0.55, 1.6, 12, 8));
      });
      body.add(mesh(new T.CylinderGeometry(0.5, 0.54, 0.1, 40), cloth2, 0, -0.02, 0.05)); // cushion
    }

    /* --- torso --- */
    const torso = new T.Group(); torso.position.y = waistY; body.add(torso); J.torso = torso;
    const tp = fem
      ? [[0, -0.02], [0.14, 0], [0.15, 0.1], [0.125, 0.22], [0.14, 0.34], [0.165, 0.44], [0.16, 0.5], [0.14, 0.57], [0.08, 0.62], [0.05, 0.65], [0, 0.66]]
      : [[0, -0.02], [0.16, 0], [0.168, 0.1], [0.152, 0.22], [0.17, 0.34], [0.205, 0.45], [0.208, 0.5], [0.17, 0.57], [0.09, 0.62], [0.055, 0.65], [0, 0.66]];
    const tg = G.lathe(tp, 40); const tpos = tg.attributes.position;
    for (let i = 0; i < tpos.count; i++) tpos.setXYZ(i, tpos.getX(i) * W * 1.18, tpos.getY(i), tpos.getZ(i) * 0.66);
    tg.computeVertexNormals(); const tm = mesh(tg, skin); torso.add(tm);
    if (!fem) {
      [-1, 1].forEach((s) => torso.add(sph(0.07, skin, s * 0.095 * W, 0.45, 0.085, 1.15, 0.7, 0.45)));
      if (R.old) torso.add(sph(0.16, skin, 0, 0.1, 0.045, W, 0.75, 0.7)); // softer belly
      else torso.add(sph(0.1, skin, 0, 0.2, 0.08, W * 0.9, 0.6, 0.35));    // abdominal muscle mass
    } else {
      [-1, 1].forEach((s) => torso.add(sph(0.07, skin, s * 0.075, 0.41, 0.09, 1, 0.95, 0.9)));
      // choli + pallu
      torso.add(sph(0.168, cloth2, 0, 0.44, 0.0, W * 1.05, 0.38, 0.68));
      torso.add(G.tube([[-0.17, 0.58, 0.02], [-0.18, 0.3, 0.12], [0.0, 0.1, 0.16], [0.2, -0.05, 0.1]], 0.04, cloth, 20));
    }
    // ornaments
    if (!R.lite) {
    const nk = G.tube([[-0.11, 0.6, 0.06], [-0.1, 0.44, 0.15], [0, 0.26, 0.17], [0.1, 0.44, 0.15], [0.11, 0.6, 0.06]], 0.01, M.gold, 30); torso.add(nk);
    torso.add(sph(0.022, M.gem(R.gem || 0x2a7fd4), 0, 0.26, 0.175, 1, 1.3, 0.8, 10, 8));
    const col = mesh(new T.TorusGeometry(0.075, 0.012, 8, 28), M.gold, 0, 0.62, 0.01); col.rotation.x = Math.PI / 2 - 0.25; torso.add(col);
    if (R.thread) torso.add(G.tube([[-0.14, 0.58, 0.06], [-0.04, 0.38, 0.14], [0.06, 0.2, 0.16], [0.16, 0.02, 0.1]], 0.007, M.white, 24));
    else if (!fem) torso.add(G.tube([[-0.19, 0.55, 0.04], [-0.1, 0.38, 0.16], [0.05, 0.22, 0.17], [0.19, 0.04, 0.1]], 0.026, cloth2, 24)); // uttariya
    }

    /* --- arms --- */
    const arms = {};
    [-1, 1].forEach((s) => {
      const nm = s > 0 ? "L" : "R"; // figure's left is +x
      const sh = new T.Group(); sh.position.set(s * 0.245 * W, 0.53, 0); torso.add(sh);
      sh.add(sph(0.07, skin, 0, 0, 0, 1, 1, 1));
      sh.add(mesh(G.limb(0.058, 0.044, 0.27, 14), skin));
      const arm = mesh(new T.TorusGeometry(0.058, 0.01, 8, 18), M.gold, 0, -0.1, 0); arm.rotation.x = Math.PI / 2; sh.add(arm);
      const el = new T.Group(); el.position.y = -0.27; sh.add(el); el.add(sph(0.043, skin, 0, 0, 0, 1, 1, 1, 14, 10));
      el.add(mesh(G.limb(0.045, 0.03, 0.25, 12), skin));
      const br = mesh(new T.TorusGeometry(0.03, 0.008, 8, 16), M.gold, 0, -0.23, 0); br.rotation.x = Math.PI / 2; el.add(br);
      const wr = new T.Group(); wr.position.y = -0.25; el.add(wr);
      const hand = buildHand(skin, s, R.lite); wr.add(hand);
      J["sh" + nm] = sh; J["el" + nm] = el; J["wr" + nm] = wr; arms[nm] = { hand };
    });

    /* --- neck, head --- */
    torso.add(mesh(new T.CylinderGeometry(0.05, 0.058, 0.13, 20), skin, 0, 0.68, 0));
    const hd = new T.Group(); hd.position.set(0, 0.74, 0.01); torso.add(hd); J.head = hd;
    const HR = fem ? 0.118 : 0.128;
    const hg = new T.Group(); hg.position.set(0, HR * 1.25, 0.01); hd.add(hg);
    hg.add(buildHead(HR, { lite: R.lite, skin: skin, eyesClosed: R.eyesClosed, hairMat: R.hairMat, gaunt: R.gaunt, lipStone: R.lipStone, chin: fem ? 0.8 : 1 }));
    addHair(hg, HR, R); addCrown(hg, HR, R);
    if (R.bindi) hg.add(sph(HR * 0.07, M.gem(0xc0202a), 0, HR * 0.38, HR * 0.99, 1, 1, 0.5, 10, 8));
    if (R.young === undefined && !fem && !R.old) { /* tilak hint */ }
    if (R.crown === "kirita" || R.crown === "mukuta") { /* ear/head ornaments inherit */ }

    /* --- props --- */
    if (R.staff) { const st = mesh(new T.CylinderGeometry(0.013, 0.016, 1.55, 10), M.stone("bronze"), 0, -0.35, 0.02); arms.R.hand.add(st); st.rotation.x = 0.04; }
    if (R.mace) { const mc = new T.Group(); mc.add(mesh(new T.CylinderGeometry(0.02, 0.026, 0.7, 12), M.stone("bronze"), 0, -0.1, 0.01)); const hdm = sph(0.09, M.goldDark, 0, 0.32, 0, 1, 1.2, 1, 18, 12); mc.add(hdm); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const sp = mesh(new T.ConeGeometry(0.02, 0.05, 6), M.gold, Math.cos(a) * 0.085, 0.32, Math.sin(a) * 0.085); sp.rotation.z = -Math.cos(a) * 1.5; sp.rotation.x = Math.sin(a) * 1.5; mc.add(sp); } arms.R.hand.add(mc); }
    if (R.id === "arjuna") {
      const bow = G.tube((function () { const p = []; for (let i = 0; i <= 12; i++) { const a = -1.15 + i / 12 * 2.3; p.push([0.0, Math.sin(a) * 0.9, -Math.cos(a) * 0.32 + 0.32]); } return p; })(), 0.016, M.stone("bronze"), 40);
      const string = G.tube([[0, 0.9 * Math.sin(-1.15), -Math.cos(-1.15) * 0.32 + 0.32], [0, 0, 0.0], [0, 0.9 * Math.sin(1.15), -Math.cos(1.15) * 0.32 + 0.32]], 0.003, M.white, 4);
      const bg = new T.Group(); bg.add(bow); bg.add(string);
      [0.9 * Math.sin(1.15), -0.9 * Math.sin(1.15)].forEach((y) => bg.add(sph(0.022, M.gold, 0, y, -Math.cos(1.15) * 0.32 + 0.32)));
      bg.position.set(0, -0.06, 0.04); bg.rotation.set(0, 0, 0); arms.L.hand.add(bg); root.userData.bow = bg;
      const quiver = mesh(new T.CylinderGeometry(0.05, 0.04, 0.55, 12), M.stone("bronze"), -0.08, 0.38, -0.2); quiver.rotation.z = 0.3; torso.add(quiver);
      for (let i = 0; i < 5; i++) torso.add(mesh(new T.CylinderGeometry(0.004, 0.004, 0.25, 4), M.white, -0.03 - i * 0.012, 0.7 + (i % 2) * 0.02, -0.2 + i * 0.006));
    }
    if (R.dice) { arms.R.hand.add(mesh(new T.BoxGeometry(0.035, 0.035, 0.035), M.white, 0.0, -0.1, 0.03)); arms.R.hand.add(mesh(new T.BoxGeometry(0.035, 0.035, 0.035), M.white, 0.03, -0.1, 0.03)); }

    /* skip the stone "pedestal" — scenes add their own plinths */
    root.userData.joints = J; root.userData.hands = arms; root.userData.recipe = R;
    root.userData.seatHeight = seated ? 0.0 : 0;
    root.scale.setScalar(R.scale || 0.93);
    if (R.lite) root.traverse((m) => { if (m.isMesh) m.castShadow = false; });

    /* ----- pose system ----- */
    const targets = {}; const state = { speed: 4, t: Math.random() * 10, yaw: 0, yawT: 0 };
    const POSES = MN3D.POSES;
    function apply(p) {
      Object.keys(p).forEach((k) => { if (k === "yaw") state.yawT = p[k]; else if (k === "curlL") arms.L.hand.userData.curl(p[k]); else if (k === "curlR") arms.R.hand.userData.curl(p[k]); else targets[k] = p[k]; });
    }
    root.userData.pose = function (name, speed, extra) {
      const base = typeof name === "string" ? POSES[name] : name; if (speed) state.speed = speed;
      Object.keys(targets).forEach((k) => delete targets[k]); apply(POSES.base); if (base) apply(base); if (extra) apply(extra);
    };
    root.userData.snap = function (y) { state.yaw = state.yawT = y; root.rotation.y = y; };
    root.userData.set = function (extra, speed) { if (speed) state.speed = speed; apply(extra); };
    root.userData.update = function (dt) {
      state.t += dt; const k = 1 - Math.exp(-dt * state.speed);
      for (const name in targets) { const j = J[name]; if (!j) continue; const tg = targets[name]; j.rotation.x += (tg[0] - j.rotation.x) * k; j.rotation.y += ((tg[1] || 0) - j.rotation.y) * k; j.rotation.z += ((tg[2] || 0) - j.rotation.z) * k; }
      state.yaw += (state.yawT - state.yaw) * k; root.rotation.y = (root.userData.baseYaw || 0) + state.yaw;
      // idle: breathing + slight sway
      const br = Math.sin(state.t * 1.7); torso.scale.set(1 + br * 0.006, 1 + br * 0.008, 1 + br * 0.006);
      hd.rotation.y += Math.sin(state.t * 0.5 + (id.length)) * 0.0007; J.sh_idle = 0;
    };
    root.userData.pose("base", 6);
    return root;
  };

  /* pose library — angles are Euler radians [x,y,z]. Arm hangs along -Y;
     shoulder x<0 swings the arm forward, z>0 swings the LEFT arm outwards. */
  MN3D.POSES = {
    base:    { shL: [0.05, 0, 0.1], shR: [0.05, 0, -0.1], elL: [-0.18, 0, 0], elR: [-0.18, 0, 0], wrL: [0, 0, 0], wrR: [0, 0, 0], head: [0, 0, 0], torso: [0, 0, 0], yaw: 0, curlL: 0.28, curlR: 0.28 },
    idle:    {},
    speak:   { shR: [-1.05, 0, -0.35], elR: [-1.15, 0, 0], head: [-0.04, 0, 0], torso: [0, -0.1, 0], curlR: 0.1 },
    plea:    { shL: [-0.85, 0, 0.45], shR: [-0.85, 0, -0.45], elL: [-1.05, 0, 0], elR: [-1.05, 0, 0], curlL: 0.05, curlR: 0.05 },
    teach:   { shR: [-0.6, 0, -0.75], elR: [-1.4, 0, 0], shL: [0.05, 0, 0.1], head: [0.02, 0, 0], curlR: 0.45 },
    warn:    { shR: [-0.5, 0, -1.2], elR: [-0.9, 0, 0], curlR: 0.0, head: [-0.05, 0.1, 0] },
    folded:  { shL: [-0.4, 0, 0.0], shR: [-0.4, 0, 0.0], elL: [-1.7, 0, -0.3], elR: [-1.7, 0, 0.3], curlL: 0.6, curlR: 0.6 },
    rest:    { shL: [-0.35, 0, 0.12], shR: [-0.35, 0, -0.12], elL: [-0.95, 0, 0], elR: [-0.95, 0, 0], curlL: 0.35, curlR: 0.35 },
    bow_hold:{ shL: [-0.95, 0, 0.3], elL: [-0.25, 0, 0], shR: [0.05, 0, -0.1], curlL: 0.7 },
    bow_draw:{ shL: [-1.45, 0, 0.1], elL: [-0.05, 0, 0], shR: [-1.35, -0.5, -0.5], elR: [-1.9, 0, 0], torso: [0, 0.6, 0], head: [0, -0.5, 0], curlL: 0.8, curlR: 0.7 },
    slump:   { shL: [0.2, 0, 0.18], shR: [0.2, 0, -0.18], elL: [-0.1, 0, 0], elR: [-0.1, 0, 0], head: [0.5, 0, 0], torso: [0.28, 0, 0], curlL: 0.1, curlR: 0.1 },
    open:    { shL: [-0.35, 0, 0.7], shR: [-0.35, 0, -0.7], elL: [-0.7, 0, 0], elR: [-0.7, 0, 0], curlL: 0.0, curlR: 0.0, head: [0.04, 0, 0] },
    reins:   { shL: [-0.75, 0, 0.12], shR: [-0.75, 0, -0.12], elL: [-0.8, 0, 0], elR: [-0.8, 0, 0], curlL: 0.85, curlR: 0.85 },
    mace:    { shR: [-0.5, 0, -0.1], elR: [-0.8, 0, 0], shL: [-0.5, 0, 0.1], elL: [-1.2, 0, 0], curlR: 0.85, curlL: 0.6 },
    point:   { shR: [-1.45, 0, -0.1], elR: [-0.05, 0, 0], curlR: 0.7, head: [0.0, 0, 0] },
    bless:   { shR: [-0.45, 0, -0.95], elR: [-1.0, 0, 0], curlR: 0.0 }
  };
})();
