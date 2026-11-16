/* SysAdmin Desks by IGG - the comms rooms drawn rack by rack (v0.10). Where every physical box sits: site, level (floor or
   room), rack and U. Pure data and logic, no DOM: the app and the Node tests use the same code.
   The positions follow what the tickets already say (the Device42 audit fixes rack A and rack B, the network room gives
   the switches, the router and the firewall their U); the rest is placed in the free units. Virtual machines are not
   drawn: a rack counts the VMs its hosts carry. Fictional company. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SDRooms = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const t = (v, lang) => (v && typeof v === "object" ? v[lang] || v.en : v);

  /* item kinds:
     net   a device of the network room (live state from SDNet)       dev  a device of the inventory (switch, router, UPS, PDU…)
     srv   a physical server of the inventory (host: the OS it runs when the record is split in two, like SQL-PE01 / SQL-ERP01)
     patch a patch panel: ports wired to the desks of a floor, to switch `sw` from its port `from`
     blank a blank panel     pdu0 a basic power strip with no network card     tape a tape library
     side: "rear" for what is mounted at the back (the PDUs); everything else is seen from both sides. */
  const N = (id, u, h) => ({ kind: "net", id, u, h: h || 1 });
  const D = (id, u, h, side) => ({ kind: "dev", id, u, h: h || 1, side: side || "both" });
  const S = (id, u, h, host) => ({ kind: "srv", id, u, h: h || 1, host: host || null });
  const P = (id, u, sw, ports, from) => ({ kind: "patch", id, u, h: 1, sw, ports: ports || 24, from: from || 1 });
  const PDU0 = (id, u, h) => ({ kind: "pdu0", id, u, h: h || 1, side: "rear" });

  const SITES = [
    { id: "hq", name: { en: "Head office (Madrid)", es: "Oficina central (Madrid)" }, levels: [
      { id: "dataroom", name: { en: "Data room", es: "Sala técnica" }, racks: [
        { id: "A", name: { en: "Rack A", es: "Rack A" }, loc: "Head office data room, rack A", units: 42, items: [
          N("FGT-HQ-01", 42), N("SW-CORE-01", 40), S("SPLUNK01", 38), S("VMH-01", 36, 2), S("VMH-02", 34, 2), S("VMH-03", 32, 2),
          S("INTRANET01", 31), S("PRT-SRV01", 30), S("PDQ01", 29), S("DC01", 28), S("VMH-04", 26, 2), S("ORION01", 24, 2),
          S("VMH-05", 22, 2), S("VMH-06", 20, 2), S("VMH-07", 18, 2), S("VMH-08", 16, 2), S("VDI-PE01", 14, 2), S("PROXY01", 13),
          { kind: "blank", id: "BLANK-A-U12", u: 12, h: 1 }, S("VDI-PE02", 10, 2), S("DOCS-LNX01", 9),
          D("UPS-SALA-A", 3, 6), D("PDU-A1", 1, 2, "rear")] },
        { id: "B", name: { en: "Rack B", es: "Rack B" }, loc: "Head office data room, rack B", units: 42, items: [
          D("UPS-RACKB", 38, 4), S("FS01", 30, 2), S("FS-NEW01", 26, 2), S("DC02", 23, 2), S("FS-SCAN01", 20), S("WMS01", 18),
          S("ORA-CLN01", 14, 2), S("ORA-CLN02", 12, 2), D("PDU-B1", 1, 2, "rear")] },
        { id: "C", name: { en: "Rack C", es: "Rack C" }, loc: "Head office data room, rack C", units: 42, items: [
          S("GPU-N01", 38, 4), S("GPU-N02", 34, 4), S("GPU-N03", 30, 4), S("GPU-N04", 26, 4), S("HPC-CTL01", 25),
          S("BKP-LNX01", 22, 2), { kind: "tape", id: "LTO8-C", u: 20, h: 2, of: "BKP-LNX01" }, S("BKP-PE01", 18, 2, "VBR01"),
          S("SQL-PE01", 16, 2, "SQL-ERP01"), S("ERP-RHEL01", 15), S("DB-MAR01", 14), S("CONTOSO400", 12, 2),
          S("PAY-SFTP01", 10), S("PAY-APP01", 9), S("PAY-DB01", 8), S("PGSQL-FIN01", 7), PDU0("PDU-C0", 1, 2)] },
      ] },
      { id: "f0", floor: 0, name: { en: "Ground floor", es: "Planta baja" }, racks: [
        { id: "F0-A", name: { en: "Comms cabinet, rack F0-A", es: "Armario de comunicaciones, rack F0-A" }, units: 42, items: [
          P("PP-F0-A", 41, "SW-ACC-0F"), D("SW-ACC-0F", 40), PDU0("PDU-F0-A", 1)] }] },
      { id: "f1", floor: 1, name: { en: "1st floor", es: "1ª planta" }, racks: [
        { id: "F1-A", name: { en: "Comms cabinet, rack F1-A", es: "Armario de comunicaciones, rack F1-A" }, units: 42, items: [
          P("PP-F1-A", 41, "SW-ACC-1F"), N("SW-ACC-1F", 40), PDU0("PDU-F1-A", 1)] }] },
      { id: "f2", floor: 2, name: { en: "2nd floor", es: "2ª planta" }, racks: [
        { id: "F2-A", name: { en: "Comms cabinet, rack F2-A", es: "Armario de comunicaciones, rack F2-A" }, units: 42, items: [
          P("PP-F2-A", 39, "SW-ACC-2F"), N("SW-ACC-2F", 38), PDU0("PDU-F2-A", 1)] }] },
      { id: "f3", floor: 3, name: { en: "3rd floor", es: "3ª planta" }, racks: [
        { id: "F3-A", name: { en: "Comms cabinet, rack F3-A", es: "Armario de comunicaciones, rack F3-A" }, units: 42, items: [
          P("PP-F3-A1", 42, "SW-ACC-3F", 24, 1), P("PP-F3-A2", 41, "SW-ACC-3F", 24, 25), D("SW-ACC-3F", 40), PDU0("PDU-F3-A", 1)] }] },
      { id: "f4", floor: 4, name: { en: "4th floor", es: "4ª planta" }, racks: [
        { id: "F4-A", name: { en: "Comms cabinet, rack F4-A", es: "Armario de comunicaciones, rack F4-A" }, units: 42, items: [
          P("PP-F4-A", 41, "SW-ACC-4F"), D("SW-ACC-4F", 40), PDU0("PDU-F4-A", 1)] }] },
      { id: "f5", floor: 5, name: { en: "5th floor", es: "5ª planta" }, racks: [
        { id: "F5-A", name: { en: "Comms cabinet, rack F5-A", es: "Armario de comunicaciones, rack F5-A" }, units: 42, items: [
          P("PP-F5-A", 41, "SW-ACC-5F"), D("SW-ACC-5F", 40), PDU0("PDU-F5-A", 1)] }] },
    ] },
    { id: "vlc", name: { en: "Valencia branch", es: "Sucursal de Valencia" }, levels: [
      { id: "comms", name: { en: "Comms cabinet", es: "Armario de comunicaciones" }, racks: [
        { id: "VLC-A", name: { en: "Wall cabinet", es: "Armario mural" }, units: 12, items: [N("RTR-VLC-01", 12), PDU0("PDU-VLC", 1)] }] }] },
    { id: "trading", name: { en: "Madrid trading floor", es: "Sala de trading de Madrid" }, levels: [
      { id: "comms", name: { en: "Comms room", es: "Cuarto de comunicaciones" }, racks: [
        { id: "TRD-A", name: { en: "Rack TRD-A", es: "Rack TRD-A" }, units: 24, items: [
          P("PP-TRD-A", 23, "SW-TRD-01"), D("SW-TRD-01", 22), S("TRD-VOX01", 18), PDU0("PDU-TRD-A", 1)] }] }] },
    { id: "warehouse", name: { en: "Central warehouse", es: "Almacén central" }, levels: [
      { id: "comms", name: { en: "Comms cabinet", es: "Armario de comunicaciones" }, racks: [
        { id: "ALM-A", name: { en: "Wall cabinet", es: "Armario mural" }, units: 12, items: [
          D("RTR-ALM-01", 11), P("PP-ALM-A", 10, "SW-ALM-01"), D("SW-ALM-01", 9), PDU0("PDU-ALM", 1)] }] }] },
    { id: "zar", name: { en: "Zaragoza plant", es: "Planta de Zaragoza" }, levels: [
      { id: "comms", name: { en: "Comms room", es: "Cuarto de comunicaciones" }, racks: [
        { id: "ZAR-A", name: { en: "Rack ZAR-A", es: "Rack ZAR-A" }, units: 42, items: [
          D("FW-ZAR01", 42), P("PP-ZAR-A", 41, "SW-ZAR-01"), D("SW-ZAR-01", 40), S("HV-ZAR01", 36, 2), S("ZAR-VMH01", 34, 2), S("ZAR-VMH02", 32, 2),
          S("ZAR-VMH03", 31), S("ZAR-VMH04", 30), S("ZAR-BKP01", 27, 2), S("ZAR-FSN01", 25), S("ZAR-FSN02", 24), S("ZAR-SCADA01", 22),
          PDU0("PDU-ZAR-A", 1, 2)] }] }] },
    { id: "wro", name: { en: "Wrocław plant (Poland)", es: "Planta de Wrocław (Polonia)" }, levels: [
      { id: "comms", name: { en: "Comms room", es: "Cuarto de comunicaciones" }, racks: [
        { id: "WRO-A", name: { en: "Rack WRO-A", es: "Rack WRO-A" }, units: 42, items: [
          D("FW-WRO01", 42), D("RTR-WRO-01", 41), D("SW-WRO-CORE", 40), S("DC-WRO01", 36), S("WRO-VMH01", 33, 2), S("WRO-VMH02", 31, 2),
          PDU0("PDU-WRO-A", 1, 2)] }] }] },
    { id: "htl", name: { en: "Hotel Ribera Bilbao", es: "Hotel Ribera Bilbao" }, levels: [
      { id: "rackroom", name: { en: "Rack room", es: "Cuarto de rack" }, racks: [
        { id: "HTL-A", name: { en: "Rack HTL-A", es: "Rack HTL-A" }, units: 42, items: [
          D("FW-HTL01", 42), D("FW-HTL02", 41), D("RTR-HTL-01", 40), S("NTNX-HTL-N1", 34, 2), S("NTNX-HTL-N2", 32, 2), S("NTNX-HTL-N3", 30, 2),
          S("HTL-PE01", 27, 2), S("PMS-HTL01", 25), D("UPS-HTL-01", 3, 2), PDU0("PDU-HTL-A", 1, 2)] }] },
      { id: "f4", floor: 4, name: { en: "4th floor", es: "4ª planta" }, racks: [
        { id: "HTL-F4", name: { en: "Floor cabinet", es: "Armario de planta" }, units: 12, items: [
          P("PP-HTL-F4", 11, "SW-HTL-P4"), D("SW-HTL-P4", 10), PDU0("PDU-HTL-F4", 1)] }] },
    ] },
    { id: "t07", name: { en: "Store 07 Valencia", es: "Tienda 07 Valencia" }, levels: [
      { id: "back", name: { en: "Back room", es: "Trastienda" }, racks: [
        { id: "T07-A", name: { en: "Wall cabinet", es: "Armario mural" }, units: 9, items: [
          D("RTR-T07", 8), P("PP-T07", 7, "SW-T07", 12), D("SW-T07", 6), PDU0("PDU-T07", 1)] }] }] },
    { id: "t03", name: { en: "Store 03 Bilbao", es: "Tienda 03 Bilbao" }, levels: [
      { id: "back", name: { en: "Back room", es: "Trastienda" }, racks: [
        { id: "T03-A", name: { en: "Wall cabinet", es: "Armario mural" }, units: 6, items: [D("RUT-T03", 5), PDU0("PDU-T03", 1)] }] }] },
  ];

  // every item, with where it is
  function all() {
    const out = [];
    SITES.forEach((s) => s.levels.forEach((l) => l.racks.forEach((r) => r.items.forEach((it) => out.push({ site: s, level: l, rack: r, item: it })))));
    return out;
  }
  function find(id) { return all().find((x) => x.item.id === id || (x.item.host && x.item.host === id)) || null; }
  const sideOf = (it) => it.side || "both";
  const shows = (it, side) => sideOf(it) === "both" || sideOf(it) === side;
  const range = (it) => (it.h > 1 ? `U${it.u}–U${it.u + it.h - 1}` : `U${it.u}`);

  /* the rows of a rack seen from one side, top (highest U) to bottom: an item, an item mounted on the other side ("ghost":
     the U is free from here but you would see its cables), a single free U, or a run of free units folded into one row */
  function rows(rack, side) {
    const at = {};
    rack.items.forEach((it) => { for (let u = it.u; u < it.u + it.h; u++) { (at[u] = at[u] || []).push(it); } });
    const out = [];
    let u = rack.units;
    while (u >= 1) {
      const here = (at[u] || []);
      const mine = here.find((it) => shows(it, side));
      const other = here.find((it) => !shows(it, side));
      if (mine) { out.push({ type: "item", item: mine, top: mine.u + mine.h - 1, bottom: mine.u }); u = mine.u - 1; continue; }
      if (other) { out.push({ type: "ghost", item: other, top: other.u + other.h - 1, bottom: other.u }); u = other.u - 1; continue; }
      let low = u;
      while (low - 1 >= 1 && !(at[low - 1] || []).length) low--;
      out.push({ type: u === low ? "free" : "gap", top: u, bottom: low, units: u - low + 1 });
      u = low - 1;
    }
    return out;
  }
  // overlaps on one side (the tests use it; a rear PDU and a front device may share a U)
  function clashes(rack) {
    const out = [];
    ["front", "rear"].forEach((side) => {
      const taken = {};
      rack.items.filter((it) => shows(it, side)).forEach((it) => {
        for (let u = it.u; u < it.u + it.h; u++) {
          if (u < 1 || u > rack.units) out.push(`${rack.id}: ${it.id} outside the rack at U${u}`);
          else if (taken[u]) out.push(`${rack.id} ${side}: ${it.id} and ${taken[u]} at U${u}`);
          else taken[u] = it.id;
        }
      });
    });
    return out;
  }
  return { SITES, all, find, rows, clashes, range, shows, t };
});
