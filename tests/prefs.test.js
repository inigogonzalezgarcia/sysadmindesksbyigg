// v0.9: preferences (prefs.js) and free tickets (freetix.js).
const test = require("node:test");
const assert = require("node:assert/strict");
const P = require("../public/assets/prefs.js");
const F = require("../public/assets/freetix.js");
const G = require("../public/assets/growth.js");
const W = require("../public/assets/world.js");

test("preferences: defaults, normalising and updates", () => {
  const d = P.normalise(null);
  assert.deepEqual(d, { v: 1, reminder: { on: false, time: "18:00", notify: false }, sounds: false, tz: "", motion: false }, "sounds off by default");
  assert.deepEqual(P.normalise({ reminder: { on: "yes", time: "25:00", notify: true }, sounds: 1, tz: "Mars/Olympus", motion: true }),
    { v: 1, reminder: { on: false, time: "18:00", notify: false }, sounds: false, tz: "", motion: true });
  let p = P.update(d, { reminder: { on: true, time: "09:30" } });
  assert.deepEqual(p.reminder, { on: true, time: "09:30", notify: false });
  p = P.update(p, { reminder: { notify: true }, sounds: true, tz: "America/Bogota" });
  assert.equal(p.reminder.notify && p.reminder.time === "09:30" && p.sounds, true);
  assert.equal(p.tz, "America/Bogota");
  assert.equal(P.update(p, { reminder: { on: false } }).reminder.notify, false, "no notification without the reminder");
  assert.ok(P.validZone("Europe/Madrid") && !P.validZone("Nowhere/Land") && !P.validZone(""));
  assert.equal(P.zoneOf({ tz: "Asia/Tokyo" }), "Asia/Tokyo");
  assert.equal(P.zoneOf({ tz: "" }), P.browserZone());
  assert.ok(P.zones().includes("Europe/Madrid") && P.zones()[0] === "Europe/Madrid");
});

test("time zones: wall clock, day boundaries and offsets (summer time included)", () => {
  const t = Date.UTC(2026, 9, 26, 23, 30);   // Monday 26/10/2026 23:30 UTC (Madrid is UTC+1 after 25 October)
  assert.equal(P.dayIn(t, "UTC"), "2026-10-26");
  assert.equal(P.dayIn(t, "Europe/Madrid"), "2026-10-27", "already Tuesday in Madrid");
  assert.equal(P.dayIn(t, "America/Mexico_City"), "2026-10-26");
  assert.equal(P.timeIn(t, "Europe/Madrid"), "00:30");
  assert.equal(P.timeIn(t, "Asia/Tokyo", true), "08:30:00");
  assert.equal(P.offsetLabel(t, "Europe/Madrid"), "UTC+01:00");
  assert.equal(P.offsetLabel(Date.UTC(2026, 6, 1, 12), "Europe/Madrid"), "UTC+02:00", "summer time");
  assert.equal(P.offsetLabel(t, "America/Bogota"), "UTC-05:00");
  assert.equal(P.minuteOfDay(t, "UTC"), 23 * 60 + 30);
  // the streak counts the days of the chosen zone: two closes 30 minutes apart either side of midnight in Madrid
  const a = Date.UTC(2026, 9, 26, 22, 50);   // 23:50 in Madrid
  const b = Date.UTC(2026, 9, 26, 23, 20);   // 00:20 in Madrid, the next day
  const days = (tz) => [a, b].map((ms) => ({ type: "mail", id: "x" + ms, day: P.dayIn(ms, tz) }));
  assert.deepEqual(G.streak(days("Europe/Madrid"), P.dayIn(b, "Europe/Madrid")), { current: 2, best: 2, today: true });
  assert.deepEqual(G.streak(days("UTC"), P.dayIn(b, "UTC")), { current: 1, best: 1, today: true });
});

