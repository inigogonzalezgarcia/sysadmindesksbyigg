// v0.7a: the network room's CLI simulator (netcli.js) for Cisco IOS, ArubaOS-Switch and FortiOS, the health derived from the devices,
// and the three network desks played through the engine (the tempting fix does not close them, the real fix does).
const test = require("node:test");
const assert = require("node:assert/strict");
const N = require("../public/assets/netcli.js");
const E = require("../public/assets/engine.js");
const C = require("../public/assets/comms.js");
const SCENARIOS = require("../public/assets/scenarios.js");

const byId = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));
// a terminal on a fresh net; run(line) returns the text of the output, and r() the whole result
function cli(setup, dev) {
  const net = N.createNet(setup || []);
  const term = N.terminal(net);
  if (dev) N.exec(term, "ssh " + dev);
  const last = {};
  const run = (line) => { const r = N.exec(term, line); Object.assign(last, r); return r.lines.map((l) => l.text).join("\n"); };
  return { net, term, run, last, prompt: () => N.prompt(term) };
}
const play = (sc, cmds, lang = "en") => { const s = E.createSession(sc, lang); const res = cmds.map((c) => E.run(s, c)); return Object.assign(s, { res }); };

test("the workstation: ssh to every device by name or management IP, ping, and PowerShell's answer to anything else", () => {
  const { run, prompt, last } = cli();
  assert.equal(prompt(), "PS C:\\Users\\it.admin> ");
  assert.match(run("ping erp.contoso.local"), /Reply from 10\.20\.1\.52: bytes=32/);
  assert.match(run("Get-Coffee"), /The term 'Get-Coffee' is not recognized/);
  assert.equal(last.unknown, true);
  assert.match(run("ssh nope"), /Could not resolve hostname nope/);
  for (const [name, p] of [["SW-ACC-2F", "SW-ACC-2F>"], ["it.admin@10.20.99.13", "SW-ACC-1F# "], ["FGT-HQ-01", "FGT-HQ-01 # "], ["-l it.admin RTR-VLC-01", "RTR-VLC-01>"]]) {
    assert.match(run("ssh " + name), /Authorised access only/);
    assert.equal(prompt(), p);
    assert.match(run("exit"), /closed\./);
    assert.equal(prompt(), "PS C:\\Users\\it.admin> ");
  }
});

test("Cisco IOS: modes, abbreviations, and the real answers to wrong, incomplete and ambiguous input", () => {
  const { run, prompt, last } = cli([], "SW-ACC-2F");
  assert.equal(prompt(), "SW-ACC-2F>");
  // privileged commands are not there in user mode
  const bad = run("show running-config");
  assert.match(bad, /% Invalid input detected at '\^' marker\./);
  assert.equal(bad.split("\n")[0], " ".repeat("SW-ACC-2F>show ".length) + "^", "the marker sits under the first wrong word");
  assert.equal(last.unknown, true);
  run("enable");
  assert.equal(prompt(), "SW-ACC-2F#");
  assert.equal(run("show vlan breif").split("\n")[0], " ".repeat("SW-ACC-2F#show vlan ".length) + "^");
  assert.match(run("show"), /% Incomplete command\./);
  assert.match(run("sh i"), /% Ambiguous command:  "sh i"/, "interfaces or ip");
  assert.match(run("sh ip int br"), /Vlan99\s+10\.20\.99\.12\s+YES NVRAM\s+up\s+up/);
  assert.match(run("sh int status"), /Gi1\/0\/14\s+FIN 2\.14 dlopez\s+connected\s+140\s+a-full\s+a-1000/);
  assert.match(run("sh vlan br"), /^30\s+PRINTERS\s+active\s+Gi1\/0\/21$/m);
  assert.match(run("show mac address-table interface Gi1/0/3"), /140\s+6c4b\.9042\.1a21\s+DYNAMIC\s+Gi1\/0\/3[\s\S]*150\s+6c41\.0e2b\.7a03\s+DYNAMIC\s+Gi1\/0\/3[\s\S]*Total Mac Addresses for this criterion: 2/);
  assert.match(run("show mac address-table address 3c52.82a1.0f44"), /Gi1\/0\/14/);
  assert.match(run("show mac address-table address 3c:52:82:a1:0f:44"), /Invalid input/, "IOS only takes the dotted format");
  assert.match(run("show cdp neighbors"), /SW-CORE-01\.contoso\.local\n\s+Ten 1\/1\/1\s+142\s+R S I\s+C9300-24P Ten 1\/1\/1/);
  assert.match(run("show spanning-tree vlan 140"), /VLAN0140[\s\S]*Te1\/1\/1\s+Root FWD/);
  assert.match(run("show errdisable recovery"), /bpduguard\s+Disabled[\s\S]*Timer interval: 300 seconds/);
  assert.match(run("show running-config | section interface GigabitEthernet1/0/14"), /^interface GigabitEthernet1\/0\/14\n description FIN 2\.14 dlopez\n switchport access vlan 140/);
  assert.match(run("show running-config | include hostname"), /^hostname SW-ACC-2F$/);
  // configuration modes and the way back
  run("conf t");
  assert.equal(prompt(), "SW-ACC-2F(config)#");
  run("int gi1/0/22");
  assert.equal(prompt(), "SW-ACC-2F(config-if)#");
  assert.match(run("e"), /Ambiguous/, "end or exit");
  assert.match(run("do show interfaces Gi1/0/22 status"), /Gi1\/0\/22\s+FIN 2\.22\s+notconnect/);
  run("exit");
  assert.equal(prompt(), "SW-ACC-2F(config)#");
  run("interface GigabitEthernet1/0/22");
  run("end");
  assert.equal(prompt(), "SW-ACC-2F#");
  assert.match(run("?"), /configure[\s\S]*show/);
});

