/* SysAdmin Desks by IGG - the network (v0.7a): Contoso's switches, the branch router and the firewall, and a CLI for each one.
   Pure logic, no DOM: the app (the network room and the ticket console) and the Node tests use the same code.
   A net is plain data: devices with interfaces, VLANs, logs and a saved (startup) copy of their configuration, and hosts (PCs, phones,
   printers, servers) plugged into ports. Every command reads or changes that data, so the outputs follow what you do:
   a port you shut shows "disabled", a printer moved to its VLAN asks DHCP again when its link bounces, a firewall object you correct
   lets the branch through. Three dialects: Cisco IOS XE (switches and router), ArubaOS-Switch (HP) and FortiOS (FortiGate).
   See docs/netcli.md for the commands each one understands. Fictional company, people and addresses (private and documentation ranges). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SDNet = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ---------- small helpers */
  const T0 = Date.UTC(2026, 9, 30, 9, 41, 0);   // the simulation clock (Friday 30 October 2026, 09:41, read as local time)
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const pad = (s, n) => { s = String(s); return s.length >= n ? s : s + " ".repeat(n - s.length); };
  const lpad = (s, n) => { s = String(s); return s.length >= n ? s : " ".repeat(n - s.length) + s; };
  const two = (n) => String(n).padStart(2, "0");
  const clone = (x) => JSON.parse(JSON.stringify(x));
  function t(value, lang) {
    if (value == null) return "";
    if (typeof value === "string") return value;
    return value[lang] || value.en || "";
  }
  function hms(ms) { const d = new Date(ms); return `${two(d.getUTCHours())}:${two(d.getUTCMinutes())}:${two(d.getUTCSeconds())}`; }
  function iosStamp(ms) { const d = new Date(ms); return `*${MON[d.getUTCMonth()]} ${d.getUTCDate()} ${hms(ms)}.${String(ms % 1000).padStart(3, "0")}`; }
  function hpStamp(ms) { const d = new Date(ms); return `${two(d.getUTCMonth() + 1)}/${two(d.getUTCDate())}/${String(d.getUTCFullYear()).slice(2)} ${hms(ms)}`; }
  function ip2n(ip) { const p = String(ip).split(".").map(Number); return p.length === 4 && p.every((x) => x >= 0 && x <= 255) ? ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3] : null; }
  const isIp = (s) => /^\d{1,3}(\.\d{1,3}){3}$/.test(String(s)) && ip2n(s) !== null;
  function maskBits(m) { const n = ip2n(m); if (n === null) return null; let b = 0; for (let i = 31; i >= 0; i--) { if (n & (2 ** i)) b++; else break; } return b; }
  const bitsMask = (bits) => Array.from({ length: 4 }, (_, i) => 256 - 2 ** (8 - Math.max(0, Math.min(8, bits - i * 8)))).join(".");
  function inNet(ip, netIp, bits) {
    const a = ip2n(ip), b = ip2n(netIp);
    if (a === null || b === null) return false;
    if (bits === 0) return true;
    const mask = (0xffffffff << (32 - bits)) >>> 0;
    return ((a & mask) >>> 0) === ((b & mask) >>> 0);
  }
  // MAC addresses are kept in Cisco's dotted form (a45d.360c.197e); HP shows a45d36-0c197e
  function parseMac(s, strict) {
    const x = String(s || "").toLowerCase();
    if (/^[0-9a-f]{4}\.[0-9a-f]{4}\.[0-9a-f]{4}$/.test(x)) return x;
    if (strict) return null;
    const h = x.replace(/[-:.]/g, "");
    if (!/^[0-9a-f]{12}$/.test(h)) return null;
    if (!/^([0-9a-f]{6}-[0-9a-f]{6}|[0-9a-f]{12}|([0-9a-f]{2}:){5}[0-9a-f]{2}|([0-9a-f]{2}-){5}[0-9a-f]{2})$/.test(x)) return null;
    return h.slice(0, 4) + "." + h.slice(4, 8) + "." + h.slice(8);
  }
  const hpMac = (m) => m.replace(/\./g, "").replace(/^(.{6})/, "$1-");
  const colonMac = (m) => m.replace(/\./g, "").replace(/(..)(?=.)/g, "$1:").toUpperCase();
  function ranges(nums) {
    const s = Array.from(new Set(nums.map(Number))).sort((a, b) => a - b);
    const out = [];
    for (let i = 0; i < s.length; i++) {
      let j = i;
      while (j + 1 < s.length && s[j + 1] === s[j] + 1) j++;
      out.push(j > i ? `${s[i]}-${s[j]}` : String(s[i]));
      i = j;
    }
    return out.join(",");
  }
  function portList(s) {
    const out = [];
    for (const part of String(s).split(",")) {
      const m = /^(\d+)(?:-(\d+))?$/.exec(part.trim());
      if (!m) return null;
      const a = Number(m[1]), b = Number(m[2] || m[1]);
      if (b < a || b - a > 64) return null;
      for (let i = a; i <= b; i++) out.push(String(i));
    }
    return out;
  }

  /* ---------- the HQ addressing plan: one /24 per VLAN, gateway .1 on the core switch, DHCP on DC01 (ip helper-address) */
  const VLANS = {
    1: { name: "default" }, 10: { name: "SERVERS", net: "10.20.1." }, 30: { name: "PRINTERS", net: "10.20.3." },
    99: { name: "MGMT", net: "10.20.99." }, 140: { name: "USERS", net: "10.20.14." }, 150: { name: "VOICE", net: "10.20.15." },
    999: { name: "PARKING" },
  };
  const NAMES = { "erp.contoso.local": "10.20.1.52", "intranet.contoso.local": "10.20.1.15", "timesheets.contoso.local": "10.20.1.40",
    "dc01": "10.20.1.10", "dc01.contoso.local": "10.20.1.10", "prt-srv01": "10.20.1.30" };
  const SERVICES = { ALL: { proto: "any" }, HTTPS: { proto: "tcp", port: 443 }, HTTP: { proto: "tcp", port: 80 }, PING: { proto: "icmp" },
    RDP: { proto: "tcp", port: 3389 }, SSH: { proto: "tcp", port: 22 }, DNS: { proto: "udp", port: 53 }, SMB: { proto: "tcp", port: 445 } };

  /* ---------- the devices (baseline: everything healthy; a desk's setup adds its fault) */
  const IFTYPES = [["GigabitEthernet", "Gi"], ["TenGigabitEthernet", "Te"], ["Vlan", "Vl"], ["Tunnel", "Tu"], ["Loopback", "Lo"]];
  function iosPort(full, o) {
    const ty = IFTYPES.find((x) => full.startsWith(x[0]));
    return Object.assign({ name: full, short: ty ? ty[1] + full.slice(ty[0].length) : full, mode: "access", vlan: 1, voice: null, admin: true, err: null,
      desc: "", portfast: false, bpduguard: false, ip: null, mask: null, peer: null, counters: { inErr: 0, crc: 0 }, speed: "a-1000", duplex: "a-full",
      type: full.startsWith("Ten") ? "SFP-10GBase-SR" : "10/100/1000BaseTX" }, o || {});
  }
  function userPort(n, desc, host, extra) {
    return iosPort("GigabitEthernet1/0/" + n, Object.assign({ desc, vlan: 140, voice: 150, portfast: true, bpduguard: true, peer: host ? { host } : null }, extra || {}));
  }
  function parked(n, name) { return iosPort(name || "GigabitEthernet1/0/" + n, { desc: "PARKED", vlan: 999, admin: false, portfast: true, bpduguard: true }); }

  function hosts() {
    const H = {};
    const add = (id, o) => { H[id] = Object.assign({ id, kind: "pc", mac: "", dhcp: true, ip: null, behind: [], bpdu: false, voice: false, lease: {} }, o); };
    // servers (static, VLAN 10 on the core)
    [["DC01", "10.20.1.10", "0050.56a1.1010"], ["DC02", "10.20.1.11", "0050.56a1.1011"], ["INTRANET01", "10.20.1.15", "0050.56a1.1015"],
     ["FS01", "10.20.1.20", "0050.56a1.1020"], ["FS-SCAN01", "10.20.1.24", "0050.56a1.1024"], ["PRT-SRV01", "10.20.1.30", "0050.56a1.1030"],
     ["app-lnx01", "10.20.1.40", "0050.56a1.1040"], ["SQL-ERP01", "10.20.1.45", "0050.56a1.1045"], ["ERPWEB02", "10.20.1.52", "0050.56a1.1052"]]
      .forEach(([id, ip, mac]) => add(id, { kind: "server", mac, dhcp: false, ip }));
    add("ADM-WS01", { mac: "c8d9.d2a0.3e11", lease: { 140: "10.20.14.50" } });
    // 2nd floor (Finance), Cisco access switch
    add("SEP6C410E2B7A02", { kind: "phone", mac: "6c41.0e2b.7a02", voice: true, behind: ["PC-FIN-019"], cdp: "Cisco IP Phone 8841" });
    add("PC-FIN-019", { mac: "6c4b.9042.1a19" });
    add("SEP6C410E2B7A03", { kind: "phone", mac: "6c41.0e2b.7a03", voice: true, behind: ["PC-FIN-021"], cdp: "Cisco IP Phone 8841" });
    add("PC-FIN-021", { mac: "6c4b.9042.1a21" });
    add("PC-FIN-024", { mac: "6c4b.9042.1a24" });
    add("SEP6C410E2B7A07", { kind: "phone", mac: "6c41.0e2b.7a07", voice: true, behind: ["PC-FIN-025"], cdp: "Cisco IP Phone 8841" });
    add("PC-FIN-025", { mac: "6c4b.9042.1a25" });
    add("PC-FIN-027", { mac: "3c52.82a1.0f44", lease: { 140: "10.20.14.127" } });
    add("SEP6C410E2B7A24", { kind: "phone", mac: "6c41.0e2b.7a24", voice: true, cdp: "Cisco IP Phone 8841" });
    add("FIN-MFP-01", { kind: "printer", mac: "a45d.360c.0a42" });
    // 1st floor (Sales and Marketing), HP switch
    add("LAPTOP-0217", { mac: "f4a8.0d31.2217" });
    add("LAPTOP-0102", { mac: "f4a8.0d31.2102" });
    add("LAPTOP-0264", { mac: "f4a8.0d31.2264" });
    add("LAPTOP-0251", { mac: "f4a8.0d31.2251" });
    add("SEP6C410E2B7B05", { kind: "phone", mac: "6c41.0e2b.7b05", voice: true, cdp: "Cisco IP Phone 8841" });
    add("SALES-MFP-01", { kind: "printer", mac: "a45d.360c.197e", lease: { 140: "10.20.14.87" } });
    // the branch (Valencia), behind the ISR router
    add("SW-VLC-01", { kind: "switch", mac: "7c21.0e55.0101", dhcp: false, behind: ["PC-VLC-011", "PC-VLC-014"] });
    add("PC-VLC-011", { mac: "b0a4.60c1.1011", dhcp: false, ip: "10.40.10.23" });
    add("PC-VLC-014", { mac: "b0a4.60c1.1014", dhcp: false, ip: "10.40.10.27" });
    return H;
  }
  // DHCP on DC01: reservations by MAC, a fixed lease per host and VLAN, or the next address of the pool
  const RESERVED = { "a45d.360c.197e": "10.20.3.43", "a45d.360c.0a42": "10.20.3.42", "0080.92c4.11d0": "10.20.3.61", "c8d9.d2a0.3e11": "10.20.14.50" };
  function dhcpAddr(h, vlan) {
    const v = VLANS[vlan];
    if (!v || !v.net) return null;
    const r = RESERVED[h.mac];
    if (r && r.startsWith(v.net)) return r;
    if (h.lease && h.lease[vlan]) return h.lease[vlan];
    const sum = h.mac.replace(/\./g, "").split("").reduce((a, c) => a + parseInt(c, 16), 0);
    return v.net + (100 + (sum % 90));
  }

  const HEALTH = { psu: [["PS1", "OK"], ["PS2", "OK"]], fans: "OK" };
  function devices() {
    const D = {};
    const acc2 = [];
    acc2.push(userPort(1, "FIN 2.01"), userPort(2, "FIN 2.02", "SEP6C410E2B7A02"), userPort(3, "FIN 2.03 mgarcia", "SEP6C410E2B7A03"),
      userPort(4, "FIN 2.04"), userPort(5, "FIN 2.05", "PC-FIN-024"), userPort(6, "FIN 2.06"), userPort(7, "FIN 2.07", "SEP6C410E2B7A07"));
    for (let n = 8; n <= 13; n++) acc2.push(userPort(n, "FIN 2." + two(n)));
    acc2.push(userPort(14, "FIN 2.14 dlopez", "PC-FIN-027"));
    for (let n = 15; n <= 20; n++) acc2.push(parked(n));
    acc2.push(iosPort("GigabitEthernet1/0/21", { desc: "FIN-MFP-01", vlan: 30, portfast: true, bpduguard: true, peer: { host: "FIN-MFP-01" } }));
    acc2.push(userPort(22, "FIN 2.22"), userPort(23, "FIN 2.23 lnavarro"), userPort(24, "FIN 2.24", "SEP6C410E2B7A24"));
    acc2.push(iosPort("TenGigabitEthernet1/1/1", { desc: "UPLINK SW-CORE-01 Te1/1/1", mode: "trunk", vlan: null, peer: { dev: "SW-CORE-01", port: "TenGigabitEthernet1/1/1" } }));
    for (let n = 2; n <= 4; n++) acc2.push(iosPort("TenGigabitEthernet1/1/" + n, { mode: "access", vlan: 1 }));
    acc2.push(iosPort("Vlan1", { mode: "svi", admin: false }), iosPort("Vlan99", { mode: "svi", ip: "10.20.99.12", mask: "255.255.255.0" }));
    D["SW-ACC-2F"] = { id: "SW-ACC-2F", os: "ios", kind: "switch", site: "HQ", model: "C9200L-24P-4X", platform: "C9200L-24P-4X",
      serial: "JAE25141K2F", version: "17.9.5", image: "CAT9K_LITE_IOSXE", mgmt: "10.20.99.12", gw: "10.20.99.1",
      location: { en: "Head office, 2nd floor comms cabinet, rack F2-A, U38", es: "Oficina central, armario de comunicaciones de la 2ª planta, rack F2-A, U38" },
      role: { en: "Access switch, 2nd floor (Finance)", es: "Switch de acceso, 2ª planta (Finanzas)" },
      owner: { en: "IT infrastructure (network)", es: "Infraestructura IT (red)" }, uptime: 286 * 86400 + 3 * 3600 + 12 * 60,
      health: { cpu: 4, mem: 41, temp: 38, psu: [["PS1", "OK"], ["PS2", "Not present"]], fans: "OK" },
      // v0.7b: the power supply slots (show environment power); slot B is empty until a desk fits one
      power: [{ slot: "1A", pid: "PWR-C5-600WAC", serial: "DTN2337B0KQ", status: "OK", watts: 600 }, { slot: "1B" }],
      vlans: [1, 30, 99, 140, 150, 999], ifaces: acc2, logs: [], errRecovery: [], lldp: false };

    const core = [];
    [["DC01", 1], ["DC02", 2], ["INTRANET01", 3], ["FS01", 4], ["FS-SCAN01", 5], ["PRT-SRV01", 6], ["app-lnx01", 7], ["SQL-ERP01", 8], ["ERPWEB02", 9]].forEach(([h, n]) =>
      core.push(iosPort("GigabitEthernet1/0/" + n, { desc: "SRV " + h, vlan: 10, portfast: true, peer: { host: h } })));
    core.push(iosPort("GigabitEthernet1/0/10", { desc: "SRV ERPWEB01 (decommissioned CHG-4471)", vlan: 10, admin: false }));
    for (let n = 11; n <= 22; n++) core.push(parked(n));
    core.push(iosPort("GigabitEthernet1/0/23", { desc: "IT ADM-WS01", vlan: 140, portfast: true, bpduguard: true, peer: { host: "ADM-WS01" } }));
    core.push(iosPort("GigabitEthernet1/0/24", { desc: "FGT-HQ-01 port1", mode: "routed", vlan: null, ip: "10.20.255.1", mask: "255.255.255.252", peer: { dev: "FGT-HQ-01", port: "port1" } }));
    core.push(iosPort("TenGigabitEthernet1/1/1", { desc: "DOWNLINK SW-ACC-2F", mode: "trunk", vlan: null, peer: { dev: "SW-ACC-2F", port: "TenGigabitEthernet1/1/1" } }));
    core.push(iosPort("TenGigabitEthernet1/1/2", { desc: "DOWNLINK SW-ACC-1F (HP) port 25", mode: "trunk", vlan: null, peer: { dev: "SW-ACC-1F", port: "25" } }));
    for (let n = 3; n <= 8; n++) core.push(iosPort("TenGigabitEthernet1/1/" + n, { mode: "access", vlan: 1 }));
    core.push(iosPort("Vlan1", { mode: "svi", admin: false }));
    [[10, "10.20.1.1"], [30, "10.20.3.1"], [99, "10.20.99.1"], [140, "10.20.14.1"], [150, "10.20.15.1"]].forEach(([v, ip]) =>
      core.push(iosPort("Vlan" + v, { mode: "svi", ip, mask: "255.255.255.0", helper: v === 10 || v === 99 ? null : "10.20.1.10" })));
    D["SW-CORE-01"] = { id: "SW-CORE-01", os: "ios", kind: "switch", site: "HQ", model: "C9300-24P", platform: "C9300-24P", l3: true,
      serial: "FOC2433X0CR", version: "17.9.5", image: "CAT9K_IOSXE", mgmt: "10.20.99.1",
      location: { en: "Head office data room, rack A, U40", es: "Sala técnica de la oficina central, rack A, U40" },
      role: { en: "Core switch (routing for the HQ VLANs)", es: "Switch de núcleo (enruta las VLAN de la sede)" },
      owner: { en: "IT infrastructure (network)", es: "Infraestructura IT (red)" }, uptime: 412 * 86400 + 7 * 3600,
      health: { cpu: 9, mem: 52, temp: 41, psu: HEALTH.psu, fans: "OK" },
      power: [{ slot: "1A", pid: "PWR-C1-715WAC", serial: "DCB2433G1AA", status: "OK", watts: 715 }, { slot: "1B", pid: "PWR-C1-715WAC", serial: "DCB2433G1AB", status: "OK", watts: 715 }],
      vlans: [1, 10, 30, 99, 140, 150, 999], ifaces: core, logs: [], errRecovery: [], lldp: true,
      routes: [["0.0.0.0", 0, "10.20.255.2"]] };

    const hp = [];
    const hpPort = (n, o) => Object.assign({ name: String(n), short: String(n), mode: "access", vlan: 140, voice: 150, admin: true, err: null, desc: "", peer: null,
      counters: { inErr: 0, crc: 0 }, speed: "1000FDx", type: n > 24 ? "SFP+SR" : "100/1000T" }, o || {});
    const salesHosts = { 1: "LAPTOP-0217", 2: "LAPTOP-0102", 4: "LAPTOP-0264", 6: "SEP6C410E2B7B05", 9: "LAPTOP-0251" };
    for (let n = 1; n <= 24; n++) {
      if (n === 18) hp.push(hpPort(n, { desc: "SAL 1.18 SALES-MFP-01", vlan: 30, voice: null, peer: { host: "SALES-MFP-01" } }));
      else if (n >= 23) hp.push(hpPort(n, { desc: "PARKED", vlan: 999, voice: null, admin: false }));
      else hp.push(hpPort(n, { desc: "SAL 1." + two(n), peer: salesHosts[n] ? { host: salesHosts[n] } : null }));
    }
    hp.find((p) => p.name === "7").counters = { inErr: 0, crc: 12 };
    hp.push(hpPort(25, { desc: "UPLINK SW-CORE-01 Te1/1/2", mode: "trunk", vlan: 1, voice: null, tagged: [30, 99, 140, 150], speed: "10GigFD", peer: { dev: "SW-CORE-01", port: "TenGigabitEthernet1/1/2" } }));
    for (let n = 26; n <= 28; n++) hp.push(hpPort(n, { mode: "access", vlan: 1, voice: null, speed: "10GigFD" }));
    D["SW-ACC-1F"] = { id: "SW-ACC-1F", os: "aruba", kind: "switch", site: "HQ", model: "Aruba 2930F-24G-PoE+-4SFP+ (JL261A)", platform: "JL261A",
      serial: "CN93HPX0RT", version: "WC.16.11.0021", mgmt: "10.20.99.13", gw: "10.20.99.1",
      location: { en: "Head office, 1st floor comms cabinet, rack F1-A, U40", es: "Oficina central, armario de comunicaciones de la 1ª planta, rack F1-A, U40" },
      role: { en: "Access switch, 1st floor (Sales and Marketing)", es: "Switch de acceso, 1ª planta (Ventas y Marketing)" },
      owner: { en: "IT infrastructure (network)", es: "Infraestructura IT (red)" }, uptime: 198 * 86400 + 5 * 3600 + 40 * 60,
      health: { cpu: 3, mem: 38, temp: 36, psu: [["PS1", "OK"]], fans: "OK" },
      vlans: [1, 30, 99, 140, 150, 999], ifaces: hp, logs: [], lldp: true };

    D["RTR-VLC-01"] = { id: "RTR-VLC-01", os: "ios", kind: "router", site: "VLC", model: "ISR4331/K9", platform: "ISR4331/K9",
      serial: "FDO2319A1VL", version: "17.9.5", image: "X86_64_LINUX_IOSD-UNIVERSALK9-M", mgmt: "10.40.0.1",
      location: { en: "Valencia branch, comms cabinet, U12", es: "Sucursal de Valencia, armario de comunicaciones, U12" },
      role: { en: "Branch router (internet and IPsec tunnel to head office)", es: "Router de la sucursal (internet y túnel IPsec a la sede)" },
      owner: { en: "IT infrastructure (network)", es: "Infraestructura IT (red)" }, uptime: 97 * 86400 + 22 * 3600,
      health: { cpu: 6, mem: 47, temp: 44, psu: [["PS0", "OK"]], fans: "OK" },
      ifaces: [
        iosPort("GigabitEthernet0/0/0", { desc: "WAN fibre 1 Gb (circuit VLC-0042)", mode: "routed", vlan: null, ip: "198.51.100.22", mask: "255.255.255.252", peer: { wan: true } }),
        iosPort("GigabitEthernet0/0/1", { desc: "LAN VLC users", mode: "routed", vlan: null, ip: "10.40.10.1", mask: "255.255.255.0", peer: { host: "SW-VLC-01" } }),
        iosPort("GigabitEthernet0/0/2", { mode: "routed", vlan: null, admin: false }),
        iosPort("Loopback0", { mode: "svi", ip: "10.40.0.1", mask: "255.255.255.255" }),
        iosPort("Tunnel0", { desc: "IPsec to FGT-HQ-01", mode: "svi", ip: "169.254.10.2", mask: "255.255.255.252" }),
      ], logs: [], errRecovery: [], lldp: false,
      routes: [["0.0.0.0", 0, "198.51.100.21"], ["10.20.0.0", 16, "Tunnel0"]] };

    D["FGT-HQ-01"] = { id: "FGT-HQ-01", os: "fortios", kind: "firewall", site: "HQ", model: "FortiGate 100F", platform: "FortiGate-100F",
      serial: "FG100FTK22018734", version: "v7.4.4,build2662,240514 (GA.F)", mgmt: "10.20.99.5",
      location: { en: "Head office data room, rack A, U42", es: "Sala técnica de la oficina central, rack A, U42" },
      role: { en: "Head office firewall, internet and branch tunnels", es: "Cortafuegos de la sede, internet y túneles con las sucursales" },
      owner: { en: "IT infrastructure (security)", es: "Infraestructura IT (seguridad)" }, uptime: 63 * 86400 + 4 * 3600,
      health: { cpu: 7, mem: 58, temp: 47, psu: [["PSU1", "OK"], ["PSU2", "OK"]], fans: "OK" },
      ifaces: [
        { name: "wan1", ip: "203.0.113.10", mask: "255.255.255.248", alias: "Internet", admin: true },
        { name: "port1", ip: "10.20.255.2", mask: "255.255.255.252", alias: "LAN-CORE", admin: true },
        { name: "mgmt", ip: "10.20.99.5", mask: "255.255.255.0", alias: "", admin: true },
        { name: "to-VLC", ip: "169.254.10.1", mask: "255.255.255.252", alias: "IPsec Valencia", admin: true, tunnel: { remote: "198.51.100.22" } },
      ],
      fw: {
        addresses: [
          { name: "all", subnet: "0.0.0.0 0.0.0.0" },
          { name: "N-HQ-ALL", subnet: "10.20.0.0 255.255.0.0" },
          { name: "N-VLC-ALL", subnet: "10.40.0.0 255.255.0.0" },
          { name: "N-VLC-USERS", subnet: "10.40.10.0 255.255.255.0" },
          { name: "H-INTRANET", subnet: "10.20.1.15 255.255.255.255" },
          { name: "H-TIMESHEETS", subnet: "10.20.1.40 255.255.255.255" },
          { name: "H-ERPWEB01", subnet: "10.20.1.51 255.255.255.255", comment: "Decommissioned in CHG-4471" },
          { name: "H-ERPWEB02", subnet: "10.20.1.52 255.255.255.255", comment: "CHG-4471 ERP web front migration (ERPWEB02)" },
        ],
        addrgrps: [{ name: "G-HQ-APPS", member: ["H-INTRANET", "H-TIMESHEETS", "H-ERPWEB02"], comment: "Apps the branches may use" }],
        policies: [
          { id: 1, name: "HQ-to-Internet", srcintf: ["port1"], dstintf: ["wan1"], srcaddr: ["N-HQ-ALL"], dstaddr: ["all"], action: "accept", service: ["ALL"], nat: true, logtraffic: "all", status: "enable", schedule: "always" },
          { id: 5, name: "HQ-to-VLC", srcintf: ["port1"], dstintf: ["to-VLC"], srcaddr: ["N-HQ-ALL"], dstaddr: ["N-VLC-ALL"], action: "accept", service: ["ALL"], logtraffic: "all", status: "enable", schedule: "always" },
          { id: 12, name: "VLC-to-HQ-apps", srcintf: ["to-VLC"], dstintf: ["port1"], srcaddr: ["N-VLC-USERS"], dstaddr: ["G-HQ-APPS"], action: "accept", service: ["HTTPS", "PING"], logtraffic: "all", status: "enable", schedule: "always", comments: "CHG-4402 Valencia users to HQ apps" },
          { id: 13, name: "VLC-to-HQ-deny", srcintf: ["to-VLC"], dstintf: ["port1"], srcaddr: ["all"], dstaddr: ["all"], action: "deny", service: ["ALL"], logtraffic: "all", status: "enable", schedule: "always", comments: "Explicit deny, logged" },
        ],
        routes: [["0.0.0.0", 0, "203.0.113.9", "wan1"], ["10.20.0.0", 16, "10.20.255.1", "port1"], ["10.40.0.0", 16, null, "to-VLC"]],
      },
      logs: [] };
    return D;
  }

  /* ---------- building a net and applying a desk's setup */
  const CONFIG_KEYS = ["desc", "mode", "vlan", "voice", "tagged", "admin", "portfast", "bpduguard", "ip", "mask"];
  function snap(d) {
    if (d.os === "fortios") return null;   // FortiOS saves every change on its own (cfg-save automatic)
    return JSON.stringify({ i: d.ifaces.map((p) => CONFIG_KEYS.map((k) => p[k] === undefined ? null : p[k])), v: d.vlans, r: d.errRecovery || [], vn: d.vlanNames || {} });
  }
  function saved(d) { return d.os === "fortios" || snap(d) === d.startup; }
  function port(d, name) {
    if (!d || !d.ifaces) return null;
    const n = String(name).toLowerCase();
    return d.ifaces.find((p) => p.name.toLowerCase() === n || (p.short && p.short.toLowerCase() === n)) || null;
  }
  function apply(net, op) {
    if (op.host) {
      const h = net.hosts[op.host] || (net.hosts[op.host] = { id: op.host, kind: "pc", mac: "", dhcp: true, ip: null, behind: [], bpdu: false, voice: false, lease: {} });
      Object.assign(h, op.set || {});
      if (op.renew) renewHost(net, h);
      return;
    }
    const d = net.devices[op.dev];
    if (!d) throw new Error("unknown device " + op.dev);
    if (op.log) op.log.forEach((l) => d.logs.push(typeof l === "string" ? { at: op.live ? net.clock : net.clock - 3600000, text: l } : { at: T0 + (l.ago != null ? -l.ago * 1000 : 0), text: l.text, sev: l.sev, code: l.code }));
    if (op.port) {
      const p = port(d, op.port);
      if (!p) throw new Error("unknown port " + op.dev + " " + op.port);
      const was = linkUp(net, d, p);
      if (op.set) Object.assign(p, op.set);
      if ("peer" in op) p.peer = op.peer ? (typeof op.peer === "string" ? { host: op.peer } : op.peer) : null;
      if (op.live) linkEvents(net, d, p, was, []);
    }
    // v0.7b: a power supply changes (fails, is removed, a new one is fitted): { dev, power: [{ slot, pid, serial, status }], log }
    if (op.power && d.power) op.power.forEach((ps) => {
      const i = d.power.findIndex((x) => x.slot === ps.slot);
      if (i === -1) d.power.push(Object.assign({}, ps)); else d.power[i] = Object.assign({ slot: ps.slot }, ps.pid === null ? {} : Object.assign({}, d.power[i], ps));
    });
    if (op.fw && d.fw) {
      const list = op.fw === "policy" ? d.fw.policies : op.fw === "address" ? d.fw.addresses : d.fw.addrgrps;
      const key = op.fw === "policy" ? "id" : "name";
      const e = list.find((x) => x[key] === op.id);
      if (e) Object.assign(e, op.set || {}); else list.push(Object.assign({ [key]: op.id }, op.set || {}));
    }
  }
  // what each device logged before the shift started (ago: seconds before 09:41)
  function baseLogs(net) {
    const L = (id, ago, text, sev, code) => net.devices[id].logs.push({ at: T0 - ago * 1000, text, sev, code });
    ["SW-ACC-2F", "SW-CORE-01", "RTR-VLC-01"].forEach((id) => {
      L(id, 3 * 86400 + 6300, "%SYS-5-CONFIG_I: Configured from console by it.admin on vty0 (10.20.14.50)");
      L(id, 3 * 86400 + 6290, "%SYS-6-PRIVCFG_ENCRYPT_SUCCESS: Successfully encrypted private config file");
    });
    L("SW-ACC-2F", 7400, "%LINK-3-UPDOWN: Interface GigabitEthernet1/0/5, changed state to up");
    L("SW-ACC-2F", 7399, "%LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet1/0/5, changed state to up");
    L("SW-ACC-2F", 5100, "%ILPOWER-5-POWER_GRANTED: Interface Gi1/0/24: Power granted");
    L("SW-CORE-01", 41000, "%DHCP_SNOOPING-5-DHCP_SNOOPING_UNTRUSTED_PORT: DHCP_SNOOPING drop message on untrusted port, message type: DHCPOFFER, MAC sa: 0011.2233.4455");
    L("SW-CORE-01", 13 * 3600, "%LINK-5-CHANGED: Interface GigabitEthernet1/0/10, changed state to administratively down");
    L("RTR-VLC-01", 9 * 3600, "%CRYPTO-6-IKMP_SA_EXPIRED: IKEv2 SA rekeyed with peer 203.0.113.10");
    L("SW-ACC-1F", 3 * 86400, "mgr:  SME SSH from 10.20.14.50 - MANAGER Mode", "I", "00179");
    L("SW-ACC-1F", 6000, "ports: port 9 is now on-line", "I", "00076");
    L("SW-ACC-1F", 3600, "ports: port 7 - Excessive CRC/alignment errors", "W", "00331");
    L("FGT-HQ-01", 13 * 3600, 'logdesc="Object attribute configured" user="it.netops" ui="ssh(10.20.14.61)" action="Edit" cfgpath="firewall.address" cfgobj="H-ERPWEB02" msg="Edit firewall.address H-ERPWEB02"');
    L("FGT-HQ-01", 13 * 3600 - 40, 'logdesc="Object attribute configured" user="it.netops" ui="ssh(10.20.14.61)" action="Edit" cfgpath="firewall.addrgrp" cfgobj="G-HQ-APPS" msg="Edit firewall.addrgrp G-HQ-APPS"');
    L("FGT-HQ-01", 3000, 'logdesc="Admin login successful" user="it.admin" ui="ssh(10.20.14.50)" msg="Administrator it.admin logged in successfully from ssh(10.20.14.50)"');
  }
  function createNet(setup) {
    const net = { clock: T0, devices: devices(), hosts: hosts() };
    // every host on a port that is up holds its DHCP lease for that VLAN
    Object.values(net.devices).forEach((d) => (d.ifaces || []).forEach((p) => { if (p.peer && p.peer.host) attachedHosts(net, p).forEach((h) => { if (h.dhcp && !h.ip) h.ip = dhcpAddr(h, h.voice ? p.voice : p.vlan); }); }));
    baseLogs(net);
    const later = [];
    (setup || []).forEach((op) => (op.unsaved ? later.push(op) : apply(net, op)));
    Object.values(net.devices).forEach((d) => { d.startup = snap(d); });
    later.forEach((op) => apply(net, op));
    return net;
  }

  /* ---------- links, hosts, MAC tables and reachability (derived from the data, never stored) */
  function attachedHosts(net, p) {
    if (!p.peer || !p.peer.host) return [];
    const h = net.hosts[p.peer.host];
    if (!h) return [];
    return [h].concat((h.behind || []).map((id) => net.hosts[id]).filter(Boolean));
  }
  function peerPresent(net, p) {
    if (!p.peer) return false;
    if (p.peer.wan) return true;
    if (p.peer.host) return Boolean(net.hosts[p.peer.host]);
    const d = net.devices[p.peer.dev];
    const q = d && port(d, p.peer.port);
    return Boolean(q && (q.admin !== false) && !q.err);
  }
  function linkUp(net, d, p) {
    if (p.mode === "svi") return p.admin !== false;
    return p.admin !== false && !p.err && peerPresent(net, p);
  }
  function status(net, d, p) {
    if (p.admin === false) return "disabled";
    if (p.err) return "err-disabled";
    return linkUp(net, d, p) ? "connected" : "notconnect";
  }
  function hostVlan(p, h) { return h.voice && p.voice ? p.voice : p.vlan; }
  // where a host is plugged in: {dev, port}
  function locate(net, hostId) {
    for (const d of Object.values(net.devices)) for (const p of d.ifaces || []) {
      if (!p.peer || !p.peer.host) continue;
      if (p.peer.host === hostId || attachedHosts(net, p).some((h) => h.id === hostId)) return { dev: d, port: p };
    }
    return null;
  }
  function uplinkToCore(net, d) {
    if (d.id === "SW-CORE-01" || d.site !== "HQ" || d.os === "fortios") return true;
    return (d.ifaces || []).some((p) => p.mode === "trunk" && p.peer && p.peer.dev === "SW-CORE-01" && linkUp(net, d, p));
  }
  function hostLive(net, h) {
    const at = locate(net, h.id);
    if (!at || !h.ip || !linkUp(net, at.dev, at.port)) return false;
    if (at.dev.os === "ios" && at.port.mode === "routed") return inNet(h.ip, at.port.ip, maskBits(at.port.mask));
    const v = VLANS[hostVlan(at.port, h)];
    return Boolean(v && v.net && h.ip.startsWith(v.net) && uplinkToCore(net, at.dev));
  }
  function renewHost(net, h) {
    if (!h.dhcp) return;
    const at = locate(net, h.id);
    if (!at || at.port.mode === "routed") return;
    if (linkUp(net, at.dev, at.port)) h.ip = dhcpAddr(h, hostVlan(at.port, h));
  }
  // what changes when a port goes up or down: logs, BPDU Guard, and DHCP for the hosts behind it
  function linkEvents(net, d, p, was, tags) {
    const now = linkUp(net, d, p);
    const log = (text, sev, code) => { net.clock += 1000; d.logs.push({ at: net.clock, text, sev, code }); };
    if (d.os === "aruba") {
      if (!was && now) { log(`ports: port ${p.name} is now on-line`, "I", "00076"); attachedHosts(net, p).forEach((h) => renewHost(net, h)); }
      if (was && !now) log(`ports: port ${p.name} is now off-line`, "I", "00077");
      return now;
    }
    if (!was && now) {
      log(`%LINK-3-UPDOWN: Interface ${p.name}, changed state to up`);
      if (p.bpduguard === true && attachedHosts(net, p).some((h) => h.bpdu)) {
        log(`%SPANTREE-2-BLOCK_BPDUGUARD: Received BPDU on port ${p.short} with BPDU Guard enabled. Disabling port.`);
        log(`%PM-4-ERR_DISABLE: bpduguard error detected on ${p.short}, putting ${p.short} in err-disable state`);
        p.err = "bpduguard";
        log(`%LINK-3-UPDOWN: Interface ${p.name}, changed state to down`);
        tags.push("err-disabled " + p.short);
        return false;
      }
      log(`%LINEPROTO-5-UPDOWN: Line protocol on Interface ${p.name}, changed state to up`);
      attachedHosts(net, p).forEach((h) => renewHost(net, h));
    }
    if (was && !now) {
      log(`%LINEPROTO-5-UPDOWN: Line protocol on Interface ${p.name}, changed state to down`);
      log(p.admin === false ? `%LINK-5-CHANGED: Interface ${p.name}, changed state to administratively down` : `%LINK-3-UPDOWN: Interface ${p.name}, changed state to down`);
    }
    return now;
  }
  // the MAC address table of a switch: [{vlan, mac, port, host}]; uplinks learn everything behind the switch at the other end
  function macTable(net, d, seen) {
    const out = [];
    const visit = seen || new Set([d.id]);
    for (const p of d.ifaces || []) {
      if (p.mode === "svi" || p.mode === "routed" || !linkUp(net, d, p)) continue;
      if (p.peer && p.peer.host) attachedHosts(net, p).forEach((h) => out.push({ vlan: hostVlan(p, h), mac: h.mac, port: p, host: h }));
      else if (p.peer && p.peer.dev && !visit.has(p.peer.dev)) {
        visit.add(p.peer.dev);
        macTable(net, net.devices[p.peer.dev], visit).forEach((e) => out.push({ vlan: e.vlan, mac: e.mac, port: p, host: e.host }));
      }
    }
    return out.sort((a, b) => a.vlan - b.vlan || a.mac.localeCompare(b.mac));
  }
  function whoHas(net, ip) {
    for (const d of Object.values(net.devices)) for (const p of d.ifaces || []) if (p.ip === ip) return { dev: d, port: p };
    if (Object.values(net.devices).some((d) => d.mgmt === ip)) return { dev: Object.values(net.devices).find((d) => d.mgmt === ip) };
    const h = Object.values(net.hosts).find((x) => x.ip === ip && hostLive(net, x));
    return h ? { host: h } : null;
  }
  const siteOf = (ip) => (inNet(ip, "10.40.0.0", 16) || ip === "169.254.10.2" || ip === "198.51.100.22" ? "VLC" : "HQ");

  /* ---------- the firewall: objects and the policy that a flow matches (first match wins, then the implicit deny, policy 0) */
  function addrContains(fw, name, ip, depth) {
    if ((depth || 0) > 5) return false;
    const a = fw.addresses.find((x) => x.name === name);
    if (a) { const [n, m] = String(a.subnet || "0.0.0.0 0.0.0.0").split(" "); return inNet(ip, n, maskBits(m)); }
    const g = fw.addrgrps.find((x) => x.name === name);
    return Boolean(g && g.member.some((x) => addrContains(fw, x, ip, (depth || 0) + 1)));
  }
  function serviceMatch(names, flow) {
    return names.some((s) => { const v = SERVICES[s]; return v && (v.proto === "any" || (v.proto === flow.proto && (v.port == null || v.port === flow.port))); });
  }
  function fwEval(fwDev, flow) {
    const fw = fwDev.fw;
    for (const p of fw.policies) {
      if (p.status === "disable") continue;
      const intf = (list, x) => (list || []).includes(x) || (list || []).includes("any");
      if (!intf(p.srcintf, flow.srcintf) || !intf(p.dstintf, flow.dstintf)) continue;
      if (!(p.srcaddr || []).some((a) => addrContains(fw, a, flow.src)) || !(p.dstaddr || []).some((a) => addrContains(fw, a, flow.dst))) continue;
      if (!serviceMatch(p.service || [], flow)) continue;
      return { policy: p.id, action: p.action || "deny" };
    }
    return { policy: 0, action: "deny" };
  }
  const anyAny = (fwDev) => fwDev.fw.policies.some((p) => p.status !== "disable" && p.action === "accept" && (p.srcaddr || []).includes("all") && (p.dstaddr || []).includes("all") && (p.service || []).includes("ALL"));

  // can `from` reach `ip`? {ok, hops, why}. Crossing between the branch and head office goes through the FortiGate's policies.
  function reach(net, from, ip, source, proto, dport) {
    const fw = net.devices["FGT-HQ-01"];
    const target = whoHas(net, ip);
    const flowProto = proto || "icmp";
    if (!target) return { ok: false, hops: [], why: "no-host" };
    if (target.dev && target.dev.id === from.id) return { ok: true, hops: [ip] };
    if (from.os === "fortios") return { ok: true, hops: siteOf(ip) === "VLC" ? ["169.254.10.2", ip] : ["10.20.255.1", ip] };
    const src = source || defaultSource(from, ip);
    const a = from.site || "HQ", b = target.dev ? (target.dev.site || siteOf(ip)) : siteOf(ip);
    if (a === b) return { ok: true, hops: hopsWithin(from, ip) };
    if (target.dev && target.dev.id === "FGT-HQ-01") return { ok: true, hops: [ip] };
    const flow = a === "VLC" ? { srcintf: "to-VLC", dstintf: "port1", src, dst: ip, proto: flowProto, port: dport } : { srcintf: "port1", dstintf: "to-VLC", src, dst: ip, proto: flowProto, port: dport };
    const r = fwEval(fw, flow);
    if (r.action !== "accept") return { ok: false, hops: a === "VLC" ? ["169.254.10.1"] : ["10.20.99.1", "10.20.255.2"], why: "policy", policy: r.policy, src };
    return { ok: true, hops: a === "VLC" ? ["169.254.10.1", "10.20.255.1", ip] : ["10.20.99.1", "10.20.255.2", "169.254.10.2", ip], policy: r.policy, src };
  }
  function defaultSource(d, ip) {
    if (d.id === "RTR-VLC-01") return siteOf(ip) === "VLC" ? "10.40.10.1" : "169.254.10.2";
    if (d.id === "ADM-WS01") return "10.20.14.50";
    return d.mgmt;
  }
  function hopsWithin(from, ip) {
    if (from.id === "SW-CORE-01" || from.id === "RTR-VLC-01") return [ip];
    return ["10.20.99.1", ip];
  }

  /* ---------- tokens and the IOS-style matcher (unique prefixes, the ^ marker, incomplete and ambiguous commands) */
  function tokenize(s) {
    const out = [];
    const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
    let m;
    while ((m = re.exec(s))) out.push({ s: m[1] != null ? m[1] : m[2] != null ? m[2] : m[3], at: m.index, quoted: m[1] != null || m[2] != null, raw: m[0] });
    return out;
  }
  function parseIf(toks, i, d) {
    let word = toks[i].s;
    let next = i + 1;
    if (/^[a-z-]+$/i.test(word) && toks[i + 1] && /^\d[\d/.]*$/.test(toks[i + 1].s)) { word += toks[i + 1].s; next = i + 2; }
    const m = /^([a-z-]+)\s*(\d[\d/.]*)$/i.exec(word);
    if (!m) return null;
    const pre = m[1].toLowerCase();
    const types = IFTYPES.filter((x) => x[0].toLowerCase().startsWith(pre) || x[1].toLowerCase() === pre);
    if (types.length !== 1) return null;
    const full = types[0][0] + m[2];
    if (d && !port(d, full)) return null;
    return { name: full, next };
  }
  // one pattern against the tokens: {ok, args, exp, lit, steps} or {ok: false, at, incomplete, steps}; steps = [{i, lit, word}] per token consumed
  function matchOne(pat, toks, d) {
    const args = [];
    const steps = [];
    let i = 0;
    const fail = (incomplete) => ({ ok: false, at: i, incomplete: Boolean(incomplete), steps });
    for (let k = 0; k < pat.length; k++) {
      const opt = pat[k][0] === "?";
      const name = opt ? pat[k].slice(1) : pat[k];
      if (i >= toks.length) { if (opt || name === "<line?>") continue; return fail(true); }
      const tk = toks[i].s;
      if (name === "<line>" || name === "<line?>") { args.push(toks.slice(i).map((x) => x.s).join(" ")); steps.push({ i, lit: false, word: "<line>" }); i = toks.length; continue; }
      if (name === "<if>") { const r = parseIf(toks, i, d); if (!r) { if (opt) continue; return fail(); } args.push(r.name); steps.push({ i, lit: false, word: r.name }); i = r.next; continue; }
      const kinds = { "<num>": (x) => (/^\d+$/.test(x) ? Number(x) : null), "<ip>": (x) => (isIp(x) ? x : null), "<mac>": (x) => parseMac(x, true), "<word>": (x) => x };
      if (kinds[name]) {
        const v = kinds[name](tk);
        if (v === null) { if (opt) continue; return fail(); }
        args.push(v); steps.push({ i, lit: false, word: name }); i++; continue;
      }
      const hits = name.split("|").filter((w) => w.startsWith(tk.toLowerCase()));
      if (hits.length) {
        const word = hits.find((w) => w === tk.toLowerCase()) || hits[0];
        args.push(word); steps.push({ i, lit: true, word, amb: hits.length > 1 && !hits.includes(tk.toLowerCase()) }); i++; continue;
      }
      if (opt) continue;
      return fail();
    }
    if (i < toks.length) return fail();
    return { ok: true, args, exp: steps.map((x) => x.word).join(" "), lit: steps.filter((x) => x.lit).length, steps };
  }
  // returns {cmd, args, pat} | {error: "invalid"|"incomplete"|"ambiguous", at}
  function match(cmds, toks, d) {
    const full = [];
    const pats = [];
    let best = { at: -1 };
    for (const c of cmds) {
      for (const pat of [].concat(c.p)) {
        pats.push(pat);
        const r = matchOne(pat.split(" "), toks, d);
        if (r.ok) full.push({ cmd: c, args: r.args, exp: r.exp, lit: r.lit, steps: r.steps, pat });
        else if (r.at > best.at || (r.at === best.at && r.incomplete)) best = r;
      }
    }
    if (!full.length) {
      // an abbreviation that could start two different keywords is ambiguous even before the command is complete (sh i: interfaces or ip)
      if (best.incomplete && toks.length) {
        const last = toks.length - 1;
        const words = new Set();
        pats.forEach((pat) => { const r = matchOne(pat.split(" "), toks, d); const st = (r.steps || []).find((x) => x.i === last); if (st && st.lit) words.add(st.word); });
        if (words.size > 1 && !words.has(toks[last].s.toLowerCase())) return { error: "ambiguous" };
      }
      return { error: best.incomplete ? "incomplete" : "invalid", at: Math.max(0, best.at) };
    }
    const top = Math.max(...full.map((f) => f.lit));
    const win = full.find((f) => f.lit === top);
    // an abbreviation that two different keywords share at the same point (sh s: spanning-tree or startup-config) is ambiguous, as on the real CLI
    for (const st of win.steps) {
      if (st.amb) return { error: "ambiguous" };
      if (!st.lit || toks[st.i].s.toLowerCase() === st.word) continue;
      const before = win.steps.filter((x) => x.i < st.i).map((x) => x.word).join(" ");
      for (const pat of pats) {
        const r = matchOne(pat.split(" "), toks.slice(0, st.i + 1), d);
        const o = r.steps.find((x) => x.i === st.i);
        if (o && o.lit && o.word !== st.word && r.steps.filter((x) => x.i < st.i).map((x) => x.word).join(" ") === before) return { error: "ambiguous" };
      }
    }
    return win;
  }

  /* ---------- output filters (IOS: | include, exclude, begin, section) */
  function pipe(lines, filt) {
    if (!filt) return lines;
    const m = /^\s*(i|in|inc|incl|inclu|includ|include|e|ex|exc|excl|exclu|exclud|exclude|b|be|beg|begi|begin|s|se|sec|sect|secti|sectio|section)\s+(.+)$/i.exec(filt);
    if (!m) return null;
    let re;
    try { re = new RegExp(m[2].trim(), "i"); } catch (e) { re = new RegExp(m[2].trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"); }
    const k = m[1][0].toLowerCase();
    if (k === "i") return lines.filter((l) => re.test(l));
    if (k === "e") return lines.filter((l) => !re.test(l));
    if (k === "b") { const i = lines.findIndex((l) => re.test(l)); return i < 0 ? [] : lines.slice(i); }
    const out = [];
    let inSec = false;
    lines.forEach((l) => {
      if (!/^\s/.test(l)) inSec = re.test(l);
      else if (re.test(l) && !inSec) { out.push(l); return; }
      if (inSec) out.push(l);
    });
    return out;
  }

  /* ---------- Cisco IOS XE */
  const prv = (d) => d.hostname || d.id;
  function iosPrompt(s, d) {
    const h = prv(d);
    if (s.mode === "user") return h + ">";
    if (s.mode === "exec") return h + "#";
    if (s.mode === "config") return h + "(config)#";
    if (s.mode === "if") return h + "(config-if)#";
    if (s.mode === "vlan") return h + "(config-vlan)#";
    return h + "#";
  }
  function uptimeText(sec) {
    const w = Math.floor(sec / 604800), dd = Math.floor((sec % 604800) / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
    return `${w} weeks, ${dd} days, ${h} hours, ${m} minutes`;
  }
  function iosVersion(d) {
    const sw = d.kind === "switch";
    return [
      `Cisco IOS XE Software, Version ${d.version.replace(/^(\d+)\.(\d+)\.(\d+)$/, (_, a, b, c) => `${a}.${two(b)}.${two(c)}`)}`,
      sw ? `Cisco IOS Software [Cupertino], Catalyst L3 Switch Software (${d.image}), Version ${d.version}, RELEASE SOFTWARE (fc4)`
        : `Cisco IOS Software [Cupertino], ISR Software (${d.image}), Version ${d.version}, RELEASE SOFTWARE (fc4)`,
      "Technical Support: http://www.cisco.com/techsupport", "Copyright (c) 1986-2024 by Cisco Systems, Inc.", "",
      `${prv(d)} uptime is ${uptimeText(d.uptime)}`, sw ? 'System image file is "flash:packages.conf"' : `System image file is "bootflash:isr4300-universalk9.${d.version.replace(/\./g, ".0")}a.SPA.bin"`,
      "", `cisco ${d.platform} processor with 1309208K/6147K bytes of memory.`, `Processor board ID ${d.serial}`,
      saved(d) ? "" : "Configuration register is 0x102 (will be 0x102 at next reload)", "",
      `Model Number                       : ${d.platform}`, `System Serial Number               : ${d.serial}`, ""].filter((x, i, a) => !(x === "" && a[i - 1] === ""));
  }
  function iosStatusLines(net, d, list, errOnly) {
    const out = errOnly ? ["", "Port         Name               Status       Reason               Err-disabled Vlans"]
      : ["", "Port         Name               Status       Vlan       Duplex  Speed  Type"];
    list.forEach((p) => {
      if (p.mode === "svi") return;
      const st = status(net, d, p);
      if (errOnly) { if (st === "err-disabled") out.push(`${pad(p.short, 13)}${pad(p.desc.slice(0, 18), 19)}${pad(st, 13)}${p.err}`); return; }
      const up = st === "connected";
      const vl = p.mode === "trunk" ? "trunk" : p.mode === "routed" ? "routed" : String(p.vlan);
      out.push(`${pad(p.short, 13)}${pad(p.desc.slice(0, 18), 19)}${pad(st, 13)}${pad(vl, 11)}${pad(up ? p.duplex : "auto", 7)} ${pad(up ? p.speed : "auto", 6)} ${p.type}`);
    });
    return out;
  }
  function iosIntDetail(net, d, p) {
    const st = status(net, d, p);
    const up = st === "connected";
    const line = p.admin === false ? "is administratively down, line protocol is down (disabled)" : p.err ? "is down, line protocol is down (err-disabled)"
      : up ? "is up, line protocol is up (connected)" : "is down, line protocol is down (notconnect)";
    const mac = "6c13.d5a2." + (8000 + d.ifaces.indexOf(p)).toString(16).padStart(4, "0").slice(-4);
    const inPk = up ? 1820433 + d.ifaces.indexOf(p) * 7713 : 182733;
    return [`${p.name} ${line}`, `  Hardware is ${p.name.startsWith("Ten") ? "Ten Gigabit Ethernet" : p.mode === "svi" ? "Ethernet SVI" : "Gigabit Ethernet"}, address is ${mac} (bia ${mac})`,
      p.desc ? `  Description: ${p.desc}` : null, p.ip ? `  Internet address is ${p.ip}/${maskBits(p.mask)}` : null,
      `  MTU 1500 bytes, BW ${p.name.startsWith("Ten") ? "10000000" : "1000000"} Kbit/sec, DLY 10 usec,`, "     reliability 255/255, txload 1/255, rxload 1/255",
      "  Encapsulation ARPA, loopback not set", "  Keepalive set (10 sec)",
      up ? `  Full-duplex, ${p.name.startsWith("Ten") ? "10Gb/s" : "1000Mb/s"}, media type is ${p.type}` : `  Auto-duplex, Auto-speed, media type is ${p.type}`,
      `  Last input ${up ? "00:00:00" : "00:48:13"}, output ${up ? "00:00:01" : "00:48:13"}, output hang never`,
      '  Last clearing of "show interface" counters never',
      "  Input queue: 0/2000/0/0 (size/max/drops/flushes); Total output drops: 0", "  Queueing strategy: fifo",
      `  5 minute input rate ${up ? "18000" : "0"} bits/sec, ${up ? "12" : "0"} packets/sec`, `  5 minute output rate ${up ? "41000" : "0"} bits/sec, ${up ? "19" : "0"} packets/sec`,
      `     ${inPk} packets input, ${inPk * 538} bytes, 0 no buffer`, "     Received 1203 broadcasts (1180 multicasts)", "     0 runts, 0 giants, 0 throttles",
      `     ${p.counters.inErr + p.counters.crc} input errors, ${p.counters.crc} CRC, 0 frame, 0 overrun, 0 ignored`, "     0 watchdog, 1180 multicast, 0 pause input",
      `     ${inPk * 2 + 311} packets output, ${inPk * 1133} bytes, 0 underruns`, "     0 output errors, 0 collisions, 1 interface resets", ""].filter((x) => x !== null);
  }
  function iosRunning(net, d, startup) {
    const ifaces = startup ? JSON.parse(d.startup).i.map((v, i) => Object.assign({}, d.ifaces[i], Object.fromEntries(CONFIG_KEYS.map((k, j) => [k, v[j]])))) : d.ifaces;
    const vlans = startup ? JSON.parse(d.startup).v : d.vlans;
    const rec = startup ? JSON.parse(d.startup).r : d.errRecovery || [];
    const out = ["!", startup ? `! Last configuration change at 07:58:31 CET Mon Oct 26 2026 by it.admin` : `! Last configuration change at ${hms(net.clock)} CET Fri Oct 30 2026 by it.admin`,
      "!", `version ${d.version.split(".").slice(0, 2).join(".")}`, "service timestamps debug datetime msec", "service timestamps log datetime msec", "service password-encryption", "!",
      `hostname ${prv(d)}`, "!", "logging buffered 64000 informational", "enable secret 9 $9$Contoso.simulated.hash", "!", "aaa new-model", "aaa authentication login default group TACACS-CONTOSO local",
      "aaa authorization exec default group TACACS-CONTOSO local", "!", "clock timezone CET 1 0", "clock summer-time CEST recurring last Sun Mar 2:00 last Sun Oct 3:00", "!",
      "ip domain name contoso.local", "ip name-server 10.20.1.10 10.20.1.11", "!"];
    if (d.kind === "switch") {
      out.push("spanning-tree mode rapid-pvst", "spanning-tree extend system-id");
      rec.forEach((c) => out.push("errdisable recovery cause " + c));
      out.push("!");
      vlans.filter((v) => v !== 1).forEach((v) => out.push(`vlan ${v}`, ` name ${(d.vlanNames || {})[v] || (VLANS[v] || {}).name || "VLAN" + String(v).padStart(4, "0")}`, "!"));
      if (d.lldp) out.push("lldp run", "!");
    }
    ifaces.forEach((p) => {
      out.push(`interface ${p.name}`);
      if (p.desc) out.push(` description ${p.desc}`);
      if (p.mode === "access") {
        if (p.vlan !== 1) out.push(` switchport access vlan ${p.vlan}`);
        out.push(" switchport mode access");
        if (p.voice) out.push(` switchport voice vlan ${p.voice}`);
      } else if (p.mode === "trunk") out.push(" switchport trunk allowed vlan 10,30,99,140,150", " switchport mode trunk");
      else if (p.mode === "routed" && d.kind === "switch") out.push(" no switchport");
      if (p.ip) out.push(` ip address ${p.ip} ${p.mask}`);
      else if (p.mode === "svi" || p.mode === "routed") out.push(" no ip address");
      if (p.helper) out.push(` ip helper-address ${p.helper}`);
      if (p.name === "Tunnel0") out.push(" tunnel source GigabitEthernet0/0/0", " tunnel mode ipsec ipv4", " tunnel destination 203.0.113.10", " tunnel protection ipsec profile IPSEC-HQ");
      if (p.admin === false) out.push(" shutdown");
      if (p.portfast) out.push(" spanning-tree portfast");
      if (p.bpduguard === true) out.push(" spanning-tree bpduguard enable");
      if (p.bpduguard === "disable") out.push(" spanning-tree bpduguard disable");
      out.push("!");
    });
    (d.routes || []).forEach(([n, b, via]) => out.push(`ip route ${n} ${bitsMask(b)} ${via}`));
    out.push("ip ssh version 2", "!", "line con 0", " logging synchronous", "line vty 0 15", " transport input ssh", "!", "end");
    const text = out;
    return ["Building configuration...", "", `Current configuration : ${text.join("\n").length + 400} bytes`].concat(text);
  }
  function iosVlanBrief(d) {
    const out = ["", "VLAN Name                             Status    Ports", "---- -------------------------------- --------- -------------------------------"];
    d.vlans.forEach((v) => {
      const ports = d.ifaces.filter((p) => p.mode === "access" && p.vlan === v).map((p) => p.short);
      const name = (d.vlanNames || {})[v] || (VLANS[v] || {}).name || "VLAN" + String(v).padStart(4, "0");
      const rows = [];
      for (let i = 0; i < Math.max(1, ports.length); i += 4) rows.push(ports.slice(i, i + 4).join(", "));
      out.push(`${pad(v, 5)}${pad(name, 33)}${pad("active", 10)}${rows[0]}`);
      rows.slice(1).forEach((r) => out.push(" ".repeat(48) + r));
    });
    ["1002 fddi-default", "1003 token-ring-default", "1004 fddinet-default", "1005 trnet-default"].forEach((x) => out.push(`${pad(x.split(" ")[0], 5)}${pad(x.split(" ")[1], 33)}act/unsup`));
    return out;
  }
  function macLines(rows) {
    return ["          Mac Address Table", "-------------------------------------------", "", "Vlan    Mac Address       Type        Ports", "----    -----------       --------    -----"]
      .concat(rows.map((e) => `${lpad(e.vlan, 4)}    ${e.mac}    DYNAMIC     ${e.port.short}`)).concat([`Total Mac Addresses for this criterion: ${rows.length}`]);
  }
  function cdpLines(net, d, detail) {
    const rows = [];
    d.ifaces.forEach((p) => {
      if (!linkUp(net, d, p) || !p.peer) return;
      const shortIf = (x) => x.replace(/^TenGigabitEthernet/, "Ten ").replace(/^GigabitEthernet/, "Gig ");
      if (p.peer.dev) {
        const o = net.devices[p.peer.dev];
        if (o.os !== "ios") return;   // HP does not send CDP, the FortiGate does not either
        rows.push({ id: o.id + ".contoso.local", local: shortIf(p.name), cap: "R S I", plat: o.platform, port: shortIf(p.peer.port), ip: o.mgmt });
      } else attachedHosts(net, p).filter((h) => h.cdp).forEach((h) => rows.push({ id: h.id, local: shortIf(p.name), cap: "H P M", plat: "IP Phone", port: "Port 1", ip: h.ip }));
    });
    if (detail) {
      const out = [];
      rows.forEach((r) => out.push("-------------------------", `Device ID: ${r.id}`, "Entry address(es): ", `  IP address: ${r.ip || "none"}`, `Platform: ${r.plat},  Capabilities: ${r.cap.includes("R") ? "Router Switch IGMP" : "Host Phone"}`,
        `Interface: ${r.local.replace("Ten ", "TenGigabitEthernet").replace("Gig ", "GigabitEthernet")},  Port ID (outgoing port): ${r.port}`, "Holdtime : 142 sec", ""));
      return out.concat([`Total cdp entries displayed : ${rows.length}`]);
    }
    const out = ["Capability Codes: R - Router, T - Trans Bridge, B - Source Route Bridge", "                  S - Switch, H - Host, I - IGMP, r - Repeater, P - Phone,",
      "                  D - Remote, C - CVTA, M - Two-port Mac Relay", "", "Device ID        Local Intrfce     Holdtme    Capability  Platform  Port ID"];
    rows.forEach((r) => { if (r.id.length > 16) out.push(r.id, `${" ".repeat(17)}${pad(r.local, 18)}${pad("142", 16)}${pad(r.cap, 7)}${pad(r.plat, 10)}${r.port}`); else out.push(`${pad(r.id, 17)}${pad(r.local, 18)}${pad("151", 16)}${pad(r.cap, 7)}${pad(r.plat, 10)}${r.port}`); });
    return out.concat(["", `Total cdp entries displayed : ${rows.length}`]);
  }
  function lldpLines(net, d) {
    if (!d.lldp) return ["% LLDP is not enabled"];
    const out = ["", "Capability codes:", "    (R) Router, (B) Bridge, (T) Telephone, (C) DOCSIS Cable Device", "    (W) WLAN Access Point, (P) Repeater, (S) Station, (O) Other", "",
      "Device ID           Local Intf     Hold-time  Capability      Port ID"];
    let n = 0;
    d.ifaces.forEach((p) => {
      if (!linkUp(net, d, p) || !p.peer || !p.peer.dev) return;
      const o = net.devices[p.peer.dev];
      if (o.os === "fortios") return;
      if (o.os === "ios" && !o.lldp) return;
      out.push(`${pad(o.id, 20)}${pad(p.short, 15)}${pad("120", 11)}${pad(o.os === "aruba" ? "B" : "B,R", 16)}${o.os === "aruba" ? p.peer.port : port(o, p.peer.port).short}`);
      n++;
    });
    return out.concat(["", `Total entries displayed: ${n}`]);
  }
  function stpLines(net, d, v) {
    const ports = d.ifaces.filter((p) => linkUp(net, d, p) && ((p.mode === "access" && (p.vlan === v || p.voice === v)) || p.mode === "trunk"));
    if (!d.vlans.includes(v)) return [`Spanning tree instance(s) for vlan ${v} does not exist.`];
    if (!ports.length) return [`Spanning tree instance(s) for vlan ${v} does not exist.`];
    const root = d.id === "SW-CORE-01";
    const prio = (root ? 24576 : 32768) + v;
    const out = [`VLAN${String(v).padStart(4, "0")}`, "  Spanning tree enabled protocol rstp", `  Root ID    Priority    ${24576 + v}`, "             Address     6c13.d5a2.8000"];
    if (root) out.push("             This bridge is the root"); else out.push("             Cost        2", "             Port        1025 (TenGigabitEthernet1/1/1)");
    out.push("             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec", "", `  Bridge ID  Priority    ${prio}  (priority ${root ? 24576 : 32768} sys-id-ext ${v})`,
      `             Address     ${root ? "6c13.d5a2.8000" : "a0f8.4911.2f00"}`, "             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec", "             Aging Time  300 sec", "",
      "Interface           Role Sts Cost      Prio.Nbr Type", "------------------- ---- --- --------- -------- --------------------------------");
    ports.forEach((p) => {
      const isRoot = !root && p.mode === "trunk" && p.peer && p.peer.dev === "SW-CORE-01";
      const nbr = "128." + (d.ifaces.indexOf(p) + 1);
      out.push(`${pad(p.short, 20)}${isRoot ? "Root" : "Desg"} FWD ${pad(p.name.startsWith("Ten") ? 2 : 4, 10)}${pad(nbr, 9)}P2p${p.portfast ? " Edge" : ""}`);
    });
    return out.concat([""]);
  }
  const RECOVERY = ["arp-inspection", "bpduguard", "channel-misconfig", "dhcp-rate-limit", "dtp-flap", "gbic-invalid", "inline-power", "l2ptguard", "link-flap", "loopback", "pagp-flap", "psecure-violation", "security-violation", "sfp-config-mismatch", "udld"];
  function errRecoveryLines(d) {
    const out = ["ErrDisable Reason            Timer Status", "-----------------            --------------"];
    RECOVERY.forEach((r) => out.push(`${pad(r, 29)}${(d.errRecovery || []).includes(r) ? "Enabled" : "Disabled"}`));
    out.push("", "Timer interval: 300 seconds", "", "Interfaces that will be enabled at the next timeout:", "");
    const hit = d.ifaces.filter((p) => p.err && (d.errRecovery || []).includes(p.err));
    if (hit.length) { out.push("Interface       Errdisable reason       Time left(sec)", "---------       -----------------       --------------"); hit.forEach((p) => out.push(`${pad(p.short, 16)}${pad(p.err, 24)}241`)); }
    return out;
  }
  function iosPing(net, d, target, src) {
    const ip = NAMES[String(target).toLowerCase()] || target;
    if (!isIp(ip)) return { lines: ["Translating \"" + target + "\"...domain server (10.20.1.10)", "% Unrecognized host or address, or protocol not running."], ok: false };
    let source = null;
    if (src) {
      const p = isIp(src) ? d.ifaces.find((x) => x.ip === src) : port(d, src);
      if (!p || !p.ip) return { lines: ["% Invalid source address- IP address not on any of our up interfaces"], ok: false };
      source = p.ip;
    }
    const r = reach(net, d, ip, source);
    const out = ["Type escape sequence to abort.", `Sending 5, 100-byte ICMP Echos to ${ip}, timeout is 2 seconds:`];
    if (source) out.push(`Packet sent with a source address of ${source} `);
    out.push(r.ok ? "!!!!!" : ".....", r.ok ? `Success rate is 100 percent (5/5), round-trip min/avg/max = 1/${r.hops.length > 2 ? 9 : 1}/${r.hops.length > 2 ? 12 : 2} ms` : "Success rate is 0 percent (0/5)");
    return { lines: out, ok: r.ok, ip, r };
  }
  function iosTrace(net, d, target) {
    const ip = NAMES[String(target).toLowerCase()] || target;
    if (!isIp(ip)) return ["% Unrecognized host or address, or protocol not running."];
    const r = reach(net, d, ip, null);
    const out = ["Type escape sequence to abort.", `Tracing the route to ${ip}`, "VRF info: (vrf in name/id, vrf out name/id)"];
    r.hops.forEach((h, i) => out.push(`  ${i + 1} ${h} ${1 + i} msec ${1 + i} msec ${2 + i} msec`));
    if (!r.ok) for (let i = r.hops.length; i < r.hops.length + 3; i++) out.push(`  ${i + 1}  *  *  * `);
    return out;
  }
  function iosArp(net, d, only) {
    const out = ["Protocol  Address          Age (min)  Hardware Addr   Type   Interface"];
    d.ifaces.filter((p) => p.ip && p.mode === "svi" && p.admin !== false).forEach((p) => {
      out.push(`Internet  ${pad(p.ip, 17)}      -   6c13.d5a2.80${two(d.ifaces.indexOf(p) % 100)}  ARPA   ${p.name}`);
      Object.values(net.hosts).forEach((h) => {
        if (!h.ip || !hostLive(net, h) || !inNet(h.ip, p.ip, maskBits(p.mask)) || (only && h.ip !== only)) return;
        out.push(`Internet  ${pad(h.ip, 17)}${lpad(h.kind === "server" ? 0 : 2, 7)}   ${h.mac}  ARPA   ${p.name}`);
      });
    });
    if (only) return out.filter((l, i) => i === 0 || l.includes(only + " "));
    return out;
  }
  function iosRoutes(net, d) {
    const out = ["Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP", "       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area", "       * - candidate default, U - per-user static route", "",
      `Gateway of last resort is ${d.routes[0][2]} to network 0.0.0.0`, "", `S*    0.0.0.0/0 [1/0] via ${d.routes[0][2]}`];
    d.ifaces.filter((p) => p.ip && linkUp(net, d, p)).forEach((p) => {
      const b = maskBits(p.mask);
      if (b < 32) out.push(`C        ${p.ip.split(".").slice(0, b >= 24 ? 3 : 2).join(".")}${b >= 24 ? ".0" : ".0.0"}/${b} is directly connected, ${p.name}`);
      out.push(`L        ${p.ip}/32 is directly connected, ${p.name}`);
    });
    d.routes.slice(1).forEach(([n, b, via]) => out.push(`S        ${n}/${b} ${isIp(via) ? "[1/0] via " + via : "is directly connected, " + via}`));
    return out;
  }

  const IOS_EXEC = [
    { p: "enable", user: true, run: (c) => { c.s.mode = "exec"; } },
    { p: "disable", run: (c) => { c.s.mode = "user"; } },
    { p: ["exit", "logout", "quit"], user: true, run: (c) => { c.close = true; } },
    { p: "terminal length <num>", user: true, run: () => {} },
    { p: "terminal monitor", run: () => {} },
    { p: "show version", user: true, run: (c) => c.out(iosVersion(c.d)), tag: "show version" },
    { p: "show clock", user: true, run: (c) => { const d = new Date(c.net.clock); c.out([`*${hms(c.net.clock)}.204 CET ${DAY[d.getUTCDay()]} ${MON[d.getUTCMonth()]} ${d.getUTCDate()} ${d.getUTCFullYear()}`]); } },
    { p: "show interfaces status", user: true, run: (c) => c.out(iosStatusLines(c.net, c.d, c.d.ifaces)), tag: "show interfaces status" },
    { p: "show interfaces status err-disabled", user: true, run: (c) => c.out(iosStatusLines(c.net, c.d, c.d.ifaces, true)), tag: "show interfaces status err-disabled" },
    { p: "show interfaces <if> status", user: true, run: (c, a) => c.out(iosStatusLines(c.net, c.d, [port(c.d, a[2])])), tag: (a, c) => "show interfaces status " + port(c.d, a[2]).short },
    { p: "show interfaces <if>", user: true, run: (c, a) => c.out(iosIntDetail(c.net, c.d, port(c.d, a[2]))), tag: (a, c) => "show interfaces " + port(c.d, a[2]).short },
    { p: "show interfaces <if> switchport", run: (c, a) => { const p = port(c.d, a[2]); c.out([`Name: ${p.short}`, `Switchport: ${p.mode === "routed" || p.mode === "svi" ? "Disabled" : "Enabled"}`,
      `Administrative Mode: ${p.mode === "trunk" ? "trunk" : "static access"}`, `Operational Mode: ${status(c.net, c.d, p) === "connected" ? (p.mode === "trunk" ? "trunk" : "static access") : "down"}`,
      `Access Mode VLAN: ${p.vlan || 1} (${((VLANS[p.vlan] || {}).name) || "default"})`, `Voice VLAN: ${p.voice ? p.voice + " (" + VLANS[p.voice].name + ")" : "none"}`]); }, tag: (a, c) => "show interfaces switchport " + port(c.d, a[2]).short },
    { p: "show ip interface brief", user: true, run: (c) => {
      const out = ["Interface              IP-Address      OK? Method Status                Protocol"];
      c.d.ifaces.forEach((p) => {
        const st = status(c.net, c.d, p);
        const s1 = p.admin === false ? "administratively down" : st === "connected" ? "up" : "down";
        out.push(`${pad(p.name, 22)} ${pad(p.ip || "unassigned", 15)} YES ${pad(p.ip ? "NVRAM" : "unset", 7)}${pad(s1, 22)}${s1 === "up" ? "up" : "down"}`);
      });
      c.out(out);
    }, tag: "show ip interface brief" },
    { p: "show vlan brief", user: true, run: (c) => c.out(iosVlanBrief(c.d)), tag: "show vlan brief", sw: true },
    { p: "show vlan", user: true, run: (c) => c.out(iosVlanBrief(c.d)), tag: "show vlan brief", sw: true },
    { p: "show mac address-table", user: true, run: (c) => c.out(macLines(macTable(c.net, c.d))), tag: "show mac address-table", sw: true },
    { p: "show mac address-table dynamic", user: true, run: (c) => c.out(macLines(macTable(c.net, c.d))), tag: "show mac address-table", sw: true },
    { p: "show mac address-table interface <if>", user: true, run: (c, a) => c.out(macLines(macTable(c.net, c.d).filter((e) => e.port.name === a[4]))), tag: (a, c) => "show mac address-table interface " + port(c.d, a[4]).short, sw: true },
    { p: "show mac address-table address <mac>", user: true, run: (c, a) => c.out(macLines(macTable(c.net, c.d).filter((e) => e.mac === a[4]))), tag: (a, c) => {
      const e = macTable(c.net, c.d).find((x) => x.mac === a[4]); return "show mac address-table address " + a[4] + (e ? " " + e.port.short + " " + e.vlan : " none"); }, sw: true },
    { p: "show mac address-table vlan <num>", user: true, run: (c, a) => c.out(macLines(macTable(c.net, c.d).filter((e) => e.vlan === a[4]))), tag: "show mac address-table", sw: true },
    { p: "show cdp neighbors ?detail", user: true, run: (c, a) => c.out(cdpLines(c.net, c.d, a[3] === "detail")), tag: "show cdp neighbors" },
    { p: "show lldp neighbors ?detail", user: true, run: (c) => c.out(lldpLines(c.net, c.d)), tag: "show lldp neighbors" },
    { p: "show logging", run: (c) => c.out(["Syslog logging: enabled (0 messages dropped, 0 messages rate-limited, 0 flushes, 0 overruns, xml disabled, filtering disabled)", "",
      "    Console logging: level debugging, 412 messages logged, xml disabled,", "    Monitor logging: level debugging, 0 messages logged, xml disabled,",
      "    Buffer logging:  level informational, 412 messages logged, xml disabled,", "", "Log Buffer (64000 bytes):", ""].concat(c.d.logs.map((l) => `${iosStamp(l.at)}: ${l.text}`))), tag: "show logging" },
    { p: "show spanning-tree vlan <num>", user: true, run: (c, a) => c.out(stpLines(c.net, c.d, a[3])), tag: (a) => "show spanning-tree vlan " + a[3], sw: true },
    { p: "show spanning-tree", run: (c) => { let out = []; c.d.vlans.filter((v) => v !== 1 && v !== 999).forEach((v) => { const l = stpLines(c.net, c.d, v); if (l.length > 1) out = out.concat(l); }); c.out(out); }, tag: "show spanning-tree", sw: true },
    { p: "show environment power", user: true, run: (c) => c.out(envPower(c.d)), tag: "show environment power", sw: true },
    { p: "show environment all", user: true, run: (c) => c.out(envAll(c.d)), tag: "show environment power", sw: true },
    { p: "show environment", user: true, run: (c) => c.out(envAll(c.d)), tag: "show environment power", sw: true },
    { p: "show errdisable recovery", user: true, run: (c) => c.out(errRecoveryLines(c.d)), tag: "show errdisable recovery", sw: true },
    { p: "show running-config", run: (c) => c.out(iosRunning(c.net, c.d, false)), tag: "show running-config" },
    { p: "show running-config interface <if>", run: (c, a) => { const all = iosRunning(c.net, c.d, false); const i = all.indexOf("interface " + a[3]); const j = all.indexOf("!", i);
      c.out(["Building configuration...", "", `Current configuration : ${all.slice(i, j).join("\n").length + 1} bytes`, "!"].concat(all.slice(i, j + 1)).concat(["end"])); }, tag: (a, c) => "show running-config interface " + port(c.d, a[3]).short },
    { p: "show startup-config", run: (c) => c.out(iosRunning(c.net, c.d, true).slice(2).map((l, i) => (i === 0 ? "Using 9314 out of 2097152 bytes" : l))), tag: "show startup-config" },
    { p: "show ip arp ?<ip>", run: (c, a) => c.out(iosArp(c.net, c.d, a[3])), tag: (a) => "show ip arp" + (a[3] ? " " + a[3] : ""), l3: true },
    { p: "show ip route", user: true, run: (c) => c.out(iosRoutes(c.net, c.d)), tag: "show ip route", l3: true },
    { p: "show crypto session", run: (c) => c.out(["Crypto session current status", "", "Interface: Tunnel0", "Profile: IKEV2-PROFILE-HQ", "Session status: UP-ACTIVE",
      "Peer: 203.0.113.10 port 500 ", "  Session ID: 2  ", "  IKEv2 SA: local 198.51.100.22/500 remote 203.0.113.10/500 Active ", "  IPSEC FLOW: permit ip 0.0.0.0/0.0.0.0 0.0.0.0/0.0.0.0 ",
      "        Active SAs: 2, origin: crypto map", ""]), tag: "show crypto session", router: true },
    { p: ["ping <word> source <word>", "ping <word>"], user: true, run: (c, a) => { const r = iosPing(c.net, c.d, a[1], a[3]); c.out(r.lines); c.tags.push(`ping ${r.ip || a[1]} ${r.ok ? "ok" : "fail"}${a[3] ? " source" : ""}`); } },
    { p: "traceroute <word>", user: true, run: (c, a) => c.out(iosTrace(c.net, c.d, a[1])), tag: (a) => "traceroute " + a[1] },
    { p: ["copy running-config startup-config", "write memory", "write"], run: (c) => { const ch = !saved(c.d); c.d.startup = snap(c.d); c.net.clock += 2000;
      c.out(c.pat.startsWith("copy") ? ["Destination filename [startup-config]? ", "Building configuration...", "[OK]"] : ["Building configuration...", "[OK]"]); c.tags.push(ch ? "save" : "save nochange"); } },
    { p: "configure terminal", run: (c) => { c.s.mode = "config"; c.out(["Enter configuration commands, one per line.  End with CNTL/Z."]); } },
    { p: "configure", run: (c) => { c.s.mode = "config"; c.out(["Configuring from terminal, memory, or network [terminal]? ", "Enter configuration commands, one per line.  End with CNTL/Z."]); } },
    { p: "clear counters ?<if>", run: (c, a) => { c.out([a[2] ? `Clear "show interface" counters on this interface [confirm]` : `Clear "show interface" counters on all interfaces [confirm]`]);
      (a[2] ? [port(c.d, a[2])] : c.d.ifaces).forEach((p) => { p.counters = { inErr: 0, crc: 0 }; }); }, tag: "clear counters" },
    { p: "clear mac address-table dynamic", run: () => {}, tag: "clear mac" },
    { p: "ssh -l <word> <word>", user: true, run: (c, a) => { c.ssh = { user: a[2], host: a[3] }; } },
    { p: "reload", run: (c) => c.err([saved(c.d) ? "Proceed with reload? [confirm]" : "System configuration has been modified. Save? [yes/no]: ", "(Reload cancelled: rebooting a production switch is out of scope here.)"]) },
  ];
  const IOS_CONFIG = [
    { p: "interface <if>", run: (c, a) => { c.s.mode = "if"; c.s.iface = a[1]; } },
    { p: "vlan <num>", run: (c, a) => { if (!c.d.vlans.includes(a[1])) { c.d.vlans.push(a[1]); c.d.vlans.sort((x, y) => x - y); } c.s.mode = "vlan"; c.s.vlan = a[1]; }, sw: true },
    { p: "errdisable recovery cause <word>", run: (c, a) => { if (!RECOVERY.includes(a[3])) return c.invalid(3); if (!c.d.errRecovery.includes(a[3])) c.d.errRecovery.push(a[3]); c.tags.push("errdisable recovery " + a[3]); }, sw: true },
    { p: "no errdisable recovery cause <word>", run: (c, a) => { c.d.errRecovery = c.d.errRecovery.filter((x) => x !== a[4]); c.tags.push("no errdisable recovery " + a[4]); }, sw: true },
    { p: ["end", "exit"], run: (c) => { c.s.mode = "exec"; } },
  ];
  const IOS_IF = [
    { p: "description <line>", run: (c, a) => { c.p.desc = a[1].slice(0, 200); c.tags.push("description " + c.p.short); } },
    { p: "no description", run: (c) => { c.p.desc = ""; } },
    { p: "shutdown", run: (c) => { const was = linkUp(c.net, c.d, c.p); c.p.admin = false; c.p.err = null; linkEvents(c.net, c.d, c.p, was, c.tags); c.tags.push("shutdown " + c.p.short); } },
    { p: "no shutdown", run: (c) => { const was = linkUp(c.net, c.d, c.p); const wasErr = Boolean(c.p.err); c.p.admin = true; if (!wasErr) linkEvents(c.net, c.d, c.p, was, c.tags); c.tags.push("no shutdown " + c.p.short); } },
    { p: "switchport access vlan <num>", run: (c, a) => {
      if (c.p.mode === "routed" || c.p.mode === "svi") return c.invalid(0);
      if (a[3] < 1 || a[3] > 4094) return c.invalid(3);
      if (!c.d.vlans.includes(a[3])) { c.out(`% Access VLAN does not exist. Creating vlan ${a[3]}`.split("\n")); c.d.vlans.push(a[3]); c.d.vlans.sort((x, y) => x - y); }
      c.p.vlan = a[3]; c.tags.push(`access vlan ${c.p.short} ${a[3]}`); }, sw: true },
    { p: "switchport mode access", run: (c) => { c.p.mode = "access"; }, sw: true },
    { p: "switchport mode trunk", run: (c) => { c.p.mode = "trunk"; c.tags.push("trunk " + c.p.short); }, sw: true },
    { p: "switchport voice vlan <num>", run: (c, a) => { c.p.voice = a[3]; }, sw: true },
    { p: "no switchport voice vlan", run: (c) => { c.p.voice = null; }, sw: true },
    { p: "spanning-tree bpduguard enable|disable", run: (c, a) => { c.p.bpduguard = a[2] === "enable" ? true : "disable"; c.tags.push(`bpduguard ${c.p.short} ${a[2] === "enable" ? "on" : "off"}`); }, sw: true },
    { p: "no spanning-tree bpduguard", run: (c) => { c.p.bpduguard = false; c.tags.push(`bpduguard ${c.p.short} off`); }, sw: true },
    { p: "spanning-tree portfast", run: (c) => { c.p.portfast = true; }, sw: true },
    { p: "no spanning-tree portfast", run: (c) => { c.p.portfast = false; }, sw: true },
    { p: "interface <if>", run: (c, a) => { c.s.iface = a[1]; } },
    { p: "end", run: (c) => { c.s.mode = "exec"; c.s.iface = null; } },
    { p: "exit", run: (c) => { c.s.mode = "config"; c.s.iface = null; } },
  ];
  const IOS_VLAN = [
    { p: "name <word>", run: (c, a) => { c.d.vlanNames = Object.assign({}, c.d.vlanNames, { [c.s.vlan]: a[1] }); } },
    { p: "end", run: (c) => { c.s.mode = "exec"; } },
    { p: "exit", run: (c) => { c.s.mode = "config"; } },
  ];
  function iosCommands(s, d, list) {
    return list.filter((x) => (s.mode !== "user" || x.user) && (!x.sw || d.kind === "switch") && (!x.l3 || d.l3 || d.kind === "router") && (!x.router || d.kind === "router"));
  }
  function iosExec(c, line, prompt) {
    const s = c.s, d = c.d;
    const [cmdPart, ...pipes] = line.split(" | ");
    let text = cmdPart;
    let list;
    if (s.mode === "user" || s.mode === "exec") list = iosCommands(s, d, IOS_EXEC);
    else {
      if (/^do\s+/i.test(text)) { text = text.replace(/^do\s+/i, ""); prompt += "do "; list = iosCommands({ mode: "exec" }, d, IOS_EXEC); c.doing = true; }
      else list = s.mode === "config" ? iosCommands(s, d, IOS_CONFIG) : s.mode === "if" ? iosCommands(s, d, IOS_IF) : IOS_VLAN;
    }
    const toks = tokenize(text);
    if (text.trim() === "?" || /\s\?$/.test(text)) return iosHelp(c, list, toks);
    const m = match(list, toks, d);
    if (m.error === "ambiguous") return c.err([`% Ambiguous command:  "${line}"`]);
    if (m.error === "incomplete") return c.err(["% Incomplete command.", ""]);
    if (m.error) return c.invalid(m.at, toks, prompt);
    c.pat = m.pat;
    c.toks = toks;
    c.prompt = prompt;
    if (s.mode === "if") c.p = port(d, s.iface);
    const before = c.lines.length;
    m.cmd.run(c, m.args);
    if (m.cmd.tag) c.tags.push(typeof m.cmd.tag === "function" ? m.cmd.tag(m.args, c) : m.cmd.tag);
    if (pipes.length && c.lines.length > before) {
      const body = c.lines.splice(before).map((l) => l.text);
      const f = pipe(body, pipes.join(" | "));
      if (f === null) return c.invalid(0, tokenize("| " + pipes.join(" | ")), prompt + cmdPart + " ");
      c.out(f);
    }
  }
  function iosHelp(c, list, toks) {
    const words = toks.filter((x) => x.s !== "?").map((x) => x.s.toLowerCase());
    const next = new Set();
    list.forEach((cmd) => [].concat(cmd.p).forEach((p) => {
      const parts = p.split(" ");
      for (let i = 0; i < words.length; i++) if (!parts[i] || (!parts[i].startsWith("<") && !parts[i].replace("?", "").split("|").some((w) => w.startsWith(words[i])))) return;
      const n = parts[words.length];
      if (n) n.replace("?", "").split("|").forEach((w) => next.add(w.startsWith("<") ? (w === "<if>" ? "<interface>" : w === "<num>" ? "<1-4094>" : w === "<mac>" ? "H.H.H" : w === "<line>" ? "LINE" : "WORD") : w));
      else next.add("<cr>");
    }));
    c.out(Array.from(next).sort().map((w) => "  " + w));
  }

  /* ---------- ArubaOS-Switch (HP) */
  function hpPrompt(s, d) {
    const h = prv(d);
    if (s.mode === "config") return h + "(config)# ";
    if (s.mode === "vlan") return h + `(vlan-${s.vlan})# `;
    if (s.mode === "eth") return h + `(eth-${s.ports.join(",")})# `;
    return h + "# ";
  }
  const hpVlanName = (d, v) => (d.vlanNames || {})[v] || (v === 1 ? "DEFAULT_VLAN" : (VLANS[v] || {}).name || "VLAN" + v);
  function hpTagged(p) { return p.mode === "trunk" ? p.tagged || [] : p.voice ? [p.voice] : []; }
  function hpBrief(net, d, list) {
    const out = [" Status and Counters - Port Status", "", "                          | Intrusion                           MDI  Flow  Bcast",
      "  Port         Type       | Alert     Enabled Status Mode       Mode Ctrl  Limit", "  ------------ ---------- + --------- ------- ------ ---------- ---- ----- ------"];
    list.forEach((p) => { const up = linkUp(net, d, p); out.push(`  ${pad(p.name, 13)}${pad(p.type, 11)}| No        ${pad(p.admin === false ? "No" : "Yes", 8)}${pad(up ? "Up" : "Down", 7)}${pad(up ? p.speed : "1000FDx", 11)}${pad(up ? "MDIX" : "Auto", 5)}off   0`); });
    return out;
  }
  function hpIfDetail(net, d, p) {
    const up = linkUp(net, d, p);
    return [" Status and Counters - Port Counters for port " + p.name, "", `  Name  : ${p.desc}`, `  MAC Address      : 9c8c${"d8"}-${(0x11a000 + Number(p.name)).toString(16)}`,
      `  Link Status      : ${up ? "Up" : "Down"}`, `  Port Enabled     : ${p.admin === false ? "No" : "Yes"}`, `  Totals (Since boot or last clear) :`, `   Bytes Rx        : ${up ? "1,982,331,004" : "0"}       Bytes Tx        : ${up ? "4,410,882,117" : "0"}`,
      `   Unicast Rx      : ${up ? "2,118,402" : "0"}            Unicast Tx      : ${up ? "3,902,117" : "0"}`, `  Errors (Since boot or last clear) :`,
      `   FCS Rx          : ${pad(p.counters.crc, 17)}Drops Tx        : 0`, `   Alignment Rx    : 0                Collisions Tx   : 0`, `   Runts Rx        : 0                Late Colln Tx   : 0`,
      `   Giants Rx       : 0                Excessive Colln : 0`, ""];
  }
  function hpVlans(d) {
    const out = [" Status and Counters - VLAN Information", "", "  Maximum VLANs to support : 256", "  Primary VLAN : DEFAULT_VLAN", "  Management VLAN :", "",
      "  VLAN ID Name                             | Status     Voice Jumbo", "  ------- -------------------------------- + ---------- ----- -----"];
    d.vlans.forEach((v) => out.push(`  ${pad(v, 8)}${pad(hpVlanName(d, v), 33)}| Port-based ${pad(v === 150 ? "Yes" : "No", 6)}No`));
    return out;
  }
  function hpVlanDetail(net, d, v) {
    if (!d.vlans.includes(v)) return null;
    const out = [` Status and Counters - VLAN Information - VLAN ${v}`, "", `  VLAN ID : ${v}`, `  Name : ${hpVlanName(d, v)}`, "  Status : Port-based", `  Voice : ${v === 150 ? "Yes" : "No"}`, "  Jumbo : No", "",
      "  Port Information Mode     Unknown VLAN Status", "  ---------------- -------- ------------ ----------"];
    d.ifaces.forEach((p) => {
      const mode = p.vlan === v ? "Untagged" : hpTagged(p).includes(v) ? "Tagged" : null;
      if (mode) out.push(`  ${pad(p.name, 17)}${pad(mode, 9)}Learn        ${linkUp(net, d, p) ? "Up" : "Down"}`);
    });
    return out;
  }
  function hpRunning(net, d, startup) {
    const ifaces = startup ? JSON.parse(d.startup).i.map((v, i) => Object.assign({}, d.ifaces[i], Object.fromEntries(CONFIG_KEYS.map((k, j) => [k, v[j]])))) : d.ifaces;
    const out = [startup ? "Startup configuration: 14" : "Running configuration:", "", `; JL261A Configuration Editor; Created on release #${d.version}`, "; Ver #14:01.4f.f8.1d.9b.3f.bf.bb.ef.7c.59.fc.6b.fb.9f.fc.ff.ff.37.ef:05", "",
      `hostname "${prv(d)}"`, "module 1 type jl261a", "timesync sntp", "sntp unicast", "sntp server priority 1 10.20.1.10", "time daylight-time-rule western-europe", "time timezone 60",
      "ip default-gateway 10.20.99.1", "ip dns server-address priority 1 10.20.1.10", "tacacs-server host 10.20.1.12", "aaa authentication ssh login tacacs local", "ip ssh", "no telnet-server", "lldp run"];
    ifaces.forEach((p) => { if (p.desc || p.admin === false) { out.push(`interface ${p.name}`); if (p.admin === false) out.push("   disable"); if (p.desc) out.push(`   name "${p.desc}"`); out.push("   exit"); } });
    d.vlans.forEach((v) => {
      const un = ifaces.filter((p) => p.vlan === v).map((p) => p.name);
      const tg = ifaces.filter((p) => hpTagged(p).includes(v)).map((p) => p.name);
      out.push(`vlan ${v}`, `   name "${hpVlanName(d, v)}"`);
      if (un.length) out.push(`   untagged ${ranges(un)}`);
      if (tg.length) out.push(`   tagged ${ranges(tg)}`);
      if (v === 1) out.push(`   no untagged ${ranges(ifaces.filter((p) => p.vlan !== 1).map((p) => p.name))}`);
      if (v === 99) out.push(`   ip address ${d.mgmt} 255.255.255.0`); else out.push("   no ip address");
      if (v === 150) out.push("   voice");
      out.push("   exit");
    });
    out.push("spanning-tree", "spanning-tree 1-24 admin-edge-port", "spanning-tree 1-24 bpdu-protection", "no tftp server", "password manager", "");
    return out;
  }
  function hpMacLines(net, d, filt) {
    const rows = macTable(net, d);
    if (filt && filt.mac) {
      const e = rows.filter((x) => x.mac === filt.mac);
      return [` Status and Counters - Address Table - ${hpMac(filt.mac)}`, "", "  Port   VLAN", "  ------ ----"].concat(e.map((x) => `  ${pad(x.port.name, 7)}${x.vlan}`));
    }
    if (filt && filt.port) {
      const e = rows.filter((x) => x.port.name === filt.port);
      return [` Status and Counters - Port Address Table - ${filt.port}`, "", "  MAC Address   VLANs", "  ------------- ------"].concat(e.map((x) => `  ${hpMac(x.mac)} ${x.vlan}`));
    }
    const e = filt && filt.vlan ? rows.filter((x) => x.vlan === filt.vlan) : rows;
    return [" Status and Counters - Port Address Table", "", "  MAC Address   Port  VLAN", "  ------------- ----- ----"].concat(e.map((x) => `  ${hpMac(x.mac)} ${pad(x.port.name, 6)}${x.vlan}`));
  }
  function hpLldp(net, d, only) {
    const out = [" LLDP Remote Devices Information", "", "  LocalPort | ChassisId                 PortId          PortDescr SysName", "  --------- + ------------------------- --------------- --------- ----------"];
    d.ifaces.forEach((p) => {
      if (!linkUp(net, d, p) || !p.peer || (only && p.name !== only)) return;
      if (p.peer.dev) { const o = net.devices[p.peer.dev]; out.push(`  ${pad(p.name, 10)}| ${pad("6c 13 d5 a2 80 00", 26)}${pad(port(o, p.peer.port).short, 16)}${pad(port(o, p.peer.port).short, 10)}${o.id}`); }
      else attachedHosts(net, p).filter((h) => h.cdp).forEach((h) => out.push(`  ${pad(p.name, 10)}| ${pad(h.mac.replace(/\./g, "").replace(/(..)(?=.)/g, "$1 "), 26)}${pad(h.mac.replace(/\./g, "").replace(/^(.{6})/, "$1-"), 16)}${pad("Port 1", 10)}${h.id}`));
    });
    return out;
  }
  function hpLogs(d, newest) {
    const list = d.logs.map((l) => `${l.sev || "I"} ${hpStamp(l.at)} ${l.code || "00076"} ${l.text}`);
    return [" Keys:   W=Warning   I=Information", "         M=Major     D=Debug E=Error", "----  Event Log listing: Events Since Boot  ----"].concat(newest ? list.reverse() : list);
  }
  function hpPing(net, d, target) {
    const ip = NAMES[String(target).toLowerCase()] || target;
    if (!isIp(ip)) return { lines: ["Unknown host " + target + "."], ok: false };
    const r = reach(net, d, ip, null);
    return { lines: [r.ok ? `${ip} is alive, time = 1 ms` : "Request timed out."], ok: r.ok, ip };
  }
  const HP_SHOW = [
    { p: "show interfaces brief", run: (c) => c.out(hpBrief(c.net, c.d, c.d.ifaces)), tag: "show interfaces brief" },
    { p: "show interfaces", run: (c) => c.out(hpBrief(c.net, c.d, c.d.ifaces)), tag: "show interfaces brief" },
    { p: "show interfaces brief <word>", run: (c, a) => { const ps = portList(a[3]); if (!ps || !ps.every((x) => port(c.d, x))) return c.invalid(3); c.out(hpBrief(c.net, c.d, ps.map((x) => port(c.d, x)))); }, tag: (a) => "show interfaces brief " + a[3] },
    { p: "show interfaces <word>", run: (c, a) => { const p = port(c.d, a[2]); if (!p) return c.invalid(2); c.out(hpIfDetail(c.net, c.d, p)); }, tag: (a) => "show interfaces " + a[2] },
    { p: "show vlans", run: (c) => c.out(hpVlans(c.d)), tag: "show vlans" },
    { p: "show vlans <num>", run: (c, a) => { const l = hpVlanDetail(c.net, c.d, a[2]); if (!l) return c.err([`VLAN ${a[2]} not found.`]); c.out(l); }, tag: (a) => "show vlans " + a[2] },
    { p: "show vlans ports <word> ?detail", run: (c, a) => {
      const ps = portList(a[3]); if (!ps || !ps.every((x) => port(c.d, x))) return c.invalid(3);
      const out = [` Status and Counters - VLAN Information - for ports ${a[3]}`, "", "  VLAN ID Name                             | Status     Voice Jumbo Mode    ", "  ------- -------------------------------- + ---------- ----- ----- --------"];
      const vs = new Set(); ps.forEach((x) => { const p = port(c.d, x); vs.add(p.vlan); hpTagged(p).forEach((v) => vs.add(v)); });
      Array.from(vs).sort((x, y) => x - y).forEach((v) => out.push(`  ${pad(v, 8)}${pad(hpVlanName(c.d, v), 33)}| Port-based ${pad(v === 150 ? "Yes" : "No", 6)}${pad("No", 6)}${ps.some((x) => port(c.d, x).vlan === v) ? "Untagged" : "Tagged"}`));
      c.out(out); }, tag: (a) => "show vlans ports " + a[3] },
    { p: "show mac-address", run: (c) => c.out(hpMacLines(c.net, c.d)), tag: "show mac-address" },
    { p: "show mac-address vlan <num>", run: (c, a) => c.out(hpMacLines(c.net, c.d, { vlan: a[3] })), tag: "show mac-address" },
    { p: "show mac-address <word>", run: (c, a) => {
      const mac = parseMac(a[2]);
      if (mac) { c.out(hpMacLines(c.net, c.d, { mac })); const e = macTable(c.net, c.d).find((x) => x.mac === mac); c.tags.push(`show mac-address ${mac}${e ? " " + e.port.name + " " + e.vlan : " none"}`); return; }
      if (port(c.d, a[2])) { c.out(hpMacLines(c.net, c.d, { port: a[2] })); c.tags.push("show mac-address port " + a[2]); return; }
      c.invalid(2); } },
    { p: "show lldp info remote-device ?<word>", run: (c, a) => c.out(hpLldp(c.net, c.d, a[4])), tag: "show lldp" },
    { p: "show cdp neighbors", run: (c) => { const rows = c.d.ifaces.filter((p) => linkUp(c.net, c.d, p) && p.peer && p.peer.dev && c.net.devices[p.peer.dev].os === "ios");
      c.out([" CDP neighbors information", "", "  Port Device ID                 | Platform                     Capability", "  ---- ------------------------- + ---------------------------- -----------"]
        .concat(rows.map((p) => `  ${pad(p.name, 5)}${pad(p.peer.dev + ".contoso.local", 26)}| ${pad("cisco " + c.net.devices[p.peer.dev].platform, 29)}R S I`))); }, tag: "show cdp neighbors" },
    { p: "show running-config", run: (c) => c.out(hpRunning(c.net, c.d, false)), tag: "show running-config" },
    { p: "show config", run: (c) => c.out(hpRunning(c.net, c.d, true)), tag: "show config" },
    { p: "show logging ?-r", run: (c, a) => c.out(hpLogs(c.d, a[2] === "-r")), tag: "show logging" },
    { p: ["show system", "show version"], run: (c) => c.out([" Status and Counters - General System Information", "", `  System Name        : ${prv(c.d)}`, "  System Contact     : IT infrastructure",
      "  System Location    : HQ 1st floor cabinet F1-A", "", `  MAC Age Time (sec) : 300`, "", `  Time Zone          : 60`, `  Daylight Time Rule : Western-Europe`, "",
      `  Software revision  : ${c.d.version}        Base MAC Addr      : 9c8cd8-11a000`, `  ROM Version        : WC.17.02.0006          Serial Number      : ${c.d.serial}`, "",
      `  Up Time            : ${Math.floor(c.d.uptime / 86400)} days                Memory   - Total   : 330,301,440`, `  CPU Util (%)       : ${c.d.health.cpu}                       Free    : 207,284,224`]), tag: "show system" },
    { p: "show ip", run: (c) => c.out(["", " Internet (IP) Service", "", "  IP Routing : Disabled", "", "  Default Gateway : 10.20.99.1", "  Default TTL     : 64", "  Arp Age         : 20", "",
      "  VLAN         | IP Config  IP Address      Subnet Mask     Proxy ARP", "  ------------ + ---------- --------------- --------------- ---------", `  MGMT         | Manual     ${pad(c.d.mgmt, 16)}255.255.255.0   No`]), tag: "show ip" },
    { p: "ping <word>", run: (c, a) => { const r = hpPing(c.net, c.d, a[1]); c.out(r.lines); c.tags.push(`ping ${r.ip || a[1]} ${r.ok ? "ok" : "fail"}`); } },
    { p: "traceroute <word>", run: (c, a) => { const ip = NAMES[a[1].toLowerCase()] || a[1]; const r = reach(c.net, c.d, ip, null);
      c.out([` traceroute to ${ip} `, "      1st Hop: 1,  Max Hops: 30", "      Probes: 3,  Timeout: 3 sec", ""].concat(r.hops.map((h, i) => `  ${i + 1} ${pad(h, 16)} 0 ms     0 ms     1 ms`))); } },
    { p: "write memory", run: (c) => { const ch = !saved(c.d); c.d.startup = snap(c.d); c.tags.push(ch ? "save" : "save nochange"); } },
  ];
  function hpSetUntagged(c, v, ports, on) {
    ports.forEach((x) => {
      const p = port(c.d, x);
      if (on) { p.vlan = v; if (p.voice === v) p.voice = null; }
      else if (p.vlan === v) p.vlan = 1;
      c.tags.push(`untagged ${x} ${on ? v : 1}`);
    });
  }
  function hpEnsureVlan(c, v) { if (!c.d.vlans.includes(v)) { c.d.vlans.push(v); c.d.vlans.sort((a, b) => a - b); } }
  function hpPorts(c, s, at) { const ps = portList(s); if (!ps || !ps.every((x) => port(c.d, x))) { c.invalid(at); return null; } return ps; }
  function hpAdmin(c, ports, on) {
    ports.forEach((x) => { const p = port(c.d, x); const was = linkUp(c.net, c.d, p); p.admin = on; linkEvents(c.net, c.d, p, was, c.tags); c.tags.push(`${on ? "enable" : "disable"} ${x}`); });
  }
  const HP_EXEC = HP_SHOW.concat([
    { p: "configure ?terminal", run: (c) => { c.s.mode = "config"; } },
    { p: "enable", run: () => {} },
    { p: ["exit", "logout"], run: (c) => { if (!saved(c.d)) c.warnUnsaved = true; c.close = true; } },
    { p: "end", run: () => {} },
  ]);
  const HP_CONFIG = HP_SHOW.concat([
    { p: "vlan <num>", run: (c, a) => { hpEnsureVlan(c, a[1]); c.s.mode = "vlan"; c.s.vlan = a[1]; } },
    { p: "vlan <num> untagged <word>", run: (c, a) => { const ps = hpPorts(c, a[3], 3); if (!ps) return; hpEnsureVlan(c, a[1]); hpSetUntagged(c, a[1], ps, true); } },
    { p: "vlan <num> tagged <word>", run: (c, a) => { const ps = hpPorts(c, a[3], 3); if (!ps) return; hpEnsureVlan(c, a[1]); ps.forEach((x) => { const p = port(c.d, x); if (p.mode === "trunk") p.tagged = Array.from(new Set((p.tagged || []).concat(a[1]))); else p.voice = a[1]; }); } },
    { p: "vlan <num> name <word>", run: (c, a) => { hpEnsureVlan(c, a[1]); c.d.vlanNames = Object.assign({}, c.d.vlanNames, { [a[1]]: a[3] }); } },
    { p: "no vlan <num> untagged <word>", run: (c, a) => { const ps = hpPorts(c, a[4], 4); if (ps) hpSetUntagged(c, a[2], ps, false); } },
    { p: "interface <word>", run: (c, a) => { const ps = hpPorts(c, a[1], 1); if (!ps) return; c.s.mode = "eth"; c.s.ports = ps; } },
    { p: "interface <word> disable|enable", run: (c, a) => { const ps = hpPorts(c, a[1], 1); if (ps) hpAdmin(c, ps, a[2] === "enable"); } },
    { p: "interface <word> name <line>", run: (c, a) => { const ps = hpPorts(c, a[1], 1); if (ps) ps.forEach((x) => { port(c.d, x).desc = a[3]; }); } },
    { p: ["exit", "end"], run: (c) => { c.s.mode = "exec"; } },
  ]);
  const HP_VLAN = HP_SHOW.concat([
    { p: "untagged <word>", run: (c, a) => { const ps = hpPorts(c, a[1], 1); if (ps) hpSetUntagged(c, c.s.vlan, ps, true); } },
    { p: "no untagged <word>", run: (c, a) => { const ps = hpPorts(c, a[2], 2); if (ps) hpSetUntagged(c, c.s.vlan, ps, false); } },
    { p: "tagged <word>", run: (c, a) => { const ps = hpPorts(c, a[1], 1); if (ps) ps.forEach((x) => { const p = port(c.d, x); if (p.mode === "trunk") p.tagged = Array.from(new Set((p.tagged || []).concat(c.s.vlan))); else p.voice = c.s.vlan; }); } },
    { p: "name <line>", run: (c, a) => { c.d.vlanNames = Object.assign({}, c.d.vlanNames, { [c.s.vlan]: a[1] }); } },
    { p: "exit", run: (c) => { c.s.mode = "config"; } },
    { p: "end", run: (c) => { c.s.mode = "exec"; } },
  ]);
  const HP_ETH = HP_SHOW.concat([
    { p: "disable", run: (c) => hpAdmin(c, c.s.ports, false) },
    { p: "enable", run: (c) => hpAdmin(c, c.s.ports, true) },
    { p: "name <line>", run: (c, a) => c.s.ports.forEach((x) => { port(c.d, x).desc = a[1]; }) },
    { p: "no name", run: (c) => c.s.ports.forEach((x) => { port(c.d, x).desc = ""; }) },
    { p: "exit", run: (c) => { c.s.mode = "config"; } },
    { p: "end", run: (c) => { c.s.mode = "exec"; } },
  ]);
  function hpExec(c, line) {
    const list = { exec: HP_EXEC, config: HP_CONFIG, vlan: HP_VLAN, eth: HP_ETH }[c.s.mode] || HP_EXEC;
    const toks = tokenize(line);
    const m = match(list, toks, null);
    if (m.error === "incomplete") return c.err([`Incomplete input: ${toks.length ? toks[toks.length - 1].s : ""}`]);
    if (m.error === "ambiguous") return c.err([`Ambiguous input: ${toks.length ? toks[toks.length - 1].s : ""}`], true);
    if (m.error) return c.err([`Invalid input: ${(toks[m.at] || toks[toks.length - 1] || { s: line }).s}`], true);
    c.pat = m.pat;
    m.cmd.run(c, m.args);
    if (m.cmd.tag) c.tags.push(typeof m.cmd.tag === "function" ? m.cmd.tag(m.args, c) : m.cmd.tag);
  }

  /* ---------- FortiOS (FortiGate) */
  const FW_TABLES = { "firewall policy": "policy", "firewall address": "address", "firewall addrgrp": "addrgrp" };
  function fwPrompt(s, d) {
    const h = prv(d);
    if (s.edit != null) return `${h} (${s.edit}) # `;
    if (s.table) return `${h} (${s.table}) # `;
    return `${h} # `;
  }
  const q = (v) => `"${v}"`;
  function fwShowEntry(table, e) {
    const out = [`    edit ${table === "policy" ? e.id : q(e.name)}`];
    if (table === "policy") {
      if (e.name) out.push(`        set name ${q(e.name)}`);
      if (e.status === "disable") out.push("        set status disable");
      ["srcintf", "dstintf"].forEach((k) => { if (e[k] && e[k].length) out.push(`        set ${k} ${e[k].map(q).join(" ")}`); });
      if (e.action === "accept") out.push("        set action accept");
      ["srcaddr", "dstaddr"].forEach((k) => { if (e[k] && e[k].length) out.push(`        set ${k} ${e[k].map(q).join(" ")}`); });
      out.push(`        set schedule ${q(e.schedule || "always")}`);
      if (e.service && e.service.length) out.push(`        set service ${e.service.map(q).join(" ")}`);
      if (e.logtraffic === "all") out.push("        set logtraffic all");
      if (e.nat) out.push("        set nat enable");
      if (e.comments) out.push(`        set comments ${q(e.comments)}`);
    } else if (table === "address") {
      if (e.comment) out.push(`        set comment ${q(e.comment)}`);
      if (e.name !== "all") out.push(`        set subnet ${e.subnet}`);
    } else {
      out.push(`        set member ${e.member.map(q).join(" ")}`);
      if (e.comment) out.push(`        set comment ${q(e.comment)}`);
    }
    out.push("    next");
    return out;
  }
  function fwShow(d, table, id) {
    const list = fwList(d, table);
    const key = table === "policy" ? "id" : "name";
    const items = id == null ? list : list.filter((e) => String(e[key]) === String(id));
    const head = { policy: "config firewall policy", address: "config firewall address", addrgrp: "config firewall addrgrp" }[table];
    return [head].concat(...items.map((e) => fwShowEntry(table, e))).concat(["end"]);
  }
  const fwList = (d, table) => (table === "policy" ? d.fw.policies : table === "address" ? d.fw.addresses : d.fw.addrgrps);
  const FW_FAIL = (code) => [`Command fail. Return code ${code}`];
  // the traffic the branch keeps sending while the user retries (scenario: net.flow); default: a Valencia PC to the ERP over HTTPS
  function sampleFlow(net) { return net.flow || { srcintf: "to-VLC", dstintf: "port1", src: "10.40.10.23", sport: 52114, dst: "10.20.1.52", proto: "tcp", port: 443 }; }
  function flowMatchesFilter(dbg, f) {
    return (!dbg.addr || dbg.addr === f.src || dbg.addr === f.dst) && (!dbg.dport || dbg.dport === f.port);
  }
  function debugFlow(c) {
    const dbg = c.d.dbg;
    if (!dbg.enabled || !dbg.trace) return;
    const f = sampleFlow(c.net);
    if (!flowMatchesFilter(dbg, f)) { c.tags.push("debug flow nomatch"); return; }
    const r = fwEval(c.d, f);
    const target = whoHas(c.net, f.dst);
    const lines = [];
    const n = Math.min(dbg.trace, 2);
    for (let i = 1; i <= n; i++) {
      const id = `id=65308 trace_id=${dbg.next + i - 1}`;
      lines.push(`${id} func=print_pkt_detail line=5939 msg="vd-root:0 received a packet(proto=6, ${f.src}:${f.sport + i - 1}->${f.dst}:${f.port}) tun_id=198.51.100.22 from ${f.srcintf}. flag [S], seq ${3211450981 + i * 7}, ack 0, win 64240"`,
        `${id} func=init_ip_session_common line=6120 msg="allocate a new session-00${(0x12ab3f + i).toString(16)}"`,
        `${id} func=vf_ip_route_input_common line=2612 msg="find a route: flag=04000000 gw-10.20.255.1 via port1"`);
      if (r.action === "accept") lines.push(`${id} func=fw_forward_handler line=1170 msg="Allowed by Policy-${r.policy}:"`);
      else lines.push(`${id} func=fw_forward_handler line=989 msg="Denied by forward policy check (policy ${r.policy})"`);
    }
    dbg.next += n;
    dbg.trace -= n;
    c.out(lines);
    c.tags.push(`debug flow ${r.action === "accept" ? "allowed" : "denied"} ${r.policy}${target ? "" : " nohost"}`);
  }
  function fwSniffer(c, intf, filter, verb, count) {
    const f = sampleFlow(c.net);
    const fl = String(filter || "");
    const hostM = /host\s+(\S+)/.exec(fl), portM = /port\s+(\d+)/.exec(fl);
    const out = ["Using Original Sniffing Mode", `interfaces=[${intf}]`, `filters=[${fl}]`];
    const hit = (!hostM || hostM[1] === f.src || hostM[1] === f.dst) && (!portM || Number(portM[1]) === f.port);
    const r = fwEval(c.d, f);
    const max = Math.min(Number(count) || 4, 8);
    const pk = [];
    if (hit) {
      let tm = 1.204310;
      for (let i = 0; pk.length < max && i < 4; i++) {
        pk.push(`${tm.toFixed(6)} ${f.srcintf} in ${f.src}.${f.sport} -> ${f.dst}.${f.port}: syn ${3211450981 + i}`);
        if (r.action === "accept" && (intf === "any" || intf === "port1") && pk.length < max) {
          pk.push(`${(tm + 0.00008).toFixed(6)} port1 out ${f.src}.${f.sport} -> ${f.dst}.${f.port}: syn ${3211450981 + i}`);
          if (pk.length < max) pk.push(`${(tm + 0.0007).toFixed(6)} port1 in ${f.dst}.${f.port} -> ${f.src}.${f.sport}: syn 1987214 ack ${3211450982 + i}`);
          if (pk.length < max) pk.push(`${(tm + 0.00076).toFixed(6)} ${f.srcintf} out ${f.dst}.${f.port} -> ${f.src}.${f.sport}: syn 1987214 ack ${3211450982 + i}`);
          break;
        }
        tm += 1.0 * (i + 1);
      }
    }
    c.out(out.concat(pk).concat(["", `${pk.length} packets received by filter`, "0 packets dropped by kernel"]));
    c.tags.push(`sniffer ${hit ? (r.action === "accept" ? "allowed" : "denied") : "nomatch"}`);
  }
  function fwStatus(c) {
    const d = c.d;
    const dt = new Date(c.net.clock);
    c.out([`Version: FortiGate-100F ${d.version}`, "Security Level: 1", "Firmware Signature: certified", "Virus-DB: 92.08441(2026-10-30 07:24)", "IPS-DB: 28.00921(2026-10-29 22:16)",
      `Serial-Number: ${d.serial}`, "BIOS version: 05000016", "System Part-Number: P23926-05", "Log hard disk: Not available", `Hostname: ${prv(d)}`, "Private Encryption: Disable",
      "Operation Mode: NAT", "Current virtual domain: root", "Max number of virtual domains: 10", "Virtual domains status: 1 in NAT mode, 0 in TP mode", "Virtual domain configuration: disable",
      "FIPS-CC mode: disable", "Current HA mode: standalone", "Branch point: 2662", "Release Version Information: GA",
      `System time: ${DAY[dt.getUTCDay()]} ${MON[dt.getUTCMonth()]} ${dt.getUTCDate()} ${hms(c.net.clock)} ${dt.getUTCFullYear()}`, "Last reboot reason: warm reboot"]);
  }
  const FW_TOP = [
    { p: "get system status", run: fwStatus, tag: "get system status" },
    { p: "get router info routing-table all", run: (c) => c.out(["Codes: K - kernel, C - connected, S - static, R - RIP, B - BGP", "       O - OSPF, IA - OSPF inter area", "       N1 - OSPF NSSA external type 1, N2 - OSPF NSSA external type 2",
      "       E1 - OSPF external type 1, E2 - OSPF external type 2", "       i - IS-IS, L1 - IS-IS level-1, L2 - IS-IS level-2, ia - IS-IS inter area", "       V - BGP VPNv4", "       * - candidate default", "",
      "Routing table for VRF=0", "S*      0.0.0.0/0 [10/0] via 203.0.113.9, wan1, [1/0]", "S       10.20.0.0/16 [10/0] via 10.20.255.1, port1, [1/0]", "C       10.20.99.0/24 is directly connected, mgmt",
      "C       10.20.255.0/30 is directly connected, port1", "S       10.40.0.0/16 [10/0] via to-VLC tunnel 198.51.100.22, [1/0]", "C       169.254.10.0/30 is directly connected, to-VLC",
      "C       203.0.113.8/29 is directly connected, wan1"]), tag: "routing table" },
    { p: "get vpn ipsec tunnel summary", run: (c) => c.out(["'to-VLC' 198.51.100.22:0  selectors(total,up): 1/1  rx(pkt,err): 184520/0  tx(pkt,err): 179204/0"]), tag: "tunnel summary" },
    { p: "show firewall policy ?<num>", run: (c, a) => c.out(fwShow(c.d, "policy", a[3])), tag: (a) => "show firewall policy" + (a[3] != null ? " " + a[3] : "") },
    { p: "show firewall address ?<word>", run: (c, a) => c.out(fwShow(c.d, "address", a[3])), tag: (a) => "show firewall address" + (a[3] ? " " + a[3] : "") },
    { p: "show firewall addrgrp ?<word>", run: (c, a) => c.out(fwShow(c.d, "addrgrp", a[3])), tag: (a) => "show firewall addrgrp" + (a[3] ? " " + a[3] : "") },
    { p: "config firewall policy|address|addrgrp", run: (c, a) => { c.s.table = a[2]; } },
    { p: "execute ping <word>", run: (c, a) => {
      const ip = NAMES[a[2].toLowerCase()] || a[2];
      const r = isIp(ip) ? reach(c.net, c.d, ip) : { ok: false };
      const out = [`PING ${ip} (${ip}): 56 data bytes`];
      for (let i = 0; i < 5; i++) if (r.ok) out.push(`64 bytes from ${ip}: icmp_seq=${i} ttl=63 time=0.${4 + i} ms`);
      out.push("", `--- ${ip} ping statistics ---`, `5 packets transmitted, ${r.ok ? 5 : 0} packets received, ${r.ok ? 0 : 100}% packet loss`);
      if (r.ok) out.push("round-trip min/avg/max = 0.4/0.6/0.8 ms");
      c.out(out); c.tags.push(`ping ${ip} ${r.ok ? "ok" : "fail"} local`); } },
    { p: "execute traceroute <word>", run: (c, a) => { const ip = NAMES[a[2].toLowerCase()] || a[2]; const r = reach(c.net, c.d, ip);
      c.out([`traceroute to ${ip} (${ip}), 32 hops max, 3 probe packets per hop, 84 byte packets`].concat(r.hops.map((h, i) => ` ${i + 1}  ${h}  0.4${i} ms  0.3${i} ms  0.3${i} ms`))); } },
    { p: "diagnose sniffer packet <word> <word> ?<num> ?<num> ?<word>", run: (c, a) => fwSniffer(c, a[3], a[4], a[5], a[6]) },
    { p: "diagnose debug flow filter addr <ip>", run: (c, a) => { c.d.dbg.addr = a[5]; } },
    { p: "diagnose debug flow filter dport <num>", run: (c, a) => { c.d.dbg.dport = a[5]; } },
    { p: "diagnose debug flow filter clear", run: (c) => { c.d.dbg.addr = null; c.d.dbg.dport = null; } },
    { p: "diagnose debug flow show function-name enable", run: () => {} },
    { p: "diagnose debug flow trace start <num>", run: (c, a) => { c.d.dbg.trace = Math.min(a[5], 100); debugFlow(c); } },
    { p: "diagnose debug flow trace stop", run: (c) => { c.d.dbg.trace = 0; } },
    { p: "diagnose debug enable", run: (c) => { c.d.dbg.enabled = true; debugFlow(c); } },
    { p: "diagnose debug disable", run: (c) => { c.d.dbg.enabled = false; } },
    { p: "diagnose debug reset", run: (c) => { Object.assign(c.d.dbg, { enabled: false, trace: 0 }); } },
    { p: "diagnose debug console timestamp enable", run: () => {} },
    { p: "execute log display", run: (c) => c.out(diag(c.net, c.d.id, "log").concat(["", `${c.d.logs.length} logs returned.`])), tag: "log display" },
    { p: "exit", run: (c) => { c.close = true; } },
  ];
  const FW_TABLE = [
    { p: "edit <word>", run: (c, a) => fwEdit(c, a[1]) },
    { p: "show", run: (c) => c.out(fwShow(c.d, c.s.table)) },
    { p: "move <num> before|after <num>", run: (c, a) => {
      const L = c.d.fw.policies; const i = L.findIndex((x) => x.id === a[1]); const j = L.findIndex((x) => x.id === a[3]);
      if (c.s.table !== "policy" || i < 0 || j < 0) return c.err(["entry not found in datasource", ...FW_FAIL(-3)]);
      const [e] = L.splice(i, 1); const k = L.findIndex((x) => x.id === a[3]); L.splice(a[2] === "before" ? k : k + 1, 0, e); c.tags.push(`policy move ${a[1]}`); } },
    { p: "delete <word>", run: (c, a) => {
      const L = fwList(c.d, c.s.table); const key = c.s.table === "policy" ? "id" : "name"; const i = L.findIndex((x) => String(x[key]) === a[1]);
      if (i < 0) return c.err(["entry not found in datasource", ...FW_FAIL(-3)]);
      if (c.s.table !== "policy" && fwInUse(c.d, L[i].name)) return c.err(["The entry is used by other 1 entries", ...FW_FAIL(-23)]);
      L.splice(i, 1); c.tags.push(`${c.s.table} delete ${a[1]}`); } },
    { p: "end", run: (c) => { c.s.table = null; } },
  ];
  const FW_EDIT = [
    { p: "set <word> <line?>", run: (c, a) => fwSet(c, a[1], a[2] || "") },
    { p: "unset <word>", run: (c, a) => fwSet(c, a[1], null) },
    { p: "append member <line>", run: (c, a) => { if (c.s.table !== "addrgrp") return c.fwParse("append"); fwSet(c, "member", c.s.draft.member.join(" ") + " " + a[2]); } },
    { p: "show", run: (c) => c.out([`config firewall ${c.s.table}`].concat(fwShowEntry(c.s.table, c.s.draft)).concat(["end"])) },
    { p: "get", run: (c) => c.out(fwShowEntry(c.s.table, c.s.draft).slice(1, -1).map((l) => l.trim().replace(/^set (\S+) /, (_, k) => pad(k, 18) + ": "))) },
    { p: "next", run: (c) => fwCommit(c, false) },
    { p: "end", run: (c) => fwCommit(c, true) },
    { p: "abort", run: (c) => { c.s.edit = null; c.s.draft = null; } },
  ];
  function fwInUse(d, name) {
    return d.fw.policies.some((p) => (p.srcaddr || []).concat(p.dstaddr || []).includes(name)) || d.fw.addrgrps.some((g) => g.member.includes(name));
  }
  function fwEdit(c, id) {
    const t = c.s.table;
    const L = fwList(c.d, t);
    const key = t === "policy" ? "id" : "name";
    let e = L.find((x) => String(x[key]) === String(id));
    let isNew = false;
    if (!e) {
      if (t === "policy" && !/^\d+$/.test(id)) return c.fwParse(id, -61);
      isNew = true;
      e = t === "policy" ? { id: Number(id) === 0 ? Math.max(0, ...L.map((x) => x.id)) + 1 : Number(id), srcintf: [], dstintf: [], srcaddr: [], dstaddr: [], service: [], action: "deny", status: "enable", schedule: "always" }
        : t === "address" ? { name: id, subnet: "0.0.0.0 0.0.0.0" } : { name: id, member: [] };
      if (t === "policy" && Number(id) === 0) c.out([`new entry '${e.id}' added`]);
    }
    c.s.edit = t === "policy" ? (isNew && Number(id) === 0 ? 0 : e.id) : e.name;
    c.s.draft = clone(e);
    c.s.isNew = isNew;
  }
  const POLICY_FIELDS = ["name", "srcintf", "dstintf", "srcaddr", "dstaddr", "service", "action", "status", "schedule", "logtraffic", "nat", "comments"];
  function fwSet(c, key, raw) {
    const t = c.s.table, e = c.s.draft, d = c.d;
    const vals = raw == null ? [] : tokenize(raw).map((x) => x.s);
    const ds = (list, names) => { const bad = vals.find((v) => !names.includes(v)); if (bad) { c.err(["entry not found in datasource", "", `value parse error before '${bad}'`, ...FW_FAIL(-3)]); return null; } return vals; };
    const addrNames = d.fw.addresses.map((x) => x.name).concat(d.fw.addrgrps.map((x) => x.name));
    const intfNames = d.ifaces.map((x) => x.name).concat(["any"]);
    if (t === "policy") {
      if (!POLICY_FIELDS.includes(key)) return c.fwParse(key, -61);
      if (raw == null) { if (Array.isArray(e[key])) e[key] = []; else delete e[key]; return; }
      if (["srcintf", "dstintf"].includes(key)) { const v = ds(intfNames, intfNames); if (v) e[key] = v; return; }
      if (["srcaddr", "dstaddr"].includes(key)) { const v = ds(addrNames, addrNames); if (v) e[key] = v; return; }
      if (key === "service") { const v = ds(Object.keys(SERVICES), Object.keys(SERVICES)); if (v) e[key] = v; return; }
      if (key === "action") { if (!["accept", "deny"].includes(vals[0])) return c.fwParse(vals[0] || "", -61); e.action = vals[0]; return; }
      if (key === "status") { if (!["enable", "disable"].includes(vals[0])) return c.fwParse(vals[0] || "", -61); e.status = vals[0]; return; }
      if (key === "nat") { e.nat = vals[0] === "enable"; return; }
      if (key === "logtraffic") { e.logtraffic = vals[0]; return; }
      e[key] = vals.join(" ");
      return;
    }
    if (t === "address") {
      if (!["subnet", "comment", "type", "associated-interface"].includes(key)) return c.fwParse(key, -61);
      if (key === "subnet") {
        let [ip, m] = vals;
        if (ip && ip.includes("/")) { const [a, b] = ip.split("/"); ip = a; m = b; }
        const bits = m == null ? 32 : /^\d+$/.test(m) ? Number(m) : maskBits(m);
        if (!isIp(ip) || bits == null || bits > 32) return c.err([`value parse error before '${vals.join(" ")}'`, ...FW_FAIL(-8)]);
        e.subnet = `${ip} ${bitsMask(bits)}`;
        return;
      }
      if (key === "comment") e.comment = vals.join(" ");
      return;
    }
    if (key !== "member" && key !== "comment") return c.fwParse(key, -61);
    if (key === "member") { const v = ds(addrNames, addrNames.filter((n) => n !== e.name)); if (v) e.member = Array.from(new Set(v)); return; }
    e.comment = vals.join(" ");
  }
  function fwCommit(c, leave) {
    const t = c.s.table, e = c.s.draft;
    if (t === "policy") {
      const miss = ["srcintf", "dstintf", "srcaddr", "dstaddr", "service"].find((k) => !e[k] || !e[k].length);
      if (miss) { c.err([`Attribute '${miss}' MUST be set.`, ...FW_FAIL(-56)]); return; }
    }
    if (t === "addrgrp" && !e.member.length) { c.err(["Attribute 'member' MUST be set.", ...FW_FAIL(-56)]); return; }
    const L = fwList(c.d, t);
    const key = t === "policy" ? "id" : "name";
    const i = L.findIndex((x) => x[key] === e[key]);
    if (i >= 0) L[i] = e; else L.push(e);
    c.tags.push(`${t} ${c.s.isNew ? "new" : "set"} ${e[key]}`);
    c.s.edit = null; c.s.draft = null;
    if (leave) c.s.table = null;
  }
  function fwExec(c, line) {
    const toks = tokenize(line);
    const list = c.s.edit != null ? FW_EDIT : c.s.table ? FW_TABLE : FW_TOP;
    c.fwParse = (word, code) => c.err([`command parse error before '${word}'`, ...FW_FAIL(code || -61)], true);
    const m = match(list, toks, null);
    if (m.error) {
      if (c.s.edit != null || c.s.table) return c.fwParse((toks[m.at] || toks[0] || { s: "" }).s, -61);
      return c.err(["Unknown action 0", ...FW_FAIL(-1)], true);
    }
    c.pat = m.pat;
    m.cmd.run(c, m.args);
    if (m.cmd.tag) c.tags.push(typeof m.cmd.tag === "function" ? m.cmd.tag(m.args, c) : m.cmd.tag);
  }

  /* ---------- the terminal: your workstation (ADM-WS01, PowerShell) and the SSH sessions you open from it */
  const WS = "ADM-WS01";
  const WS_PROMPT = "PS C:\\Users\\it.admin> ";
  const BANNER = ["", "*****************************************************************", "* Contoso network device. Authorised access only.               *",
    "* Every session is logged (TACACS+ accounting).                 *", "*****************************************************************", ""];
  function terminal(net, opts) { return { net, stack: [], home: (opts && opts.home) || WS }; }
  function depth(term) { return term.stack.length; }
  function current(term) { return term.stack[term.stack.length - 1] || null; }
  function prompt(term) {
    const s = current(term);
    if (!s) return WS_PROMPT;
    const d = term.net.devices[s.dev];
    return d.os === "ios" ? iosPrompt(s, d) : d.os === "aruba" ? hpPrompt(s, d) : fwPrompt(s, d);
  }
  function findDevice(net, host) {
    const h = String(host || "").toLowerCase().replace(/\.contoso\.local$/, "");
    return Object.values(net.devices).find((d) => d.id.toLowerCase() === h || d.mgmt === host) || null;
  }
  // open a session on a device (the SSH login): returns the banner lines
  function connect(term, devId) {
    const d = term.net.devices[devId];
    if (!d) return null;
    if (!d.dbg && d.os === "fortios") d.dbg = { enabled: false, trace: 0, addr: null, dport: null, next: 1 };
    term.stack.push({ dev: d.id, mode: d.os === "ios" ? "user" : "exec", table: null, edit: null });
    if (d.os === "aruba") return ["", "HPE Aruba 2930F-24G-PoE+-4SFP+ Switch (JL261A)", `Software revision ${d.version}`, "", "(C) Copyright 2024 Hewlett Packard Enterprise Development LP"].concat(BANNER);
    if (d.os === "fortios") return BANNER.concat([]);
    return BANNER;
  }
  function wsExec(term, line, res) {
    const toks = tokenize(line);
    const w = (toks[0] || { s: "" }).s.toLowerCase();
    const out = (arr, kind) => arr.forEach((x) => res.lines.push({ text: x, kind: kind || "out" }));
    if (w === "ssh") {
      const rest = toks.slice(1).map((x) => x.s).filter((x, i, a) => x !== "-l" && a[i - 1] !== "-l");
      const target = (rest[0] || "").replace(/^[^@]+@/, "");
      const d = findDevice(term.net, target);
      if (!target) { out(["usage: ssh [-46AaCfGgKkMNnqsTtVvXxYy] [-B bind_interface] [-b bind_address] [-c cipher_spec] destination [command]"], "err"); return; }
      if (!d) { out([`ssh: Could not resolve hostname ${target.toLowerCase()}: No such host is known.`], "err"); return; }
      if (d.site === "VLC" && !reach(term.net, { id: WS, site: "HQ", os: "pc" }, d.mgmt, "10.20.14.50").ok) { out([`ssh: connect to host ${d.mgmt} port 22: Connection timed out`], "err"); return; }
      out([`(it.admin@${d.mgmt} · password from your TACACS+ account)`], "dim");
      out(connect(term, d.id));
      res.tags.push({ dev: d.id, tag: "connect" });
      return;
    }
    if (w === "ping" || w === "tracert" || w === "test-netconnection") {
      const target = (toks.find((x, i) => i > 0 && !x.s.startsWith("-")) || { s: "" }).s;
      const ip = NAMES[target.toLowerCase()] || (findDevice(term.net, target) || {}).mgmt || target;
      if (!isIp(ip)) { out([`Ping request could not find host ${target}. Please check the name and try again.`], "err"); return; }
      const r = reach(term.net, { id: WS, site: "HQ", os: "pc" }, ip, "10.20.14.50");
      if (w === "tracert") {
        out(["", `Tracing route to ${target} [${ip}]`, "over a maximum of 30 hops:", ""]);
        ["10.20.14.1"].concat(r.hops.filter((h) => h !== "10.20.99.1")).forEach((h, i) => out([`  ${i + 1}    <1 ms    <1 ms    <1 ms  ${h}`]));
        if (!r.ok) out([`  ${r.hops.length + 1}     *        *        *     Request timed out.`]);
        out(["", "Trace complete."]);
      } else if (w === "ping") {
        out(["", `Pinging ${target === ip ? ip : target + " [" + ip + "]"} with 32 bytes of data:`]);
        for (let i = 0; i < 4; i++) out([r.ok ? `Reply from ${ip}: bytes=32 time=${1 + (i % 2)}ms TTL=${r.hops.length > 1 ? 63 : 64}` : "Request timed out."]);
        out(["", `Ping statistics for ${ip}:`, `    Packets: Sent = 4, Received = ${r.ok ? 4 : 0}, Lost = ${r.ok ? 0 : 4} (${r.ok ? 0 : 100}% loss),`]);
        if (r.ok) out(["Approximate round trip times in milli-seconds:", "    Minimum = 1ms, Maximum = 2ms, Average = 1ms"]);
      } else {
        out(["", `ComputerName     : ${target}`, `RemoteAddress    : ${ip}`, "InterfaceAlias   : Ethernet", "SourceAddress    : 10.20.14.50", `PingSucceeded    : ${r.ok ? "True" : "False"}`, ""]);
      }
      res.tags.push({ dev: WS, tag: `ping ${ip} ${r.ok ? "ok" : "fail"}` });
      return;
    }
    if (w === "exit") { out(["(This is your own workstation: there is no session to close.)"], "dim"); return; }
    res.unknown = true;
    out([`${toks[0].s} : The term '${toks[0].s}' is not recognized as the name of a cmdlet, function, script file, or operable program.`,
      "Check the spelling of the name, or if a path was included, verify that the path is correct and try again."], "err");
  }
  /* Runs one line in the terminal. Returns {lines: [{text, kind}], tags: [{dev, tag}], unknown, closed}. */
  function exec(term, input, opts) {
    const line = String(input || "").trim().replace(/\s+/g, " ");
    const res = { lines: [], tags: [], unknown: false, closed: false };
    if (!line) return res;
    term.net.clock += 7000;
    const s = current(term);
    if (!s) { wsExec(term, line, res); return res; }
    const d = term.net.devices[s.dev];
    const before = prompt(term);
    const c = {
      net: term.net, d, s, lines: res.lines, tags: [],
      out: (arr) => arr.forEach((x) => res.lines.push({ text: x, kind: "out" })),
      err: (arr, unknown) => { arr.forEach((x) => res.lines.push({ text: x, kind: "err" })); if (unknown) res.unknown = true; },
      invalid: (at, toks, pr) => {
        const tk = (toks || c.toks || tokenize(line))[at] || { at: line.length, s: "" };
        if (d.os === "aruba") { res.lines.push({ text: `Invalid input: ${tk.s}`, kind: "err" }); res.unknown = true; return; }
        res.lines.push({ text: " ".repeat((pr || c.prompt || before).length + tk.at) + "^", kind: "err" }, { text: "% Invalid input detected at '^' marker.", kind: "err" }, { text: "", kind: "err" });
        res.unknown = true;
      },
    };
    if (d.os === "ios") iosExec(c, line, before);
    else if (d.os === "aruba") hpExec(c, line);
    else fwExec(c, line);
    c.tags.forEach((tg) => res.tags.push({ dev: d.id, tag: tg }));
    if (c.ssh) {
      const o = findDevice(term.net, c.ssh.host);
      if (!o) res.lines.push({ text: "% Connection refused by remote host", kind: "err" });
      else { res.lines.push(...connect(term, o.id).map((x) => ({ text: x, kind: "out" }))); res.tags.push({ dev: o.id, tag: "connect" }); }
    }
    if (c.close) {
      if (c.warnUnsaved) res.lines.push({ text: "Do you want to save current configuration [y/n/^C]? n", kind: "out" });
      term.stack.pop();
      res.closed = true;
      res.lines.push({ text: `Connection to ${d.mgmt} closed.`, kind: "dim" });
      res.tags.push({ dev: d.id, tag: "disconnect" });
    }
    return res;
  }

  /* ---------- v0.7b: power supplies (show environment): slots 1A and 1B, like a Catalyst 9200L/9300 */
  function psuList(d) {
    return d.power.map((x) => ["PS" + (x.slot.slice(-1) === "A" ? 1 : 2), !x.pid ? "Not present" : x.status === "OK" ? "OK" : "Failed"]);
  }
  function envPower(d) {
    const out = ["SW  PID                 Serial#     Status           Sys Pwr  PoE Pwr  Watts", "--  ------------------  ----------  ---------------  -------  -------  -----"];
    (d.power || []).forEach((x) => {
      if (!x.pid) { out.push(pad(x.slot, 4) + "Not Present"); return; }
      const ok = x.status === "OK";
      out.push(pad(x.slot, 4) + pad(x.pid, 20) + pad(x.serial, 12) + pad(ok ? "OK" : "Disabled", 17) + pad(ok ? "Good" : "Bad", 9) + pad(ok ? "Good" : "n/a", 9) + x.watts);
    });
    return out;
  }
  function envAll(d) {
    const out = [];
    for (let n = 1; n <= 3; n++) out.push(`Switch 1 FAN ${n} is OK`);
    (d.power || []).forEach((x, i) => out.push(`FAN PS-${i + 1} is ${!x.pid ? "NOT PRESENT" : x.status === "OK" ? "OK" : "NOT OK"}`));
    out.push("Switch 1: SYSTEM TEMPERATURE is OK", `Inlet Temperature Value: ${d.health.temp - 6} Degree Celsius`, `Hotspot Temperature Value: ${d.health.temp} Degree Celsius`, "");
    return out.concat(envPower(d));
  }

  /* ---------- what the network room shows: the device card, its health and its diagnostics */
  function list(net) { return Object.values(net.devices); }
  function health(net, id) {
    const d = net.devices[id];
    if (!d) return null;
    const ports = (d.ifaces || []).filter((p) => p.mode !== "svi" && d.os !== "fortios");
    const errDis = ports.filter((p) => p.err).map((p) => ({ port: p.short || p.name, reason: p.err }));
    const errors = ports.filter((p) => p.counters && (p.counters.crc || p.counters.inErr)).map((p) => ({ port: p.short || p.name, crc: p.counters.crc, inErr: p.counters.inErr }));
    const recent = d.logs.filter((l) => net.clock - l.at < 4 * 3600 * 1000 && /UPDOWN|ERR_DISABLE|BPDUGUARD|off-line/.test(l.text)).length;
    const up = ports.filter((p) => linkUp(net, d, p)).length;
    const unsaved = !saved(d);
    const notes = [];
    if (errDis.length) notes.push({ tone: "bad", id: "errdisabled", ports: errDis.map((x) => `${x.port} (${x.reason})`) });
    if (unsaved) notes.push({ tone: "warn", id: "unsaved" });
    errors.filter((x) => x.crc >= 100).forEach((x) => notes.push({ tone: "warn", id: "errors", ports: [x.port] }));
    // v0.7b: a failed power supply: the switch runs on the other one, but the redundancy is lost
    const psu = d.power ? psuList(d) : d.health.psu;
    const badPs = d.power ? d.power.filter((x) => x.pid && x.status !== "OK").map((x) => x.slot) : [];
    if (badPs.length) notes.push({ tone: "warn", id: "psu", ports: badPs });
    const tone = errDis.length ? "bad" : notes.length ? "warn" : "ok";
    return {
      cpu: Math.min(95, d.health.cpu + Math.min(20, recent * 2)), mem: d.health.mem, temp: d.health.temp, psu, psuFailed: badPs, fans: badPs.length ? "OK (PS fan " + badPs.join(", ") + " stopped)" : d.health.fans,
      uptime: d.uptime, uptimeText: `${Math.floor(d.uptime / 86400)} d ${Math.floor((d.uptime % 86400) / 3600)} h`,
      ports: ports.length, up, errDisabled: errDis, errors, unsaved, tone, notes,
      sessions: d.os === "fortios" ? 18432 + d.fw.policies.length * 3 : null, policies: d.fw ? d.fw.policies.length : null,
    };
  }
  // the Diagnostics tab: ping or traceroute from the device, and the end of its log, in the device's own words
  function diag(net, id, what, target) {
    const d = net.devices[id];
    if (!d) return [];
    if (what === "log") {
      if (d.os === "ios") return d.logs.slice(-8).map((l) => `${iosStamp(l.at)}: ${l.text}`);
      if (d.os === "aruba") return hpLogs(d, true).slice(3, 11);
      return d.logs.slice(-8).map((l) => { const dt = new Date(l.at); return `date=${dt.getUTCFullYear()}-${two(dt.getUTCMonth() + 1)}-${two(dt.getUTCDate())} time=${hms(l.at)} type="event" subtype="system" ${l.text}`; });
    }
    const tgt = String(target || "").trim();
    if (!tgt) return [];
    if (d.os === "ios") return what === "trace" ? iosTrace(net, d, tgt) : iosPing(net, d, tgt).lines;
    if (d.os === "aruba") { const ip = NAMES[tgt.toLowerCase()] || tgt; const r = isIp(ip) ? reach(net, d, ip) : { ok: false, hops: [] }; return what === "trace" ? r.hops.map((h, i) => `  ${i + 1} ${pad(h, 16)} 0 ms`) : hpPing(net, d, tgt).lines; }
    const ip = NAMES[tgt.toLowerCase()] || tgt;
    const r = isIp(ip) ? reach(net, d, ip) : { ok: false, hops: [] };
    if (what === "trace") return [`traceroute to ${ip} (${ip}), 32 hops max`].concat(r.hops.map((h, i) => ` ${i + 1}  ${h}  0.4 ms`));
    return [`PING ${ip} (${ip}): 56 data bytes`, `5 packets transmitted, ${r.ok ? 5 : 0} packets received, ${r.ok ? 0 : 100}% packet loss`];
  }
  // the CLI line of the device card (what to type for the same view)
  const LOOK = { ios: { log: "show logging", ping: "ping", trace: "traceroute" }, aruba: { log: "show logging -r", ping: "ping", trace: "traceroute" },
    fortios: { log: "execute log display", ping: "execute ping", trace: "execute traceroute" } };

  /* ---------- the checks a desk asks about the net (scenario net.flags, see docs/scenario-format.md) */
  function check(net, spec) {
    const d = spec.dev ? net.devices[spec.dev] : null;
    switch (spec.kind) {
      case "port": {
        const p = port(d, spec.port);
        if (!p) return false;
        if (spec.status && status(net, d, p) !== spec.status) return false;
        if (spec.vlan != null && p.vlan !== spec.vlan) return false;
        if (spec.guard != null && (p.bpduguard === true) !== spec.guard) return false;
        if (spec.admin != null && (p.admin !== false) !== spec.admin) return false;
        return true;
      }
      case "saved": return saved(d);
      case "host": {
        const h = net.hosts[spec.host];
        if (!h) return false;
        if (spec.ip && h.ip !== spec.ip) return false;
        if (spec.dhcp != null && h.dhcp !== spec.dhcp) return false;
        if (spec.live != null && hostLive(net, h) !== spec.live) return false;
        return true;
      }
      case "flow": {
        const r = fwEval(d, Object.assign({}, sampleFlow(net), spec.flow || {}));
        if (spec.policy != null) return r.action === "accept" && r.policy === spec.policy;
        return (r.action === "accept") === (spec.allowed !== false) && Boolean(whoHas(net, (spec.flow || sampleFlow(net)).dst || sampleFlow(net).dst));
      }
      case "anyany": return anyAny(d) === (spec.present !== false);
      // v0.7b: a power supply slot: { kind: "power", dev, slot: "1B", status: "OK" } (and serial, to tell the new unit from the old one)
      case "power": {
        const x = (d.power || []).find((y) => y.slot === spec.slot);
        if (!x || !x.pid) return false;
        return (!spec.status || x.status === spec.status) && (!spec.serial || x.serial === spec.serial);
      }
      default: throw new Error("unknown net check " + spec.kind);
    }
  }

  return { T0, VLANS, SERVICES, createNet, apply, terminal, connect, exec, prompt, depth, current, list, health, diag, check, LOOK,
    port, status, saved, linkUp, macTable, reach, fwEval, anyAny, parseMac, hpMac, colonMac, tokenize, match, pipe, findDevice, hostLive, WS, WS_PROMPT, t };
});
