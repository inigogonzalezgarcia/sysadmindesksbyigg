# Shipments and RMA (shipping.js)

[public/assets/shipping.js](../public/assets/shipping.js) (v0.7b, `window.SDShip`, `require`-able in Node) holds the asset register, the shipments tool, the state machine with its simulated clock, the inventory state of each device and what a shipment does to a ticket's SLA. It has no DOM: the app, the engine (desks with `ship`) and `tests/shipping.test.js` use the same code. Company, people, addresses (postcode 28000, which does not exist), serial numbers and the carrier (TransIbérica Express) are fictional; Dell and Cisco appear only as manufacturers in the fiction.

## Where shipments live

- **A ticket's shipments** live in its session (`sess.ships`, a store with the prefix `SHP-<ticket number>`, e.g. `SHP-20612-1`), like its console: since v0.9 they are kept with the ticket's saved session across a reload (`sd.live`, see workspace.md) and start again when the ticket is closed and replayed. Each step goes into the ticket's Activity (`sd.work[<desk>].timeline`, entries `{at, ship, state, ms, charged, paused}`).
- **Practice shipments** (no ticket, prefix `SHP-P`) are kept in this browser in `localStorage` (`sd.ships`), and removed with the account like the other growth data. Nothing is sent to the server.

## The state machine

```
draft ──submit──▶ requested ──advance──▶ pickup ──advance──▶ transit ──advance──▶ delivered ──close──▶ closed
                                            │                   │
                                            └──── incident (lost | damaged) ──advance (claim solved)──▶ transit
```

| Step | Simulated time | Events |
|---|---|---|
| submit (draft → requested) | 5 min | RMA approved with its number (RMA type), booking with the carrier and tracking number |
| requested → pickup | 2 h | Pickup booked (or, from a vendor depot, the replacement dispatched) |
| pickup → transit | 5 h | Collected, at the sorting hub |
| transit → delivered | 17 h | Out for delivery, delivered and signed |
| incident | 4 h | Lost or damaged at the hub, claim opened |
| incident → transit | 24 h | Claim solved |

The internal carrier (hand delivery) takes a tenth of the time. `submit` validates; errors block (field ids): `serial` (not in the register), `carrier`, `from`, `to` (and from ≠ to); RMA: `vendor`, `fault`, `evidence`; a return: `items` (except spare parts); a laptop RMA or return: `data` (`kyhd`, `wiped`, `encrypted`, `none`). Warnings do not block: `escrow` (a laptop RMA without the BitLocker recovery key checked in Entra ID) and `contract` (a part RMA without a support contract). `ship set` changes a shipment until it is delivered, never its asset or type.

**Keep Your Hard Drive** (Dell's add-on for ProSupport customers): the customer keeps a failed drive instead of returning it to the vendor, so the data never leaves its control. The data option `kyhd` records that.

## The SLA

`charge(rec, {id, state, ms}, now)` takes a workflow record (workflow.js) and returns a new one: while the ticket is in progress, the step's simulated time is added to `extraMs` (the SLA counter jumps); while it is pending (user or vendor), it costs nothing and the entry says `paused`. The shipment buttons keep working while the ticket is pending, so the right way is: request, set the ticket to *Pending vendor*, advance, resume.

## Inventory state

`deviceState(stores, serial)`: the register's mark wins (`ship mark <serial> stock | replaced | in-use`); otherwise the shipments (not drafts): an open RMA → `rma`; a loan → `loan` (closed: `stock`); a return → `returning`, then `received` once delivered; a shipment to a user delivered → `in-use`. The inventory's *Endpoints* view shows it for every asset in `ASSETS` (laptops, the loan pool, a phone and a switch power supply).

## The shipments tool (`ship`)

```
ship list | show <id> | assets <user>
ship new <rma|to-user|return|loan> --serial <serial or name> [--vendor dell|cisco|generic] [--fault "..."] [--evidence "a, b"]
         [--contract <id>] [--carrier tix|vendor|internal] [--from <address>] [--to <address>] [--data kyhd|wiped|encrypted|none]
         [--escrow] [--items laptop,charger,badge,phone]
ship set <id> [options] | submit <id> | advance <id> | incident <id> lost|damaged | close <id> | mark <serial> <status>
```

Addresses: `hq-it`, `comms-2f`, `home-jruiz`, `home-lnavarro`, `dell-depot`, `cisco-depot`. `exec(store, line, {lang})` returns `{lines, tags, ms, unknown, ship}`; `command(verb, a, b)` builds the line a form or a button runs. Output is in English (consoles are); warnings and narration follow the user's language.

Tags (what a desk reacts to): `ship new <type> <serial>`, `ship submit <type> escrow|noescrow`, `ship state <type> <state>` (every change of state), `ship incident <type> <kind>`, `ship set <type> escrow|noescrow`, `ship mark <serial> <status>`, `ship assets <user>`, `ship show <type> <state>`, `ship list`, `ship error <code>`.

## Desks with `ship`

```js
ship: {
  flags: {
    rmaOk: { type: "rma", serial: "8KQ2TX3", vendor: "dell", evidence: "2000-0151", data: "kyhd", state: ["requested", "pickup", "transit", "delivered", "closed"] },
    received: { type: "return", serial: "3FJ7WR3", to: "hq-it", items: ["laptop", "charger", "badge", "phone"], state: ["delivered", "closed"] },
  },
},
```

- A flag is true when any shipment of the ticket matches every field given (`type`, `serial`, `state` (one or a list), `escrow`, `data`, `vendor`, `contract` (present), `to`, `evidence` (substring), `items` (all)), or `{ kind: "asset", serial, status }` for the inventory state. Flags are read again after every command and must be in `state` with their value at the start.
- `ship ...` lines go to the tool; on a network desk only on the workstation (inside a device CLI, `ship` is that device's error). Ticket-page buttons always reach it (`opts.local`).
- Rules with `on` (and no `dev`) react to the tool's tags, like the network desks react to a device.
- `remarks: [{ when, text }]` (engine, v0.7b): something done badly on the way. If it matches when the ticket is resolved, it is listed and costs 10 points ("resolved with observations"), without blocking the ticket.
- Simulated helpers used by these desks: `vendor` (the vendor's support portal: warranty, contract, a purchase request), `onsite` (what the user or Facilities do) and `alarm` (the monitoring console).

The three desks: `laptop-rma` (a failing SSD under warranty: vendor pre-boot diagnostics code, warranty, the BitLocker key escrowed in Entra ID, a loan laptop, the RMA), `net-psu-rma` (a failed power supply in SW-ACC-2F: `show environment power`, the feed ruled out, the RMA with advance replacement, the hot swap and the return of the faulty unit) and `leaver-return` (a remote leaver's laptop, charger, badge and phone: courier collection, the check on arrival, the wipe and the register).
