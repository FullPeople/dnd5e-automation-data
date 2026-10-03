# Main source review — DMG-baseitem-001

Main independently read ten risk-selected complete item bodies, structured candidates and the actual 2014 DMG Firearms section including proficiency, Ammunition, Burst Fire, Reload and all source tables. Edition and all canonical entryIds checked.

Rows: 15; verdicts: {"automated":0,"noMechanics":0,"unsupported":15}.
Overlay SHA-256: `2100ab4bb5c59c21dd6addb574c67d26a4a6fd1bcfdea76191390d4ca3148085`.
Upstream input lock: `f0bd87826cc219b1ddb7dd838a5539d16d98a129ca1331f6a2e8381a7333017f`.
English reference: v2.36.0 commit `3a09c05a3a3be94423cd2b3c33936034eeae02f2`.
Main reviewer: model:Codex-main, 2026-10-03. Sample errors: 0; accepted.

| Canonical sample | Source reference | Main finding |
| --- | --- | --- |
| kiwee:baseitem:dmg:antimatter%20rifle:::::::: | DMG pp267-268; locked English item and full Firearms property/table section | Antimatter6d8 necrotic120/360,2shot full cell,2H;actual2014 DMG267 full-load energy rule, no rest resource. |
| kiwee:baseitem:dmg:hunting%20rifle:::::::: | DMG pp267-268; locked English item and full Firearms property/table section | Hunting2d10 piercing80/240,reload5,2H8lb;destroyed modern bullets; reload action or bonus action. |
| kiwee:baseitem:dmg:shotgun:::::::: | DMG pp267-268; locked English item and full Firearms property/table section | Shotgun2d8 piercing30/90,reload2,2H7lb;no cone or scatter area invented. |
| kiwee:baseitem:dmg:laser%20pistol:::::::: | DMG pp267-268; locked English item and full Firearms property/table section | Laser Pistol3d6 radiant40/120,reload50,2lb,one-handed free-hand loading;full-load cell per actual2014 rule. |
| kiwee:baseitem:dmg:musket:::::::: | DMG pp267-268; locked English item and full Firearms property/table section | Musket1d12 piercing40/120,50000cp10lb,Loading one per activation,2H;DMG firearm ammo destroyed, no half retrieval. |
| kiwee:baseitem:dmg:automatic%20rifle:::::::: | DMG pp267-268; locked English item and full Firearms property/table section | Automatic Rifle2d8 piercing80/240,reload30;burst action10bullets10ftcube within normal range,DexDC15 fail normal damage, no2014 shared-roll instruction. |
| kiwee:baseitem:dmg:energy%20cell:::::::: | DMG pp267-268; locked English item and full Firearms property/table section | Energy Cell5oz=0.3125lb;2014 full-load shots vary2/30/50 by firearm,not2024 rechargeable text;no price/rest regeneration. |
| kiwee:baseitem:dmg:modern%20bullets%20(10):::::::: | DMG pp267-268; locked English item and full Firearms property/table section | Ten Modern Bullets1lb,no fixed price;contents10x0.1lb,consumption/destruction,notregenerating pool. |
| kiwee:baseitem:dmg:renaissance%20bullet:::::::: | DMG pp267-268; locked English item and full Firearms property/table section | Renaissance single bullet0.2lb30cp,actualfirearmconsumption/destruction;no generic ammunition retrieval. |
| kiwee:baseitem:dmg:renaissance%20bullets%20(10):::::::: | DMG pp267-268; locked English item and full Firearms property/table section | Ten renaissance bullets2lb300cptotal,package10 exact;no doubled grant or rest recovery. |

All15 have explicit identified limitations for target damage, range, ammo lifecycle, free-hand/2H/loading/reload or package unpacking. Safe inventory/weapon models retained and burst action remains visibly deferred. Energy Cell2014 full-load rule is not copied into2024. Raw bodies stay private; no unsupported mechanism counted automated.

Rollback: revert this batch and its review-index receipt together, then regenerate the locked pipeline. Raw source bodies and intermediate proposals stay in ignored private cache.
