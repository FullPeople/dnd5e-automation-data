# Declared source identifiers with spaces and ampersands

The current homebrew directory declares source codes containing ASCII spaces and `&`. The previous IR identity schema rejected these codes even though the shared identity codec already preserves and URI-encodes them. This prevented a complete draft from being validated; silently replacing the codes would change source identity and could merge unrelated entries.

The immutable source is [tjliqy/homebrew-deploy at e225d226fdb6df4d22754f673e423cd5906ddc22](https://github.com/tjliqy/homebrew-deploy/tree/e225d226fdb6df4d22754f673e423cd5906ddc22). Eight distinct declarations were verified against the raw source bytes and Git blob identities. Only their identifiers appear in the shared test fixture; source bodies are private inputs.

The schema now accepts canonical uppercase ASCII words separated by single spaces, alongside the existing alphanumeric, underscore, colon and hyphen characters, plus ampersands. Leading, trailing, repeated and non-ASCII spaces, reference separators, paths, escapes and controls remain rejected. The identity codec, protocol, existing keys, edition handling and source aliases are unchanged. A year in a source identifier does not establish an edition.

The generated automation schema, overlay schema, browser validator and standalone generator use the same rule. Schema generation writes explicit UTF-8 bytes with LF endings. The browser bundler preserves dependency link paths so sharing an existing `node_modules` directory does not embed another worktree's path. The regenerated checked-in bundle differs only by the 11 exact source-pattern substitutions; the two schema files and generated TypeScript also differ only at that pattern.

## Verification and limits

- The initial identifier regression failed 9 of 10 cases under the old schema. After the change, the five focused suites pass 46 tests, including overlay boundaries, compiled browser/producer parity and standalone source-built/checked-in generator parity.
- Invalid replacement sources must fail before either generator changes any prior output file. Distinct punctuation-bearing codes and PHB/XPHB remain distinct identities. Inputs are not mutated, and drafts retain `needsAnnotation`.
- The new generator test initially failed against the stale checked-in bundle; regenerating it through `scripts/kiwee-bundle.mjs` repaired that discrepancy. No test was removed or weakened.
- Windows full-suite evidence is 1,140 passed, 14 failed and 189 conditional skips. Thirteen failures concern unavailable file-symlink creation privileges; the remaining failure is the existing shallow-clone historical-object test. Native tests pass 15/15 and public progress export tests pass 6/6. Linux CI must independently pass before merging; the Windows run remains a failure.
- A private rehearsal against 469 actual, hash-locked current inputs passed the source-identifier boundary but still failed validation on book progression and an effect target. No current full-corpus artifact is accepted or published by this change.

This is identifier compatibility, not reviewed rule behavior. It grants no registration, review, modeling, execution or acceptance credit, and does not replace the accepted historical corpus or any player snapshot.
