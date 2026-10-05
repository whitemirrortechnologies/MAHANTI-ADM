/* ============================================================
   MahaNiti 3D — world pieces: sky, environment lighting, ground,
   horses, chariot, soldiers, banners, halls, thrones, dice, dust.
   ============================================================ */
(function () {
  "use strict";
  if (!window.MN3D) return;
  const T = THREE, M = MN3D.mat, G = MN3D.geo, mesh = MN3D.mesh, sph = MN3D.sph, U = MN3D.util;
  const W = (MN3D.world = {});

  /* ───────────── sky dome (gradient + sun) ───────────── */
  W.sky = function (o) {
    o = Object.assign({ top: 0x2a2f5a, mid: 0xd9805a, bottom: 0xf3c37a, sun: [0.4, 0.12, -1], sunColor: 0xffd9a0, sunSize: 220 }, o || {});
    const mat = new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new T.Color(o.top) }, mid: { value: new T.Color(o.mid) }, bot: { value: new T.Color(o.bottom) }, sunDir: { value: new T.Vector3(...o.sun).normalize() }, sunCol: { value: new T.Color(o.sunColor) }, sunSize: { value: o.sunSize } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ",
      fragmentShader: "uniform vec3 top,mid,bot,sunCol,sunDir; uniform float sunSize; varying vec3 vP;" +
        "void main(){ float h = vP.y; vec3 c = h>0.0 ? mix(mid, top, pow(clamp(h,0.0,1.0),0.55)) : mix(mid, bot, clamp(-h*3.0,0.0,1.0));" +
        "float s = max(dot(normalize(vP), normalize(sunDir)),0.0); c += sunCol*(pow(s,sunSize)*1.6 + pow(s,8.0)*0.35 + pow(s,2.0)*0.12);" +
        "gl_FragColor = vec4(c,1.0); }"
    });
    const m = new T.Mesh(new T.SphereGeometry(400, 32, 20), mat); m.renderOrder = -10; m.userData.sky = true; return m;
  };

  /* image-based lighting from a tiny gradient scene */
  W.environment = function (renderer, top, mid, bot) {
    const s = new T.Scene();
    s.add(W.sky({ top: top, mid: mid, bottom: bot, sunSize: 60 }));
    const box = new T.Mesh(new T.PlaneGeometry(120, 60), new T.MeshBasicMaterial({ color: 0xfff1d6, side: T.DoubleSide }));
    box.position.set(40, 60, 30); box.lookAt(0, 0, 0); box.material.color.multiplyScalar(4); s.add(box);
    const pm = new T.PMREMGenerator(renderer); const rt = pm.fromScene(s, 0.03); pm.dispose();
    return rt.texture;
  };

  /* ───────────── ground ───────────── */
  W.ground = function (o) {
    o = Object.assign({ size: 400, rep: 60, a: "#b88f5c", b: "#6f5232", color: 1 }, o || {});
    const nc = MN3D.noiseCanvases(512, o.a, o.b, 41, [[8, .35], [16, .25], [32, .2], [64, .12], [128, .08]]);
    const map = MN3D.texFrom(nc.color, true, o.rep), bump = MN3D.texFrom(nc.height, false, o.rep);
    const m = new T.Mesh(new T.PlaneGeometry(o.size, o.size, 1, 1), new T.MeshStandardMaterial({ map: map, bumpMap: bump, bumpScale: 2.2, roughness: 0.96, metalness: 0 }));
    m.rotation.x = -Math.PI / 2; m.receiveShadow = true; return m;
  };

  /* distant hills */
  W.hills = function (color, n, radius) {
    const g = new T.Group(); const r = U.rng(5);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.3, d = radius * (0.9 + r() * 0.3), w = 30 + r() * 50, h = 8 + r() * 18;
      const m = new T.Mesh(new T.ConeGeometry(w, h, 7, 1), new T.MeshStandardMaterial({ color: MN3D.lin(color), roughness: 1, flatShading: true }));
      m.position.set(Math.cos(a) * d, h / 2 - 1, Math.sin(a) * d); m.scale.z = 0.7; m.rotation.y = r() * 6; g.add(m);
    }
    return g;
  };

  /* ───────────── dust / ember particles ───────────── */
  W.dust = function (count, box, color, size) {
    const geo = new T.BufferGeometry(); const pos = new Float32Array(count * 3), seed = new Float32Array(count); const r = U.rng(99);
    for (let i = 0; i < count; i++) { pos[i * 3] = (r() - 0.5) * box[0]; pos[i * 3 + 1] = r() * box[1]; pos[i * 3 + 2] = (r() - 0.5) * box[2]; seed[i] = r() * 6.28; }
    geo.setAttribute("position", new T.BufferAttribute(pos, 3));
    const c = document.createElement("canvas"); c.width = c.height = 32; const x = c.getContext("2d"); const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
    const pts = new T.Points(geo, new T.PointsMaterial({ map: new T.CanvasTexture(c), color: color || 0xffe2a8, size: size || 0.08, transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true }));
    pts.userData.update = function (dt, t) {
      const p = geo.attributes.position; for (let i = 0; i < count; i++) {
        let y = p.getY(i) + dt * (0.05 + 0.03 * Math.sin(seed[i] + t * 0.3)); if (y > box[1]) y = 0; p.setY(i, y);
        p.setX(i, p.getX(i) + Math.sin(t * 0.2 + seed[i]) * dt * 0.08);
      } p.needsUpdate = true;
    }; pts.frustumCulled = false; return pts;
  };

  /* soft light shafts (additive cones) */
  W.shaft = function (color, w, h, op) {
    const c = new T.Mesh(new T.CylinderGeometry(w * 0.12, w, h, 20, 1, true), new T.MeshBasicMaterial({ color: color, transparent: true, opacity: op || 0.08, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending }));
    c.userData.shaft = true; return c;
  };

  /* ───────────── cloth banner with waving animation ───────────── */
  W.banner = function (w, h, color, emblem) {
    const g = new T.PlaneGeometry(w, h, 14, 6); const base = g.attributes.position.array.slice();
    const cv = document.createElement("canvas"); cv.width = 256; cv.height = 128; const x = cv.getContext("2d");
    const c = new T.Color(color); x.fillStyle = "#" + c.getHexString(); x.fillRect(0, 0, 256, 128);
    x.fillStyle = "rgba(255,255,255,0.05)"; for (let i = 0; i < 128; i += 4) x.fillRect(0, i, 256, 1);
    x.strokeStyle = "#e6b84a"; x.lineWidth = 6; x.strokeRect(5, 5, 246, 118);
    if (emblem === "sun") { x.fillStyle = "#e6b84a"; x.beginPath(); x.arc(128, 64, 26, 0, 7); x.fill(); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; x.beginPath(); x.moveTo(128 + Math.cos(a) * 32, 64 + Math.sin(a) * 32); x.lineTo(128 + Math.cos(a) * 46, 64 + Math.sin(a) * 46); x.lineWidth = 5; x.stroke(); } }
    if (emblem === "mark") { x.fillStyle = "#e6b84a"; x.beginPath(); x.moveTo(128, 20); x.lineTo(160, 100); x.lineTo(96, 100); x.closePath(); x.fill(); }
    const tex = new T.CanvasTexture(cv); tex.encoding = T.sRGBEncoding;
    const m = new T.Mesh(g, new T.MeshStandardMaterial({ map: tex, side: T.DoubleSide, roughness: 0.85 }));
    m.castShadow = true;
    m.userData.update = function (dt, t) {
      const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x0 = base[i * 3], y0 = base[i * 3 + 1]; const k = (x0 + w / 2) / w; p.setZ(i, Math.sin(x0 * 3.2 - t * 3.0 + y0) * 0.09 * k + Math.sin(t * 1.7 + x0 * 5) * 0.03 * k); p.setX(i, x0 - Math.sin(x0 * 3.2 - t * 3.0) * 0.015 * k); }
      p.needsUpdate = true; g.computeVertexNormals();
    };
    return m;
  };

  /* ───────────── horse (stone, white marble) ───────────── */
  W.horse = function (o) {
    o = Object.assign({ stone: "pale", phase: 0 }, o || {});
    const mat = M.stone(o.stone, { rough: 0.55 }); const g = new T.Group();
    const body = sph(0.36, mat, 0, 1.12, 0, 0.82, 0.82, 1.9, 28, 20); g.add(body);
    g.add(sph(0.3, mat, 0, 1.2, 0.52, 0.95, 1.08, 0.95, 24, 16));      // chest
    g.add(sph(0.3, mat, 0, 1.15, -0.5, 0.95, 1.0, 0.95, 24, 16));     // haunch
    const neck = new T.Group(); neck.position.set(0, 1.4, 0.72); neck.rotation.x = 0.75; g.add(neck);
    const nk = mesh(G.limb(0.11, 0.2, 0.66, 14), mat, 0, 0.66, 0); neck.add(nk);
    const head = new T.Group(); head.position.set(0, 0.7, 0.02); neck.add(head); head.rotation.x = -1.75;
    head.add(sph(0.13, mat, 0, 0.0, 0, 0.8, 1.15, 0.95, 20, 14));                 // skull
    const snout = mesh(G.limb(0.095, 0.07, 0.3, 14), mat, 0, 0.0, 0.01); head.add(snout);   // muzzle (hangs along -Y)
    head.add(sph(0.075, mat, 0, -0.33, 0.012, 0.95, 0.8, 0.95, 12, 8));                    // nose
    [-1, 1].forEach((s) => { const e = mesh(new T.ConeGeometry(0.035, 0.13, 8), mat, s * 0.065, 0.2, -0.07); e.rotation.x = -0.5; head.add(e); head.add(sph(0.022, M.iris, s * 0.098, 0.05, 0.05, 1, 1, 0.6, 8, 6)); });
    // mane + plume
    for (let i = 0; i < 7; i++) neck.add(G.tube([[0, 0.55 - i * 0.08, -0.14], [0, 0.45 - i * 0.08, -0.22], [0.0, 0.25 - i * 0.08, -0.2]], 0.035, M.stone("sand"), 6));
    const plume = mesh(new T.ConeGeometry(0.04, 0.2, 6), M.gold, 0, 0.2, -0.06); head.add(plume);
    // harness
    const hr = mesh(new T.TorusGeometry(0.2, 0.025, 8, 24), M.gold, 0, 0.35, 0); hr.rotation.x = Math.PI / 2; neck.add(hr);
    
    // tail
    for (let i = 0; i < 6; i++) g.add(G.tube([[(i - 2.5) * 0.02, 1.25, -0.82], [(i - 2.5) * 0.03, 1.0, -1.05], [(i - 2.5) * 0.05, 0.55 - i * 0.02, -1.0]], 0.03, M.stone("sand"), 8));
    // legs
    const legs = [];
    [[-1, 0.52], [1, 0.52], [-1, -0.5], [1, -0.5]].forEach(([sx, z], i) => {
      const hip = new T.Group(); hip.position.set(sx * 0.2, 0.95, z); g.add(hip);
      hip.add(mesh(G.limb(0.1, 0.055, 0.48, 12), mat));
      const knee = new T.Group(); knee.position.y = -0.48; hip.add(knee);
      knee.add(mesh(G.limb(0.05, 0.04, 0.45, 10), mat));
      knee.add(mesh(new T.CylinderGeometry(0.058, 0.07, 0.07, 12), M.stone("bronze"), 0, -0.47, 0.01));
      legs.push({ hip, knee, i });
    });
    g.userData.update = function (dt, t) {
      const k = t * 1.4 + o.phase;
      neck.rotation.x = 0.75 + Math.sin(k) * 0.03; head.rotation.x = -1.75 + Math.sin(k * 1.3) * 0.05;
      legs.forEach((l) => { const a = Math.sin(k * 2 + l.i * 1.7); l.hip.rotation.x = (l.i === 0 ? Math.max(0, a) * 0.25 : a * 0.03); l.knee.rotation.x = (l.i === 0 ? -Math.max(0, a) * 0.55 : 0); });
    };
    g.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    return g;
  };

  /* ───────────── chariot ───────────── */
  W.chariot = function () {
    const g = new T.Group(); const wood = M.stone("bronze", { rough: 0.55 }); const gold = M.gold;
    // body: two side panels (profile extruded thin) + front panel; open at the back
    const prof = [[-0.75, 0], [0.7, 0], [0.78, 0.35], [0.82, 0.8], [0.55, 0.88], [0.5, 0.55], [-0.65, 0.5], [-0.75, 0.25]];
    const s = new T.Shape(); prof.forEach((p, i) => (i ? s.lineTo(-p[0], p[1]) : s.moveTo(-p[0], p[1]))); s.closePath();
    const eg = new T.ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 2 });
    [-1, 1].forEach((sx) => { const side = mesh(eg, wood, sx * 0.56 - 0.035, 0.55, 0); side.rotation.y = Math.PI / 2; g.add(side); });
    const front = mesh(new T.BoxGeometry(1.15, 0.55, 0.07), wood, 0, 1.0, 0.72); g.add(front);
    const rim = G.tube([[-0.56, 1.43, 0.55], [-0.4, 1.46, 0.78], [0.4, 1.46, 0.78], [0.56, 1.43, 0.55]], 0.03, gold, 20); g.add(rim);
    // floor plate
    g.add(mesh(new T.BoxGeometry(1.1, 0.06, 1.5), M.stone("sand"), 0, 0.575, -0.02));
    // gold trim rails
    const rail = G.tube([[-0.58, 1.35, -0.7], [-0.58, 1.4, 0.25], [-0.45, 1.4, 0.75], [0.45, 1.4, 0.75], [0.58, 1.4, 0.25], [0.58, 1.35, -0.7]], 0.025, gold, 40); g.add(rail);
    // axle + wheels
    g.add(mesh(new T.CylinderGeometry(0.05, 0.05, 1.9, 12), wood, 0, 0.62, 0.0)); g.children[g.children.length - 1].rotation.z = Math.PI / 2;
    const wheels = [];
    [-1, 1].forEach((sx) => {
      const w = new T.Group(); w.position.set(sx * 0.98, 0.62, 0);
      const rim = mesh(new T.TorusGeometry(0.6, 0.055, 12, 48), wood); rim.rotation.y = Math.PI / 2; w.add(rim);
      const rim2 = mesh(new T.TorusGeometry(0.6, 0.02, 8, 48), gold, sx * 0.06, 0, 0); rim2.rotation.y = Math.PI / 2; w.add(rim2);
      const hub = mesh(new T.CylinderGeometry(0.1, 0.1, 0.18, 16), gold); hub.rotation.z = Math.PI / 2; w.add(hub);
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; const sp = mesh(new T.CylinderGeometry(0.014, 0.02, 0.5, 6), wood, 0, Math.sin(a) * 0.35, Math.cos(a) * 0.35); sp.rotation.x = a; w.add(sp); }
      wheels.push(w); g.add(w);
    });
    // pole + yoke
    const pole = mesh(new T.CylinderGeometry(0.035, 0.05, 3.2, 10), wood, 0, 0.78, 1.9); pole.rotation.x = Math.PI / 2 - 0.05; g.add(pole);
    const yoke = mesh(new T.CylinderGeometry(0.03, 0.03, 3.5, 8), gold, 0, 1.0, 3.35); yoke.rotation.z = Math.PI / 2; g.add(yoke);
    // banner pole
    const bp = mesh(new T.CylinderGeometry(0.02, 0.026, 3.2, 8), gold, -0.45, 3.0, -0.45); g.add(bp);
    const flag = W.banner(1.3, 0.85, 0xe87a1a, "sun"); flag.position.set(-0.45 - 0.68, 4.3, -0.45); flag.rotation.y = 0; g.add(flag);
    g.add(sph(0.05, gold, -0.45, 4.6, -0.45));
    g.userData.wheels = wheels; g.userData.flag = flag;
    g.userData.update = function (dt, t) { flag.userData.update(dt, t); };
    g.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    return g;
  };

  /* ───────────── soldiers (instanced) ───────────── */
  W.army = function (count, area, color, facing) {
    const g = new T.Group(); const r = U.rng(17 + count);
    const body = new T.CylinderGeometry(0.17, 0.3, 1.25, 8), head = new T.SphereGeometry(0.15, 10, 8), spear = new T.CylinderGeometry(0.014, 0.014, 2.8, 4);
    const mb = new T.InstancedMesh(body, M.cloth(color), count), mh = new T.InstancedMesh(head, M.stone("tan"), count), ms = new T.InstancedMesh(spear, M.stone("bronze"), count);
    const d = new T.Object3D();
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / 22), col = i % 22; const x = area.x + (col - 11) * 1.1 + (r() - 0.5) * 0.3, z = area.z + row * 1.3 + (r() - 0.5) * 0.3, s = 0.9 + r() * 0.2;
      d.position.set(x, 0.62 * s, z); d.scale.setScalar(s); d.rotation.set(0, facing, 0); d.updateMatrix(); mb.setMatrixAt(i, d.matrix);
      d.position.set(x, 1.45 * s, z); d.updateMatrix(); mh.setMatrixAt(i, d.matrix);
      d.position.set(x + 0.3, 1.4 * s, z); d.scale.setScalar(1); d.updateMatrix(); ms.setMatrixAt(i, d.matrix);
    }
    [mb, mh, ms].forEach((m) => { m.castShadow = true; g.add(m); });
    for (let k = 0; k < 4; k++) { const b = W.banner(1.0, 0.65, k % 2 ? 0xe87a1a : 0xb0262e, k % 2 ? "sun" : "mark"); b.position.set(area.x + (k - 1.5) * 7 + 0.55, 5.2, area.z + 2); g.add(b); const p = mesh(new T.CylinderGeometry(0.02, 0.025, 4.2, 6), M.gold, area.x + (k - 1.5) * 7, 3.1, area.z + 2); g.add(p); }
    return g;
  };

  /* ───────────── halls ───────────── */
  W.column = function (h, r) {
    const g = new T.Group(); const mat = M.stone("pale", { rep: 1 }), gold = M.gold;
    const shaft = G.lathe([[r * 1.9, 0], [r * 1.9, 0.18], [r * 1.35, 0.3], [r * 1.12, 0.5], [r, 0.9], [r * 0.98, h * 0.5], [r * 0.92, h - 0.8], [r * 1.1, h - 0.55], [r * 1.4, h - 0.4], [r * 1.9, h - 0.25], [r * 1.9, h]], 28, true);
    const sp = shaft.attributes.position; for (let i = 0; i < sp.count; i++) { const x = sp.getX(i), y = sp.getY(i), z = sp.getZ(i); const a = Math.atan2(z, x); const k = (y > 0.8 && y < h - 0.9) ? 1 + 0.035 * Math.cos(a * 12) : 1; sp.setXYZ(i, x * k, y, z * k); }
    shaft.computeVertexNormals(); g.add(mesh(shaft, mat));
    [0.6, h - 0.7].forEach((y) => { const t = mesh(new T.TorusGeometry(r * 1.02, r * 0.07, 8, 28), gold, 0, y, 0); t.rotation.x = Math.PI / 2; g.add(t); });
    return g;
  };
  /** Hall shell. Returns group; options for size */
  W.hall = function (o) {
    o = Object.assign({ w: 22, d: 28, h: 8, cols: 5 }, o || {});
    const g = new T.Group();
    const fl = MN3D.noiseCanvases(256, "#ecdcba", "#c9ae7e", 31);
    const fm = MN3D.texFrom(fl.color, true, 10), fb = MN3D.texFrom(fl.height, false, 10);
    // checkered inlay
    const cc = document.createElement("canvas"); cc.width = cc.height = 256; const cx = cc.getContext("2d");
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { cx.fillStyle = (i + j) % 2 ? "#e9d8b4" : "#bfa273"; cx.fillRect(i * 32, j * 32, 32, 32); cx.strokeStyle = "rgba(90,60,20,.25)"; cx.strokeRect(i * 32, j * 32, 32, 32); }
    const ct = new T.CanvasTexture(cc); ct.wrapS = ct.wrapT = T.RepeatWrapping; ct.repeat.set(o.w / 3, o.d / 3); ct.encoding = T.sRGBEncoding; ct.anisotropy = 8;
    const floor = new T.Mesh(new T.PlaneGeometry(o.w, o.d), new T.MeshStandardMaterial({ map: ct, bumpMap: fb, bumpScale: 0.6, roughness: 0.38, metalness: 0.05 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
    // walls
    const wallMat = M.stone("wall", { rep: 3 });
    const back = mesh(new T.BoxGeometry(o.w, o.h, 0.6), wallMat, 0, o.h / 2, -o.d / 2); g.add(back);
    [-1, 1].forEach((s) => g.add(mesh(new T.BoxGeometry(0.6, o.h, o.d), wallMat, s * o.w / 2, o.h / 2, 0)));
    // ceiling beams
    for (let i = 0; i < 7; i++) g.add(mesh(new T.BoxGeometry(o.w, 0.35, 0.4), M.stone("bronze"), 0, o.h - 0.1, -o.d / 2 + 2 + i * (o.d / 7)));
    g.add(mesh(new T.BoxGeometry(o.w, 0.2, o.d), M.stone("bronze"), 0, o.h + 0.1, 0));
    // columns
    for (let i = 0; i < o.cols; i++) [-1, 1].forEach((s) => { const c = W.column(o.h - 0.2, 0.34); c.position.set(s * (o.w / 2 - 3), 0, -o.d / 2 + 4 + i * ((o.d - 6) / (o.cols - 1))); g.add(c); });
    // arched niche + drapes on the back wall
    const arch = mesh(new T.TorusGeometry(3.2, 0.28, 12, 40, Math.PI), M.gold, 0, 3.6, -o.d / 2 + 0.4); g.add(arch);
    [-1, 1].forEach((s) => { const dr = mesh(new T.PlaneGeometry(2.4, o.h - 1.5, 10, 1), M.cloth(0x8f1f2b, { rep: 3 }), s * 5.6, (o.h - 1.5) / 2 + 0.8, -o.d / 2 + 0.45); const p = dr.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 4.5) * 0.14); dr.geometry.computeVertexNormals(); g.add(dr); });
    // carpet
    const carpet = mesh(new T.PlaneGeometry(3.2, o.d - 3), M.cloth(0x7c1d27, { rep: 6 }), 0, 0.012, 1); carpet.rotation.x = -Math.PI / 2; g.add(carpet);
    [-1, 1].forEach((s) => { const tr = mesh(new T.PlaneGeometry(0.22, o.d - 3), M.gold, s * 1.5, 0.016, 1); tr.rotation.x = -Math.PI / 2; g.add(tr); });
    return g;
  };

  W.throne = function () {
    const g = new T.Group(); const st = M.stone("pale"), gold = M.gold;
    [0, 1, 2].forEach((i) => g.add(mesh(new T.BoxGeometry(5 - i * 0.7, 0.22, 4 - i * 0.6), st, 0, 0.11 + i * 0.22, 0)));
    g.add(mesh(new T.BoxGeometry(1.8, 0.3, 1.4), M.cloth(0x7c1d27), 0, 0.84, 0));
    g.add(mesh(new T.BoxGeometry(1.8, 2.4, 0.3), gold, 0, 2.0, -0.7));
    const ar = mesh(new T.TorusGeometry(1.0, 0.1, 10, 36, Math.PI), M.gold, 0, 3.1, -0.55); g.add(ar);
    [-1, 1].forEach((s) => { g.add(mesh(new T.BoxGeometry(0.2, 0.6, 1.2), gold, s * 0.95, 1.2, -0.05)); g.add(sph(0.14, gold, s * 0.95, 1.55, 0.5)); });
    return g;
  };

  W.lamp = function (color) {
    const g = new T.Group(); g.add(mesh(new T.CylinderGeometry(0.008, 0.008, 1.8, 4), M.gold, 0, 0.9, 0));
    const bowl = mesh(G.lathe([[0.001, 0], [0.18, 0.04], [0.3, 0.2], [0.28, 0.24]], 20), M.gold); bowl.position.y = -0.1; g.add(bowl);
    const flame = new T.Mesh(new T.SphereGeometry(0.07, 10, 8), new T.MeshBasicMaterial({ color: 0xffc766 })); flame.scale.y = 1.8; flame.position.y = 0.1; g.add(flame);
    const light = new T.PointLight(color || 0xffb061, 1.2, 14, 1.6); light.position.y = 0.2; g.add(light);
    g.userData.update = function (dt, t) { light.intensity = (g.userData.base || 1.2) * (0.88 + 0.12 * Math.sin(t * 9 + g.id) + 0.05 * Math.sin(t * 23)); flame.scale.set(1, 1.7 + 0.25 * Math.sin(t * 14 + g.id), 1); };
    g.userData.light = light; return g;
  };

  /* dice (pips drawn on canvas) */
  W.die = function (s) {
    const mats = []; for (let f = 1; f <= 6; f++) {
      const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d"); x.fillStyle = "#f1e6c8"; x.fillRect(0, 0, 128, 128); x.fillStyle = "#2a1a10";
      const P = { 1: [[0.5, 0.5]], 2: [[0.25, 0.25], [0.75, 0.75]], 3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]], 4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]], 5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]], 6: [[0.25, 0.22], [0.75, 0.22], [0.25, 0.5], [0.75, 0.5], [0.25, 0.78], [0.75, 0.78]] };
      P[f].forEach(([a, b]) => { x.beginPath(); x.arc(a * 128, b * 128, 9, 0, 7); x.fill(); });
      const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; mats.push(new T.MeshStandardMaterial({ map: t, roughness: 0.4 }));
    }
    const m = new T.Mesh(new T.BoxGeometry(s, s, s), mats); m.castShadow = true; return m;
  };

  /* pedestal for gallery sculptures */
  W.pedestal = function (r, h) {
    const g = new T.Group(); const st = M.stone("pale", { rep: 1 });
    g.add(mesh(G.lathe([[0.001, 0], [r * 1.25, 0], [r * 1.25, h * 0.14], [r * 1.12, h * 0.2], [r * 1.0, h * 0.28], [r * 0.95, h * 0.75], [r * 1.05, h * 0.86], [r * 1.18, h * 0.9], [r * 1.18, h], [0.001, h]], 48, false), st));
    const ring = mesh(new T.TorusGeometry(r * 1.0, 0.025, 8, 48), M.gold, 0, h * 0.5, 0); ring.rotation.x = Math.PI / 2; ring.scale.set(1, 1, 1); g.add(ring);
    return g;
  };
})();
