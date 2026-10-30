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

### The sandbox across a reload (v0.9)

The lab's sandbox (its world, network and open SSH sessions, or rule session, the tags in `seen`, the console lines and the command history) is kept in `sd.labbox` (`{labId: envelope}`) by persist.js: `labToJSON(lv)` and `labFromJSON(id, snap, lang)`, which refuses a sandbox for another lab or kind and rebuilds the world on top of this version's users. *Reset the lab* removes it with the ticks.

### The full shift (v0.9b, [levels.js](../public/assets/levels.js), `sd.shifts`)

At the end of each lab, once its tasks are all done (`canStart`), the *Full shift / Turno completo* asks for four real tickets in a row against a shift timer.

- `pickShift(labId, {desks, levels, unavailable})`: the lab's areas in `NEAR` order (`ad`: AD, M365, Intune, Windows; `network`: network, hardware, Windows; `windows`: Windows, Intune, Citrix, AD; `m365`: M365, AD, Intune; `linux`: Linux, backup/SQL, network), inside each area level 1 first and then the queue's order, skipping the desks not in this version or in progress in the queue; up to `SHIFT.size` (4). The same input always gives the same shift.
- Store `{v: 1, active: {lab, desks, started (ms), results: [{id, level, points, hints, at}]} | null, done: {labId: {day, ms, results}}, log: [last 20 finished]}`, kept by the app in a persist.js envelope with the owner, so it survives a reload and another account starts clean; `normaliseShifts(store, knownDesks)` drops another format, unknown labs and desks.
- `start(store, labId, desks, now, labs)` (errors `locked`, `busy`, `running`, `desks`), `current(store)` (the next desk), `record(store, close, day)`: a close counts only if it is fixed, is the shift's next desk and happened after the start; the fourth one finishes the shift (`log`), and the first finished shift of a lab goes to `done` (75 points and the badge `shift-<lab>`, once). `abandon`, `elapsed(active, now)`, `summary(entry)` → `{tickets, minutes, avg, clean, remarks, hints}`.
- In the app: a *Full shift* panel under the lab's console (locked, preview and start, running with the timer and the four desks, or the last summary), a strip on the shift's desks with the timer, and a line in the ticket result (*Counted for the full shift (k of 4)* with a link to the next one).

## Profile and career

[public/assets/profile.js](../public/assets/profile.js) (`window.SDProfile`) computes everything from `{ desks, levels, progress, activity, labs }`; it stores nothing.

- Since v0.9b the profile also shows the level panel and the close counters from levels.js.
- `DESK_AREA`: the area of every desk. `aggregate(input)` → per area `{desks, solved, avgPoints (best results), comms (average userNote of the area's closes), labDone, labTotal, skill}` and totals. `skill` (0-100) = 75 % share of the area's tickets solved + 25 % share of its lab's tasks; areas without a lab count only tickets; `itsm` is the average user-note mark × 20.
- `CAREER`: `l1` Service Desk L1, `l2` Service Desk L2 / Desktop, `sys` Sysadmin / Infrastructure, `netcloud` Network / Cloud, each with its areas, desks and labs (every desk and lab in exactly one step; every level-1 desk in `l1`). `career(input)` → the steps with `done/total/pct/status` (`done`, `current` = the first not finished, `later`) and `next`: in the current step, a lab first while none of its tickets is solved, then its unsolved tickets (level 1 first), then its unfinished labs; `null` when everything is done.
- `radar(values, size)`: axes from the top clockwise, the rings and the polygon, as SVG coordinates (the app draws it with `createElementNS`, no library and no inline style).
- `toMarkdown(input, {lang, name, date, site, deskTitle, deskTopic, labTitle})` and `fileName(date)`: the downloadable summary, which starts and ends with *Practice in a simulator, not work experience.* / *Práctica en un simulador, no experiencia laboral.*
