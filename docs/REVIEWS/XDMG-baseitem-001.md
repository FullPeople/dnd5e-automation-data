# Main source review — XDMG-baseitem-001

Main independently reviewed all nine complete item bodies and the whole 2024 Firearms section/table, plus exact structured models and edition-specific property/mastery clauses. Initial four uncertain-cell notes are preserved privately. Main identifies their classification as source-defined GM procedure with no executable quantitative model, after confirming that the complete source deliberately gives no numerical contract.

Rows: 9; verdicts: {"automated":0,"noMechanics":0,"unsupported":9}.
Overlay SHA-256: `9a086f53106681534562a50a72d03211fe129a44fcb061f7249446174ef4ea24`.
Upstream input lock: `f0bd87826cc219b1ddb7dd838a5539d16d98a129ca1331f6a2e8381a7333017f`.
English reference: v2.36.0 commit `3a09c05a3a3be94423cd2b3c33936034eeae02f2`.
Main reviewer: model:Codex-main, 2026-10-03. Sample errors: 0; accepted.

| Canonical sample | Source reference | Main finding |
| --- | --- | --- |
| kiwee:baseitem:xdmg:revolver:::::::: | XDMG pp72-73; complete locked Firearms section/table and 2024 XPHB properties/masteries | Revolver2d8 piercing40/120,reload6,Sap hit without damage prerequisite;rare purchase valuation optional. |
| kiwee:baseitem:xdmg:shotgun:::::::: | XDMG pp72-73; complete locked Firearms section/table and 2024 XPHB properties/masteries | Shotgun2d8 piercing30/90,reload2,2H,Push hit Large-or-smaller up to10ft no save;rare valuation optional. |
| kiwee:baseitem:xdmg:hunting%20rifle:::::::: | XDMG pp72-73; complete locked Firearms section/table and 2024 XPHB properties/masteries | Hunting2d10 piercing80/240,reload5,2H;Slow hit+damage10ft until start next turn cap10. |
| kiwee:baseitem:xdmg:laser%20rifle:::::::: | XDMG pp72-73; complete locked Firearms section/table and 2024 XPHB properties/masteries | Laser Rifle3d8 radiant100/300,reload30,2H,Slow;2024 GM/equipment-gated depleted-cell recharge has no quantitative conversion. |
| kiwee:baseitem:xdmg:laser%20pistol:::::::: | XDMG pp72-73; complete locked Firearms section/table and 2024 XPHB properties/masteries | Laser Pistol3d6 radiant40/120,reload50,Vex hit+damage next same-target attack before end next turn;free-hand loading. |
| kiwee:baseitem:xdmg:semiautomatic%20pistol:::::::: | XDMG pp72-73; complete locked Firearms section/table and 2024 XPHB properties/masteries | Semiautomatic Pistol2d6 piercing50/150,reload15,Vex;modern bullets destroyed,2024identity not2014Automatic Pistol. |
| kiwee:baseitem:xdmg:antimatter%20rifle:::::::: | XDMG pp72-73; complete locked Firearms section/table and 2024 XPHB properties/masteries | Antimatter6d8 necrotic120/360,reload2,2H,Sap;no2014full-load cell conversion or automatic recharge. |
| kiwee:baseitem:xdmg:energy%20cell:::::::: | XDMG pp72-73; complete locked Firearms section/table and 2024 XPHB properties/masteries | Energy Cell0.5lb,p72,no price;depletion/recharge GM and equipment gate lacks quantitative contract,remain unsupported. |
| kiwee:baseitem:xdmg:automatic%20rifle:::::::: | XDMG pp72-73; complete locked Firearms section/table and 2024 XPHB properties/masteries | Automatic Rifle2d8 piercing80/240,reload30;burst action10bullets10ftcube normal range,DexDC15,one shared damage roll;Slow requires hit+damage. |

No unknown cell quantity is filled in. Identified inventory linkage and GM-defined recharge remain explicit unsupported sourceConstraint rows without charge/resource/formula fields. This classification does not claim that the missing quantities are resolved or that the mechanism runs automatically.2014 full-load cell rules are not imported; no unsupported feature is counted automated.

Rollback: revert this batch and its review-index receipt together, then regenerate the locked pipeline. Raw source bodies and intermediate proposals stay in ignored private cache.
