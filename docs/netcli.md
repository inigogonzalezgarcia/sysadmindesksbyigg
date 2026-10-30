# The network CLI simulator (netcli.js)

[public/assets/netcli.js](../public/assets/netcli.js) is a DOM-free model of Contoso's network and a command line for each device. The network room and the network desks use it, and `tests/net.test.js` checks it. Everything is fictional: the company, the people, the serial numbers, private addresses (10.20.0.0/16 head office, 10.40.0.0/16 Valencia) and documentation ranges for the internet side (203.0.113.0/24, 198.51.100.0/24).

## The devices

| Device | What | OS | Management IP |
|---|---|---|---|
| SW-CORE-01 | Core switch, routes every head office VLAN (SVIs, `ip helper-address` to DC01), LLDP on | Cisco Catalyst 9300-24P, IOS XE 17.9.5 | 10.20.99.1 |
| SW-ACC-2F | Access switch, 2nd floor (Finance) | Cisco Catalyst 9200L-24P-4X, IOS XE 17.9.5 | 10.20.99.12 |
| SW-ACC-1F | Access switch, 1st floor (Sales and Marketing) | HP Aruba 2930F-24G-PoE+-4SFP+ (JL261A), ArubaOS-Switch WC.16.11.0021 | 10.20.99.13 |
| RTR-VLC-01 | Valencia branch router, IPsec tunnel (Tunnel0) to head office | Cisco ISR 4331, IOS XE 17.9.5 | 10.40.0.1 |
| FGT-HQ-01 | Head office firewall: internet, the tunnel to Valencia (`to-VLC`) | FortiGate 100F, FortiOS 7.4.4 | 10.20.99.5 |

VLANs (one /24 each, gateway .1 on the core): 10 SERVERS 10.20.1.0, 30 PRINTERS 10.20.3.0, 99 MGMT 10.20.99.0, 140 USERS 10.20.14.0, 150 VOICE 10.20.15.0, 999 PARKING (unused ports, shut down). DHCP runs on DC01 with reservations by MAC (SALES-MFP-01 10.20.3.43, FIN-MFP-01 10.20.3.42, LBL-FIN-01 10.20.3.61).

Hosts (PCs, IP phones, printers, servers, a small desk switch) are plugged into ports. Nothing derived is stored: the MAC table, CDP and LLDP neighbours, ARP, `status` of a port, whether a host is reachable and which firewall policy a flow matches are computed from the data on every command. So:

- a port comes up only if it is enabled, not err-disabled and something is plugged in; with BPDU Guard on and a host that sends BPDUs behind it, it goes err-disabled again at once, with the real log messages;
- a host keeps its DHCP lease when you change its port's VLAN, and asks again only when its link goes down and up (or when it renews);
- a host is reachable only if its port is up and its address belongs to the VLAN it is in; traffic between Valencia and head office goes through the FortiGate's policies, in order (first match, then the implicit deny, policy 0);
- the switches keep a running and a startup configuration: a change makes them differ (Health shows *Unsaved changes*) until `write memory` / `copy running-config startup-config`. FortiOS saves on its own.

## The workstation (ADM-WS01)

The network desks start here, with the prompt `PS C:\Users\it.admin>`.

- `ssh <device>`, `ssh it.admin@<device or IP>`, `ssh -l it.admin <device>`: opens a session (TACACS+ is simulated: no password prompt).
- `ping <name or IP>`, `tracert <name or IP>`, `Test-NetConnection <name>`: from 10.20.14.50.
- Anything else, unless the desk has a rule for it (e.g. `Get-DhcpServerv4Lease`, `onsite`), gets PowerShell's "is not recognized" message.

`exit` from a device's first level closes the session and returns here.

## Cisco IOS XE (SW-CORE-01, SW-ACC-2F, RTR-VLC-01)

Modes: user `>` → `enable` → privileged `#` → `configure terminal` → `(config)#` → `interface <if>` → `(config-if)#` (and `vlan <n>` → `(config-vlan)#`). `end` goes back to `#`, `exit` one level up. `do <command>` runs an exec command from config mode.

Keywords take unique abbreviations (`sh int status`, `conf t`, `int gi1/0/14`, `sw acc vl 30`, `wr`), interface names too (`gi1/0/14`, `Gi 1/0/14`, `te1/1/1`). Answers like the real CLI: `% Invalid input detected at '^' marker.` (with the `^` under the first wrong word, prompt included), `% Incomplete command.`, `% Ambiguous command:  "sh i"`. `?` lists what can follow. Output filters: `| include`, `| exclude`, `| begin`, `| section` (abbreviated too).

