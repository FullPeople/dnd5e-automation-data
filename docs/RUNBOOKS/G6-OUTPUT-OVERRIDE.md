# G6 output-directory correction — 2026-10-03

The first accepted PHB replay produced the correct coverage summary (91
accepted, 6,305 core pending) but the npm script's preset `--out artifacts`
preceded the requested replay directory. CLI first-flag parsing therefore wrote
to the default directory and the subsequent file comparison failed with ENOENT.
The initial command and failure logs remain in private evidence.

The npm script now lets the pipeline CLI provide its normal default. The
atomic-publication test also runs the real npm command against a synthetic
locked corpus and verifies that its requested directory contains the approved
result. Node 22 and 24 passed 309 Vitest / 0 skipped / 0 failed, 14 Node tests /
0 skipped / 0 failed, and strict builds after this correction.

Rollback: revert only this correction commit if needed; accepted annotations
remain isolated in their batch commits. Complete versioned artifacts are
regenerated after the correction is committed and checked byte-for-byte across
both supported Node versions before publication.