test("Cisco IOS: changes alter the switch, and running and startup differ until you save", () => {
  const { net, run } = cli([], "SW-ACC-2F");
  const d = net.devices["SW-ACC-2F"];
  run("enable"); run("configure terminal"); run("interface Gi1/0/22");
  run("description FIN 2.22 new starter");
  assert.match(run("switchport access vlan 77"), /% Access VLAN does not exist\. Creating vlan 77/);
  assert.equal(N.saved(d), false, "running ≠ startup");
  assert.equal(N.health(net, "SW-ACC-2F").unsaved, true);
  run("shutdown");
  assert.equal(N.status(net, d, N.port(d, "Gi1/0/22")), "disabled");
  run("end");
  assert.match(run("show running-config interface Gi1/0/22"), /description FIN 2\.22 new starter\n switchport access vlan 77[\s\S]* shutdown/);
  assert.doesNotMatch(run("show startup-config"), /new starter/);
  assert.match(run("show vlan brief"), /^77\s+VLAN0077\s+active\s+Gi1\/0\/22$/m);
  assert.match(run("copy running-config startup-config"), /Destination filename \[startup-config\]\?[\s\S]*\[OK\]/);
  assert.equal(N.saved(d), true);
  assert.match(run("show startup-config"), /description FIN 2\.22 new starter/);
  // a port up again sends its logs; a PC behind it asks DHCP again
  run("configure terminal"); run("interface Gi1/0/5"); run("shutdown"); run("no shutdown"); run("end");
  assert.match(run("show logging"), /%LINK-5-CHANGED: Interface GigabitEthernet1\/0\/5, changed state to administratively down[\s\S]*%LINK-3-UPDOWN: Interface GigabitEthernet1\/0\/5, changed state to up/);
});

test("Cisco IOS: BPDU Guard puts a port with a switch behind it in err-disabled, and a bounce only helps once the cause is gone", () => {
  const setup = [{ host: "SW-X", set: { kind: "switch", mac: "0c80.6311.a2b4", dhcp: false, bpdu: true, behind: ["PC-FIN-027"] } }, { dev: "SW-ACC-2F", port: "Gi1/0/14", peer: "SW-X" }];
  const { net, run, last } = cli(setup, "SW-ACC-2F");
  const d = net.devices["SW-ACC-2F"];
  const p = N.port(d, "Gi1/0/14");
  run("enable"); run("conf t"); run("int gi1/0/14"); run("shutdown"); run("no shutdown");
  assert.equal(p.err, "bpduguard");
  assert.ok(last.tags.some((x) => x.tag === "err-disabled Gi1/0/14"));
  assert.match(run("do show interfaces status err-disabled"), /Gi1\/0\/14\s+FIN 2\.14 dlopez\s+err-disabled bpduguard/);
  assert.match(run("do show interfaces Gi1/0/14"), /GigabitEthernet1\/0\/14 is down, line protocol is down \(err-disabled\)/);
  assert.match(run("do show logging"), /%SPANTREE-2-BLOCK_BPDUGUARD: Received BPDU on port Gi1\/0\/14 with BPDU Guard enabled\. Disabling port\.\n.*%PM-4-ERR_DISABLE: bpduguard error detected on Gi1\/0\/14/);
  assert.equal(N.health(net, "SW-ACC-2F").tone, "bad");
  run("no shutdown");
  assert.equal(p.err, "bpduguard", "no shutdown alone does not clear err-disabled");
  N.apply(net, { dev: "SW-ACC-2F", port: "Gi1/0/14", peer: "PC-FIN-027", live: true });
  run("shutdown"); run("no shutdown");
  assert.equal(N.status(net, d, p), "connected");
  assert.equal(N.health(net, "SW-ACC-2F").errDisabled.length, 0);
  assert.ok(N.hostLive(net, net.hosts["PC-FIN-027"]));
});

