/* SysAdmin Desks by IGG - free tickets (v0.9): a practice ticket the user logs from the queue (subject, requester from the
   directory, priority, category, description). It behaves like a simple ticket, with the SLA of its priority, the workflow states of
   workflow.js (assign, pending with the SLA paused, resume, unassign), work notes and a closure, but it is never graded: it is marked
   "free ticket" and left out of the scores, the streak and the badges. Pure logic, no DOM: the app keeps the tickets in this browser
   (sd.free) and the Node tests use the same code.

   Store: { v, seq, list: [ticket] }
   Ticket: { id: "FREE-0001", subject, requester, priority, category, description, created, rec (workflow record or null),
             notes: [{ at, text }], closed: { at, code, note, minutes } | null } */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./workflow.js"));
  else root.SDFree = factory(root.SDWorkflow);
})(typeof self !== "undefined" ? self : this, function (W) {
  "use strict";

  const FORMAT = 1;
  const SLA = { P1: 20, P2: 30, P3: 45 };
  const PRIORITIES = ["P1", "P2", "P3"];
  const CATEGORIES = [
    { id: "access", name: { en: "Accounts and access", es: "Cuentas y accesos" } },
    { id: "hardware", name: { en: "Hardware", es: "Hardware" } },
    { id: "software", name: { en: "Software and applications", es: "Software y aplicaciones" } },
    { id: "network", name: { en: "Network and VPN", es: "Red y VPN" } },
    { id: "email", name: { en: "Email and Microsoft 365", es: "Correo y Microsoft 365" } },
    { id: "printing", name: { en: "Printing", es: "Impresión" } },
    { id: "other", name: { en: "Other", es: "Otros" } },
  ];
  // closing codes for a free ticket (simple, and never checked against anything)
  const CODES = [
    { id: "fixed", name: { en: "Fixed", es: "Solucionado" } },
    { id: "workaround", name: { en: "Workaround applied", es: "Solución temporal" } },
    { id: "info", name: { en: "Information given", es: "Información facilitada" } },
    { id: "duplicate", name: { en: "Duplicate", es: "Duplicado" } },
    { id: "cancelled", name: { en: "Cancelled by the requester", es: "Cancelado por el solicitante" } },
  ];
  const LIMITS = { subjectMin: 5, subject: 120, descMin: 10, desc: 2000, noteMin: 5, note: 1000, closeMin: 10, max: 50 };
  const t = (v, lang) => (v == null ? "" : typeof v === "string" ? v : v[lang] || v.en || "");
  const clean = (s, n) => String(s == null ? "" : s).replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").trim().slice(0, n);
  const ID = /^FREE-\d{4}$/;

  function empty() { return { v: FORMAT, seq: 0, list: [] }; }
  function normalise(store) {
    const s = empty();
    if (!store || typeof store !== "object" || !Array.isArray(store.list)) return s;
    s.list = store.list.filter((x) => x && ID.test(x.id) && typeof x.subject === "string" && PRIORITIES.includes(x.priority))
      .map((x) => Object.assign({}, x, { rec: W.normalise(x.rec), notes: Array.isArray(x.notes) ? x.notes.slice(-100) : [], closed: x.closed && typeof x.closed === "object" ? x.closed : null }))
      .slice(-LIMITS.max);
    s.seq = Math.max(Number(store.seq) || 0, ...s.list.map((x) => Number(x.id.slice(5))), 0);
    return s;
  }
  function find(store, id) { return store.list.find((x) => x.id === id) || null; }
  function status(tk) { return tk.closed ? "closed" : tk.rec ? tk.rec.status : "new"; }
  function isOpen(tk) { return !tk.closed; }
  function sla(tk) { return SLA[tk.priority] || 45; }
  function minutesUsed(tk, now) { return tk.rec ? W.slaMinutesUsed(tk.rec, now) : 0; }
  function remaining(tk, now) { return sla(tk) - minutesUsed(tk, now); }

  // people: the directory users who can be requesters [{sam}]
  function validate(input, people) {
    const i = input || {};
    const errors = [];
    if (clean(i.subject, LIMITS.subject).length < LIMITS.subjectMin) errors.push("subject");
    if (!(people || []).some((p) => p.sam === i.requester)) errors.push("requester");
    if (!PRIORITIES.includes(i.priority)) errors.push("priority");
    if (!CATEGORIES.some((c) => c.id === i.category)) errors.push("category");
    if (clean(i.description, LIMITS.desc).length < LIMITS.descMin) errors.push("description");
    return errors;
  }
  // returns {ok, errors, store, ticket}; the store is a new object
  function create(store, input, people, now) {
    const errors = validate(input, people);
    if (errors.length) return { ok: false, errors };
    const s = normalise(store);
    if (s.list.filter(isOpen).length >= LIMITS.max) return { ok: false, errors: ["full"] };
    const seq = s.seq + 1;
    const ticket = { id: "FREE-" + String(seq).padStart(4, "0"), subject: clean(input.subject, LIMITS.subject).replace(/\n/g, " "), requester: input.requester,
      priority: input.priority, category: input.category, description: clean(input.description, LIMITS.desc), created: now, rec: null, notes: [], closed: null, free: true };
    s.list = s.list.concat(ticket).slice(-LIMITS.max);
    s.seq = seq;
    return { ok: true, errors: [], store: s, ticket };
  }
  function replace(store, tk) { return Object.assign({}, store, { list: store.list.map((x) => (x.id === tk.id ? tk : x)) }); }

  /* ---------- the workflow (workflow.js): {ok, error, store, ticket} */
  function assign(store, id, now) {
    const tk = find(store, id);
    if (!tk || tk.closed) return { ok: false, error: "transition" };
    if (tk.rec && tk.rec.status !== "new") return { ok: false, error: "transition" };
    const next = Object.assign({}, tk, { rec: W.assign(tk.rec, now) });
    return { ok: true, store: replace(store, next), ticket: next };
  }
  function move(store, id, to, opts) {
    const tk = find(store, id);
    if (!tk || tk.closed || to === "closed") return { ok: false, error: "transition" };
    const res = W.transition(tk.rec, to, opts);
    if (!res.ok) return res;
    const next = Object.assign({}, tk, { rec: res.rec });
    return { ok: true, store: replace(store, next), ticket: next };
  }
  // a work note while the ticket is assigned (in progress or pending)
  function addNote(store, id, text, now) {
    const tk = find(store, id);
    const body = clean(text, LIMITS.note);
    if (!tk || tk.closed || !tk.rec || tk.rec.status === "new") return { ok: false, error: "transition" };
    if (body.length < LIMITS.noteMin) return { ok: false, error: "empty" };
    const next = Object.assign({}, tk, { notes: tk.notes.concat({ at: now, text: body }).slice(-100) });
    return { ok: true, store: replace(store, next), ticket: next };
  }
  // closing: in progress only (like a desk), with a code and a resolution note. No score.
  function close(store, id, input, now) {
    const tk = find(store, id);
    const i = input || {};
    if (!tk || tk.closed) return { ok: false, error: "transition" };
    if (!W.canResolve(tk.rec)) return { ok: false, error: "state" };
    if (!CODES.some((c) => c.id === i.code)) return { ok: false, error: "code" };
    const note = clean(i.note, LIMITS.note);
    if (note.length < LIMITS.closeMin) return { ok: false, error: "note" };
    const fin = W.transition(tk.rec, "closed", { now });
    const minutes = Math.round(W.slaMinutesUsed(tk.rec, now) * 10) / 10;
    const next = Object.assign({}, tk, { rec: fin.ok ? fin.rec : tk.rec, closed: { at: now, code: i.code, note, minutes, slaOk: minutes <= sla(tk) } });
    return { ok: true, store: replace(store, next), ticket: next };
  }
  function remove(store, id) { return Object.assign({}, store, { list: store.list.filter((x) => x.id !== id) }); }

  return { FORMAT, SLA, PRIORITIES, CATEGORIES, CODES, LIMITS, t, empty, normalise, find, status, isOpen, sla, minutesUsed, remaining,
    validate, create, assign, move, addNote, close, remove };
});
