# Main source review — DMG-item-001

Main checked ten complete English-source samples, including independently reading the original English Ring of Resistance macro/table where the expanded bridge contains a translated damage token. Checked exact 2014 timing, item ownership, conditions, range, units, per-property counters and old-base variant references.

Rows: 50; verdicts: {"automated":8,"noMechanics":0,"unsupported":42}.
Overlay SHA-256: `c8ae8e3511c97210b36e6a948a2207da686918488792890cb5237c7b01f86a6f`.
Upstream input lock: `f0bd87826cc219b1ddb7dd838a5539d16d98a129ca1331f6a2e8381a7333017f`.
English reference: v2.36.0 commit `3a09c05a3a3be94423cd2b3c33936034eeae02f2`.
Main reviewer: model:Codex-main, 2026-10-03. Sample errors: 0; accepted.

| Canonical sample | Source reference | Main finding |
| --- | --- | --- |
| kiwee:item:dmg:azurite:::::::: | english.raw.value/entries | Azurite: 1000 copper pieces (10 GP), narrative color adds no operative rule; safe value model retained. |
| kiwee:item:dmg:cloak%20of%20elvenkind:::::::: | complete entries/0 | Cloak: wearing, attunement and hood-up required; only hide Stealth and observers seeing Perception affected; hood toggling Action, no unconditional skill grants. |
| kiwee:item:dmg:staff%20of%20thunder%20and%20lightning:::::::: | complete entries/0–5; PHB quarterstaff | Staff: five independent once-per-dawn properties, correct 2014 Action timing, Lightning 2d6 on hit, Thunder CON17 stun next-turn end, line 120x5/DEX17/9d6 half, 60-foot Thunderclap/CON17/2d6/deafness, combined spends only its own use. |
| kiwee:item:dmg:decanter%20of%20endless%20water:::::::: | complete entries/0–2 | Decanter: action command and fresh/salt choice, 1/5/30 gallons, flow until next turn start; bonus held aiming visible target <=30 feet/STR13/1d4/Prone or unworn uncarried object <=200 lb/push <=15 feet. |
| kiwee:item:dmg:ring%20of%20lightning%20resistance:::::::: | English items-base.json Ring of Resistance entriesTemplate; items.json DMG group/table | Original English macro plus fixed lightning/citrine table confirms worn resistance; both wearing and attunement conditions represented. Expanded bridge contains a translated damage token; independently checked English macro/table, no prose-derived guess. |
| kiwee:item:dmg:tome%20of%20understanding:::::::: | complete entries/0 | Tome: completed 48 hours study/practice within <=6 days grants reader WIS+2 and maximum+2, magic returns in a century. Benefit remains deferred, no wearing modifier or guessed ceiling. |
| kiwee:item:dmg:automatic%20pistol%20(weapon%20of%20warning)::::::::dmg%7Cautomatic%20pistol%7Cdmg%7Cweapon%20of%20warning | complete entries; DMG firearm properties p267–268 | Warning automatic pistol: carried/attuned initiative advantage; 30-foot companions, nonmagical-sleep incapacitation exception and natural-sleep combat wake; 50/150 range, 15-shot action/bonus reload, firearm bullets destroyed. |
| kiwee:item:dmg:whelm:::::::: | complete Whelm entries/1–6; attachedSpells daily 1e | Whelm: dwarf attunement, +3 own attacks; next-dawn after first attack triggers daytime-sky fear while attuned; 20/60 thrown +1d8 or +2d8 Giants, free-hand return; selected grounded shockwave 60 feet/CON15/1-minute stun/end-turn repeat; three independent dawn counters, weapon-owned senses/languages. |
| kiwee:item:dmg:double-bladed%20scimitar%20(vorpal%20sword)::::::::erlw%7Cdouble-bladed%20scimitar%7Cdmg%7Cvorpal%20sword | complete variant entries; ERLW Special; DMG Vorpal Sword | Vorpal: own +3 and slashing-resistance bypass, natural20/head survival and immunity/head/legendary/size exceptions, fallback6d8; old-base immediate Bonus Action after own Attack action has1d4 instead of2d4, not2024 mastery. |
| kiwee:item:dmg:energy%20cell%20(%2B3%20ammunition)::::::::dmg%7Cenergy%20cell%7Cdmg%7C%2B3%20ammunition | complete ammunition template entries/0; DMG energy-cell base | Cell ammunition: item-scoped +3 uses this piece; enchantment ends on hit. 5oz=0.3125lb retained; shot/cell lifecycle explicitly unsupported, no invented capacity/recharge or persistent bonus beyond first-hit rule. |

Eight entries automated, forty-two concretely unsupported; combat/temporary effects remain deferred. Carrying differs from wearing, sentient weapon statistics never become actor grants, dawn is not a rest, and unspecified energy-cell lifecycle is not filled with guessed numbers. No publisher bodies are included in the public overlay.

Rollback: revert this batch and its review-index receipt together, then regenerate the locked pipeline. Raw source bodies and intermediate proposals stay in ignored private cache.
