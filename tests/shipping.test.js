// v0.7b: shipments and RMA (shipping.js): the state machine and its simulated clock, the shipments tool, the inventory state of a
// device, what a shipment does to the ticket's SLA (paused while pending), and the three desks closed with a shipment.
const test = require("node:test");
const assert = require("node:assert/strict");
const S = require("../public/assets/shipping.js");
const W = require("../public/assets/workflow.js");
const E = require("../public/assets/engine.js");
const N = require("../public/assets/netcli.js");
const C = require("../public/assets/comms.js");
const SCENARIOS = require("../public/assets/scenarios.js");

const byId = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));
const play = (sc, cmds, lang = "en") => { const s = E.createSession(sc, lang); cmds.forEach((c) => E.run(s, c)); return s; };
const text = (r) => r.lines.map((l) => l.text).join("\n");
const LOAN = { serial: "LOAN-LT-01", carrier: "tix", from: "hq-it", to: "home-jruiz" };

test("the state machine: draft, requested (RMA number), pickup, transit, delivered, closed; the clock moves with each step", () => {
  const st = S.createStore({ ticket: "INC-20612" });
  assert.equal(st.prefix, "SHP-20612");
  const c = S.create(st, "rma", { serial: "LAPTOP-0217", carrier: "vendor", from: "home-jruiz", to: "dell-depot" });
  assert.ok(c.ok);
  assert.equal(c.ship.id, "SHP-20612-1");
  assert.equal(c.ship.serial, "8KQ2TX3", "a name is stored as the asset's serial");
  assert.equal(c.ship.state, "draft");
  assert.deepEqual(c.check.errors.sort(), ["data", "evidence", "fault", "vendor"]);
  const bad = S.submit(st, c.ship.id);
  assert.equal(bad.error, "invalid");
  assert.equal(c.ship.state, "draft", "an invalid shipment stays a draft");
  assert.equal(S.advance(st, c.ship.id).error, "draft");
  S.update(st, c.ship.id, { vendor: "dell", fault: "SSD failing", evidence: "2000-0151, Event 52", data: "kyhd" });
  const t0 = st.clock;
  const sub = S.submit(st, c.ship.id);
  assert.ok(sub.ok);
  assert.deepEqual(sub.check.warnings, ["escrow"], "a laptop going to the vendor without the BitLocker check warns, but does not block");
  assert.equal(c.ship.state, "requested");
  assert.match(c.ship.rma, /^SR 8\d{8}$/);
  assert.match(c.ship.tracking, /^VLP\d{9}$/);
  assert.equal(S.submit(st, c.ship.id).error, "state");
  const seen = [];
  for (const want of ["pickup", "transit", "delivered"]) {
    const r = S.advance(st, c.ship.id);
    assert.ok(r.ok && r.ms > 0, want);
    seen.push(c.ship.state);
  }
  assert.deepEqual(seen, ["pickup", "transit", "delivered"]);
  assert.ok(st.clock - t0 >= 24 * 3600000, "a day and more of simulated time");
  assert.equal(S.advance(st, c.ship.id).error, "state", "after delivery it can only be closed");
  assert.ok(S.close(st, c.ship.id).ok);
  assert.equal(c.ship.state, "closed");
  assert.deepEqual(S.next(c.ship), []);
  const states = c.ship.events.map((e) => e.state);
  assert.deepEqual([...new Set(states)], ["draft", "requested", "pickup", "transit", "delivered", "closed"]);
  assert.ok(c.ship.events.every((e, i, a) => i === 0 || e.at >= a[i - 1].at), "tracking events in time order");
  assert.match(S.eventText(c.ship, c.ship.events[1], "es"), /^El fabricante aprueba la RMA SR 8/);
});

test("incidents: only while the parcel moves; the claim is solved and it goes on in transit", () => {
  const st = S.createStore({});
  assert.equal(st.prefix, "SHP-P", "practice shipments");
  const id = S.create(st, "loan", LOAN).ship.id;
  assert.equal(S.incident(st, id, "lost").error, "state");
  S.submit(st, id);
  S.advance(st, id);
  assert.equal(S.incident(st, id, "stolen").error, "kind");
  const r = S.incident(st, id, "damaged");
  assert.ok(r.ok);
  assert.equal(r.ship.state, "incident");
  assert.deepEqual(S.next(r.ship), ["advance"]);
  const back = S.advance(st, id);
  assert.equal(back.ship.state, "transit");
  assert.equal(back.ship.incident, null);
  assert.equal(back.ms, 1440 * 60000);
  assert.equal(S.close(st, id).error, "state");
});