test("ArubaOS-Switch: HP's words for VLANs, MACs in HP format, its own error messages, and write memory", () => {
  const { net, run, prompt, last } = cli([], "SW-ACC-1F");
  const d = net.devices["SW-ACC-1F"];
  assert.equal(prompt(), "SW-ACC-1F# ");
  assert.match(run("show interfaces brief"), /18\s+100\/1000T\s+\| No\s+Yes\s+Up\s+1000FDx/);
  assert.match(run("show vlans"), /30\s+PRINTERS\s+\| Port-based No/);
  assert.match(run("show vlans 30"), /18\s+Untagged Learn\s+Up[\s\S]*25\s+Tagged\s+Learn\s+Up/);
  assert.match(run("show mac-address a45d36-0c197e"), /Address Table - a45d36-0c197e[\s\S]*18\s+30/);
  assert.match(run("show mac-address 1"), /f4a80d-312217 140/);
  assert.match(run("show lldp info remote-device"), /25\s+\| 6c 13 d5 a2 80 00\s+Te1\/1\/2.*SW-CORE-01/);
  assert.match(run("show interfaces 7"), /FCS Rx\s+: 12\s/);
  assert.equal(run("show vlnas"), "Invalid input: vlnas");
  assert.equal(last.unknown, true);
  assert.match(run("show"), /^Incomplete input: show$/);
  run("configure");
  assert.equal(prompt(), "SW-ACC-1F(config)# ");
  run("vlan 30");
  assert.equal(prompt(), "SW-ACC-1F(vlan-30)# ");
  run("untagged 21");
  run("exit");
  assert.equal(N.port(d, "21").vlan, 30);
  assert.equal(N.saved(d), false);
  assert.match(run("show running-config"), /vlan 30\n   name "PRINTERS"\n   untagged 18,21\n   tagged 25/);
  assert.doesNotMatch(run("show config"), /untagged 18,21/, "show config is the saved one");
  run("interface 21");
  assert.equal(prompt(), "SW-ACC-1F(eth-21)# ");
  run("name \"SAL 1.21 plotter\"");
  run("exit");
  run("vlan 140 untagged 21");
  assert.equal(N.port(d, "21").vlan, 140);
  run("write memory");
  assert.equal(N.saved(d), true);
  assert.match(run("show config"), /interface 21\n   name "SAL 1\.21 plotter"/);
});

test("ArubaOS-Switch: a port moved to the printers' VLAN keeps the old lease until its link bounces", () => {
  const setup = [{ dev: "SW-ACC-1F", port: "18", peer: null }, { dev: "SW-ACC-1F", port: "22", set: { vlan: 140 }, peer: "SALES-MFP-01" }, { host: "SALES-MFP-01", set: { ip: "10.20.14.87" } }];
  const { net, run } = cli(setup, "SW-ACC-1F");
  const h = net.hosts["SALES-MFP-01"];
  assert.match(run("ping 10.20.3.43"), /Request timed out/);
  run("configure"); run("vlan 30 untagged 22");
  assert.equal(h.ip, "10.20.14.87");
  assert.equal(N.hostLive(net, h), false, "a users' address in the printers' VLAN goes nowhere");
  run("interface 22 disable"); run("interface 22 enable");
  assert.equal(h.ip, "10.20.3.43", "the DHCP reservation");
  assert.match(run("ping 10.20.3.43"), /10\.20\.3\.43 is alive/);
  assert.match(run("show logging -r"), /port 22 is now on-line[\s\S]*port 22 is now off-line/);
});

