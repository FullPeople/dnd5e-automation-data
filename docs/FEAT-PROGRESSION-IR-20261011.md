# Source-declared level feat quotas remain annotation drafts

## Defect and scope

Data main `a701c0f692d827ee9f1bc8b683e68d18ae874bd2` silently omitted
`featProgression`: the field was absent from `STRUCTURED_FIELDS` and the
structured class producer. For a source projection containing only this field,
both current XPHB Warlock and EFA Artificer returned empty mechanics, no gap and
no handled field. An isolated inventory classified that declaration as prose.

Web main `1170c63389b885cace059f6044fa2dc2c6454116` already reads it in
[sourceClassChoices.ts](https://github.com/FullPeople/DND-card-web/blob/1170c63389b885cace059f6044fa2dc2c6454116/src/core/automation/sourceClassChoices.ts#L136).
Merged Web #17 and later class-choice work are not reimplemented. Open Web #55
concerns subclass spell lists; cancelled #48 is untouched. Data's open PRs at
intake were #30 (optional array quotas) and #5 (operations), neither overlapping
this field. Remote branch names and open issues showed no competing work.

This branch starts from main, not PR30. Its array-progression patch is not
included or modified, and neither draft's output is described as live support.
Data has no `AGENTS.md` or `.agents/skills`; workspace `.agents` is empty. README,
the protocol and derivation rules supply the source/annotation boundaries.

## Public source evidence

Retrieved on 2026-10-11 into ignored `.cache/feat-progression/`:

| Source | Bytes | SHA-256 |
| --- | ---: | --- |
| [class-warlock.json](https://5e.kiwee.top/data/class/class-warlock.json) | 166421 | `9f4fe85732ff89191c40cd8ced28f0fe8b62f0c13e4be5c998205cbda14328d3` |
| [class-artificer.json](https://5e.kiwee.top/data/class/class-artificer.json) | 165289 | `fe4f539a8ccfce0253eced67ba942b76ee0e641a31fce752a27cba19066e7182` |
| [feats.json](https://5e.kiwee.top/data/feats.json) | 426735 | `6712bbf38c5955415aa2b0b155d9ecbd13d8e1914d0a8f212ce44cce13866fbc` |

Both class files contain a group at `/class/1/featProgression/0`, with explicit
`category` and object `progression` fields. Catalogue normalization proves both
owners' 2024 editions; EFA explicitly carries `edition: one`, so its edition is
not guessed from its class or source name. Each declaration identifies one feat
quota at class level 19. The current feat catalogue provides 12 distinct
same-namespace, same-edition identities matching the declared category.

The [official 2024 Warlock rule](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes#Warlock)
allows a qualifying alternative outside the Epic Boon category. Consequently,
the source category does not establish the full eligible pool or prerequisites.
Every emitted positive quota retains `feat-progression-eligibility`. The EFA
declaration is only source evidence here, not an independently complete rule
review or an executable ability.

All three current hashes differ from the historic runtime ledger's corresponding
input hashes. Only this focused current-source structure was exercised; the
original 229 locked inputs were not replayed. No source bodies, rule text or
private review material are committed.

## Mapping and rejection boundaries

The field is registered for inventory and explicit diagnostics. Class/subclass
groups with recognized metadata, identifier-only categories, canonical integer
level keys 1 through 20 and safe integer counts 0 through 100 can declare
independent grants. A quota at a later level is another grant, not a running
total or a replacement for the previous one. Zero counts emit no grant.

The existing protocol has no feat-category filter. This producer uses its
existing finite `choose.from` identities instead: candidates must be feats in
the owner's namespace, match a source-declared category, and have the same
proven edition (or an explicit both-edition candidate). Keys are deduplicated
and sorted; each level owns its own option array. These lists preserve only the
source-declared subset, with eligibility visibly unresolved.

Unknown shapes or group conditions reject the whole group with
`feat-progression-shape`; unrelated valid groups retain their original keys.
An unknown owner edition yields `feat-progression-edition`. An absent, oversized
or insufficient candidate pool yields `feat-progression-catalogue`. Neither
path emits partial grants. No category, edition, prerequisite or rule behavior
is inferred from names or prose. Existing `feats` and optional object/`*` quotas
retain their previous behavior.

Corpus records stay `needsAnnotation` and keep their explicit gaps. The
standalone generator is rebuilt from source and compared against the checked-in
bundle by actual output. Protocol/schema, overlays, reviewed/implemented counts,
runtime reports, artifact pins, Web code and player state remain unchanged.
No ASI attribute mutation, infusion activation, invocation effect, merge,
deployment, credential creation or permission change is included.

## Validation and rollback

The final 34 original synthetic regressions failed against the original main
producer/manifest before being rerun against the fix: 34 red, then 34 green.
The compiled source and stale checked-in generator also differed before the
bundle rebuild; after it, all 38 focused tests passed. Tests cover independent
level quotas, invalid shapes/counts/keys, group isolation, edition/namespace and
catalogue limits, immutability, existing quota semantics, inventory recognition
and public validation of the annotation draft.

- Full `npm test`: 364 Vitest and 14 Node tests passed; 11 historical real-data
  equivalence tests explicitly skipped because their locked corpus/baseline
  are unavailable here.
- TypeScript build and all 6 Python public export regressions passed on Node
  24.19.0.
- Existing audit consumer `995583a1fa90c909ac2895f368a954299171c958`: all 63
  module bytes verified, and all 8 real-consumer probes passed. These check the
  unchanged audit, not new live coverage.
- Direct current-source derivation of the two declarations produced the
  expected level quota, finite source subset and retained eligibility gap;
  catalogue normalization reported no identity diagnostics for these inputs.

Revert this PR's single commit to restore the producer, field registration and
standalone bundle together. There is no published artifact or player-data
migration to undo. Next is independent review of this partial Data capability;
full eligibility review and any consumer adoption require their own evidence.
Record push CI for the exact branch HEAD separately from PR CI, which checks a
synthetic merge checkout.
