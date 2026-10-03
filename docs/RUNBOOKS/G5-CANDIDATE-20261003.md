# G5 browser contract candidate — 2026-10-03

The user's blanket execution approval remains in force. Main owns all protocol,
mapping and implementation decisions. G5 is pending final Web regressions, 14
CI groups and a distinct-model read-only audit. Do not start G6 on this receipt.

Added: hashed identity fixture, standalone browser schema/semantic validators,
typed reference aliases, explicit ritual capability and minimal feature tags.
Record snapshots permit unloaded targets only after validating canonical shape,
kind and edition. Full envelopes still require actual targets. Item save bonuses
respect required attunement; unsafe numeric modifier shapes are rejected.

Stricter validation exposed 12 extension-book backgrounds referencing feats from
the opposite edition. The producer now reports unsupported edition references
and preserves the other mechanics. Explicit `both` edition spell references are
retained; mismatched single editions remain rejected. Failure and replay evidence
are retained under ignored `evidence/`.

Node 24 final candidate: 297 Vitest passed / 0 skipped / 0 failed, and 14 original
Node tests passed / 0 skipped / 0 failed. Real equivalence uses unchanged Web
baseline `80c94e082fcbf11be10893622b03d4220bff4d60`, never the changed executor.
Node 22.12 replay, clean standalone checkout, final bundle hashes and original
command outputs are recorded in the final G5 result after they finish.

```sh
DND_AUTOMATION_REAL_DATA=/workspace/dnd5e-automation-data/.cache/upstream/kiwee DND_WEB_EQUIVALENCE_REPO=/workspace/DND-card-web npm test
npm run build
node --experimental-strip-types src/cli.ts derive --offline --out .cache/g5-candidate-final24
node scripts/browser-bundle.mjs .cache/browser-share
```

No corpus body was published. Every production record remains needsAnnotation;
test-only main-reviewed Web samples do not change coverage. Restore G4 in a
separate worktree with tag `automation-g4-foundry-20261003`, or revert the G5
candidate commit. The user's original Web workspace and main remain untouched.
