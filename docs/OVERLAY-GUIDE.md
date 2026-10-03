# Reviewed overlays

Run `npm run pipeline` for fetch → structured and Foundry derivation → reviewed
overlay application → strict validation → coverage, gaps and diff. Replay locked
inputs with `npm run pipeline -- --offline --out .cache/replay`.
Use `--previous PATH/automation.json` for a concrete diff, and
`--require-core-complete` before publishing a core-complete release.

Contributions live in `overlay/<kind>/<SOURCE>-<batch>.json`. Each batch contains
at most fifty records, each with canonical identity, final verdict, reviewer,
real review date and page evidence. Optional English quotes contain at most
fifteen words. Raw upstream bodies stay in private ignored cache; public overlays
contain mechanisms, enum facts and references only. Uncertainty remains the
automatically generated `needsAnnotation` record, not a fabricated contribution.

`mechanics` is a complete reviewed replacement. Preserve supported facts and
remove unsupported or incorrectly unconditional candidate behavior. Changing a
derived mechanism or gap requires `overrides` for every affected structured or
Foundry layer and an English `overrideReason`. Unsupported settlement or effect
execution remains explicitly deferred and cannot count as automated.
`noMechanics` needs a genuine allowed reason and no operative mechanisms or gaps.
Identity and edition remain the catalogue's identity and edition.

The main reviewer samples ten distinct records from every batch (all records
when a final batch has fewer than ten). Any error in number, recovery period,
target, condition or choice count rejects the whole batch. Correct and review
again before adding an accepted receipt to `overlay/reviews.json`:

```json
{
  "schemaVersion": 1,
  "batch": "example-001",
  "path": "feat/PHB-example-001.json",
  "sha256": "<exact SHA-256 of the reviewed file bytes>",
  "inputLock": "<inputLock(versionLock) from src/overlay/index.ts>",
  "reviewedBy": "model:<main reviewer>",
  "reviewedAt": "2026-10-03",
  "sampleKeys": ["<each sampled canonical identity>"],
  "mechanicErrors": 0,
  "decision": "accepted"
}
```

The receipt hash prevents subsequent edits from silently retaining approval.
Its lock binds upstream version, date, Foundry migration versions and every
input SHA/size/role. Changed upstream inputs invalidate review and produce
visible `overlayReview` gaps on the current derivation. A changed fetch timestamp
alone does not invalidate identical inputs. Even stale contributions must pass
intrinsic schema, identity, formula, evidence and forbidden-prose checks.
Duplicate identities across active or stale batches are rejected.

Final version locks additionally include exact bytes/SHA for every overlay file
and the review index, with Git source references. These use reserved input
namespace `automation-overlay`; `inputLock()` excludes that namespace to avoid
a self-referential review lock. Drafts made before commit are unpublished;
regenerate after commit before releasing artifacts so Git references identify
the files that actually exist in that commit.

Pipeline publication stages all outputs, validates the complete reference graph,
and replaces the output directory only when every required check succeeds.
The preceding generated directory remains at `<out>.previous` for rollback.
Version locks accompany the automation envelope, coverage JSON/Markdown, gaps,
diff and input manifest. CI can run the whole pipeline unattended on manual
dispatch or the weekly schedule; generated assets contain no raw inputs.

Sample findings and batch acceptance are recorded under `docs/REVIEWS/` before
commit. Intermediate proposals in `.cache/g6/proposals/` are not accepted
overlays and do not reduce production needsAnnotation counts. Commit batches
separately so their source, review and rollback boundaries remain inspectable.
