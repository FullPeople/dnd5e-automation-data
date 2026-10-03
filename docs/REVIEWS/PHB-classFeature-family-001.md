# Main source review — PHB-classFeature-family-001

Main read all 15 complete PHB Barbarian feature sources and overlays, independently checked the complete parent usage/damage table; receipt records ten selected numerical/conditional risk samples.

Rows: 15; verdicts: {"automated":0,"noMechanics":0,"unsupported":15}.
Overlay SHA-256: `30f02430a9b375b3f7c8ebe340fce56aa05a0b660bcd822b2a8ace4726bd49f5`.
Upstream input lock: `f0bd87826cc219b1ddb7dd838a5539d16d98a129ca1331f6a2e8381a7333017f`.
English reference: v2.36.0 commit `3a09c05a3a3be94423cd2b3c33936034eeae02f2`.
Main reviewer: model:Codex-main, 2026-10-03. Sample errors: 0; accepted.

| Canonical sample | Source reference | Main finding |
| --- | --- | --- |
| kiwee:classfeature:phb:brutal%20critical%20(1%20die):phb:barbarian:::9::: | PHB p46; data/class/class-barbarian.json and complete PHB parent table | Brutal Critical is current weapon extra die on melee critical only, tiers1/2/3 at9/13/17 replace via max, duplicate passive removed; not ranged or additive six. |
| kiwee:classfeature:phb:danger%20sense:phb:barbarian:::2::: | PHB p46; data/class/class-barbarian.json and complete PHB parent table | Danger Sense: Dex save against visible effect, exclude blinded/deafened/incapacitated; examples not exhaustive, no save proficiency. |
| kiwee:classfeature:phb:fast%20movement:phb:barbarian:::5::: | PHB p46; data/class/class-barbarian.json and complete PHB parent table | Fast Movement +10 at5 only without heavy armor. Removed unsafe unconditional Foundry bonus/effect; fully unarmored would wrongly exclude light/medium. |
| kiwee:classfeature:phb:feral%20instinct:phb:barbarian:::7::: | PHB p46; data/class/class-barbarian.json and complete PHB parent table | Feral Instinct initiative advantage, surprised first turn only if not incapacitated and Rage before everything; no blanket surprise immunity or second pool. |
| kiwee:classfeature:phb:persistent%20rage:phb:barbarian:::15::: | PHB p46; data/class/class-barbarian.json and complete PHB parent table | Persistent Rage removes inactivity early ending at15, preserves one-minute duration, unconscious/voluntary ending and base Rage restrictions. |
| kiwee:classfeature:phb:primal%20champion:phb:barbarian:::20::: | PHB p46; data/class/class-barbarian.json and complete PHB parent table | Primal Champion +4 STR/CON preserved once, separate maximum24 unsupported; no set24 or max-as-floor. |
| kiwee:classfeature:phb:rage:phb:barbarian:::1::: | PHB p46; data/class/class-barbarian.json and complete PHB parent table | Rage own-turn bonus, active/noheavy Strength advantage, Strength melee +2/3/4 at1/9/16, BPS resistance, casting/concentration prohibition. Table verifies finite2/3/4/5/6 at1/3/6/12/17 then unlimited20; no false finite pool or constant resistance. |
| kiwee:classfeature:phb:reckless%20attack:phb:barbarian:::2::: | PHB p46; data/class/class-barbarian.json and complete PHB parent table | Reckless Attack choose at first own-turn attack, Strength melee advantage only this turn; incoming allattack advantage until next turn. No Rage prerequisite, ranged benefit or permanent bonus. |
| kiwee:classfeature:phb:relentless%20rage:phb:barbarian:::11::: | PHB p46; data/class/class-barbarian.json and complete PHB parent table | Relentless Rage zeroHP raging/not outright death CON DC10 ->1HP, subsequent USES DC+5, reset short/long. No fabricated action cost or finite pool. |
| kiwee:classfeature:phb:unarmored%20defense:phb:barbarian:::1::: | PHB p46; data/class/class-barbarian.json and complete PHB parent table | Unarmored Defense base10+Dex+Con permits shield; no finalAC overwrite losing shield/alternative calculation. Actual Foundry is suppress-only, not mechanical payload. |

15 unsupported partial rows. Safe +4 ability and max critical-count candidates retained once; absent contextual combat operations remain visible. The finite-to-unlimited Rage transition is explicitly unsupported rather than capped or granted twice. No 2024 features or raw-prose runtime fallback.

Rollback: revert this batch and its review-index receipt together, then regenerate the locked pipeline. Raw source bodies and intermediate proposals stay in ignored private cache.
