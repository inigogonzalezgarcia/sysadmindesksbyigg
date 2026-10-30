// v0.9b: levels by points, the close counters, the weekly goals, the badges by area and the labs' full shift (levels.js).
const test = require("node:test");
const assert = require("node:assert/strict");
const V = require("../public/assets/levels.js");
const G = require("../public/assets/growth.js");
const PF = require("../public/assets/profile.js");
const Lb = require("../public/assets/labs.js");
const SCENARIOS = require("../public/assets/scenarios.js");
const DESKS = SCENARIOS.map((s) => s.id);
const LEVELS = Object.fromEntries(SCENARIOS.map((s) => [s.id, s.level]));
const has = (v) => v && typeof v.en === "string" && typeof v.es === "string" && v.en.trim() && v.es.trim();
const fullLab = (id) => ({ [id]: { done: Lb.lab(id).tasks.map((x) => x.id), day: "2026-10-26", completed: "2026-10-26" } });

test("levels: six levels in order, named in both languages, thresholds and progress to the next", () => {
  assert.deepEqual(V.LEVELS.map((l) => l.id), ["intern", "l1", "l1s", "l2", "sys", "infra"]);
  V.LEVELS.forEach((l, k) => { assert.ok(has(l.name) && has(l.short), l.id); if (k) assert.ok(l.min > V.LEVELS[k - 1].min, l.id + " grows"); });
  assert.equal(V.LEVELS[0].min, 0);
  assert.equal(V.level(0, "es").name, "Becario/a de soporte");
  const a = V.level(199, "en");
  assert.equal(a.id, "intern"); assert.equal(a.toNext, 1); assert.equal(a.next.id, "l1"); assert.equal(a.pct, 99);
  const b = V.level(200, "es");
  assert.equal(b.id, "l1"); assert.equal(b.name, "Técnico/a N1"); assert.equal(b.into, 0); assert.equal(b.pct, 0);
  assert.equal(V.level(900).id, "l1s");
  assert.equal(V.level(V.LEVELS[5].min, "es").name, "Ingeniero/a de infraestructura");
  const top = V.level(99999);
  assert.equal(top.next, null); assert.equal(top.pct, 100);
  assert.equal(V.level(-5).id, "intern"); assert.equal(V.level("x").total, 0);
  // the most points there are reach the top level: every ticket at 100, every lab task, every bonus and every shift
  const max = DESKS.length * 100 + Lb.summary({}).totalTasks * V.LAB_TASK_POINTS + DESKS.length * 10 + Lb.LABS.length * V.SHIFT.points;
  assert.ok(max >= V.LEVELS[5].min + 300, "the top level is reachable without the weekly goals");
});

test("levels: points = best results + 10 per lab task + best comms bonus per ticket + goals + shifts; free tickets never count", () => {
  const progress = { "ad-lockout": { points: 90 }, "disk-full": { points: 70 }, "gone-desk": { points: 100 } };
  const activity = [
    { type: "ticket", id: "ad-lockout", day: "2026-10-26", bonus: 4 }, { type: "ticket", id: "ad-lockout", day: "2026-10-27", bonus: 8 },
    { type: "ticket", id: "disk-full", day: "2026-10-27", bonus: 25 },   // capped at 10
    { type: "free", id: "FREE-0001", day: "2026-10-27", bonus: 10, points: 100 },
  ];
  const labs = { ad: { done: ["find", "unlock"], day: "2026-10-26" } };
  const p = V.points({ desks: DESKS, progress, activity, labs });
  assert.equal(p.tickets, 160, "the unknown desk does not count");
  assert.equal(p.labs, 20);
  assert.equal(p.comms, 18, "best bonus per desk, 0-10");
  assert.equal(p.goals, 0); assert.equal(p.shifts, 0);
  assert.equal(p.total, p.tickets + p.labs + p.comms);
  // weekly rewards and a finished shift add up
  const weekly = { v: 1, weeks: { "2026-W44": { goals: ["no-hints", "phish", "rma"], done: { "no-hints": "2026-10-27" } } } };
  const shifts = { v: 1, active: null, done: { ad: { day: "2026-10-28", ms: 1, results: [] } }, log: [] };
  const q = V.points({ desks: DESKS, progress, activity, labs, weekly, shifts });
  assert.equal(q.goals, V.goal("no-hints").points);
  assert.equal(q.shifts, V.SHIFT.points);
  assert.equal(q.total, p.total + q.goals + q.shifts);
});

