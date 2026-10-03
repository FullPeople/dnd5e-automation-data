# Main source review — XDMG-item-003

Ten complete expanded 2024 item source samples reviewed by main. Linked Moonblade Minor Property table and Ingested poison type were read in the original English book, in addition to each full item body. Checked selected-instance rune rules, wrong-edition base links, duration/trigger/recovery/target ownership and unsafe Foundry proxies.

Rows: 50; verdicts: {"automated":8,"noMechanics":0,"unsupported":42}.
Overlay SHA-256: `33dbaedfc22501ac211d19c1c0d70047a55fcd879ab6f48b96338074949a175e`.
Upstream input lock: `f0bd87826cc219b1ddb7dd838a5539d16d98a129ca1331f6a2e8381a7333017f`.
English reference: v2.36.0 commit `3a09c05a3a3be94423cd2b3c33936034eeae02f2`.
Main reviewer: model:Codex-main, 2026-10-03. Sample errors: 0; accepted.

| Canonical sample | Source reference | Main finding |
| --- | --- | --- |
| kiwee:item:xdmg:ring%20mail%20(enspelled%20armor%20(level%201))::::::::xphb%7Cring%20mail%7Cxdmg%7Censpelled%20armor%20(level%201) | complete expanded Enspelled Armor level1 body | Ring Mail:6charges/dawn1d6, creation-fixed level1 Abjuration/Illusion, worn+attuned one-charge cast/DC13/attack5; absolute values not global bonuses or per-use reselection. |
| kiwee:item:xdmg:energy%20cell%20(%2B3%20ammunition)::::::::xdmg%7Cenergy%20cell%7Cxdmg%7C%2B3%20ammunition | complete ammunition template; XDMG futuristic AF | 2024 cell weighs0.5lb, piece-bound +3, magic lost on first hit separately from depleted physical cell; recharge at GM discretion, no guessed capacity or restored enchantment. |
| kiwee:item:xdmg:rope%20of%20climbing:::::::: | complete entries/0–2 | Climbing rope: held Magic command10ft initially/turn start,60ft length/3000lb; knots each1ft shorten50ft and only rope-climb checks gain advantage; objectAC20/HP20/Poison-Psychic immunity/1HP per5min alive, not actor grants. |
| kiwee:item:xdmg:wand%20of%20paralysis:::::::: | complete entries/0–1 | Paralysis wand:spellcaster attunement,7charges/dawn1d6+1; held Magic action1charge visible target<=60ft/CON15/1min paralysis, end-turn repeats; zero damage, final-charge d20=1 destruction. |
| kiwee:item:xdmg:mirror%20of%20life%20trapping:::::::: | complete entries/0–7 | Mirror:own AC11/HP10/immunities/vulnerability, vertical/five-foot Magic command;other reflector within30ft CHA15/informed advantage/Construct autosuccess;12cells/random full release, shatter all, command communication/release; nested10ft no-total-cover one-way Astral catastrophe. |
| kiwee:item:xdmg:scimitar%20(moonblade)::::::::xphb%7Cscimitar%7Cxdmg%7Cmoonblade | complete Moonblade entries and all d100 rows; XDMG Minor Property full d20 table | Moonblade:chosen-bearer instant binding/rejection curse24h; first+1, history runes not charges, correct+3 and3d6 caps, Throw20/60/crit19-20/flashCON15/rest/one Fey Shadow options; minor table20 rolls twice/rerolls20; item-owned sentience only. |
| kiwee:item:xdmg:flail%20(holy%20avenger)::::::::xphb%7Cflail%7Cxdmg%7Choly%20avenger | complete entries/0–2; XPHB Sap | Holy Avenger:+3 own weapon, only Fiend/Undead hit2d10 Radiant; Paladin prerequisite, held drawn aura friendly magic saves10ft or30ft at Paladin17+, not total level/carry/universal saves. |
| kiwee:item:xdmg:hoopak%20(%2B3%20weapon)::::::::dsotdq%7Choopak%7Cxdmg%7C%2B3%20weapon | complete DSotDQ Hoopak inherited body/properties | Legacy Hoopak mode:own +3/2lb/melee1d6P ignores Ammunition, ranged40/160 uses sling1d4B; remove execution-layer wrong-edition base while retaining independently verified common Finesse/two-hand values; no guessed mastery. |
| kiwee:item:xdmg:book%20of%20vile%20darkness:::::::: | complete Book of Vile Darkness body; cited 2024 spell casting times | Book:non-Fiend/Undead CHA17 larva/Wish;80h study;different scores+2 cap24/-2 floor3, carried exhaustion immunity, held DC18 four independent dawn spells, Animate Dead1min; self1d12/near15ft3d6 Psychic exclusions, conduct/death/destruction/3-1-3-2 properties deferred, no study-use pool. |
| kiwee:item:xdmg:pale%20tincture:::::::: | complete entries/0; XDMG Ingested poison type | Pale Tincture:250GP, ingested full dose/partialDM;CON16 failure1d6 Poison+Poisoned, repeat24h/seven total successes, damage-specific unhealable while Poisoned; no half on success, HP-max loss or fixed24h expiry. |

Eight automated declarations, forty-two entries with concrete unsupported/deferred procedures. All object defenses, sentience, temporary target conditions and artifact effects remain with their actual owner; no caster/grant transfer or guessed source values. Creation-fixed spells need a bound instance choice before execution. Publisher text remains private.

Rollback: revert this batch and its review-index receipt together, then regenerate the locked pipeline. Raw source bodies and intermediate proposals stay in ignored private cache.
