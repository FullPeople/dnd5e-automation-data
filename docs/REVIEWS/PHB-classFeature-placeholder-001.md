# Main source review — PHB-classFeature-placeholder-001

Plan G6 step1 permits rule-based classification of subclass placeholders. Main inspected all34 complete one-sentence bodies and every raw key, then recorded ten distinct class/level risk samples. The exact finite template family excludes selection-introduction text, grants, progression tables and actual subclass mechanics.

Rows: 34; verdicts: {"automated":0,"noMechanics":34,"unsupported":0}.
Overlay SHA-256: `ac23d2d9026cfd29a45f8750813a70a7e1afdf631fb18e65ee9470b0af26f539`.
Upstream input lock: `f0bd87826cc219b1ddb7dd838a5539d16d98a129ca1331f6a2e8381a7333017f`.
English reference: v2.36.0 commit `3a09c05a3a3be94423cd2b3c33936034eeae02f2`.
Main reviewer: model:Codex-main, 2026-10-03. Sample errors: 0; accepted.

| Canonical sample | Source reference | Main finding |
| --- | --- | --- |
| kiwee:classfeature:phb:martial%20archetype%20feature:phb:fighter:::7::: | PHB p72; locked complete classFeature body | One selected-subclass feature pointer at level 7 for Fighter; no candidate or additional operative raw field. Actual subclassFeature mechanics are separate. |
| kiwee:classfeature:phb:ranger%20archetype%20feature:phb:ranger:::7::: | PHB p89; locked complete classFeature body | One selected-subclass feature pointer at level 7 for Ranger; no candidate or additional operative raw field. Actual subclassFeature mechanics are separate. |
| kiwee:classfeature:phb:arcane%20tradition%20feature:phb:wizard:::10::: | PHB p112; locked complete classFeature body | One selected-subclass feature pointer at level 10 for Wizard; no candidate or additional operative raw field. Actual subclassFeature mechanics are separate. |
| kiwee:classfeature:phb:druid%20circle%20feature:phb:druid:::10::: | PHB p64; locked complete classFeature body | One selected-subclass feature pointer at level 10 for Druid; no candidate or additional operative raw field. Actual subclassFeature mechanics are separate. |
| kiwee:classfeature:phb:roguish%20archetype%20feature:phb:rogue:::17::: | PHB p94; locked complete classFeature body | One selected-subclass feature pointer at level 17 for Rogue; no candidate or additional operative raw field. Actual subclassFeature mechanics are separate. |
| kiwee:classfeature:phb:sorcerous%20origin%20feature:phb:sorcerer:::18::: | PHB p99; locked complete classFeature body | One selected-subclass feature pointer at level 18 for Sorcerer; no candidate or additional operative raw field. Actual subclassFeature mechanics are separate. |
| kiwee:classfeature:phb:bard%20college%20feature:phb:bard:::6::: | PHB p51; locked complete classFeature body | One selected-subclass feature pointer at level 6 for Bard; no candidate or additional operative raw field. Actual subclassFeature mechanics are separate. |
| kiwee:classfeature:phb:sacred%20oath%20feature:phb:paladin:::7::: | PHB p82; locked complete classFeature body | One selected-subclass feature pointer at level 7 for Paladin; no candidate or additional operative raw field. Actual subclassFeature mechanics are separate. |
| kiwee:classfeature:phb:path%20feature:phb:barbarian:::10::: | PHB p46; locked complete classFeature body | One selected-subclass feature pointer at level 10 for Barbarian; no candidate or additional operative raw field. Actual subclassFeature mechanics are separate. |
| kiwee:classfeature:phb:otherworldly%20patron%20feature:phb:warlock:::6::: | PHB p105; locked complete classFeature body | One selected-subclass feature pointer at level 6 for Warlock; no candidate or additional operative raw field. Actual subclassFeature mechanics are separate. |

Only genuine pointers become noMechanics/placeholder. This does not classify operative subclassFeature records or initial subclass-selection introductions as complete, and does not fabricate an automatic grant or choice quota. Revert batch and receipt together.

Rollback: revert this batch and its review-index receipt together, then regenerate the locked pipeline. Raw source bodies and intermediate proposals stay in ignored private cache.
