# Main source review — PHB-classFeature-family-005

Main independently compared ten complete English sources with exact draft and proposed mechanics; followed source-specific references for numerical and condition rules.

Rows: 11; verdicts: {"automated":0,"noMechanics":0,"unsupported":11}.
Overlay SHA-256: `8e3c2f40fbeab7b9fd43480fc4da5f2f815c4c5f7495f63bed9261563ae1e67c`.
Upstream input lock: `f0bd87826cc219b1ddb7dd838a5539d16d98a129ca1331f6a2e8381a7333017f`.
English reference: v2.36.0 commit `3a09c05a3a3be94423cd2b3c33936034eeae02f2`.
Main reviewer: model:Codex-main, 2026-10-03. Sample errors: 0; accepted.

| Canonical sample | Source reference | Main finding |
| --- | --- | --- |
| kiwee:classfeature:phb:action%20surge%20(two%20uses):phb:fighter:::17::: | PHB p72; complete Fighter English features, KI translation comparison and parent UIDs | 17th-level Action Surge gives two uses in base pool, once same turn; no separate upgrade pool or 2024 Magic exclusion. |
| kiwee:classfeature:phb:action%20surge:phb:fighter:::2::: | PHB p72; complete Fighter English features, KI translation comparison and parent UIDs | Own-turn extra action, resource1 at2-16/2 at17-20, short/long all; independent class-level grid and actual-source alias fix validated. |
| kiwee:classfeature:phb:extra%20attack%20(2):phb:fighter:::11::: | PHB p72; complete Fighter English features, KI translation comparison and parent UIDs | Fighter11 gives three attacks within one own-turn Attack action, replacing two; not three actions. |
| kiwee:classfeature:phb:extra%20attack%20(3):phb:fighter:::20::: | PHB p72; complete Fighter English features, KI translation comparison and parent UIDs | English and level20 UID say four attacks at20; KI prose wrongly says11/four actions, explicitly resolved English-first with visible sourceIntegrity gap. |
| kiwee:classfeature:phb:extra%20attack:phb:fighter:::5::: | PHB p72; complete Fighter English features, KI translation comparison and parent UIDs | Base Extra Attack 2/3/4 at5/11/20 in this class, own-turn one Attack action; KI omits20 tier and mislabels actions, no additive counts. |
| kiwee:classfeature:phb:fighting%20style:phb:fighter:::1::: | PHB p72; complete Fighter English features, KI translation comparison and parent UIDs | One chosen optionalfeature among six PHB and five explicit TCE options; no same style more than once. Preserve exact refs, uniqueness across selections deferred, no unchosen child bonuses. |
| kiwee:classfeature:phb:indomitable%20(two%20uses):phb:fighter:::13::: | PHB p72; complete Fighter English features, KI translation comparison and parent UIDs | Indomitable13 upgrades base capacity to2, Long Rest only, failed-save mandatory-new-result inherited; no 2024 reroll bonus. |
| kiwee:classfeature:phb:indomitable:phb:fighter:::9::: | PHB p72; complete Fighter English features, KI translation comparison and parent UIDs | Base Indomitable1/2/3 at9/13/17 and LongRest all, source-derived deferred special action, no action/reaction invented; all0-20 maxima verified. |
| kiwee:classfeature:phb:martial%20archetype:phb:fighter:::3::: | PHB p72; complete Fighter English features, KI translation comparison and parent UIDs | One martial archetype at3, same choice children3/7/10/15/18 verified parent flags; genuine operative choice, not empty placeholder. |
| kiwee:classfeature:phb:second%20wind:phb:fighter:::1::: | PHB p72; complete Fighter English features, KI translation comparison and parent UIDs | Second Wind own-turn Bonus self1d10+Fighter, one use at1-20, short/long all. No2024 extra capacity or Tactical Mind/Shift. |

11 unsupported partial rows, three base-owned PHB resource pools and exact finite style choice. Main read all11, records ten samples. 126 total PHB/XPHB numerical grid checks passed; no mixed-version behavior or duplicate tier pool.

Rollback: revert this batch and its review-index receipt together, then regenerate the locked pipeline. Raw source bodies and intermediate proposals stay in ignored private cache.
