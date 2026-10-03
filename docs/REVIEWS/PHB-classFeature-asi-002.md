# Main source review — PHB-classFeature-asi-002

Main reviewed the complete English ASI template for every declared level and actual source field set, then independently sampled ten class/level/page identities. Real ability allocation and score ceiling are identified as unsupported, not a noMechanics placeholder.

Rows: 13; verdicts: {"automated":0,"noMechanics":0,"unsupported":13}.
Overlay SHA-256: `5c449912dfc834cda8abdac85bb51a584af14506d7dfdd0cb2c618070a359f59`.
Upstream input lock: `f0bd87826cc219b1ddb7dd838a5539d16d98a129ca1331f6a2e8381a7333017f`.
English reference: v2.36.0 commit `3a09c05a3a3be94423cd2b3c33936034eeae02f2`.
Main reviewer: model:Codex-main, 2026-10-03. Sample errors: 0; accepted.

| Canonical sample | Source reference | Main finding |
| --- | --- | --- |
| kiwee:classfeature:phb:ability%20score%20improvement:phb:sorcerer:::19::: | PHB p99; Sorcerer level 19 | One selected score +2 or two distinct scores +1; feature cannot raise a score above 20. A feat replaces this allocation only if DM allows. No unconditional bonus, recovery period, duplicate grant or cap removal is introduced. |
| kiwee:classfeature:phb:ability%20score%20improvement:phb:sorcerer:::4::: | PHB p99; Sorcerer level 4 | One selected score +2 or two distinct scores +1; feature cannot raise a score above 20. A feat replaces this allocation only if DM allows. No unconditional bonus, recovery period, duplicate grant or cap removal is introduced. |
| kiwee:classfeature:phb:ability%20score%20improvement:phb:sorcerer:::8::: | PHB p99; Sorcerer level 8 | One selected score +2 or two distinct scores +1; feature cannot raise a score above 20. A feat replaces this allocation only if DM allows. No unconditional bonus, recovery period, duplicate grant or cap removal is introduced. |
| kiwee:classfeature:phb:ability%20score%20improvement:phb:warlock:::16::: | PHB p105; Warlock level 16 | One selected score +2 or two distinct scores +1; feature cannot raise a score above 20. A feat replaces this allocation only if DM allows. No unconditional bonus, recovery period, duplicate grant or cap removal is introduced. |
| kiwee:classfeature:phb:ability%20score%20improvement:phb:warlock:::19::: | PHB p105; Warlock level 19 | One selected score +2 or two distinct scores +1; feature cannot raise a score above 20. A feat replaces this allocation only if DM allows. No unconditional bonus, recovery period, duplicate grant or cap removal is introduced. |
| kiwee:classfeature:phb:ability%20score%20improvement:phb:warlock:::4::: | PHB p105; Warlock level 4 | One selected score +2 or two distinct scores +1; feature cannot raise a score above 20. A feat replaces this allocation only if DM allows. No unconditional bonus, recovery period, duplicate grant or cap removal is introduced. |
| kiwee:classfeature:phb:ability%20score%20improvement:phb:wizard:::12::: | PHB p112; Wizard level 12 | One selected score +2 or two distinct scores +1; feature cannot raise a score above 20. A feat replaces this allocation only if DM allows. No unconditional bonus, recovery period, duplicate grant or cap removal is introduced. |
| kiwee:classfeature:phb:ability%20score%20improvement:phb:wizard:::16::: | PHB p112; Wizard level 16 | One selected score +2 or two distinct scores +1; feature cannot raise a score above 20. A feat replaces this allocation only if DM allows. No unconditional bonus, recovery period, duplicate grant or cap removal is introduced. |
| kiwee:classfeature:phb:ability%20score%20improvement:phb:wizard:::19::: | PHB p112; Wizard level 19 | One selected score +2 or two distinct scores +1; feature cannot raise a score above 20. A feat replaces this allocation only if DM allows. No unconditional bonus, recovery period, duplicate grant or cap removal is introduced. |
| kiwee:classfeature:phb:ability%20score%20improvement:phb:wizard:::8::: | PHB p112; Wizard level 8 | One selected score +2 or two distinct scores +1; feature cannot raise a score above 20. A feat replaces this allocation only if DM allows. No unconditional bonus, recovery period, duplicate grant or cap removal is introduced. |

Supported abilityScore grants add saved amounts without expressing this feature-specific ceiling. Declaring an uncapped bonus would be wrong at score 19 or for already higher scores, so this batch declares the actual three unsupported mechanism families.

Rollback: revert this batch and its review-index receipt together, then regenerate the locked pipeline. Raw source bodies and intermediate proposals stay in ignored private cache.