test("levels: a level-up is reported once, and never the first time (old progress is not celebrated)", () => {
  assert.deepEqual(V.levelUp(null, 700), { up: false, from: null, to: "l1s", seen: "l1s" });
  const r = V.levelUp("l1", 700);
  assert.equal(r.up, true); assert.equal(r.to, "l1s"); assert.equal(r.seen, "l1s");
  assert.equal(V.levelUp(r.seen, 700).up, false, "seen: not again");
  assert.equal(V.levelUp("l2", 700).up, false, "points can go down (a lab reset): no celebration, the seen level stays");
  assert.equal(V.levelUp("l2", 700).seen, "l2");
});

test("counters: clean closes, closes with remarks and false closures", () => {
  const act = [
    { type: "ticket", id: "a", level: "resolved", day: "2026-10-26" }, { type: "ticket", id: "b", level: "observations", day: "2026-10-26" },
    { type: "ticket", id: "a", level: "resolved", day: "2026-10-27" }, { type: "attempt", id: "c", day: "2026-10-27" }, { type: "attempt", id: "c", day: "2026-10-27" },
    { type: "mail", id: "ceo-phish", day: "2026-10-27" }, { type: "lab", id: "ad:inspect", day: "2026-10-27" },
  ];
  assert.deepEqual(V.closeCounts(act), { clean: 2, remarks: 1, false: 2, total: 3 });
  assert.deepEqual(V.closeCounts(null), { clean: 0, remarks: 0, false: 0, total: 0 });
  // failed closes and lab tasks do not make a day for the streak or the old weekly target
  assert.deepEqual(G.activeDays([{ type: "attempt", id: "c", day: "2026-10-20" }, { type: "lab", id: "x", day: "2026-10-21" }]), []);
  assert.equal(G.week([{ type: "attempt", id: "c", day: "2026-10-27" }], "2026-10-27", 3).done, 0);
});

test("weekly goals: a pool of 12+ in both languages; three different goals per ISO week, the same for the same week, rotating", () => {
  assert.ok(V.POOL.length >= 12);
  assert.equal(new Set(V.POOL.map((g) => g.id)).size, V.POOL.length);
  V.POOL.forEach((g) => { assert.ok(has(g.label) && g.points > 0 && g.target >= 1 && typeof g.count === "function", g.id); });
  ["net-2", "note-5", "lab-3", "no-hints", "phish", "rma"].forEach((id) => assert.ok(V.goal(id), id));
  const seen = new Set();
  const sets = [];
  for (let w = 1; w <= 52; w++) {
    const k = "2026-W" + String(w).padStart(2, "0");
    const g = V.goalsFor(k);
    assert.equal(g.length, 3); assert.equal(new Set(g).size, 3, k);
    assert.deepEqual(V.goalsFor(k), g, "deterministic");
    g.forEach((id) => seen.add(id));
    sets.push(g.slice().sort().join());
  }
  assert.ok(new Set(sets).size > 20, "the weeks rotate");
  assert.equal(seen.size, V.POOL.length, "every goal comes up in a year");
});

test("weekly goals: the week follows the time zone", () => {
  const sun = Date.UTC(2026, 10, 1, 23, 30);   // Sunday 1 November 2026, 23:30 UTC
  assert.equal(V.weekAt(sun, "UTC"), "2026-W44");
  assert.equal(V.weekAt(sun, "Europe/Madrid"), "2026-W45", "already Monday 00:30 in Madrid");
  assert.equal(V.weekAt(sun, "America/New_York"), "2026-W44");
  assert.notDeepEqual(V.goalsFor(V.weekAt(sun, "UTC")), V.goalsFor(V.weekAt(sun, "Europe/Madrid")));
});