test("validation: what blocks a request and what only warns", () => {
  const v = (type, x) => S.validate(Object.assign({ type, evidence: [], items: [] }, x));
  assert.deepEqual(v("loan", LOAN), { ok: true, errors: [], warnings: [] });
  assert.ok(v("loan", Object.assign({}, LOAN, { to: "hq-it" })).errors.includes("to"), "pickup and delivery cannot be the same place");
  assert.ok(v("loan", Object.assign({}, LOAN, { serial: "NOPE" })).errors.includes("serial"));
  assert.ok(v("return", { serial: "3FJ7WR3", carrier: "tix", from: "home-lnavarro", to: "hq-it", data: "encrypted" }).errors.includes("items"));
  assert.deepEqual(v("return", { serial: "DTN2338A1QJ", carrier: "vendor", from: "comms-2f", to: "cisco-depot" }).errors, [], "a spare part needs no checklist");
  assert.deepEqual(v("rma", { serial: "DTN2338A1QJ", vendor: "cisco", fault: "x", evidence: ["y"], carrier: "vendor", from: "cisco-depot", to: "comms-2f" }).warnings, ["contract"]);
  assert.deepEqual(v("rma", { serial: "8KQ2TX3", vendor: "dell", fault: "x", evidence: ["y"], carrier: "vendor", from: "home-jruiz", to: "dell-depot", data: "kyhd", escrow: true }),
    { ok: true, errors: [], warnings: [] });
});

test("the inventory state of a device follows its shipments, and the asset register's marks win", () => {
  const st = S.createStore({ ticket: "INC-1" });
  const other = S.createStore({});
  assert.equal(S.deviceState([st], "LAPTOP-0217"), "in-use");
  assert.equal(S.deviceState([st], "LOAN-LT-02"), "stock");
  assert.equal(S.deviceState([st], "unknown"), null);
  const rma = S.create(st, "rma", { serial: "8KQ2TX3", vendor: "dell", fault: "f", evidence: "e", carrier: "vendor", from: "home-jruiz", to: "dell-depot", data: "kyhd", escrow: true }).ship.id;
  assert.equal(S.deviceState([st], "8KQ2TX3"), "in-use", "a draft changes nothing");
  S.submit(st, rma);
  assert.equal(S.deviceState([st, other], "LAPTOP-0217"), "rma");
  const loan = S.create(other, "loan", Object.assign({}, LOAN, { serial: "LOAN-LT-02" })).ship.id;
  S.submit(other, loan);
  assert.equal(S.deviceState([st, other], "4LN0AN4"), "loan", "on loan, from any store");
  ["advance", "advance", "advance", "close"].forEach((f) => S[f](other, loan));
  assert.equal(S.deviceState([other], "4LN0AN4"), "stock", "a closed loan is back in stock");
  const ret = S.create(st, "return", { serial: "LAPTOP-0230", items: "laptop,charger", carrier: "tix", from: "home-lnavarro", to: "hq-it", data: "encrypted" }).ship.id;
  S.submit(st, ret);
  assert.equal(S.deviceState([st], "3FJ7WR3"), "returning");
  ["advance", "advance", "advance"].forEach((f) => S[f](st, ret));
  assert.equal(S.deviceState([st], "3FJ7WR3"), "received");
  assert.ok(S.mark(st, "3FJ7WR3", "stock").ok);
  assert.equal(S.deviceState([st], "LAPTOP-0230"), "stock");
  assert.equal(S.mark(st, "3FJ7WR3", "lost").error, "status");
  assert.ok(S.DEVICE.received.es && S.DEVICE.rma.es === "En RMA" && S.DEVICE.loan.es === "En préstamo" && S.DEVICE.replaced.es === "Sustituido");
});

