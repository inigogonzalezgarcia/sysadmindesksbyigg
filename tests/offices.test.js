// The office map (v0.11): every person sits in one place, the desks the network room wires keep their number, and every
// printer, device and comms room on the map is a real record.
const test = require("node:test");
const assert = require("node:assert/strict");
const O = require("../public/assets/offices.js");
const R = require("../public/assets/rooms.js");
const W = require("../public/assets/world.js");

const placed = O.all().flatMap((x) => x.desks.filter((d) => d.kind === "user").map((d) => d.id));

test("every person of the directory is on the map once (leavers and shared or service accounts aside)", () => {
  const aside = ["hsanz", "rgomez", "recepcion", "svc-scan"];
  W.USERS.filter((u) => !aside.includes(u.sam)).forEach((u) => assert.equal(placed.filter((x) => x === u.sam).length, 1, u.sam));
  placed.forEach((sam) => assert.ok(W.USERS.some((u) => u.sam === sam), sam));
});

test("desk numbers are unique per floor and the wired ones are kept", () => {
  O.SITES.forEach((s) => s.levels.forEach((l) => {
    const ds = O.desks(l).flat().map((d) => d.desk).filter(Boolean);
    assert.equal(new Set(ds).size, ds.length, `${s.id}/${l.id}`);
  }));
  [["dlopez", "2.14"], ["mgarcia", "2.03"], ["lnavarro", "2.23"], ["jruiz", "1.01"], ["psanchez", "1.04"], ["eromero", "1.09"], ["pherrero", "3.12"]]
    .forEach(([sam, desk]) => assert.equal(O.find(sam).desk.desk, desk, sam));
});

test("things and racks on the map exist", () => {
  const rackIds = R.SITES.flatMap((s) => s.levels.flatMap((l) => l.racks.map((r) => r.id)));
  O.all().forEach(({ zone }) => {
    zone.things.forEach((id) => assert.ok(W.PRINTERS.some((p) => p.id === id) || W.DEVICES.some((d) => d.id === id), id));
    if (zone.rack) assert.ok(rackIds.includes(zone.rack), zone.rack);
  });
  // every rack of the network room has a room on the map, and every printer has a place
  rackIds.filter((id) => !["B", "C"].includes(id)).forEach((id) => assert.ok(O.find(id), "rack not on the map: " + id));
  W.PRINTERS.forEach((p) => assert.ok(O.find(p.id), "printer not on the map: " + p.id));
});

test("zones fill whole rows of 12 columns on every level", () => {
  O.SITES.forEach((s) => s.levels.forEach((l) => {
    const area = l.zones.reduce((sum, z) => sum + z.w * z.h, 0);
    assert.equal(area % 12, 0, `${s.id}/${l.id}: ${area}`);
  }));
});
