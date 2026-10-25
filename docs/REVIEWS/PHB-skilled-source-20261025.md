# PHB2014 Skilled: bounded source and workflow audit

This batch implements only the PHB2014 Skilled mixed-proficiency choice through authenticated legacy class ASI ownership. It does not add Linguist, generic mixed grants, SCAG tools, magic-item inheritance, crafting, tool checks or vehicle-control automation. It does not authorize publication, merging or deployment.

## Original source mechanics

- Skilled, PHB page170, canonical entry SHA256 `6050748f7163ce8110abcc187db99a03f2d2acb5309afbd08e4a9e80b89a3bd7`.
- One shared choice of exactly3 skill/tool kinds. The four legal mixes are3+0,2+1,1+2 and0+3. This is not two independent count3 choices and grants no languages, ability increase, inventory or expertise.
- No original prerequisite, repeatable or category field. Nonrepeatability is supported by Feats, PHB page165, entry SHA256 `75b2156dacae2a779a04406c4f12fe1feb5541631d463f22c3ccaab53dc50269`.
- Skilled, XPHB page201, entry SHA256 `faa26042d1d46973ada61d0ff1421b80622ee33c4072df316da8beccc385b9a3`, is a separate identity. Its categoryO and repeatable=true are not inherited by PHB and are not removed from modern records.

The reviewed target domain is18 skills,37 concrete tools and two vehicle proficiency categories,57 choices total. The37 are17 artisan types and10 instruments from items-base, plus4 game sets and6 other tool types from items. All are PHB page154. Artisan's Tools, Gaming Set and Musical Instrument itemGroup records are group headings, not single proficiencies granting every member.

The two vehicle categories are land and water. PHB page154 Tools table SHA256 `b9a6b73ae9591063611bd752b9c0c8c9a0e172c61b18479ccf10f14d73ff3234` supports their inclusion. They are not fabricated cart/wagon/boat item IDs. The PHB page174 skill table SHA256 is `11c9ab01a028d562939f7d68f89fbe4626441432af5962850787746770a2df5f`.

On2026-10-25 the official [2014 equipment rules](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/equipment) were separately read, including Tools, Other Tools and Vehicle Proficiency. They distinguish individual artisan/game/instrument proficiencies and land/water vehicle kinds. Tool proficiency is not intrinsically tied to one ability. Only mechanical paraphrases and references are included here, not publisher prose.

SCAG includes12 instrument records, with Shawm overlapping the PHB concept. That wider domain needs separate identity review; unsupported here is not RAW illegal. The same applies to unreviewed magic instruments and other special items. No global tool filter was loosened.

## Frozen inputs and retrieval pins

Canonical hashes are SHA256 of JSON.stringify(parsed), not the original whitespace bytes. The audit additionally checks local file byte hashes before and after execution and validates manifest path containment, duplicate URLs and symlink targets.

| Original data path | Revision | Canonical SHA256 |
| --- | --- | --- |
| feats.json | 5cc0bbe2c2b241a334e731af4448bdba2168e8bd | 0491b421f5f1db6628c3a8aeb86bbc3b72b56bf101a14ba96acbe19c829a56a6 |
| items.json | 5cc0bbe2c2b241a334e731af4448bdba2168e8bd | 883f7bb4df2eb35fb37e7caa3a8765e0209014caa360d1c0358daa6f4b2da488 |
| generated/gendata-tables.json | 5cc0bbe2c2b241a334e731af4448bdba2168e8bd | 904e726f5b361f20456f2f2569f52bc82607ff0285d393e60d6cc947497806cf |
| items-base.json | e2623b204ddbdf2bcfa8317acfc962de89c676e2 | 8933a3e70e47aa4fd6196bd7f1f2e3a57d6d8dbe7e781d37bb6a0519d7c4ffff |
| skills.json | e2623b204ddbdf2bcfa8317acfc962de89c676e2 | 313019e6987bffdcdb4c74bdd05edd475c6f33410637f7b42f85760c5beb8941 |
| variantrules.json | e2623b204ddbdf2bcfa8317acfc962de89c676e2 | 21eef107d25cf438eb85894387fb6f834478d80bc467791c54fe66db9e498c44 |

The13 original class inputs and68 original PHB/TCE ASI slots retain the hashes previously reviewed in legacyAsiEvidence. Every slot is re-exercised only for this new bounded mechanism. No old full-corpus replay is performed and no generic denominator is changed.

