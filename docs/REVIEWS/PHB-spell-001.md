# Main source review — PHB-spell-001

Main reviewer independently read ten locked English entries including every higher-level section and compared their numbers, durations, targets, conditions and choices with the proposal. Complete selection metadata is retained; effect application is separately identified as deferred. All fifty contributions pass full-catalogue overlay checks and actual-layer override checks.

Rows: 50; verdicts: {"automated":0,"noMechanics":0,"unsupported":50}.
Overlay SHA-256: `45de81ffe6ed7a15f8ca299cfde5b10346a8038bf8567d0d18af6f902d551360`.
Upstream input lock: `f0bd87826cc219b1ddb7dd838a5539d16d98a129ca1331f6a2e8381a7333017f`.
English reference: v2.36.0 commit `3a09c05a3a3be94423cd2b3c33936034eeae02f2`.
Main reviewer: model:Codex-main, 2026-10-03. Sample errors: 0; accepted.

| Canonical sample | Source reference | Main finding |
| --- | --- | --- |
| kiwee:spell:phb:mass%20suggestion:::::::: | PHB p258 | Up to 12 visible hearing/understanding creatures, Wisdom save, charm immunity; reasonable activity, per-target end on completion or allied damage. Slots 7/8/9 duration 10d/30d/year+day; no concentration or charmed status. |
| kiwee:spell:phb:lesser%20restoration:::::::: | PHB p255 | Touch one creature, choose one disease or blinded/deafened/paralyzed/poisoned removal; action, instant, no upgrade. No healing or immunity grant. |
| kiwee:spell:phb:passwall:::::::: | PHB p264 | Visible wood/plaster/stone within 30 ft; passage maximum 5 by 8 by 20 ft for one hour; safe nearest unoccupied ejection at closing. No structural instability or permanent movement grant. |
| kiwee:spell:phb:wind%20walk:::::::: | PHB p288 | Caster plus at most 10 willing visible targets within 30 ft; cloud-only flight 300 ft and nonmagical-weapon damage resistance, restricted actions. One-minute transitions; expiry descent 60 ft/round for one minute then fall. Eight hours, no concentration. |
| kiwee:spell:phb:call%20lightning:::::::: | PHB p220 | Cloud requires visible overhead space, 120-ft placement, cylinder 10-ft height/60-ft radius. Initial and later action strikes affect creatures within 5 ft, Dexterity half of 3d10 lightning; existing outdoor storm adds 1d10, slot above 3 independently adds 1d10. Concentration 10 minutes. |
| kiwee:spell:phb:friends:::::::: | PHB p244 | Concentration up to one minute, Charisma checks against one initially nonhostile creature; expiry recognition and hostility, DM consequences. No charm status or global Charisma modifier. |
| kiwee:spell:phb:longstrider:::::::: | PHB p256 | Touched target speed +10 ft for one hour, no concentration; each slot above first adds one target. No walk-only or permanent movement grant. |
| kiwee:spell:phb:armor%20of%20agathys:::::::: | PHB p215; Foundry draft activity | Self 5 temporary HP; 5 cold retaliation on a melee hit only while those specific temporary HP remain. Both increase 5 per slot above first; one hour. Removed erroneous heal-other activity, with actual structured and Foundry override. |
| kiwee:spell:phb:glyph%20of%20warding:::::::: | PHB p245 | One-hour touch glyph, consumed materials at least 200 gp; diameter at most 10 ft, movement over 10 ft breaks it. Refined trigger/exemptions and Investigation vs spell DC. Runes 20-ft-radius sphere, Dex half 5d8 chosen type; or prepared spell <=3, stored during casting and retargeted on trigger. Slots add 1d8 or raise stored spell cap. |
| kiwee:spell:phb:disintegrate:::::::: | PHB p233 | Visible target within 60 ft: creature Dex failure 10d6+40 force, no listed success damage; zero HP means dust except magic items, resurrection only two named spells. Nonmagical objects/force: Large-or-smaller whole, Huge-or-larger 10-ft cube; magic items unaffected. +3d6 per slot above sixth, constant 40. |

All fifty are partial unsupported because casting/effect execution is outside this phase; this decision follows per-entry identified mechanisms and source review, not a blanket unreviewed spell verdict. In particular targeted temporary bonuses do not become permanent character modifiers. The incorrect Foundry Armor of Agathys healing action is explicitly reversed. Full source bodies are not published.

Rollback: revert this batch and its review-index receipt together, then regenerate the locked pipeline. Raw source bodies and intermediate proposals stay in ignored private cache.
