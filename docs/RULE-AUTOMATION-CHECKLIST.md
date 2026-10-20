# Player rule automation checklist

This is a batch queue, not a whole-rule completion count. The current inventory
has 18,789 identities and 4,561 reviewed identities. The published 6,538 figure
means at least one observed calculation or usable choice per identity; it does
not mean those entire rules are automated. Exact source denominators and
per-record witnesses remain in `reports/progress/runtime-coverage.json`.

| Source / mechanism | Current player behavior | Remaining work / next checkpoint |
| --- | --- | --- |
| XPHB class ASI -> feat -> ability allocation | Explicit 21 allocations, capped derived scores, offline recovery, archive/restore and cancellation; old manual scores stay untouched | Full-corpus evidence binds fd6b8cb; paired Web acceptance is tracked in PR89. Other feat mechanisms remain separate below |
| XPHB other general / epic feats | Existing typed selection and supported grants only | Review numeric half-feat allocations and explicit 20/30 caps separately; verify prerequisites and replacement without residue |
| PHB class ASI / alternative feat | Reviewed choice records; ASI base scores and legacy feat effects remain manual | Add an explicit ownership choice before automating legacy scores; never infer already-applied manual bonuses |
| PHB / XPHB Warlock invocations | Source-declared learned quotas and saved selections; this batch does not activate them | Local follow-up bb5a5b6 has 11 workflow/source/render checks and 129 related passes; it still needs its own ledger, builds, browser run and CI. Mage Armor AC and duration stay manual |
| TCE Artificer infusions | Source-declared learned list; opening quota reviewed | Select a valid target, activate one infusion, enforce active capacity/duplicate limits and remove its effects on replacement; item restrictions and later totals need independent evidence |
| PHB / XPHB origin and fighting-style feats | Existing source-qualified grants and reviewed prerequisite alternatives | Continue per-feat effects and replacement; a saved choice is not proof of its combat effects |
| PHB / XPHB species and backgrounds | Supported fixed ability/speed/training, allocation records and explicit grants | Choice effects, optional source variants and complete feature semantics remain partial |
| PHB / XPHB class / subclass features | Supported feature ownership, level gates, explicit grants, resources and spell sources | Audit each source mechanism, including shared pools, recovery and unsupported formulas; retain manual exceptions |
| PHB / XPHB spells | Resolved source grants and supported spell choices | Spell-specific damage, duration, concentration, targeting and encounter settlement are separate mechanisms |
| PHB / XPHB equipment | Supported armor, weapon values, source equipment receipts and training | Conditional, attunement and magic-item-specific effects remain partial |
| Other official sources and Kiwee homebrew | Only individually observed mechanisms in the source ledger qualify | Walk each source's unresolved/manual identities after the bounded core workflows; preserve edition, parent and namespace identity |
| Conditions, actions, psionics, boons, rewards and rule variants | Inventory plus individually observed mechanisms only | Model application/removal and contextual effects in source-qualified batches; no prose-only row is automatically executed |

Every batch needs a reproduction before production edits, an authored fixture and
an actual source/hash check, useful transition/persistence tests, current runtime
evidence, builds, and a draft PR. Do not merge or deploy in this task. Raw rule
inputs and player files remain local. The next batch starts after the preceding
batch's concrete delivery checkpoint; checks alone are not development completion.

## Next batch checkpoint

Start with `Armor of Shadows|XPHB`, checked against the [2024 invocation
options](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes#EldritchInvocationOptions)
on 2026-10-19. Frozen optional-feature input SHA-256:
`031970dfac1770a548549bd30535319c2493c47ebeaedfdb6a601651bbfc3844`.
Its typed metadata resolves the XPHB spell separately from the PHB reference.
The local follow-up is preserved separately at bb5a5b6. It covers explicit
activation, source/edition ownership, self-only/no-slot casts, missing catalogs,
saved-snapshot precedence, persistence, replacement/removal and a pre-existing
manual spell. Its own exact-consumer ledger, complete builds, desktop/narrow
browser acceptance and CI remain required. Mage Armor AC, duration and armor
eligibility remain manual. A spell list entry does not certify automatic
spell casting or encounter settlement. Artificer infusion target activation
follows as a separate workflow, with its own capacity and item-ownership tests.