test("the daily reminder is due once a day, after its time, and not if you already practised", () => {
  const prefs = P.update(null, { reminder: { on: true, time: "18:00" }, tz: "Europe/Madrid" });
  const before = Date.UTC(2026, 9, 27, 16, 59);   // 17:59 in Madrid
  const after = Date.UTC(2026, 9, 27, 17, 1);     // 18:01
  assert.equal(P.reminderDue(prefs, before, null, false), false);
  assert.equal(P.reminderDue(prefs, after, null, false), true);
  assert.equal(P.reminderDue(prefs, after, null, true), false, "already practised today");
  const shown = P.reminderShown(prefs, after);
  assert.deepEqual(shown, { lastShown: "2026-10-27" });
  assert.equal(P.reminderDue(prefs, after + 3600000, shown, false), false, "once a day");
  assert.equal(P.reminderDue(prefs, Date.UTC(2026, 9, 28, 17, 30), shown, false), true, "again the next day");
  assert.equal(P.reminderDue(P.update(prefs, { reminder: { on: false } }), after, null, false), false, "off");
  // the same instant in another zone: 18:01 in Madrid is 12:01 in Bogotá
  assert.equal(P.reminderDue(P.update(prefs, { tz: "America/Bogota" }), after, null, false), false);
});

test("celebration sounds only when turned on", () => {
  assert.deepEqual(P.sound(null, "resolved"), []);
  const on = P.update(null, { sounds: true });
  for (const k of ["resolved", "badge", "task", "complete"]) {
    const s = P.sound(on, k);
    assert.ok(s.length && s.every((n) => n.f > 200 && n.f < 2000 && n.d > 0 && n.d <= 0.2 && n.at >= 0), k + " short blips");
  }
  assert.deepEqual(P.sound(on, "nope"), []);
});

test("free tickets: create, workflow with the SLA paused, notes and closing, never graded", () => {
  const people = W.createWorld().users;
  let store = F.normalise(null);
  const bad = F.create(store, { subject: "x", requester: "nobody", priority: "P9", category: "?", description: "" }, people, 0);
  assert.deepEqual(bad.errors, ["subject", "requester", "priority", "category", "description"]);
  const input = { subject: "The monitor flickers", requester: "jruiz", priority: "P2", category: "hardware", description: "The second screen flickers after lunch." };
  const c = F.create(store, input, people, 1000);
  assert.ok(c.ok);
  assert.equal(c.ticket.id, "FREE-0001");
  assert.equal(c.ticket.free, true);
  assert.equal(F.status(c.ticket), "new");
  assert.equal(F.sla(c.ticket), 30);
  store = c.store;
  const id = c.ticket.id;
  assert.equal(F.addNote(store, id, "Looking at it", 2000).error, "transition", "assign it first");
  assert.equal(F.close(store, id, { code: "fixed", note: "Replaced the cable" }, 2000).error, "state");
  store = F.assign(store, id, 60000).store;
  assert.equal(F.status(F.find(store, id)), "progress");
  store = F.addNote(store, id, "Swapped the DisplayPort cable", 120000).store;
  assert.equal(F.addNote(store, id, "ok", 0).error, "empty");
  assert.equal(F.move(store, id, "pending-user", { now: 180000, reason: "short" }).error, "reason");
  store = F.move(store, id, "pending-user", { now: 180000, reason: "Waiting for Javier to test after lunch" }).store;
  assert.equal(F.close(store, id, { code: "fixed", note: "Replaced the cable and tested" }, 200000).error, "state", "resume first");
  store = F.move(store, id, "progress", { now: 1380000 }).store;   // 20 minutes paused
  assert.equal(Math.round(F.minutesUsed(F.find(store, id), 1440000)), 3, "the pause does not count");
  assert.equal(F.close(store, id, { code: "nope", note: "Replaced the cable" }, 1440000).error, "code");
  assert.equal(F.close(store, id, { code: "fixed", note: "short" }, 1440000).error, "note");
  const done = F.close(store, id, { code: "fixed", note: "Replaced the DisplayPort cable; Javier confirms." }, 1440000);
  assert.ok(done.ok);
  assert.equal(F.status(done.ticket), "closed");
  assert.equal(done.ticket.closed.slaOk, true);
  assert.equal(done.ticket.notes.length, 1);
  assert.ok(!("points" in done.ticket.closed) && !("stars" in done.ticket.closed), "no score");
  store = done.store;
  assert.equal(F.assign(store, id, 0).ok, false, "closed stays closed");
  // the store survives JSON and keeps its numbering
  const back = F.normalise(JSON.parse(JSON.stringify(store)));
  assert.equal(F.create(back, input, people, 5).ticket.id, "FREE-0002");
  assert.equal(F.normalise({ list: [{ id: "BAD", subject: "x", priority: "P1" }] }).list.length, 0);
  assert.equal(F.remove(back, id).list.length, 0);
});
