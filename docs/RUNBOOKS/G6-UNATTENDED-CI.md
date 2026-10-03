# Unattended pipeline receipt — 2026-10-03

Data commit `c1a681f250e2cb8d7e65a5bbf08c74c352be03df` was published through
exact Git object API writes, retaining the original history and using no forced
reference updates. Its ordinary push workflow `37143245194` passed.

Manual-dispatch workflow [37143328276](https://github.com/FullPeople/dnd5e-automation-data/actions/runs/37143328276)
also passed both jobs. It installed dependencies, built, fetched all real inputs,
derived, applied accepted reviews, validated the full artifact and uploaded only
the six mechanical outputs. The raw log reports:

```text
Tests 298 passed | 11 skipped (309)
# pass 14
# fail 0
{"phase":"G6-overlay-review","records":18789,"core":6396,"coreNeedsAnnotation":6305,"acceptedReviews":91,"staleReviews":0}
{"valid":true,"file":"/home/runner/work/dnd5e-automation-data/dnd5e-automation-data/artifacts/automation.json"}
```

The eleven skipped tests are external equivalence-oracle tests: this clean
runner has no Web checkout or private locked corpus. The local corpus-enabled
Node 22 and 24 runs passed all 309 without skips, plus 14 Node tests. The strict
CI build passed. The uploaded asset is
`automation-ir-c1a681f250e2cb8d7e65a5bbf08c74c352be03df` (2,173,505 bytes).
No raw upstream cache or player file is uploaded.

Local post-commit Node 22 and 24 replays produced byte-identical automation,
coverage JSON/Markdown, gaps, diff and input manifests; exact SHA/size receipts
are retained in private evidence. Full automation JSON is 25,690,946 bytes,
SHA-256 `a24dabe6b8c5cbfb8ea2dfb12765054e7488ea9a75ac22101ac405cb11112035`.

The unattended command requirement is verified. G6 coverage is still pending;
CI success does not substitute for completing source annotation. Roll back
individual PHB batch commits together with their receipts, then rerun the same
pipeline against the locked upstream version. The Web default data is updated
only after later coverage and regression checks.
