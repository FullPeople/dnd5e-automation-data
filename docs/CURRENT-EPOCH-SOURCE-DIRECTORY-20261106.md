# Current-epoch source directory

This is a source-directory metadata refresh, with no additional source-review,
whole-rule modeling, execution or acceptance credit. It does not replace the
18,789 registered records or the Data93 runtime report. Existing Web releases keep
their exact old directory lock until a separately checked Web update adopts this
report. This local candidate has not been published through the website.

## Why the directory missed sources

The former directory used the old registered sources, the homebrew source index,
homebrew metadata and candidate player-rule identities. Primary book/adventure
metadata was not registered. A source without a modeled player entry could be
missed entirely. Comparing the complete current cache against the Web directory
found four missing declared sources: `HFLOTT`, `PL`, `RWG` and `SOS`.

The generator now reads only the primary `data/books.json` and
`data/adventures.json` indexes for these titles, using their explicit `source`
field. It does not reinterpret a document ID as a source: `PS-A` declares `PSA`,
and embedded adventures can declare their parent book. Arbitrary chapter arrays
and metadata without a source are not guessed into book identities. Unclassified
files remain `needs-category-review`, with no claim of inapplicability.

Names and dates come from hash-verified current metadata. For `PL`, the immutable
[upstream source-code table](https://raw.githubusercontent.com/tjliqy/5etools-cn/774a320e4a92d71d100673bc0df965661d9e8c1b/js/parser.js)
maps the code to the Chinese title 拉莫迪亚计划 and date 2026-10-13. The
[D&D Beyond staff support record](https://www.dndbeyond.com/forums/d-d-beyond-general/release-issues-support/245285-project_lamordia-issues-support)
identifies Project_Lamordia and the same four background names. These are source
metadata checks, not a review of their rules or a claim about our support.

## Separate epochs and denominators

The exporter materializes the original and current inputs independently. It does
not construct an executable mixed-epoch corpus. Exact source-qualified identities
are compared without merging display names or editions.

| Inventory | Count |
| --- | ---: |
| Existing registered identities, retained unchanged | 18,789 |
| Actual current identities | 47,674 |
| Current identities also present in the old inventory | 18,776 |
| New current candidates, still unregistered/unreviewed | 28,898 |
| Old identities absent from the current inputs, preserved | 13 |
| Provisional directory union, not the current corpus size | 47,687 |

The report has 501 source rows, retaining every former report source. Combined
with the separately existing Web source registry, this means 513 known sources,
of which 368 have no registered rule inventory. Only four are new to that Web
union; the larger Data row increase includes sources the Web registry already
knew. No percentages or whole-rule counts are increased by this refresh.

The directory retains 30 unresolved-identity observations, six conflict
observations and 178 files needing category review. These are discovery issues,
not supported mechanics or obsolete records to delete. The old registered
snapshot, source snapshots, choices and runtime resources are untouched.
The valid private current draft also retains one stale source-correction
observation: its 37 observations are a different ledger from this directory's
36 identity/conflict observations. This metadata export does not resolve or
discard that correction issue.

## Exact inputs and generation

The current cache has 469 inputs and 131,035,829 raw bytes, manifest SHA-256
`f8ded94ec3a948b9459afa2ef3ce6ddf93062fe9cf1509392c2a6790bac4f6ed`.
All raw pins were checked. The 459 catalog files and three indexes also matched
their exact Git blobs; the directory publishes 229 legacy and 459 current catalog
input references. The remaining Foundry/version files retain raw verification but
are not falsely labeled as part of the 462 Git-object comparison.

- Primary repository: `tjliqy/5etools-cn@774a320e4a92d71d100673bc0df965661d9e8c1b`.
- Homebrew repository: `tjliqy/homebrew-deploy@e225d226fdb6df4d22754f673e423cd5906ddc22`.
- Exact exporter: `bdda092bfb3e6cbd0383fd13fa6bb7b8602c18ca`.
- Rule source tree, unchanged: `a8a92331694094b7d446c673ae10c9c573caf07a`.
- Directory report SHA-256: `d8e7c518798fc53d8d8f6946073b02b92700db5e1802b8dd181affa4629bf49a`.

Run the committed owning exporter with private caches and new output paths:

```sh
node --experimental-strip-types scripts/export_current_source_discovery.ts \
  PRIVATE_LEGACY_CACHE PRIVATE_CURRENT_CACHE PRIVATE_GIT_OBJECT_PROOF \
  NEW_REPORT_JSON NEW_PROOF_JSON
```

The exporter verifies path containment, raw and canonical hashes, immutable Git
objects, exact producer scripts and the committed old snapshot before producing
metadata. Both outputs use exclusive creation. Independent verification also
compared the exact current identity set with the valid private 47,674-record draft,
confirmed the 13 preserved absences and checked the source union and zero credits.
Only safe proof summaries accompany the public report; no private cache, raw rule
body, character or secret is published.

## Validation and retained failures

The new metadata regressions initially had two failures and nine passes. The
complete focused suite now passes 16 cases, including declared source/document
aliases, sources without modeled entries, private-body exclusion, edition
separation, preserved old identities and duplicate-denominator rejection. Strict
checking covered the exporter scripts as well as the normal `src` project.

The first actual export stopped at a transport-name mismatch: a percent-encoded
cache filename was compared directly with a decoded Git member name. Every hash,
size and Git blob matched. The fix compares the logical URL path once while
retaining the literal private filesystem path, and encodes immutable retrieval
URLs per segment. Negative path/URL tests and all hash checks remain. The second
complete actual export and independent verification passed. The first export
failure and the initial external type-check configuration failure are retained;
no assertion, hash, type check or rule bound was weakened.

The first full Windows run retained 1,160 passes, 17 failures and 189 existing
conditional skips. Thirteen failures occur while creating file symlinks that
this Windows session does not permit. The other four exceeded their original
five-second limits while the suite ran concurrently. Running those same four
cases alone, with one worker and unchanged assertions and limits, passed all
four. This bounded diagnostic is not a claim that the full Windows suite is
green; the first complete failure log is preserved. No privilege or production
workflow change was made.

Full exact-commit CI and normal review/merge are still required. No website
publication or new rule acceptance follows from this document alone.
