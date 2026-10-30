/* SysAdmin Desks by IGG - ticket workflow (v0.6): states, allowed transitions, reasons, the activity timeline and the SLA with pauses.
   Pure logic, no DOM: the app keeps one record per ticket in the browser (sd.work[deskId]) and the Node tests use the same code.

   A record: { status, startedAt, pausedMs, pausedAt, timeline: [{ at, from, to, reason }], extraMs?, contact? }
   - status: "new" (unassigned, after "Unassign"; the SLA keeps running), "progress" (assigned to me),
     "pending-user" or "pending-vendor" (the SLA is paused), and "closed" (resolved).
   - startedAt: when the ticket was first assigned (the SLA starts then and never restarts while the record lives).
   - pausedMs: time already spent in a pending state; pausedAt: when the current pause started (null if not paused).
   - extraMs and contact (v0.6a, written by comms.js): simulated SLA time spent asking the requester, and the questions asked;
     a timeline entry with `contact: <question id>` is one of those questions. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SDWorkflow = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const STATES = ["new", "progress", "pending-user", "pending-vendor", "closed"];
  const PENDING = ["pending-user", "pending-vendor"];
  // from -> the states it can go to
  const TRANSITIONS = {
    "new": ["progress"],
    "progress": ["pending-user", "pending-vendor", "new", "closed"],
    "pending-user": ["progress"],
    "pending-vendor": ["progress"],
    "closed": [],
  };
  const REASON_MIN = 15;
  const REASON_MAX = 300;

  function isPending(status) { return PENDING.indexOf(status) !== -1; }
  function canTransition(from, to) { return (TRANSITIONS[from] || []).indexOf(to) !== -1; }
  function cleanReason(text) { return String(text == null ? "" : text).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim(); }
  // a pause needs a short, real reason ("Waiting for the user to restart the laptop")
  function validReason(text) { const r = cleanReason(text); return r.length >= REASON_MIN && r.length <= REASON_MAX; }
  // going to a pending state needs a reason; the other moves do not
  function needsReason(to) { return isPending(to); }

  // a record saved by v0.5 was only {startedAt}: it was in progress and never paused
  function normalise(rec) {
    if (!rec || typeof rec !== "object" || !Number.isFinite(Number(rec.startedAt))) return null;
    const out = {
      status: STATES.indexOf(rec.status) !== -1 ? rec.status : "progress",
      startedAt: Number(rec.startedAt),
      pausedMs: Math.max(0, Number(rec.pausedMs) || 0),
      pausedAt: Number.isFinite(Number(rec.pausedAt)) && rec.pausedAt !== null ? Number(rec.pausedAt) : null,
      timeline: Array.isArray(rec.timeline) ? rec.timeline.slice(-100) : [],
    };
    // v0.6a: SLA time added by contacting the requester (1 minute per question), and the conversation itself (comms.js)
    if (Number(rec.extraMs) > 0) out.extraMs = Number(rec.extraMs);
    if (rec.contact && typeof rec.contact === "object" && Array.isArray(rec.contact.asked)) out.contact = { asked: rec.contact.asked.slice(-50) };
    return out;
  }

  // "Assign to me": a brand new record, or the same one again after "Unassign" (the SLA kept running)
  function assign(rec, now) {
    const r = normalise(rec);
    if (!r) return { status: "progress", startedAt: now, pausedMs: 0, pausedAt: null, timeline: [{ at: now, from: "new", to: "progress" }] };
    const res = transition(r, "progress", { now });
    return res.ok ? res.rec : r;
  }

  /* Moves a record to another state. Returns { ok: true, rec } with a new record (the old one is not changed),
     or { ok: false, error } with error "transition" (not allowed from here) or "reason" (missing or too short). */
  function transition(rec, to, opts) {
    const o = opts || {};
    const now = Number.isFinite(o.now) ? o.now : Date.now();
    const r = normalise(rec);
    if (!r) return { ok: false, error: "transition" };
    const from = r.status;
    if (!canTransition(from, to)) return { ok: false, error: "transition" };
    const reason = cleanReason(o.reason);
    if (needsReason(to) && !validReason(reason)) return { ok: false, error: "reason" };
    const next = Object.assign({}, r, { status: to, timeline: r.timeline.slice() });
    if (isPending(from) && r.pausedAt !== null) {
      next.pausedMs = r.pausedMs + Math.max(0, now - r.pausedAt);
      next.pausedAt = null;
    }
    if (isPending(to)) next.pausedAt = now;
    const entry = { at: now, from, to };
    if (reason) entry.reason = reason.slice(0, REASON_MAX);
    next.timeline.push(entry);
    return { ok: true, rec: next };
  }

  // time spent paused so far, counting the pause that is still going on
  function pausedMs(rec, now) {
    const r = normalise(rec);
    if (!r) return 0;
    return r.pausedMs + (r.pausedAt !== null ? Math.max(0, now - r.pausedAt) : 0);
  }
  // SLA time used: from the first assignment to now, minus the pauses (unassigned time counts, as on a real desk),
  // plus the simulated time spent talking to the requester (extraMs, v0.6a)
  function elapsedMs(rec, now) {
    const r = normalise(rec);
    if (!r) return 0;
    return Math.max(0, now - r.startedAt - pausedMs(r, now) + (r.extraMs || 0));
  }
  function slaMinutesUsed(rec, now) { return elapsedMs(rec, now) / 60000; }
  // minutes left of an SLA of limitMin minutes (negative once it is over)
  function slaRemaining(rec, limitMin, now) { return limitMin - slaMinutesUsed(rec, now); }
  function isPaused(rec) { const r = normalise(rec); return !!r && isPending(r.status); }
  // only a ticket in progress can be resolved: a pending one must be resumed first, a new one assigned first
  function canResolve(rec) { const r = normalise(rec); return !!r && r.status === "progress"; }
  // the console and the actions only work in progress
  function canWork(rec) { return canResolve(rec); }

  return { STATES, PENDING, TRANSITIONS, REASON_MIN, REASON_MAX, isPending, canTransition, cleanReason, validReason, needsReason,
    normalise, assign, transition, pausedMs, elapsedMs, slaMinutesUsed, slaRemaining, isPaused, canResolve, canWork };
});
