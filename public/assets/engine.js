/* SysAdmin Desks by IGG - scenario engine.
   Pure logic, no DOM: the browser app and the Node tests use the same code.
   A scenario is data (see docs/scenario-format.md): a ticket, a simulated machine, command rules that read and change a small state,
   a goal, and the elements a good work note must contain. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SDEngine = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function norm(s) {
    return String(s || "").trim().replace(/\s+/g, " ");
  }

  function fold(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function t(value, lang) {
    if (value == null) return "";
    if (typeof value === "string") return value;
    return value[lang] || value.en || "";
  }

  function fill(text, sc) {
    const m = sc.machine || {};
    return text.replace(/\{(user|host|domain)\}/g, (_, k) => m[k] || "");
  }

  function lines(value, lang, sc) {
    const text = Array.isArray(value) ? value.join("\n") : t(value, lang);
    return text === "" ? [] : fill(text, sc).split("\n");
  }

  function when(cond, state, negate) {
    if (!cond) return true;
    return Object.keys(cond).every((k) => (state[k] === cond[k]) !== Boolean(negate));
  }

  function createSession(sc, lang) {
    return {
      sc: sc,
      lang: lang || "en",
      state: Object.assign({}, sc.state || {}),
      history: [],
      used: new Set(),
      hints: 0,
      unknown: 0,
      resolved: false,
      resolvedAt: null,
    };
  }

  function prompt(sess) {
    const m = sess.sc.machine || {};
    return fill(m.prompt || "PS C:\\> ", sess.sc);
  }

  const BUILTIN = {
    help: {
      en: [
        "This is a guided simulation of a support desk. Type the commands you would use on a real machine.",
        "  hint          show the next hint (costs points)",
        "  clear / cls   clear the screen",
        "  ticket        show the ticket again",
        "Commands are not case-sensitive. Arrow up/down repeats earlier commands.",
      ],
      es: [
        "Esto es una simulación guiada de un puesto de soporte. Escribe los comandos que usarías en un equipo real.",
        "  hint          muestra la siguiente pista (resta puntos)",
        "  clear / cls   limpia la pantalla",
        "  ticket        vuelve a mostrar el ticket",
        "Los comandos no distinguen mayúsculas. Flecha arriba/abajo repite comandos anteriores.",
      ],
    },
  };

  function notRecognised(cmd, sc) {
    const word = cmd.split(" ")[0];
    if ((sc.machine || {}).shell === "bash") return [word + ": command not found"];
    return [
      word + " : The term '" + word + "' is not recognized as the name of a cmdlet, function, script file, or operable program.",
      "Check the spelling of the name, or if a path was included, verify that the path is correct and try again.",
    ];
  }

  /* Runs one command. Returns {lines:[{text, kind}], clear, ticket, resolvedNow}.
     kind: "out" (console output), "say" (narration in the user's language), "err", "event", "ok". */
  function run(sess, input) {
    const sc = sess.sc;
    const lang = sess.lang;
    const cmd = norm(input);
    const res = { lines: [], clear: false, ticket: false, resolvedNow: false };
    if (!cmd) return res;
    sess.history.push(cmd);
    const low = cmd.toLowerCase();

    if (low === "clear" || low === "cls") { res.clear = true; return res; }
    if (low === "help" || low === "?") { BUILTIN.help[lang === "es" ? "es" : "en"].forEach((x) => res.lines.push({ text: x, kind: "say" })); return res; }
    if (low === "ticket") { res.ticket = true; return res; }
    if (low === "hint") {
      const hs = sc.hints || [];
      if (sess.hints < hs.length) {
        res.lines.push({ text: (lang === "es" ? "Pista " : "Hint ") + (sess.hints + 1) + "/" + hs.length + ": " + t(hs[sess.hints], lang), kind: "say" });
        sess.hints += 1;
      } else {
        res.lines.push({ text: lang === "es" ? "No quedan más pistas." : "No more hints.", kind: "say" });
      }
      return res;
    }

    // events fire on the command after the one that armed them (e.g. "the account locks again")
    (sc.events || []).forEach((ev) => {
      if (when(ev.when, sess.state, false)) {
        Object.assign(sess.state, ev.set || {});
        lines(ev.say, lang, sc).forEach((x) => res.lines.push({ text: x, kind: "event" }));
      }
    });

    const rule = (sc.commands || []).find((r) => new RegExp(r.match, "i").test(cmd) && when(r.when, sess.state, false) &&
      !(r.unless && when(r.unless, sess.state, false)));
    if (!rule) {
      sess.unknown += 1;
      notRecognised(cmd, sc).forEach((x) => res.lines.push({ text: x, kind: "err" }));
      return res;
    }
    if (rule.id) sess.used.add(rule.id);
    lines(rule.out, lang, sc).forEach((x) => res.lines.push({ text: x, kind: rule.error ? "err" : "out" }));
    Object.assign(sess.state, rule.set || {});
    lines(rule.say, lang, sc).forEach((x) => res.lines.push({ text: x, kind: "say" }));

    if (!sess.resolved && goalMet(sc, sess.state)) {
      sess.resolved = true;
      sess.resolvedAt = sess.history.length;
      res.resolvedNow = true;
      lines(sc.resolved, lang, sc).forEach((x) => res.lines.push({ text: x, kind: "ok" }));
    }
    return res;
  }

  function goalMet(sc, state) {
    return Object.keys(sc.goal || {}).every((k) => state[k] === sc.goal[k]);
  }

  /* Progress through the scenario's stages (investigate, fix, verify), from the flags in the state. */
  function stages(sess) {
    return (sess.sc.stages || []).map((st) => ({ id: st.id, label: st.label, done: when(st.when, sess.state, false) }));
  }

  /* A work note is checked for the elements an engineer reading the ticket later needs: cause, fix, verification... */
  function checkNote(sc, text, lang) {
    const f = fold(text);
    const out = { found: [], missing: [], words: f.split(/\s+/).filter(Boolean).length };
    (sc.note || []).forEach((el) => {
      const hit = el.any.some((w) => f.indexOf(fold(w)) !== -1);
      (hit ? out.found : out.missing).push(t(el.label, lang));
    });
    return out;
  }

  /* 100 points: -10 per hint, -2 per unrecognised command after the first three, -10 per missing note element, -10 for a note under 15 words. */
  function score(sess, note) {
    let s = 100 - 10 * sess.hints - 2 * Math.max(0, sess.unknown - 3);
    if (note) {
      s -= 10 * note.missing.length;
      if (note.words < 15) s -= 10;
    }
    s = Math.max(0, Math.min(100, s));
    return { points: s, stars: s >= 90 ? 3 : s >= 70 ? 2 : s >= 40 ? 1 : 0 };
  }

  return { norm: norm, fold: fold, t: t, createSession: createSession, prompt: prompt, run: run, goalMet: goalMet, stages: stages,
           checkNote: checkNote, score: score };
});
