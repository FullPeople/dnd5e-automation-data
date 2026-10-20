# Reject colliding levels in sparse optional-feature quota declarations

## Defect and structural source

At Data main `c2718249dcec5b03ae9c8d6e0bf619ca27a6fca4`, distinct keys in
an `optionalfeatureProgression[].progression` object can normalize to the same
numeric level. For example, the authored declaration `{"1":1,"01":2}` emits
two level-one points. Public validation then raises `scaling-order`, so a
malformed source group can break generation of an otherwise pending draft.

The expected behavior follows the existing project contract:

- The fixed-baseline [public validator](https://github.com/FullPeople/dnd5e-automation-data/blob/c2718249dcec5b03ae9c8d6e0bf619ca27a6fca4/src/validate/index.ts)
  requires `choiceProgression` levels to be unique and ascending.
- The [derivation contract](https://github.com/FullPeople/dnd5e-automation-data/blob/c2718249dcec5b03ae9c8d6e0bf619ca27a6fca4/docs/DERIVATION-RULES.md)
  describes optional-feature progression as one cumulative quota. Unknown shapes
  remain explicit diagnostics, without promoting a record to automated.
- The [existing producer](https://github.com/FullPeople/dnd5e-automation-data/blob/c2718249dcec5b03ae9c8d6e0bf619ca27a6fca4/src/derive/structured/classes.ts)
  converts object keys using `Number` and maps `*` to level zero. Checking raw
  string-key uniqueness would not satisfy the public numeric-level invariant.

This is a reproduced producer/public-IR inconsistency using original synthetic
inputs, not a newly inferred D&D eligibility rule or a claim that a particular
published class is corrupt. No competing source values are chosen, summed or
silently deduplicated.

On 2026-10-18, the public [Warlock source structure](https://5e.kiwee.top/data/class/class-warlock.json)
was inspected in ignored cache: 166621 bytes, raw SHA-256
`4c5c188a6f555772b046d6ba260c8e30a2070f7e4266fc71f9cca04de19f948e`.
Its PHB pact-boon group at `/class/0/optionalfeatureProgression/1/progression`
uses a sparse object with the single key `3`. Materialization yielded 161 rows,
zero identity diagnostics and one object progression group. Comparing baseline
and fixed derivation for all 161 rows produced zero changed results. No rule
bodies or real progression tables are committed.

## Minimal change and boundaries

After normalizing and sorting the existing points, one check detects repeated
numeric levels. Any collision rejects that entire group with the existing
`featureProgression/optional-progression-shape` diagnostic. Other groups retain
their original index-based keys and declarations.

The check applies even when duplicate quotas are equal or zero. A zero-valued
collision must not silently disappear as though the malformed declaration were
valid. Ordinary sparse levels, `*`, cumulative totals, and existing noncolliding
level coercion remain unchanged. This is not a new lexical grammar for source
keys. Complete-array handling and the newly merged Web whole-table checks are
unchanged.

The standalone generator is regenerated; its only behavior diff is the same
collision check. Output remains `needsAnnotation`, with unsupported mechanisms
visible. No ability is activated, no player state is read or written, and no
unknown source quota is inferred.

## Red/green and complete checks

- Before the source edit: **11 failed / 2 passed** in 13 new regressions. The
  public-draft regression actually raised `scaling-order` in the old code.
- After the edit: **13 passed**. Combined with the existing optional-progression
  suite: **36 passed**. Cases include multiple textual aliases, two noncanonical
  aliases, equal/zero duplicate counts, frozen inputs, group isolation, public
  pending-draft validity and preservation of noncolliding forms.
- An additional CLI regression verifies source-built and checked-in standalone
  generators emit identical valid pending output, with a malformed group
  diagnosed and its valid sibling retained.
- Final `npm test`: **468 Vitest and 14 Node tests passed**. **11 historical
  equivalence tests skipped** because the original locked source corpus and
  unchanged historical Web baseline are unavailable here.
- TypeScript build, all **6 Python export regressions**, and `git diff --check`
  passed on Node 24.19.0.
- The existing pinned consumer `23920a9ee751fac6686fa0bd6c94fcc0aae4ce18`:
  all **70 module bytes** verified and all **8 real-consumer probe scenarios**
  passed. These preserve the existing audit, rather than certify new runtime
  coverage.

No new replay of all 229 original inputs was performed; the user-side private
cache used by the integration owner was not accessed or published. This bounded
producer fix has synthetic public-IR failure evidence and the current-source
comparison above. Whole-corpus equivalence, new artifact adoption, whole-rule
qualification and live player behavior are not claimed.

## Intake, isolation and rollback

Intake verified Data PR43/44 merged, Data main at the baseline above, and Web
main `059725fd9aaf38ed64b1acbc24bdfcbdcb646a89`. The old five Data drafts and
Web PR87/88 work are already integrated; none is reopened or continued. No
open Data rule PR, issue assignment or competing implementation for this check
was found; only the unrelated operations draft remained open.

The new branch starts directly from current Data main. Data has no applicable
`AGENTS.md` or `.agents/skills`; workspace `.agents` is empty. README, protocol
and derivation instructions provide the applicable annotation and privacy
boundaries. No old package or branch is reused, and Web is read only.

The report blob remains `78c7538da80059f47ef6b5b7381038215837908d`, with SHA-256
`2ad65f4b05bd07b58194ad599ab4435babae0e01ef56b3437331e8edd0be1688`.
The 18789 total, 4561 reviewed and 6537 partial-mechanism-witness counts remain
unchanged, as do input locks and per-record audit results. Whole-rule and live
whole-rule counts remain unknown. No permission, credential, player-data,
deployment or cancelled-maintenance work is performed.

Revert this PR's single commit to restore the producer and standalone behavior
together. No live artifact or player migration needs reversal. The PR records
the actual commit SHA and exact HEAD push CI separately from any synthetic PR
merge checkout. Independent review remains the next step; no merge or
deployment is authorized by this draft.
