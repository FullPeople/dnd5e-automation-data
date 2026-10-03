# Main source review — XPHB-baseitem-002

Main independently inspected ten risk-selected complete English item bodies, locked identity/edition/entryIds, structured and Foundry candidates, and actual 2024 type/property/mastery definitions. Every proposed row has a separate complete-source annotation review.

Rows: 44; verdicts: {"automated":10,"noMechanics":0,"unsupported":34}.
Overlay SHA-256: `d96f503ab1cadc16392f36b63c6084c21cf8f5960f9d46478350684557f1747c`.
Upstream input lock: `f0bd87826cc219b1ddb7dd838a5539d16d98a129ca1331f6a2e8381a7333017f`.
English reference: v2.36.0 commit `3a09c05a3a3be94423cd2b3c33936034eeae02f2`.
Main reviewer: model:Codex-main, 2026-10-03. Sample errors: 0; accepted.

| Canonical sample | Source reference | Main finding |
| --- | --- | --- |
| kiwee:baseitem:xphb:musket:::::::: | XPHB p215; locked English v2.36.0 item/type/property/mastery source | Musket1d12,40/120,50000cp;2024 Ammunition,Loading and2H; Slow hit+damage reduces10ft until start next turn capped10. |
| kiwee:baseitem:xphb:needles%20(50):::::::: | XPHB p222; locked English v2.36.0 item/type/property/mastery source | Fifty needles pack1lb100cp; one per shot,free-hand loading,minute-search half recovery; 2024 property rounds down, pouch separate. |
| kiwee:baseitem:xphb:plate%20armor:::::::: | XPHB p219; locked English v2.36.0 item/type/property/mastery source | Heavy AC18 Strength15 Stealth disadvantage65lb150000cp; requirement not ability grant. |
| kiwee:baseitem:xphb:potter's%20tools:::::::: | XPHB p221; locked English v2.36.0 item/type/property/mastery source | Intelligence/DC15 determines ceramic contents past24h; Jug/Lamp crafts; no 2014 reconstruction/repair. |
| kiwee:baseitem:xphb:scimitar:::::::: | XPHB p215; locked English v2.36.0 item/type/property/mastery source | Finesse same STR/DEX choice; Light different weapon extra attack omits positive damage modifier; unlocked Nick moves same extra attack into action once per turn. |
| kiwee:baseitem:xphb:shield:::::::: | XPHB p219; locked English v2.36.0 item/type/property/mastery source | Shield contribution2,6lb1000cp supported equipment model; no permanent global modifier or stacking. |
| kiwee:baseitem:xphb:sling%20bullets%20(20):::::::: | XPHB p222; locked English v2.36.0 item/type/property/mastery source | Twenty sling bullets1.5lb4cp total, not4cp each; shot/recovery and contents explicit; pouch separate. |
| kiwee:baseitem:xphb:staff:::::::: | XPHB p224; locked English v2.36.0 item/type/property/mastery source | Staff arcane focus plus explicit simple melee1d6/versatile1d8,Topple feature-gated DC8+actual attack ability+PB; corrected category from other to weapon. |
| kiwee:baseitem:xphb:tinker's%20tools:::::::: | XPHB p221; locked English v2.36.0 item/type/property/mastery source | Dexterity/DC20 Tiny scrap assembly with1minute expiry; actual2024 craft list, no XGE hourly healing or permanent item grant. |
| kiwee:baseitem:xphb:wooden%20staff:::::::: | XPHB p225; locked English v2.36.0 item/type/property/mastery source | Wooden Staff XPHB p225 preserved; druid focus plus simple melee1d6/1d8 Versatile and Topple, no parent identity substitution. |

Known equipment models remain operative; combat, mastery, ammo settlement, crafting and conditional tool checks are identified explicitly where the current protocol/executor cannot complete them. No 2014 rules are imported, no unsupported mechanism is counted as automated. Revert batch and receipt together.

Rollback: revert this batch and its review-index receipt together, then regenerate the locked pipeline. Raw source bodies and intermediate proposals stay in ignored private cache.
