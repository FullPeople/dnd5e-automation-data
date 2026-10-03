# Main source review — XPHB-spell-001

Main read ten complete risk-selected 2024 spell bodies, upgrades, casting metadata and proposed changes against their exact structured/Foundry drafts. Mandatory Ice Storm sample checks both text and conflicting scaling markup; the first uncertain proposal is retained privately before main ruling.

Rows: 50; verdicts: {"automated":0,"noMechanics":0,"unsupported":50}.
Overlay SHA-256: `7f863a6fc6629c499c1e5c8c6c1b807dfa17d12fd34e05da2bbc714154d4df3b`.
Upstream input lock: `f0bd87826cc219b1ddb7dd838a5539d16d98a129ca1331f6a2e8381a7333017f`.
English reference: v2.36.0 commit `3a09c05a3a3be94423cd2b3c33936034eeae02f2`.
Main reviewer: model:Codex-main, 2026-10-03. Sample errors: 0; accepted.

| Canonical sample | Source reference | Main finding |
| --- | --- | --- |
| kiwee:spell:xphb:starry%20wisp:::::::: | XPHB p320; locked complete English spell body and upgrade | Starry Wisp creature or object ranged hit1d8 radiant,10ft dim light and Invisible benefit suppression until end next turn;character levels5/11/17 scale2/3/4d8. |
| kiwee:spell:xphb:prayer%20of%20healing:::::::: | XPHB p307; locked complete English spell body and upgrade | Prayer2024ten-minute continuous30fteligibility,up to5,short-rest benefits plus2d8;recipient own long-rest lockout,slotabove2+1d8. |
| kiwee:spell:xphb:heat%20metal:::::::: | XPHB p284; locked complete English spell body and upgrade | Heat Metal visible manufactured object,contact2d8fire;laterbonusdamage requiresobjectinrange,damaged holder/wearerCon dropifpossible,retainingcausesdisadvantageuntilstartnextturn. |
| kiwee:spell:xphb:ice%20storm:::::::: | XPHB p287; locked complete English spell body and upgrade | Ice Storm body2d10bludgeoning+4d6cold,Dexhalf,20ftradius40height300range,terrainuntilendnextturn;upcast+1d10 contradicts2d8tagbase,sourceIntegrity retained,no guessed formula. |
| kiwee:spell:xphb:bigby's%20hand:::::::: | XPHB p246; locked complete English spell body and upgrade | Bigby2024LargeobjectAC20castermaxHP,nospacetaken;fourmodes,5d8forcefist,STRpushHugeorless5+5mod,DexgrappleDCspell,4d6+modcrush;upcastfist+2d8/grasp+2d6. |
| kiwee:spell:xphb:wall%20of%20fire:::::::: | XPHB p338; locked complete English spell body and upgrade | Wall initialDexsave5d8half;chosen-side10ftendturnorfirstwallentry fullongoingno-save;60ftwallor20ftring,20height1thick,slot+1d8. |
| kiwee:spell:xphb:true%20polymorph:::::::: | XPHB p335; locked complete English spell body and upgrade | TruePolymorph2024retainsHP/HitDice,addsformHPasTHP;THPdepletionnotexpiry;3modesandCR/sizebounds,full-hourconcentrationuntildispelled,objectcreaturecontrolendafterhour. |
| kiwee:spell:xphb:hallow:::::::: | XPHB p283; locked complete English spell body and upgrade | Hallow24hcast,touchradius≤60overlapfails,1000+GPincenseconsumed,wardchosencreaturetypesandoneof10modes;allarea-specific,no globalresistance/language. |
| kiwee:spell:xphb:magic%20jar:::::::: | XPHB p294; locked complete English spell body and upgrade | MagicJar2024one-minuteselfcast500+GPcontainer;100ftvisibleHumanoidCHAsaveand24hretry;adopthostphysicalstatsHPdice/speed/sensesonly,linkeddeath/return,containerdestroyedonlyend. |
| kiwee:spell:xphb:phantasmal%20killer:::::::: | XPHB p304; locked complete English spell body and upgrade | PhantasmalKiller2024initialWisfailure4d10+attack/checkdisadvantage,successhalfdamageend;laterendturnfailurefullrepeat,successendnorepeatdamage;noFrightened,slot+1d10. |

Spell selection models and explicitly deferred activities remain. Per-target/cast-instance transformations, terrain, status, timed rolls, damage and healing are specific identified unsupported families; no effect becomes a permanent caster modifier. Ice Storm sourceIntegrity records the unresolved upstream contradiction without an executable guessed formula; it is not counted as automated. Full rules remain private.

Rollback: revert this batch and its review-index receipt together, then regenerate the locked pipeline. Raw source bodies and intermediate proposals stay in ignored private cache.
