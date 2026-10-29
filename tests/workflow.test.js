// Ticket workflow (v0.6): states, transitions, reasons, the activity timeline and the SLA with pauses.
const test = require("node:test");
const assert = require("node:assert/strict");
const W = require("../public/assets/workflow.js");
const E = require("../public/assets/engine.js");
const SCENARIOS = require("../public/assets/scenarios.js");

const MIN = 60000;
const T0 = Date.UTC(2026, 9, 29, 9, 0, 0);
const at = (m) => T0 + m * MIN;
const REASON = "Waiting for the user to restart the laptop";
const step = (rec, to, m, reason) => {
  const r = W.transition(rec, to, { now: at(m), reason });
  assert.ok(r.ok, `${rec && rec.status} -> ${to}: ${r.error}`);
  return r.rec;
};

test("allowed and refused transitions", () => {
  assert.deepEqual(W.STATES, ["new", "progress", "pending-user", "pending-vendor", "closed"]);
  const allowed = [["new", "progress"], ["progress", "pending-user"], ["progress", "pending-vendor"], ["progress", "new"], ["progress", "closed"],
    ["pending-user", "progress"], ["pending-vendor", "progress"]];
  for (const from of W.STATES) for (const to of W.STATES) {
    const want = allowed.some(([a, b]) => a === from && b === to);
    assert.equal(W.canTransition(from, to), want, `${from} -> ${to}`);
  }
  let rec = W.assign(null, at(0));
  assert.equal(W.transition(rec, "progress", { now: at(1) }).error, "transition");
  rec = step(rec, "pending-vendor", 2, REASON);
  assert.equal(W.transition(rec, "pending-user", { now: at(3), reason: REASON }).error, "transition", "pending to pending: resume first");
  assert.equal(W.transition(rec, "new", { now: at(3) }).error, "transition", "cannot unassign while pending");
  assert.equal(W.transition(null, "progress", { now: at(0) }).error, "transition");
});

test("a pending state needs a reason of 15 characters or more", () => {
  const rec = W.assign(null, at(0));
  for (const bad of [undefined, "", "   ", "waiting", "  short reason  ", "x".repeat(W.REASON_MAX + 1)]) {
    assert.equal(W.transition(rec, "pending-user", { now: at(1), reason: bad }).error, "reason", JSON.stringify(bad));
  }
  assert.equal(W.validReason("Waiting for logs"), true);
  assert.equal(W.validReason("  Waiting\n\n   for   x  "), false);   // whitespace is folded: "Waiting for x" is 13 characters
  assert.equal(W.validReason("Waiting for x"), false);
  assert.equal(W.cleanReason("  a\u0007b \n c "), "a b c");
  assert.equal(W.needsReason("pending-vendor"), true);
  assert.equal(W.needsReason("progress"), false);
  assert.ok(W.transition(rec, "pending-user", { now: at(1), reason: "Waiting for logs" }).ok);
  assert.equal(rec.status, "progress", "transition does not change the record it was given");
});

test("SLA remaining with one pause: the clock freezes while pending and goes on from there", () => {
  let rec = W.assign(null, at(0));
  assert.equal(W.slaRemaining(rec, 30, at(10)), 20);
  rec = step(rec, "pending-user", 10, REASON);
  assert.equal(W.isPaused(rec), true);
  assert.equal(W.slaRemaining(rec, 30, at(10)), 20);
  assert.equal(W.slaRemaining(rec, 30, at(25)), 20, "frozen while pending");
  assert.equal(W.pausedMs(rec, at(25)), 15 * MIN);
  rec = step(rec, "progress", 25);
  assert.equal(W.isPaused(rec), false);
  assert.equal(rec.pausedMs, 15 * MIN);
  assert.equal(W.slaRemaining(rec, 30, at(25)), 20, "resumes where it stopped");
  assert.equal(W.slaRemaining(rec, 30, at(30)), 15);
  assert.equal(W.slaRemaining(rec, 30, at(50)), -5);
});