test("the SLA: a shipping step costs its simulated time while the ticket is in progress, and nothing while it is pending", () => {
  const at = (m) => 1_800_000_000_000 + m * 60000;
  let rec = W.assign(null, at(0));
  rec = S.charge(rec, { id: "SHP-1-1", state: "pickup", ms: 120 * 60000 }, at(1));
  assert.equal(rec.extraMs, 120 * 60000);
  assert.equal(Math.round(W.slaMinutesUsed(rec, at(1))), 121, "two simulated hours on top of the real minute");
  const last = rec.timeline[rec.timeline.length - 1];
  assert.deepEqual([last.ship, last.state, last.charged, last.paused], ["SHP-1-1", "pickup", true, false]);
  rec = W.transition(rec, "pending-vendor", { now: at(2), reason: "Waiting for the courier and the vendor" }).rec;
  rec = S.charge(rec, { id: "SHP-1-1", state: "transit", ms: 300 * 60000 }, at(3));
  rec = S.charge(rec, { id: "SHP-1-1", state: "delivered", ms: 1020 * 60000 }, at(4));
  assert.equal(rec.extraMs, 120 * 60000, "paused: the wait does not count");
  assert.equal(rec.timeline.filter((x) => x.ship && x.paused).length, 2);
  rec = W.transition(rec, "progress", { now: at(10) }).rec;
  assert.equal(Math.round(W.slaMinutesUsed(rec, at(10))), 122, "2 real minutes in progress + 120 charged; the 8 pending minutes are paused");
  const n = W.normalise(rec);
  assert.equal(n.extraMs, 120 * 60000);
  assert.equal(n.timeline.filter((x) => x.ship).length, 3, "the shipment entries stay in the activity");
  assert.ok(W.canResolve(n));
});

test("the shipments tool: help, list, show, new, set, submit, advance, incident, close, mark, and the line a form runs", () => {
  const st = S.createStore({ ticket: "INC-20612" });
  const run = (l, lang) => S.exec(st, l, { lang });
  assert.match(text(run("ship")), /Contoso shipments tool/);
  assert.match(text(run("ship list")), /no shipments yet/);
  const line = S.command("new", "rma", { serial: "8KQ2TX3", vendor: "dell", fault: "SSD SMART predictive failure", evidence: ["2000-0151", "Event 52"],
    carrier: "vendor", from: "home-jruiz", to: "dell-depot", data: "kyhd", escrow: false });
  assert.equal(line, 'ship new rma --serial 8KQ2TX3 --vendor dell --fault "SSD SMART predictive failure" --evidence "2000-0151,Event 52" --carrier vendor --from home-jruiz --to dell-depot --data kyhd');
  const r = run(line, "es");
  assert.deepEqual(r.tags, ["ship new rma 8KQ2TX3"]);
  assert.equal(st.list[0].evidence.length, 2);
  const sub = run("ship submit SHP-20612-1", "es");
  assert.ok(sub.lines.some((l) => l.kind === "err" && /BitLocker/.test(l.text)), "the escrow warning, in the user's language");
  assert.deepEqual(sub.tags, ["ship submit rma noescrow", "ship state rma requested"]);
  assert.ok(run("ship set SHP-20612-1 --escrow").tags.includes("ship set rma escrow"));
  const adv = run("ship advance shp-20612-1");
  assert.ok(adv.ms > 0);
  assert.deepEqual(adv.ship, { id: "SHP-20612-1", state: "pickup", type: "rma" });
  assert.deepEqual(adv.tags, ["ship state rma pickup"]);
  const show = text(run("ship show SHP-20612-1"));
  assert.match(show, /RMA number\s+: SR 8\d{8}/);
  assert.match(show, /BitLocker key\s+: Escrowed in Entra ID/);
  assert.match(show, /Pickup booked at Javier Ruiz \(home\)/);
  assert.match(text(run("ship incident SHP-20612-1 lost")), /missing at the hub/);
  assert.match(text(run("ship close SHP-20612-1")), /not possible now/);
  assert.match(text(run("ship assets lnavarro")), /LAPTOP-0230\s+Laptop[\s\S]*MOB-0230/);
  assert.deepEqual(run("ship mark LAPTOP-0230 stock").tags, ["ship mark 3FJ7WR3 stock"]);
  assert.equal(run("ship fly SHP-20612-1").unknown, true);
  assert.equal(run("ship show SHP-9").lines[0].kind, "err");
  assert.match(text(run("ship list")), /SHP-20612-1\s+Vendor RMA\s+8KQ2TX3\s+incident/);
  // a saved store comes back usable; rubbish gives an empty one
  const back = S.normalise(JSON.parse(JSON.stringify(st)), {});
  assert.equal(back.list.length, 1);
  assert.equal(S.normalise("x", {}).list.length, 0);
});

