// v0.9: keeping a ticket's console, the network room and the labs across a page reload (persist.js).
const test = require("node:test");
const assert = require("node:assert/strict");
const P = require("../public/assets/persist.js");
const E = require("../public/assets/engine.js");
const NN = require("../public/assets/netcli.js");
const Lb = require("../public/assets/labs.js");
const SCENARIOS = require("../public/assets/scenarios.js");
const byId = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));
// what the app does: JSON in localStorage, so every snapshot goes through a string
const roundTrip = (x) => JSON.parse(JSON.stringify(x));

test("envelope: format version and owner", () => {
  const me = P.owner("Tech@Example.com");
  assert.equal(me, P.owner(" tech@example.com "), "the owner ignores case and spaces");
  assert.notEqual(me, P.owner("other@example.com"));
  const env = roundTrip(P.pack({ a: 1 }, { owner: me, now: 5 }));
  assert.deepEqual(env, { v: P.FORMAT, u: me, at: 5, data: { a: 1 } });
  assert.deepEqual(P.unpack(env, { owner: me }), { a: 1 });
  assert.equal(P.unpack(env, { owner: P.owner("other@example.com") }), null, "another account in the same browser starts clean");
  assert.equal(P.unpack(Object.assign({}, env, { v: P.FORMAT + 1 }), { owner: me }), null, "another format is dropped");
  for (const bad of [null, "x", [], { v: P.FORMAT }]) assert.equal(P.unpack(bad, { owner: me }), null);
});

test("every desk: half the solution, a reload, the other half still resolves it at the last step", () => {
  for (const sc of SCENARIOS) {
    const sess = E.createSession(sc, "en");
    const half = Math.floor(sc.solution.length / 2);
    sc.solution.slice(0, half).forEach((c) => E.run(sess, c));
    const back = P.sessionFromJSON(sc, roundTrip(P.sessionToJSON(sess)), "es");
    assert.ok(back, sc.id + " restores");
    assert.deepEqual(back.state, sess.state, sc.id + " state");
    assert.deepEqual(Array.from(back.used), Array.from(sess.used), sc.id + " rules used");
    assert.equal(E.prompt(back), E.prompt(sess), sc.id + " prompt (device and mode)");
    sc.solution.slice(half).forEach((c) => E.run(back, c));
    assert.ok(back.resolved && back.resolvedAt === sc.solution.length, sc.id + " resolved at the last step after the reload");
    assert.ok(P.size(P.sessionToJSON(back)) < 120000, sc.id + " fits comfortably in localStorage");
  }
});

test("a tempting fix stays a tempting fix after a reload; hints and closes are kept", () => {
  const sc = byId["net-err-disabled"];
  const sess = E.createSession(sc, "en");
  E.run(sess, "hint");
  sess.failedCloses = 1;
  const back = P.sessionFromJSON(sc, roundTrip(P.sessionToJSON(sess)), "en");
  assert.equal(back.hints, 1);
  assert.equal(back.failedCloses, 1);
  assert.equal(back.resolved, false);
  assert.equal(back.term.net, back.net, "the terminal works on the restored network");
});

test("a snapshot for another desk or another version of the desk is not applied", () => {
  const a = byId["ad-lockout"];
  const snap = roundTrip(P.sessionToJSON(E.createSession(a, "en")));
  assert.equal(P.sessionFromJSON(byId["dns-intranet"], snap, "en"), null, "another desk");
  assert.equal(P.sessionFromJSON(a, Object.assign({}, snap, { fp: "00000000" }), "en"), null, "another version");
  assert.equal(P.sessionFromJSON(a, Object.assign({}, snap, { state: null }), "en"), null, "broken");
  const changed = Object.assign({}, a, { state: Object.assign({ added: false }, a.state) });
  assert.notEqual(P.fingerprint(changed), P.fingerprint(a), "a new state key changes the fingerprint");
});

