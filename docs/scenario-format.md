# Scenario format

Scenarios live in `public/assets/scenarios.js`. Each one is plain data that the engine (`public/assets/engine.js`) plays. Adding a desk means adding one object and its tests; the interface does not change.

## Fields

| Field | What |
|---|---|
| `id` | Short slug, used in the URL (`#/desk/<id>`) and as the progress key |
| `level`, `minutes`, `topic` | Level 1 (first-line support) or 2 (second line), estimated time, topic label `{en, es}` |
| `title` | `{en, es}` |
| `guide` | Link to the related guide on the website (`https://inigogonzalezgarcia.github.io/guias/<slug>.html`) |
| `machine` | `host`, `user`, `domain`, `shell` (`powershell` or `bash`, used for the "not recognised" message) and `prompt` |
| `ticket` | `id`, `from`, `priority` (P1-P3), `subject` and `body` `{en, es}` |
| `intro` | What the engineer has (access, servers, constraints) `{en, es}` |
| `state` | The initial flags, e.g. `{ locked: true, taskDisabled: false }` |
| `commands` | Rules, tried in order; the first that matches wins (see below) |
| `events` | Rules that fire at the start of the next command when their `when` matches (e.g. "the account locks again") |
| `goal` | Flags that must all be true for the ticket to be resolved |
| `stages` | Investigate / fix / verify checklist: each stage is done when its `when` flags match |
| `resolved` | Message shown when the goal is met `{en, es}` |
| `hints` | Ordered hints `{en, es}`; each one used costs 10 points |
| `note` | Elements a good work note must contain: `label {en, es}`, `any` (keywords in English or Spanish, accents ignored) and `kb` (the knowledge base section it fills: `cause`, `fix`, `verify` or `followup`) |
| `solution` | A reference path; the tests play it and expect the ticket to be resolved exactly at the last command |
| `sampleNote` | An example work note `{en, es}`; the tests expect it to cover every note element |
| `requester` | The person on the ticket: `name`, `team`, `location` (text or `{en, es}`), `user` and `device` |
| `asset` | The card for what the ticket is about: `title {en, es}` and `fields` (see below) |
| `actions` | Buttons on the ticket page: `id`, `label {en, es}`, `cmd` (the console command it runs) and an optional `when` |
| `codes` | The resolution codes that fit this ticket (ids from `CODES` in the engine); the first one is suggested when another is chosen |
| `bind` | Optional: what the ticket changes in the shared directory and inventory while it is open (see below) |
| `contact` | The conversation with the requester (v0.6.1, see below) |
| `desktop` | Optional: the user's machine for "Go to the desk": apps and an event log (see below) |
| `net` | Optional (v0.7a): a network desk, whose console is the device CLI simulator (see below) |
| `ship` | Optional (v0.7b): a desk closed with a shipment; flags read from the ticket's shipments (see [shipping.md](shipping.md)) |
| `remarks` | Optional (v0.7b): `[{when, text}]`, things done badly on the way that do not block the ticket: each one matching at close is listed and costs 10 points |

## Command rules

```js
{ id: "unlock", match: /^unlock-adaccount\b.*\bmgarcia\b/, when: { taskDisabled: true }, unless: { ... },
  set: { locked: false }, out: ["console line", "..."], say: { en: "...", es: "..." }, error: false }
```

- `match`: regular expression, case-insensitive, tested against the command with spaces collapsed. Write it to accept the common variants (PowerShell and cmd, with or without parameters names).
- `when` / `unless`: flags that must (or must not all) match.
- `out`: console output, the same in both languages (consoles are in English). `{user}`, `{host}` and `{domain}` are replaced, and (v0.8) `{$1}`…`{$9}` by the groups `match` captured.
- `say`: narration in the user's language, shown in a different colour. Use it to explain what the output means, never to give the next command away.
- `error: true` shows the output as an error.

Built-in commands: `help`, `hint`, `clear` / `cls`, `ticket`. Anything that matches no rule shows the shell's "not recognised" message and counts as an unknown command (2 points each after the first three).

## Asset card and actions

```js
asset: { title: { en: "User account · mgarcia", es: "Cuenta de usuario · mgarcia" }, fields: [
  { label: { en: "Account", es: "Cuenta" }, states: [
    { when: { locked: true }, value: { en: "Locked", es: "Bloqueada" }, tone: "bad" },
    { value: { en: "Unlocked", es: "Desbloqueada" }, tone: "ok" }] },
  { label: { en: "Password last set", es: "Último cambio de contraseña" }, value: "19/10/2026 08:12" },
] },
actions: [{ id: "unlock", label: { en: "Unlock account", es: "Desbloquear cuenta" }, cmd: "Unlock-ADAccount mgarcia", when: { locked: true } }],
```

- A field is a fixed `value`, or `states`: the first whose `when` matches the session is shown, and the last one (without `when`) is the default. `tone` is `ok`, `warn`, `bad` or `muted`.
- The tests expect at least one `bad` field at the start and none once the reference solution has run, so the card shows the fix.
- An action runs its `cmd` through the engine, so the button and the command always give the same result (including the traps: unlocking from the card before removing the cause locks the account again). The tests check every action is understood whenever it is offered.

