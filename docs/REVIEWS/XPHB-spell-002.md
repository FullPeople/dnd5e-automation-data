# Main source review — XPHB-spell-002

Ten high-risk complete 2024 English spell samples reviewed by main, including all higher-slot paragraphs and casting conditions. Original spellModel preserved; Foundry action timing/target/value corrected only where the body supplies a specific contract.

Rows: 50; verdicts: {"automated":0,"noMechanics":0,"unsupported":50}.
Overlay SHA-256: `8b33addc344cfa3db88e2c59d8867c85e09d218b963648e45c1b7695b9ef2ca8`.
Upstream input lock: `f0bd87826cc219b1ddb7dd838a5539d16d98a129ca1331f6a2e8381a7333017f`.
English reference: v2.36.0 commit `3a09c05a3a3be94423cd2b3c33936034eeae02f2`.
Main reviewer: model:Codex-main, 2026-10-03. Sample errors: 0; accepted.

| Canonical sample | Source reference | Main finding |
| --- | --- | --- |
| kiwee:spell:xphb:staggering%20smite:::::::: | time/0/condition; entries/0; entriesHigherLevel | Smite: bonus immediately after melee weapon or unarmed hit; 4d6 psychic is independent of WIS save; failure Stunned ends at caster next turn end; +1d6 per slot above 4, no concentration. |
| kiwee:spell:xphb:conjure%20woodland%20beings:::::::: | entries/0–1; duration/0; entriesHigherLevel | Woodland Beings: visible optional 10-foot Emanation entry/movement/end-turn WIS save, 5d8 Force/half, once per creature per turn; caster Bonus Action Disengage only during concentration; +1d8 per slot. |
| kiwee:spell:xphb:arcane%20vigor:::::::: | entries/0; entriesHigherLevel | Arcane Vigor: choose one or two unexpended existing Hit Dice, heal total plus one spellcasting modifier, then expend those dice; extra slot increases available dice choice, not a generated resource. |
| kiwee:spell:xphb:leomund's%20tiny%20hut:::::::: | complete entries/0–3 | 2024 Hut has no nine-person cap; fully encloses initial creatures, initially present passage exemption, barrier only for spell levels <=3, stationary/dry/light choice, departure/recast ends; ritual preserved. |
| kiwee:spell:xphb:conjure%20elemental:::::::: | entries/0–1; entriesHigherLevel | Elemental: one held creature, optional visible entry/start-near trigger only while unoccupied; DEX failure 8d8 and restraint, held start-turn failure 4d8/success releases; correct element types and both +1d8 upgrades. |
| kiwee:spell:xphb:counterspell:::::::: | time/0/condition; entries/0 | Counterspell: seen creature within 60 feet casting with components, target CON save; failure wastes action/bonus/reaction, victim slot retained. No old-version spell-level automatic cancellation or ability check. |
| kiwee:spell:xphb:lightning%20arrow:::::::: | time/0/condition; entries/0–1; entriesHigherLevel | Lightning Arrow replaces original attack damage/effects, 4d8 hit/half miss then separate 10-foot 2d8 DEX splash/half; both scale +1d8, no new attack or concentration. |
| kiwee:spell:xphb:animal%20shapes:::::::: | complete entries/0–2 | Animal Shapes: any willing visible targets, per-target Beast <=Large/CR4, retained 2024 statistics; only first-form temporary HP, no refresh on later forms; gear melded, no casting, target Bonus Action exit; 24 hours without concentration. |
| kiwee:spell:xphb:contingency:::::::: | components/m; complete entries/0–2 | Contingency: eligible <=5 action spell can target self, both slots paid now; first chosen trigger activates once/self-only even if unwanted; 1500+ GP unconsumed statuette must stay carried, only one, 10-day/recast/material-loss termination. |
| kiwee:spell:xphb:spirit%20guardians:::::::: | complete entries/0–1; entriesHigherLevel | Guardians: chosen exemptions, alignment-derived damage type, 15-foot aura halves nonexempt Speed; movement/entry/end-turn WIS save once per creature per turn, 3d8/half/+1d8; no ally filter or visibility restriction. |

All 50 entries are unsupported for complete casting/effect settlement, while verified selection metadata remains usable. Each has concrete identified constraints, triggers or transactions. No permanent grants from a spell effect, invented upgrade, automatic combat settlement, or automatic use of unresolved source text is enabled. Publisher bodies remain private.

Rollback: revert this batch and its review-index receipt together, then regenerate the locked pipeline. Raw source bodies and intermediate proposals stay in ignored private cache.