test("FortiOS: get system status, policies, objects, routes, the trace of the branch's traffic and the sniffer", () => {
  const { net, run, prompt, last } = cli([], "FGT-HQ-01");
  const fw = net.devices["FGT-HQ-01"];
  assert.equal(prompt(), "FGT-HQ-01 # ");
  assert.match(run("get system status"), /^Version: FortiGate-100F v7\.4\.4,build2662,240514 \(GA\.F\)[\s\S]*Hostname: FGT-HQ-01[\s\S]*Current HA mode: standalone/);
  assert.match(run("show firewall policy 12"), /edit 12\n        set name "VLC-to-HQ-apps"\n        set srcintf "to-VLC"\n        set dstintf "port1"\n        set action accept\n        set srcaddr "N-VLC-USERS"\n        set dstaddr "G-HQ-APPS"/);
  assert.match(run("get router info routing-table all"), /S\s+10\.40\.0\.0\/16 \[10\/0\] via to-VLC tunnel 198\.51\.100\.22/);
  assert.match(run("get vpn ipsec tunnel summary"), /'to-VLC' 198\.51\.100\.22:0\s+selectors\(total,up\): 1\/1/);
  assert.equal(run("get sytem status"), "Unknown action 0\nCommand fail. Return code -1");
  assert.equal(last.unknown, true);
  run("diagnose debug flow filter addr 10.20.1.52");
  assert.equal(run("diagnose debug flow trace start 10"), "", "nothing until debug is enabled");
  assert.match(run("diagnose debug enable"), /received a packet\(proto=6, 10\.40\.10\.23:52114->10\.20\.1\.52:443\) tun_id=198\.51\.100\.22 from to-VLC[\s\S]*Allowed by Policy-12:/);
  run("diagnose debug disable");
  assert.match(run("diagnose sniffer packet any 'host 10.20.1.52 and port 443' 4 4 l"), /to-VLC in 10\.40\.10\.23\.52114 -> 10\.20\.1\.52\.443: syn[\s\S]*port1 out[\s\S]*4 packets received by filter/);
  assert.match(run("execute ping 10.20.1.52"), /5 packets transmitted, 5 packets received, 0% packet loss/);
  // config mode: the prompt, a datasource check, a required attribute, move and delete
  run("config firewall policy");
  assert.equal(prompt(), "FGT-HQ-01 (policy) # ");
  run("edit 0");
  assert.equal(prompt(), "FGT-HQ-01 (0) # ");
  assert.match(run("set dstaddr H-NOPE"), /entry not found in datasource[\s\S]*value parse error before 'H-NOPE'\nCommand fail\. Return code -3/);
  assert.match(run("set colour blue"), /^command parse error before 'colour'\nCommand fail\. Return code -61$/);
  run("set srcintf to-VLC"); run("set dstintf port1"); run("set srcaddr all"); run("set dstaddr all");
  assert.match(run("next"), /Attribute 'service' MUST be set\.\nCommand fail\. Return code -56/);
  run("set service ALL"); run("set action accept"); run("next");
  assert.deepEqual(fw.fw.policies.map((p) => p.id), [1, 5, 12, 13, 14]);
  assert.ok(N.anyAny(fw));
  run("move 14 before 12");
  assert.deepEqual(fw.fw.policies.map((p) => p.id), [1, 5, 14, 12, 13]);
  run("delete 14"); run("end");
  assert.equal(N.anyAny(fw), false);
  assert.equal(prompt(), "FGT-HQ-01 # ");
  assert.equal(N.saved(fw), true, "FortiOS saves every change on its own");
});

