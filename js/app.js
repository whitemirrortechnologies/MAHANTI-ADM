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
  function thumb(e, w) {
    const img = e.image ? '<img loading="lazy" decoding="async" src="' + commons(e.image.file, w || 640) + '" alt="' + esc(e.image.caption) + '" onerror="this.remove()">' : "";
    return '<div class="thumb"><div class="ph">' + IC.wheel + "<div>" + esc(e.episode) + "</div></div>" + img + '<span class="chip badge">' + esc(e.category) + "</span></div>";
  }
  function entryCard(e) {
    return '<article class="ecard reveal">' + thumb(e) +
      '<div class="body"><div class="meta">' + esc(e.episode) + " · " + esc(e.parva) + "</div>" +
      '<h3><a class="stretch" href="#/episode/' + e.id + '" style="text-decoration:none;color:inherit">' + esc(e.title) + "</a></h3>" +
      '<div class="chip-row">' + e.characters.slice(0, 4).map((c) => '<span class="chip">' + esc(c) + "</span>").join("") + "</div>" +
      '<p class="sit"><span class="lbl">Source context</span>' + esc(e.situation) + "</p>" +
      '<p class="key"><span class="lbl i">Derived insight</span>' + esc(e.maxim || e.insight) + "</p>" +
      '<div class="actions"><span class="src-line">' + esc(shortSection(e)) + '</span><a class="btn btn-primary btn-sm" href="#/episode/' + e.id + '">View Details</a></div></div></article>';
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
      '<div><span class="eyebrow">Interactive Knowledge Systems · Mahābhārata</span><h1>MahaNiti</h1>' +
      '<p class="sub">Ancient Wisdom. Strategic Thinking. Modern Lessons.</p>' +
      '<p class="desc">Explore strategic, ethical and leadership insights from the Mahābhārata through source-based interactive learning.</p>' +
      '<div class="hero-cta"><a class="btn btn-primary" href="#/explore">Explore Wisdom</a><a class="btn btn-gold" href="#/play">Play Dharma Decision</a></div>' +
      '<div class="pipeline-mini" aria-label="Method"><b>Source</b><span class="arr">→</span>Situation<span class="arr">→</span>Decision<span class="arr">→</span>Insight<span class="arr">→</span>Modern Application</div></div>' +
      viewerHTML("heroViewer", "hero", { caption: "Kurukshetra — Krishna and Arjuna (3D sculptures)" }) + "</div></section>" +

      '<section class="block" style="padding-top:0"><div class="wrap"><div class="features">' +
      feat.map((f) => '<a class="card feature reveal" href="#/explore?category=' + encodeURIComponent(f.q) + '"><div class="ic">' + IC[f.k] + "</div><h3>" + f.t + "</h3><p>" + f.d + '</p><span class="more">Explore ' + f.t.toLowerCase() + " →</span></a>").join("") +
      "</div></div></section>" +

      '<section class="block" style="padding-top:1rem"><div class="wrap"><div class="sec-head"><span class="eyebrow">Method</span><h2>How MahaNiti Works</h2><p>Every entry follows the same path, and the site keeps three things strictly apart: what the passage says, what we derive from it, and how it might be applied today.</p></div>' +
      '<div class="flow">' + flow.map((s, i) => '<div class="step ' + s[2] + ' reveal"><div class="n">' + (i + 1) + "</div><h4>" + s[0] + "</h4><p>" + s[1] + "</p></div>").join("") + "</div>" +
      '<div class="flow-legend"><span class="chip src">Source Context — what the passage says</span><span class="chip ins">Derived Insight — MahaNiti’s interpretation</span><span class="chip mod">Modern Application — suggested use today</span></div></div></section>' +

      '<section class="block" style="background:linear-gradient(180deg,transparent,rgba(230,199,118,.14),transparent)"><div class="wrap"><div class="sec-head"><span class="eyebrow">Source-based entries</span><h2>Featured Episodes</h2><p>Each card opens its source entry, with the parva, section and translation cited.</p></div><div class="cards">' +
      MN.featured.map((f) => { const e = byId(f.entry); return '<article class="ecard reveal">' + thumb(e) + '<div class="body"><div class="meta">' + esc(e.parva) + " · " + esc(shortSection(e)) + "</div><h3>" + esc(f.episode) + "</h3><p class=\"key\">" + esc(f.blurb) + '</p><div class="actions"><span class="src-line">' + esc(e.translator) + " tr.</span><a class=\"btn btn-primary btn-sm\" href=\"#/episode/" + e.id + '">View source entry</a></div></div></article>'; }).join("") +
      "</div></div></section>" +

      '<section class="block"><div class="wrap"><div class="sec-head"><span class="eyebrow">3D sculpture gallery</span><h2>Meet the figures</h2><p>Real-time 3D sculptures of figures who appear in the entries, built in the manner of traditional stone and metal iconography. Drag to turn them. They are artistic reconstructions — the epic gives no authoritative likeness.</p></div>' +
      '<div class="gallery-grid"><div id="galHost">' + viewerHTML("galViewer", "gallery", { opts: { ids: ["krishna"] }, cls: "", tools: '<div class="viewer-tools"><button class="vt" id="galFace" type="button" aria-pressed="false">Face close-up</button></div>' }) + "</div>" +
      '<div class="card gal-panel"><div class="gal-chars" role="group" aria-label="Choose a figure">' + chars.map((c, i) => '<button type="button" data-char="' + c + '" aria-pressed="' + (i === 0) + '">' + esc(MN.characters[c].name) + "</button>").join("") + '</div><div class="gal-info" id="galInfo"></div></div></div></div></section>' +

      '<section class="block" style="padding-top:0"><div class="wrap"><div class="card" style="padding:clamp(1.5rem,4vw,2.5rem);text-align:center;background:linear-gradient(135deg,#fffaf0,#f4e3bc)"><h2>Test your reflection</h2><p style="max-width:40em;margin-inline:auto">Three situations inspired by Mahābhārata episodes. Make a choice, then see the source, the insight and a modern application. No score measures your morality — it is a reflection aid.</p><a class="btn btn-primary" href="#/play">Play Dharma Decision</a></div></div></section>';
  }
  function afterHome() {
    let current = "krishna"; const host = $("#galHost"); let face = false;
    function info() {
      const c = MN.characters[current]; const rel = MN.entries.filter((e) => e.characters.some((n) => n.indexOf(c.name) === 0 || n.indexOf("(" + c.name) > -1)).slice(0, 4);
      $("#galInfo").innerHTML = "<h3>" + esc(c.name) + '</h3><p class="muted" style="margin-bottom:.8rem">' + esc(c.role) + '</p><p class="small muted">Appears in these source entries:</p><div class="gal-links">' + (rel.length ? rel.map((e) => '<a class="btn btn-ghost btn-sm" href="#/episode/' + e.id + '">' + esc(e.title.length > 34 ? e.title.slice(0, 32) + "…" : e.title) + "</a>").join("") : '<span class="small muted">No linked entry yet.</span>') + "</div>";
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
    return '<section class="wrap page-head"><span class="eyebrow">Knowledge repository</span><h1 style="font-size:clamp(2rem,5vw,3.2rem)">Explore Wisdom</h1><p>Search and filter source-based entries. Each opens with its source context, derived insight and modern application kept clearly apart.</p></section>' +
      '<section class="wrap"><form class="card filters" id="filters" onsubmit="return false"><div class="field q"><label for="f-q">Search</label><input id="f-q" data-f="q" type="search" placeholder="Character, parva, episode, keyword, insight…" value="' + esc(st.q || "") + '"></div>' +
      sel("parva", "Parva", Q.parvas()) + sel("character", "Character", Q.characters()) + sel("category", "Category", Q.categories()) + sel("episode", "Episode", Q.episodes()) + sel("theme", "Theme", Q.themes()) +
      '<button type="button" class="btn btn-ghost btn-sm clear" id="fclear">Clear</button></form>' +
      '<div class="res-bar"><div><b id="resCount"></b> <span class="muted" id="resFor"></span></div><div class="active-f" id="activeF"></div></div><div class="cards" id="results"></div><div class="empty" id="noRes" hidden><h3>No entries match these filters</h3><p>Try removing a filter or searching a broader keyword such as “counsel”, “Krishna” or “consequences”.</p><button class="btn btn-primary btn-sm" type="button" id="noResClear">Clear all filters</button></div></section>';
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
      $("#resCount").textContent = list.length + (list.length === 1 ? " entry" : " entries"); $("#resFor").textContent = st.q ? "for “" + st.q + "”" : "of " + MN.entries.length;
      $("#noRes").hidden = list.length > 0;
      const act = FKEYS.filter((k) => st[k] && k !== "q");
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
    if (!e) return '<section class="wrap page-head"><h1>Entry not found</h1><p>That source entry does not exist. <a href="#/explore">Browse all entries</a>.</p></section>';
    const i = MN.entries.indexOf(e), prev = MN.entries[i - 1], next = MN.entries[i + 1];
    const same = MN.entries.filter((x) => x.episode === e.episode && x !== e);
    const sec = (no, title, chip, cls, body) => '<section class="card sec ' + cls + ' reveal" id="s' + no + '"><h3><span class="no">' + no + "</span>" + title + (chip ? '<span class="chip ' + chip[1] + '">' + chip[0] + "</span>" : "") + "</h3>" + body + "</section>";
    const chS = ["Source Context", "src"], chI = ["Derived Insight", "ins"], chM = ["Modern Application", "mod"];
    const ratio = e.precision === "section" ? '<span class="chip src">Section-level citation checked against the translation</span>' : '<span class="chip warn">Parva-level citation — confirm section numbers in the translation index</span>';
    const rd = e.round ? '<a class="btn btn-gold btn-sm" href="#/play?round=' + e.round + '">Play the related round</a>' : "";
    return '<section class="wrap" style="padding-top:1.5rem"><nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a> / <a href="#/explore">Explore</a> / <a href="#/explore?parva=' + encodeURIComponent(e.parva) + '">' + esc(e.parva) + "</a> / <span>" + esc(e.title) + "</span></nav>" +
      '<div class="chip-row" style="margin-bottom:.8rem"><span class="chip cat">' + esc(e.category) + "</span>" + e.categories.filter((c) => c !== e.category).map((c) => '<span class="chip">' + esc(c) + "</span>").join("") + "</div>" +
      '<h1 style="font-size:clamp(2rem,5vw,3.3rem)">' + esc(e.title) + "</h1>" +
      '<p class="muted" style="font-size:1.1rem">' + esc(e.episode) + " · " + esc(e.passage) + "</p>" + chain(e) +
      '<div class="detail-grid"><div>' +

      sec("1–4", "Locate the passage", chS, "k-source", '<div class="facts">' +
        '<div class="f"><span>1 · Parva</span><b>' + esc(e.parva) + (parvaNo(e.parva) ? " (Book " + parvaNo(e.parva) + " of 18)" : "") + "</b></div>" +
        '<div class="f"><span>2 · Adhyāya / Section</span><b>' + esc(e.section) + "</b></div>" +
        '<div class="f"><span>3 · Episode / Passage</span><b>' + esc(e.episode) + " — " + esc(e.passage) + "</b></div>" +
        '<div class="f"><span>4 · Character(s)</span><b>' + e.characters.map(esc).join(", ") + "</b></div></div>") +
      sec(5, "Strategic / Ethical Situation", chS, "k-source", "<p>" + esc(e.situation) + "</p>" + (e.excerpt ? '<blockquote class="quote">“' + esc(e.excerpt.text) + "”<cite>Translation excerpt — " + esc(e.excerpt.where) + "</cite></blockquote>" : "")) +
      sec(6, "Decision or Action", chS, "k-source", "<p>" + esc(e.decision) + "</p>") +
      sec(7, "Outcome", chS, "k-source", "<p>" + esc(e.outcome) + "</p>") +
      sec(8, "Insight", chI, "k-insight", '<p style="font-family:var(--head);font-size:1.4rem;line-height:1.3;font-weight:600;color:var(--brown-d)">' + esc(e.maxim || "") + "</p><p>" + esc(e.insight) + '</p><p class="small muted">This is MahaNiti’s interpretation of the passage, not a quotation from the Mahābhārata.</p>') +
      sec(9, "Modern Application", chM, "k-modern", "<p>" + esc(e.modern_application) + '</p><p class="small muted">A suggested modern use — an interpretation, not a statement of the ancient text.</p>') +
      sec(10, "Source / Reference", ["View Source", "src"], "k-view", '<div id="view-source"><p>' + esc(e.source) + '</p><dl class="kv"><dt>Work</dt><dd>' + esc(MN.translation.work) + "</dd><dt>Translator</dt><dd>" + esc(e.translator) + " (" + esc(MN.translation.years) + ", " + esc(MN.translation.rights.toLowerCase()) + ")</dd><dt>Language</dt><dd>" + esc(e.language) + "</dd><dt>Parva</dt><dd>" + esc(e.parva) + "</dd><dt>Section</dt><dd>" + esc(e.section) + "</dd><dt>Online edition</dt><dd>" + esc(MN.translation.host) + "</dd></dl>" +
        '<div class="src-links">' + e.sourceLinks.map((l) => '<a href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer"><span>' + esc(l.label) + '</span><span aria-hidden="true">↗</span></a>').join("") + "</div>" +
        '<p style="margin-top:.9rem">' + ratio + '</p><p class="small muted">Section numbering follows the Ganguli translation and may differ in other editions (for example the BORI Critical Edition). Situation, decision and outcome are MahaNiti’s paraphrase of the cited passage; consult the translation for full context.</p>' +
        '<div class="play-actions"><button type="button" class="btn btn-ghost btn-sm" id="copyCite">Copy citation</button>' + rd + "</div></div>") +

      '<div class="pn">' + (prev ? '<a class="btn btn-ghost btn-sm" href="#/episode/' + prev.id + '">← ' + esc(prev.title.slice(0, 40)) + "</a>" : "<span></span>") + (next ? '<a class="btn btn-ghost btn-sm" href="#/episode/' + next.id + '">' + esc(next.title.slice(0, 40)) + " →</a>" : "") + "</div>" +
      "</div>" +

      '<aside class="side">' + viewerHTML("epViewer", "gallery", { opts: { ids: e.figures }, caption: e.figures.map((f) => (MN.characters[f] || { name: f }).name).join(" · "), tools: '<div class="viewer-tools"><button class="vt" id="epScene" type="button" aria-pressed="false">Show scene</button></div>' }) +
      (e.image ? '<figure class="card figure-img"><img loading="lazy" src="' + commons(e.image.file, 900) + '" alt="' + esc(e.image.caption) + '" onerror="this.closest(\'figure\').remove()"><figcaption>' + esc(e.image.caption) + '. <br>Credit: ' + esc(e.image.credit) + " · " + esc(e.image.license) + ' · <a href="' + esc(e.image.page) + '" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>. Artworks are historical visual references, not evidence of how events looked.</figcaption></figure>' : "") +
      (same.length ? '<div class="card" style="padding:1.2rem"><h4>More from “' + esc(e.episode) + "”</h4>" + same.map((x) => '<p style="margin:.3rem 0"><a href="#/episode/' + x.id + '">' + esc(x.title) + "</a></p>").join("") + "</div>" : "") +
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
    return '<section class="wrap page-head"><span class="eyebrow">Derived insights</span><h1 style="font-size:clamp(2rem,5vw,3.2rem)">Insights</h1><p>Each insight is tied to a cited passage. The insight and its modern application are <b>interpretations derived from the episode</b> — they are not direct statements from the ancient text.</p>' +
      '<div class="callout info"><b>How to read:</b> <span class="chip src">Source</span> is where the passage is found; <span class="chip ins">Derived Insight</span> is what MahaNiti draws from it; <span class="chip mod">Modern Application</span> is a suggested contemporary use.</div></section>' +
      '<section class="wrap"><nav class="cat-tabs" aria-label="Categories">' + cats.map((c) => '<a href="#/insights/' + encodeURIComponent(c) + '">' + esc(c) + "</a>").join("") + "</nav>" +
      cats.map((c) => { const list = MN.entries.filter((e) => e.categories.includes(c)); return '<div class="cat-block" id="cat-' + esc(c.replace(/\s+/g, "-")) + '"><h2>' + esc(c) + " <small>" + esc(MN.categoryBlurb[c] || "") + '</small></h2><div class="ins-grid">' +
        list.map((e) => '<article class="card icard reveal"><span class="chip ins" style="align-self:flex-start">Derived Insight</span><blockquote>' + esc(e.maxim || e.insight) + '</blockquote><div class="row s"><span class="l">Source</span><span>Mahābhārata → ' + esc(e.parva) + " → " + esc(shortSection(e)) + " → " + esc(e.episode) + '</span></div><div class="row m"><span class="l">Modern application (interpretation)</span><span>' + esc(e.modern_application) + '</span></div><div class="foot"><a class="btn btn-ghost btn-sm" href="#/episode/' + e.id + '">View source entry</a></div></article>').join("") + "</div></div>"; }).join("") + "</section>";
  }
  function afterInsights(cat) { if (cat) { const el = document.getElementById("cat-" + cat.replace(/\s+/g, "-")); if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 60); } }

  /* ───────── SOURCES ───────── */
  function pageSources() {
    const T = MN.translation;
    const imgs = []; MN.entries.forEach((e) => { if (e.image && !imgs.find((i) => i.file === e.image.file)) imgs.push(e.image); });
    return '<section class="wrap page-head"><span class="eyebrow">Source repository</span><h1 style="font-size:clamp(2rem,5vw,3.2rem)">Sources</h1><p>Every entry is traceable to a parva, section and translation. Nothing on this site is presented without a citation.</p>' +
      '<div class="callout"><b>Disclaimer.</b> Translations and interpretations may differ. MahaNiti presents selected passages and educational interpretations for learning purposes. Users should consult the cited translation/source for the complete context.</div></section>' +
      '<section class="wrap"><div class="card prim"><div><span class="eyebrow">Primary translation used</span><h2 style="font-size:1.8rem">' + esc(T.work) + '</h2><dl class="kv"><dt>Translator</dt><dd>' + esc(T.translator) + "</dd><dt>Language</dt><dd>" + esc(T.language) + "</dd><dt>Published</dt><dd>" + esc(T.years) + "</dd><dt>Rights</dt><dd>" + esc(T.rights) + "</dd><dt>Online edition</dt><dd>" + esc(T.host) + '</dd></dl></div><div><h4>Parva indexes in the online edition</h4><div class="src-links">' + MN.parvas.map((p) => '<a href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer"><span>' + esc(p.name) + " (Book " + p.no + ')</span><span aria-hidden="true">↗</span></a>').join("") + '</div><p class="small muted" style="margin-top:.8rem">Section numbers cited here follow this translation. Chapter headings for the Bhagavad Gita section are added by the online edition’s editor (J. B. Hare), not by Ganguli.</p></div></div></section>' +
      '<section class="wrap" style="margin-top:2rem"><div class="filters card" style="position:static;grid-template-columns:2fr 1fr auto"><div class="field"><label for="sq">Search sources</label><input id="sq" type="search" placeholder="Parva, section, episode, translator…"></div><div class="field"><label for="sp">Parva</label><select id="sp"><option value="">All parvas</option>' + Q.parvas().map((p) => "<option>" + esc(p) + "</option>").join("") + '</select></div><button type="button" class="btn btn-ghost btn-sm" id="sclear">Clear</button></div><div class="res-bar"><b id="sCount"></b></div><div class="src-cards" id="srcList"></div></section>' +
      '<section class="wrap block"><div class="grid" style="display:grid;gap:1.5rem;grid-template-columns:repeat(auto-fit,minmax(300px,1fr))"><div><h2 style="font-size:1.6rem">Image credits</h2><p class="small muted">Openly licensed artworks from Wikimedia Commons are used only as historical visual references on entry pages.</p><ul class="credit-list">' +
      imgs.map((i) => "<li><b>" + esc(i.caption.split("—")[0].trim()) + "</b><br>" + esc(i.credit) + " · " + esc(i.license) + ' · <a href="' + esc(i.page) + '" target="_blank" rel="noopener noreferrer">File page ↗</a></li>').join("") + '</ul></div><div><h2 style="font-size:1.6rem">3D sculptures & scenes</h2><p>The sculptures and dioramas are original procedural artworks generated in your browser with Three.js. They follow traditional iconography (for example Krishna’s crown with peacock feather, Arjuna’s bow) but are <b>artistic reconstructions, not portraits or archaeological reconstructions</b>. Optional photoreal glTF models can be plugged in through <code>MN.models</code> (see README).</p><h3 style="font-size:1.25rem;margin-top:1.2rem">Planned additions</h3><ul><li>Tamil translation references (none are quoted yet, so none are listed).</li><li>Cross-references to the BORI Critical Edition numbering.</li></ul></div></div></section>';
  }
  function afterSources() {
    function row(e) {
      return '<article class="card srow reveal in"><div><span class="chip cat">' + esc(e.parva) + "</span><h3 style=\"margin-top:.5rem\">" + esc(e.title) + '</h3><p class="small muted" style="margin:0">' + esc(e.episode) + " · " + esc(e.passage) + '</p><p style="margin:.6rem 0 0"><a class="btn btn-ghost btn-sm" href="#/episode/' + e.id + '">Open entry</a></p></div>' +
        '<dl class="kv"><dt>Title</dt><dd>' + esc(MN.translation.work) + "</dd><dt>Author / Translator</dt><dd>" + esc(e.translator) + " (translator); Vyāsa (traditional author)</dd><dt>Language</dt><dd>" + esc(e.language) + "</dd><dt>Parva</dt><dd>" + esc(e.parva) + "</dd><dt>Section / Chapter</dt><dd>" + esc(e.section) + "</dd><dt>Episode / Passage</dt><dd>" + esc(e.episode) + " — " + esc(e.passage) + "</dd><dt>Link</dt><dd>" + e.sourceLinks.map((l) => '<a href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">' + esc(l.label) + " ↗</a>").join("<br>") + "</dd><dt>Precision</dt><dd>" + (e.precision === "section" ? "Section-level (checked)" : "Parva-level (section numbers to confirm)") + "</dd></dl></article>";
    }
    function run() { const q = key($("#sq").value), p = $("#sp").value; const list = MN.entries.filter((e) => (!p || e.parva === p) && (!q || key([e.title, e.parva, e.section, e.episode, e.passage, e.translator, e.source].join(" ")).includes(q))); $("#srcList").innerHTML = list.map(row).join("") || '<div class="empty">No sources match.</div>'; $("#sCount").textContent = list.length + " source " + (list.length === 1 ? "entry" : "entries"); }
    $("#sq").addEventListener("input", run); $("#sp").addEventListener("change", run); $("#sclear").addEventListener("click", () => { $("#sq").value = ""; $("#sp").value = ""; run(); }); run();
  }

  /* ───────── ABOUT ───────── */
  function pageAbout() {
    return '<section class="wrap page-head"><span class="eyebrow">About the project</span><h1 style="font-size:clamp(2rem,5vw,3.2rem)">About MahaNiti</h1><div class="big-quote">MahaNiti is an educational web platform inspired by the Indian Knowledge Systems approach. It uses selected Mahābhārata passages to help learners explore strategy, ethics, leadership, decision-making and other forms of knowledge.</div></section>' +
      '<section class="wrap"><div class="about-grid">' +
      '<div class="card"><h3>Project objective</h3><ul><li>Present Mahābhārata passages as <b>case material</b>: source → situation → decision → outcome → insight → modern application.</li><li>Keep every entry traceable to a parva, section and translation.</li><li>Let learners practise reflective decision-making through the Dharma Decision game.</li></ul></div>' +
      '<div class="card"><h3>Intended users</h3><ul><li>Students and teachers of Indian Knowledge Systems</li><li>Researchers who need quick, citable passages</li><li>Leadership, ethics and management learners</li><li>General readers curious about Indian knowledge traditions</li></ul></div>' +
      '<div class="card"><h3>IKS relevance</h3><p>The epic is a long-standing resource for reflection on <i>niti</i> (policy and conduct), <i>dharma</i> (duty), counsel and statecraft. MahaNiti treats it as a knowledge source to be read closely and cited, not only as a story, and invites comparison between traditional frameworks and contemporary practice.</p></div>' +
      '<div class="card"><h3>Visual approach</h3><p>Characters and scenes are shown as real-time 3D sculptures in stone, metal and painted cloth, following traditional iconography. They are interpretive artworks; the Mahābhārata does not describe faces or buildings in a way that supports a “true likeness”. Historical paintings from Wikimedia Commons are used as credited visual references.</p></div></div>' +
      '<div class="sec-head" style="margin-top:2.5rem"><span class="eyebrow">Source methodology</span><h2>Three layers, never mixed</h2><p>Each entry separates what the text says from what we infer and apply.</p></div>' +
      '<div class="method"><div class="m-src"><span class="chip src">Source Context</span><h4 style="margin-top:.6rem">What the passage says</h4><p class="small">A paraphrase of the cited section (situation, decision, outcome), sometimes with a short quotation from the Ganguli translation, always with a parva, section and link.</p></div>' +
      '<div class="m-ins"><span class="chip ins">Derived Insight</span><h4 style="margin-top:.6rem">What we derive</h4><p class="small">MahaNiti’s interpretation of the episode, written as a lesson. Never presented as a quotation and never attributed to the ancient author.</p></div>' +
      '<div class="m-mod"><span class="chip mod">Modern Application</span><h4 style="margin-top:.6rem">How it may be used today</h4><p class="small">A suggested contemporary use (negotiation, governance, ethics…). Explicitly an interpretation, not a claim of the text.</p></div></div>' +
      '<div class="card" style="padding:1.5rem"><h3>How entries are checked</h3><ul><li>Section numbers and quoted phrases were checked against the Ganguli translation text.</li><li>Entries are tagged <i>section-level</i> or <i>parva-level</i>; parva-level entries say so on the page.</li><li>No Sanskrit verses, verse numbers or quotations are invented; where a Sanskrit verse is not cited, none is shown.</li><li>The game never labels a choice as objectively “dharma” or “adharma”; it says whether a choice is <i>more closely aligned with the lesson highlighted in the episode</i> or <i>raises a different ethical consideration</i>. The Reflection Score is a learning aid and does not measure morality.</li></ul></div>' +
      '<div class="card" style="padding:1.5rem;margin-top:1rem"><h3>Adding more episodes</h3><p>All content lives in <code>js/data.js</code>. Add one object to <code>MN.entries</code> with the fields <code>parva, section, episode, passage, characters, category, situation, decision, outcome, insight, modern_application, source, translator, language</code> and the Explore, Insights, Sources, Search and detail pages update automatically.</p></div></section>';
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
