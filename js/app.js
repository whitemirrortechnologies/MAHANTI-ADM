/* ============================================================
   MahaNiti — application: router, search, pages (everything except the game)
   Content comes exclusively from MN (js/data.js).
   ============================================================ */
(function () {
  "use strict";
  const MN = window.MN;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const key = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/sh/g, "s").replace(/aa/g, "a").replace(/ri/g, "ri");
  const uniq = (a) => Array.from(new Set(a));

  const PARVA_ALT = { "Ādi Parva": "Adi Parva", "Sabhā Parva": "Sabha Parva", "Udyoga Parva": "Udyoga Parva Bhagwat Yana Prajagara", "Bhīṣma Parva": "Bhishma Parva Bhagavad Gita", "Śānti Parva": "Shanti Parva Rajadharma" };
  const parvaNo = (name) => { const p = MN.parvas.find((x) => x.name === name); return p ? p.no : null; };
  const parvaUrl = (name) => { const p = MN.parvas.find((x) => x.name === name); return p ? p.url : null; };
  const commons = (file, w) => "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(file) + "?width=" + (w || 900);
  const byId = (id) => MN.entries.find((e) => e.id === id);
  const shortSection = (e) => e.section.split("·").pop().trim();

  /* ───────── derived data ───────── */
  const Q = {
    parvas: () => uniq(MN.entries.map((e) => e.parva)),
    characters: () => uniq([].concat(...MN.entries.map((e) => e.characters))).sort((a, b) => a.localeCompare(b)),
    categories: () => MN.categories.filter((c) => MN.entries.some((e) => e.categories.includes(c))),
    episodes: () => uniq(MN.entries.map((e) => e.episode)),
    themes: () => uniq([].concat(...MN.entries.map((e) => e.themes))).sort((a, b) => a.localeCompare(b))
  };
  MN.entries.forEach((e) => {
    e._hay = key([e.title, e.parva, PARVA_ALT[e.parva] || "", e.section, e.episode, e.passage, e.characters.join(" "), e.categories.join(" "), e.themes.join(" "), e.situation, e.decision, e.outcome, e.insight, e.maxim || "", e.modern_application].join(" "));
    e._hi = key([e.title, e.episode, e.characters.join(" "), e.parva, PARVA_ALT[e.parva] || "", e.categories.join(" "), e.themes.join(" ")].join(" "));
  });

  function search(q) {
    const toks = key(q).split(/\s+/).filter(Boolean); if (!toks.length) return MN.entries.slice();
    const out = [];
    MN.entries.forEach((e) => { let s = 0; for (const t of toks) { if (!e._hay.includes(t)) return; s += e._hi.includes(t) ? 3 : 1; } out.push([s, e]); });
    return out.sort((a, b) => b[0] - a[0]).map((x) => x[1]);
  }

  /* ───────── icons ───────── */
  const IC = {
    strategy: '<svg viewBox="0 0 24 24"><path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></svg>',
    ethics: '<svg viewBox="0 0 24 24"><path d="M12 3v18M5 21h14M5 7h14M5 7l-3 7a3.5 3.5 0 006 0zM19 7l-3 7a3.5 3.5 0 006 0z"/></svg>',
    leadership: '<svg viewBox="0 0 24 24"><path d="M3 18l2-11 5 5 2-7 2 7 5-5 2 11zM4 21h16"/></svg>',
    decision: '<svg viewBox="0 0 24 24"><path d="M12 21v-8M12 13L5 6M12 13l7-7M5 6V3M5 6H2M19 6V3M19 6h3"/></svg>',
    wheel: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26"/><circle cx="32" cy="32" r="18"/><circle cx="32" cy="32" r="4"/><path d="M32 6v52M6 32h52M14 14l36 36M50 14L14 50"/></svg>'
  };

  /* ───────── 3D viewer management ───────── */
  const hasGL = (function () { try { const c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl"))); } catch (e) { return false; } })();
  const can3D = !!(window.MN3D && hasGL);
  let live = [];
  function destroyViewers() { live.forEach((v) => { try { if (v.io) v.io.disconnect(); if (v.stage) { v.stage.unmount(); v.stage.destroy && v.stage.destroy(); } } catch (e) {} }); live = []; }
  function viewerHTML(id, scene, o) {
    o = o || {};
    return '<div class="viewer ' + (o.cls || "") + '" id="' + id + '" data-scene="' + scene + '" data-opts="' + esc(JSON.stringify(o.opts || {})) + '">' +
      '<div class="viewer-load"><div><div class="spin"></div><div class="vl-msg">' + (can3D ? "Sculpting the scene…" : "3D view unavailable") + '</div></div></div>' +
      (o.hint === false ? "" : '<div class="viewer-hint">Drag to look around</div>') +
      (o.caption ? '<div class="viewer-cap">' + esc(o.caption) + "</div>" : "") +
      (o.tools || "") + "</div>";
  }
  function mountViewer(el, scene, opts) {
    if (!can3D) { el.classList.add("failed"); const m = $(".vl-msg", el); if (m) m.innerHTML = "The interactive 3D view needs WebGL and an internet connection (it loads the Three.js library from a CDN).<br>All text content on this site still works."; const sp = $(".spin", el); if (sp) sp.remove(); return null; }
    live = live.filter((v) => { if (v.el === el && v.pending) { if (v.io) v.io.disconnect(); return false; } return true; });
    let v = live.find((x) => x.el === el);
    if (!v) { v = { el: el, stage: MN3D.createStage() }; live.push(v); }
    v.scene = v.stage.mount(el, MN3D.scenes[scene], opts || {});
    el._scene = v.scene; el._stage = v.stage; el._sceneName = scene; return v.scene;
  }
  function hydrate(root) {
    $$(".viewer[data-scene]", root || document).forEach((el) => {
      if (el.dataset.hydrated) return; el.dataset.hydrated = "1";
      let opts = {}; try { opts = JSON.parse(el.dataset.opts || "{}"); } catch (e) {}
      if (!can3D) { mountViewer(el, el.dataset.scene, opts); return; }
      const rec = { el: el, stage: null, io: null, pending: true };
      const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { io.disconnect(); requestAnimationFrame(() => { if (!document.body.contains(el)) return; mountViewer(el, el.dataset.scene, opts); el.dispatchEvent(new CustomEvent("mn-mounted")); }); } }, { rootMargin: "250px" });
      rec.io = io; live.push(rec); io.observe(el);
    });
  }
  window.MahaNiti = { hydrate: hydrate, mountViewer: mountViewer, viewerHTML: viewerHTML, esc: esc, $: $, $$: $$, byId: byId, commons: commons, key: key, routes: {}, can3D: can3D, IC: IC, toast: null, reveal: null };

  /* ───────── reusable pieces ───────── */
  const first = (s) => { const m = String(s || "").match(/^.*?[.!?](\s|$)/); return m ? m[0].trim() : s; };
  function thumb(e, w) {
    const img = e.image ? '<img loading="lazy" decoding="async" src="' + commons(e.image.file, w || 640) + '" alt="' + esc(e.image.caption) + '" onerror="this.remove()">' : "";
    return '<div class="thumb"><div class="ph">' + IC.wheel + "<div>" + esc(e.episode) + "</div></div>" + img + '<span class="chip badge">' + esc(e.category) + "</span></div>";
  }
  function entryCard(e) {
    return '<article class="ecard compact reveal"><div class="body"><div class="meta"><span class="chip cat">' + esc(e.category) + "</span> " + esc(e.parva) + "</div>" +
      '<h3><a class="stretch" href="#/episode/' + e.id + '" style="text-decoration:none;color:inherit">' + esc(e.title) + "</a></h3>" +
      '<p class="key">' + esc(e.maxim || first(e.insight)) + "</p>" +
      '<div class="actions"><span></span><a class="btn btn-primary btn-sm" href="#/episode/' + e.id + '">View Details</a></div></div></article>';
  }
  function chain(e) {
    return '<div class="src-chain" aria-label="Source chain"><b>Mahābhārata</b><span class="arr">→</span><span>' + esc(e.parva) + '</span><span class="arr">→</span><span>' + esc(e.section) + '</span><span class="arr">→</span><span>' + esc(e.episode) + " · " + esc(e.passage) + '</span><span class="arr">→</span><span>' + esc(e.translator) + " translation (" + esc(e.language) + ")</span></div>";
  }
  function citation(e) {
    return e.translator + " (tr.), " + MN.translation.work + ", " + e.parva + ", " + shortSection(e) + ", " + MN.translation.years + ". " + e.sourceUrl;
  }
  function toast(msg) { const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2200); }
  function setTitle(t) { document.title = (t ? t + " — " : "") + "MahaNiti"; }
  function reveal(root) {
    const els = $$(".reveal:not(.in)", root); if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((en) => en.forEach((x) => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { rootMargin: "0px 0px -40px 0px" });
    els.forEach((e) => io.observe(e));
  }

  /* ───────── HOME ───────── */
  function pageHome() {
    const feat = [
      { k: "strategy", t: "Strategy", d: "Weigh the act, the agent and the purpose — and the consequences — before committing.", q: "Strategy" },
      { k: "ethics", t: "Ethics", d: "Duty, fairness and legitimacy when the stakes are unequal.", q: "Ethics" },
      { k: "leadership", t: "Leadership", d: "Commitment, counsel and responsibility for those you lead.", q: "Leadership" },
      { k: "decision", t: "Decision Making", d: "Choosing under pressure, emotion and uncertainty.", q: "Decision Making" }
    ];
    const flow = [
      ["Parva", "The book of the epic", ""], ["Section", "Adhyāya / chapter", ""], ["Episode", "A passage within it", ""],
      ["Situation", "What the text describes", "k-source"], ["Insight", "What we derive", "k-insight"], ["Modern Application", "How it can inform today", "k-modern"], ["Source", "Always cited", "k-source"]
    ];
    const chars = Object.keys(MN.characters);
    return '<section class="hero"><div class="wrap hero-grid">' +
      '<div><h1>MahaNiti</h1>' +
      '<p class="sub">Ancient Wisdom. Strategic Thinking. Modern Lessons.</p>' +
      '<p class="desc">Explore strategic, ethical and leadership insights from the Mahābhārata through source-based interactive learning.</p>' +
      '<div class="hero-cta"><a class="btn btn-primary" href="#/explore">Explore Wisdom</a><a class="btn btn-gold" href="#/play">Play Dharma Decision</a></div>' +
      '</div>' +
      viewerHTML("heroViewer", "hero", { caption: "Kurukshetra — Krishna and Arjuna (3D sculptures)" }) + "</div></section>" +

      '<section class="block" style="padding-top:0"><div class="wrap"><div class="features">' +
      feat.map((f) => '<a class="card feature reveal" href="#/explore?category=' + encodeURIComponent(f.q) + '"><div class="ic">' + IC[f.k] + "</div><h3>" + f.t + "</h3></a>").join("") +
      "</div></div></section>" +

      '<section class="block" style="padding-top:1rem"><div class="wrap"><div class="sec-head"><h2>How MahaNiti Works</h2></div>' +
      '<div class="flow">' + flow.map((s, i) => '<div class="step ' + s[2] + ' reveal"><div class="n">' + (i + 1) + "</div><h4>" + s[0] + "</h4></div>").join("") + "</div>" +
      '<div class="flow-legend"><span class="chip src">Source Context</span><span class="chip ins">Derived Insight</span><span class="chip mod">Modern Application</span></div></div></section>' +

      '<section class="block" style="background:linear-gradient(180deg,transparent,rgba(230,199,118,.14),transparent)"><div class="wrap"><div class="sec-head"><h2>Featured Episodes</h2></div><div class="cards">' +
      MN.featured.map((f) => { const e = byId(f.entry); return '<article class="ecard compact reveal"><div class="body"><div class="meta">' + esc(e.parva) + "</div><h3>" + esc(f.episode) + '</h3><p class="key">' + esc(f.blurb) + '</p><div class="actions"><span></span><a class="btn btn-primary btn-sm" href="#/episode/' + e.id + '">View source</a></div></div></article>'; }).join("") +
      "</div></div></section>" +

      '<section class="block"><div class="wrap"><div class="sec-head"><h2>Meet the figures</h2></div>' +
      '<div class="gallery-grid"><div id="galHost">' + viewerHTML("galViewer", "gallery", { opts: { ids: ["krishna"] }, cls: "", tools: '<div class="viewer-tools"><button class="vt" id="galFace" type="button" aria-pressed="false">Face close-up</button></div>' }) + "</div>" +
      '<div class="card gal-panel"><div class="gal-chars" role="group" aria-label="Choose a figure">' + chars.map((c, i) => '<button type="button" data-char="' + c + '" aria-pressed="' + (i === 0) + '">' + esc(MN.characters[c].name) + "</button>").join("") + '</div><div class="gal-info" id="galInfo"></div></div></div></div></section>';
  }
  function afterHome() {
    let current = "krishna"; const host = $("#galHost"); let face = false;
    function info() {
      const c = MN.characters[current]; const rel = MN.entries.filter((e) => e.characters.some((n) => n.indexOf(c.name) === 0 || n.indexOf("(" + c.name) > -1)).slice(0, 4);
      $("#galInfo").innerHTML = "<h3>" + esc(c.name) + '</h3><p class="muted" style="margin-bottom:.8rem">' + esc(c.role) + '</p><div class="gal-links">' + (rel.length ? rel.slice(0, 2).map((e) => '<a class="btn btn-ghost btn-sm" href="#/episode/' + e.id + '">' + esc(e.title.length > 34 ? e.title.slice(0, 32) + "…" : e.title) + "</a>").join("") : '') + "</div>";
    }
    info();
    $$(".gal-chars button").forEach((b) => b.addEventListener("click", () => {
      current = b.dataset.char; face = false; $("#galFace").setAttribute("aria-pressed", "false");
      $$(".gal-chars button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); info();
      const el = $("#galViewer"); if (el._stage) { el._scene = el._stage.mount(el, MN3D.scenes.gallery, { ids: [current] }); } else { MahaNiti.mountViewer(el, "gallery", { ids: [current] }); }
    }));
    $("#galFace").addEventListener("click", (ev) => { const el = $("#galViewer"); if (!el._scene) return; face = !face; ev.currentTarget.setAttribute("aria-pressed", String(face)); el._scene.closeup(face, 0); });
  }

  /* ───────── EXPLORE ───────── */
  const FKEYS = ["q", "parva", "character", "category", "episode", "theme"];
  function parseQuery(qs) { const o = {}; (qs || "").replace(/^\?/, "").split("&").filter(Boolean).forEach((p) => { const [k, v] = p.split("="); o[decodeURIComponent(k)] = decodeURIComponent((v || "").replace(/\+/g, " ")); }); return o; }
  function pageExplore(q) {
    const st = Object.assign({}, q);
    const sel = (id, label, vals) => '<div class="field"><label for="f-' + id + '">' + label + '</label><select id="f-' + id + '" data-f="' + id + '"><option value="">All</option>' + vals.map((v) => '<option value="' + esc(v) + '"' + (st[id] === v ? " selected" : "") + ">" + esc(v) + "</option>").join("") + "</select></div>";
    return '<section class="wrap page-head"><span class="eyebrow">Knowledge repository</span><h1 style="font-size:clamp(2rem,5vw,3.2rem)">Explore Wisdom</h1><p>Pick a filter and open an entry.</p></section>' +
      '<section class="wrap"><form class="card filters" id="filters" onsubmit="return false">' +
      sel("parva", "Parva", Q.parvas()) + sel("character", "Character", Q.characters()) + sel("category", "Category", Q.categories()) + sel("episode", "Episode", Q.episodes()) + sel("theme", "Theme", Q.themes()) +
      '<button type="button" class="btn btn-ghost btn-sm clear" id="fclear">Clear</button></form>' +
      '<div class="res-bar"><div><b id="resCount"></b> <span class="muted" id="resFor"></span></div><div class="active-f" id="activeF"></div></div><div class="cards" id="results"></div><div class="empty" id="noRes" hidden><h3>No entries match these filters</h3><p>Try removing a filter.</p><button class="btn btn-primary btn-sm" type="button" id="noResClear">Clear all filters</button></div></section>';
  }
  function afterExplore(q) {
    const st = {}; FKEYS.forEach((k) => (st[k] = q[k] || ""));
    function run() {
      let list = search(st.q);
      if (st.parva) list = list.filter((e) => e.parva === st.parva);
      if (st.character) list = list.filter((e) => e.characters.includes(st.character));
      if (st.category) list = list.filter((e) => e.categories.includes(st.category));
      if (st.episode) list = list.filter((e) => e.episode === st.episode);
      if (st.theme) list = list.filter((e) => e.themes.includes(st.theme));
      $("#results").innerHTML = list.map(entryCard).join(""); reveal($("#results")); $$("#results .reveal").forEach((x) => x.classList.add("in"));
      $("#resCount").textContent = list.length + (list.length === 1 ? " entry" : " entries"); $("#resFor").textContent = "of " + MN.entries.length;
      $("#noRes").hidden = list.length > 0;
      const act = FKEYS.filter((k) => st[k]);
      $("#activeF").innerHTML = act.map((k) => '<button type="button" class="chip" data-clear="' + k + '" aria-label="Remove filter ' + k + '">' + esc(k) + ": " + esc(st[k]) + " ✕</button>").join("");
      $$("#activeF [data-clear]").forEach((b) => b.addEventListener("click", () => { st[b.dataset.clear] = ""; sync(); }));
      const qs = FKEYS.filter((k) => st[k]).map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(st[k])).join("&");
      try { history.replaceState(null, "", "#/explore" + (qs ? "?" + qs : "")); } catch (e) {}
    }
    function sync() { FKEYS.forEach((k) => { const el = $('[data-f="' + k + '"]'); if (el) el.value = st[k]; }); run(); }
    $$("[data-f]").forEach((el) => el.addEventListener(el.tagName === "INPUT" ? "input" : "change", () => { st[el.dataset.f] = el.value; run(); }));
    const clear = () => { FKEYS.forEach((k) => (st[k] = "")); sync(); };
    $("#fclear").addEventListener("click", clear); $("#noResClear").addEventListener("click", clear);
    run();
  }

  /* ───────── EPISODE DETAIL ───────── */
  function pageEpisode(id) {
    const e = byId(id);
    if (!e) return '<section class="wrap page-head"><h1>Entry not found</h1><p><a href="#/explore">Browse all entries</a></p></section>';
    const i = MN.entries.indexOf(e), prev = MN.entries[i - 1], next = MN.entries[i + 1];
    const rd = e.round ? '<a class="btn btn-gold btn-sm" href="#/play?round=' + e.round + '">Play this round</a>' : "";
    const warn = e.precision === "section" ? "" : '<p class="small muted">Parva-level citation: confirm section numbers in the translation index.</p>';
    const more = (label, html) => '<details class="more"><summary>' + label + "</summary>" + html + "</details>";
    return '<section class="wrap" style="padding-top:1.5rem"><nav class="crumbs" aria-label="Breadcrumb"><a href="#/explore">← Explore</a></nav>' +
      '<h1 style="font-size:clamp(1.9rem,4.5vw,3rem)">' + esc(e.title) + "</h1>" +
      '<p class="muted">' + esc(e.parva) + " · " + esc(shortSection(e)) + " · " + esc(e.episode) + "<br>" + e.characters.map(esc).join(", ") + "</p>" +
      '<div class="detail-grid"><div>' +
      '<section class="card sec k-source"><h3>Source Context</h3><p>' + esc(first(e.situation)) + "</p>" +
        more("Decision, outcome and quote", "<p><b>Decision.</b> " + esc(e.decision) + "</p><p><b>Outcome.</b> " + esc(e.outcome) + "</p>" + (e.excerpt ? '<blockquote class="quote">“' + esc(e.excerpt.text) + "”<cite>" + esc(e.excerpt.where) + "</cite></blockquote>" : "")) + "</section>" +
      '<section class="card sec k-insight"><h3>Derived Insight</h3><p class="big-maxim">' + esc(e.maxim || first(e.insight)) + "</p></section>" +
      '<section class="card sec k-modern"><h3>Modern Application</h3><p>' + esc(first(e.modern_application)) + "</p></section>" +
      '<section class="card sec k-view" id="view-source"><h3>View Source</h3><p class="small" style="margin-bottom:.6rem">' + esc(e.translator) + " translation · " + esc(e.language) + "</p>" +
        '<div class="src-links">' + e.sourceLinks.slice(0, 2).map((l) => '<a href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer"><span>' + esc(l.label) + '</span><span aria-hidden="true">↗</span></a>').join("") + "</div>" + warn +
        '<div class="play-actions"><button type="button" class="btn btn-ghost btn-sm" id="copyCite">Copy citation</button>' + rd + "</div></section>" +
      '<div class="pn">' + (prev ? '<a class="btn btn-ghost btn-sm" href="#/episode/' + prev.id + '">← Previous</a>' : "<span></span>") + (next ? '<a class="btn btn-ghost btn-sm" href="#/episode/' + next.id + '">Next →</a>' : "") + "</div></div>" +
      '<aside class="side">' + viewerHTML("epViewer", "gallery", { opts: { ids: e.figures }, caption: e.figures.map((f) => (MN.characters[f] || { name: f }).name).join(" · "), tools: '<div class="viewer-tools"><button class="vt" id="epScene" type="button" aria-pressed="false">Show scene</button></div>' }) +
      "</aside></div></section>";
  }
  function afterEpisode(id) {
    const e = byId(id); if (!e) return;
    const cp = $("#copyCite"); if (cp) cp.addEventListener("click", () => { const t = citation(e); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast("Citation copied"), () => { window.prompt("Copy citation:", t); }); });
    const btn = $("#epScene"), el = $("#epViewer"); let scene = false;
    if (btn) btn.addEventListener("click", () => {
      if (!el._stage) MahaNiti.mountViewer(el, "gallery", { ids: e.figures }); if (!el._stage) return; scene = !scene; btn.setAttribute("aria-pressed", String(scene)); btn.textContent = scene ? "Show sculptures" : "Show scene";
      const name = { court: "court", chariot: "kurukshetra", dice: "dice" }[e.scene];
      if (scene && name) el._scene = el._stage.mount(el, MN3D.scenes[name], {}); else el._scene = el._stage.mount(el, MN3D.scenes.gallery, { ids: e.figures });
    });
    if (btn && !{ court: 1, chariot: 1, dice: 1 }[e.scene]) btn.hidden = true;
  }

  /* ───────── INSIGHTS ───────── */
  function pageInsights(cat) {
    const cats = MN.categories.filter((c) => MN.entries.some((e) => e.categories.includes(c)));
    return '<section class="wrap page-head"><h1 style="font-size:clamp(2rem,5vw,3.2rem)">Insights</h1></section>' +
      '<section class="wrap"><nav class="cat-tabs" aria-label="Categories">' + cats.map((c) => '<a href="#/insights/' + encodeURIComponent(c) + '">' + esc(c) + "</a>").join("") + "</nav>" +
      cats.map((c) => { const list = MN.entries.filter((e) => e.categories.includes(c)); return '<div class="cat-block" id="cat-' + esc(c.replace(/\s+/g, "-")) + '"><h2>' + esc(c) + '</h2><div class="ins-grid">' +
        list.map((e) => '<article class="card icard reveal"><blockquote>' + esc(e.maxim || first(e.insight)) + '</blockquote><div class="row s"><span class="l">Source</span><span>' + esc(e.parva) + " → " + esc(e.episode) + '</span></div><div class="foot"><a class="btn btn-ghost btn-sm" href="#/episode/' + e.id + '">Modern application &amp; source →</a></div></article>').join("") + "</div></div>"; }).join("") +
      '<p class="small muted" style="margin-top:1.5rem">Insights and modern applications are interpretations, not quotations from the text.</p></section>';
  }
  function afterInsights(cat) { if (cat) { const el = document.getElementById("cat-" + cat.replace(/\s+/g, "-")); if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 60); } }

  /* ───────── SOURCES ───────── */
  function pageSources() {
    const T = MN.translation;
    const imgs = []; MN.entries.forEach((e) => { if (e.image && !imgs.find((i) => i.file === e.image.file)) imgs.push(e.image); });
    return '<section class="wrap page-head"><h1 style="font-size:clamp(2rem,5vw,3.2rem)">Sources</h1>' +
      '<div class="callout"><b>Disclaimer.</b> Translations and interpretations may differ. MahaNiti presents selected passages and educational interpretations for learning purposes. Users should consult the cited translation/source for the complete context.</div></section>' +
      '<section class="wrap"><div class="card" style="padding:1.2rem 1.4rem"><h3 style="margin-bottom:.4rem">' + esc(T.work) + '</h3><p class="muted" style="margin:0">' + esc(T.translator) + " · " + esc(T.language) + " · " + esc(T.years) + " · " + esc(T.rights) + " · " + esc(T.host) + "</p></div></section>" +
      '<section class="wrap" style="margin-top:1.2rem"><div class="filters card" style="position:static;grid-template-columns:1fr auto"><div class="field"><label for="sp">Parva</label><select id="sp"><option value="">All parvas</option>' + Q.parvas().map((p) => "<option>" + esc(p) + "</option>").join("") + '</select></div><button type="button" class="btn btn-ghost btn-sm" id="sclear">Clear</button></div><div class="res-bar"><b id="sCount"></b></div><div class="src-cards" id="srcList"></div></section>' +
      '<section class="wrap block"><h3>Image credits</h3><ul class="credit-list">' + imgs.map((i) => "<li>" + esc(i.caption.split("—")[0].trim()) + " — " + esc(i.credit) + " · " + esc(i.license) + ' · <a href="' + esc(i.page) + '" target="_blank" rel="noopener noreferrer">Commons ↗</a></li>').join("") + '</ul><p class="small muted">3D sculptures are original artistic reconstructions, not portraits.</p></section>';
  }
  function afterSources() {
    function row(e) {
      return '<article class="card srow reveal in"><div><h3>' + esc(e.title) + '</h3><p class="small muted" style="margin:0">' + esc(e.parva) + " · " + esc(shortSection(e)) + " · " + esc(e.translator) + " · " + esc(e.language) + '</p></div><div style="display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;justify-content:flex-end"><a class="btn btn-ghost btn-sm" href="' + esc(e.sourceUrl) + '" target="_blank" rel="noopener noreferrer">Read ↗</a><a class="btn btn-ghost btn-sm" href="#/episode/' + e.id + '">Entry</a></div></article>';
    }
    function run() { const p = $("#sp").value; const list = MN.entries.filter((e) => !p || e.parva === p); $("#srcList").innerHTML = list.map(row).join(""); $("#sCount").textContent = list.length + " sources"; }
    $("#sp").addEventListener("change", run); $("#sclear").addEventListener("click", () => { $("#sp").value = ""; run(); }); run();
  }

  /* ───────── ABOUT ───────── */
  function pageAbout() {
    return '<section class="wrap page-head"><h1 style="font-size:clamp(2rem,5vw,3.2rem)">About</h1><div class="big-quote">MahaNiti is an educational web platform inspired by the Indian Knowledge Systems approach. It uses selected Mahābhārata passages to help learners explore strategy, ethics, leadership, decision-making and other forms of knowledge.</div></section>' +
      '<section class="wrap"><div class="about-grid">' +
      '<div class="card"><h3>Objective</h3><p>Turn cited passages into case material: source → situation → decision → insight → modern application.</p></div>' +
      '<div class="card"><h3>Intended users</h3><p>Students, teachers, IKS learners, researchers and curious readers.</p></div>' +
      '<div class="card"><h3>IKS relevance</h3><p>Reads the epic as a source of <i>niti</i> (conduct and policy), to be cited and compared with modern practice.</p></div>' +
      '<div class="card"><h3>Source methodology</h3><p>Every entry cites a parva, section and translation, and keeps three layers apart:</p><div class="chip-row"><span class="chip src">Source Context</span><span class="chip ins">Derived Insight</span><span class="chip mod">Modern Application</span></div></div>' +
      "</div></section>";
  }

  /* ───────── global search UI ───────── */
  function initSearch() {
    const input = $("#gs"), box = $("#gsResults"), form = $("#gsForm"); let items = [], idx = -1;
    function close() { box.hidden = true; input.setAttribute("aria-expanded", "false"); idx = -1; }
    function render() {
      const q = input.value.trim(); if (!q) { close(); return; }
      const k = key(q); const out = [];
      const chars = Q.characters().filter((c) => key(c).includes(k)).slice(0, 3);
      const parvas = MN.parvas.filter((p) => key(p.name + " " + (PARVA_ALT[p.name] || "")).includes(k)).slice(0, 2);
      const cats = MN.categories.filter((c) => key(c).includes(k)).slice(0, 2);
      const eps = Q.episodes().filter((x) => key(x).includes(k)).slice(0, 3);
      const ents = search(q).slice(0, 5);
      if (chars.length) { out.push('<div class="gs-group">Characters</div>'); chars.forEach((c) => out.push('<a class="gs-item" role="option" href="#/explore?character=' + encodeURIComponent(c) + '">' + esc(c) + "<small>Filter entries by character</small></a>")); }
      if (parvas.length) { out.push('<div class="gs-group">Parva</div>'); parvas.forEach((p) => out.push('<a class="gs-item" role="option" href="#/explore?parva=' + encodeURIComponent(p.name) + '">' + esc(p.name) + "<small>Book " + p.no + " of 18</small></a>")); }
      if (cats.length) { out.push('<div class="gs-group">Category</div>'); cats.forEach((c) => out.push('<a class="gs-item" role="option" href="#/explore?category=' + encodeURIComponent(c) + '">' + esc(c) + "</a>")); }
      if (eps.length) { out.push('<div class="gs-group">Episode</div>'); eps.forEach((x) => out.push('<a class="gs-item" role="option" href="#/explore?episode=' + encodeURIComponent(x) + '">' + esc(x) + "</a>")); }
      if (ents.length) { out.push('<div class="gs-group">Entries</div>'); ents.forEach((e) => out.push('<a class="gs-item" role="option" href="#/episode/' + e.id + '">' + esc(e.title) + "<small>" + esc(e.episode) + " · " + esc(e.parva) + "</small></a>")); out.push('<a class="gs-item" role="option" href="#/explore?q=' + encodeURIComponent(q) + '"><b>See all results for “' + esc(q) + "”</b></a>"); }
      if (!out.length) out.push('<div class="gs-empty">No matches. Try a character (Krishna), a parva (Udyoga) or a keyword (counsel).</div>');
      box.innerHTML = out.join(""); box.hidden = false; input.setAttribute("aria-expanded", "true"); items = $$(".gs-item", box); idx = -1;
    }
    let t; input.addEventListener("input", () => { clearTimeout(t); t = setTimeout(render, 70); });
    input.addEventListener("focus", render);
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") { ev.preventDefault(); if (!items.length) return; idx = (idx + (ev.key === "ArrowDown" ? 1 : -1) + items.length) % items.length; items.forEach((x, i) => x.classList.toggle("sel", i === idx)); items[idx].scrollIntoView({ block: "nearest" }); }
      else if (ev.key === "Escape") { close(); input.blur(); }
      else if (ev.key === "Enter" && idx >= 0) { ev.preventDefault(); items[idx].click(); }
    });
    form.addEventListener("submit", (ev) => { ev.preventDefault(); const q = input.value.trim(); close(); if (q) location.hash = "#/explore?q=" + encodeURIComponent(q); });
    box.addEventListener("click", () => { setTimeout(() => { close(); input.value = ""; input.blur(); }, 0); });
    document.addEventListener("click", (ev) => { if (!form.contains(ev.target)) close(); });
  }

  /* ───────── router ───────── */
  const R = MahaNiti.routes;
  R.home = { render: pageHome, after: afterHome, title: "" };
  R.explore = { render: pageExplore, after: afterExplore, title: "Explore Wisdom" };
  R.episode = { render: pageEpisode, after: afterEpisode, title: "" };
  R.insights = { render: pageInsights, after: afterInsights, title: "Insights" };
  R.sources = { render: pageSources, after: afterSources, title: "Sources" };
  R.about = { render: pageAbout, after: function () { }, title: "About" };

  function parseHash() {
    const h = location.hash.replace(/^#\/?/, ""); const qi = h.indexOf("?"); const path = (qi >= 0 ? h.slice(0, qi) : h).split("/").filter(Boolean); const q = parseQuery(qi >= 0 ? h.slice(qi) : "");
    return { name: path[0] || "home", arg: path[1] ? decodeURIComponent(path[1]) : "", q: q };
  }
  let lastName = null;
  function route() {
    const p = parseHash(); const r = R[p.name] || R.home; const name = R[p.name] ? p.name : "home";
    destroyViewers(); closeMenu(); document.body.dataset.route = (R[p.name] ? p.name : "home");
    const main = $("#main"); const arg = (name === "explore" || name === "play") ? p.q : p.arg;
    main.innerHTML = r.render(arg);
    $$(".nav a").forEach((a) => a.classList.toggle("active", a.dataset.route === (name === "episode" ? "explore" : name)));
    setTitle(name === "episode" ? ((byId(p.arg) || {}).title || "Entry") : r.title);
    if (!(name === "insights" && lastName === "insights")) window.scrollTo(0, 0);
    reveal(main); MahaNiti.hydrate(main);
    r.after && r.after(arg);
    lastName = name;
    if (!location.hash.includes("noanchor")) main.focus({ preventScroll: true });
  }
  function closeMenu() { const n = $("#nav"), b = $("#burger"); n.classList.remove("open"); b.setAttribute("aria-expanded", "false"); b.setAttribute("aria-label", "Open menu"); }

  MahaNiti.start = function () {
    $("#burger").addEventListener("click", () => { const n = $("#nav"), b = $("#burger"); const o = n.classList.toggle("open"); b.setAttribute("aria-expanded", String(o)); b.setAttribute("aria-label", o ? "Close menu" : "Open menu"); });
    initSearch();
    // 3D quality toggle
    const qb = $("#qualityBtn"); let low = false; try { low = localStorage.getItem("mn_quality") === "low"; } catch (e) {}
    function applyQ() { if (window.MN3D) MN3D.forceLow = low; $("#qualityLabel").textContent = low ? "Low" : "High"; qb.setAttribute("aria-pressed", String(low)); }
    applyQ(); qb.addEventListener("click", () => { low = !low; try { localStorage.setItem("mn_quality", low ? "low" : "high"); } catch (e) {} applyQ(); route(); toast("3D quality: " + (low ? "Low (no shadows, lower resolution)" : "High")); });
    window.addEventListener("hashchange", route); route();
  };
  MahaNiti.route = route; MahaNiti.toast = toast; MahaNiti.reveal = reveal;
})();