test("FortiOS: a wrong address object sends the branch to the explicit deny, and correcting it lets policy 12 through", () => {
  const setup = [{ dev: "FGT-HQ-01", fw: "address", id: "H-ERPWEB02", set: { subnet: "10.20.1.25 255.255.255.255" } }];
  const { net, run } = cli(setup, "FGT-HQ-01");
  const fw = net.devices["FGT-HQ-01"];
  const flow = { srcintf: "to-VLC", dstintf: "port1", src: "10.40.10.23", dst: "10.20.1.52", proto: "tcp", port: 443 };
  assert.deepEqual(N.fwEval(fw, flow), { policy: 13, action: "deny" });
  assert.deepEqual(N.fwEval(fw, Object.assign({}, flow, { dst: "10.20.1.15" })), { policy: 12, action: "accept" }, "the intranet still works");
  assert.deepEqual(N.fwEval(fw, Object.assign({}, flow, { proto: "tcp", port: 3389, dst: "10.20.1.15" })), { policy: 13, action: "deny" }, "only HTTPS and PING");
  run("diagnose debug enable");
  assert.match(run("diagnose debug flow trace start 2"), /Denied by forward policy check \(policy 13\)/);
  run("config firewall address"); run("edit H-ERPWEB02"); run("set subnet 10.20.1.52/32"); run("next"); run("end");
  assert.equal(fw.fw.addresses.find((a) => a.name === "H-ERPWEB02").subnet, "10.20.1.52 255.255.255.255");
  assert.match(run("diagnose debug flow trace start 2"), /Allowed by Policy-12:/);
  // the branch router: without a source the ping leaves from the tunnel address, which policy 12 does not cover
  run("exit");
  run("ssh RTR-VLC-01"); run("enable");
  assert.match(run("ping 10.20.1.52"), /\.\.\.\.\.\nSuccess rate is 0 percent \(0\/5\)/);
  assert.match(run("ping 10.20.1.52 source GigabitEthernet0/0/1"), /Packet sent with a source address of 10\.40\.10\.1 \n!!!!!\nSuccess rate is 100 percent/);
  assert.match(run("traceroute 10.20.1.52"), /1 169\.254\.10\.1 [\s\S]*2  \*  \*  \*/, "from the tunnel address it stops at the FortiGate");
  assert.match(run("show crypto session"), /Session status: UP-ACTIVE/);
});

test("health and diagnostics are derived from the devices, and every device has its card data", () => {
  const net = N.createNet();
  for (const d of N.list(net)) {
    for (const k of ["model", "serial", "version", "mgmt"]) assert.ok(d[k], `${d.id} ${k}`);
    for (const k of ["location", "owner", "role"]) assert.ok(d[k].en && d[k].es, `${d.id} ${k}`);
    const h = N.health(net, d.id);
    assert.equal(h.tone, "ok", d.id + " healthy at the start of the shift");
    assert.ok(h.cpu > 0 && h.mem > 0 && h.temp > 0 && h.psu.length && h.uptimeText, d.id);
    assert.ok(N.diag(net, d.id, "log").length > 0, d.id + " log tail");
    const target = d.site === "VLC" ? "10.40.10.23" : "10.20.1.10";
    assert.ok(N.diag(net, d.id, "ping", target).join(" ").match(/!!!!!|is alive|5 packets received/), `${d.id} ping ${target}`);
  }
  assert.deepEqual(N.list(net).map((d) => d.id).sort(), ["FGT-HQ-01", "RTR-VLC-01", "SW-ACC-1F", "SW-ACC-2F", "SW-CORE-01"]);
  assert.deepEqual(N.health(net, "SW-ACC-1F").errors, [{ port: "7", crc: 12, inErr: 0 }]);
  N.apply(net, { dev: "SW-ACC-2F", port: "Gi1/0/22", set: { vlan: 30 } });
  assert.equal(N.health(net, "SW-ACC-2F").unsaved, true);
  assert.equal(N.health(net, "SW-ACC-2F").tone, "warn");
  assert.match(N.diag(net, "SW-ACC-2F", "trace", "10.20.1.52").join("\n"), /1 10\.20\.99\.1[\s\S]*2 10\.20\.1\.52/);
});

