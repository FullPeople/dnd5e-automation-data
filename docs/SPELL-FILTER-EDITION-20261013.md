# Spell-filter source aliases retain the existing edition boundary

Data main `7bb44c25527b107c26fb7c56446399c1bc974e6a` had a case-sensitive
`editionForSource` lookup. A schema-valid 2014 invocation draft with a spell
filter `source: ["PHB", "xphb"]` and a matching PHB spell passed every check.
Changing only the second selector to `XPHB` produced `edition-reference`.
The reverse direction had the same defect. A differently cased foreign
`classSource` could also evade this version check.

This is a validator boundary fix. It does not establish that an invocation
actually selected or granted a foreign spell in the current Web consumer.

## Source and expected behavior

The expectation comes from the existing, fixed-version Data contract:

- [Protocol at the baseline](https://github.com/FullPeople/dnd5e-automation-data/blob/7bb44c25527b107c26fb7c56446399c1bc974e6a/docs/PROTOCOL.md)
  separates 2014/2024 identities and explicitly rejects cross-edition spell
  filters. Existing validator invariant 9 already rejects uppercase controls.
- [Identity codec](https://github.com/FullPeople/dnd5e-automation-data/blob/7bb44c25527b107c26fb7c56446399c1bc974e6a/src/identity.ts)
  canonicalizes source identifiers with trimming and uppercasing.
- [Structured spell filter parser](https://github.com/FullPeople/dnd5e-automation-data/blob/7bb44c25527b107c26fb7c56446399c1bc974e6a/src/derive/structured/spells.ts)
  accepts letter-case variants of a source selector and emits its uppercase
  source code. The IR schema allows source strings and source arrays.
- The official [2014 Basic Rules](https://www.dndbeyond.com/sources/dnd/basic-rules-2014)
  and [2024 Basic Rules](https://www.dndbeyond.com/sources/dnd/br-2024) provide the
  separate edition references. The rejection policy is this project's existing
  protocol; this change adds no new interpretation of game compatibility.

The validator now trims and uppercases only a local value before recognizing
the same six core source codes. Foreign core selectors retain the same
`edition-reference` error whether uppercase, lowercase, mixed-case or padded
with spaces. A matching same-edition spell in an OR filter cannot hide an
additional foreign source scope.

Catalogue matching is otherwise unchanged. Source selectors and input records
are not rewritten. Same-edition aliases still preserve their pending drafts.
Explicit extension edition metadata is respected; unclassified source codes
are not assigned an inferred edition. No prerequisite, feat, infusion or
invocation execution is added, and no record is promoted from `needsAnnotation`.

## Validation and scope

The initial targeted run was performed before the predicate edit: 14 tests
failed and 6 passed. After the edit and standalone bundle rebuild, those 20
passed. The final set adds two same-edition class-source controls and record-only
snapshot assertions; all 22 targeted tests are covered by the complete run.

- Full `npm test`: 348 Vitest and 14 Node tests passed; 11 historical equivalence
  tests explicitly skipped because their locked corpus/baseline is unavailable.
- TypeScript build and all 6 Python public export regressions passed on Node
  24.19.0.
- The generated, import-free browser validator rejects the exact mixed-source
  counterexample with the same code/path as the producer, without input mutation.
- Public artifact validation rejects the foreign scope. Record-only snapshot
  validation retains that rejection even with no loaded catalogue.
- The checked-in standalone generator was regenerated from source.
- The unchanged audit consumer `63ea4b240bb662417b51a1d42d6c9168b4f10845` passed
  all 68 module-byte checks and 8 real-consumer probes. Its report blob remains
  `7ff29a858bdc9f2d7d1ac59ea63a2b851e42f3aa`, exactly the baseline's blob.

All new payloads are original synthetic fixtures. No rule text, publisher
snapshot or private character/review material is committed. No 229-input replay,
whole-rule eligibility review, consumer adoption or production deployment was
performed. Reviewed/implemented counts, overlays, artifact pins and player state
remain unchanged.

The work starts from current main on its own branch. PR30 `b11cd828` and PR31
`f2e8e41` remain unchanged drafts; yesterday's category/combination work is not
repeated. Intake found no competing branch, open issue or PR for this validator
lookup. No Data `AGENTS.md` or `.agents/skills` is present and workspace `.agents`
is empty; README and the protocol provide the applicable rules.

## Rollback and next step

Revert this PR's single commit to restore the previous lookup and standalone
bundle. There is no player-data or published-artifact migration to undo. Next is
independent review of this rejection boundary. Any future artifact adoption and
full rule qualification require separate evidence. Record the final HEAD push
CI separately from PR CI's synthetic merge checkout.
