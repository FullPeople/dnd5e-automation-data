# Main source review — PHB-spell-003-known-001

Ten complete original PHB spell sources reviewed by main. This is a disjoint 48-entry known subset of the original 50-entry PHB-spell-003 proposal; Leomund Tiny Hut headcount and Earthquake concentration-save cadence are excluded, still needsAnnotation, and are not counted covered. Original proposal/evidence remain private.

Rows: 48; verdicts: {"automated":0,"noMechanics":0,"unsupported":48}.
Overlay SHA-256: `c92ccd3a5af01ff32aa73c19c79e80800da231acda58ce9aa5e581f9b5bdc991`.
Upstream input lock: `f0bd87826cc219b1ddb7dd838a5539d16d98a129ca1331f6a2e8381a7333017f`.
English reference: v2.36.0 commit `3a09c05a3a3be94423cd2b3c33936034eeae02f2`.
Main reviewer: model:Codex-main, 2026-10-03. Sample errors: 0; accepted.

| Canonical sample | Source reference | Main finding |
| --- | --- | --- |
| kiwee:spell:phb:time%20stop:::::::: | complete entries/0–1 | Time Stop:self1d4+1consecutiveturns,other-creature orother-worn/carried-object impactends,move>1000ftfromcastends;instantmetadata does not erase sequence/no permanent initiative. |
| kiwee:spell:phb:feeblemind:::::::: | complete entries/0–3 | Feeblemind:visible150ft4d6Psychicregardlesssave,INTfailureINT/CHA1/action-item-language impairments;every30daysoptionalresave/GreaterRestoration-Heal-Wish ending,not2024Befuddlement. |
| kiwee:spell:phb:conjure%20animals:::::::: | complete entries/list; entriesHigherLevel | 2014 Conjure Animals:count-CR1/2,2/1,4/half,8/quarter,fey+beast,visibleempty60ft,groupowninitiative/noactioncommands/defaultselfdefense,zeroHP/spellend,slots5/7/9counts2x/3x/4x;no 2024aura. |
| kiwee:spell:phb:meteor%20swarm:::::::: | complete entries/0–1 | Meteor:four different visiblegroundpointswithin1mile,40ftradius each;DEX20d6Fire+20d6Bludgeoning/half,creatureoverlaponlyonce;areaobjectdamage,ignitionexceptiononlyworn/carried flammables. |
| kiwee:spell:phb:forbiddance:::::::: | complete entries/0–3; optionalconsume metadata | Forbiddance:40000sqft/30ft/day/noConc,travelentryblock;chooseoneormorefive types/5d10Radiant-Necroticfirstentryturn/start,entrypassword preventsdamageonly,no overlap;30daily sameplaceuntilDispel,lastcast consumes1000GPmaterials. |
| kiwee:spell:phb:reincarnate:::::::: | complete entries incl14-rowd100table; components | Reincarnate:deadHumanoid/piece<=10days/freesoulwilling,1h/1000GPconsumed,newadultbody/d10014bands orDM,memories/capabilitiesretainedracialtraitexchange;97–00means100, no invented restoredHP. |
| kiwee:spell:phb:magic%20missile:::::::: | complete entries/0; entriesHigherLevel; Foundry aggregate source | Missile:three simultaneousautohit visiblecreaturedarts120ft,each1d4+1Force,+onedartperslot above1;damageactivitynoneperdart deferred separatefromActioncast;no guessed shared-vs-separate rolls. |
| kiwee:spell:phb:leomund's%20secret%20chest:::::::: | complete entries/0–2; componentstext | SecretChest:5000GP3x2x2chest/50GPtinyreplica retained,12cubicftnonlivingEthereal;actiontouchreplicarecallfreeground<=5ft/touchbothhide;after60dayscumulative5%daily/recast/replicadestroy/voluntaryactionends,etherealthenlost. |
| kiwee:spell:phb:reverse%20gravity:::::::: | complete entries/0–2 | ReverseGravity:50ftradius100fthighcylinder centered<=100ft,unanchoredobjects/creaturesfallup;DEXgrabonlyreachablefixedobject,normalfallcollisionoroscillatetop,fall downatend;no flying speed/fixed damage. |
| kiwee:spell:phb:contact%20other%20plane:::::::: | complete entries/0–1; ritualmetadata | Original Contact:INT15 failure6d6Psychic/insanitynoactions-language-readinguntilLongRest/GreaterRestoration;successfive questions in1minDManswers;not2024Incapcondition imported. |

All48 concretely unsupported for complete casting/effect settlement while selection metadata remains. No missing source values or ambiguous predicates are turned into guessed executable mechanics. Preserved each exact original-version timing, choices, damage, materials, owner and exclusions. Main checks include full Reincarnate table and Magic Missile activity semantics; unknown-source tails remain open.

Rollback: revert this batch and its review-index receipt together, then regenerate the locked pipeline. Raw source bodies and intermediate proposals stay in ignored private cache.
