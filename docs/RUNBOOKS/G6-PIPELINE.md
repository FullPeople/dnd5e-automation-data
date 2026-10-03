# G6 pipeline entry — 2026-10-03

G5 passed independent technical and CI review at Web
`a804d3be3a16558c874db43ce6e2332a2950ad8b`. Workflow
`37139204468` passed verify plus all seventeen browser groups. The exact
reports remain in the Web repository; earlier failed audit reports are retained.

This commit adds fetch → derive → accepted overlays → validation → reports as
one command. No annotation is accepted by this tooling commit. Its first real
offline replay contains 18,789 records, 6,396 core records, 6,396 core
needsAnnotation, zero accepted reviews and zero stale reviews. G6 is pending.

Node 22.12 and Node 24 passed the full corpus-enabled producer suite: Vitest
309 passed / 0 skipped / 0 failed and Node tests 14 passed / 0 skipped / 0 failed;
both strict builds passed. Eleven new pipeline tests cover complete replacement,
layer reversals, review samples and batch size, stale upstream inputs, body
prohibitions, reference isolation, disk tampering and atomic publication. The
atomic fixture initially omitted the Foundry version lock; the first failed
logs remain in private evidence. The corrected test also verifies exact SHA and
size locking for overlay and review-index bytes, and retained previous output.

Review receipts bind exact overlay bytes and the complete upstream input lock.
Own overlay inputs are additionally locked in released artifacts, excluded
from the review's upstream fingerprint to avoid circular hashes. Stale reviews
cannot mark a new source version as covered. A core-complete release requires
`--require-core-complete`.

Manual dispatch and the weekly schedule run the pipeline unattended and upload
only generated mechanical artifacts. Raw input cache, publisher bodies,
intermediate annotation proposals and player cards are not uploaded.

Rollback: revert this isolated tooling commit to data commit
`5f24e49380777d189fc4aefda712c780ac9bbc0f`; a successful local pipeline retains
the previous generated directory at `<out>.previous`. Revert individual later
annotation batch commits together with their receipt and sample report.
