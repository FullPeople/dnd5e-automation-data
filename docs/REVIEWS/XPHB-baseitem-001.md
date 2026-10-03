# Main source review — XPHB-baseitem-001

Main independently inspected ten risk-selected complete English item bodies, locked identity/edition/entryIds, structured and Foundry candidates, and actual 2024 type/property/mastery definitions. Every proposed row has a separate complete-source annotation review.

Rows: 50; verdicts: {"automated":7,"noMechanics":0,"unsupported":43}.
Overlay SHA-256: `492d3ef8b5c5a944a682629b384c7e04bb5d3bee9bd52c6481b045ccfa5f8dc6`.
Upstream input lock: `f0bd87826cc219b1ddb7dd838a5539d16d98a129ca1331f6a2e8381a7333017f`.
English reference: v2.36.0 commit `3a09c05a3a3be94423cd2b3c33936034eeae02f2`.
Main reviewer: model:Codex-main, 2026-10-03. Sample errors: 0; accepted.

| Canonical sample | Source reference | Main finding |
| --- | --- | --- |
| kiwee:baseitem:xphb:alchemist's%20supplies:::::::: | XPHB p220; locked English v2.36.0 item/type/property/mastery source | Intelligence DC15 substance/fire uses; 2024 tool PB plus applicable skilled-check advantage, craft list; remove incomplete Foundry check. |
| kiwee:baseitem:xphb:arrows%20(20):::::::: | XPHB p222; locked English v2.36.0 item/type/property/mastery source | 20 arrows, 1 lb, 100 cp; each shot expenditure, free-hand loading, one-minute recovery; package unpacking remains explicit, no delivery grant. |
| kiwee:baseitem:xphb:blowgun:::::::: | XPHB p215; locked English v2.36.0 item/type/property/mastery source | 1 piercing, range25/100, Needle ammunition, Loading one shot per activation; Vex hit+damage and next same-target attack before end next turn. |
| kiwee:baseitem:xphb:chain%20mail:::::::: | XPHB p219; locked English v2.36.0 item/type/property/mastery source | Heavy armor AC16, Strength13, Stealth disadvantage, 55 lb, 7500 cp; armor threshold is not Heavy weapon rule. |
| kiwee:baseitem:xphb:crystal:::::::: | XPHB p224; locked English v2.36.0 item/type/property/mastery source | Explicit arcane focus, 1 lb, 1000 cp; empty item body, preserve operative equipment model. |
| kiwee:baseitem:xphb:firearm%20bullets%20(10):::::::: | XPHB p222; locked English v2.36.0 item/type/property/mastery source | Ten bullets, 2 lb,300 cp; destroyed in modern firearm, no generic retrieval on that use, contents not a rest resource. |
| kiwee:baseitem:xphb:half%20plate%20armor:::::::: | XPHB p219; locked English v2.36.0 item/type/property/mastery source | Medium AC15 Dex cap2 Stealth disadvantage,40 lb,75000 cp; no Strength threshold. |
| kiwee:baseitem:xphb:heavy%20crossbow:::::::: | XPHB p215; locked English v2.36.0 item/type/property/mastery source | Ranged Heavy tests Dexterity13; range100/400,bolt,1d10,Loading and2H; Push hit Large-or-smaller up to10ft straight away. |
| kiwee:baseitem:xphb:jeweler's%20tools:::::::: | XPHB p220; locked English v2.36.0 item/type/property/mastery source | Intelligence/DC15 gem valuation, conditional tool/skill proficiency; craft references are Arcane Focus and Holy Symbol groups, not selected items. |
| kiwee:baseitem:xphb:lance:::::::: | XPHB p215; locked English v2.36.0 item/type/property/mastery source | 2024 lance 1d10, restore H/R; 2H unless mounted retained as explicit limitation, Topple Constitution DC8+attack ability+PB. |

Known equipment models remain operative; combat, mastery, ammo settlement, crafting and conditional tool checks are identified explicitly where the current protocol/executor cannot complete them. No 2014 rules are imported, no unsupported mechanism is counted as automated. Revert batch and receipt together.

Rollback: revert this batch and its review-index receipt together, then regenerate the locked pipeline. Raw source bodies and intermediate proposals stay in ignored private cache.
