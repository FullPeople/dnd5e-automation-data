# Optional feature array quotas in Data IR

`optionalfeatureProgression[].progression` previously required a plain object.
The current source-declared AI and both EI progressions are arrays, so the Data
producer discarded their quotas with `optional-progression-shape`. The fix maps
complete 20-level arrays into one cumulative `choiceProgression` grant per group.
This is a producer capability change; it does not establish live player support.

## Baseline and evidence

Checked Data main `a701c0f692d827ee9f1bc8b683e68d18ae874bd2`, including merged
PR29. All 29 existing PRs were inspected; the only open PR was the unrelated
operations draft #5. No overlapping array-progression fix was present. This
checkout contains no `AGENTS.md` or `.agents/skills`; the workspace `.agents`
directory is empty. README and `docs/DERIVATION-RULES.md` supply the applicable
source immutability, cumulative quota and annotation boundaries.

Web main/reference `ad462dbca01ce861b855c9dacbcf1e11ad7caa29` already supports
array lookup at `level - 1` in
[sourceClassChoices.ts](https://github.com/FullPeople/DND-card-web/blob/ad462dbca01ce861b855c9dacbcf1e11ad7caa29/src/core/automation/sourceClassChoices.ts#L52).
Its
[classChoiceEvidence.json](https://github.com/FullPeople/DND-card-web/blob/ad462dbca01ce861b855c9dacbcf1e11ad7caa29/src/core/automation/classChoiceEvidence.json#L91)
contains matching 20-level AI, legacy EI and updated EI declarations. No Web
files, UI, ASI, dragging, releases or cancelled PR48 work are changed here.

On 2026-10-10 the following public source bytes were downloaded successfully
into ignored `.cache/optional-progression/`. Only hashes and structural pointers
are recorded here; no source bodies or progression tables are committed.

| Current fetched source | Bytes | SHA-256 |
| --- | ---: | --- |
| [class-artificer.json](https://5e.kiwee.top/data/class/class-artificer.json) | 165289 | `fe4f539a8ccfce0253eced67ba942b76ee0e641a31fce752a27cba19066e7182` |
| [class-warlock.json](https://5e.kiwee.top/data/class/class-warlock.json) | 166421 | `9f4fe85732ff89191c40cd8ced28f0fe8b62f0c13e4be5c998205cbda14328d3` |

Artificer TCE `/class/0/optionalfeatureProgression/0/progression`, Warlock PHB
`/class/0/optionalfeatureProgression/0/progression`, and Warlock XPHB
`/class/1/optionalfeatureProgression/0/progression` are all dense 20-item numeric
arrays. Each matches the corresponding pinned Web evidence array, element for
element. The PHB pact-boon group's object progression remains a separate group.
The current EFA class at Artificer `/class/1` has no
`optionalfeatureProgression` field; nothing is inferred for it.

These current file hashes differ from the existing runtime ledger's Artificer
`c65cad57eebdfff6508a0cfb821ec670a41cc3f057512cadd19f3805cf1a01d7` and Warlock
`34721a04db792923cf0a19fbab3f90616093d9f6519a7cfe6f81a9eb52e775d4` input hashes.
This work checks the retrieved structures; it does not claim a replay of the
original 229 locked inputs. Runtime reports, source locks, review receipts,
denominators and reviewed/implemented counts remain unchanged.

The [official legacy Warlock table](https://www.dndbeyond.com/classes/7-warlock)
and [2024 Warlock table](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes#Warlock)
confirm the distinct invocation totals by class level. The
[official Artificer guide](https://www.dndbeyond.com/posts/854-artificer-101-a-beginners-guide-to-making-magical)
confirms the initial distinction between learned infusions and simultaneously
infused items. The complete AI progression is handled as a source declaration,
without promoting the entire feature to a reviewed or executable rule.

## Mapping and limits

Array index zero maps to class level one. Values are total quotas, never
incremental grants: the first positive point sets `atLevel` and `choose.count`,
and all 20 points remain in the single grant's `choiceProgression`. Zero quotas
remain explicit. An all-zero array emits no grant.

Only arrays of exactly 20 safe integer counts from 0 through 100 are accepted.
Array iteration visits holes as undefined; one invalid member rejects that whole
group. Empty, short, longer, mixed-type and otherwise invalid progressions retain
`optional-progression-shape`, while other valid groups retain their original
index-based keys. Short arrays remain unsupported because sparse IR would carry
their final value beyond the source's declared endpoint. Existing object and
`*` mappings are unchanged. No schema or consumer changes are required.

Input snapshots are not mutated. No class-name branching, inferred EFA plans,
item creation, infusion activation, prerequisites, replacement permissions,
resource recovery or character edits are added. Corpus output remains
`needsAnnotation`; unknown mechanisms retain their existing gaps.
`generate-automation.mjs` is regenerated from source so the checked-in standalone
producer has the same behavior, with only a five-line generated diff.

## Validation and rollback

The initial 22 synthetic regressions were run before the source edit: 7 failed
and 15 passed. After the edit they all passed. The final suite also covers an EFA
class without a progression and compares actual output from the source-built
and checked-in standalone generators. Synthetic quotas are original test data.

- `npm test`: 353 Vitest tests passed; 11 historical real-data equivalence tests
  explicitly skipped because the original locked corpus/baseline are absent;
  all 14 Node tests passed.
- `npm run build`: passed on Node 24.19.0.
- `python3 -B -m unittest discover -s scripts -p test_export_progress_status.py -v`:
  all 6 public export regressions passed.
- Existing audit consumer `995583a1fa90c909ac2895f368a954299171c958`: all 63
  committed/working module bytes verified; all 8 real-consumer probe scenarios
  passed. These validate the unchanged report, not new runtime coverage.
- Direct current-source AI/EI derivation produced one 20-point quota per array;
  the PHB object-based group retained its existing separate quota.

Revert the single commit on this PR branch to restore the previous TypeScript
producer and standalone bundle together. If its output is adopted in a later
reviewed release, regenerate from the restored producer and restore that
release's artifact pin through its own review process. This PR is for draft
review only: no merge, deployment, credentials or security permission changes.