Every one of55 concrete skill/tool entries is independently reconstructed from these frozen files and compared with consumer mechanical evidence. IDs and normalized editions are checked through the actual consumer normalizeData function. Skills normalize to kind rule and append the skill category to their IDs. All PHB records normalize to2014 even when original raw edition is omitted; the10 instruments explicitly contain classic. Raw mechanics and exact raw-key sets remain independently recorded.

## Persistence and ownership boundaries

The new optional reviewedSkilled version1 domain is separate from reviewedFeats v1 and reviewedWeaponMaster. A binding owns the authenticated ASI selectionId, choiceId, entryId and one explicitly confirmed set of three canonical kind/reference pairs. No ordinary catalog selection, snapshot read or manual feat drag alone authorizes effects. Imported instance aliases may retain the same verified PHB identity, but must obey both their actual entry availability and the canonical PHB feat disable gate; two ASI claims under canonical/alias IDs remain ambiguous and inactive.

Pure projections feed existing skill calculation and tool presentation. Existing proficiency remains legal and adds PB only once; existing expertise remains expertise. Authored totals, skill bonuses, manual proficiency maps, manual tools including an empty string, HP, consumed resources and equipment are not overwritten. Disabling a source, optional rule, individual choice or automation suspends the saved grant rather than deleting player intent. Replacement and withdrawal remove only the owned confirmation.

Native single-card/collection exports and linked Owlbear native payload are tested through actual current import/export functions. The thin legacy Owlbear projection still has empty tool_proficiencies/languages arrays and is not presented as a complete tool interchange format. Browser storage, cloud transmission, save races and UI recovery remain separate tests.

The bounded old-client test uses actual Web `52d5be10e161464d5e0846d1dc2202ea1169754b` modules and checks their bytes. An unchanged native roundtrip can preserve the unknown field, but that client cannot apply Skilled or clean the new consent domain. In particular, old-client editing that clears and reselects the same parent feat can preserve stale confirmation. This is not safe editing compatibility; after such editing, withdraw and explicitly reconfirm in the new client. No migration or cross-client attestation is claimed.

Generic Data derivation continues to report mixed-proficiency-choice unsupported, including for arbitrary records with the same mixed field. The source/API witness proves only this specifically reviewed workflow, not a new generic IR capability or completion of every effect of all selected records.

## Provenance and execution

The source audit requires a committed clean consumer src tree and a committed clean proof script. It checks producer revision/script bytes, all bundled consumer module bytes, frozen-source bytes and unchanged catalog/input objects. The output contains mechanical summaries, canonical references, hashes and named step receipts, never original rule prose or raw private character snapshots.

Source repository declarations reviewed previously distinguish MIT code from localized-data CC BY-NC-SA4.0. Publisher redistribution rights are not independently established. This batch therefore does not distribute source books, complete translated rules or frozen raw snapshots.

Run the targeted audit after committing current consumer src and producer script:

`node --experimental-strip-types scripts/audit_reviewed_skilled.ts WEB_ROOT FROZEN_INPUT_ROOT OUTPUT [PINNED_OLD_WEB_ROOT]`

The optional old root must point to exact clean52d5be10. Without it, the script uses the already present local Git object via git archive into a private cache, not a fresh clone. All tests and current/browser results must bind their actual final source revision. A passing API report is not browser acceptance, remote CI success or a publication receipt.

## Executed source checkpoint

The targeted original-source/API audit passed226/226 steps, with0 failed and0 skipped, against Web `114174013b0c3c55afb445b4cd44de2a9f5d5f09`, src tree `8edaa9060b43ca982a59d5f99c5f22ee8678180d`, using producer `c3f1bf12990aea73222e7575d7629de65c75d299`. It used its own private bundle/cache, not the global full-corpus adapter. The local checkpoint report is retained only in the private execution cache. It is not the final remote-stage receipt: after the parent publishes the exact source commits, the226-step workflow must run again against those exact commits for final report pairing. The local producer revision remains the exact proof-script execution revision, not a later summary-only commit.

The26 new binding tests and33 retained Weapon Master binding tests also passed, and Data type compilation passed. The initial binding test expected an explicit engine path in the supplemental module list although engine was already transitively bundled; adding that explicit source gate resolved the assertion without loosening any runtime behavior.

The actual old52d5 probe confirms unchanged native field preservation and inactive results after a different parent answer, but also confirms stale consent can survive old clear/reselect. Its safeEditingCompatibility remains false. These are226 bounded API/source steps, not browser acceptance or a repeat of18,789 corpus records. No remote push, merge or deployment was performed by this audit.