/* ---------- the three network desks */
test("network desks: every check, tag rule and device they name exists, and the console starts on the workstation", () => {
  const net = N.createNet();
  for (const sc of SCENARIOS.filter((s) => s.net)) {
    const keys = new Set(Object.keys(sc.state));
    for (const k of Object.keys(sc.net.flags)) assert.ok(keys.has(k), `${sc.id}: flag ${k} not in state`);
    for (const id of sc.net.devices) assert.ok(net.devices[id], `${sc.id}: device ${id}`);
    for (const r of sc.commands) {
      assert.ok(r.match || r.on, `${sc.id}/${r.id}`);
      if (r.dev) assert.ok(net.devices[r.dev], `${sc.id}/${r.id}: device ${r.dev}`);
    }
    const s = E.createSession(sc, "en");
    assert.equal(E.prompt(s), "PS C:\\Users\\it.admin> ");
    // the flags at the start are the ones the scenario declares
    for (const k of Object.keys(sc.net.flags)) assert.equal(s.state[k], sc.state[k], `${sc.id}: flag ${k} starts as declared`);
    assert.equal(E.bound(s).some((b) => b.set.status === "bad"), true, sc.id + " shows its fault in the inventory");
    assert.equal(E.bound(play(sc, sc.solution)).some((b) => b.set.status && b.set.status !== "ok"), false, sc.id + " clean once solved");
  }
  assert.equal(SCENARIOS.filter((s) => s.net).length, 4);   // v0.7b: the power supply RMA is a network desk too
});

test("desk port in err-disabled: bouncing it with the switch there or disabling BPDU Guard does not close it", () => {
  const sc = byId["net-err-disabled"];
  const pre = ["ssh SW-ACC-2F", "enable", "configure terminal", "interface Gi1/0/14"];
  const bounce = play(sc, pre.concat(["shutdown", "no shutdown"]));
  assert.equal(bounce.state.portUp, false);
  assert.ok(bounce.used.has("bounce-early"));
  assert.match(bounce.res.map((r) => r.lines.map((l) => l.text).join("\n")).join("\n"), /BPDU Guard shut it again/);
  const guard = play(sc, pre.concat(["spanning-tree bpduguard disable", "shutdown", "no shutdown", "end", "write memory", "show interfaces status"]));
  assert.equal(guard.state.portUp, true, "the user would have network…");
  assert.equal(guard.state.guardOn, false);
  assert.equal(guard.resolved, false, "…but the floor is exposed to a loop");
  const v = E.verdict(guard, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "cause-removed", minutes: 10 });
  assert.equal(v.level, "unresolved");
  // the real fix, and saving is part of it
  const unsaved = play(sc, sc.solution.slice(0, -1));
  assert.equal(unsaved.resolved, false, "not without write memory");
  assert.equal(unsaved.state.saved, false);
  const ok = play(sc, sc.solution, "es");
  assert.ok(ok.resolved);
  const v2 = E.verdict(ok, E.checkNote(sc, sc.sampleNote.es, "es"), { code: "cause-removed", minutes: 18 });
  assert.deepEqual([v2.level, v2.points], ["resolved", 100]);
  const v3 = E.verdict(ok, E.checkNote(sc, sc.sampleNote.es, "es"), { code: "workaround", minutes: 18 });
  assert.equal(v3.level, "observations");
  assert.equal(C.confirmState(sc, bounce), "failed");
  assert.equal(C.confirmState(sc, ok), "ok");
});

test("printer in the wrong VLAN: a static IP does not bring it back, the VLAN on the right switch and a renewed lease do", () => {
  const sc = byId["net-wrong-vlan"];
  const st = play(sc, ["onsite printer static 10.20.3.43", "ssh SW-CORE-01", "ping 10.20.3.43", "exit", "Get-Printer -ComputerName PRT-SRV01 -Name SALES-MFP-01"]);
  assert.equal(st.resolved, false);
  assert.match(st.res[2].lines.map((l) => l.text).join("\n"), /Success rate is 0 percent/);
  assert.match(st.res[4].lines.map((l) => l.text).join("\n"), /Offline/);
  // fixing the VLAN with the static IP still on: it prints, but the reservation is bypassed, so the ticket stays open
  const both = play(sc, ["onsite printer static 10.20.3.43"].concat(sc.solution.slice(0, 11), ["ping 10.20.3.43"]));
  assert.equal(both.state.vlanOk, true);
  assert.equal(both.state.printerOk, false);
  assert.equal(both.resolved, false);
  // changing the VLAN without a renewal leaves the printer on its old lease
  const stale = play(sc, sc.solution.slice(0, 11).concat(["Get-DhcpServerv4Lease -ComputerName DC01 -ScopeId 10.20.3.0"]));
  assert.equal(stale.state.printerOk, false);
  assert.match(stale.res[11].lines.map((l) => l.text).join("\n"), /InactiveReservation/);
  // a bounce of port 22 renews the lease just as well as the printer's menu
  const bounce = play(sc, sc.solution.slice(0, 9).concat(["interface 22 disable", "interface 22 enable", "exit", "exit", "ping 10.20.3.43"]));
  assert.ok(bounce.resolved, JSON.stringify(bounce.state));
  // forgetting write memory: running ≠ startup
  const nosave = play(sc, sc.solution.filter((c) => c !== "write memory"));
  assert.equal(nosave.state.saved, false);
  assert.equal(nosave.resolved, false);
  const ok = play(sc, sc.solution);
  assert.ok(ok.resolved);
  assert.deepEqual(E.verdict(ok, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "config-fixed", minutes: 12 }).level, "resolved");
  assert.equal(E.verdict(ok, E.checkNote(sc, "Fixed the printer.", "en"), { code: "workaround", minutes: 12 }).level, "observations");
});

