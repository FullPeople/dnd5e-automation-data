# Main source review — XPHB-classFeature-asi-002

Main reviewed every complete single feat-pointer sentence and checked any listed repeat levels exist as distinct classFeature identities. Ten independent source samples (or all remaining rows) confirm the pointer classification expressly permitted by G6 step 1. The actual XPHB feat is independently present and still requires its own mechanism review.

Rows: 1; verdicts: {"automated":0,"noMechanics":1,"unsupported":0}.
Overlay SHA-256: `3f97e62c621d21d2f92440f9b23734bd80efc06e537f08a72d0ace1694da8998`.
Upstream input lock: `f0bd87826cc219b1ddb7dd838a5539d16d98a129ca1331f6a2e8381a7333017f`.
English reference: v2.36.0 commit `3a09c05a3a3be94423cd2b3c33936034eeae02f2`.
Main reviewer: model:Codex-main, 2026-10-03. Sample errors: 0; accepted.

| Canonical sample | Source reference | Main finding |
| --- | --- | --- |
| kiwee:classfeature:xphb:ability%20score%20improvement:xphb:wizard:::8::: | XPHB p167; Wizard level 8 | Full body only directs selection of one qualifying feat. Operative ASI rules belong to that feat; any repeat levels are separate records. No direct +2 score bonus or new resource is present in this class pointer. |

The reason is choiceOfOtherEntry, not narrative absence. Qualifying-feat choice and the chosen feat remain visible through normal manual-sheet selection and independent feat annotation. This parent classification does not count the feat effect as automated. No runtime prose inference or choice quota is introduced.

Rollback: revert this batch and its review-index receipt together, then regenerate the locked pipeline. Raw source bodies and intermediate proposals stay in ignored private cache.
