# Labs by area (labs.js) and the profile (profile.js)

## Labs

[public/assets/labs.js](../public/assets/labs.js) (`window.SDLabs`) holds five labs: free practice with no SLA and no score. Each one is a console over its **own copy** of a simulator engine and 5-6 tasks that tick themselves from the lab's state. Nothing in a lab reaches the tickets, the Directory or the network room.

| Lab | kind | Engine | Starts with |
|---|---|---|---|
| `ad` | `ad` | `world.js` (`Wd.run`) | a fresh directory; jruiz locked out (eromero unlocked) |
| `network` | `net` | `netcli.js` (`NN.exec` on a terminal from ADM-WS01) | the healthy Contoso network |
| `windows` | `rules` | `engine.js` with the rule set `WIN` (PC-LAB-01, PowerShell) | a healthy PC |
| `m365` | `rules` | `engine.js` with `M365` (ADM-WS01: Microsoft Graph and Exchange Online PowerShell) | not connected |
| `linux` | `rules` | `engine.js` with `LNX` (lab-lnx01, RHEL 9, bash, your account and sudo) | /var at 74 %, HTTPS not allowed |

A lab definition: `{ id, area, kind, sc (rules only), title, summary, tasks: [{ id, label {en, es}, hint (one way to do it), check(lab) }] }`.

- `check(lab)` reads state only: the directory (`lab.world`), the devices (`NN.port`, `NN.saved` on `lab.net`), the rule flags (`lab.sess.state`), or `lab.seen`, the tags of what was looked up (`search-locked`, `user:<sam>`, and `<device>|<netcli tag>` such as `SW-ACC-2F|show mac address-table address 6c4b.9042.1a24 Gi1/0/5 140`). So reading the MAC only on the core (the uplink) does not finish the task, a port changed but not saved does not finish *save*, and a firewall rule added at runtime only and lost at the reload does not finish *firewall*.
- The rule sets use the scenario format (docs/scenario-format.md). Since v0.8 a rule's `out` and `say` can use `{$1}`…`{$9}`, the groups its `match` captured (for example the name in `nslookup <name>`).

Functions: `create(id, lang)`, `prompt(lab)`, `run(lab, line, lang)` → `{lines, clear}`, `tasks(lab, lang)` → `[{id, label, hint, done}]`.

### Progress (`sd.labs`)

`{ labId: { done: [task ids], day: "YYYY-MM-DD" (last new task), completed: day or null } }`, kept in the browser like the other growth data and removed with the account.

- `record(store, labId, doneIds, day)` → `{store, fresh, completedNow}`: tasks are only added, never taken away (a reset sandbox keeps the ticks until *Reset the lab*);
- `reset(store, labId)`, `normalise(store)` (drops unknown labs and tasks), `progressOf(store, labId)` → `{done, total, complete, completed}`, `summary(store)`.

## Profile and career

[public/assets/profile.js](../public/assets/profile.js) (`window.SDProfile`) computes everything from `{ desks, levels, progress, activity, labs }`; it stores nothing.

- `DESK_AREA`: the area of every desk. `aggregate(input)` → per area `{desks, solved, avgPoints (best results), comms (average userNote of the area's closes), labDone, labTotal, skill}` and totals. `skill` (0-100) = 75 % share of the area's tickets solved + 25 % share of its lab's tasks; areas without a lab count only tickets; `itsm` is the average user-note mark × 20.
- `CAREER`: `l1` Service Desk L1, `l2` Service Desk L2 / Desktop, `sys` Sysadmin / Infrastructure, `netcloud` Network / Cloud, each with its areas, desks and labs (every desk and lab in exactly one step; every level-1 desk in `l1`). `career(input)` → the steps with `done/total/pct/status` (`done`, `current` = the first not finished, `later`) and `next`: in the current step, a lab first while none of its tickets is solved, then its unsolved tickets (level 1 first), then its unfinished labs; `null` when everything is done.
- `radar(values, size)`: axes from the top clockwise, the rings and the polygon, as SVG coordinates (the app draws it with `createElementNS`, no library and no inline style).
- `toMarkdown(input, {lang, name, date, site, deskTitle, deskTopic, labTitle})` and `fileName(date)`: the downloadable summary, which starts and ends with *Practice in a simulator, not work experience.* / *Práctica en un simulador, no experiencia laboral.*
