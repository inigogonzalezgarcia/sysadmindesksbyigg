/* SysAdmin Desks by IGG - user interface. Every text is set with textContent (no HTML strings). */
(function () {
  "use strict";
  const E = window.SDEngine;
  const SCENARIOS = window.SDScenarios;
  const t = E.t;

  const UI = {
    en: {
      heroTitle: "Practise real IT support tickets in a simulated console",
      heroText: "Each desk is a ticket from a fictional company. Investigate with the commands you would use at work, fix the cause, check it and write the work note. No sign-up: your progress stays in this browser.",
      how: [["1 · Read", "the ticket and what you have"], ["2 · Investigate", "in the console, like on a real machine"], ["3 · Fix and check", "the cause, not only the symptom"], ["4 · Write the note", "the next engineer will thank you"]],
      progress: (d, n, s) => `${d} of ${n} desks solved · ${s} stars`,
      start: "Start", again: "Play again", level: "Level", min: "min", back: "← All desks",
      ticket: "Ticket", context: "What you have", stages: "Progress", hint: "Hint", restart: "Restart",
      guide: "Read the guide", termHelp: "Type help for the basics. ↑/↓ repeat commands.",
      noteTitle: "Work note", noteText: "Write the note you would leave in the ticket: cause, what you changed, how you checked it and any follow-up.",
      submit: "Close the ticket", result: "Ticket closed", points: "points",
      found: "Your note covers", missing: "Your note is missing", sample: "An example note", solution: "One way to solve it",
      next: "Next desk", home: "All desks", noteEmpty: "Write a few lines first.",
      hintsUsed: (h) => `Hints used: ${h}`, guides: "Guides",
      foot: "Fictional company and people. Your progress is stored only in this browser.",
      welcome: "Connected to {host} as {user}. Type help if you need it.",
      langBtn: "ES", langLabel: "Español", notFound: "That desk does not exist.",
    },
    es: {
      heroTitle: "Practica tickets reales de soporte IT en una consola simulada",
      heroText: "Cada puesto es un ticket de una empresa ficticia. Investiga con los comandos que usarías en el trabajo, arregla la causa, compruébalo y escribe la nota de trabajo. Sin registro: tu progreso se queda en este navegador.",
      how: [["1 · Lee", "el ticket y lo que tienes"], ["2 · Investiga", "en la consola, como en un equipo real"], ["3 · Arregla y comprueba", "la causa, no solo el síntoma"], ["4 · Escribe la nota", "el siguiente técnico te lo agradecerá"]],
      progress: (d, n, s) => `${d} de ${n} puestos resueltos · ${s} estrellas`,
      start: "Empezar", again: "Repetir", level: "Nivel", min: "min", back: "← Todos los puestos",
      ticket: "Ticket", context: "Lo que tienes", stages: "Progreso", hint: "Pista", restart: "Reiniciar",
      guide: "Leer la guía", termHelp: "Escribe help para lo básico. ↑/↓ repiten comandos.",
      noteTitle: "Nota de trabajo", noteText: "Escribe la nota que dejarías en el ticket: causa, qué cambiaste, cómo lo comprobaste y el seguimiento.",
      submit: "Cerrar el ticket", result: "Ticket cerrado", points: "puntos",
      found: "Tu nota incluye", missing: "A tu nota le falta", sample: "Una nota de ejemplo", solution: "Una forma de resolverlo",
      next: "Siguiente puesto", home: "Todos los puestos", noteEmpty: "Escribe unas líneas primero.",
      hintsUsed: (h) => `Pistas usadas: ${h}`, guides: "Guías",
      foot: "Empresa y personas ficticias. Tu progreso se guarda solo en este navegador.",
      welcome: "Conectado a {host} como {user}. Escribe help si lo necesitas.",
      langBtn: "EN", langLabel: "English", notFound: "Ese puesto no existe.",
    },
  };

  /* ---------- storage (per-viewer convenience only; the page works without it) */
  function load(key, fallback) {
    try { const v = localStorage.getItem("sd." + key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem("sd." + key, JSON.stringify(value)); } catch (e) { /* private mode: ignore */ }
  }

  let lang = load("lang", (navigator.language || "en").toLowerCase().startsWith("es") ? "es" : "en");
  let progress = load("progress", {});
  let current = null;   // {sc, sess, ...} while on a desk

  function L() { return UI[lang]; }

  /* ---------- tiny DOM helper */
  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    });
    kids.flat().forEach((k) => { if (k != null && k !== false) n.append(typeof k === "string" ? document.createTextNode(k) : k); });
    return n;
  }
  function stars(n) {
    return el("span", { class: "stars", "aria-label": n + "/3" }, "★".repeat(n), el("span", { class: "off" }, "★".repeat(3 - n)));
  }

  /* ---------- chrome */
  function chrome() {
    document.documentElement.lang = lang;
    const b = document.getElementById("lang");
    b.textContent = L().langBtn;
    b.setAttribute("aria-label", L().langLabel);
    document.getElementById("nav-guides").textContent = L().guides;
    document.getElementById("foot-text").textContent = L().foot;
  }

  /* ---------- home */
  function home() {
    current = null;
    const app = document.getElementById("app");
    app.replaceChildren();
    document.title = "SysAdmin Desks by IGG · " + (lang === "es" ? "práctica de soporte IT" : "IT support practice");
    const solved = SCENARIOS.filter((s) => progress[s.id]).length;
    const totalStars = SCENARIOS.reduce((a, s) => a + ((progress[s.id] || {}).stars || 0), 0);
    app.append(
      el("section", { class: "hero" }, el("h1", { text: L().heroTitle }), el("p", { text: L().heroText })),
      el("ul", { class: "how" }, L().how.map(([a, b]) => el("li", {}, el("b", { text: a }), b))),
      el("p", { class: "progress-line", text: L().progress(solved, SCENARIOS.length, totalStars) }),
      el("div", { class: "grid" }, SCENARIOS.map((sc) => {
        const p = progress[sc.id];
        return el("article", { class: "card" },
          el("div", { class: "meta" }, el("span", { class: "chip topic", text: t(sc.topic, lang) }),
            el("span", { class: "chip", text: `${L().level} ${sc.level}` }), el("span", { class: "chip", text: `~${sc.minutes} ${L().min}` })),
          el("h2", { text: t(sc.title, lang) }),
          el("p", { class: "from", text: `${sc.ticket.id} · ${sc.ticket.from}` }),
          el("div", { class: "foot-row" }, p ? stars(p.stars) : el("span", { class: "chip", text: sc.ticket.priority }),
            el("a", { class: "btn", href: "#/desk/" + sc.id, text: p ? L().again : L().start })));
      })));
    app.focus();
  }

  /* ---------- desk */
  function desk(id) {
    const sc = SCENARIOS.find((s) => s.id === id);
    const app = document.getElementById("app");
    app.replaceChildren();
    if (!sc) { app.append(el("p", { text: L().notFound }), el("a", { class: "btn", href: "#/", text: L().home })); return; }
    const sess = E.createSession(sc, lang);
    current = { sc, sess, hist: [], pos: 0 };
    document.title = t(sc.title, lang) + " · SysAdmin Desks";

    const out = el("div", { class: "out", "aria-live": "polite" });
    const input = el("input", { type: "text", autocomplete: "off", autocapitalize: "off", spellcheck: "false", "aria-label": "Console" });
    const form = el("form", { onsubmit: (ev) => { ev.preventDefault(); exec(input.value); input.value = ""; } },
      el("span", { class: "ps", text: E.prompt(sess) }), input);
    const term = el("div", { class: "term", onclick: () => { if (!window.getSelection().toString()) input.focus(); } }, out, form);
    const stagesList = el("ul", { class: "stages" });
    const hintBtn = el("button", { type: "button", class: "btn ghost", text: L().hint, onclick: () => { exec("hint"); input.focus(); } });
    const noteBox = el("div");

    function print(text, kind) { out.append(el("div", { class: "line " + (kind || "out"), text: text })); }
    function renderStages() {
      stagesList.replaceChildren(...E.stages(sess).map((s) =>
        el("li", { class: s.done ? "done" : "" }, el("span", { class: "box", "aria-hidden": "true", text: s.done ? "✓" : "" }), el("span", { text: t(s.label, lang) }))));
    }
    function ticketLines() {
      print(`[${sc.ticket.id}] ${sc.ticket.priority} · ${sc.ticket.from}`, "dim");
      print(t(sc.ticket.subject, lang), "say");
      print(t(sc.ticket.body, lang), "dim");
    }
    function exec(cmd) {
      if (!cmd.trim()) return;
      current.hist.push(cmd); current.pos = current.hist.length;
      print(E.prompt(sess) + cmd, "cmd");
      const r = E.run(sess, cmd);
      if (r.clear) out.replaceChildren();
      if (r.ticket) ticketLines();
      r.lines.forEach((l) => print(l.text, l.kind));
      renderStages();
      if (r.resolvedNow) showNote();
      term.scrollTop = term.scrollHeight;
    }
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "ArrowUp" && current.pos > 0) { current.pos -= 1; input.value = current.hist[current.pos]; ev.preventDefault(); }
      else if (ev.key === "ArrowDown") { current.pos = Math.min(current.hist.length, current.pos + 1); input.value = current.hist[current.pos] || ""; ev.preventDefault(); }
    });

    function showNote() {
      const ta = el("textarea", { "aria-label": L().noteTitle, maxlength: "2000" });
      const msg = el("p", { class: "msg" });
      noteBox.replaceChildren(el("section", { class: "panel note" }, el("h2", { text: L().noteTitle }), el("p", { text: L().noteText }), ta, msg,
        el("div", { class: "row" }, el("button", { type: "button", class: "btn", text: L().submit, onclick: () => {
          if (ta.value.trim().length < 10) { msg.textContent = L().noteEmpty; ta.focus(); return; }
          showResult(ta.value);
        } }))));
      ta.focus();
    }

    function showResult(text) {
      const note = E.checkNote(sc, text, lang);
      const sc2 = E.score(sess, note);
      const prev = progress[sc.id];
      if (!prev || sc2.points >= prev.points) { progress[sc.id] = { points: sc2.points, stars: sc2.stars, date: new Date().toISOString().slice(0, 10) }; save("progress", progress); }
      const idx = SCENARIOS.indexOf(sc);
      const nextSc = SCENARIOS[(idx + 1) % SCENARIOS.length];
      noteBox.replaceChildren(el("section", { class: "panel result" },
        el("h2", { text: L().result }),
        el("div", { class: "big-stars" }, "★".repeat(sc2.stars), el("span", { class: "off", text: "★".repeat(3 - sc2.stars) })),
        el("h3", { text: `${sc2.points} ${L().points}` }),
        el("p", { text: L().hintsUsed(sess.hints) }),
        note.found.length ? el("div", {}, el("b", { text: L().found }), el("ul", { class: "found" }, note.found.map((x) => el("li", { text: x })))) : null,
        note.missing.length ? el("div", {}, el("b", { text: L().missing }), el("ul", { class: "missing" }, note.missing.map((x) => el("li", { text: x })))) : null,
        el("details", {}, el("summary", { text: L().sample }), el("blockquote", { text: t(sc.sampleNote, lang) })),
        el("details", {}, el("summary", { text: L().solution }), el("div", { class: "solution", text: sc.solution.join("\n") })),
        el("div", { class: "row" }, el("a", { class: "btn", href: "#/desk/" + nextSc.id, text: L().next }),
          el("a", { class: "btn ghost", href: sc.guide, target: "_blank", rel: "noopener noreferrer", text: L().guide }),
          el("a", { class: "btn ghost", href: "#/", text: L().home }))));
      noteBox.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    app.append(
      el("div", { class: "desk-bar" }, el("a", { href: "#/", text: L().back }), el("h1", { text: t(sc.title, lang) })),
      el("div", { class: "desk" },
        el("aside", {},
          el("section", { class: "panel" }, el("h2", { text: L().ticket }),
            el("div", { class: "ticket-head" }, el("span", { text: `${sc.ticket.id} · ${sc.ticket.from}` }), el("span", { class: "prio " + sc.ticket.priority, text: sc.ticket.priority })),
            el("p", { class: "ticket-subject", text: t(sc.ticket.subject, lang) }), el("p", { class: "ticket-body", text: t(sc.ticket.body, lang) })),
          el("section", { class: "panel" }, el("h2", { text: L().context }), el("p", { class: "intro", text: t(sc.intro, lang) })),
          el("section", { class: "panel" }, el("h2", { text: L().stages }), stagesList),
          el("section", { class: "panel tools" }, hintBtn,
            el("button", { type: "button", class: "btn ghost", text: L().restart, onclick: () => desk(id) }),
            el("a", { class: "btn ghost", href: sc.guide, target: "_blank", rel: "noopener noreferrer", text: L().guide }))),
        el("div", {}, term, el("p", { class: "term-help", text: L().termHelp }), noteBox)));

    print(L().welcome.replace("{host}", sc.machine.host).replace("{user}", sc.machine.domain + "\\" + sc.machine.user), "dim");
    print("", "out");
    renderStages();
    input.focus();
  }

  /* ---------- routing */
  function route() {
    chrome();
    const m = location.hash.match(/^#\/desk\/([a-z0-9-]+)$/);
    if (m) desk(m[1]); else home();
    window.scrollTo(0, 0);
  }
  document.getElementById("lang").addEventListener("click", () => {
    lang = lang === "es" ? "en" : "es";
    save("lang", lang);
    route();
  });
  window.addEventListener("hashchange", route);
  route();
})();
