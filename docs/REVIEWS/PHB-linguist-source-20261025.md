# PHB2014 Linguist: bounded source and workflow audit

This batch addresses only the PHB2014 Linguist fixed-INT/three-language workflow through authenticated legacy class ASI ownership. It is not complete automation of the feat or of generic language learning. Cipher creation, teaching, deciphering and magical interpretation remain manual. There is no server, global schema, SCAG or all-language expansion, and this document does not authorize merging or deployment.

## Original source mechanics

- Linguist, PHB page167, canonical entry SHA256 `c5e7c9c993357d49d4cc7ea1beca5033f7d31753fdb5a03c70359cf7ad4c6015`.
- Original mechanics are `ability=[{int:1}]` and `languageProficiencies=[{any:3}]`. The raw record has exactly eight keys: ENG_name, name, source, page, ability, languageProficiencies, entries and translator. Its entries shape is one introductory string followed by a list containing two strings. It does not carry max, prerequisite, repeatable, category or reprintedAs. The frozen feat file contains one Linguist record, not a separate XPHB Linguist.
- Missing raw max does not mean unlimited increase. The pinned [renderer implementation](https://github.com/tjliqy/5etools-cn/blob/5cc0bbe2c2b241a334e731af4448bdba2168e8bd/js/render.js#L7093-L7123), revision `5cc0bbe2c2b241a334e731af4448bdba2168e8bd`, blob `fd559e0baad858c2bc59a813603a55e41972a1f4`, uses `abilityObj.max ?? 20`. Its fixed-ability branch consumes that value. The compact evidence records this provenance and mechanical default, not the full upstream source.
- Feats, PHB page165, entry SHA256 `75b2156dacae2a779a04406c4f12fe1feb5541631d463f22c3ccaab53dc50269`, provides the default nonrepeatability. Modern feat categories and language rarity do not amend the PHB identity.
- Cipher DC uses the author's **INT score + PB**, not the INT modifier or 8+modifier+PB. No cipher entity, resource, recipient, action, check resolver or automatic success is implemented. Selecting Druidic or Thieves' Cant does not implement their separate hidden-message features.

The official Linguist URL redirected to the PHB product page in the preceding source review; it did not disclose paid feat text. No claim of direct access to official paid PHB prose or bypassing a login/paywall is made. Rules are supported by the exact frozen entry and pinned renderer provenance. No publisher prose is redistributed here.

## Exact finite language domain

The first domain is exactly **18 PHB language kinds**:

- **8 standard**: Common, Dwarvish, Elvish, Giant, Gnomish, Goblin, Halfling and Orc.
- **8 exotic**: Abyssal, Celestial, Draconic, Deep Speech, Infernal, Primordial, Sylvan and Undercommon.
- **2 secret**: Druidic and Thieves' Cant.

The official [2014 Languages rules](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/personality-and-background#Languages) distinguish standard/campaign-common languages from exotic or secret languages that require DM permission. Permission is recorded as exactly the selected restricted canonical-reference set. Enabling PHB, optional.feats, a global source exception, selecting a catalog entry, or having manual language text is not per-selection DM permission. A standard-only selection has an empty permission set; stale, extra or substituted restricted references are rejected.

Primordial is one language kind. Auran, Aquan, Ignan and Terran, together with the frozen Chinese dialect labels 气族语、水族语、火族语、土族语, are eight aliases of `Primordial|PHB`, not eight language records or independent slots. Case, whitespace, straight/curly apostrophes, Chinese display labels and imported aliases must not create extra quota. Persisted confirmation uses exact canonical references. Unreviewed aliases are not silently migrated into consent.

The full frozen file contains201 language records, distributed as96 without type,68 standard,16 exotic,17 rare and4 secret, plus6 separate languageScript records. Actual normalizeData ignores those six script rows; they do not appear as UI language options. Only18 PHB records are in this reviewed domain. In particular, Abyssal|GGR is standard while Abyssal|PHB is exotic; XPHB has separate rarity and edition identities. Same display name does not transfer permission. Gith|MM dialects, Aarakocra|MM, scripts and fonts do not become PHB choices. Unsupported is **not RAW illegal**; other campaign/publication language domains require their own adaptation.

Existing known language records may produce a duplicate advisory, not a fourth slot, a replacement grant, or deletion of old data. Manual free text is not inferred to be source authorization and is not rewritten.

## Frozen inputs and compact evidence

Canonical hashes are SHA256 of JSON.stringify(parsed), not original whitespace bytes. The proof requires the exact `https://5e.kiwee.top/data/…` manifest URL once, checks its path remains inside the frozen root even through symlinks, checks canonical content hashes and preserves byte hashes before/after execution.

| Input | Retrieval revision | Canonical SHA256 |
| --- | --- | --- |
| feats.json | 5cc0bbe2c2b241a334e731af4448bdba2168e8bd | 0491b421f5f1db6628c3a8aeb86bbc3b72b56bf101a14ba96acbe19c829a56a6 |
| languages.json | 5cc0bbe2c2b241a334e731af4448bdba2168e8bd | fae8ff63ba6d28b71a132f37da85dfb53c8a3dce9f931d49d2b7e12214afae98 |
| variantrules.json | e2623b204ddbdf2bcfa8317acfc962de89c676e2 | 21eef107d25cf438eb85894387fb6f834478d80bc467791c54fe66db9e498c44 |

The languages retrieval pin was independently re-read: its Git blob is `5d8f5d367873ca7fdf6c65a6e76f82f1cba1341c` at5cc0bbe2 and its canonical content matches the frozen fae8ff63 hash. The older e2623b20 version hashes differently and must not be used for this input.

The thirteen original class inputs and68 authenticated legacy ASI slots retain the exact legacyAsiEvidence hashes. Each reused slot must be independently exercised by the bounded proof rather than claimed from the older generic workflow. Mechanical evidence for every language includes canonical reference, normalized entry ID, name, English identity, source/edition boundary, raw page and type, raw keys, mechanics, dialect relation and raw-entry hash. Normalized PHB languages are kind rule, category language, edition2014, with IDs ending in the language category. They are not ordinary rule records merely sharing a name.

The audit must use the actual `EQUIPMENT_TRAINING_ENTRIES` seed and `cardCatalogEntries` assembly with all201 mixed-source language rows, not only normalize(PHB18). It must include native snapshot/cache reload. A legitimate duplicate may not mask a conflicting canonical-ID or PHB identity row in either catalog order. Source hashes bind the reviewed audit; runtime structural identity checks are not cryptographic authentication of imported publisher prose.

## Canonical legacy source identity and imported aliases

The independent compact evidence additionally stores `legacyClassInputs`, the exact thirteen original class-file hashes, and `legacyClassSlots`, the exact68 `{owner, level, ownerEntryId, featureEntryId}` canonical identity rows. These are separate from the unchanged three-entry feat/language/variant `inputs` map; this does not expand that map or change the global character schema. The audit independently reconstructs both additions from frozen sources and actual normalizeData output. Feature IDs incorporate the source's **localized class names**, not a guessed English-only reconstruction, so the actual normalized owned ASI feature is the canonical availability target.

Legitimate imported owner and ASI entry-ID aliases remain usable only when their original source identity and reviewed pack still authenticate. The bounded proof includes a positive alias confirmation/native-reopen case, then all four **canonical and instance** owner/ASI disable-and-restore combinations. Either form of disable must suspend both fixed INT and all three languages, retain the same confirmation and manual/resource snapshots through reopen, and recover only when re-enabled. A duplicate or alias may not evade a canonical availability restriction.

A `custom-pack` owner or ASI lookalike cannot acquire or execute the new Linguist grant merely by copying a PHB/TCE display name or raw shape. Four negative cases cover owner/ASI with canonical/alias IDs; rejection must leave the card, saved confirmation and manual/resource snapshots unchanged. This strengthens this bounded mechanism's source gate without rewriting generic legacy ASI eligibility or declaring all imported class records authentic. These source-alias cases are included in the final692-step exact-source audit recorded below; their implementation alone was not treated as execution evidence.

## Ownership, ability order and preservation

The independent optional reviewedLinguist version1 domain does not extend reviewedFeats v1 or change a global schema. A confirmed binding owns selectionId, choiceId, entryId, exactly three canonical languages, explicit confirmation that the fixed bonus is excluded from manual base INT, and the exact DM-permitted restricted-reference set. Catalog selection, manual feat drag, ordinary answers or source snapshots never create this confirmation automatically.

INT+1 is a deterministic advancement event in the existing grantLevel → choiceId → entryId order. Scores18/19 become19/20;20 stays20 and22 stays22, with a valid three-language projection still active. A cap+0 event is not an illegal feat. Normal ASI integer, atomic-cap and ordering semantics remain unchanged. Confirmation must not silently invalidate a different already-confirmed ASI/feat; imports recompute deterministic status without inventing acquisition history.

Common source/owner/optional-rule/automation/identity ambiguity suspends both components and preserves intent. A language-only disabled entry can pause the three-language projection while valid fixed INT remains applied. Manual training.languages, whether absent, empty or authored, controls language display only; it does not cancel INT and is never rewritten. No language Selection, inventory, proficiency map, skill, HP, temporary HP, consumed resource, other reviewed domain or manual value is mutated by projection.

Source/level suspension preserves intent. Explicit withdrawal, clearing or replacing the owned parent removes its confirmation, and reselecting requires fresh confirmation. Duplicate owners, source aliases, duplicate nonrepeatable acquisition and overlap with a manual same-source Linguist must not double-apply. Legacy ASI archive/restore must retain genuine source ownership and unrelated manual children. Damaged or future domains are opaque/inactive rather than guessed or partially executed; malformed imports fail before card mutation.

## Persistence and old-client limits

Native single cards, collections and linked Owlbear complete native payloads are the persistence boundaries under test. The **thin legacy Owlbear** projection has empty language/tool arrays and is not claimed to convey derived languages. Browser storage, save races, cloud delivery and UI recovery are separate acceptance gates. Review-card HTML showing only manual training is not evidence of complete derived-language interchange.

Actual pre-Linguist Web `78e1fac62bddc52e36d5ad7a2cc4d18e8f0acc0e` is the pinned old consumer, not a hypothetical compatibility model. It may preserve an unknown domain during native roundtrip while being unable to execute it or clean consent after clear/reselect. The expected boundary is **safeEditingCompatibility=false**. After old-client editing of the parent, base INT or manual language text, withdraw and explicitly reconfirm in a new client. Field preservation does not attest fresh permission, and no automatic migration or forgery-detection capability is claimed.

## Relation to existing Data reports

The earlier runtime Linguist witness selected only Aarakocra|MM at level1 and delivered no effects. Its historical status does not prove three-language count, fixed INT, DM permission, real ASI ownership or persistence. It remains historical evidence, not a source for new consent or completed-rule claims.

Generic languageProficiencies derivation remains a generic token/choice mechanism, not this authenticated player workflow. CipherCheck remains manual and languageChoiceDomain is still limited to PHB18. There is **no full-corpus replay** in this bounded audit and no changed inventory denominator or promotion of generic language support to fully implemented. Any separately authorized final corpus replay must retain that distinction.

## Execution and remaining gates

Run only after the consumer src and producer proof script are committed and clean:

`node --experimental-strip-types scripts/audit_reviewed_linguist.ts WEB_ROOT FROZEN_INPUT_ROOT OUTPUT [PINNED_OLD_WEB_ROOT] [PINNED_RENDERER_PATH]`

The renderer path defaults to `FROZEN_INPUT_ROOT/render.js` and must contain the exact pinned Git blob, not an arbitrary current renderer. It is an independent source input; its bytes are checked again after execution.

The source-bound report must capture exact producer revision/script bytes, consumer revision/src tree and every bundled consumer module byte, frozen-source bytes, unchanged catalog/input objects, named bounded steps and explicit unsupported boundaries. It distributes no frozen publisher snapshot, full prose or private card. Prior source declarations distinguish MIT code and localized-data CC BY-NC-SA4.0; publisher redistribution rights are not independently established.

At this document's initial authoring, the final clean-source audit, exact-head remote CI, browser tests and final report pairing are pending. Development smoke is not final proof, and this file must not turn a failed or unexecuted gate into a pass. The earlier source/body loader failure and all first red or binding failures must remain in their private logs. No merge, deployment or player-data operation is claimed.

## First local source freeze checkpoint

Before the first source commit, Data full tests passed918 Vitest /11 existing conditional skips,14 Node,6 Python and the source-project compiler. The new proof script passed syntax and33 directed binding guards, but has not yet been executed as an official source-bound audit. Current Web passed153 core,96 actual frozen-source,9 exact old78e1 and383 existing-domain directed cases; independent post-fix checks confirmed canonical owner/ASI disable/pack gates while retaining legitimate aliases. UI focused98 and local compiler checks passed. Full Web pre-pair tests retain17 stale-ledger failures (4,377 passed /153 conditional skips), not waived. Final source workflow, one necessary corpus replay, report pairing and114 actual App/remote CI remain pending. Original red logs and historical weak witness provenance are retained.

## First exact source-audit failure retained

The first clean audit against Web `f3f98ebbea70f15e31949cb3dd199a7620308d78` / producer `39cf0ba019abc4ee60e3346b555ed05dca2b7e77` failed an import-order fixture that copied an independent card's randomly generated source selection ID. The product correctly kept that foreign confirmation inert, preserving the already-valid ASI result INT20. The audit now explicitly asserts that negative boundary, then constructs the intended imported state using the target card's actual source/choice IDs and retains the original INT19 / later-ASI-inactive / three-language assertions, including native reopen. No product source, identity gate, numeric expectation or assertion was weakened. Offline binding/regression95/95 and script syntax/diff checks passed. Original audit and narrow reproduction logs are retained privately. At that failure checkpoint no corpus replay had started, and the corrected producer still needed a clean official audit. The later results below do not erase this initial failure.


## Corrected exact-source proof and genuine ownership repair

The corrected producer exposed a second, genuine product issue: re-confirming a duplicated or stale source claim could filter away the ambiguity and silently reactivate the grant. This is distinct from the first audit fixture's foreign-selection-ID error. The retained `reviewed-linguist-workflow-corrected.log` records the missing expected rejection. Web `dd83d6ff915ab1e1f1ac133373bd304c7e903430` adds a narrow new-domain check: duplicate claims and a saved claim belonging to another source instance require explicit withdrawal/cleanup before a fresh confirmation. It does not weaken source ownership or reinterpret the old unknown-domain editing boundary.

At2026-10-25T09:15:27.205Z the official bounded source/API audit passed **692/692**, with **0 failures and0 skips**, against:

- Consumer Web `dd83d6ff915ab1e1f1ac133373bd304c7e903430`, source tree `b1095fa3401b0052131d635425739cc3782bf59c`.
- Producer Data `4f9b0453d1bf07af297b25db3093e8d2c1b75e44`.
- Proof-script SHA256 `7d5928a8822e100f07e591148f880f877fb896ba7f042d17f8cd5d27826d3516`.
- Receipt SHA256 `0231c562b1180983a3e456cfc3c4c8fa8af24c2d81278a64eb4deedeec381fba` (`reviewed-linguist-workflow-remote.json`, retained privately).

A separate read-only pairing check rehashed all108 bundled current consumer modules against both the working bytes and that exact committed source:0 mismatches. It also matched the producer script's working and committed bytes to the receipt hash. The receipt independently binds70 actual old78e1 consumer modules. A read-only cross-check of all five bounded receipts matched their five committed producer-script hashes, the same consumer/producer metadata, all108 unique current consumer modules and160 old committed-module bindings across Linguist/Skilled, with0 mismatches. This is an exact-commit local source/API receipt despite the historical `remote` filename; it is not a remote Actions success or browser acceptance.

The bounded assembled catalog contains2,935 normalized entries and2,981 App entries, including the actual34 equipment-training seed entries, all201 mixed-source language records and exactly18 reviewed language kinds. The actual snapshot-cache reload, all68 genuine legacy source slots, canonical/instance owner and ASI availability, custom-pack rejection, exact restricted-language permissions, cap+0 behavior, preservation and native import/export checks are included. Actual old78e1 roundtrip retains the opaque new domain but cannot execute it; old clear/reselect retains stale consent. **safeEditingCompatibility remains false.**

The four neighboring bounded audits also passed on exactly the same consumer/producer pair:

| Bounded audit | Passed | Failed | Skipped |
| --- | ---: | ---: | ---: |
| Skilled |271 |0 |0 |
| Weapon Master |209 |0 |0 |
| Armor feats |503 |0 |0 |
| Passive feats |235 |0 |0 |

Skilled's first same-source attempt encountered only an existing private PID-cache `node_modules` symlink (`EEXIST`). Its original log/cache were retained; isolating the private cache and retrying the same source and arguments passed271/271 at2026-10-25T09:22:02.754Z. No product code or assertion changed for that cache retry.

An independent offline Data regression run after this proof passed **919 Vitest tests**, with **11 existing conditional skips** (30 files passed,1 skipped), plus **14/14 Node tests** and **6/6 Python tests**. The source-project compiler exited successfully. These counts do not turn the conditional skips into executed passes, and the source compiler is not a claim that the standalone audit script is included in its src-only project.

## Pairing still in progress at the09:22 documentation checkpoint

The one authorized full-corpus replay started2026-10-25 at09:21:40UTC and was still running at this checkpoint. No full-replay completion/counts or final114 actual App/browser passes are claimed here. The checked-in historical runtime report still names Web `fb8676136eddde1506bad9756c41ab869e1270a0`; it is not silently relabeled as the new Linguist receipt. Final Data/Web report locks and exact-head CI must be paired to the completed new replay before acceptance.

Cipher actions remain manual; language support is only the PHB18 subdomain. The old Aarakocra witness remains historical and is not migrated or used as evidence of the new owned workflow. No generic language capability, whole-inventory denominator, global schema/server change, safe old-client editing, final browser acceptance, merge or deployment is asserted by these source/API passes.

## Sole full-corpus replay completed; final remote gates pending

The corrected frozen-source replay completed at2026-10-25T09:42:01.036Z, consumer Web `dd83d6ff915ab1e1f1ac133373bd304c7e903430`, producer Data `4f9b0453d1bf07af297b25db3093e8d2c1b75e44`:200 module gates (all196 prior paths retained),229 unchanged frozen inputs,18,789 unchanged rule identities,4,561 reviewed,6,534 with at least one partial mechanism witness,522 unavailable and0 unresolved. SHA256 `888fc094405f0d295903345361c297c7ce452844f6c18036827767e0b5f85d42`; exact Git blob `7126bea71fa1645031ce30784ff46bfc7f3dc5be`.

Exactly one record changes: PHB2014 Linguist's historical generic level1 language-choice witness selected an Aarakocra|MM rule and delivered no language rows. That standalone/unowned route is not the new genuine class-ASI workflow or the reviewed PHB18 language domain, and is no longer counted as implemented:6,535 becomes6,534. The full original before/after record is retained privately; no identity, review flag, denominator, input hash, source count rule or unrelated witness was rewritten. The explicit canonical PHB Linguist workflow is separately proven by the692 source/API checks, not by relabeling that old witness. Cipher and special-language behaviors remain manual as scoped.

The committed report and five workflow stage receipts are metadata/mechanical evidence only; they contain no frozen source prose or private player cards. Final paired-tree offline checks, both exact-head Data CI events and Web's114 actual App cases remain to be verified. The stacked draft depends on the accepted Skilled branch rather than current main; no merge or deployment is performed. This section supersedes only the preceding in-progress checkpoint, preserving its first failures and limitations.