## The shared world: `bind`

The directory and the inventory (`public/assets/world.js`) are shared by every desk. A desk says how its state shows there while the ticket is open:

```js
bind: [
  { kind: "user", id: "mgarcia", states: [{ when: { locked: true }, set: { locked: true, badPwd: 5 } }, { set: { locked: false, badPwd: 0 } }] },
  { kind: "printer", id: "RECEPCION-MFP", states: [{ when: { cleared: false }, set: { status: "bad", jobs: 14 }, note: { en: "...", es: "..." } }, { set: { status: "ok", jobs: 0 } }] },
],
```

- `kind` is `user`, `server`, `printer` or `network` (a device of netcli.js), and `id` must exist in the world. The first matching state wins; the last one, without `when`, is the default. `status` is `ok`, `warn` or `bad`.
- While the ticket is assigned, a directory command for a bound user that the desk understands (for example `Unlock-ADAccount mgarcia`) is run by the ticket, so the directory and the console always agree, traps included. While it is not assigned, changes to that account wait for the ticket.

## The desktop: `desktop`

```js
desktop: {
  apps: [{ id: "network", icon: "⇄", title: { en, es }, look: "ipconfig /all", fields: [ /* like the asset card */ ],
           actions: [{ id, label: { en, es }, cmd, when }], page: { url, states: [{ when, title, text, tone }] } }],
  log: [{ when, level: "warning", time, source, id, text: { en, es } }],
  logNote: { en, es },
},
```

- Opening an app runs its `look` command (what you would type to see the same thing) and each button runs its `cmd`, all through the engine and shown in the console. The tests check that every one is understood whenever it is offered, that something shows as wrong at the start and nothing once solved.
- `log` is the Event Viewer: realistic source and event IDs only. `logNote` explains an empty or unhelpful log.

## Network desks: `net` (v0.7a)

A desk with `net` runs its console through the device CLI simulator ([public/assets/netcli.js](../public/assets/netcli.js), commands in [netcli.md](netcli.md)). The console starts on the workstation ADM-WS01 (`machine` is that workstation), and `ssh <device>` opens a session on a switch, the router or the firewall.

```js
net: {
  devices: ["SW-ACC-2F"],                       // the devices this ticket owns while it is open (network room and inventory)
  setup: [                                      // the fault, applied on top of the healthy Contoso network
    { host: "SW-DESK-214", set: { kind: "switch", mac: "0c80.6311.a2b4", dhcp: false, bpdu: true, behind: ["PC-FIN-027"] } },
    { dev: "SW-ACC-2F", port: "Gi1/0/14", set: { err: "bpduguard" }, peer: "SW-DESK-214" },
    { dev: "SW-ACC-2F", log: [{ ago: 57540, text: "%PM-4-ERR_DISABLE: bpduguard error detected on Gi1/0/14, ..." }] },
    { dev: "FGT-HQ-01", fw: "address", id: "H-ERPWEB02", set: { subnet: "10.20.1.25 255.255.255.255" } },
  ],
  flow: { srcintf: "to-VLC", dstintf: "port1", src: "10.40.10.23", sport: 52114, dst: "10.20.1.52", proto: "tcp", port: 443 },  // optional: the traffic the firewall sees
  flags: {                                      // state flags read from the devices after every command
    portUp: { kind: "port", dev: "SW-ACC-2F", port: "Gi1/0/14", status: "connected" },
    saved: { kind: "saved", dev: "SW-ACC-2F" },
  },
},
```

- `setup` operations: `{ host, set, renew }` creates or changes a host (PC, phone, printer, small switch) and can renew its DHCP lease; `{ dev, port, set, peer }` changes a port and what is plugged into it; `{ dev, log }` adds log lines (`ago` in seconds before 09:41); `{ dev, fw: "policy" | "address" | "addrgrp", id, set }` changes the firewall. Setup is saved (startup = running) unless the operation has `unsaved: true`.
- `flags` checks: `port` (`status`: connected, notconnect, disabled or err-disabled; `vlan`; `guard`: BPDU Guard on; `admin`), `saved` (running = startup; FortiOS always saves), `host` (`ip`, `dhcp`, `live`: plugged into an up port in the VLAN that matches its address), `flow` (`allowed`, or `policy`: allowed by that policy id) and `anyany` (an enabled accept policy from all to all with service ALL). Every flag must also be in `state`, with its value at the start.
- Command rules with `match` run on the workstation, or anywhere with `anywhere: true` (the `onsite` requests: things Facilities or a branch do for you). A rule can change the net with `net: [ops]` (the same operations as `setup`, applied live: a port that comes up logs it, BPDU Guard trips, a host renews its lease).
- Command rules with `on` react to what a device did: `on` is a pattern tested against the device's tags, such as `show logging`, `no shutdown Gi1/0/14`, `err-disabled Gi1/0/14`, `untagged 22 30`, `save`, `debug flow denied 13` or `ping 10.20.1.52 ok source` (see netcli.md), and `dev` limits it to one device. The first matching rule for each tag runs (`set`, `say`, `out`). They are how a desk narrates and marks the investigation and verification steps; the tempting fix is one of them (`contact.tempting`).
- `bind` can use `kind: "network"` with a device id, like servers and printers.
- Actions on the ticket page run their `cmd` on the workstation even while the console is inside a device, so on-site actions always work. The network room's CLI for a ticket's device runs on another terminal over the same net and goes through the same rules.

