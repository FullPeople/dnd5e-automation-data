# 2026-10-07 complete cached-input re-audit

The original 229-input cache was recovered locally, rather than re-downloaded. Every URL and canonical JSON SHA-256 matches the 0ac0520dae0a81ad15be0c53eac395d21a70230f runtime ledger. Physical cache bytes and the complete 18,789-identity inventory were also verified. Original cache index SHA-256: 654898faa8fd821e6dbc8dddbaa3914b287bcaef418512da6a4cfa7eca8d55f7. No input bodies are added to this public repository.

`scripts/audit_runtime_coverage.ts` was run over all recovered inputs against Web integration commit 2a8f52c009b4b4e38f2e630761fa997db72b0e5f (PR14 tool choices and PR15 spell icon fix, on the released 250 baseline). The generated report retains total 18,789, reviewed 4,561 and implemented 6,527. These are actual probe results, not copied counts. The 522 unavailable combined equipment variants remain explicit; they were already absent from the original consumer catalog.

The producer now includes `src/ui/Overview.tsx` among the observed UI modules. All 49 module hashes were calculated from real checkout bytes and compared with the declared Git blobs. The consumer byte verification patch supplied with Web PR14 is applied in full: CI verifies the pinned revision and actual module bytes before executing its real-function positive and negative probes. Neither the original input hashes nor the report validation rules were weakened.

Validation: complete audit, 229 original input checks, 49 actual consumer modules, eight real-function probe scenarios and six public-export regression tests. The test/build logs and cache inventory are retained in the isolated integration evidence directory. Source-only fixtures do not establish acceptance in a real Owlbear room or on a physical device.

Recovery: retain the preceding Data commit 9acd4d5e7c5bed9cf34150db4319a7aeec6751e8 and the Web runtime lock pointing to 0ac0520dae0a81ad15be0c53eac395d21a70230f. Revert this batch as a coordinated Data/Web change; an old ledger is intentionally rejected by the new consumer bytes until its matching Web source is restored.