test("ticket record: console lines, history and draft are kept and trimmed; shipments come back", () => {
  const sc = byId["laptop-rma"];
  const lv = { sess: E.createSession(sc, "en"), log: [], hist: [], view: "desk", app: "x", wins: ["x", 3], draft: { note: "n", code: "fixed", userNote: "u" } };
  for (let i = 0; i < 500; i++) { lv.log.push({ text: "line " + i, kind: i % 2 ? "out" : "nope" }); lv.hist.push("cmd " + i); }
  E.run(lv.sess, "ship new rma --serial 8KQ2TX3 --vendor dell");
  const back = P.ticketFromJSON(sc, roundTrip(P.ticketToJSON(lv)), "en");
  assert.equal(back.log.length, P.LIMITS.log);
  assert.equal(back.log[back.log.length - 1].text, "line 499");
  assert.ok(back.log.every((l) => ["out", "cmd", "dim", "say", "err", "ok", "event", "warn"].includes(l.kind)));
  assert.equal(back.hist.length, P.LIMITS.hist);
  assert.equal(back.pos, back.hist.length);
  assert.equal(back.view, "desk");
  assert.deepEqual(back.wins, ["x"]);
  assert.deepEqual(back.draft, { note: "n", code: "fixed", userNote: "u" });
  assert.equal(back.closed, false);
  assert.equal(back.sess.ships.list.length, 1, "the ticket's shipment");
  assert.deepEqual(P.prune({ a: 1, b: 2, c: 3 }, ["a", "c"]), { a: 1, c: 3 }, "closed tickets lose their saved state");
});

test("network room: a change and the open CLI survive; a network from another version does not", () => {
  const net = NN.createNet([]);
  const term = NN.terminal(net);
  NN.connect(term, "SW-ACC-2F");
  ["enable", "configure terminal", "interface Gi1/0/7", "description ROOM-TEST", "switchport access vlan 30"].forEach((c) => NN.exec(term, c));
  const room = { net, sel: "SW-ACC-2F", cli: { dev: "SW-ACC-2F", term, src: null, log: [{ text: "x", kind: "out" }], hist: ["enable"] } };
  const back = P.roomFromJSON(roundTrip(P.roomToJSON(room)));
  assert.equal(back.sel, "SW-ACC-2F");
  assert.equal(NN.port(back.net.devices["SW-ACC-2F"], "Gi1/0/7").vlan, 30);
  assert.equal(NN.saved(back.net.devices["SW-ACC-2F"]), false, "still unsaved after the reload");
  assert.equal(NN.prompt(back.cli.term), "SW-ACC-2F(config-if)#");
  assert.equal(back.cli.term.net, back.net);
  NN.exec(back.cli.term, "end"); NN.exec(back.cli.term, "write memory");
  assert.equal(NN.saved(back.net.devices["SW-ACC-2F"]), true);
  const broken = roundTrip(P.roomToJSON(room));
  delete broken.net.devices["FGT-HQ-01"];
  assert.equal(P.roomFromJSON(broken), null, "a device missing: start fresh");
  // a CLI that belonged to a ticket is not kept with the room
  assert.equal(P.roomToJSON(Object.assign({}, room, { cli: Object.assign({}, room.cli, { src: { sc: {} } }) })).cli, null);
});

test("labs: the sandbox of each kind comes back with its tasks' state", () => {
  // AD: jruiz unlocked
  const ad = { s: Lb.create("ad", "en"), log: [], hist: [] };
  Lb.run(ad.s, "Unlock-ADAccount -Identity jruiz", "en");
  const adBack = P.labFromJSON("ad", roundTrip(P.labToJSON(ad)), "en");
  assert.deepEqual(Lb.tasks(adBack.s, "en").map((x) => x.done), Lb.tasks(ad.s, "en").map((x) => x.done));
  assert.ok(Lb.tasks(adBack.s, "en").some((x) => x.done));
  // network: inside a device, mid-configuration
  const net = { s: Lb.create("network", "en"), log: [], hist: [] };
  ["ssh SW-ACC-2F", "enable", "configure terminal"].forEach((c) => Lb.run(net.s, c, "en"));
  const netBack = P.labFromJSON("network", roundTrip(P.labToJSON(net)), "en");
  assert.equal(Lb.prompt(netBack.s), Lb.prompt(net.s));
  // rules (Linux): the session flags
  const lnx = { s: Lb.create("linux", "en"), log: [{ text: "a", kind: "cmd" }], hist: ["df -h"] };
  Lb.run(lnx.s, "df -h", "en");
  const lnxBack = P.labFromJSON("linux", roundTrip(P.labToJSON(lnx)), "en");
  assert.deepEqual(lnxBack.s.sess.state, lnx.s.sess.state);
  assert.deepEqual(lnxBack.hist, ["df -h"]);
  assert.equal(P.labFromJSON("windows", roundTrip(P.labToJSON(lnx)), "en"), null, "a sandbox for another lab");
  assert.equal(P.labFromJSON("nope", {}, "en"), null);
});