| Mode | Commands |
|---|---|
| user and privileged | `show version`, `show clock`, `show environment [power | all]` (switches, v0.7b: power supply slots 1A/1B with PID, serial, status, Sys Pwr and PoE Pwr; fans and temperature), `show interfaces status [err-disabled]`, `show interfaces <if> [status \| switchport]`, `show ip interface brief`, `show vlan [brief]`, `show mac address-table [dynamic \| interface <if> \| address <H.H.H> \| vlan <n>]`, `show cdp neighbors [detail]`, `show lldp neighbors`, `show spanning-tree [vlan <n>]`, `show errdisable recovery`, `ping <host> [source <if or IP>]`, `traceroute <host>`, `terminal length 0`, `exit` / `logout` |
| privileged only | `show logging`, `show running-config [interface <if>]`, `show startup-config`, `show ip arp [<ip>]` and `show ip route` (core and router), `show crypto session` (router), `configure terminal`, `copy running-config startup-config`, `write memory`, `clear counters [<if>]`, `clear mac address-table dynamic`, `ssh -l <user> <host>`, `disable` |
| config | `interface <if>`, `vlan <n>`, `errdisable recovery cause <cause>`, `no errdisable recovery cause <cause>`, `end`, `exit`, `do …` |
| config-if | `description <text>`, `no description`, `shutdown`, `no shutdown`, `switchport access vlan <n>` (creates a missing VLAN, as IOS does), `switchport mode access \| trunk`, `switchport voice vlan <n>`, `no switchport voice vlan`, `spanning-tree bpduguard enable \| disable`, `no spanning-tree bpduguard`, `[no] spanning-tree portfast`, `interface <if>`, `end`, `exit` |

`no shutdown` does not take a port out of err-disabled: `shutdown` first. MAC addresses only in Cisco's dotted form (`a45d.360c.197e`). Without a source, the router pings from the interface the packet leaves by (towards head office, Tunnel0 169.254.10.2).

## ArubaOS-Switch (SW-ACC-1F)

Prompts: `SW-ACC-1F#`, `(config)#`, `(vlan-30)#`, `(eth-22)#`. Wrong input: `Invalid input: <word>`; `Incomplete input: …`; `Ambiguous input: …`. The `show` commands work in every context, as on the real switch.

| Context | Commands |
|---|---|
| any | `show interfaces [brief] [<ports>]`, `show interfaces <port>` (counters, FCS errors), `show vlans`, `show vlans <id>`, `show vlans ports <ports> [detail]`, `show mac-address [<MAC> \| <port> \| vlan <id>]` (MAC as `a45d36-0c197e`, `a45d360c197e` or with colons), `show lldp info remote-device [<port>]`, `show cdp neighbors`, `show running-config`, `show config` (the saved one), `show logging [-r]`, `show system`, `show version`, `show ip`, `ping <host>`, `traceroute <host>`, `write memory` |
| manager | `configure [terminal]`, `exit` / `logout` |
| config | `vlan <id>`, `vlan <id> untagged \| tagged <ports>`, `vlan <id> name <name>`, `no vlan <id> untagged <ports>`, `interface <ports>`, `interface <ports> disable \| enable`, `interface <ports> name <text>`, `exit`, `end` |
| vlan | `untagged <ports>`, `no untagged <ports>`, `tagged <ports>`, `name <text>`, `exit`, `end` |
| eth | `disable`, `enable`, `name <text>`, `no name`, `exit`, `end` |

HP's words: a user port is **untagged** in one VLAN (making it untagged in another takes it out of the first); an uplink is **tagged** in several. Ports: `22`, `1-5,7`.

## FortiOS (FGT-HQ-01)

Prompts: `FGT-HQ-01 #`, `(policy) #`, `(12) #`, `(address) #`, `(H-ERPWEB02) #`. An unknown command answers `Unknown action 0` / `Command fail. Return code -1`; inside `config`, `command parse error before '<word>'` / `Return code -61`; a name that does not exist, `entry not found in datasource` / `Return code -3`; a policy without an attribute it needs, `Attribute 'service' MUST be set.` / `Return code -56`. Keywords take unique abbreviations (`get sys status`, `diag debug enable`).

