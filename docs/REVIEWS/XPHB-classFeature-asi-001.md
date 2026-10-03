# Main source review — XPHB-classFeature-asi-001

Main reviewed every complete single feat-pointer sentence and checked any listed repeat levels exist as distinct classFeature identities. Ten independent source samples (or all remaining rows) confirm the pointer classification expressly permitted by G6 step 1. The actual XPHB feat is independently present and still requires its own mechanism review.

Rows: 50; verdicts: {"automated":0,"noMechanics":50,"unsupported":0}.
Overlay SHA-256: `8734d7f32e65f4d0592d1678752148fcb6f0699317e9f949a8461424345e439d`.
Upstream input lock: `f0bd87826cc219b1ddb7dd838a5539d16d98a129ca1331f6a2e8381a7333017f`.
English reference: v2.36.0 commit `3a09c05a3a3be94423cd2b3c33936034eeae02f2`.
Main reviewer: model:Codex-main, 2026-10-03. Sample errors: 0; accepted.

| Canonical sample | Source reference | Main finding |
| --- | --- | --- |
| kiwee:classfeature:xphb:ability%20score%20improvement:xphb:barbarian:::12::: | XPHB p53; Barbarian level 12 | Full body only directs selection of one qualifying feat. Operative ASI rules belong to that feat; any repeat levels are separate records. No direct +2 score bonus or new resource is present in this class pointer. |
| kiwee:classfeature:xphb:ability%20score%20improvement:xphb:bard:::16::: | XPHB p61; Bard level 16 | Full body only directs selection of one qualifying feat. Operative ASI rules belong to that feat; any repeat levels are separate records. No direct +2 score bonus or new resource is present in this class pointer. |
| kiwee:classfeature:xphb:ability%20score%20improvement:xphb:cleric:::4::: | XPHB p71; Cleric level 4 | Full body only directs selection of one qualifying feat. Operative ASI rules belong to that feat; any repeat levels are separate records. No direct +2 score bonus or new resource is present in this class pointer. |
| kiwee:classfeature:xphb:ability%20score%20improvement:xphb:fighter:::12::: | XPHB p92; Fighter level 12 | Full body only directs selection of one qualifying feat. Operative ASI rules belong to that feat; any repeat levels are separate records. No direct +2 score bonus or new resource is present in this class pointer. |
| kiwee:classfeature:xphb:ability%20score%20improvement:xphb:fighter:::8::: | XPHB p92; Fighter level 8 | Full body only directs selection of one qualifying feat. Operative ASI rules belong to that feat; any repeat levels are separate records. No direct +2 score bonus or new resource is present in this class pointer. |
| kiwee:classfeature:xphb:ability%20score%20improvement:xphb:paladin:::16::: | XPHB p111; Paladin level 16 | Full body only directs selection of one qualifying feat. Operative ASI rules belong to that feat; any repeat levels are separate records. No direct +2 score bonus or new resource is present in this class pointer. |
| kiwee:classfeature:xphb:ability%20score%20improvement:xphb:ranger:::4::: | XPHB p120; Ranger level 4 | Full body only directs selection of one qualifying feat. Operative ASI rules belong to that feat; any repeat levels are separate records. No direct +2 score bonus or new resource is present in this class pointer. |
| kiwee:classfeature:xphb:ability%20score%20improvement:xphb:rogue:::8::: | XPHB p130; Rogue level 8 | Full body only directs selection of one qualifying feat. Operative ASI rules belong to that feat; any repeat levels are separate records. No direct +2 score bonus or new resource is present in this class pointer. |
| kiwee:classfeature:xphb:ability%20score%20improvement:xphb:warlock:::12::: | XPHB p155; Warlock level 12 | Full body only directs selection of one qualifying feat. Operative ASI rules belong to that feat; any repeat levels are separate records. No direct +2 score bonus or new resource is present in this class pointer. |
| kiwee:classfeature:xphb:ability%20score%20improvement:xphb:wizard:::4::: | XPHB p167; Wizard level 4 | Full body only directs selection of one qualifying feat. Operative ASI rules belong to that feat; any repeat levels are separate records. No direct +2 score bonus or new resource is present in this class pointer. |

The reason is choiceOfOtherEntry, not narrative absence. Qualifying-feat choice and the chosen feat remain visible through normal manual-sheet selection and independent feat annotation. This parent classification does not count the feat effect as automated. No runtime prose inference or choice quota is introduced.

Rollback: revert this batch and its review-index receipt together, then regenerate the locked pipeline. Raw source bodies and intermediate proposals stay in ignored private cache.