test("branch blocked by the firewall: an any-any rule is never the fix; the corrected object is, proved with the branch's traffic", () => {
  const sc = byId["net-fortigate-branch"];
  const anyAny = ["ssh FGT-HQ-01", "config firewall policy", "edit 0", "set srcintf to-VLC", "set dstintf port1", "set srcaddr all", "set dstaddr all", "set service ALL", "set action accept", "next"];
  const below = play(sc, anyAny.concat(["end"]));
  assert.equal(below.state.anyAny, true);
  assert.equal(below.state.appOk, false, "below the explicit deny it changes nothing");
  assert.equal(C.confirmState(sc, below), "failed");
  const above = play(sc, anyAny.concat(["move 14 before 12", "end", "diagnose debug flow trace start 4", "diagnose debug enable", "exit", "onsite vlc retry"]));
  assert.equal(above.state.appOk, true, "the branch gets through…");
  assert.equal(above.resolved, false, "…but the ticket stays open");
  assert.equal(E.verdict(above, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "config-fixed", minutes: 15 }).level, "unresolved");
  // the right object with the any-any still there: still open until it is deleted
  const fixFirst = play(sc, anyAny.concat(["move 14 before 12", "end"]).concat(sc.solution.slice(1)));
  assert.equal(fixFirst.state.rightFix, false, "the any-any above 12 still catches the traffic");
  assert.equal(fixFirst.resolved, false);
  E.run(fixFirst, "config firewall policy"); E.run(fixFirst, "delete 14"); E.run(fixFirst, "end");
  E.run(fixFirst, "diagnose debug flow trace start 4");
  assert.ok(fixFirst.resolved);
  // verifying from the branch router works too, with the right source
  const rtr = play(sc, sc.solution.slice(0, 13).concat(["exit", "ssh RTR-VLC-01", "enable", "ping 10.20.1.52", "ping 10.20.1.52 source GigabitEthernet0/0/1"]));
  assert.equal(rtr.resolved, true);
  assert.equal(rtr.resolvedAt, 18, "the ping without a source proves nothing");
  const ok = play(sc, sc.solution, "es");
  assert.ok(ok.resolved);
  const note = E.checkNote(sc, "Objeto H-ERPWEB02 con IP incorrecta 10.20.1.25, corregido a 10.20.1.52; debug flow muestra Allowed by Policy-12. Sin referencia.", "es");
  assert.deepEqual(note.missing, ["la referencia del cambio (cambio de emergencia vinculado a CHG-4471)"], "the change reference is part of the note");
});

test("the ticket-page actions of the network desks run anywhere, even inside a device's CLI", () => {
  const sc = byId["net-err-disabled"];
  const s = play(sc, ["ssh SW-ACC-2F", "enable", "configure terminal"]);
  const r = E.act(s, "remove");
  assert.equal(r.command, "onsite remove-switch");
  assert.equal(s.state.switchGone, true);
  assert.equal(E.prompt(s), "SW-ACC-2F(config)#", "the CLI session is still where it was");
  assert.equal(s.unknown, 0);
  // the network room's CLI attached to the ticket: another terminal on the same devices, read by the same rules
  const term = N.terminal(s.net);
  N.connect(term, "SW-ACC-2F");
  ["enable", "configure terminal", "interface Gi1/0/14", "shutdown", "no shutdown"].forEach((c) => E.run(s, c, { term }));
  assert.equal(s.state.portUp, true);
  assert.ok(s.used.has("back"));
});
