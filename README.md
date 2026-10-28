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
| 7 | Working from home: the VPN will not connect | Cisco Secure Client (AnyConnect): system clock and certificate validation | 1 |
| 8 | New starter without Outlook or Teams | Microsoft 365: group-based licensing, no seats left, a leaver's direct licence | 1 |
| 9 | The invoices mailbox does not appear in Outlook | Exchange Online: FullAccess vs SendAs, automapping | 1 |
| 10 | Created in AD this morning, missing in Microsoft 365 | Azure AD Connect: OU filtering, delta sync | 2 |
| 11 | Three nights without a backup of the file server | Veeam: repository full of a deleted job's backups | 2 |
| 12 | Installed, but Software Center says 'Failed' | MECM: detection method of an outdated product code | 2 |
| 13 | 502 Bad Gateway: the timesheets app is down | Red Hat: /var full, logrotate, deleted files still held open | 2 |
| 14 | The CRM in Citrix stays on 'Starting...' | Citrix: unregistered VDA and a stuck disconnected session | 2 |
| 15 | Abroad and locked out of Microsoft 365 | Entra ID Conditional Access: blocked country, time-bound exception with PIM | 2 |
| 16 | Nobody can sign in to Expenses with SSO | Entra ID SAML: expired signing certificate, the new one never activated | 2 |
| 17 | The payroll SFTP server rejects AD accounts | Linux joined to AD (SSSD): clock skew and Kerberos | 2 |
| 18 | The ERP cannot save: transaction log full | SQL Server: error 9002, failing log backup job | 2 |

Each desk has an investigate / fix / verify checklist, hints that cost points, one tempting wrong fix that does not solve the ticket, and a work note checked for cause, change, verification and follow-up.

## The help desk

- **Ticket queue:** the desks are tickets in a table with ID, requester, priority, SLA, status and assignee; Open and Closed tabs.
- **Ticket page:** press *Assign to me* and the SLA starts (20 min for P1, 30 for P2, 45 for P3) and the console unlocks. Cards for the requester and for the account, device, queue or mailbox update as you work ("Locked" turns into "Unlocked", the free space grows), and a few actions can be run from the card with the same effect as the command.
- **Closing:** choose a resolution code and write the work note. The result has three levels: *Resolved*, *Resolved with observations* (note, code, SLA or an earlier early close) or *Not resolved* (what is still to do; the ticket stays open).
- **Progress page** with your best result per ticket, and a 7-step **welcome tour** you can skip or take again from the sidebar.

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
  - a strict CSP with no inline code; the only third-party script allowed is Google Analytics, and only after consent (see *Cookies*).
- **Progress:** when you sign in, anything better in the browser is added to the account.
- **Privacy and terms:** [public/privacy.html](public/privacy.html) explains what is stored, why, for how long (including the minimum age of 14 and international transfers), and [public/terms.html](public/terms.html) sets the terms of use; the sign-up form links to both, and the account page deletes everything.

## Cookies

- **Necessary:** the session cookie `sd_session` (and a temporary one during Google sign-in). No permission needed.
- **Analytics, opt-in:** [assets/consent.js](public/assets/consent.js) shows a notice (Reject / Settings / Accept analytics) and loads Google Analytics 4 only after the visitor accepts, with consent mode denied by default, Google signals and ad personalisation off, and one page view per route (`#/...`). Rejecting loads nothing from Google and removes any `_ga` cookie. The choice is kept in `localStorage` (`sd.consent`) for 6 months, and *Cookie settings* in every footer and in *My account* reopens it.
- `GA_ID` at the top of `consent.js` holds the measurement ID; while it is empty there is no notice and no analytics.

## Progress and knowledge (v0.4)

Everything here is kept only in the browser (`localStorage`, keys `sd.kb`, `sd.activity`, `sd.mail`, `sd.mailRead`, `sd.badges`, `sd.goal`); the account backend is unchanged.

