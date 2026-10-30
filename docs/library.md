# The documentation library (library.js)

[public/assets/library.js](../public/assets/library.js) (`window.SDLibrary`, `require`-able in Node) holds the library: one short reference article per area, in Spanish and English. No DOM: the app (`#/library`, `#/library/<area>`) and `tests/learning.test.js` use the same code.

## Areas

`AREAS`: `ad`, `windows`, `m365`, `endpoint`, `linux`, `vdi`, `data`, `network`, `hardware`, `itsm`, each with `icon` and `name {en, es}`. The profile (profile.js) uses the same ids; every desk belongs to exactly one area (`DESK_AREA` in profile.js).

## An article

```js
{ id: "network",                                   // = its area
  title: { en, es }, summary: { en, es },
  tags: ["vlan", "err-disabled", …],               // search words (not shown)
  what:   { en: ["paragraph", …], es: [...] },     // what it is, at Contoso
  tools:  [{ cmd: "show mac address-table address <mac>", try: "show mac address-table address 6c4b.9042.1a24",
             on: "SW-CORE-01", what: { en, es } }],
  causes: { en: [...], es: [...] },                // common causes, general: never one desk's root cause
  tips:   { en: [...], es: [...] },                // good practice
  desks: ["net-err-disabled", …], labs: ["network"], guides: ["cisco-primeros-comandos-…"] }
```

- `on` says where the command works: `ad` (the Directory console and the AD lab), `lab:<id>`, `desk:<id>` (that ticket's console), a network device id (its CLI in the network room and the network lab) or `page:#/…` (a page of the app, no command). `try` is a real line for the tests when `cmd` has `<placeholders>`.
- `guides` are slugs of https://inigogonzalezgarcia.github.io/guias/<slug>.html. `tests/guide-slugs.json` is the list of published guides (from the website's `guides.py`); refresh it when guides are added.

## What the tests check

- one article per area, every text in both languages;
- every desk, lab and guide linked exists; every desk and every lab is linked from some article; the desks' own guide links exist too;
- every command is understood where `on` says (the directory answers it, the lab console recognises it, a rule of that desk matches it, the device does not answer `% Invalid input`);
- no article (title, summary, text, tools, causes, tips) contains a word from the list of desk root causes, fixes and traps (`SPOILERS` in the test): add to it when you add a desk.

## Functions

`article(id)`, `area(id)`, `forDesk(deskId)`, `forLab(labId)`, `toolPlace(tool)` → `{kind, id}`, `search(query, lang)` (every word must appear; title > tags > summary > text), `textOf(a, lang)`, `toMarkdown(a, lang, deskTitle, labTitle)`, `guideUrl(slug)`.