test("weekly goals: progress from this week's activity only, and the reward is credited once (idempotent)", () => {
  const wk = "2026-W44";
  const weekly = { v: 1, weeks: { [wk]: { goals: ["net-2", "lab-3", "phish"], done: {} } } };
  const act = [
    { type: "ticket", id: "net-err-disabled", day: "2026-10-26", level: "resolved" },
    { type: "ticket", id: "net-err-disabled", day: "2026-10-27", level: "resolved" },   // the same desk again: still one
    { type: "ticket", id: "net-wrong-vlan", day: "2026-10-25", level: "resolved" },     // last week (Sunday)
    { type: "lab", id: "ad:inspect", day: "2026-10-27" }, { type: "lab", id: "ad:unlock", day: "2026-10-28" },
    { type: "mail", id: "ceo-phish", day: "2026-10-28", result: "correct" },
  ];
  let g = V.goalProgress(wk, act, { weekly, lang: "es" });
  assert.deepEqual(g.map((x) => [x.id, x.have, x.done]), [["net-2", 1, false], ["lab-3", 2, false], ["phish", 1, true]]);
  assert.equal(g[0].label, "Resuelve 2 tickets de red");
  const r1 = V.claim(weekly, wk, act, { day: "2026-10-28" });
  assert.deepEqual(r1.fresh, ["phish"]); assert.equal(r1.points, 25);
  const r2 = V.claim(r1.store, wk, act, { day: "2026-10-29" });
  assert.deepEqual(r2.fresh, [], "claiming again changes nothing");
  assert.equal(r2.store.weeks[wk].done.phish, "2026-10-28");
  assert.equal(V.goalPoints(r2.store), 25);
  const act2 = act.concat([{ type: "ticket", id: "net-wrong-vlan", day: "2026-10-29", level: "observations" }, { type: "lab", id: "net:x", day: "2026-10-29" }]);
  const r3 = V.claim(r2.store, wk, act2, { day: "2026-10-29" });
  assert.deepEqual(r3.fresh.sort(), ["lab-3", "net-2"]);
  assert.equal(V.goalPoints(r3.store), 25 + 40 + 30);
  assert.equal(V.fullWeeks(r3.store), 1);
  g = V.goalProgress(wk, act2, { weekly: r3.store });
  assert.ok(g.every((x) => x.done && x.claimed));
  // a week never seen gets its rotation; the history lists the past weeks, newest first
  const r4 = V.claim(r3.store, "2026-W45", [], { day: "2026-11-02" });
  assert.deepEqual(r4.store.weeks["2026-W45"].goals, V.goalsFor("2026-W45"));
  const h = V.history(r4.store, "2026-W45");
  assert.deepEqual(h.map((x) => [x.week, x.done, x.full, x.points]), [[wk, 3, true, 95]]);
  // a stored week keeps its goals even if the rotation would draw others; junk is dropped
  assert.deepEqual(V.normaliseWeekly({ weeks: { "2026-W44": { goals: ["nope", "phish"], done: { phish: "2026-10-28", nope: "x" } }, bad: {} } }),
    { v: 1, weeks: { "2026-W44": { goals: ["phish"], done: { phish: "2026-10-28" } } } });
  assert.deepEqual(V.normaliseWeekly("junk"), { v: 1, weeks: {} });
});

test("weekly goals: every goal in the pool can be met from the activity the app records", () => {
  const day = "2026-10-27";
  const wk = G.isoWeek(day);
  const tk = (id, extra) => Object.assign({ type: "ticket", id, day, level: "resolved", hints: 0, slaOk: true, userNote: 5 }, extra || {});
  const act = [tk("net-err-disabled"), tk("net-wrong-vlan"), tk("laptop-rma"), tk("rhel-var-full"), tk("m365-licence"),
    { type: "lab", id: "a", day }, { type: "lab", id: "b", day }, { type: "lab", id: "c", day }];
  G.MAIL.filter((m) => m.kind === "phishing").concat(G.MAIL.filter((m) => m.kind !== "phishing").slice(0, 2)).forEach((m) => act.push({ type: "mail", id: m.id, day, result: "correct" }));
  const weekly = { v: 1, weeks: { [wk]: { goals: V.POOL.map((g) => g.id), done: {} } } };
  // the normaliser keeps three goals a week: check each one in turn
  V.POOL.forEach((g) => {
    const p = V.goalProgress(wk, act, { weekly: { weeks: { [wk]: { goals: [g.id], done: {} } } }, levels: LEVELS });
    assert.ok(p[0].done, g.id + " can be met");
  });
  assert.ok(weekly);
});

