# Main source review — DMG-item-003

Main independently read ten sampled complete English sources and matching overlays, plus the DMG Armor of Resistance macro and extra risk samples (radiant/copper armor and Staff of Striking).

Rows: 50; verdicts: {"automated":14,"noMechanics":0,"unsupported":36}.
Overlay SHA-256: `a1b496cfb61d3a75452757d3fb56e159f5dd67810ad2cda2b8228cb568fdcb24`.
Upstream input lock: `f0bd87826cc219b1ddb7dd838a5539d16d98a129ca1331f6a2e8381a7333017f`.
English reference: v2.36.0 commit `3a09c05a3a3be94423cd2b3c33936034eeae02f2`.
Main reviewer: model:Codex-main, 2026-10-03. Sample errors: 0; accepted.

| Canonical sample | Source reference | Main finding |
| --- | --- | --- |
| kiwee:item:dmg:light%20hammer%20(weapon%20of%20warning)::::::::phb%7Clight%20hammer%7Cdmg%7Cweapon%20of%20warning | DMG p213; complete English item/base/variant and property definitions | Warning light hammer: attuned, carried rather than necessarily wielded; 30-foot companions, non-sleep incapacitation exception, natural-sleep wake at combat. 20/60 thrown and original Light deferred. |
| kiwee:item:dmg:cap%20of%20water%20breathing:::::::: | DMG p157; complete English item/base/variant and property definitions | Cap requires wearing underwater and action command; bubble ends repeat command/removal/leaving water. No guessed dismissal cost, charge or swim speed. |
| kiwee:item:dmg:gold%20dragon%20scale%20mail:::::::: | DMG p165; complete English item/base/variant and property definitions | Gold scales: AC14 Dex cap2,45lb Stealth; worn/attuned +1 AC and fire resistance, save advantage against all dragons breath/Frightful Presence; nearest gold within30 miles once/dawn. |
| kiwee:item:dmg:fragmentation%20grenade:::::::: | DMG p268; complete English item/base/variant and property definitions | Fragmentation grenade: action point60 feet, launcher120, exploding20-foot radius DC15 Dex 5d6 piercing/half. No invented fuse, attack roll or replenishing resource. |
| kiwee:item:dmg:rapier%20(defender)::::::::phb%7Crapier%7Cdmg%7Cdefender | DMG p164; complete English item/base/variant and property definitions | Defender Rapier: baseline +3 own weapon, first own-turn attack may transfer some/all to held AC until next-turn start; remove contradictory unconditional AC+1, transfer deferred. |
| kiwee:item:dmg:half%20plate%20armor%20(%2B2%20armor)::::::::phb%7Chalf%20plate%20armor%7Cdmg%7C%2B2%20armor | DMG p152; complete English item/base/variant and property definitions | Half plate +2: baseAC15 Dex cap2 weight40 Stealth disadvantage; +2 AC only worn, no attunement or invented Strength. Complete model automated. |
| kiwee:item:dmg:chain%20shirt%20(armor%20of%20acid%20resistance)::::::::phb%7Cchain%20shirt%7Cdmg%7Carmor%20of%20acid%20resistance | DMG p152; complete English item/base/variant and property definitions | Actual DMG Armor of Resistance entriesTemplate independently read and expanded with acid: chain shirt AC13 Dexcap2 weight20, fixed acid resistance worn AND attuned. |
| kiwee:item:dmg:talisman%20of%20pure%20good:::::::: | DMG p207; complete English item/base/variant and property definitions | Talisman good attunement; neutral6d6/evil8d6 radiant touch/end-turn carry, spell +2 and holy symbol only good Cleric/Paladin worn/held, generic spell bonus removed. Seven nonrecovering charges, visible grounded evil target120ft DC20 Dex or destroyed, finalcharge destruction. |
| kiwee:item:dmg:splint%20armor%20(mithral%20armor)::::::::phb%7Csplint%20armor%7Cdmg%7Cmithral%20armor | DMG p182; complete English item/base/variant and property definitions | Mithral splint AC17 weight60, no Stealth disadvantage and removed Strength requirement. No weight reduction or under-clothes permission for splint; missing strength correctly prevents inherited mundane requirement. |
| kiwee:item:dmg:pipes%20of%20the%20sewers:::::::: | DMG p185; complete English item/base/variant and property definitions | Pipes require wind-instrument proficiency, do not grant it; action play then bonus1-3 charges, each swarm from half-mile DM availability or wasted. Cha vs swarm Wis within30ft; action eachround/hearing,24h loss block; capacity3 dawn1d3, bard-specific focus deferred. |

50 rows: 14 automated supported armor models,36 unsupported partial equipment/action records. Defender allocation, Pipes prerequisites/action chain, target conditions, dawn dice and final-charge changes remain explicit; no fabricated remaining count or automatic combat settlement. Full original 2014 base mechanics retained; no 2024 property substitution.

Rollback: revert this batch and its review-index receipt together, then regenerate the locked pipeline. Raw source bodies and intermediate proposals stay in ignored private cache.