test("the engine: `ship` goes to the tool on the workstation, never inside a device CLI, and the desk reads its flags", () => {
  const sc = byId["net-psu-rma"];
  const s = E.createSession(sc, "en");
  E.run(s, "ssh SW-ACC-2F");
  const inside = E.run(s, "ship list");
  assert.match(text(inside), /% Invalid input detected/, "inside the switch, ship is an IOS error");
  const local = E.run(s, "ship list", { local: true });
  assert.match(text(local), /no shipments yet/, "a ticket-page button always reaches the tool");
  E.run(s, "exit");
  const r = E.run(s, "ship new rma --serial DTN2338A1QJ --vendor cisco --contract 2049117 --fault x --evidence y --carrier vendor --from cisco-depot --to comms-2f --data none");
  assert.deepEqual(r.ship, { id: "SHP-20640-1", state: "draft", type: "rma" });
  assert.equal(s.state.rmaRaised, false);
  E.run(s, "ship submit SHP-20640-1");
  assert.equal(s.state.rmaRaised, true);
  assert.equal(s.unknown, 1, "only the IOS error counted");
});

test("laptop RMA: a new laptop is not a fix; shipping without the BitLocker check resolves with a remark; the laptop is gone after collection", () => {
  const sc = byId["laptop-rma"];
  const order = play(sc, ["vendor order Latitude 7450"]);
  assert.equal(order.resolved, false);
  assert.equal(order.state.ordered, true);
  // the whole path without the BitLocker check
  const noKey = sc.solution.filter((c) => !/bitlocker|manage-bde/i.test(c)).map((c) => c.replace(" --escrow", ""));
  const s = play(sc, noKey);
  assert.ok(s.resolved, "the user can still work and the RMA is open: it is a remark, not a dead end");
  assert.equal(s.state.leftNoKey, true);
  assert.equal(s.ships.list[1].escrow, false);
  const fixed = s;
  const v = E.verdict(fixed, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "hardware", minutes: 5 });
  assert.equal(v.level, "observations");
  assert.ok(v.reasons.some((x) => /BitLocker recovery key was checked/.test(x)));
  assert.equal(v.points, 90);
  assert.equal(E.stages(fixed).find((st) => st.id === "protect").done, false);
  // once the courier has it, the laptop's commands fail
  const gone = E.run(fixed, "manage-bde -protectors -get C:");
  assert.equal(gone.lines[0].kind, "err");
  assert.match(text(gone), /WinRM cannot complete the operation/);
  // the RMA needs the vendor's code as evidence
  const noCode = play(sc, sc.solution.map((c) => c.replace("ePSA 2000-0151 validation 79213, ", "")));
  assert.equal(noCode.state.rmaOk, false);
  assert.equal(noCode.resolved, false);
  assert.equal(E.verdict(play(sc, sc.solution), E.checkNote(sc, sc.sampleNote.es, "es"), { code: "hardware", minutes: 5 }).level, "resolved");
});

test("power supply RMA: acknowledging the alarm or one working supply is not a fix; the swap needs the replacement; health and inventory follow", () => {
  const sc = byId["net-psu-rma"];
  const s = play(sc, ["alarm ack"]);
  assert.equal(s.resolved, false);
  assert.equal(C.confirmState(sc, s), "failed");
  assert.equal(E.verdict(s, null, {}).level, "unresolved");
  const h = N.health(s.net, "SW-ACC-2F");
  assert.equal(h.tone, "warn");
  assert.deepEqual(h.psu, [["PS1", "OK"], ["PS2", "Failed"]]);
  assert.ok(h.notes.some((x) => x.id === "psu"));
  assert.equal(E.bound(s)[0].set.status, "bad");
  assert.match(text(E.run(s, "onsite swap-psu")), /no spare PWR-C5-600WAC/);
  E.run(s, "ssh SW-ACC-2F");
  E.run(s, "enable");
  const env = text(E.run(s, "sh env power"));
  assert.match(env, /1A\s+PWR-C5-600WAC\s+DTN2337B0KQ\s+OK\s+Good\s+Good\s+600/);
  assert.match(env, /1B\s+PWR-C5-600WAC\s+DTN2338A1QJ\s+Disabled\s+Bad\s+n\/a\s+600/);
  assert.match(text(E.run(s, "show logging")), /FRU_PS_OIR: Switch 1: FRU power supply B powered off/);
  assert.match(text(E.run(s, "show environment all")), /FAN PS-2 is NOT OK/);
  const done = play(sc, sc.solution);
  assert.equal(N.health(done.net, "SW-ACC-2F").tone, "ok");
  assert.match(N.diag(done.net, "SW-ACC-2F", "log").join("\n"), /power supply B inserted/);
  assert.equal(S.deviceState([done.ships], "DTN2338A1QJ"), "returning", "the faulty unit is on its way back");
  const v = E.verdict(play(sc, ["alarm ack"].concat(sc.solution)), E.checkNote(sc, sc.sampleNote.en, "en"), { code: "hardware", minutes: 5 });
  assert.equal(v.level, "observations", "acknowledging the alarm is remarked");
  // the default network has no failed supply (the room is healthy outside this ticket)
  assert.deepEqual(N.health(N.createNet(), "SW-ACC-2F").psu, [["PS1", "OK"], ["PS2", "Not present"]]);
});