| Where | Commands |
|---|---|
| top | `get system status`, `get router info routing-table all`, `get vpn ipsec tunnel summary`, `show firewall policy [<id>]`, `show firewall address [<name>]`, `show firewall addrgrp [<name>]`, `config firewall policy \| address \| addrgrp`, `execute ping <host>`, `execute traceroute <host>`, `execute log display`, `diagnose sniffer packet <interface> '<filter>' [<verbosity> <count> l]`, `diagnose debug flow filter addr <ip>`, `… filter dport <port>`, `… filter clear`, `diagnose debug flow show function-name enable`, `diagnose debug flow trace start <n>`, `… trace stop`, `diagnose debug enable \| disable \| reset`, `exit` |
| config table | `edit <id or name>` (`edit 0`: a new policy with the next id), `show`, `move <id> before \| after <id>`, `delete <id or name>`, `end` |
| edit | `set <attribute> <values>` (policy: name, srcintf, dstintf, srcaddr, dstaddr, service, action, status, schedule, logtraffic, nat, comments; address: subnet `a.b.c.d m.m.m.m` or `/bits`, comment; addrgrp: member, comment), `unset <attribute>`, `append member <name>`, `show`, `get`, `next`, `end`, `abort` |

`diagnose debug flow` traces the traffic the branch keeps sending (a Valencia PC to the ERP over HTTPS, or the desk's `net.flow`): it prints once `diagnose debug enable` is on and a trace has been started, with `Denied by forward policy check (policy N)` or `Allowed by Policy-N:`. `execute ping` leaves from the FortiGate itself, so it does not go through the policies.

## Tags: what a desk can react to

Each command returns tags for the device it ran on; desks react to them with rules that have `on` (see scenario-format.md). The main ones:

- IOS: `show logging`, `show interfaces status`, `show interfaces status err-disabled`, `show interfaces <short>`, `show mac address-table address <mac> <port> <vlan>` (or `none`), `show cdp neighbors`, `show lldp neighbors`, `shutdown <short>`, `no shutdown <short>`, `err-disabled <short>` (BPDU Guard tripped), `access vlan <short> <n>`, `bpduguard <short> on|off`, `errdisable recovery <cause>`, `save` (or `save nochange`), `ping <ip> ok|fail[ source]`, `show ip arp <ip>`;
- HP: `show mac-address <mac> <port> <vlan>`, `show mac-address port <port>`, `show vlans ports <ports>`, `untagged <port> <vlan>`, `disable <port>`, `enable <port>`, `save`, `ping <ip> ok|fail`;
- FortiOS: `show firewall policy[ <id>]`, `show firewall address[ <name>]`, `show firewall addrgrp[ <name>]`, `policy new|set <id>`, `policy move <id>`, `policy delete <id>`, `address set <name>`, `debug flow allowed|denied <policy>`, `sniffer allowed|denied|nomatch`, `ping <ip> ok|fail local`;
- every device: `connect` and `disconnect`; the workstation: `ping <ip> ok|fail`.

## API

`createNet(setup)`, `terminal(net)`, `connect(term, id)`, `exec(term, line)` → `{lines, tags, unknown, closed}`, `prompt(term)`, `depth(term)`, `health(net, id)`, `diag(net, id, "ping" | "trace" | "log", target)`, `check(net, spec)`, `apply(net, op)`, plus helpers (`status`, `saved`, `macTable`, `reach`, `fwEval`, `anyAny`, `parseMac`).

## Power supplies (v0.7b)

The Catalyst switches have power supply slots (`power`: SW-ACC-2F, a C9200L with PWR-C5-600WAC in 1A and an empty 1B; SW-CORE-01, two PWR-C1-715WAC). A failed supply shows as `Disabled` / `Bad` in `show environment power`, `FAN PS-2 is NOT OK` in `show environment all`, and in Health (`psu`, `psuFailed`, a `psu` note and the tone *warn*: the switch runs, but the redundancy is lost). A desk changes them with the setup or rule operation `{ dev, power: [{ slot, pid, serial, status, watts }] }` and reads them with the check `{ kind: "power", dev, slot, status, serial }`. The tag of `show environment` is `show environment power`. Live log lines given as text (`log: ["..."]` in a rule) are stamped with the current time.
