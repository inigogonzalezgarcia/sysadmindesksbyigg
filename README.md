# SysAdmin Desks by IGG

Practise real IT support tickets in a simulated console. Each desk is a ticket from a fictional company: read it, investigate with the commands you would use at work, fix the cause (not only the symptom), prove it works and write the work note. A score and an example note tell you how you did.

**Live: [sysadmindesksbyigg.pages.dev](https://sysadmindesksbyigg.pages.dev)**

Free, in English and Spanish. The home page explains how it works; you clock in with a free account (email and password, or Google) and your progress follows you to any device. Every desk links to the matching guide on [inigogonzalezgarcia.github.io](https://inigogonzalezgarcia.github.io/guias.html), and the guides link back to their desk.

## Desks

| # | Desk | Topic | Level |
|---|---|---|---|
| 1 | The account that locks every morning | Active Directory: lockout events, a scheduled task with an old password | 1 |
| 2 | Internet works, the intranet does not | Network / DNS: public DNS set by hand, DHCP, DNS cache | 1 |
| 3 | Disk full: Excel cannot save | Windows: temp folder, Windows Update cache, leaving the service running | 1 |
| 4 | The reception printer queue that will not empty | Printers: corrupt job, spooler, spool folder | 1 |
| 5 | Customer emails bounce: the sales director's mailbox | Exchange Online: quota, archive, Managed Folder Assistant | 2 |
| 6 | "Your device does not meet requirements" | Intune / BitLocker: compliance, recovery key in Entra ID, MDM sync | 2 |

Each desk has an investigate / fix / verify checklist, hints that cost points, one tempting wrong fix that does not solve the ticket, and a work note checked for cause, change, verification and follow-up.

## The help desk

- **Ticket queue:** the desks are tickets in a table with ID, requester, priority, SLA, status and assignee; Open and Closed tabs.
- **Ticket page:** press *Assign to me* and the SLA starts (20 min for P1, 30 for P2, 45 for P3) and the console unlocks. Cards for the requester and for the account, device, queue or mailbox update as you work ("Locked" turns into "Unlocked", the free space grows), and a few actions can be run from the card with the same effect as the command.
- **Closing:** choose a resolution code and write the work note. The result has three levels: *Resolved*, *Resolved with observations* (note, code, SLA or an earlier early close) or *Not resolved* (what is still to do; the ticket stays open).
- **Progress page** with your best result per ticket, and a 6-step **welcome tour** you can skip or take again from the sidebar.

## The tools

- **Directory:** Contoso's Active Directory, simulated, with the same people and computers as the tickets. Browse the OUs, search, open a user, group or computer; unlock, reset a password (with "must change at next sign-in"), enable or disable, add to or remove from groups. Every button runs a PowerShell command and shows it in the console below, where the same commands can be typed (`Get-ADUser`, `Search-ADAccount -LockedOut`, `Add-ADGroupMember`...). Four practice requests (a locked-out user, VPN access, a password reset, a leaver) tick themselves when done either way. An account that belongs to an open ticket shows that ticket's state, and its commands go to the ticket.
- **Go to the desk:** for the tickets on a user's machine (DNS, disk, BitLocker), a simulated desktop with apps such as Network settings, a browser, Storage, Services, BitLocker, Company Portal and the Event Viewer. Each button runs the same command as the console, so the traps are the same.
- **Inventory:** servers and printers with role, IP, location, owner and status, linked to the tickets (the reception printer shows "Error" while its ticket is open).

## Accounts

- **Home page:** a landing page for signed-out visitors (what a desk looks like, the four steps of a ticket, and a call to start), then the sign-in page: create an account with a technician name, one of eight avatars, email and password (8+ characters, a capital letter and a number, checked as you type), or continue with Google. A desk linked from a guide opens right after signing in.
- **Backend:** Cloudflare Pages Functions in `functions/api` with a D1 database bound as `DB`. The tables are created on first use.
  - `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`;
  - `GET /api/me` (who is signed in, and their progress), `DELETE /api/me` (delete the account and everything in it);
  - `PUT /api/progress` (keeps the best result per desk);
  - `GET /api/auth/google` and its callback.
- **Security:**
  - passwords stored only as salted PBKDF2-SHA256 hashes (100,000 iterations);
  - sessions are a random token in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie, and only its SHA-256 is stored;
  - state-changing requests must come from the site's own origin;
  - failed sign-ins are limited per email and per IP (8 in 15 minutes);
  - Google sign-in uses a `state` cookie and only accepts verified emails;
  - the same strict CSP as before, with no third-party scripts.
- **Progress:** when you sign in, anything better in the browser is added to the account.
- **Privacy and terms:** [public/privacy.html](public/privacy.html) explains what is stored, why, for how long (including the minimum age of 14 and international transfers), and [public/terms.html](public/terms.html) sets the terms of use; the sign-up form links to both, and the account page deletes everything.

## Help pages

Static pages next to the app, in both languages (`assets/doc.js` shows the one picked in the simulator and adds the switch), with the same strict CSP:

- [about.html](public/about.html): what SysAdmin Desks is, who it is for, how a ticket is checked, and what it is not (not work experience, not a real system, not affiliated with any vendor or certification body);
- [help.html](public/help.html): getting started, a ticket from start to finish, how scoring works, each tool, and what to do if something goes wrong;
- [faq.html](public/faq.html): twelve short questions and answers;
- [terms.html](public/terms.html) and [privacy.html](public/privacy.html).

Every page, the app footer, the sidebar and *My account* link to them and to **Report a problem**, which opens the contact form on my website with the subject filled in. `tests/pages.test.js` checks both languages, the CSP, that there is no inline code or email address, and that every local link exists.

## How it is built

- Static site in `public/`: `index.html`, `assets/app.js` (interface), `assets/engine.js` (scenario engine, no DOM), `assets/scenarios.js` (the desks as data), `assets/world.js` (the directory, its PowerShell and the inventory, no DOM) and `assets/style.css`.
- No framework, no build step, no external requests. A strict Content Security Policy (no inline scripts or styles) in the page and in `public/_headers`, and no HTML strings: every text is set with `textContent`.
- The engine and the scenarios are shared with the Node tests: `npm test` checks that every desk is complete in both languages, that the reference solution resolves it exactly at its last step, that the example note scores 100, and that the wrong paths do not resolve it.
- [docs/scenario-format.md](docs/scenario-format.md) explains how to write a new desk.

## Run it locally

```bash
npm test                 # 28 tests: the desks, the ticket page, the directory and desktops, and the accounts against an in-memory database (Node 22+)
npm run dev              # http://localhost:8788 with accounts, in-memory database
npm run serve            # http://localhost:8080, static only (no accounts)
```

## Deploy (Cloudflare Pages)

The live site is deployed by Cloudflare Pages on every push to `main`. To deploy your own copy:

1. In Cloudflare: Workers & Pages → Create → Pages → Connect to Git → this repository.
2. Build settings: framework preset **None**, build command empty, build output directory **`public`**.
3. Deploy. `public/_headers` adds the security headers (CSP, frame-ancestors, nosniff, referrer and permissions policies). `functions/` is deployed with the site.
4. Accounts: create a D1 database (Workers & Pages → D1) and bind it to the Pages project as `DB` (Settings → Bindings → D1 database), then redeploy.
5. Google (optional): create an OAuth client of type "Web application" in Google Cloud with the redirect URI `https://<your-site>/api/auth/google/callback`. In the Pages project, add `GOOGLE_CLIENT_ID` as a variable and `GOOGLE_CLIENT_SECRET` as a secret (Settings → Variables and Secrets). Without them, the Google button says it is not ready.

Ideas for later: password reset by email, a personal knowledge base from your work notes, and more desks per guide topic.

## Status

Version 0.3.1: landing page, accounts, ticket queue with SLA, ticket page with a three-level result, the tools (directory, desktop and inventory), and the about, help, FAQ, terms and privacy pages. More desks are coming. Fictional company (Contoso) and people; no real systems or data.

## Contact

Ideas for a desk, or want one adapted to your team's tickets?

- Website (contact form): [inigogonzalezgarcia.github.io](https://inigogonzalezgarcia.github.io/about.html#contacto)
- LinkedIn: [linkedin.com/in/igonzalez93](https://www.linkedin.com/in/igonzalez93)
