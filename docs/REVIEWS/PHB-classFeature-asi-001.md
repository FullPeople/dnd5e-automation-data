# Main source review — PHB-classFeature-asi-001

Main reviewed the complete English ASI template for every declared level and actual source field set, then independently sampled ten class/level/page identities. Real ability allocation and score ceiling are identified as unsupported, not a noMechanics placeholder.

Rows: 50; verdicts: {"automated":0,"noMechanics":0,"unsupported":50}.
Overlay SHA-256: `31ddbb21bba2de11d70ba950e8ccca0c43a592cfe7c740c770a8bb67e9a85b93`.
Upstream input lock: `f0bd87826cc219b1ddb7dd838a5539d16d98a129ca1331f6a2e8381a7333017f`.
English reference: v2.36.0 commit `3a09c05a3a3be94423cd2b3c33936034eeae02f2`.
Main reviewer: model:Codex-main, 2026-10-03. Sample errors: 0; accepted.

| Canonical sample | Source reference | Main finding |
| --- | --- | --- |
| kiwee:classfeature:phb:ability%20score%20improvement:phb:barbarian:::12::: | PHB p46; Barbarian level 12 | One selected score +2 or two distinct scores +1; feature cannot raise a score above 20. A feat replaces this allocation only if DM allows. No unconditional bonus, recovery period, duplicate grant or cap removal is introduced. |
| kiwee:classfeature:phb:ability%20score%20improvement:phb:bard:::12::: | PHB p51; Bard level 12 | One selected score +2 or two distinct scores +1; feature cannot raise a score above 20. A feat replaces this allocation only if DM allows. No unconditional bonus, recovery period, duplicate grant or cap removal is introduced. |
| kiwee:classfeature:phb:ability%20score%20improvement:phb:cleric:::12::: | PHB p56; Cleric level 12 | One selected score +2 or two distinct scores +1; feature cannot raise a score above 20. A feat replaces this allocation only if DM allows. No unconditional bonus, recovery period, duplicate grant or cap removal is introduced. |
| kiwee:classfeature:phb:ability%20score%20improvement:phb:druid:::16::: | PHB p64; Druid level 16 | One selected score +2 or two distinct scores +1; feature cannot raise a score above 20. A feat replaces this allocation only if DM allows. No unconditional bonus, recovery period, duplicate grant or cap removal is introduced. |
| kiwee:classfeature:phb:ability%20score%20improvement:phb:fighter:::14::: | PHB p72; Fighter level 14 | One selected score +2 or two distinct scores +1; feature cannot raise a score above 20. A feat replaces this allocation only if DM allows. No unconditional bonus, recovery period, duplicate grant or cap removal is introduced. |
| kiwee:classfeature:phb:ability%20score%20improvement:phb:monk:::12::: | PHB p76; Monk level 12 | One selected score +2 or two distinct scores +1; feature cannot raise a score above 20. A feat replaces this allocation only if DM allows. No unconditional bonus, recovery period, duplicate grant or cap removal is introduced. |
| kiwee:classfeature:phb:ability%20score%20improvement:phb:paladin:::12::: | PHB p82; Paladin level 12 | One selected score +2 or two distinct scores +1; feature cannot raise a score above 20. A feat replaces this allocation only if DM allows. No unconditional bonus, recovery period, duplicate grant or cap removal is introduced. |
| kiwee:classfeature:phb:ability%20score%20improvement:phb:ranger:::16::: | PHB p89; Ranger level 16 | One selected score +2 or two distinct scores +1; feature cannot raise a score above 20. A feat replaces this allocation only if DM allows. No unconditional bonus, recovery period, duplicate grant or cap removal is introduced. |
| kiwee:classfeature:phb:ability%20score%20improvement:phb:rogue:::12::: | PHB p94; Rogue level 12 | One selected score +2 or two distinct scores +1; feature cannot raise a score above 20. A feat replaces this allocation only if DM allows. No unconditional bonus, recovery period, duplicate grant or cap removal is introduced. |
| kiwee:classfeature:phb:ability%20score%20improvement:phb:sorcerer:::16::: | PHB p99; Sorcerer level 16 | One selected score +2 or two distinct scores +1; feature cannot raise a score above 20. A feat replaces this allocation only if DM allows. No unconditional bonus, recovery period, duplicate grant or cap removal is introduced. |

Supported abilityScore grants add saved amounts without expressing this feature-specific ceiling. Declaring an uncapped bonus would be wrong at score 19 or for already higher scores, so this batch declares the actual three unsupported mechanism families.

Rollback: revert this batch and its review-index receipt together, then regenerate the locked pipeline. Raw source bodies and intermediate proposals stay in ignored private cache.