test("badges: the earlier badges still work, plus mastery by area, documentation, goal cycles and shifts", () => {
  assert.ok(V.ALL.length >= G.BADGES.length + 15);
  assert.equal(new Set(V.ALL.map((b) => b.id)).size, V.ALL.length, "unique ids");
  V.ALL.forEach((b) => assert.ok(has(b.name) && has(b.rule) && b.icon, b.id));
  const areas = new Set(Object.values(PF.DESK_AREA));
  areas.forEach((ar) => assert.ok(V.ALL.find((b) => b.id === "master-" + ar), "mastery for " + ar));
  Lb.LABS.forEach((l) => assert.ok(V.ALL.find((b) => b.id === "shift-" + l.id), "shift badge for " + l.id));
  const earned = (o) => V.award({}, V.facts(Object.assign({ desks: DESKS, activity: [], progress: {} }, o)), "2026-10-28").fresh;
  // the earlier badges, from the same facts
  assert.ok(earned({ activity: [{ type: "ticket", id: "ad-lockout", day: "2026-10-28", hints: 0, noteComplete: true }] }).includes("spotless-note"));
  // mastery: every desk of the area at 90 or more; one at 89 is not enough
  const vdi = DESKS.filter((d) => PF.DESK_AREA[d] === "vdi");
  assert.ok(earned({ progress: Object.fromEntries(vdi.map((d) => [d, { points: 90 }])) }).includes("master-vdi"));
  assert.ok(!earned({ progress: Object.fromEntries(vdi.map((d) => [d, { points: 89 }])) }).includes("master-vdi"));
  const net = DESKS.filter((d) => PF.DESK_AREA[d] === "network");
  assert.ok(!earned({ progress: { [net[0]]: { points: 100 } } }).includes("master-network"), "the whole area");
  // documentation: five desks with a complete note (the same desk twice counts once), ten articles
  const notes = (n, id) => Array.from({ length: n }, (_, k) => ({ type: "ticket", id: id || DESKS[k], day: "2026-10-28", noteComplete: true }));
  assert.ok(earned({ activity: notes(5) }).includes("notes-5"));
  assert.ok(!earned({ activity: notes(5, "ad-lockout") }).includes("notes-5"));
  const kb = (n) => Object.fromEntries(DESKS.slice(0, n).map((d) => [d, {}]));
  assert.ok(earned({ kb: kb(10) }).includes("kb-10") && !earned({ kb: kb(9) }).includes("kb-10"));
  // goal cycles: weeks with every goal done
  const weeks = (n) => ({ v: 1, weeks: Object.fromEntries(Array.from({ length: n }, (_, k) => {
    const w = "2026-W" + String(k + 1).padStart(2, "0"); const g = V.goalsFor(w);
    return [w, { goals: g, done: Object.fromEntries(g.map((id) => [id, "2026-01-01"])) }];
  })) });
  assert.deepEqual(["week-1", "week-4", "week-12"].filter((b) => earned({ weekly: weeks(4) }).includes(b)), ["week-1", "week-4"]);
  assert.ok(earned({ weekly: weeks(12) }).includes("week-12"));
  // shifts
  assert.ok(earned({ shifts: { v: 1, done: { linux: { day: "2026-10-28", ms: 1, results: [] } } } }).includes("shift-linux"));
  // awards stay; the list in a language
  const list = V.badges({ "master-vdi": "2026-10-28" }, "es");
  assert.equal(list.find((b) => b.id === "master-vdi").earned, true);
  assert.equal(list.find((b) => b.id === "full-shift").name, "Cola despejada");
  assert.equal(list.find((b) => b.id === "shift-ad").group, "shift");
});

