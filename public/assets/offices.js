/* SysAdmin Desks by IGG - the office map (v0.11): a floor plan of every Contoso site with its areas, desks, people,
   meeting rooms, printers and comms rooms. Pure data and logic, no DOM: the app and the Node tests use the same code.
   Floors and areas follow what the tickets say (Finance on the 2nd floor, Legal and the Cantábrico room on the 4th, the
   executive floor on the 5th…); the desks that the network room wires to a person keep their number (SAL 1.01 is
   Javier Ruiz's, FIN 2.14 is David López's). Fictional company and people. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SDOffices = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const t = (v, lang) => (v && typeof v === "object" ? v[lang] || v.en : v);
  const n = (en, es) => ({ en, es });

  /* zone types: team (desks), meeting, training, comms (a rack of rooms.js), dataroom, core (stairs and lifts), area (a
     space with equipment but no desks: a loading bay, a shop floor). w: columns of 12, h: rows.
     users: [sam] or [sam, "1.04"] for a fixed desk; pcs: computers on a desk whose user the simulator does not name;
     free: empty desks; things: printers and devices of the inventory placed in the zone. */
  const Z = (type, name, w, h, o) => Object.assign({ type, name, w, h, users: [], pcs: [], free: 0, things: [] }, o || {});
  const CORE = (w) => Z("core", n("Stairs and lifts", "Escaleras y ascensores"), w || 8, 1);

  const SITES = [
    { id: "hq", name: n("Head office (Madrid)", "Oficina central (Madrid)"), levels: [
      { id: "f5", floor: 5, name: n("5th floor · Executive", "5ª planta · Dirección"), zones: [
        Z("team", n("Group executive", "Dirección del grupo"), 8, 2, { users: ["maldama", "iferrer", "jetxaniz", "cmendizabal", "agaray", "earrese"], free: 2 }),
        Z("meeting", n("Board room", "Sala del consejo"), 4, 2),
        CORE(), Z("comms", n("Comms cabinet F5-A", "Armario de comunicaciones F5-A"), 4, 1, { rack: "F5-A" })] },
      { id: "f4", floor: 4, name: n("4th floor · Legal", "4ª planta · Legal"), zones: [
        Z("team", n("Legal and data protection", "Legal y protección de datos"), 8, 2, { users: ["aortiz", "nprieto", "mgil", "igorostiza"], free: 4, things: ["LEGAL-PRN-01"] }),
        Z("meeting", n("Cantábrico room", "Sala Cantábrico"), 4, 2),
        CORE(), Z("comms", n("Comms cabinet F4-A", "Armario de comunicaciones F4-A"), 4, 1, { rack: "F4-A" })] },
      { id: "f3", floor: 3, name: n("3rd floor · Projects and HR", "3ª planta · Proyectos y RR. HH."), zones: [
        Z("team", n("Projects", "Proyectos"), 4, 2, { users: ["smolina", ["pherrero", "3.12"]], free: 3 }),
        Z("team", n("People (HR)", "Personas (RR. HH.)"), 4, 2, { users: ["ncastro", "bherrero"], free: 2 }),
        Z("training", n("Training room", "Sala de formación"), 4, 2),
        CORE(), Z("comms", n("Comms cabinet F3-A", "Armario de comunicaciones F3-A"), 4, 1, { rack: "F3-A" })] },
      { id: "f2", floor: 2, name: n("2nd floor · Finance", "2ª planta · Finanzas"), zones: [
        Z("team", n("Finance", "Finanzas"), 6, 2, { users: [["mgarcia", "2.03"], ["dlopez", "2.14"], ["lnavarro", "2.23"]],
          pcs: [["PC-FIN-019", "2.02"], ["PC-FIN-024", "2.05"], ["PC-FIN-025", "2.07"]], free: 3, things: ["FIN-MFP-01", "LBL-FIN-01"] }),
        Z("team", n("Accounting", "Contabilidad"), 3, 2, { users: ["lperez", "irey"], free: 1 }),
        Z("team", n("Procurement and audit", "Compras y auditoría"), 3, 2, { users: ["pgarate", "jolabarria"] }),
        Z("meeting", n("Meeting room 2", "Sala de reuniones 2"), 4, 1), CORE(4),
        Z("comms", n("Comms cabinet F2-A", "Armario de comunicaciones F2-A"), 4, 1, { rack: "F2-A" })] },
      { id: "f1", floor: 1, name: n("1st floor · Sales and Marketing", "1ª planta · Ventas y Marketing"), zones: [
        Z("team", n("Sales", "Ventas"), 6, 2, { users: [["jruiz", "1.01"], ["cmartin", "1.02"], ["psanchez", "1.04"], "rblanco", "hserrano", "svidal"], free: 3, things: ["SALES-MFP-01"] }),
        Z("team", n("Marketing", "Marketing"), 3, 2, { users: [["eromero", "1.09"], "mazkue"], free: 1 }),
        Z("team", n("Design studio", "Estudio de diseño"), 3, 1, { users: ["msoler"] }),
        Z("team", n("Operations", "Operaciones"), 3, 1, { users: ["imontero"] }),
        CORE(), Z("comms", n("Comms cabinet F1-A", "Armario de comunicaciones F1-A"), 4, 1, { rack: "F1-A" })] },
      { id: "f0", floor: 0, name: n("Ground floor · Reception", "Planta baja · Recepción"), zones: [
        Z("team", n("Reception", "Recepción"), 4, 2, { users: ["nvega"], things: ["RECEPCION-MFP"] }),
        Z("team", n("Facilities", "Servicios generales"), 4, 2, { users: ["arios", "icastro"] }),
        Z("training", n("Training room", "Sala de formación"), 4, 2),
        Z("core", n("Main entrance, stairs and lifts", "Entrada principal, escaleras y ascensores"), 8, 1),
        Z("comms", n("Comms cabinet F0-A", "Armario de comunicaciones F0-A"), 4, 1, { rack: "F0-A" })] },
      { id: "it", name: n("IT area and data room", "Área de IT y sala técnica"), zones: [
        Z("team", n("Service desk and operations", "Service desk y operaciones"), 4, 2, { users: ["it.admin", "sgil", "lmendez", "dvega", "samolina", "sprieto", "aechevarria"] }),
        Z("team", n("Infrastructure, data and development", "Infraestructura, datos y desarrollo"), 4, 1, { users: ["olafuente", "rcalvo", "jsanz", "nlarranaga"] }),
        Z("dataroom", n("Data room (racks A, B and C)", "Sala técnica (racks A, B y C)"), 4, 2, { rack: "A" }),
        Z("team", n("Information security", "Seguridad de la información"), 4, 1, { users: ["barana", "blasa", "bsalas"] })] },
      { id: "trading", name: n("Trading floor", "Sala de trading"), zones: [
        Z("team", n("Contoso Markets desks", "Mesas de Contoso Markets"), 8, 2, { users: ["rlarrea", "mgil.trd", "giturbe", "aurquijo", "lbengoa"], free: 3 }),
        Z("comms", n("Comms room TRD-A", "Cuarto de comunicaciones TRD-A"), 4, 1, { rack: "TRD-A" }), CORE(4)] },
    ] },
    { id: "vlc", name: n("Valencia branch", "Sucursal de Valencia"), levels: [
      { id: "office", name: n("Office", "Oficina"), zones: [
        Z("team", n("Open office", "Zona abierta"), 8, 2, { users: ["icastillo"], pcs: [["PC-VLC-014"]], free: 2, things: ["SW-VLC-01"] }),
        Z("comms", n("Comms cabinet", "Armario de comunicaciones"), 4, 1, { rack: "VLC-A" }), Z("core", n("Entrance", "Entrada"), 4, 1)] }] },
    { id: "warehouse", name: n("Central warehouse", "Almacén central"), levels: [
      { id: "floor", name: n("Warehouse", "Almacén"), zones: [
        Z("team", n("Warehouse office", "Oficina del almacén"), 4, 1, { users: ["ietxeberria"] }),
        Z("area", n("Loading bay", "Muelle de carga"), 4, 1, { things: ["ALM-MFP-01"] }),
        Z("comms", n("Comms cabinet", "Armario de comunicaciones"), 4, 1, { rack: "ALM-A" }),
        Z("area", n("Aisles 1-6", "Pasillos 1-6"), 12, 1, { things: ["AP-ALM-01"] })] }] },
    { id: "zar", name: n("Zaragoza plant", "Planta de Zaragoza"), levels: [
      { id: "plant", name: n("Plant", "Planta"), zones: [
        Z("team", n("Shift office", "Oficina de turno"), 8, 1, { users: ["ribanez"] }),
        Z("comms", n("Comms room", "Cuarto de comunicaciones"), 4, 1, { rack: "ZAR-A" }),
        Z("area", n("Production lines", "Líneas de producción"), 12, 1)] }] },
    { id: "wro", name: n("Wrocław plant (Poland)", "Planta de Wrocław (Polonia)"), levels: [
      { id: "office", name: n("Plant office", "Oficina de la planta"), zones: [
        Z("team", n("Accounting", "Contabilidad"), 8, 1, { users: ["kwisniewska"], free: 2 }),
        Z("comms", n("Comms room", "Cuarto de comunicaciones"), 4, 1, { rack: "WRO-A" })] }] },
    { id: "htl", name: n("Hotel Ribera Bilbao", "Hotel Ribera Bilbao"), levels: [
      { id: "ground", name: n("Reception and services", "Recepción y servicios"), zones: [
        Z("team", n("Front office", "Recepción"), 6, 1, { users: ["mugarte"], things: ["PRN-RECEPCION"] }),
        Z("team", n("Technical services", "Servicios técnicos"), 6, 1, { users: ["lzubiaurre"] }),
        Z("comms", n("Rack room", "Cuarto de rack"), 4, 1, { rack: "HTL-A" }), Z("core", n("Lobby, stairs and lifts", "Vestíbulo, escaleras y ascensores"), 8, 1)] },
      { id: "f4", floor: 4, name: n("4th floor · Rooms", "4ª planta · Habitaciones"), zones: [
        Z("area", n("Guest rooms", "Habitaciones"), 8, 1), Z("comms", n("Floor cabinet", "Armario de planta"), 4, 1, { rack: "HTL-F4" })] }] },
    { id: "booking", name: n("Booking centre (Bilbao)", "Central de reservas (Bilbao)"), levels: [
      { id: "office", name: n("Booking room", "Sala de reservas"), zones: [Z("team", n("Booking agents", "Agentes de reservas"), 12, 1, { users: ["iolano"], free: 5 })] }] },
    { id: "restaurant", name: n("Restaurante Ribera (Bilbao)", "Restaurante Ribera (Bilbao)"), levels: [
      { id: "floor", name: n("Restaurant", "Restaurante"), zones: [
        Z("team", n("Office", "Oficina"), 4, 1, { users: ["agoikoetxea"], things: ["RTR-RIB-01"] }),
        Z("area", n("Bar", "Barra"), 4, 1, { things: ["DATAFONO-01"] }), Z("area", n("Kitchen", "Cocina"), 4, 1, { things: ["PRN-COC-01"] }),
        Z("area", n("Dining room", "Comedor"), 12, 1, { things: ["TABLET-01"] })] }] },
    { id: "t03", name: n("Store 03 Bilbao", "Tienda 03 Bilbao"), levels: [
      { id: "store", name: n("Store", "Tienda"), zones: [
        Z("team", n("Shop floor and till", "Sala de ventas y caja"), 8, 1, { users: ["jarrieta", "nsaez", "amedina"] }),
        Z("comms", n("Back room", "Trastienda"), 4, 1, { rack: "T03-A" })] }] },
    { id: "t07", name: n("Store 07 Valencia", "Tienda 07 Valencia"), levels: [
      { id: "store", name: n("Store", "Tienda"), zones: [
        Z("team", n("Shop floor and till", "Sala de ventas y caja"), 8, 1, { users: ["rcampos"] }),
        Z("comms", n("Back room", "Trastienda"), 4, 1, { rack: "T07-A", things: ["PRN-T07"] })] }] },
    { id: "t12", name: n("Store 12 Sevilla", "Tienda 12 Sevilla"), levels: [
      { id: "store", name: n("Store", "Tienda"), zones: [Z("team", n("Shop floor and till", "Sala de ventas y caja"), 12, 1, { users: ["cortega"] })] }] },
    { id: "clinic", name: n("Clínica Contoso Salud (Bilbao)", "Clínica Contoso Salud (Bilbao)"), levels: [
      { id: "main", name: n("Clinic", "Clínica"), zones: [
        Z("team", n("Ward 3 nursing station", "Control de enfermería de la planta 3"), 6, 1, { users: ["murrutia", "aetxebarria"] }),
        Z("team", n("Medical management", "Dirección médica"), 3, 1, { users: ["izabala"] }),
        Z("team", n("Pharmacy", "Farmacia"), 3, 1, { users: ["eruiz"] }),
        Z("team", n("Clinical systems", "Sistemas clínicos"), 12, 1, { users: ["mibarra"] })] }] },
    { id: "donostia", name: n("Hotel Ribera Donostia (opening)", "Hotel Ribera Donostia (apertura)"), levels: [
      { id: "opening", name: n("Opening office", "Oficina de apertura"), zones: [Z("team", n("Opening team", "Equipo de apertura"), 12, 1, { users: ["alasa"], free: 3 })] }] },
  ];

  /* the desks of a level: fixed numbers first, then the next free number of the floor; sites with no floor number
     show no desk numbers */
  function desks(level) {
    const used = new Set();
    level.zones.forEach((z) => z.users.concat(z.pcs).forEach((u) => { if (Array.isArray(u) && u[1]) used.add(u[1]); }));
    let next = 1;
    const num = () => {
      if (level.floor == null) return null;
      let d;
      do { d = `${level.floor}.${String(next).padStart(2, "0")}`; next++; } while (used.has(d));
      used.add(d);
      return d;
    };
    return level.zones.map((z) => {
      if (z.type !== "team") return [];
      const out = [];
      z.users.forEach((u) => { const [sam, fixed] = Array.isArray(u) ? u : [u, null]; out.push({ kind: "user", id: sam, desk: fixed || null }); });
      z.pcs.forEach((p) => out.push({ kind: "pc", id: p[0], desk: p[1] || null }));
      for (let i = 0; i < z.free; i++) out.push({ kind: "free", id: null, desk: null });
      out.forEach((d) => { if (!d.desk) d.desk = num(); });
      return out;
    });
  }
  function all() {
    const out = [];
    SITES.forEach((s) => s.levels.forEach((l) => { const ds = desks(l); l.zones.forEach((z, i) => out.push({ site: s, level: l, zone: z, desks: ds[i] })); }));
    return out;
  }
  // where a person, a computer or a thing is: {site, level, zone, desk}
  function find(id) {
    for (const x of all()) {
      const d = x.desks.find((y) => y.id === id);
      if (d) return Object.assign({ desk: d }, x);
      if (x.zone.things.includes(id) || x.zone.rack === id) return Object.assign({ desk: null }, x);
    }
    return null;
  }
  return { SITES, desks, all, find, t };
});
