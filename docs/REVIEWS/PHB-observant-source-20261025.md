# PHB2014 Observant: bounded owned ability/two-passive proof

This batch addresses only an explicitly confirmed PHB2014 Observant obtained through an authenticated legacy class ASI: INT or WIS +1 with default cap20, plus distinct passive Perception and Investigation +5 bonuses. Lip-reading, its language/visibility conditions and situational passive advantage/disadvantage remain manual. This is not complete automation of Observant, modern Observant, generic passive checks or external-sheet protocols. No merge, deployment or publication is authorized by this document.

## Exact source and private baseline

- Frozen feats.json canonical SHA256 `0491b421f5f1db6628c3a8aeb86bbc3b72b56bf101a14ba96acbe19c829a56a6` at revision `5cc0bbe2c2b241a334e731af4448bdba2168e8bd`.
- Observant|PHB, page168, entry SHA256 `dc6366743eb9242179fa25e00124d79e7e281c966242ac3beac52a9b9c905e8b`. Original structured ability is `[{choose:{from:['int','wis'],amount:1}}]`; raw keys are ENG_name, name, source, page, reprintedAs, ability, entries, translator. No prerequisite, category, repeatable, max or structured passive/skill bonus field is present.
- Its entries are one introductory string and a list of exactly two strings. The lip-reading clause UTF8 SHA256 is `3dafc45f7a4cfe5101dfb90eca3ad9211ee49330363df8ffe9ada38b1e7bc240`; the two-passive clause SHA256 is `e698e33cae17248724563b933c5fc9425c009996a73c2a6a7de206b0a9c5b983`. The browser-safe pure checksum verifies exact clauses, not authored qualifying prose or merely a numeric5. Only hashes and finite mechanical metadata are public; full publisher prose stays private.
- Default nonrepeatability comes from PHB Feats165, entry SHA256 `75b2156dacae2a779a04406c4f12fe1feb5541631d463f22c3ccaab53dc50269`, within frozen variantrules.json `21eef107d25cf438eb85894387fb6f834478d80bc467791c54fe66db9e498c44` at revision `e2623b204ddbdf2bcfa8317acfc962de89c676e2`.
- The pinned [renderer](https://github.com/tjliqy/5etools-cn/blob/5cc0bbe2c2b241a334e731af4448bdba2168e8bd/js/render.js#L7093-L7123), Git blob `fd559e0baad858c2bc59a813603a55e41972a1f4`, uses `abilityObj.max ?? 20` and `choose.amount ?? 1`. Missing raw max is not unlimited increase.

The separate PHB2014 Passive Checks baseline is explicitly bound, not borrowed from XPHB Passive Perception372. The private `data/book/book-phb.json` input at revision `e2623b204ddbdf2bcfa8317acfc962de89c676e2` has612,192 bytes, original Git blob `ed5cf92310a2bab6f6edbab93b68cc4b3f0d1dbc`, byte SHA256 `cfeb7945e3037243bcceb87842a52b1266f5a09245a44c2b8a9b29b9ce3cb736` and canonical JSON SHA256 `0562fea72f24f845b599a309141812eb3e8eb69ee60c7bf1468346c35cc35941`.

The unique English Passive Checks node at `data[7].entries[9].entries[7]`, page175, hashes to `6f4c21191fca29b8e98d2b1ca5c1f7b76eb5686dc73822ac29ac89119bfe9925`. Its finite rule is baseline10 plus normally applicable check modifiers; situational advantage/disadvantage has separate ±5 and is not automated here. The formula-text digest is `211e7e616f0ac663fae918c45164f491448a15c6f42d6ae201c92102cc525495`. The source interpretation agrees with the official [2014 Basic Rules Passive Checks review](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/using-ability-scores#PassiveChecks) and [official SRD5.1, PDF page78](https://media.wizards.com/2016/downloads/DND/SRD-OGL_V5.1.pdf).

This book is a **separate bounded-proof input**, not a230th corpus input, a changed inventory denominator, or a retroactive edit to the unchanged229-input lock. The audit checks original bytes, Git blob, parsed canonical hash, exact path/node hash and uniqueness. No book route, source snapshot or full prose is committed or uploaded as a public artifact.

## Modern identity and source ownership

Observant|XPHB page205 has entry SHA256 `7008f8c724a3a19a2aa276bff3e19c354ff218f461934dfd66dcebd0125b5855` and entry-list SHA256 `232a8430660648745621c6f964f269aa9edad485ed83644c169f5a3ef2074aa8`. Its categoryG, level4 and INT13-or-WIS13 prerequisites, INT/WIS choice, three-skill choice and Quick Search content remain distinct. The strict genuine-modern exception preserves its existing generic behavior; it never authorizes PHB passive bonuses or declares modern automation complete. In this exact frozen record, choose.from has no count: both actual0478 and the current generic picker expose no skill control. Historical manually recorded skill answers still use the old generic proficiency path. This batch does not invent a new modern picker or treat that limitation as a new-feature pass. Canonical-ID tampering, changed prose, kind, source, edition, pack, mechanics or injected effects/choices/dependencies cannot qualify as that exception.

The independent reviewedObservant v1 domain does not extend reviewedFeats v1 or change a global character/server schema. Intent is exactly kind observant, ability int|wis, explicit manual-ability exclusion and separate explicit manual-passives exclusion. Amount, cap, passive values and targets are adapter facts, not player payload fields. Numeric5, manual text, source exceptions or old answers are not consent.

Thirteen frozen class inputs and68 genuine legacy ASI slots retain exact hashes and **actual localized normalized canonical IDs**, not English-synthesized feature IDs. Both instance and canonical owner/ASI/feat availability gates apply; owner, ASI and feat must belong to the reviewed kiwee pack. Legitimate imported entry aliases remain usable. Duplicate/stale claims require explicit withdrawal and review, not silent repair. This does not globally relax or rewrite the shared legacy ASI adapter.

## Passive separation and preserved manual ownership

The chosen ability is an ordered grantLevel → choiceId → entryId event. At18/19 it contributes1; at20/22 it contributes0 without suppressing either passive5 or lowering an existing score. An earlier confirmation may not silently invalidate another already-confirmed ASI/feat; imported conflicting states recompute in deterministic source order using the target's actual source selection ID.

Passive5 never increases either active skill check, grants proficiency/expertise, scales with PB or affects unrelated passive skills. Investigation uses10 plus the final Investigation check, including legitimate proficiency/expertise, authored final skill totals and signed skill offsets, then its owned5. `sheetBonuses.passive` remains Perception-only.

An absolute final Perception17 plus existing sheet offset2 remains19, even with active Observant. It replaces the natural Perception result, including the automatic5; it does not erase the independent chosen ability or Investigation bonus. No new saved passive Investigation total or `adjustments.target` is introduced. The optional derived Investigation value is absent for unrelated/unconfirmed/withdrawn cards and malformed/future/forged stores. A structurally authenticated retained binding may show only the natural Investigation baseline while its owned bonuses are suspended.

Manual attributes, skill totals/offsets, passive offsets/reasons, proficiency/expertise maps, training, inventory, HP and consumed runtime resources remain unchanged. Clear/replacement/withdraw removes only this binding; source/level suspension preserves it and its genuine source tree/manual children. Future domains remain opaque and inactive with diagnostics.

## Directory construction, persistence and boundaries

The local full-directory mode authenticates all **229 original catalog inputs** against the committed corpus lock, then uses the actual consumer normalizer, homebrew and combined-equipment assembly plus authored App seed. Cold and snapshot-cache assemblies must preserve canonical PHB, genuine modern and legitimate aliases, while actual feat-domain conflicts remain blocked in either duplicate order. This is catalog construction and directed new-workflow checking, **not18,789 rule evaluations**.

Public CI may use the complete targeted feat/class/skill/language/equipment input domain rather than restore all229. Its receipt must label that targeted scope; it may not claim a full229 directory. The new private PHB175 baseline input remains separate in both modes. All200 prior runtime consumer module gates are retained when adding the new rule, source/hash helper, evidence and UI modules. The Observant layout stylesheet is not counted as a calculation module or added to the existing TS/TSX/JSON module whitelist. The new source receipt separately records `consumerStyleSources` for `src/ui/observantPassive.css`, verifies its exact committed consumer bytes before execution and rechecks its bytes afterward. This binds the actual style source without claiming browser layout acceptance or relaxing the generic report format.

Native single cards, cardbooks and linked complete native payloads preserve the independent intent. Native review and offline review HTML must display both values and source traces. The thin Owlbear projection retains ability totals and passive Perception only; its reimport remains manual/unowned and cannot create Observant automatically. Workbench/XLSX passive Investigation interchange is not claimed or silently changed.

The pinned pre-Observant client is Web `0478305fb20ddc9b65538fc50d5740d622c1589c`. Native unknown-field retention is not safe editing: old clear/reselect can retain stale review, old base/manual edits cannot attest fresh exclusion, and old downgrade/reupgrade does not own the new source archive lifecycle. **safeEditingCompatibility=false**; withdraw/review/reconfirm on a supporting client after such editing. No history-forgery detector or automatic migration is claimed.

## Execution gates

Run the official audit only after both consumer source and producer script are committed and clean:

`node --experimental-strip-types scripts/audit_reviewed_observant.ts WEB_ROOT FROZEN_INPUT_ROOT OUTPUT [PINNED_OLD_WEB_ROOT] [PINNED_RENDERER_PATH] [PRIVATE_PHB_BOOK_PATH]`

Set `OBSERVANT_FULL_CATALOG=1` for the source-bound local full229 construction receipt. The book path can be supplied separately from the frozen corpus root; the Web source unit gate uses `REVIEWED_OBSERVANT_PHB_BOOK_FILE`. The producer and consumer revisions/module bytes, all frozen source bytes, separate baseline provenance and unchanged catalog/card state are bound independently. Source declarations distinguish MIT code from localized-data CC BY-NC-SA4.0; publisher redistribution rights are not independently established, so no full source prose is distributed.

At initial authoring all official source audits, final local aggregate checks, necessary full replay, paired locks, exact-head CI and actual App/browser acceptance remain pending. Dirty-tree development source checks are not final HEAD proof. Retain all initial red/error logs and distinguish executed passes, conditional skips and never-run gates. Do not claim rule completion, merging or deployment from this document.


## Initial private directory-check correction

The first local full229 construction/directed check halted at a producer assumption that genuine modern Observant already exposed a count1 skill picker. Exact source and the actual old0478 tests show no picker because the frozen choose.from omits count. The producer now asserts unchanged empty choices and old/current generic output equality, while separately retaining historical saved-answer behavior. No product source, picker eligibility or generic probe was changed to satisfy the check. The first red log is retained privately. This dirty-tree development check is not an official source-bound audit or corpus replay.


## Private pre-freeze full-directory development check

After correcting the modern-picker producer assumption, one development attempt completed its behavioral cases but correctly rejected a concurrent consumer-source edit in its final hash-stability guard. That first log remains private; no passing receipt was written. Once core edits stopped, the same49 directed checks passed49/49, with0 failures and0 skips, using all229 unchanged catalog inputs:29,459 normalized directory entries plus34 authored equipment entries and12 size entries,29,505 App entries total. Canonical PHB/genuine modern, exact duplicates, aliases, non-feat namesakes, impostors in both orders, canonical/instance disables, custom packs and the actual snapshot-cache assembly were checked. All113 current consumer module byte hashes remained stable during that run.

The private receipt is explicitly labeled **DIRTY-TREE DEVELOPMENT SOURCE CHECK; NOT FINAL HEAD PROOF**. It did not evaluate18,789 corpus rules, modify the lock/denominator, or establish final source/browser/CI acceptance. An official clean-source full-directory receipt still has to bind the same final modules and source revisions after freeze.


## Pre-freeze offline producer gates

Before source freeze, the local Data suite passed953 Vitest tests with11 existing conditional skips (31 files passed,1 skipped),14/14 Node tests and6/6 Python tests. The source-project compiler exited0; audit-script syntax and whitespace checks passed. These are development producer gates, not the official bounded source proof, a completed full replay, remote CI or actual App acceptance. The style-source metadata refinement is checked separately by the focused binding suite; source compilation remains src-only rather than a claim that the standalone audit script was typechecked by that project.


Whole source-bearing card/catalog preservation assertions use fingerprints rather than raw object/string diffs, so a public CI failure cannot dump frozen source prose. The CSS refinement's first binding run hit minimal synthetic fixtures before reaching the intended early guard; moving the unchanged style checks after source/producer authentication and before API execution restored35/35 binding passes. The retained initial log remains private. A complete post-style run passed954 Vitest tests with11 existing skips,14 Node and6 Python, compiler0. The subsequent privacy-assertion focused rerun passed36/36 new guards and95 retained neighboring guards,131/131 total, without failures or skips.
