# Main source review — XDMG-item-001

Main reviewed ten complete English-source samples, including referenced 2024 Haste and old-base expansion. Conditional wearing/holding/attunement, item-owned charges, target exclusions, resource timing, potion exceptions and version binding were checked. The previous uncertain cross-edition variant and its first proposal remain in private evidence.

Rows: 50; verdicts: {"automated":4,"noMechanics":0,"unsupported":46}.
Overlay SHA-256: `6d1f8cdcc53a1f87af181d2de1ddc5bcb2cc7fe381bf703ff01820f7b003564c`.
Upstream input lock: `f0bd87826cc219b1ddb7dd838a5539d16d98a129ca1331f6a2e8381a7333017f`.
English reference: v2.36.0 commit `3a09c05a3a3be94423cd2b3c33936034eeae02f2`.
Main reviewer: model:Codex-main, 2026-10-03. Sample errors: 0; accepted.

| Canonical sample | Source reference | Main finding |
| --- | --- | --- |
| kiwee:item:xdmg:sword%20of%20kas:::::::: | english.raw.entries; spell Divine Word XPHB | Kas: own-weapon +3/critical 19–20/2d10 against Undead; initiative and resistance require carrying; spell uses independent once-per-dawn, DC 18, Divine Word Bonus Action; sentient item statistics never become wielder statistics. |
| kiwee:item:xdmg:periapt%20of%20proof%20against%20poison:::::::: | english.raw.entries/0 | Periapt: immunity to poison damage and Poisoned requires wearing and attunement; both conditional grants match the complete 2024 body. |
| kiwee:item:xdmg:staff%20of%20withering:::::::: | english.raw.entries; XPHB quarterstaff/Topple | Staff: optional 1 charge on hit adds 2d10 necrotic regardless save; CON DC 15 failure gives target STR/CON check/save disadvantage for 1 hour, three charges recover 1d3 at dawn; class attunement restriction stays explicit unsupported. |
| kiwee:item:xdmg:revolver%20(enspelled%20weapon%20(level%208))::::::::xdmg%7Crevolver%7Cxdmg%7Censpelled%20weapon%20(level%208) | english.raw.entries; XDMG Enspelled Weapon template | Level-8 Enspelled Revolver: six charges, dawn 1d6, creation fixes one allowed-school spell; held item casts with absolute DC 18/attack +10, without global bonuses or per-use reselection; six-shot reload and firearm handling deferred. |
| kiwee:item:xdmg:scroll%20of%20protection%20(undead):::::::: | english.raw.entries; expanded Scroll of Protection itemEntry | Undead scroll: consumed, Magic Action, 5-foot Emanation for 5 minutes; movement forcing protected overlap ends it; creature within 5 feet may use Magic Action/CHA DC 15 for individual exemption, not blanket dismissal. |
| kiwee:item:xdmg:alchemy%20jug:::::::: | english.raw.entries including liquid table | Alchemy Jug: selection and pouring are separate actions; 2 gallons/minute and liquid-specific daily quantities; one chosen liquid locks until dawn. Replicate-magic-item catalog alias removed rather than granting an artificer feature. |
| kiwee:item:xdmg:sickle%20(nine%20lives%20stealer)::::::::xphb%7Csickle%7Cxdmg%7Cnine%20lives%20stealer | english.raw.entries/1; XPHB Light/Nick | Nine Lives Sickle: +2 applies to its own attack/damage; 1d8+1 initial charges, no recovery, natural 20 against below 100 HP/CON DC 15, Constructs/Undead automatic success, charge spent only if slain; zero removes slaying only. Dice maximum is a source declaration: Web evaluator refuses automatic roll and shows a resource issue. |
| kiwee:item:xdmg:breastplate%20(mariner's%20armor)::::::::xphb%7Cbreastplate%7Cxdmg%7Cmariner's%20armor | english.raw.entries/0 | Mariner Breastplate: base AC 14/Dex cap 2/20 lb; worn Swim Speed equals current Speed, automatic 1d4 healing on turn start underwater at 0 HP, armor lock until dawn across wearers; no attunement or obsolete floating rule. |
| kiwee:item:xdmg:potion%20of%20speed:::::::: | english.raw.entries/0; spell Haste XPHB complete body | Potion: one consumed dose and Bonus Action drink/administer; 1-minute recipient Haste/+2 AC/doubled Speed/DEX-save Advantage/restricted extra action; no concentration or ending lethargy. Temporary deferred effect never grants permanent caster benefits. |
| kiwee:item:xdmg:light%20repeating%20crossbow%20(nine%20lives%20stealer)::::::::oota%7Clight%20repeating%20crossbow%7Cxdmg%7Cnine%20lives%20stealer | english.raw expansion; OotA Light Repeating Crossbow; XDMG Nine Lives Stealer | Cross-edition variant retains verified old-base 5 lb/simple/1d8/40–160/two-handed/six-bolt action reload and own +2; removed false XPHB base reference. No guessed 2024 mastery or automatic random-charge initialization; canonical expanded XDMG variant identity retained. |

46 entries retain concrete unsupported/deferred families where the current protocol or consumer cannot execute full item rules; four items have reviewed automated declarations. Random dice resource maxima declare source values only: the Web evaluator rejects dice evaluation and emits a visible issue rather than rolling, initializing a guessed maximum or refreshing it. Cross-edition expanded variant is explicitly unsupported; no publisher prose is published.

Rollback: revert this batch and its review-index receipt together, then regenerate the locked pipeline. Raw source bodies and intermediate proposals stay in ignored private cache.