test("shift: four desks of the lab's area (or the nearest), deterministic, skipping the ones not available", () => {
  const o = { desks: DESKS, levels: LEVELS };
  Lb.LABS.forEach((l) => {
    const s = V.pickShift(l.id, o);
    assert.equal(s.length, V.SHIFT.size, l.id);
    assert.equal(new Set(s).size, 4);
    assert.equal(PF.DESK_AREA[s[0]], V.NEAR[l.id][0], l.id + " starts in its own area");
    assert.deepEqual(V.pickShift(l.id, o), s, "same input, same shift");
    s.forEach((d) => assert.ok(V.NEAR[l.id].includes(PF.DESK_AREA[d])));
  });
  const ad = V.pickShift("ad", o);
  assert.deepEqual(ad.slice(0, 2).sort(), ["aadc-sync", "ad-lockout"]);
  assert.equal(ad[0], "ad-lockout", "level 1 first");
  const skip = V.pickShift("ad", Object.assign({ unavailable: ["ad-lockout"] }, o));
  assert.ok(!skip.includes("ad-lockout") && skip.length === 4);
  assert.ok(V.pickShift("linux", { desks: ["rhel-var-full", "veeam-job"], levels: LEVELS }).length < 4, "fewer when the version has fewer");
});

test("shift: start (only after the lab), in order, after the start, finish once, summary and points; it survives a JSON round trip", () => {
  const desks = V.pickShift("linux", { desks: DESKS, levels: LEVELS });
  const t0 = Date.UTC(2026, 9, 28, 9, 0);
  assert.equal(V.start(null, "linux", desks, t0, {}).error, "locked", "the lab's tasks first");
  assert.equal(V.start(null, "linux", desks.slice(0, 2), t0, fullLab("linux")).error, "desks");
  let r = V.start(null, "linux", desks, t0, fullLab("linux"));
  assert.ok(r.ok);
  let st = JSON.parse(JSON.stringify(r.store));
  assert.equal(V.canStart(st, Object.assign(fullLab("linux"), fullLab("ad")), "ad").error, "busy");
  assert.equal(V.current(st), desks[0]);
  // the wrong desk, a close before the start and an unresolved one do not count
  assert.equal(V.record(st, { id: desks[1], level: "resolved", points: 90, at: t0 + 1000 }).counted, false);
  assert.equal(V.record(st, { id: desks[0], level: "resolved", points: 90, at: t0 - 1000 }).counted, false);
  assert.equal(V.record(st, { id: desks[0], level: "unresolved", points: 0, at: t0 + 1000 }).counted, false);
  const pts = [95, 80, 100, 70];
  desks.forEach((d, k) => {
    const x = V.record(st, { id: d, level: k === 1 ? "observations" : "resolved", points: pts[k], hints: k === 3 ? 2 : 0, at: t0 + (k + 1) * 6 * 60000 }, "2026-10-28");
    assert.ok(x.counted, d);
    st = JSON.parse(JSON.stringify(x.store));   // as kept in localStorage
    st = V.normaliseShifts(st, DESKS);
    if (k < 3) { assert.equal(x.finished, false); assert.equal(V.current(st), desks[k + 1]); assert.equal(V.elapsed(st.active, t0 + 60000), 60000); }
    else { assert.ok(x.finished && x.firstTime); assert.deepEqual(V.summary(x.entry), { tickets: 4, minutes: 24, avg: 86, clean: 3, remarks: 1, hints: 2 }); }
  });
  assert.equal(st.active, null);
  assert.equal(st.done.linux.day, "2026-10-28");
  assert.equal(V.shiftPoints(st), V.SHIFT.points);
  // a second shift of the same lab is logged but not rewarded again
  r = V.start(st, "linux", desks, t0 + 3600000, fullLab("linux"));
  st = r.store;
  let last;
  desks.forEach((d, k) => { last = V.record(st, { id: d, level: "resolved", points: 100, at: t0 + 3600000 + k + 1 }, "2026-10-29"); st = last.store; });
  assert.ok(last.finished && !last.firstTime);
  assert.equal(st.done.linux.day, "2026-10-28");
  assert.equal(V.shiftPoints(st), V.SHIFT.points);
  assert.equal(st.log.length, 2);
  // abandon; and junk or another format is refused
  st = V.start(st, "linux", desks, t0, fullLab("linux")).store;
  assert.ok(st.active);
  assert.equal(V.abandon(st).active, null);
  assert.deepEqual(V.normaliseShifts({ v: 99, active: st.active }), { v: 1, active: null, done: {}, log: [] });
  assert.equal(V.normaliseShifts({ v: 1, active: { lab: "nope", desks, started: 1 } }).active, null);
  assert.equal(V.normaliseShifts({ v: 1, active: { lab: "linux", desks: ["gone"], started: 1 } }).active, null);
});
