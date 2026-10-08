/* ============================================================
   MahaNiti 3D — scenes + stage controller.
   Scenes: hero, kurukshetra (chariot), court (Hastinapura sabha),
           dice (Sabha dice hall), gallery (sculpture showcase)
   Every scene exposes react(choiceKey) so the game can animate it.
   ============================================================ */
(function () {
  "use strict";
  if (!window.MN3D) return;
  const T = THREE, M = MN3D.mat, W = MN3D.world, U = MN3D.util, mesh = MN3D.mesh, sph = MN3D.sph;
  const low = () => !!MN3D.forceLow || matchMedia("(max-width: 760px)").matches || (navigator.hardwareConcurrency || 8) <= 4;

  /* ───────────── stage (single shared WebGL renderer) ───────────── */
  function createStage() {
    let renderer, canvas, cur = null, raf = 0, host = null, ro = null, io = null, visible = true, last = 0, time = 0, envCache = {};
    let drag = null, idleAt = 0, shakeAmt = 0;
    const cam = { az: 0, pol: 1.3, rad: 10, tx: 0, ty: 1.5, tz: 0 };       // current
    const dst = { az: 0, pol: 1.3, rad: 10, tx: 0, ty: 1.5, tz: 0 };       // destination

    function ensure() {
      if (renderer) return;
      renderer = new T.WebGLRenderer({ antialias: !low(), powerPreference: "high-performance" });
      renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = !MN3D.forceLow; renderer.shadowMap.type = T.PCFSoftShadowMap;
      canvas = renderer.domElement; canvas.className = "mn-canvas"; canvas.setAttribute("aria-label", "Interactive 3D view. Drag to rotate.");
      canvas.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); canvas.classList.add("grab"); });
      canvas.addEventListener("pointermove", (e) => {
        if (!cur) return;
        if (drag) {
          const o = cur.orbit; dst.az -= (e.clientX - drag.x) * 0.006; dst.pol = U.clamp(dst.pol - (e.clientY - drag.y) * 0.004, o.minPol || 0.45, o.maxPol || 1.7);
          if (o.azRange) dst.az = U.clamp(dst.az, o.az0 - o.azRange, o.az0 + o.azRange);
          drag = { x: e.clientX, y: e.clientY }; idleAt = time + 2.5;
        } else if (cur.orbit.parallax) { const r = canvas.getBoundingClientRect(); cur.par = { x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 }; }
      });
      const up = () => { drag = null; canvas.classList.remove("grab"); };
      canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
      document.addEventListener("visibilitychange", () => { if (!document.hidden) { last = performance.now(); } });
    }

    function applyOrbit(o) { ["az", "pol", "rad"].forEach((k) => (cam[k] = dst[k] = o[k])); cam.tx = dst.tx = o.target[0]; cam.ty = dst.ty = o.target[1]; cam.tz = dst.tz = o.target[2]; o.az0 = o.az; }

    function size() {
      if (!host) return; const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, low() ? 1.5 : 2)); renderer.setSize(w, h, false);
      canvas.style.width = "100%"; canvas.style.height = "100%";
      if (cur) { cur.camera.aspect = w / h; cur.camera.fov = (cur.fov || 38) * (w / h < 0.9 ? 1.35 : 1); cur.camera.updateProjectionMatrix(); }
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!cur || !visible || document.hidden) { last = now; return; }
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; time += dt;
      const o = cur.orbit;
      if (o.auto && !drag && time > idleAt) dst.az += o.auto * dt;
      if (o.sway && !drag && time > idleAt) dst.az = o.az0 + Math.sin(time * o.swaySpeed) * o.sway;
      const k = 1 - Math.exp(-dt * (o.damp || 4));
      ["az", "pol", "rad", "tx", "ty", "tz"].forEach((n) => (cam[n] += (dst[n] - cam[n]) * k));
      const par = cur.par || { x: 0, y: 0 }, pz = o.parallax ? 1 : 0;
      const az = cam.az + par.x * 0.25 * pz, pol = cam.pol + par.y * 0.08 * pz, sp = Math.sin(pol);
      const c = cur.camera; c.position.set(cam.tx + cam.rad * sp * Math.sin(az), cam.ty + cam.rad * Math.cos(pol), cam.tz + cam.rad * sp * Math.cos(az));
      if (shakeAmt > 0.0005) { c.position.x += (Math.random() - 0.5) * shakeAmt; c.position.y += (Math.random() - 0.5) * shakeAmt; shakeAmt *= 0.9; }
      c.lookAt(cam.tx, cam.ty, cam.tz);
      cur.update(dt, time);
      renderer.render(cur.scene, c);
      if (!host.dataset.ready) { host.dataset.ready = "1"; host.classList.add("ready"); }
    }

    const api = {
      supported: true,
      mount(el, builder, opts) {
        ensure(); api.unmount(); host = el; host.dataset.ready = ""; host.classList.remove("ready");
        host.appendChild(canvas);
        try { cur = builder({ renderer: renderer, stage: api, envCache: envCache }, opts || {}); }
        catch (e) { console.error("MahaNiti 3D scene failed", e); host.classList.add("failed"); cur = null; return null; }
        host.classList.remove("failed");
        applyOrbit(cur.orbit); idleAt = 0;
        size(); ro = new ResizeObserver(size); ro.observe(host);
        io = new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0.02 }); io.observe(host);
        last = performance.now(); if (!raf) raf = requestAnimationFrame(frame);
        return cur;
      },
      unmount() {
        if (ro) ro.disconnect(); if (io) io.disconnect(); ro = io = null;
        if (cur) { try { cur.dispose && cur.dispose(); } catch (e) {} cur.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
        cur = null; if (renderer) renderer.toneMappingExposure = 1.05;
        if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
        if (raf) { cancelAnimationFrame(raf); raf = 0; } host = null;
      },
      fly(to, damp) {
        if (!cur) return; ["az", "pol", "rad"].forEach((k) => { if (to[k] != null) dst[k] = to[k]; });
        if (to.target) { dst.tx = to.target[0]; dst.ty = to.target[1]; dst.tz = to.target[2]; }
        cur.orbit.damp = damp || 2.2; idleAt = time + 4;
      },
      shake(a) { shakeAmt = a; },
      destroy() { api.unmount(); if (renderer) { renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) {} renderer = null; canvas = null; } },
      get current() { return cur; },
      get debug() { return { cam: cam, dst: dst, time: time, idleAt: idleAt }; }
    };
    return api;
  }
  MN3D.createStage = createStage; const stage = (MN3D.stage = createStage());

  /* ───────────── shared scene rig ───────────── */
  function rig(ctx, o) {
    const scene = new T.Scene(), camera = new T.PerspectiveCamera(o.fov || 38, 1, 0.1, 900);
    const updaters = [], figs = {}; const R = ctx.renderer;
    const key = o.envKey || "default";
    if (!ctx.envCache[key]) ctx.envCache[key] = W.environment(R, o.env[0], o.env[1], o.env[2]);
    scene.environment = ctx.envCache[key];
    scene.userData.envIntensity = 1;
    const hemi = new T.HemisphereLight(o.hemi[0], o.hemi[1], o.hemi[2]); scene.add(hemi);
    const sun = new T.DirectionalLight(o.sun[0], o.sun[1]); sun.position.set(...o.sunPos); sun.castShadow = !MN3D.forceLow;
    const ss = low() ? 1024 : 2048; sun.shadow.mapSize.set(ss, ss); const sc = o.shadow || 14;
    Object.assign(sun.shadow.camera, { left: -sc, right: sc, top: sc, bottom: -sc, near: 1, far: 140 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
    sun.target.position.set(...(o.sunTarget || [0, 0, 0])); scene.add(sun, sun.target);
    let fill = null; if (o.fill) { fill = new T.DirectionalLight(o.fill[0], o.fill[1]); fill.position.set(...o.fillPos); scene.add(fill); }
    if (o.fog) scene.fog = new T.FogExp2(o.fog[0], o.fog[1]);
    const moodT = { hemi: o.hemi[2], sun: o.sun[1], exposure: 1.05, sunCol: new T.Color(o.sun[0]), fill: o.fill ? o.fill[1] : 0 };
    const moodBase = { hemi: o.hemi[2], sun: o.sun[1], exposure: 1.05, sunCol: new T.Color(o.sun[0]), fill: o.fill ? o.fill[1] : 0 };
    const api = {
      scene, camera, fov: o.fov || 38, orbit: Object.assign({ az: 0, pol: 1.3, rad: 10, target: [0, 1.5, 0], damp: 4 }, o.orbit), figs, hemi, sun, fill,
      add(obj) { scene.add(obj); obj.traverse((c) => { if (c.userData && typeof c.userData.update === "function") updaters.push(c.userData.update); }); return obj; },
      fig(id, over, pos, yaw, pose) {
        const f = MN3D.figure(id, over); f.position.set(...pos); f.userData.baseYaw = 0; f.userData.pose(pose || "base", 8); f.userData.set({ yaw: yaw || 0 }, 8); f.userData.snap(yaw || 0); api.add(f); figs[(over && over.key) || id] = f; return f;
      },
      mood(m) { Object.assign(moodT, m); if (m.sunCol != null) moodT.sunCol = new T.Color(m.sunCol); },
      resetMood() { Object.assign(moodT, moodBase, { sunCol: moodBase.sunCol.clone() }); },
      update(dt, t) {
        const k = 1 - Math.exp(-dt * 2.5);
        hemi.intensity += (moodT.hemi - hemi.intensity) * k; sun.intensity += (moodT.sun - sun.intensity) * k; sun.color.lerp(moodT.sunCol, k);
        if (fill) fill.intensity += (moodT.fill - fill.intensity) * k;
        R.toneMappingExposure += (moodT.exposure - R.toneMappingExposure) * k;
        for (let i = 0; i < updaters.length; i++) updaters[i](dt, t);
        if (api.tick) api.tick(dt, t);
      },
      dispose() { },
      react() { }
    };
    return api;
  }
  const P = (id, over, pos, yaw, pose, s) => ({ id, over, pos, yaw, pose, s });

  /* ───────────── KURUKSHETRA / CHARIOT (hero + round 2) ───────────── */
  function kurukshetra(ctx, o) {
    const stage = ctx.stage; const hero = !!o.hero;
    const s = rig(ctx, {
      env: [0x3a3f6a, 0xe89a62, 0xf3c37a], envKey: "dusk", hemi: [0xffd6a8, 0x5a4026, 0.7], sun: [0xffc58a, 2.4], sunPos: [-40, 18, -10], sunTarget: [0, 1, 2], shadow: 12,
      fill: [0xa8c0ff, 0.55], fillPos: [24, 16, 26], fog: [0xe9a672, 0.0085], fov: hero ? 34 : 36,
      orbit: hero ? { az: 0.95, pol: 1.4, rad: 8.6, target: [0.1, 1.9, 2.2], sway: 0.32, swaySpeed: 0.12, parallax: true, minPol: 1.1, maxPol: 1.6, azRange: 1.4 }
                  : { az: 0.95, pol: 1.38, rad: 9.2, target: [0.1, 1.7, 1.0], azRange: 1.5, minPol: 1.05, maxPol: 1.6 }
    });
    s.scene.background = new T.Color(0xe9a672);
    s.add(W.sky({ top: 0x2c3262, mid: 0xe0865a, bottom: 0xf3c37a, sun: [-1, 0.2, -0.25], sunColor: 0xffd9a0, sunSize: 180 }));
    s.add(W.ground({ a: "#bd9462", b: "#6c4f31", rep: 70 })); s.add(W.hills(0x6a5a4a, 14, 190));
    const armyCount = low() ? 22 : 44;
    const a1 = W.army(armyCount, { x: -34, z: -14 }, 0xcfc3a3, Math.PI / 2); a1.rotation.y = 0; s.add(a1);
    const a2 = W.army(armyCount, { x: 34, z: -14 }, 0x8f3a2a, -Math.PI / 2); s.add(a2);
    const ch = W.chariot(); s.add(ch); s.chariot = ch;
    [-1.2, -0.4, 0.4, 1.2].forEach((x, i) => { const h = W.horse({ phase: i * 0.9 }); h.position.set(x, 0, 4.4); s.add(h); });
    // reins
    [-1.2, -0.4, 0.4, 1.2].forEach((x) => s.scene.add(MN3D.geo.tube([[0.2 + x * 0.05, 1.42, 0.9], [x * 0.6, 1.75, 2.8], [x, 2.1, 4.9]], 0.007, M.gold, 12)));
    const K = s.fig("krishna", {}, [0.25, 0.63, 0.35], 0, "reins");
    const A = s.fig("arjuna", {}, [-0.35, 0.63, -0.25], 0.32, "bow_hold");
    s.add(W.dust(low() ? 50 : 110, [60, 14, 60], 0xffd9a0, 0.09));
    const light = new T.SpotLight(0xffe2a8, 0, 30, 0.4, 0.6, 1.2); light.position.set(2, 14, 6); light.target.position.set(0, 1.6, 0.3); s.scene.add(light, light.target); light.castShadow = false;
    s.react = function (key) {
      s.resetMood(); light.intensity = 0; const kp = K.userData, ap = A.userData; kp.pose("reins", 4); ap.pose("bow_hold", 4); kp.set({ yaw: 0 }); ap.set({ yaw: 0.32 });
      const A_ = ap, K_ = kp;
      if (key === "A") { A_.pose("bow_draw", 6); A_.set({ yaw: -0.2 }); K_.pose("reins", 4, { head: [0, 0.4, 0] }); s.mood({ sunCol: 0xff8a5a, exposure: 1.0, hemi: 0.45 }); stage.shake(0.08); stage.fly({ az: 0.55, rad: 6.2, pol: 1.42, target: [-0.1, 1.8, 0.1] }); }
      if (key === "B") { A_.pose("open", 3, { head: [0.05, 0.5, 0] }); A_.set({ yaw: 0.9 }); K_.pose("teach", 3); K_.set({ yaw: -0.85 }); light.intensity = 90; s.mood({ sunCol: 0xffe2b0, sun: 3, exposure: 1.18, hemi: 0.95 }); stage.fly({ az: 0.2, rad: 5.4, pol: 1.38, target: [-0.05, 1.75, 0.05] }); }
      if (key === "C") { A_.pose("slump", 2); K_.pose("open", 3, { head: [0.2, 0, 0] }); K_.set({ yaw: -0.5 }); s.mood({ sunCol: 0x9aa6c4, sun: 1.2, exposure: 0.85, hemi: 0.4 }); stage.fly({ az: 0.9, rad: 6.3, pol: 1.3, target: [-0.3, 1.5, 0.1] }); }
      if (key === "D") { A_.pose("open", 3, { head: [0.1, -0.7, 0] }); A_.set({ yaw: 1.2 }); K_.pose("point", 3); K_.set({ yaw: 0.9 }); s.mood({ sunCol: 0xffc58a, exposure: 0.95 }); stage.fly({ az: 1.6, rad: 6.8, pol: 1.4, target: [0, 1.7, 0.1] }); }
    };
    s.reset = function () { s.react("none"); stage.fly({ az: s.orbit.az0, pol: s.orbit.pol, rad: s.orbit.rad, target: s.orbit.target }); };
    s.tick = function (dt, t) { if (hero) { ch.userData.wheels.forEach((w) => (w.rotation.x += dt * 0.0)); } };
    return s;
  }

  /* ───────────── HASTINAPURA SABHA (round 1) ───────────── */
  function court(ctx, o) {
    const stage = ctx.stage;
    const s = rig(ctx, {
      env: [0x6a5a48, 0xd9b27a, 0x8a6a40], envKey: "court", hemi: [0xffe2b8, 0x6b4a2a, 0.75], sun: [0xffd9a0, 1.6], sunPos: [-9, 14, 8], sunTarget: [0, 0, -2], shadow: 14,
      fill: [0xffc88a, 0.5], fillPos: [10, 6, 12], fog: [0x3a2a1c, 0.012], fov: 38,
      orbit: { az: 0.38, pol: 1.4, rad: 16.5, target: [0, 1.7, -3.4], azRange: 0.95, minPol: 1.15, maxPol: 1.62 }
    });
    s.scene.background = new T.Color(0x2a1d12);
    s.add(W.hall({ w: 22, d: 28, h: 8.4, cols: 5 }));
    const th = W.throne(); th.position.set(0, 0, -11.5); s.add(th);
    [-6, 6].forEach((x) => { const l = W.lamp(); l.position.set(x, 6.4, -2); l.userData.base = 2.0; s.add(l); });
    const l3 = W.lamp(); l3.position.set(0, 6.4, -8); l3.userData.base = 2.4; s.add(l3);
    const sh = W.shaft(0xffe0a8, 2.2, 8, 0.07); sh.position.set(-5, 4, -4); sh.rotation.z = -0.25; s.add(sh);
    s.add(W.dust(low() ? 40 : 90, [18, 8, 22], 0xffe2a8, 0.07));

    const D = s.fig("dhritarashtra", {}, [0, 0.99, -11.4], 0, "rest");
    const B = s.fig("bhishma", {}, [-4.1, 0, -6.4], 0.3, "base");
    const V = s.fig("vidura", {}, [4.1, 0, -6.4], -0.3, "base");
    const Du = s.fig("duryodhana", {}, [-2.5, 0, -1.1], 0.55, "mace");
    const K = s.fig("krishna", {}, [0.2, 0, 1.3], 2.7, "folded");
    [[-6.2, -3.8, 1.15], [6.2, -3.8, -1.15]].forEach((p, i) => s.fig("king", { lite: true, key: "k" + i, cloth: [0xd5c08a, 0xb78a4a, 0xc8b074, 0x9aa070][i], gem: [0x8a2a2a, 0x2d8a5a, 0x2a7fd4, 0xe0a21a][i] }, [p[0], 0.03, p[1]], p[2], "rest"));
    const kings = ["k0", "k1"].map((k) => s.figs[k]);

    s.react = function (key) {
      s.resetMood(); const reset = () => { [B, V, D, Du, K].forEach((f) => f.userData.pose("base", 4)); D.userData.pose("rest", 4); Du.userData.pose("mace", 4); Du.userData.set({ yaw: 0.55 }); K.userData.set({ yaw: 2.7 }); B.userData.set({ yaw: 0.3 }); V.userData.set({ yaw: -0.3 }); };
      reset(); kings.forEach((k) => k.userData.pose("rest", 3));
      if (key === "A") { K.userData.pose("speak", 4); K.userData.set({ yaw: 2.9 }); B.userData.pose("bless", 3); D.userData.pose("rest", 3, { head: [0.0, 0.0, 0.0] }); Du.userData.pose("folded", 3); s.mood({ sunCol: 0xffe2a8, sun: 2.4, hemi: 1.0, exposure: 1.15 }); stage.fly({ az: 0.12, rad: 7.2, pol: 1.4, target: [0.1, 1.75, -0.2] }); }
      if (key === "B") { Du.userData.pose("mace", 3, { shR: [-1.4, 0, -0.3] }); K.userData.pose("base", 3); K.userData.set({ yaw: 2.2 }); kings.forEach((k) => k.userData.pose("folded", 3)); s.mood({ sunCol: 0xff6a3a, sun: 2.0, hemi: 0.45, exposure: 0.95 }); stage.shake(0.06); stage.fly({ az: -0.3, rad: 8.5, pol: 1.38, target: [-1.0, 1.7, -1.4] }); }
      if (key === "C") { K.userData.pose("base", 3, { head: [0.25, 0, 0] }); K.userData.set({ yaw: 3.0 }); B.userData.pose("slump", 2); V.userData.pose("slump", 2); D.userData.pose("slump", 2); s.mood({ sunCol: 0xa8b0c8, sun: 1.0, hemi: 0.4, exposure: 0.8 }); stage.fly({ az: 0.6, rad: 13.5, pol: 1.3, target: [0, 1.6, -3] }); }
      if (key === "D") { Du.userData.pose("folded", 3, { head: [0, -0.2, 0] }); Du.userData.set({ yaw: -2.4 }); K.userData.pose("plea", 3); K.userData.set({ yaw: 2.2 }); s.mood({ sunCol: 0xffb67a, sun: 1.5, hemi: 0.6, exposure: 0.95 }); stage.fly({ az: 0.9, rad: 8.4, pol: 1.38, target: [-1.0, 1.7, -0.4] }); }
    };
    s.reset = function () { s.react("none"); stage.fly({ az: s.orbit.az0, pol: s.orbit.pol, rad: s.orbit.rad, target: s.orbit.target }); };
    s.react("none");
    return s;
  }

  /* ───────────── DICE HALL (round 3) ───────────── */
  function dice(ctx, o) {
    const stage = ctx.stage;
    const s = rig(ctx, {
      env: [0x5a4a3e, 0xd0a26a, 0x6a4a2a], envKey: "dice", hemi: [0xffd9a8, 0x4a3320, 0.6], sun: [0xffcf94, 1.5], sunPos: [-7, 12, 7], sunTarget: [0, 0, -1], shadow: 12,
      fill: [0xffb070, 0.35], fillPos: [8, 5, 10], fog: [0x2a1c12, 0.014], fov: 38,
      orbit: { az: 0.5, pol: 1.3, rad: 10.8, target: [0, 1.2, -0.6], azRange: 1.0, minPol: 1.0, maxPol: 1.6 }
    });
    s.scene.background = new T.Color(0x24180f);
    s.add(W.hall({ w: 20, d: 24, h: 8, cols: 4 }));
    const th = W.throne(); th.scale.setScalar(0.9); th.position.set(0, 0, -10); s.add(th);
    // rug + board
    const rug = mesh(new T.CircleGeometry(4.2, 48), M.cloth(0x2a4d6a, { rep: 5 }), 0, 0.02, 0); rug.rotation.x = -Math.PI / 2; s.add(rug);
    const rg = mesh(new T.RingGeometry(3.9, 4.1, 48), M.gold, 0, 0.025, 0); rg.rotation.x = -Math.PI / 2; s.add(rg);
    const table = mesh(new T.BoxGeometry(2.2, 0.42, 2.2), M.stone("bronze"), 0, 0.21, 0); s.add(table);
    const bc = document.createElement("canvas"); bc.width = bc.height = 256; const bx = bc.getContext("2d"); bx.fillStyle = "#e9d6a8"; bx.fillRect(0, 0, 256, 256);
    bx.fillStyle = "#a8322b"; bx.fillRect(86, 0, 84, 256); bx.fillRect(0, 86, 256, 84); bx.strokeStyle = "#3a2410"; bx.lineWidth = 2;
    for (let i = 0; i <= 3; i++) { bx.beginPath(); bx.moveTo(86 + i * 28, 0); bx.lineTo(86 + i * 28, 256); bx.moveTo(0, 86 + i * 28); bx.lineTo(256, 86 + i * 28); bx.stroke(); }
    bx.fillStyle = "#e9d6a8"; bx.fillRect(86, 86, 84, 84); bx.strokeRect(86, 86, 84, 84);
    const bt = new T.CanvasTexture(bc); bt.encoding = T.sRGBEncoding; bt.anisotropy = 8;
    const board = mesh(new T.PlaneGeometry(2.0, 2.0), new T.MeshStandardMaterial({ map: bt, roughness: 0.5 }), 0, 0.425, 0); board.rotation.x = -Math.PI / 2; s.add(board);
    // coin stacks (stakes)
    const coins = []; [[-0.7, -0.7], [0.7, 0.7], [0.7, -0.7]].forEach((p, i) => { for (let c = 0; c < 6 + i * 3; c++) { const coin = mesh(new T.CylinderGeometry(0.1, 0.1, 0.025, 20), M.gold, p[0], 0.45 + c * 0.027, p[1]); coins.push(coin); s.add(coin); } });
    const goldLight = new T.PointLight(0xffc040, 0, 5, 2); goldLight.position.set(0, 1.4, 0); s.scene.add(goldLight);
    // dice animation
    const d1 = W.die(0.16), d2 = W.die(0.16); s.add(d1); s.add(d2); const dState = { t: 99, a: new T.Vector3(), b: new T.Vector3() };
    function roll() { dState.t = 0; dState.a.set(Math.random() * 6, Math.random() * 6, Math.random() * 6); dState.b.set(Math.random() * 6, Math.random() * 6, Math.random() * 6); }
    d1.position.set(-0.25, 0.52, 0.1); d2.position.set(0.2, 0.52, -0.1);
    [-1, 1].forEach((x, i) => { const l = W.lamp(); l.position.set(x * 5, 6, -1 + i); l.userData.base = 2.2; s.add(l); });
    s.add(W.dust(low() ? 40 : 80, [16, 7, 20], 0xffe2a8, 0.06));

    const Y = s.fig("yudhishthira", { seated: true, scale: 0.93 }, [-2.0, 0.03, 0.15], Math.PI / 2, "rest");
    const S = s.fig("shakuni", {}, [2.0, 0.03, 0.15], -Math.PI / 2, "rest");
    const Du = s.fig("duryodhana", {}, [3.2, 0, -2.2], -2.3, "folded");
    const V = s.fig("vidura", {}, [-3.6, 0, -3.0], 0.55, "base");
    const Dh = s.fig("dhritarashtra", {}, [0, 0.9, -9.9], 0, "rest");
    const kings = [];
    [[-6.5, -2, 1.4], [6.5, -2, -1.4]].forEach((p, i) => kings.push(s.fig("king", { lite: true, key: "k" + i, cloth: [0xd5c08a, 0xb78a4a, 0xc8b074, 0x9aa070, 0xa9805a, 0xd1b98a][i], gem: [0x8a2a2a, 0x2d8a5a, 0x2a7fd4, 0xe0a21a, 0x8a2a2a, 0x2d8a5a][i] }, [p[0], 0.03, p[1]], p[2], "rest")));
    s.tick = function (dt, t) {
      if (dState.t < 2) {
        dState.t += dt; const k = dState.t / 1.1, h = Math.max(0, Math.sin(Math.min(k, 1) * Math.PI)) * (1 - Math.min(k, 1) * 0.6) * 0.9;
        [[d1, dState.a, -0.25, 0.1], [d2, dState.b, 0.2, -0.1]].forEach(([d, r, x, z]) => { const f = Math.max(0, 1 - k); d.position.set(x + Math.sin(k * 5) * 0.2 * f, 0.52 + h, z + Math.cos(k * 4) * 0.2 * f); d.rotation.set(r.x * f, r.y * f, r.z * f); });
      } else if (Math.random() < dt * 0.1) roll();
      coins.forEach((c, i) => { c.rotation.y += 0; });
    };
    s.roll = roll; roll();
    const resetPoses = () => { Y.userData.pose("rest", 4); S.userData.pose("rest", 4); Du.userData.pose("folded", 4); Du.userData.set({ yaw: -2.3 }); V.userData.pose("base", 4); V.userData.set({ yaw: 0.55 }); kings.forEach((k) => k.userData.pose("rest", 3)); S.userData.set({ yaw: -Math.PI / 2 }); Y.userData.set({ yaw: Math.PI / 2 }); goldLight.intensity = 0; };
    s.react = function (key) {
      s.resetMood(); resetPoses();
      if (key === "A") { kings.forEach((k) => { k.userData.pose("folded", 3); k.userData.set({ yaw: k.userData.baseYaw || 0 }); }); Du.userData.pose("point", 3); Du.userData.set({ yaw: -2.0 }); Y.userData.pose("slump", 2); s.mood({ sunCol: 0xff9a5a, sun: 1.0, hemi: 0.45, exposure: 0.9 }); roll(); stage.fly({ az: 0.2, rad: 7.4, pol: 1.3, target: [0, 1.2, -0.3] }); }
      if (key === "B") { V.userData.pose("warn", 4); V.userData.set({ yaw: 0.9 }); S.userData.pose("folded", 3); Y.userData.pose("rest", 3, { head: [0.1, 0, 0] }); Du.userData.pose("point", 3); s.mood({ sunCol: 0xffe2b0, sun: 2.2, hemi: 0.9, exposure: 1.12 }); stage.fly({ az: 0.0, rad: 6.8, pol: 1.34, target: [-2.2, 1.35, -1.5] }); }
      if (key === "C") { kings.forEach((k) => k.userData.pose("speak", 3, { head: [0.1, 0.0, 0] })); Du.userData.pose("folded", 3); s.mood({ sunCol: 0xd8c8a8, sun: 1.2, hemi: 0.55, exposure: 0.9 }); stage.fly({ az: 0.9, rad: 12.5, pol: 1.28, target: [0, 1.4, -2] }); }
      if (key === "D") { S.userData.pose("point", 3, { torso: [0.2, 0, 0] }); Du.userData.pose("open", 3); goldLight.intensity = 14; s.mood({ sunCol: 0xffc060, sun: 1.2, hemi: 0.5, exposure: 1.05 }); roll(); stage.fly({ az: -0.4, rad: 6.6, pol: 1.25, target: [0.4, 1.0, 0] }); }
    };
    s.reset = function () { s.react("none"); stage.fly({ az: s.orbit.az0, pol: s.orbit.pol, rad: s.orbit.rad, target: s.orbit.target }); };
    return s;
  }

  /* ───────────── SCULPTURE GALLERY ───────────── */
  function gallery(ctx, o) {
    const stage = ctx.stage;
    const ids = o.ids && o.ids.length ? o.ids : ["krishna"];
    const s = rig(ctx, {
      env: [0x2a2a38, 0xc99a62, 0x4a3524], envKey: "gallery", hemi: [0xffe6c4, 0x30221a, 0.5], sun: [0xffdcae, 2.4], sunPos: [5, 9, 7], shadow: 7,
      fill: [0x8aa4ff, 0.7], fillPos: [-8, 4, 4], fov: 32,
      orbit: { az: 0.35, pol: 1.38, rad: ids.length > 1 ? 7.0 + ids.length * 0.9 : 5.2, target: [0, 1.5, 0], auto: 0.22, damp: 4, minPol: 0.95, maxPol: 1.65 }
    });
    s.scene.background = new T.Color(0x1d1612); s.scene.fog = new T.FogExp2(0x1d1612, 0.05);
    const floor = new T.Mesh(new T.CircleGeometry(30, 64), new T.MeshStandardMaterial({ color: MN3D.lin(0x2a2018), roughness: 0.35, metalness: 0.3 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; s.add(floor);
    const halo = new T.Mesh(new T.RingGeometry(2.4, 2.46, 64), new T.MeshBasicMaterial({ color: 0xd9a93a, transparent: true, opacity: 0.5, side: T.DoubleSide })); halo.rotation.x = -Math.PI / 2; halo.position.y = 0.01; s.add(halo);
    s.add(W.dust(40, [10, 6, 10], 0xffe2a8, 0.05));
    const slots = []; const spread = ids.length > 1 ? 2.1 : 0;
    ids.forEach((id, i) => {
      const x = (i - (ids.length - 1) / 2) * spread; const ped = W.pedestal(0.75, 0.55); ped.position.set(x, 0, 0); s.add(ped);
      const f = MN3D.figure(id, { scale: 1.0 }); f.position.set(x, 0.55, 0); f.userData.pose(id === "arjuna" ? "bow_hold" : (id === "krishna" ? "teach" : (id === "bhishma" ? "bless" : "base")), 3); s.add(f); s.figs[id] = f; slots.push({ f: f, x: x });
      const seat = (MN3D.recipes[id] || {}).seated; if (seat) f.position.y = 0.55 + 0.03;
    });
    // optional GLB overrides (MN.models)
    if (window.MN && MN.models && THREE.GLTFLoader) ids.forEach((id, i) => { if (MN.models[id]) new THREE.GLTFLoader().load(MN.models[id], (g) => { const m = g.scene; const b = new T.Box3().setFromObject(m); const h = b.max.y - b.min.y; m.scale.setScalar(1.8 / h); m.position.set(slots[i].x, 0.55 - b.min.y * (1.8 / h), 0); m.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); slots[i].f.visible = false; s.scene.add(m); }, undefined, () => {}); });
    s.closeup = function (on, idx) { const sl = slots[idx || 0]; const hy = 0.55 + (sl.f.userData.recipe && sl.f.userData.recipe.seated ? 1.05 : 1.75); if (on) stage.fly({ rad: 1.9, pol: 1.5, target: [sl.x, hy, 0], az: s.orbit.az0 }, 3); else stage.fly({ rad: s.orbit.rad, pol: s.orbit.pol, target: s.orbit.target }, 3); };
    s.focus = function (idx) { const sl = slots[idx]; stage.fly({ target: [sl.x, 1.5, 0], rad: 5.2 }, 3); };
    s.react = function () { };
    return s;
  }

  MN3D.scenes = { hero: (c, o) => kurukshetra(c, Object.assign({ hero: true }, o)), kurukshetra: kurukshetra, chariot: kurukshetra, court: court, dice: dice, gallery: gallery };

  /* Fallback if the 3D library cannot load */
  MN3D.ready = true;
})();
