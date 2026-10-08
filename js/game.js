/* ============================================================
   MahaNiti — "Dharma Decision" interactive game
   Content: MN.game (js/data.js). Scoring is a "Reflection Score":
   a learning aid, never a measure of a player's morality.
   ============================================================ */
(function () {
  "use strict";
  const MN = window.MN, A = window.MahaNiti; if (!MN || !A) return;
  const { $, $$, esc, byId } = A;
  const first = (s) => { const m = String(s || "").match(/^.*?[.!?](\s|$)/); return m ? m[0].trim() : s; };
  const shortSec = (e) => e.section.split("·").pop().trim();
  const G = MN.game; const MAXPTS = G.rounds.length * 2;
  const SCENE = { court: "court", chariot: "kurukshetra", dice: "dice" };
  const CAPTION = { court: "Hastinapura — the Kuru assembly hall", chariot: "Kurukshetra — before the battle", dice: "The Sabhā — the dice hall" };
  let S = null;

  function fresh(startRound) { return { stage: startRound ? "round" : "intro", r: startRound ? startRound - 1 : 0, picks: [], picked: null }; }

  function shell() {
    return '<section class="wrap page-head"><span class="eyebrow">Interactive game</span><h1 style="font-size:clamp(2rem,5vw,3.2rem)">Dharma Decision</h1>' +
      '<p>Three situations. Pick an action.</p></section>' +
      '<section class="wrap"><div class="play-shell"><div>' + A.viewerHTML("gameViewer", "court", { caption: CAPTION.court, hint: true }) + '</div><div class="card play-panel" id="playPanel" aria-live="polite"></div></div></section>';
  }

  function progress() {
    let h = '<div class="progress" aria-label="Progress">';
    G.rounds.forEach((r, i) => { h += '<i class="' + (i < S.r || (i === S.r && S.picked) ? "done" : i === S.r ? "cur" : "") + '"></i>'; });
    return h + "<small>Round " + (S.r + 1) + " of " + G.rounds.length + "</small></div>";
  }

  function setScene(name) {
    const el = $("#gameViewer"); if (!el) return null;
    const cap = $(".viewer-cap", el); if (cap) cap.textContent = CAPTION[name];
    if (el._sceneName === SCENE[name] && el._scene) { if (el._scene.reset) el._scene.reset(); return el._scene; }
    return A.mountViewer(el, SCENE[name], {});
  }

  function renderIntro() {
    const p = $("#playPanel");
    p.innerHTML = '<div class="intro-box"><h2>3 rounds · 1 choice each</h2><p class="small muted">Your ' + G.scoreName + ' is a learning aid, not a measure of morality.</p><button class="btn btn-primary" type="button" id="beginBtn">Begin</button></div>';
    $("#beginBtn").addEventListener("click", () => { S.stage = "round"; S.r = 0; renderRound(); });
  }

  function renderRound() {
    const r = G.rounds[S.r]; S.picked = null; setScene(r.scene);
    const p = $("#playPanel");
    p.innerHTML = progress() + '<h2 style="font-size:1.7rem">' + esc(r.title) + '</h2><div class="situation">' + esc(r.situation) + "</div>" +
      '<div class="choices" role="group" aria-label="Choose an action">' + r.choices.map((c) => '<button type="button" class="choice" data-k="' + c.key + '"><span class="k">' + c.key + "</span><span>" + esc(c.text) + "</span></button>").join("") + '</div><div id="resultHost"></div>';
    $$(".choice", p).forEach((b) => b.addEventListener("click", () => pick(b.dataset.k)));
    const top = $(".page-head"); if (S.r > 0) window.scrollTo({ top: Math.max(0, top ? top.getBoundingClientRect().height : 0), behavior: "smooth" });
  }

  function pick(k) {
    if (S.picked) return; const r = G.rounds[S.r]; const c = r.choices.find((x) => x.key === k); if (!c) return;
    S.picked = k; S.picks[S.r] = { round: r, choice: c };
    $$(".choice").forEach((b) => { b.disabled = true; if (b.dataset.k === k) b.classList.add("picked", "s" + c.score); else b.classList.add("dim"); });
    const e = byId(r.entry); const el = $("#gameViewer"); if (el && el._scene && el._scene.react) el._scene.react(k);
    const last = S.r === G.rounds.length - 1;
    const prog = $(".progress"); if (prog) prog.outerHTML = progress();
    $("#resultHost").innerHTML = '<div class="result" id="result">' +
      '<div class="res-top s' + c.score + '"><span class="pts">+' + c.score + " reflection " + (c.score === 1 ? "point" : "points") + "</span><b>" + esc(G.labels[c.score]) + "</b><p style=\"margin:.4rem 0 0\">" + esc(c.result) + "</p></div>" +
      '<div class="res-block ins"><h4>Insight</h4><p>' + esc(c.insight) + "</p></div>" +
      '<details class="more"><summary>Why? Parallel and modern application</summary><div class="res-block src" style="margin-top:.5rem"><h4>Explanation</h4><p>' + esc(first(c.explanation)) + "</p></div>" +
      '<div class="res-block par"><h4>Mahābhārata parallel</h4><p>' + esc(c.parallel) + "</p></div>" +
      '<div class="res-block mod"><h4>Modern Application</h4><p>' + esc(c.application) + "</p></div></details>" +
      '<div class="res-block src"><h4>Source</h4><p>' + esc(e.parva) + " → " + esc(shortSec(e)) + ' · <a href="#/episode/' + e.id + '">View source entry</a></p></div>' +
      '<div class="play-actions"><button type="button" class="btn btn-primary" id="nextBtn">' + (last ? "See my Reflection Score" : "Next round →") + "</button></div></div>";
    $("#nextBtn").addEventListener("click", () => { if (last) renderEnd(); else { S.r++; renderRound(); } });
    const res = $("#result"); if (res) setTimeout(() => res.scrollIntoView({ behavior: "smooth", block: "nearest" }), 120);
  }

  function renderEnd() {
    S.stage = "end"; const total = S.picks.reduce((s, p) => s + (p ? p.choice.score : 0), 0);
    const el = $("#gameViewer"); if (el && el._scene && el._scene.reset) el._scene.reset();
    const p = $("#playPanel");
    p.innerHTML = '<div class="center"><span class="chip ins">Round complete</span><h2 style="margin:.5rem 0 1rem">Your ' + G.scoreName + '</h2><div class="score-ring" style="--p:' + Math.round((total / MAXPTS) * 100) + '"><span>' + total + " / " + MAXPTS + "<small>" + G.scoreName + "</small></span></div></div>" +
      "<h3>Areas considered</h3>" + '<div class="sum-list">' + S.picks.map((x) => '<div class="sum-item"><span class="dot s' + x.choice.score + '"></span><div><b>' + esc(x.round.area) + '</b></div></div>').join("") + "</div>" +
      "<h3>Key lessons</h3><ul class=\"lessons\">" + G.lessons.map((l) => "<li>" + esc(l) + "</li>").join("") + "</ul>" +
      '<div class="play-actions"><a class="btn btn-gold" href="#/sources">Explore the original sources</a><button type="button" class="btn btn-primary" id="againBtn">Play Again</button><a class="btn btn-ghost" href="#/explore">Explore Wisdom</a></div>';
    $("#againBtn").addEventListener("click", () => { S = fresh(0); setScene("court"); renderIntro(); window.scrollTo({ top: 0, behavior: "smooth" }); });
    window.scrollTo({ top: Math.max(0, ($(".page-head") || { getBoundingClientRect: () => ({ height: 0 }) }).getBoundingClientRect().height), behavior: "smooth" });
  }

  document.addEventListener("keydown", (ev) => {
    if (!S || !$("#playPanel") || S.picked || S.stage !== "round") return; if (ev.target && /INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)) return;
    const k = ev.key.toUpperCase(); if (/^[A-D]$/.test(k)) pick(k); else if (/^[1-4]$/.test(k)) pick("ABCD"[+k - 1]);
  });

  A.routes.play = {
    title: "Play — Dharma Decision",
    render: function (q) { const rr = parseInt(q && q.round, 10); S = fresh(rr >= 1 && rr <= G.rounds.length ? rr : 0); return shell(); },
    after: function () {
      const el = $("#gameViewer");
      const start = () => { if (S.stage === "round") renderRound(); else renderIntro(); };
      // render the panel immediately; the 3D scene mounts lazily with the viewer
      if (S.stage === "round") { const r = G.rounds[S.r]; el.dataset.scene = SCENE[r.scene]; }
      start();
    }
  };
})();
