# Player progress statistics

The player count is separate from the IR whole-rule `automated` verdict. Count
one canonical identity when the current Web consumer actually calculates a
sheet value, attack formula, resource maximum, resolved spell grant, or accepts
an available source-declared choice. Its other effects can still be manual.
Display-only text, weight/currency metadata, unconsumed IR payloads and the 162
historical complete flags cannot supply a positive observation.

`reports/progress/runtime-coverage.json` records each observed result, the exact
consumer revision and imported module hashes, existing input URLs/hashes, and
the original review snapshot hash. Each identity is counted once, preserving
source namespace, parent identity, level and edition. Source percentages use
all the source's canonical inventory entries as their denominator.

The initial audit reused the existing disposable public browser cache; no new
publisher export was run and no player documents were read. Its merged identity
inventory matched all 18,789 existing records. Web's actual per-file loader
produced 18,267 of those identities. The remaining 522 include cross-book
variants generated only by the producer's combined corpus and cannot establish
current Web implementation. Unknown metadata remains in the original snapshot.

Reproduce with existing inputs, without fetching or executing IR:

```sh
node --experimental-strip-types scripts/audit_runtime_coverage.ts \
  /path/to/pinned-web /path/to/existing-public-cache reports/progress/runtime-coverage.json
```

The audit calls the pinned consumer's real functions on disposable cards. It
tests valid parent contexts, declared source/edition, worn/attuned equipment,
saved usable choices and supported level gates. Manual training is a qualifying
context for equipped items; training-grant observations additionally compare
cards without manual overrides. No runtime code or player state is changed.
The count covers the observed supported behavior and does not certify complete
semantics, encounter settlement, or every possible condition of each rule.

CI runs the six existing Python export regressions, validates the whole public
ledger and source aggregates, and runs seven positive/negative scenarios against
the exact pinned consumer code. CI does not claim to replay the private cache.
The Web build must match every audited consumer module hash and verify the
committed Data blob before displaying the new count.
