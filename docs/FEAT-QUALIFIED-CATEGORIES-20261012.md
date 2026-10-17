# Qualified feat category follow-up on PR31

## Increment and fixed source

PR31's original ASCII identifier check rejected the legal `FS:P` and `FS:R`
tokens. A mixed `FS` plus qualified category group was therefore rejected in
full, including its generic style options. This follow-up permits exactly those
two additional tokens; it does not accept arbitrary colon-qualified categories.
Quota, namespace, version and candidate-list checks remain unchanged. Every
positive quota still has `feat-progression-eligibility` and remains an annotation
draft, with no prerequisite interpretation or player mutation.

The upstream [5etools source package](https://github.com/5etools-mirror-3/5etools-src/blob/8c026b807fac21862a309379a0c3228a0683198b/package.json)
at `8c026b807fac21862a309379a0c3228a0683198b` declares `5etools-utils ^0.17.20`.
We inspected the exact published
[5etools-utils 0.17.20 archive](https://registry.npmjs.org/5etools-utils/-/5etools-utils-0.17.20.tgz),
without installing it into this project or executing its code. The npm metadata
reports source git head `28a9b29c077c2923ce6296bf9ee8825cc57672b1`; archive
integrity was independently checked against:

- SHA-512 integrity: `sha512-t3GCz00dyou163NpvddNdlHBMswdbvydaWZgd/JSE1UH5vWFFi+vtGlBNMQE8U/CpJKFWtdAJk8ZAI5YqvA3ig==`.
- Archive SHA-256: `e5c5fc20f41ccf937bcbbc7557eb90802b071cb7a18d648c3152ad35fabc5aa9`;
  506068 bytes.

`schema/site/class/class.json` references `util.json`'s `featProgression`;
`schema/site/util.json` at
`/$defs/featProgression/items/properties/category/items` references
`/$defs/dataFeatCategory`. That enum contains only `FS:P` and `FS:R` as
qualified feat categories. `FS:F`, `FS:B` and `MV:B` occur in a different
optionalfeature-type enum, and are deliberately rejected by this feat mapper.
Existing bounded unqualified identifiers retain their original behavior.

## Actual rule structure and retained unknowns

Current public source bytes retrieved on 2026-10-12 into ignored cache:

| Source | Bytes | SHA-256 |
| --- | ---: | --- |
| [class-paladin.json](https://5e.kiwee.top/data/class/class-paladin.json) | 168186 | `da5e432ee7492b92d81ce32080355dab35ed4a69425c638691cc37a219597c51` |
| [class-ranger.json](https://5e.kiwee.top/data/class/class-ranger.json) | 152703 | `8e9bcffae0154e54527350bb9d6d1e1318ce6ece429a870454d62ef4913f75f7` |
| [feats.json](https://5e.kiwee.top/data/feats.json) | 426735 | `6712bbf38c5955415aa2b0b155d9ecbd13d8e1914d0a8f212ce44cce13866fbc` |

Both class declarations use `/class/1/featProgression/0`. Their groups explicitly
contain `FS` plus `FS:P` or `FS:R`, respectively, and one quota at class level 2.
The [official 2024 Paladin and Ranger rules](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes#Paladin)
confirm the Fighting Style choice and their distinct cantrip alternatives; the
[official feat chapter](https://www.dndbeyond.com/sources/dnd/br-2024/feats#FightingStyleFeats)
also retains prerequisite requirements. These establish the source meaning,
not complete qualification, replacement permission, cantrip execution or effects.

Each source declaration now yields its level-2, count-1 draft with 11 current
same-edition source identities, plus the unchanged level-19 quota. Eligibility
remains explicitly unresolved. No rule text, source snapshot or private review
material is committed. No existing tag format, overlay, consumer or publication
pin is changed by the category fix.

## Baseline, compatibility and validation

Intake confirmed PR31 still at `42fa92e51ccdebe4300dd34c94806d18a6c1f8a9`,
without other commits, reviews, assigned work or competing field changes. Data
main was `7bb44c25527b107c26fb7c56446399c1bc974e6a`. The normal baseline merge
`10d3e8783a35bf7ea6b5ec3661d9d252315a9b45` preserves PR31's existing history.
Its runtime report Git blob is exactly main's
`7ff29a858bdc9f2d7d1ac59ea63a2b851e42f3aa`, binding Web consumer
`63ea4b240bb662417b51a1d42d6c9168b4f10845` and 68 modules. The unmerged
`436ea9fcc1b09c485b72a3b1935de7b7ee71f6b3` ledger was not adopted. Counts remain
18789 identities, 4561 reviewed and 6535 partial implementation witnesses.

- Before the predicate edit, focused tests failed: 4 red and 50 passed. After
  the edit and standalone bundle rebuild, all 54 passed. New cases prove both
  exact legal tokens, rejection even when invalid categories have matching
  catalogue rows, edition filtering and the public annotation boundary.
- PR31 plus current main: 380 Vitest and 14 Node tests, the type build and all
  6 Python export regressions passed.
- In a separate detached worktree, PR30 `b11cd828e5a4e5a85776bc243354a7e37599c677`
  was combined with PR31/current main and this category patch. The sole merge
  conflict was the appended generator tests. Both complete tests were retained,
  with each one's output-comparison tail; the bundle was rebuilt. No product
  source conflict required a new behavior change.
- Local-only rehearsal `521ca29d961b2e0361cfad06129a0c46127a7a64`: 404 Vitest and
  14 Node tests, type build and 6 Python regressions passed. A focused actual
  source matrix checked two style declarations and all three complete AI/EI
  arrays. The rehearsal was not pushed or merged to main.
- Both trees retain the same report blob and pass all 68 consumer-byte checks
  and 8 real-consumer probes for the existing audit.

Both suites explicitly skip the same 11 historical equivalence tests because
the original locked corpus/baseline is unavailable. This work is not a replay
of the original 229 inputs or proof of complete rules, current live support or
production deployment. PR30 remains an unchanged draft. Web #61 and cancelled
#48 are untouched. No coverage numbers were manually increased or rewritten.

## Rollback and next step

Revert only the category follow-up commit to undo this increment. Keep the
baseline merge and its existing audit report. The follow-up includes the tiny
source predicate, regenerated bundle, authored regressions and this receipt;
there are no player-data or published-artifact migrations to undo. Review PR31
as a partial Data capability. Any future PR30/31 integration must retain both
generator regressions, and full eligibility or consumer adoption needs separate
evidence. Exact HEAD push CI is recorded separately from PR merge-checkout CI.
