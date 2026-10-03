# Single shared browser module — 2026-10-03

The previous bundle exported ten shared source/compiler files. The producer now
exports one hash-locked `identity.ts` module containing the exact identity codec,
protocol types, formula parser and strict precompiled/semantic validation APIs.
There are no runtime imports or package dependencies. The identity JSON fixture
is emitted for tests only and excluded from the runtime shared-file manifest.

The generated compiler JavaScript remains unchecked, as the former schema `.js`
files were. All handwritten producer sources retain strict compilation and
explicit public TypeScript signatures. Node 22 and 24 passed 312 Vitest tests /
0 skipped / 0 failed plus 14 Node tests / 0 skipped / 0 failed and strict builds.
Three new tests execute the standalone module, compare real identity fixtures
and formula behavior, and verify twelve valid/corrupt envelopes plus three
overlay-evidence cases against producer checks. They also check that record-only
bundles omit full-envelope schemas and have no external imports.

The Web keeps small local compatibility/type facades. Foreground record checks
use the normal module entry; full-data checks use a lazy query entry of the same
source file. Worker/full-data validation and foreground validation therefore
retain separate build boundaries without additional external source modules.
The shared manifest contains exactly one SHA. Existing assertions, skips,
timeouts and browser startup budgets remain unchanged.

Rollback: revert this generator commit and the paired Web facade commit, then
resynchronize the ten-file bundle from data commit
`c1a681f250e2cb8d7e65a5bbf08c74c352be03df`. Runtime behavior is covered by the
existing regression and browser flows before the Web change is committed.
