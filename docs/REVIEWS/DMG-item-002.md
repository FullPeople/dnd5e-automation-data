# Main source review — DMG-item-002

Main source review of ten risk-selected complete original DMG item bodies and inherited property/template text. Verified random initial counts, permissive risky reuse, opposing-creature targets, slaying unlocks, carried-vs-worn semantics, Mithral null exemptions and version-specific property rules.

Rows: 50; verdicts: {"automated":7,"noMechanics":0,"unsupported":43}.
Overlay SHA-256: `346b4f35298a7d6872f3bc1a06882e21649026039ef14a1bd14545c3dd915fbf`.
Upstream input lock: `f0bd87826cc219b1ddb7dd838a5539d16d98a129ca1331f6a2e8381a7333017f`.
English reference: v2.36.0 commit `3a09c05a3a3be94423cd2b3c33936034eeae02f2`.
Main reviewer: model:Codex-main, 2026-10-03. Sample errors: 0; accepted.

| Canonical sample | Source reference | Main finding |
| --- | --- | --- |
| kiwee:item:dmg:dust%20of%20dryness:::::::: | complete entries/0–2 | Dust: actual initial 1d6+4 pinches not guessed; Action absorbs15-foot water cube/pellet and Action release; mostly-water elemental CON13/10d6 necrotic/half; no random roll executed. |
| kiwee:item:dmg:wind%20fan:::::::: | complete entries/0 | Wind Fan: held Action/DC13 Gust; reuse before dawn remains possible with cumulative20% failure/destruction, not a hard one-use pool or permanent spell grant. |
| kiwee:item:dmg:ring%20of%20spell%20turning:::::::: | complete entries/0 | Turning ring: worn+attuned, only spell solely targeting wearer/non-area saves; natural20 and spell<=7 redirects with original caster slot/DC/attack/ability, no unconditional save advantage. |
| kiwee:item:dmg:stone%20of%20good%20luck:::::::: | complete entries/0; raw bonus fields | Luckstone: carried on person+attuned, +1 all checks/saves; removed attuned-only six-save modifiers because equipped cannot represent carried; no remote benefits. |
| kiwee:item:dmg:ring%20of%20fire%20elemental%20command:::::::: | complete entries/0–4 | Elemental ring: worn+attuned five charges/dawn1d4+1/DC17; wearer attack advantage against Fire-plane elementals and their attack disadvantage against wearer stay deferred. Baseline resistance gated; immunity and three spells require helping slay fire elemental while attuned, never assumed unlocked. |
| kiwee:item:dmg:scale%20mail%20(mithral%20armor)::::::::phb%7Cscale%20mail%7Cdmg%7Cmithral%20armor | complete Mithral template and Scale Mail base | Mithral Scale: AC14/Dex cap2/45lb, explicit Stealth false/Strength null remove penalties; no invented weight reduction; under-clothes exception applies only chain shirt/breastplate. |
| kiwee:item:dmg:saddle%20of%20the%20cavalier:::::::: | complete entries/0 | Saddle: rider placement on mount; conscious condition governs unwilling dismount protection, while target of attack disadvantage is mount, no defense granted globally to rider. |
| kiwee:item:dmg:ring%20of%20x-ray%20vision:::::::: | complete entries/0–1 | X-ray ring: worn Action command,1min/30ft, penetration1ft stone/1in metal/3ft wood-dirt, lead blocks; repeated use before Long Rest CON15/exhaustion1, no hard use pool. |
| kiwee:item:dmg:ioun%20stone%2C%20mastery:::::::: | complete entries/0–3 | Mastery Ioun: +1 proficiency only attuned and worn/orbiting, orbit is explicitly worn in source; Action deploy/stow and opponent Action/AC24 attack or DEX Acrobatics24 separation deferred; AC24/HP10/all resistance belong to stone. |
| kiwee:item:dmg:oathbow:::::::: | complete entries incl PHB properties | Oathbow: only one sworn target until death or seventh dawn, next-dawn reselection; own target advantage/non-total-cover bypass/no long-range disadvantage/+3d6, other-weapon penalty while alive;150/600/arrows/2014 Small-Tiny Heavy/two hands, no global bonuses. |

Unsupported combat/effect/action state remains deferred. Actual finite random expressions are preserved without rolling; hard daily pools are not substituted for risky repeated use. Conditional executable resistance/proficiency models are explicitly gated. Original 2014 behavior and original item identities remain; no publisher bodies are published.

Rollback: revert this batch and its review-index receipt together, then regenerate the locked pipeline. Raw source bodies and intermediate proposals stay in ignored private cache.
