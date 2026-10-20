# Preserve the declared identity kind in inline feature choices

## Defect and structural source

At Data main `c2718249dcec5b03ae9c8d6e0bf619ca27a6fca4`, inline choices read
the `classFeature`, `subclassFeature` or `optionalfeature` reference field, then
discard that distinction and resolve it as generic `feature`. A missing
optional feature can consequently be substituted by a same-name class feature.
When both kinds exist, the generic lookup can instead reject the valid optional
feature as ambiguous. A full UID for the other feature kind can also pass
through the generic resolver despite the declared field.

The expected identity boundary comes from existing structures:

- [Canonical identity](https://github.com/FullPeople/dnd5e-automation-data/blob/c2718249dcec5b03ae9c8d6e0bf619ca27a6fca4/src/identity.ts)
  includes kind independently of name and source. The [derivation contract](https://github.com/FullPeople/dnd5e-automation-data/blob/c2718249dcec5b03ae9c8d6e0bf619ca27a6fca4/docs/DERIVATION-RULES.md)
  supports typed inline references and retains unresolved mechanisms explicitly.
- The published [5etools-utils 0.17.20 archive](https://registry.npmjs.org/5etools-utils/-/5etools-utils-0.17.20.tgz),
  `package/schema/site/entry.json`, defines separate
  `/$defs/entryRefClassFeature`, `/$defs/entryRefSubclassFeature` and
  `/$defs/entryRefOptionalfeature` objects. Each requires its corresponding
  reference field and has a distinct `type` discriminator. The archive inspected
  matches the registry metadata's SHA-1
  `9d1c35fcaa7d46cfc0f2e3d960c74282bf528b54`; SHA-256 is
  `e5c5fc20f41ccf937bcbbc7557eb90802b071cb7a18d648c3152ad35fabc5aa9`.
  This is fixed schema evidence, with no dependency/version change.
- Current public [Warlock](https://5e.kiwee.top/data/class/class-warlock.json)
  structure uses `optionalfeature` fields at `/classFeature/3/entries/1` and
  `/classFeature/18/entries/1`, and `subclassFeature` fields at
  `/subclassFeature/30/entries/4`. These three option nodes contain 34 typed
  references. The expected kind is declared by the field rather than inferred
  from prose or a class name.

On 2026-10-19 the Warlock file was 166621 bytes, raw SHA-256
`4c5c188a6f555772b046d6ba260c8e30a2070f7e4266fc71f9cca04de19f948e`.
The accompanying [optional-feature catalogue](https://5e.kiwee.top/data/optionalfeatures.json)
was 161557 bytes, SHA-256
`98658da021b138f1e7cec6698e58e4a285037843ae57c12e7caf0d55efc88095`.
Together they materialized 382 rows without identity diagnostics. Comparing
baseline and fixed derivation for every row produced zero changed results;
the wrong-kind and cross-kind ambiguity defects are reproduced with original
synthetic controls, not claimed to affect those current real records. Raw
inputs and schema archives remain outside the public commit.

## Minimal change and preserved boundaries

The choice reader passes the declared reference kind into the existing resolver
and checks that the returned canonical identity has that same kind. Both are
needed: the existing full-UID resolver can infer class/subclass kind from UID
shape even when its caller requests another kind.

A missing or incompatible typed target retains `unresolved-inline-choice` and
rejects the whole option group. Another identity kind cannot repair it. A valid
typed target is no longer confused with unrelated same-name kinds. Multiple
matching candidates within the expected kind remain unresolved.

Field precedence, minimal field-only references, owner-source defaults, UID
parsing, edition/`both` boundaries, quotas, duplicate checks and group atomicity
retain their existing behavior. General upstream schema validation and full
rule eligibility are not added. The standalone generator is regenerated with
only the corresponding resolution change.

Records remain `needsAnnotation`; finite IR declarations do not activate
abilities or mutate a character. No new prerequisite inference, item activation,
resource operation, source classification or completion verdict is introduced.

## Red/green and validation

- Before production edit: **10 failed / 4 passed** in 14 new regressions.
  The failures expose wrong-kind substitutions, class/subclass UID mismatches,
  cross-kind false ambiguity and rejection of a valid pending declaration.
- After the fix: **14 passed**. Together with the existing version-boundary
  suite: **28 passed**. Positive controls cover all three kinds, qualified and
  inherited sources, genuine within-kind ambiguity, whole-group rejection,
  frozen inputs and valid public pending output.
- An added CLI regression verifies source-built and checked-in standalone
  generators produce identical pending output selecting the optional-feature
  identity beside a same-name class-feature shadow.
- Final full suite: **469 Vitest and 14 Node tests passed**. **11 historical
  equivalence tests skipped** because their locked source corpus and unchanged
  historical Web baseline are not available here.
- TypeScript build, all **6 Python export regressions**, and diff checks passed
  on Node 24.19.0.
- Existing ledger consumer `23920a9ee751fac6686fa0bd6c94fcc0aae4ce18`: all
  **70 module bytes verified**, with **8 real-consumer probe scenarios passed**.
  These preserve the existing audit and do not certify new runtime coverage.

No new 229-input replay, complete corpus equivalence, new artifact adoption,
whole-rule qualification or live player behavior is claimed. The private
user-side cache used for earlier integration was not accessed or published.

## Isolation, review and rollback

The branch starts directly from inspected main. PR45 remains draft at
`4035f923b3f7700c3dd97b91d9b12722cf942b3a`; its sparse-level collision work is
not repeated. No competing open rule PR, issue assignment or review request
for typed reference resolution was found. The unrelated operations draft and
old integrated fixes remain untouched.

Data contains no applicable `AGENTS.md` or `.agents/skills`, and workspace
`.agents` is empty. README, protocol and structured derivation instructions
provide the annotation, source immutability and privacy boundaries.

The runtime ledger SHA-256 remains
`2ad65f4b05bd07b58194ad599ab4435babae0e01ef56b3437331e8edd0be1688`, with
18789 total, 4561 reviewed and 6537 partial mechanism witnesses. Counts, audit
records, input locks, Web, player data, permissions and credentials are unchanged.
Whole-rule and live whole-rule counts remain unknown.

Revert this PR's single commit to restore the source reader and standalone
generator together. No live artifact or player-data migration is involved.
The PR records the actual SHA, compatibility check against PR45 and exact HEAD
push CI separately from synthetic PR merge validation. This is an independent
draft for review; no merge, deployment or cancelled maintenance is performed.
