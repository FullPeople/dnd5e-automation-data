# Runtime consumer byte verification CI candidate

Based on the freshly fetched Data main `9acd4d5e7c5bed9cf34150db4319a7aeec6751e8`.
The existing workflow checked out the report's consumer revision and exercised
eight real function probes, but did not compare the report's module hashes to
the files those probes would execute. A checkout or working-file mismatch could
therefore go unnoticed by that CI step.

The new mandatory `verify_runtime_consumer.ts` step runs before the probes. It
validates the coverage ledger, requires the exact Git checkout root and revision,
then hashes every declared module's actual file and committed Git blob. Missing
files, symlinks, unsafe or duplicate paths, changed working files and a forged
hash matching only changed files fail closed. It does not read upstream rule
text, fetch the original cache, write player data or regenerate any statistics.
Both progress reports remain byte-for-byte unchanged.

Local verification: eight new regression cases; full Vitest 318 passed / 11
existing real-data conditional skips; Node tests 14 passed; Python public export
tests 6 passed; TypeScript build passed. The actual pinned Web checkout
`0dde358a2382d4c3d88977165f3a854feb0609e4` passed all 48 module checks and eight
existing real consumer probes. The current Warforged candidate is rejected as a
different declared consumer revision, as required. No whole-corpus re-audit or
publication proof is claimed.

The first full test run lacked the committed `reports/g1/coverage-report.json`
because this isolated checkout was sparse: 317 passed / 1 failed / 11 skipped.
Adding the original committed reports/g1 directory fixed that setup failure;
the original failure log and final logs are retained locally. No assertion was
removed. There is no separate lint script; `git diff --check` passed.

Reproduce from this candidate with a checkout of the report's exact Web commit:

```sh
npm ci
node --experimental-strip-types scripts/verify_runtime_consumer.ts /path/to/pinned-web
node --experimental-strip-types scripts/test_runtime_probe.ts /path/to/pinned-web
python -B -m unittest discover -s scripts -p test_export_progress_status.py -v
npm test
npm run build
```

The prior Data write denial has no verified repair handoff. This is a local
candidate; no new credential, alternate write route, push, PR, merge or deployment
was attempted. Frozen revision, source hashes, rollback verification and bundle
are in the local delivery receipt. After authorized transfer, revert the candidate
commit with `git revert --no-edit <candidate-commit>`; do not reset the main branch
or overwrite later work. The workflow and checker changes are reversible without
touching the progress reports.
