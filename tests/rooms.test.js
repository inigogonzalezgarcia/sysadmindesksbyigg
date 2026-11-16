// The comms rooms drawn rack by rack (v0.10): every physical box has one place, nothing overlaps, and the positions agree
// with what the network room and the Device42 ticket already say.
const test = require("node:test");
const assert = require("node:assert/strict");
const R = require("../public/assets/rooms.js");
const W = require("../public/assets/world.js");
const NN = require("../public/assets/netcli.js");

const net = NN.createNet([]);
const racks = R.SITES.flatMap((s) => s.levels.flatMap((l) => l.racks));

test("no two items share a unit on the same side, and all fit in their rack", () => {
  racks.forEach((r) => assert.deepEqual(R.clashes(r), [], r.id));
});

test("every item id is unique and points at a real record", () => {
  const seen = new Set();
  R.all().forEach(({ item: it }) => {
    assert.ok(!seen.has(it.id), "duplicate " + it.id);
    seen.add(it.id);
    if (it.kind === "net") assert.ok(net.devices[it.id], it.id);
    if (it.kind === "dev") assert.ok(W.DEVICES.some((d) => d.id === it.id), it.id);
    if (it.kind === "srv") assert.ok(W.SERVERS.some((d) => d.id === it.id), it.id);
    if (it.host) assert.ok(W.SERVERS.some((d) => d.id === it.host), it.host);
    if (it.kind === "patch") assert.ok(net.devices[it.sw] || W.DEVICES.some((d) => d.id === it.sw), it.sw);
  });
});

test("network-room devices sit at the U their location says", () => {
  R.all().filter((x) => x.item.kind === "net").forEach(({ item }) => {
    const u = Number(/U(\d+)$/.exec(net.devices[item.id].location.en)[1]);
    assert.equal(item.u, u, item.id);
  });
});

test("every physical server and rack-mounted device is placed, in the rack its record names", () => {
  const logical = ["NTX-HTL01", "CL-ZAR-FS"];   // cluster names, drawn as their nodes
  W.SERVERS.filter((s) => !/\(VM|\(on |VM in|Azure|AWS/.test(s.location.en) && !logical.includes(s.id)).forEach((s) => {
    const w = R.find(s.id);
    assert.ok(w, "not placed: " + s.id);
    if (w.rack.loc) assert.ok(s.location.en.startsWith(w.rack.loc), `${s.id}: ${s.location.en} vs ${w.rack.loc}`);
  });
  const notRacked = ["AP-ALM-01", "RTR-RIB-01", "DATAFONO-01", "TABLET-01", "SW-VLC-01", "ZAR-IPH-0147"];
  W.DEVICES.filter((d) => !notRacked.includes(d.id)).forEach((d) => assert.ok(R.find(d.id), "not placed: " + d.id));
});

test("the data room matches the Device42 audit: rack A U12 is a blank panel, FS-SCAN01 is in rack B U20, PDUs at the rear", () => {
  const a = racks.find((r) => r.id === "A");
  const b = racks.find((r) => r.id === "B");
  assert.equal(a.items.find((it) => it.u === 12).kind, "blank");
  const scan = R.find("FS-SCAN01");
  assert.equal(scan.rack.id, "B");
  assert.equal(scan.item.u, 20);
  assert.equal(b.items.find((it) => it.id === "UPS-RACKB").u, 38);
  [["VMH-01", 36], ["VMH-02", 34], ["PRT-SRV01", 30], ["DC01", 28], ["ORION01", 24]].forEach(([id, u]) => assert.equal(R.find(id).item.u, u, id));
  ["PDU-A1", "PDU-B1"].forEach((id) => { const w = R.find(id); assert.equal(w.item.side, "rear"); assert.equal(w.item.u, 1); });
  assert.equal(R.find("SQL-ERP01").item.id, "SQL-PE01");
});

test("rows fold free units and show rear items as ghosts from the front", () => {
  const a = racks.find((r) => r.id === "A");
  const front = R.rows(a, "front");
  const rear = R.rows(a, "rear");
  assert.equal(front.find((r) => r.item && r.item.id === "PDU-A1").type, "ghost");
  assert.equal(rear.find((r) => r.item && r.item.id === "PDU-A1").type, "item");
  const vlc = racks.find((r) => r.id === "VLC-A");
  assert.deepEqual(R.rows(vlc, "front").map((r) => r.type), ["item", "gap", "ghost"]);
  // the rows cover every unit exactly once
  racks.forEach((r) => ["front", "rear"].forEach((side) => {
    const n = R.rows(r, side).reduce((sum, x) => sum + (x.top - x.bottom + 1), 0);
    assert.equal(n, r.units, `${r.id} ${side}`);
  }));
});