test("SLA remaining with several pauses", () => {
  let rec = W.assign(null, at(0));
  rec = step(rec, "pending-user", 5, REASON);
  rec = step(rec, "progress", 12, null);           // 7 paused
  rec = step(rec, "pending-vendor", 20, "Vendor case 4711 opened for the firmware");
  assert.equal(W.slaMinutesUsed(rec, at(40)), 13);  // 5 + 8, the second pause is still going on
  rec = step(rec, "progress", 41);                  // 21 paused
  assert.equal(W.pausedMs(rec, at(41)), 28 * MIN);
  assert.equal(W.slaMinutesUsed(rec, at(45)), 17);
  assert.equal(W.slaRemaining(rec, 20, at(45)), 3);
});

test("cannot resolve while pending or unassigned; can once resumed", () => {
  let rec = W.assign(null, at(0));
  assert.equal(W.canResolve(rec), true);
  rec = step(rec, "pending-user", 1, REASON);
  assert.equal(W.canResolve(rec), false);
  assert.equal(W.canWork(rec), false, "console read-only while pending");
  assert.equal(W.transition(rec, "closed", { now: at(2) }).error, "transition");
  rec = step(rec, "progress", 3);
  assert.equal(W.canResolve(rec), true);
  rec = step(rec, "closed", 4);
  assert.equal(rec.status, "closed");
  assert.equal(W.canResolve(null), false);
});

test("unassign returns the ticket to New and the SLA keeps running", () => {
  let rec = W.assign(null, at(0));
  rec = step(rec, "new", 6);
  assert.equal(rec.status, "new");
  assert.equal(W.canWork(rec), false);
  assert.equal(W.slaRemaining(rec, 20, at(16)), 4, "unassigned time counts");
  rec = W.assign(rec, at(16));
  assert.equal(rec.status, "progress");
  assert.equal(rec.startedAt, at(0), "re-assigning keeps the original start");
  assert.equal(W.slaRemaining(rec, 20, at(18)), 2);
});

test("every change is in the timeline with time, from, to and reason", () => {
  let rec = W.assign(null, at(0));
  rec = step(rec, "pending-user", 2, "  Waiting for the user   to reboot  ");
  rec = step(rec, "progress", 9);
  rec = step(rec, "new", 10);
  rec = W.assign(rec, at(11));
  rec = step(rec, "closed", 15);
  assert.deepEqual(rec.timeline, [
    { at: at(0), from: "new", to: "progress" },
    { at: at(2), from: "progress", to: "pending-user", reason: "Waiting for the user to reboot" },
    { at: at(9), from: "pending-user", to: "progress" },
    { at: at(10), from: "progress", to: "new" },
    { at: at(11), from: "new", to: "progress" },
    { at: at(15), from: "progress", to: "closed" },
  ]);
});

test("a v0.5 record ({startedAt}) still works, in progress and never paused", () => {
  const rec = W.normalise({ startedAt: at(0) });
  assert.deepEqual(rec, { status: "progress", startedAt: at(0), pausedMs: 0, pausedAt: null, timeline: [] });
  assert.equal(W.slaRemaining({ startedAt: at(0) }, 45, at(5)), 40);
  assert.equal(W.normalise(null), null);
  assert.equal(W.normalise({}), null);
});

test("the verdict does not penalise legitimate pauses: the SLA minutes exclude the paused time", () => {
  const sc = SCENARIOS.find((s) => s.id === "print-queue");
  let rec = W.assign(null, at(0));
  rec = step(rec, "pending-vendor", 10, "Waiting for the printer vendor to call back");
  rec = step(rec, "progress", 70);
  const sess = E.createSession(sc, "en");
  sc.solution.forEach((c) => E.run(sess, c));
  const minutes = W.slaMinutesUsed(rec, at(75));      // 15 of 30, although 75 have passed
  const v = E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: sc.codes[0], minutes });
  assert.equal(minutes, 15);
  assert.deepEqual([v.level, v.points, v.slaOk], ["resolved", 100, true]);
});