- **Knowledge base** (`#/kb`, `#/kb/<desk>`): closing a ticket fixed with a note that covers every element saves an article for that desk: title, symptom and environment from the ticket, and the cause, fix, verification and follow-up taken from your own sentences (sorted by the note elements, never reworded), with the resolution code, date, ticket, version and the related guide. A newer approved note is a new version (v1.0, v1.1…). Search and filter by topic, **Download Markdown** (`kb-<ticket>-v<version>.md`) and **Print or save as PDF** (a print stylesheet that shows only the article).
- **Progress page:** a day streak (current and best, local days), a weekly goal (different tickets and mail exercises in the ISO week, target 1-7, default 3) and ten **badges** with their rule and the day they were earned, plus the mail score.
- **Mail** (`#/mail`, `#/mail/<id>`, unread count in the sidebar): six messages with *Show headers* (From, Reply-To, Return-Path, Received, SPF/DKIM/DMARC, real link targets, directory check). Two user requests become tickets (*Create ticket from this message*), one executive phishing from a look-alike domain, one service desk impersonation asking for an MFA and password reset by email, one maintenance notice and one urgent internal request that passes every check. Each answer is graded correct, partly correct or wrong, with the clues and the right procedure, and can be retried.
- The logic and the mail data are in [assets/growth.js](public/assets/growth.js) (no DOM), tested in `tests/growth.test.js`; [docs/growth-format.md](docs/growth-format.md) describes the data.

## Help pages

Static pages next to the app, in both languages (`assets/doc.js` shows the one picked in the simulator and adds the switch), with the same strict CSP:

- [about.html](public/about.html): what SysAdmin Desks is, who it is for, how a ticket is checked, and what it is not (not work experience, not a real system, not affiliated with any vendor or certification body);
- [help.html](public/help.html): getting started, a ticket from start to finish, how scoring works, each tool, and what to do if something goes wrong;
- [faq.html](public/faq.html): fifteen short questions and answers;
- [terms.html](public/terms.html) and [privacy.html](public/privacy.html).

Every page, the app footer, the sidebar and *My account* link to them and to **Report a problem**, which opens the contact form on my website with the subject filled in. `tests/pages.test.js` checks both languages, the CSP, that there is no inline code or email address, and that every local link exists.

## How it is built

- Static site in `public/`: `index.html`, `assets/app.js` (interface), `assets/engine.js` (scenario engine, no DOM), `assets/scenarios.js` (the desks as data), `assets/world.js` (the directory, its PowerShell and the inventory, no DOM), `assets/growth.js` (knowledge base, streak, goal, badges and mail, no DOM) and `assets/style.css`.
- No framework, no build step, no external requests. A strict Content Security Policy (no inline scripts or styles) in the page and in `public/_headers`, and no HTML strings: every text is set with `textContent`.
- The engine and the scenarios are shared with the Node tests: `npm test` checks that every desk is complete in both languages, that the reference solution resolves it exactly at its last step, that the example note scores 100, and that the wrong paths do not resolve it.
- [docs/scenario-format.md](docs/scenario-format.md) explains how to write a new desk.

## Run it locally

```bash
npm test                 # 45 tests: the desks, the ticket page, the directory and desktops, progress and knowledge, the pages, and the accounts against an in-memory database (Node 22+)
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

Ideas for later: password reset by email, and more desks per guide topic.

## Status

Version 0.5.0: 18 desks (first and second line), landing page, accounts, ticket queue with SLA, ticket page with a three-level result, the tools (directory, desktop and inventory), a personal knowledge base, streak, weekly goal, badges and mail exercises, and the about, help, FAQ, terms and privacy pages. Each desk links to its guide, and the guides on the website link back with a "Practise it" button. Fictional company (Contoso) and people; no real systems or data.

## Contact

Ideas for a desk, or want one adapted to your team's tickets?

- Website (contact form): [inigogonzalezgarcia.github.io](https://inigogonzalezgarcia.github.io/about.html#contacto)
- LinkedIn: [linkedin.com/in/igonzalez93](https://www.linkedin.com/in/igonzalez93)
