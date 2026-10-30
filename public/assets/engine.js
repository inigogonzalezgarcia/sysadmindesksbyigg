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

  // {user}, {host} and {domain} come from the machine; {$1}…{$9} (v0.8) are the groups the rule's `match` captured
  function fill(text, sc, groups) {
    const m = sc.machine || {};
    return text.replace(/\{(user|host|domain)\}/g, (_, k) => m[k] || "").replace(/\{\$([1-9])\}/g, (_, n) => (groups && groups[n]) || "");
  }

  function lines(value, lang, sc, groups) {
    const text = Array.isArray(value) ? value.join("\n") : t(value, lang);
    return text === "" ? [] : fill(text, sc, groups).split("\n");
  }

  function when(cond, state, negate) {
    if (!cond) return true;
    return Object.keys(cond).every((k) => (state[k] === cond[k]) !== Boolean(negate));
  }

  // v0.7a: the network desks (sc.net) run their console through the device CLI simulator (netcli.js)
  function NET() {
    if (typeof module === "object" && module.exports) return require("./netcli.js");
    return (typeof self !== "undefined" ? self : this).SDNet;
  }
  // the flags a network desk reads from the devices (sc.net.flags: {flag: check}), recomputed after every command
  function deriveNet(sess) {
    const f = (sess.sc.net || {}).flags || {};
    Object.keys(f).forEach((k) => { sess.state[k] = NET().check(sess.net, f[k]); });
  }

  // v0.7b: the desks closed with a shipment (sc.ship) use the shipments tool (shipping.js): `ship ...` lines, and flags read from the shipments
  function SHIP() {
    if (typeof module === "object" && module.exports) return require("./shipping.js");
    return (typeof self !== "undefined" ? self : this).SDShip;
  }
  function deriveShip(sess) {
    const f = (sess.sc.ship || {}).flags || {};
    Object.keys(f).forEach((k) => { sess.state[k] = SHIP().check(sess.ships, f[k]); });
  }

  function createSession(sc, lang) {
    const sess = {
      sc: sc,
      lang: lang || "en",
      state: Object.assign({}, sc.state || {}),
      history: [],
      used: new Set(),
      hints: 0,
      unknown: 0,
      resolved: false,
      resolvedAt: null,
      gui: 0,            // actions run from the ticket page instead of the console
      failedCloses: 0,   // times the ticket was closed before it was fixed
    };
    if (sc.net) {
      const N = NET();
      sess.net = N.createNet(sc.net.setup);
      if (sc.net.flow) sess.net.flow = Object.assign({}, sc.net.flow);
      sess.term = N.terminal(sess.net);
      deriveNet(sess);
    }
    if (sc.ship) {
      sess.ships = SHIP().createStore({ ticket: sc.ticket.id });
      deriveShip(sess);
    }
    return sess;
  }

  function prompt(sess) {
    if (sess.net) return NET().prompt(sess.term);
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
  function run(sess, input, opts) {
    const sc = sess.sc;
    const lang = sess.lang;
    const cmd = norm(input);
    const res = { lines: [], clear: false, ticket: false, resolvedNow: false };
    if (!cmd) return res;
    sess.history.push(cmd);
    const low = cmd.toLowerCase();

    if (low === "clear" || low === "cls") { res.clear = true; return res; }
    if (low === "help" || (low === "?" && !(sess.net && NET().depth(sess.term)))) { BUILTIN.help[lang === "es" ? "es" : "en"].forEach((x) => res.lines.push({ text: x, kind: "say" })); return res; }
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

    // v0.7b: `ship ...` goes to the shipments tool (on the workstation, never inside a device CLI); ticket-page buttons always reach it
    const o = opts || {};
    if (sc.ship && /^ship(\s|$)/i.test(cmd) && (!sess.net || o.local || (!o.term && NET().depth(sess.term) === 0))) return runShip(sess, cmd, res);
    if (sc.net) return runNet(sess, cmd, res, o);

    const rule = (sc.commands || []).find((r) => r.match && new RegExp(r.match, "i").test(cmd) && when(r.when, sess.state, false) &&
      !(r.unless && when(r.unless, sess.state, false)));
    if (!rule) {
      sess.unknown += 1;
      notRecognised(cmd, sc).forEach((x) => res.lines.push({ text: x, kind: "err" }));
      return res;
    }
    if (rule.id) sess.used.add(rule.id);
    const groups = new RegExp(rule.match, "i").exec(cmd);
    lines(rule.out, lang, sc, groups).forEach((x) => res.lines.push({ text: x, kind: rule.error ? "err" : "out" }));
    Object.assign(sess.state, rule.set || {});
    lines(rule.say, lang, sc, groups).forEach((x) => res.lines.push({ text: x, kind: "say" }));
    if (sc.ship) deriveShip(sess);

    if (!sess.resolved && goalMet(sc, sess.state)) {
      sess.resolved = true;
      sess.resolvedAt = sess.history.length;
      res.resolvedNow = true;
      lines(sc.resolved, lang, sc).forEach((x) => res.lines.push({ text: x, kind: "ok" }));
    }
    return res;
  }

  /* A network desk: scenario rules with a `match` run on your workstation (or anywhere with `anywhere: true`, like the on-site
     requests); everything else goes to the device CLI you are connected to. Then the rules with `on` react to what the device did
     (its tags: "show logging", "no shutdown Gi1/0/14", "debug flow allowed 12"...), and the flags are read again from the devices.
     opts.term runs the line on another terminal over the same net (the network room's CLI); opts.local runs a ticket-page action. */
  function applyRule(sess, rule, res) {
    const sc = sess.sc;
    if (rule.id) sess.used.add(rule.id);
    lines(rule.out, sess.lang, sc).forEach((x) => res.lines.push({ text: x, kind: rule.error ? "err" : "out" }));
    (rule.net || []).forEach((op) => NET().apply(sess.net, Object.assign({ live: true }, op)));
    Object.assign(sess.state, rule.set || {});
    lines(rule.say, sess.lang, sc).forEach((x) => res.lines.push({ text: x, kind: "say" }));
  }
  function runNet(sess, cmd, res, opts) {
    const sc = sess.sc;
    const N = NET();
    const term = opts.term || sess.term;
    const ok = (r) => when(r.when, sess.state, false) && !(r.unless && when(r.unless, sess.state, false));
    const atDesk = !opts.term && (opts.local || N.depth(term) === 0);
    const rule = (sc.commands || []).find((r) => r.match && (r.anywhere ? !opts.term : atDesk) && new RegExp(r.match, "i").test(cmd) && ok(r));
    let tags = [];
    if (rule) {
      applyRule(sess, rule, res);
      deriveNet(sess);
      if (sc.ship) deriveShip(sess);
    } else {
      const r = N.exec(term, cmd, { lang: sess.lang });
      if (r.unknown) sess.unknown += 1;
      r.lines.forEach((l) => res.lines.push(l));
      tags = r.tags;
      deriveNet(sess);
      // what the device did: the first matching `on` rule for each tag
      tags.forEach((tg) => {
        const hit = (sc.commands || []).find((x) => x.on && (!x.dev || x.dev === tg.dev) && new RegExp(x.on, "i").test(tg.tag) && ok(x));
        if (hit) { applyRule(sess, hit, res); deriveNet(sess); }
      });
    }
    res.prompt = N.prompt(term);
    res.tags = tags;
    if (!sess.resolved && goalMet(sc, sess.state)) {
      sess.resolved = true;
      sess.resolvedAt = sess.history.length;
      res.resolvedNow = true;
      lines(sc.resolved, sess.lang, sc).forEach((x) => res.lines.push({ text: x, kind: "ok" }));
    }
    return res;
  }

  /* A shipments line: the tool answers, then the desk's rules with `on` react to its tags ("ship submit rma escrow",
     "ship state rma transit", "ship mark 3FJ7WR3 stock"...), like the network desks react to a device. res.shipMs is the simulated time
     the step took (the app charges it to the SLA unless the ticket is pending) and res.ship the shipment it touched. */
  function runShip(sess, cmd, res) {
    const sc = sess.sc;
    const r = SHIP().exec(sess.ships, cmd, { lang: sess.lang });
    if (r.unknown) sess.unknown += 1;
    r.lines.forEach((l) => res.lines.push(l));
    res.shipMs = r.ms;
    res.ship = r.ship;
    res.tags = r.tags;
    deriveShip(sess);
    if (sess.net) deriveNet(sess);
    const ok = (x) => when(x.when, sess.state, false) && !(x.unless && when(x.unless, sess.state, false));
    r.tags.forEach((tg) => {
      const hit = (sc.commands || []).find((x) => x.on && !x.dev && new RegExp(x.on, "i").test(tg) && ok(x));
      if (hit) { applyRule(sess, hit, res); deriveShip(sess); if (sess.net) deriveNet(sess); }
    });
    if (sess.net) res.prompt = NET().prompt(sess.term);
    if (!sess.resolved && goalMet(sc, sess.state)) {
      sess.resolved = true;
      sess.resolvedAt = sess.history.length;
      res.resolvedNow = true;
      lines(sc.resolved, sess.lang, sc).forEach((x) => res.lines.push({ text: x, kind: "ok" }));
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

  /* ---------- the ticket page (v0.2): SLA, resolution codes, requester and asset cards, actions, three-level result */

  // minutes from "Assign to me" to closing the ticket
  const SLA = { P1: 20, P2: 30, P3: 45 };
  function sla(sc) { return SLA[sc.ticket.priority] || 45; }

  const CODES = [
    { id: "cause-removed", label: { en: "Root cause removed", es: "Causa raíz eliminada" } },
    { id: "config-fixed", label: { en: "Configuration corrected", es: "Configuración corregida" } },
    { id: "capacity", label: { en: "Space or quota freed", es: "Espacio o cuota liberados" } },
    { id: "compliance", label: { en: "Device brought into compliance", es: "Dispositivo puesto en cumplimiento" } },
    { id: "workaround", label: { en: "Workaround applied", es: "Solución temporal aplicada" } },
    { id: "hardware", label: { en: "Hardware repaired, replaced or returned", es: "Hardware reparado, sustituido o devuelto" } },
    { id: "user-guidance", label: { en: "User guidance", es: "Orientación al usuario" } },
    { id: "no-fault", label: { en: "No fault found", es: "Sin incidencia" } },
  ];
  function codeLabel(id, lang) {
    const c = CODES.find((x) => x.id === id);
    return c ? t(c.label, lang) : "";
  }

  // a card field is a fixed value, or the first of its states whose flags match the session
  function field(f, state, lang) {
    if (!f.states) return { label: t(f.label, lang), value: t(f.value, lang), tone: f.tone || "" };
    const st = f.states.find((x) => when(x.when, state, false)) || f.states[f.states.length - 1];
    return { label: t(f.label, lang), value: t(st.value, lang), tone: st.tone || "" };
  }
  function cards(sess) {
    const sc = sess.sc;
    const lang = sess.lang;
    const r = sc.requester || {};
    const a = sc.asset || { fields: [] };
    return {
      requester: { name: t(r.name, lang), team: t(r.team, lang), user: r.user || "", location: t(r.location, lang), device: r.device || "" },
      asset: { title: t(a.title, lang), fields: a.fields.map((f) => field(f, sess.state, lang)) },
      actions: (sc.actions || []).map((x) => ({ id: x.id, label: t(x.label, lang), enabled: when(x.when, sess.state, false) })),
    };
  }

  // an action on the ticket page does exactly what its command does in the console
  function act(sess, id) {
    const x = (sess.sc.actions || []).find((a) => a.id === id);
    if (!x || !when(x.when, sess.state, false)) return null;
    sess.gui += 1;
    const res = run(sess, x.cmd, { local: true });
    res.command = x.cmd;
    return res;
  }

  /* Closing the ticket: "resolved", "observations" (fixed, but the note, the code or the SLA need work) or "unresolved".
     opts: { code, minutes } (minutes since the ticket was assigned). Closing it unresolved counts against the next close. */
  function verdict(sess, note, opts) {
    const sc = sess.sc;
    const lang = sess.lang;
    const es = lang === "es";
    const o = opts || {};
    const limit = sla(sc);
    if (!sess.resolved) {
      sess.failedCloses += 1;
      const pending = stages(sess).filter((s) => !s.done).map((s) => t(s.label, lang));
      return { level: "unresolved", points: 0, stars: 0, codeOk: false, slaOk: true, pending: pending,
        reasons: pending.map((p) => (es ? "Sin hacer: " : "Not done: ") + p.charAt(0).toLowerCase() + p.slice(1)) };
    }
    const codeOk = (sc.codes || []).indexOf(o.code) !== -1;
    const minutes = Math.max(0, Number(o.minutes) || 0);
    const slaOk = minutes <= limit;
    const reasons = [];
    if (note) {
      note.missing.forEach((m) => reasons.push((es ? "A la nota le falta " : "The note is missing ") + m));
      if (note.words < 15) reasons.push(es ? "La nota es muy corta (menos de 15 palabras)" : "The note is very short (under 15 words)");
    }
    if (!codeOk) reasons.push((es ? "Código de resolución: mejor «" : "Resolution code: better “") + codeLabel((sc.codes || [])[0], lang) + (es ? "»" : "”"));
    if (!slaOk) reasons.push(es ? `Cerrado fuera del SLA (${Math.ceil(minutes)} de ${limit} min)` : `Closed outside the SLA (${Math.ceil(minutes)} of ${limit} min)`);
    // v0.7b: a desk can name things that were done badly on the way, even if the ticket is now fixed (sc.remarks: [{when, text}])
    const marks = (sc.remarks || []).filter((rm) => when(rm.when, sess.state, false));
    marks.forEach((rm) => reasons.push(t(rm.text, lang)));
    const n = sess.failedCloses;
    if (n) reasons.push(es ? (n === 1 ? "Se cerró una vez sin estar arreglado" : `Se cerró ${n} veces sin estar arreglado`)
      : (n === 1 ? "Closed once before it was fixed" : `Closed ${n} times before it was fixed`));
    let points = score(sess, note).points - (codeOk ? 0 : 10) - (slaOk ? 0 : 10) - 10 * sess.failedCloses - 10 * marks.length;
    points = Math.max(0, Math.min(100, points));
    return { level: reasons.length ? "observations" : "resolved", points: points, stars: points >= 90 ? 3 : points >= 70 ? 2 : points >= 40 ? 1 : 0,
      codeOk: codeOk, slaOk: slaOk, pending: [], reasons: reasons };
  }

  /* ---------- the shared world and the desktop (v0.3) */

  // the rule a command would match right now, without running it (the directory uses it to hand a command to an open ticket)
  function matches(sess, input) {
    const cmd = norm(input);
    if (!cmd || sess.sc.net) return null;
    return (sess.sc.commands || []).find((r) => r.match && new RegExp(r.match, "i").test(cmd) && when(r.when, sess.state, false) &&
      !(r.unless && when(r.unless, sess.state, false))) || null;
  }

  // what a ticket says about the directory and the inventory: [{kind, id, set, note}] for the session's current state
  function bound(sess) {
    return (sess.sc.bind || []).map((b) => {
      const st = b.states.find((x) => when(x.when, sess.state, false)) || b.states[b.states.length - 1];
      return { kind: b.kind, id: b.id, set: Object.assign({}, st.set || {}), note: t(st.note, sess.lang) };
    });
  }

  // the desktop of the user's machine ("Go to the desk"): apps with fields, actions and a page, and the event log
  function desktop(sess) {
    const d = sess.sc.desktop;
    if (!d) return null;
    const lang = sess.lang;
    const pick = (states) => states.find((x) => when(x.when, sess.state, false)) || states[states.length - 1];
    return {
      host: sess.sc.machine.host,
      apps: d.apps.map((a) => {
        const page = a.page ? pick(a.page.states) : null;
        return {
          id: a.id, icon: a.icon || "▣", title: t(a.title, lang), look: a.look || null,
          fields: (a.fields || []).map((f) => field(f, sess.state, lang)),
          actions: (a.actions || []).map((x) => ({ id: x.id, label: t(x.label, lang), enabled: when(x.when, sess.state, false), cmd: x.cmd })),
          page: page ? { url: a.page.url, title: t(page.title, lang), text: t(page.text, lang), tone: page.tone || "" } : null,
        };
      }),
      log: (d.log || []).filter((e) => when(e.when, sess.state, false)).map((e) => ({ level: e.level, time: e.time, source: e.source, id: e.id, text: t(e.text, lang) })),
      logNote: t(d.logNote, lang),
    };
  }
  // opening an app runs what you would type to see the same thing (ipconfig /all for the network settings...)
  function deskOpen(sess, appId) {
    const a = ((sess.sc.desktop || {}).apps || []).find((x) => x.id === appId);
    if (!a || !a.look) return null;
    const res = run(sess, a.look);
    res.command = a.look;
    return res;
  }
  function deskAct(sess, appId, actionId) {
    const a = ((sess.sc.desktop || {}).apps || []).find((x) => x.id === appId);
    const x = a && (a.actions || []).find((y) => y.id === actionId);
    if (!x || !when(x.when, sess.state, false)) return null;
    sess.gui += 1;
    const res = run(sess, x.cmd);
    res.command = x.cmd;
    return res;
  }

  return { norm: norm, fold: fold, t: t, createSession: createSession, prompt: prompt, run: run, goalMet: goalMet, stages: stages,
           checkNote: checkNote, score: score, SLA: SLA, sla: sla, CODES: CODES, codeLabel: codeLabel, cards: cards, act: act, verdict: verdict,
           matches: matches, bound: bound, desktop: desktop, deskOpen: deskOpen, deskAct: deskAct, NET: NET, SHIP: SHIP, deriveShip: deriveShip };
});
