# Main source review — XPHB-spell-003

Ten complete 2024 English spell-body samples reviewed by main, including all high-slot clauses, spell material values, target/control event timing and the direct KI-vs-English Dominate Person translation difference. Checked Wish full option list/stress and version changes to Simulacrum/Sleep.

Rows: 50; verdicts: {"automated":0,"noMechanics":0,"unsupported":50}.
Overlay SHA-256: `4735d894d18f114c5b8465d792bff98e7ef5ab7c4655a9498a8d6c04ff402a83`.
Upstream input lock: `f0bd87826cc219b1ddb7dd838a5539d16d98a129ca1331f6a2e8381a7333017f`.
English reference: v2.36.0 commit `3a09c05a3a3be94423cd2b3c33936034eeae02f2`.
Main reviewer: model:Codex-main, 2026-10-03. Sample errors: 0; accepted.

| Canonical sample | Source reference | Main finding |
| --- | --- | --- |
| kiwee:spell:xphb:simulacrum:::::::: | complete entries/0–3; components | 2024 Simulacrum:12h/target within10ft entirecast/touch snow, Construct halfmaxHP/cannotcastitself;noShortLongRest orlevels,repaircasterLongRestwithin5ft/100GPperHP,0HP/recastdestroy,1500GPconsumed. |
| kiwee:spell:xphb:wish:::::::: | complete Wish entries/list and stress paragraph | Wish:duplicate<=8 oronealternative,25000GP/300ftobject,self+20healed/tenresistance/ten8himmunity/eligiblefeatreplacement/last-roundreroll;nonduplicationstress1d10perleveluntilLongRest/STRset3/2d4days/restsubtract2/33%loss,all deferred. |
| kiwee:spell:xphb:banishing%20smite:::::::: | time condition; complete entries/0 | Banishing Smite:immediatelyaftermelee/unarmedhitBonus,5d10Forceindependentofsave;postattack<=50HPCHA failure/demiplaneIncapped/concentration1min/returnspace;no upcast invented. |
| kiwee:spell:xphb:hunter's%20mark:::::::: | complete entries/0–1; entriesHigherLevel | HunterMark:visible90ftquarry/Bonus,eachattack-rollhit1d6Forceonlythatquarry,find-onlyWISPerception-Survivaladvantage;0HPbonusretarget;slots3–4duration8h/5+24h without damage scaling. |
| kiwee:spell:xphb:summon%20fey:::::::: | complete entries/0–1; entriesHigherLevel | Summon Fey:choosemood/appearancenumberone actor visibleempty<=90ft;sameinitiativeactsaftercaster/noactionverbalcommands/otherwiseDodge,zeroHP/spellend,unconsumed300GPflower;slotlevelappliesreferencedstatblock,no inventedactor stats. |
| kiwee:spell:xphb:contact%20other%20plane:::::::: | complete entries/0–1; ritual metadata | Contact:casterINT15 failure6d6PsychicandIncapuntilLongRest/GreaterRest,successno damage/up to5questionswithDManswersbefore1min;correctself/minute/ritual,notFoundryhalf-success. |
| kiwee:spell:xphb:modify%20memory:::::::: | complete entries/0–4; entriesHigherLevel | Memory:visible30ft/WIScombatadvantage,Charmed+Incap1min;damage/another-spelltargetingaborts;spokenunderstooddescriptionevent<=10minwithin24h,completedsettlesatend,restoration/curse restores;slots6/7/8/9eventage7/30/365/any. |
| kiwee:spell:xphb:disintegrate:::::::: | complete entries/0–2; entriesHigherLevel | Disintegrate:visible<=60ft creatureDEXfailure10d6+40Force/successnone,damage-tozeroonly dust/nonmagicalgear/TrueRes-Wishrevival;objectnonmagicalorforceLargewhole/Huge10ftCube;+3d6aboveslot6,no fixed40/object scaling. |
| kiwee:spell:xphb:dominate%20person:::::::: | complete entries/0–2; entriesHigherLevel; KI translation contrast | Dominate:EnglishHumanoid visible<=60ft not translatedBeast;WISadvifcaster/alliesfighting,mandatorydamagerepeat;sameplane/noactioncasterturncommands/targetownturn,orderedreactionconsumesboth;slots6/7/8+10min/1h/8h. |
| kiwee:spell:xphb:sleep:::::::: | complete entries/0–1 | 2024 Sleep:choose5ftSphere/<=60ft,WISfirstfailureIncapthroughnextturnend/mandatorysecondsavefailureUnconsciousremainingduration;damage/five-footshakeActionends,nonsleepersorExhaustionimmuneautosuccess;no oldHPpool/upcast. |

All fifty are unsupported for complete casting/combat/state settlement, while genuine selection metadata remains. Correcting provisional Foundry activities does not execute them: every action/effect is deferred. No arbitrary target benefit becomes a caster grant; no source ambiguity, unknown actor profile or spell choice is filled with guessed values. Original bodies remain private.

Rollback: revert this batch and its review-index receipt together, then regenerate the locked pipeline. Raw source bodies and intermediate proposals stay in ignored private cache.
