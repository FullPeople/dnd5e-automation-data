# Main source review — PHB-spell-004-known-001

Ten complete original English PHB spell-body samples reviewed, including full Teleport probability table and every Create Undead type/count upgrade. The known47 entries form a disjoint subset of original50 PHB-spell-004: Prismatic Wall termination scope, Animate Objects Huge Dex/table-tag inconsistency and Word of Recall site predicate remain excluded/needsAnnotation.

Rows: 47; verdicts: {"automated":0,"noMechanics":0,"unsupported":47}.
Overlay SHA-256: `344718fa643e47500f8214540b9cf5064a14826fbcb735e1e3ee42ca902af9c6`.
Upstream input lock: `f0bd87826cc219b1ddb7dd838a5539d16d98a129ca1331f6a2e8381a7333017f`.
English reference: v2.36.0 commit `3a09c05a3a3be94423cd2b3c33936034eeae02f2`.
Main reviewer: model:Codex-main, 2026-10-03. Sample errors: 0; accepted.

| Canonical sample | Source reference | Main finding |
| --- | --- | --- |
| kiwee:spell:phb:divine%20word:::::::: | complete entries/0–2 | DivineWord:Bonus/visible30ft/hearingCHA failedHP50/40/30/20 deaf1min/both10min/both+stun1h/death;fourtypesorigin-plane/24hreturnbarWish exceptionindependentHP,notpermanentcastduration. |
| kiwee:spell:phb:banishment:::::::: | complete entries/0–2; entriesHigherLevel | Banishment:visible60ftCHA;nativeplaneharmlessdemiplane/Incap+returnatend,foreignnativehome/returnbefore1minotherwisestay,Incaponlydemiplane;upcastoneextratargetperslotabove4,distastefulcomponent. |
| kiwee:spell:phb:teleport:::::::: | complete Teleport table and all follow-up definitions | Teleport:self+eightwillingvisible<=10ft orsinglefit10ftcubeobjectnotunwillingheld;knownsameplane,sevend100bandscheckprobabilities,sigil/sixmonthobject;offtargetd10*d10percent/d8direction;3d10eachmishap/reroll/repeats. |
| kiwee:spell:phb:planar%20binding:::::::: | complete entries/0–1; entriesHigherLevel/components | Binding:fourtypesentire1hwithin60ft/CHAatcompletion/24hservice,1000GPjewelconsumed;extendothersummondurationnotremoveconcentration,hostiletwistinstructions/reportbyplane;slots6/7/8/9 10/30/180days/yearandday. |
| kiwee:spell:phb:web:::::::: | complete entries/0–4 | Web:20ftCube/difficult/lightlyobscured/twoanchorsorflat5ftdepth/elseendnextturnstart;own-turnentryorstartDEXRestrained/actionSTRcasterDCescape;each5ftfireburn1round/2d4turnstart,not2024force-entrytiming. |
| kiwee:spell:phb:create%20undead:::::::: | complete entries/0–2; all higher-slot alternatives | CreateUndead:night/SmallMediumHumanoidcorpse<=3<=10ft/one150GPonyxeachnotconsume;Bonusmentalcommand120ftsameorder/24hcontrolreassertbeforeexpiry;slots7/8/9 exact4ghoul/5ghoulor2ghast-wight/6ghoulor3ghast-wightor2mummy. |
| kiwee:spell:phb:forcecage:::::::: | complete entries/0–5; components | Forcecage:immobileinvisible1h/noConc,20ftcagehalf-inchbars-gaps or10ftsolidbox;complete-insidetrapped/partialoversizedpushout,nonmagic-Etherealexitblock/teleportCHAorwaste,DispelMagicexception,1500GPrubyunconsumed. |
| kiwee:spell:phb:globe%20of%20invulnerability:::::::: | complete entries/0–1; entriesHigherLevel/components | Globe:immobile10ft/nooutsidebaselevel<=5effectsdespiteupcastincoming,targetsselectableinteriorareaexcluded;insidecastnotrestricted,1minConc,beadshattersatend;slots7/8/9threshold6/7/8 not entrybarrier. |
| kiwee:spell:phb:crown%20of%20madness:::::::: | complete entries/0–2 | Crown:visibleHumanoid120ft/WISCharmed,actionattackbeforemovementagainstselectedotherreachablecreature,none/unreachableactsnormally;castereverylaterturnActionmaintain/elseend,targetoptionalendturnWISsuccessend,noforcedmove/selfattack. |
| kiwee:spell:phb:counterspell:::::::: | complete entries/0; time/condition; entriesHigherLevel | OriginalCounterspell:seen60ftcastingReaction;base<=3automaticfailure/highercasterabilitycheckDC10+spelllevel;upcastauto thresholdspentSlot,not2024targetCONsave/slotreturn. |

All47 have concrete unsupported/deferred casting/effect families while retaining supported selection metadata. Excluded tails are not counted covered and retain their original private proposal/source evidence. Main verified exact2014 native-plane/type choices, spell thresholds, turn triggers, consumption timing and target ownership; no2024rules imported or unresolved sourcevalues guessed.

Rollback: revert this batch and its review-index receipt together, then regenerate the locked pipeline. Raw source bodies and intermediate proposals stay in ignored private cache.