## Shipment desks: `ship` (v0.7b)

`ship.flags` are checks over the ticket's shipments (type, serial, state, escrow, data, vendor, contract, destination, evidence, checklist items) or the inventory state of an asset; `ship ...` lines go to the shipments tool and rules with `on` react to its tags (`ship state rma transit`, `ship mark 3FJ7WR3 stock`...). Every detail is in [shipping.md](shipping.md). Shipping steps take simulated hours: the app charges them to the SLA unless the ticket is pending, so these desks expect *Pending vendor* while the courier works.

## Contact: `contact`

```js
contact: {
  who: { name: "Nuria Vega", team: { en, es } },     // optional: who answers when the requester is not a person (Reception, a report)
  fixed: { encrypted: true, escrowed: true },         // optional: when the fix counts as done; default: the "fix" stage's flags
  tempting: ["unlock-early"],                         // ids of the command rules of the tempting fix
  temptingWhen: { taskDisabled: false },              // optional: flags that must still hold for "it fails again" to be true
  questions: [
    { id: "scan", kind: "useful", text: { en, es }, answer: { en, es }, clue: { en, es } },
    { id: "restart", kind: "neutral", text: { en, es }, answer: { en, es } },
    { id: "password", kind: "bad", password: true, text: { en, es }, answer: { en, es }, why: { en, es } },
    { id: "confirm", kind: "useful", requires: "fixed", text: { en, es }, answer: { en, es }, failed: { en, es } },
  ],
},
```

- 5 to 7 questions in both languages: at least 2 *useful* (each with a `clue` that the console does not give and that never contradicts its output), 1 *neutral* and 1 *bad* (with `why`); asking for the password must be one of the bad options (`password: true`). Mix the kinds in the list: it is shown in this order.
- One question has `requires: "fixed"` (*Ask to confirm*): it appears once the fix is in (`fixed`) or once a `tempting` rule has run and `temptingWhen` still matches; the requester answers `answer` when it is fixed and `failed` otherwise. Pick a tempting path after which the user really would see it fail (not one that works for now).
- Asking never changes the scenario state. Each question costs one minute of SLA; the logic is in `public/assets/comms.js` and the tests in `tests/comms.test.js` check every desk (including that each tempting path gets `failed` and the solution gets `answer`).
- In `scenarios.js` the first 18 desks take their `contact` from the `CONTACT` table at the end of the file; the network desks write the field inline.

## Closing a ticket

- **SLA:** it starts when the user assigns the ticket: 20 minutes for P1, 30 for P2 and 45 for P3. Since v0.6 the ticket page has workflow states (New, In progress, Pending user, Pending vendor, Closed), kept per ticket in the browser (`sd.work[<id>]`) and handled by the pure module `public/assets/workflow.js`: while a ticket is pending the SLA is paused, *Unassign* sends it back to New with the SLA still running, and the minutes passed to `verdict` are the SLA minutes without the pauses. Scenarios need nothing new for this.
- **Note to the user (v0.6.1):** a second note, marked x/5 apart from the work note by `checkUserNote` in `comms.js`. It never changes the verdict or the points; it gives a separate communication bonus.
- **Resolution codes:** root cause removed, configuration corrected, space or quota freed, device brought into compliance, workaround, hardware repaired, replaced or returned (v0.7b), user guidance, no fault found.
- **Result** (`verdict` in the engine), in three levels:
  - *Not resolved* when the goal is not met: it lists the stages not done, the ticket stays open and each early close costs 10 points later.
  - *Resolved with observations* when it is fixed but the note misses something, the code does not fit, the SLA was missed, it was closed early before, or one of the desk's `remarks` matches.
  - *Resolved* when none of that happened.

## Scoring

100 points, minus 10 per hint, minus 2 per unknown command after the first three, minus 10 per note element missing and minus 10 for a note under 15 words. On the ticket page, also minus 10 for a resolution code that does not fit, minus 10 outside the SLA and minus 10 per time it was closed before it was fixed. 90+ is three stars, 70+ two, 40+ one.

## Writing a good desk

- Base it on a real, common ticket, with one cause that the console can reveal and one tempting wrong fix (unlocking without finding the cause, restarting the spooler without clearing the file, raising a quota the licence does not allow).
- Make the user prove the fix (the `verify` stage) before the ticket can be closed.
- Keep the company, people and outputs fictional; no real tenant, domain or person.
- Add tests: the reference solution, and at least one wrong path that must not resolve the ticket.