test("leaver return: marking it returned before it arrives does not close it; wipes wait for the box; no Autopilot Reset on hybrid", () => {
  const sc = byId["leaver-return"];
  const early = play(sc, ["ship mark 3FJ7WR3 stock"]);
  assert.equal(early.resolved, false);
  assert.equal(early.state.markedEarly, true);
  assert.equal(S.deviceState([early.ships], "LAPTOP-0230"), "stock", "the register now lies");
  assert.equal(E.cards(early).asset.fields.find((f) => f.label === "Asset register").tone, "bad");
  const s = E.createSession(sc, "en");
  E.run(s, "Clear-MgDeviceManagementManagedDevice -ManagedDeviceId a7c3e2f1-4b6d-4e8a-9f21-3d5c7b9e0a14");
  assert.equal(s.state.wiped, false, "a wipe before the box arrives does not count");
  const ap = E.run(s, "intune autopilot-reset LAPTOP-0230");
  assert.equal(ap.lines[0].kind, "err");
  assert.match(text(ap), /hybrid joined/);
  // a checklist without the badge: the box arrives, but the desk is not done
  const short = play(sc, sc.solution.map((c) => c.replace("laptop,charger,badge,phone", "laptop,charger,phone")));
  assert.equal(short.state.received, false);
  assert.equal(short.resolved, false);
  const late = play(sc, ["ship mark 3FJ7WR3 stock"].concat(sc.solution));
  assert.ok(late.resolved);
  const v = E.verdict(late, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "hardware", minutes: 5 });
  assert.equal(v.level, "observations");
  assert.ok(v.reasons.some((x) => /marked as returned before it arrived/.test(x)));
});

test("every shipment desk: flags in the state, tag rules, addresses and assets that exist", () => {
  const desks = SCENARIOS.filter((s) => s.ship);
  assert.deepEqual(desks.map((s) => s.id), ["laptop-rma", "net-psu-rma", "leaver-return"]);
  for (const sc of desks) {
    const keys = new Set(Object.keys(sc.state));
    const s = E.createSession(sc, "en");
    for (const [k, spec] of Object.entries(sc.ship.flags)) {
      assert.ok(keys.has(k), `${sc.id}: flag ${k}`);
      assert.equal(s.state[k], sc.state[k], `${sc.id}: ${k} starts as declared`);
      if (spec.serial) assert.ok(S.asset(spec.serial), `${sc.id}: asset ${spec.serial}`);
      if (spec.to) assert.ok(S.ADDRESSES[spec.to], `${sc.id}: address ${spec.to}`);
    }
    for (const r of sc.commands.filter((x) => x.on && /ship/.test(String(x.on)))) assert.ok(!r.dev, `${sc.id}/${r.id}: ship tags have no device`);
    assert.ok(sc.remarks && sc.remarks.every((rm) => rm.text.en && rm.text.es && Object.keys(rm.when).every((k) => keys.has(k))), sc.id + " remarks");
    const done = play(sc, sc.solution);
    assert.ok(done.ships.list.length >= 1 && done.ships.list.every((x) => x.ticket === sc.ticket.id), sc.id + " shipments linked to the ticket");
  }
});
