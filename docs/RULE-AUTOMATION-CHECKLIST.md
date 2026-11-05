# Current candidate — 2026-11-06, complete replay and expanded source discovery

The new candidate is not yet merged or deployed. It retains all 18,789 legacy
registered identities and 4,561 source-reviewed flags. Exactly 7,868 identities
now have at least one calculation or saved-choice witness, up from 7,858;
this is partial mechanism evidence, not whole-rule execution or acceptance.

Producer `887242cb7a1445f7509a8c53f5ed73aa761d04ae` and Web consumer
`38af300cb6c8b4270a2798aa45bdc70a972f3453` completed independent local and
[remote from-zero replays](https://github.com/FullPeople/dnd5e-automation-data/actions/runs/42104254132).
Both have 18,789 fresh unique receipts and exactly equal record arrays,
original inputs and source totals. All 308 runtime modules, two stylesheets
and 229 immutable input bytes were independently checked. The published
remote report SHA-256 is `fdb153d224447b2233def72ff4683593aa29a90d6889e86d2e0f500829f554a2`.
The complete reviewed record-array digest is
`c75c52dffac932c1d3e68ede5213099fc31c434c524f2c1f3d014fdc566677de`.
Twelve records changed: ten new partial choice witnesses and two earlier
observations of already positive records. Both original fixed grants were
separately verified at their original edition/level before and after choices
and native save/reopen. No previous positive record was lost.

The old corpus contains 253 string-filter declarations. Actual source/control
verification now covers 58 positive declarations across 11 sources, including
one uppercase field the first inventory test omitted. Existing ritual support
already handles that declaration; the initial claim of a missing ritual mode
was corrected. The remaining 195 declarations are 193 class-list predicates
and two empty declarations. Source prerequisites and all other effects are
not qualified by the saved-choice witness.

The live reader exposed a larger directory. The separate
`catalog-source-discovery.json` records 425 source IDs; union with the Web
registry gives 509 known sources, including 364 pending inventories. There
are 28,880 newly discovered but unregistered candidate identities and a
47,669-identity provisional mixed-epoch union, not a new accepted execution
snapshot. All added review/model/execution/acceptance credits remain zero.
Thirty-three identity diagnostics, nine content conflicts and 46 unclassified
files remain visible. See [the discovery record](CATALOG-DISCOVERY-20261106.md).
Do not call the old 229-input corpus the complete live catalog or stop at
its denominator.

The failed first replay and deliberately cancelled second replay remain in
the history. New evidence starts from zero and never splices their partial
receipts. A reviewed digest permits exactly the new record array; unchanged
records remain the default, and identity, input, snapshot, witness and prior
positive-evidence checks remain required. No API keys or model calls are used.

# Previous checkpoint — 2026-11-06

The integrated baseline is Data `8ae7b3fe43f69fea097c9068c770d44b5073f7f5`
and Web `f5ce82fae695c2642f39a663a790630f97364a3b`. The current ledger has
18,789 registered identities, 4,561 source-reviewed identities and 7,858 with
at least one observed calculation or usable choice. Whole-rule modeling,
execution and acceptance counts remain unestablished. Historical complete flags
do not qualify current whole-rule acceptance.

[Web PR142](https://github.com/FullPeople/DND-card-web/pull/142) retains the
full known directory of 229 sources, including 84 without an established rule
inventory. Missing inventories are unknown, not zero, inapplicable or complete.
The 18,789-identity denominator does not include the still-unregistered content.

The pending positive source-spell filter consumer is
`38af300cb6c8b4270a2798aa45bdc70a972f3453`. Its 57 declarations across 11 sources
are a first subset of all 253 string-filter declarations across 26 sources, not
57 completed rules. Class-list and other unverified predicates remain visible
and held. The original 229 input pins, sources and identities remain unchanged.

The second replay against `836e71d` was deliberately cancelled after five
fixed-grant/casting-level regressions were found: all five passed on main and
failed on that candidate. The corrected consumer preserves fixed grants,
explicit casting variants, other valid choices and spent resources; 18 Web
test files and 966 checks passed without skips. Both partial replay journals
remain retained. The third replay must start from zero with this exact new
consumer. No full App or complete replay acceptance is claimed yet.

The existing remote replay gate required every record to stay identical,
which correctly protects unchanged consumers but rejects new observed
mechanisms. Unchanged-record comparison remains the default. A new mechanism
requires an explicit SHA-256 of the complete locally reviewed record array,
then a fresh remote replay must match it exactly. Validation additionally
retains all identities, source/review flags, input pins, snapshot binding and
previous positive records. Initial strict-gate failure and missing-helper
test setup failure are retained; six new boundary tests pass. This does not
relax witness validation, whole-rule qualification or source/receipt checks.

The first local and remote full replay against consumer `c4cb2ee` failed because
the old probe reused a stale list and attempted duplicate choices. The rejected
run [42086997505](https://github.com/FullPeople/dnd5e-automation-data/actions/runs/42086997505)
and incomplete local receipts are retained. The probe now rereads offered
candidates after every saved selection; real rejections and silently unrecorded
edits still fail the observation. Four new regressions first produced three
failures and one pass; the related seven-file group subsequently passed all 62
checks on the existing Node 24 runtime. No count, assertion, skip policy or
whole-rule completion gate was relaxed. New full replay, exact bytes, independent
receipts and consumer App/CI checks remain required before this candidate counts
as delivered.

Current standing authorization allows normal merges and the existing deployment
flow after exact checks and protections. It does not authorize bypassing review,
branch protection, publisher identity checks, private data boundaries or errors.
The older queue below is retained as history and does not override this checkpoint.

# Historical player rule automation checklist (superseded checkpoint)

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
