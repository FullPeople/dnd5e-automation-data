# Subclass feature references preserve their declared parent source

## Defect and source contract

At main `f19fe8aea9245209ff82a84b23aad456a18216e8`, the `subclassFeatures`
producer compared feature source, class source/name, subclass short name and
level, but omitted the UID's subclass source. A sole same-name candidate with
a different canonical subclass source could be emitted under the original
alias. If both parents' candidates existed, the missing constraint could also
make an otherwise exact reference appear ambiguous.

The expectation is grounded in existing structure, without interpreting prose:

- [Protocol identity contract](https://github.com/FullPeople/dnd5e-automation-data/blob/f19fe8aea9245209ff82a84b23aad456a18216e8/docs/PROTOCOL.md)
  and [shared codec](https://github.com/FullPeople/dnd5e-automation-data/blob/f19fe8aea9245209ff82a84b23aad456a18216e8/src/identity.ts)
  retain class and subclass source/name pairs as separate canonical identity
  components.
- The baseline's [full UID resolver](https://github.com/FullPeople/dnd5e-automation-data/blob/f19fe8aea9245209ff82a84b23aad456a18216e8/src/derive/structured/common.ts)
  already checks the subclass source independently. For a subclass feature UID,
  zero-based component 4 is subclass source (default `PHB`); component 6 is
  feature source (default component 4, then `PHB`). They are distinct fields.
- On 2026-10-15, the public [Warlock source structure](https://5e.kiwee.top/data/class/class-warlock.json)
  was fetched into ignored cache: 166621 bytes, SHA-256
  `4c5c188a6f555772b046d6ba260c8e30a2070f7e4266fc71f9cca04de19f948e`.
  `/subclass/6/subclassFeatures/0` uses a six-component reference with an explicit
  subclass source; `/subclass/22/subclassFeatures/0` uses seven components.
  `/subclass/0/subclassFeatures/0` exercises the empty/default source form.
  Only structural pointers and the hash are committed, never rule bodies.

Fresh source materialization yielded 161 rows without identity diagnostics.
All 99 declared feature references across 24 subclasses resolved before and
after the fix, with zero changed derivation results. This is a demonstrated
API identity-boundary defect using synthetic wrong-parent controls, not a
claim that these current real records were corrupt or newly automated. The
current fetched snapshot is not the original 229-input locked corpus.

## Change and red/green evidence

The only producer change adds the missing case-insensitive canonical
`subclassSource` comparison, with the existing UID default of `PHB`. The
standalone generator is regenerated with the same one-line predicate change.
No shared codec, schema, eligibility rule or Web behavior is changed.

The initial 15 synthetic tests produced 4 failures and 11 passes before the
source edit. The failures demonstrate wrong-parent substitution, false
ambiguity, incorrect handling of an omitted parent source, and acceptance of a
target lacking canonical parent metadata. All 15 passed after the edit. Two
additional controls preserve explicit edition rejection and ordinary class
feature source defaults, bringing the final focused suite to 17 passes.

The suite also preserves explicit/default source forms, legacy aliases,
case-insensitive sources, other identity mismatch rejection, true ambiguity,
frozen source data and valid public `needsAnnotation` output. Missing or
incompatible references retain `unresolved-feature-ref`; explicit edition
mismatches retain `cross-edition-feature-ref`. No ability grants are emitted.

## Validation and limits

- Full `npm test`: 346 Vitest and all 14 Node tests passed on Node 24.19.0.
- Eleven historical equivalence tests explicitly skipped: the original locked
  source corpus and unchanged historical Web baseline are unavailable here.
- TypeScript build and all 6 Python public export regressions passed.
- Main's pinned consumer `ee4e44e80d6c23a2d1dc2c720036d99668810164`: all
  70 module bytes verified and all 8 real-consumer probe scenarios passed.
- `git diff --check` passed. The generated bundle has only the corresponding
  predicate diff. The ledger blob remains main's
  `c41dcef6d0f21407ba5f069ecfe0691c69d83a41`.

No 229-input replay, full rule qualification, consumer adoption or live player
verification is claimed. The existing 18789-record, 4561-reviewed and
6535-mechanism-witness counts remain unchanged. Unknown and incomplete
mechanics remain pending; no overlays, artifact pins, rule text, player records,
credentials or permissions are changed.

## Intake, review and rollback

The environment restored successfully. Remote main matched the expected PR40
ledger update; its only changed file was the runtime coverage report. Open
work was inspected: PR30 `b11cd828`, PR31 `f2e8e41`, PR37 `aa33667` and
PR39 `ed2ba019` remain drafts, with no competing implementation for this
parent-source predicate. No new open issue, assignee or review request assigned
this work elsewhere. The unrelated operations draft is untouched. No draft
wrapper status was used as conflict evidence.

The branch starts from that exact main. Data has no `AGENTS.md` or
`.agents/skills`, and workspace `.agents` is empty; README and protocol supply
the applicable boundaries. Existing upgrade/ASI, infusion and invocation work
in the four drafts is not repeated. Web/Suite performance work and cancelled
maintenance/deployment tasks remain outside this change.

Revert this PR's single commit to restore both the producer and standalone
predicate. No player-data or published-artifact migration needs reversal.
The PR records the actual commit and exact HEAD push CI separately from any
synthetic PR merge checkout. Independent review is the next step; this draft
does not authorize merge or deployment.
