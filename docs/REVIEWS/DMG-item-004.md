# Main source review — DMG-item-004

Main independently read ten full English risk samples with exact draft/overlay comparison, plus additional ranged/holy-avenger samples. Checked actual 2014 condition and object ownership differences.

Rows: 50; verdicts: {"automated":4,"noMechanics":0,"unsupported":46}.
Overlay SHA-256: `eaecbb18cc8532a0f7afc304d6af66f8050f5eddbeb66a200bef01a398c45da5`.
Upstream input lock: `f0bd87826cc219b1ddb7dd838a5539d16d98a129ca1331f6a2e8381a7333017f`.
English reference: v2.36.0 commit `3a09c05a3a3be94423cd2b3c33936034eeae02f2`.
Main reviewer: model:Codex-main, 2026-10-03. Sample errors: 0; accepted.

| Canonical sample | Source reference | Main finding |
| --- | --- | --- |
| kiwee:item:dmg:bronze%20dragon%20scale%20mail:::::::: | DMG p165; complete English item/base/variant/property definition | Bronze scales worn/attuned +1 AC/lightningresist,14Dexcap2/45lb/Stealth. Dragon FrightfulPresence/breath saves and nearestbronze30mile onceDawn distinct, no always sense. |
| kiwee:item:dmg:folding%20boat:::::::: | DMG p170; complete English item/base/variant/property definition | Boat box12x6x6in4lb floating, three actioncommands boat10x4x2/4Medium vs ship24x8x6/15Medium with ordinaryvesselweight. Revertno creatures, onlyfittingcargo reenters; noinvented vesselweights. |
| kiwee:item:dmg:amethyst:::::::: | DMG p134; complete English item/base/variant/property definition | Amethyst fixed10000cp=100GP and descriptivecolor; complete supported value automated. |
| kiwee:item:dmg:longbow%20(%2B3%20weapon)::::::::phb%7Clongbow%7Cdmg%7C%2B3%20weapon | DMG p213; complete English item/base/variant/property definition | Longbow+3 ownattackdamage, martial1d8P2lb/150-600/arrows;2014SmallTinyHeavy disadvantage andattackonlytwohands, no2024Dex13. |
| kiwee:item:dmg:javelin%20(weapon%20of%20warning)::::::::phb%7Cjavelin%7Cdmg%7Cweapon%20of%20warning | DMG p213; complete English item/base/variant/property definition | WarningJavelin attunedcarriednotonlyequipped initiativeadv/companion30ft surprise exception incapacitatedotherthannonmagicalsleep; naturalwakecombatstart.30-120Thrownsameability, nofakebonus. |
| kiwee:item:dmg:longsword%20(holy%20avenger)::::::::phb%7Clongsword%7Cdmg%7Choly%20avenger | DMG p174; complete English item/base/variant/property definition | HolyAvenger+3Longsword1d8/1d10S, Paladinattune; FiendUndeadonly2d10Radiant anddrawnheldFriendlymagicsaveaura10/30atPaladin17. |
| kiwee:item:dmg:dagger%20of%20venom:::::::: | DMG p161; complete English item/base/variant/property definition | VenomDagger+1noattune actioncoatonceDawn1minuteorfirstcreaturehit;CON15 failure2d10Poison+Poisoned1min, successnohalf. Coatingendsfirsthitregardlesssave;2014F/L/T20-60 retained. |
| kiwee:item:dmg:ioun%20stone%2C%20leadership:::::::: | DMG p176; complete English item/base/variant/property definition | LeadershipIoun attunedactualorbit +2CHA cap20; no unconditionalbonus/finalmin20 loweringhigherCHA. Actionorbit1d3ft/stow, othersactionAC24attack orDexAcrobatics24, objectAC24HP10allresists/wornonlyorbit. |
| kiwee:item:dmg:figurine%20of%20wondrous%20power%2C%20golden%20lions:::::::: | DMG p169; complete English item/base/variant/property definition | GoldenLions actualpair canone/both, each1h andstated7dayreuse. Genericactioncommandthrow60groundfit, friendlyspokenorders/noordersdefense, duration0HP/touchactionrevert. No exact disputed cooldown-anchor operation, pool oractorstats encoded. |
| kiwee:item:dmg:daern's%20instant%20fortress:::::::: | DMG p160; complete English item/base/variant/property definition | 2014Fortress actioncube20square30high/emptydismiss, bonusdoorKnockimmune. AppearanceDex15 10d10Bhalf andpushedadjacent, looseobjectsdamagepush. EachcomponentHP100/nonmagicweaponsimmuneexceptsiege/othersresist, Wishonepart50HP only; no2024AC20/allHPrepair orbearerstat. |

50 rows:4 automated supported armor/value models and46 unsupported partial items. Held/carried/orbit/attunement are distinct; Leadership cap is unsupported, no raw-name inference. GoldenLions elapsed cooldown is deferred without choosing the disputed general/subtype starting boundary. No currentcharge initialization, numeric combat settlement or source-body publication.

Rollback: revert this batch and its review-index receipt together, then regenerate the locked pipeline. Raw source bodies and intermediate proposals stay in ignored private cache.
