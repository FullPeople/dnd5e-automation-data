# Main source review — XPHB-classFeature-family-005

Main independently read ten complete English features, corresponding drafts/overlays and the complete 2024 Fighter class table. Verified source-bound class formulas and base-owned resources; original Foundry formulas stay deferred where their operation requires combat settlement.

Rows: 17; verdicts: {"automated":0,"noMechanics":0,"unsupported":17}.
Overlay SHA-256: `23bc5e8668e4d3e7b9871f1989913346c85dbd7e0d5ee7c4175ef5e8514c90cf`.
Upstream input lock: `f0bd87826cc219b1ddb7dd838a5539d16d98a129ca1331f6a2e8381a7333017f`.
English reference: v2.36.0 commit `3a09c05a3a3be94423cd2b3c33936034eeae02f2`.
Main reviewer: model:Codex-main, 2026-10-03. Sample errors: 0; accepted.

| Canonical sample | Source reference | Main finding |
| --- | --- | --- |
| kiwee:classfeature:xphb:action%20surge:xphb:fighter:::17::: | XPHB p91; data/class/class-fighter.json | Fighter-17 upgrades the single Fighter-2 Action Surge pool to two uses; once per turn, extra action excludes Magic, Short/Long Rest all. No separate upgrade pool. |
| kiwee:classfeature:xphb:action%20surge:xphb:fighter:::2::: | XPHB p91; data/class/class-fighter.json | Base Action Surge: one use at Fighter 2-16 and two at 17-20; class-level formula checked at 0-20, recovery all short/long, special own-turn action. Same-name source binding was reproduced and fixed with two actual runtime/debt regressions. |
| kiwee:classfeature:xphb:fighting%20style:xphb:fighter:::1::: | XPHB p91; data/class/class-fighter.json | Fighting Style is one chosen FS feat, Defense is a recommendation; ten actual XPHB FS refs form an explicit supported subset. Later Fighter-level replacement and wider-source selection remain deferred; no automatic Defense bonus. |
| kiwee:classfeature:xphb:extra%20attack:xphb:fighter:::5::: | XPHB p92; data/class/class-fighter.json | Extra Attack is two attacks per own-turn Attack action, replaced at 11/20 rather than summed; no attack modifier or off-turn grant. |
| kiwee:classfeature:xphb:indomitable:xphb:fighter:::9::: | XPHB p92; data/class/class-fighter.json | Indomitable triggers failed save, optional reroll plus Fighter level, mandatory new result; one/two/three uses at 9/13/17, all Long Rest. Exact class-level capacity checked at 0-20; reroll action deferred, no permanent save bonus. |
| kiwee:classfeature:xphb:second%20wind:xphb:fighter:::1::: | XPHB p91; data/class/class-fighter.json | Second Wind heals self 1d10 plus Fighter level with Bonus Action; table verified 2/3/4 uses at 1/4/10, Short Rest exactly one, Long Rest all. Single pool, actual healing and cross-feature settlement deferred. |
| kiwee:classfeature:xphb:studied%20attacks:xphb:fighter:::13::: | XPHB p92; data/class/class-fighter.json | Studied Attacks requires a miss against a creature, next attack against that creature, expires end of next own turn. Per-target history remains deferred; no global advantage. |
| kiwee:classfeature:xphb:tactical%20mind:xphb:fighter:::2::: | XPHB p91; data/class/class-fighter.json | Tactical Mind uses the existing Second Wind pool after failed ability check, adds 1d10 instead of healing, spends nothing if still failed. Cross-record success-dependent transaction remains deferred; no duplicated pool or unconditional spend. |
| kiwee:classfeature:xphb:three%20extra%20attacks:xphb:fighter:::20::: | XPHB p92; data/class/class-fighter.json | Fighter-20 grants four attacks per own-turn Attack action, replaces earlier two/three counts; never additive. |
| kiwee:classfeature:xphb:weapon%20mastery:xphb:fighter:::1::: | XPHB p91; data/class/class-fighter.json | Weapon Mastery selects Simple/Martial weapon kinds, verified table totals 3/4/5/6 at 1/4/10/16; Long Rest replaces exactly one. No false proficiency or item grant; mastery choice and effects deferred. |

All 17 rows are unsupported partial records, not a claim of full combat automation. Three base-owned finite resource pools and one finite FS-choice subset execute only their declared portion. Main reproduced the Web same-name class-alias bug (wrong 2 instead of 1), fixed actual-parent binding and visible ambiguous aliases, and passed both new runtime/debt regressions before acceptance. No publisher bodies are published. Upgrade records never create independent pools.

Rollback: revert this batch and its review-index receipt together, then regenerate the locked pipeline. Raw source bodies and intermediate proposals stay in ignored private cache.
