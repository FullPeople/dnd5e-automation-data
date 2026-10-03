# G4 locked Foundry mechanism subsets

Fixture-only authorization: this directory contains **8 raw input records** in four JSON arrays. All six locked Kiwee Foundry files were read. Mapping decisions remain with the main agent and the existing `src/derive/foundry/mapping-table.json`; no routes, expected verdicts, protocol artifacts or synthetic mechanics are added here.

Only present original identity metadata (`ENG_name`, `source`, parent identity/source fields and level), migrationVersion, selected mechanism fields and actual ignore markers are copied. Values and primitive types are unchanged. Omission never means an empty string, null, false or a fabricated default. No source `name`, `description`, `entries`, `displayName`, prose condition, translated body, or advancement title is copied into JSON. Present nested ENG_name fields are identity metadata, not replacements for removed names.

Short CJK parent identities and mechanism tokens remain exact input values: e.g. className, healing types, duration units, recovery period, spell UUID/components. They are fixture-only resolver input and **must not enter emitted artifacts**. They are not translated or normalized here.

## Source lock

Paths are relative to `/workspace/dnd5e-automation-data/.cache/upstream/kiwee/`; pointers use RFC 6901 with zero-based indices. SHA-256 hashes cover the **entire original file bytes**, not a row or projection. All six file hashes and byte counts match `.cache/upstream/inputs-sha256.json` (namespace `kiwee`, role `foundry`).

| Original file | File SHA-256 | Bytes |
| --- | --- | --- |
| `data/class/foundry.json` | `1894f7d8230b91e44ff055e8fa28186c1f97d392bebde09fbd8e17ed88f65340` | 574619 |
| `data/foundry-feats.json` | `13f5a2cd1256424b6ff08bd65cc6c6c933a5a469b4bfd8899fcbf1ccaf2ca9cc` | 100853 |
| `data/foundry-items.json` | `724d52fe0112bf180051f9f30284b7b74c4cfcde4157d5fd7fb49320a255e35c` | 479956 |
| `data/foundry-optionalfeatures.json` | `97b875c82fb482bedbf740fe4cb877600e160743de884edfed26a5444f975a20` | 117018 |
| `data/foundry-races.json` | `76a9c06e32c42882ddbad41faaed7149a2daa42930704cce0473579340eceba4` | 87753 |
| `data/spells/foundry.json` | `1b95d55564641c665c02132293a47da28665e610ce58416b2c704f6938980071` | 465226 |

## Per-record provenance and boundaries

`kind` is supplied by the original collection for a caller; it is not inserted into the raw JSON. Every row includes the original ENG_name/source and migrationVersion. Parent metadata is copied only when present. Array projections select existing entries in original order; their indices may be compacted as explicitly listed below.

| Fixture pointer | Kind | Original file + JSON pointer | File SHA-256 | Retained fields / limits |
| --- | --- | --- | --- | --- |
| `effects.json#/0` | `feat` | `data/foundry-feats.json#/feat/22` | `13f5a2cd1256424b6ff08bd65cc6c6c933a5a469b4bfd8899fcbf1ccaf2ca9cc` | `effects[0].disabled/transfer/changes`, both ignoreSrd markers. All 11 original `system.traits.dr.value` changes retained. Source effect 0 has no name; effect 1 and all activities omitted. `disabled:true` is real and must not be treated as an enabled passive defense. |
| `effects.json#/1` | `optionalfeature` | `data/foundry-optionalfeatures.json#/optionalfeature/45` | `97b875c82fb482bedbf740fe4cb877600e160743de884edfed26a5444f975a20` | `effects[0].ENG_name/type/foundryId/changes`, `effects[1].ENG_name/transfer/changes`. Source effect 0 keeps only changes[1] key/mode; its value is omitted. Both effects.name removed. Effect 1 keeps real ci `surprised` and initiativeAdv value string `"true"`. System, enchant activity, name mutation, attunement/property changes omitted; no unconditional grant or complete enchantment linkage is established. |
| `scales.json#/0` | `class` | `data/class/foundry.json#/class/1` | `1894f7d8230b91e44ff055e8fa28186c1f97d392bebde09fbd8e17ed88f65340` | Both real `advancement` ScaleValue configurations, identifiers and complete number level tables retained. Both advancement.title fields removed. No scales or identifiers added. |
| `scales.json#/1` | `race` | `data/foundry-races.json#/race/0` | `76a9c06e32c42882ddbad41faaed7149a2daa42930704cce0473579340eceba4` | Complete `advancement` ScaleValue dice table and identifier `breath`, both ignoreSrd markers. Original level key `"0"` retained; no level-1 rewrite. No race-feature catalogue or breath activity included. |
| `activities.json#/0` | `classFeature` | `data/class/foundry.json#/classFeature/27` | `1894f7d8230b91e44ff055e8fa28186c1f97d392bebde09fbd8e17ed88f65340` | `activities[0].type/activation/consumption/target`, original system keys `uses.max` and `uses.recovery`. The max formula `@prof` and lr recovery remain in the actual dotted-key shape. Original bonus activation value integer 1; consume value string `"1"`. Source activation.condition is absent. Activity effect link and top-level effects omitted; resource/linked-effect execution is not proved. |
| `activities.json#/1` | `spell` | `data/spells/foundry.json#/spell/12` | `1b95d55564641c665c02132293a47da28665e610ce58416b2c704f6938980071` | Source activities[1] only: `ENG_name/type/activation/consumption/healing`, including hitDice target d6, original formulas/scaling and short healing type token. Source activation.condition is absent. Other activities, other hit-die alternatives and catalogue omitted; no dice expenditure or healing settlement asserted. |
| `activities.json#/2` | `item` | `data/foundry-items.json#/item/31` | `724d52fe0112bf180051f9f30284b7b74c4cfcde4157d5fd7fb49320a255e35c` | Source activities[1] and effects[0]: cast, activation, duration, consumption, activity uses/recovery and spell metadata; full effect changes include ci charmed/frightened and numeric blindsight 30. Effect has transfer:true and no duration in the original. Nonempty activation.condition, effects[0].name and effects[0].description removed; activity 0 and broader item context omitted. This sample cannot prove an unconditional cast or unconditional ownership/equipping benefit. |
| `markers.json#/0` | `classFeature` | `data/class/foundry.json#/classFeature/11` | `1894f7d8230b91e44ff055e8fa28186c1f97d392bebde09fbd8e17ed88f65340` | Only actual identity fields, `isIgnored:true` and migrationVersion. Original row has no mechanism payload. Marker presence is not automation coverage. |

## Nested selection pointers

- `effects.json#/0/effects/0` comes from `data/foundry-feats.json#/feat/22/effects/0`. Its changes array is complete; source effect 1 is excluded.
- `effects.json#/1/effects/0/changes/0` comes from `data/foundry-optionalfeatures.json#/optionalfeature/45/effects/0/changes/1`. Only this change is selected from source effect 0. Source changes[0] (name mutation), changes[2] (attunement) and changes[3] (property) are excluded. `effects.json#/1/effects/1` comes from the same row effects[1], with its complete changes array.
- `scales.json#/0/advancement` comes from `data/class/foundry.json#/class/1/advancement`; both entries and complete scale tables remain in original order. `scales.json#/1/advancement` comes from `data/foundry-races.json#/race/0/advancement`; its single entry and complete table remain.
- `activities.json#/0/activities/0` comes from `data/class/foundry.json#/classFeature/27/activities/0`. `activities.json#/0/system/uses.max` and `activities.json#/0/system/uses.recovery` come from original `/classFeature/27/system/uses.max` and `/classFeature/27/system/uses.recovery`. The literal dots are part of the original keys; no nested uses object is substituted.
- `activities.json#/1/activities/0` comes from `data/spells/foundry.json#/spell/12/activities/1`; source activities[0,2,3,4] are excluded. Consumption target and healing fields preserve their original nesting and types.
- `activities.json#/2/activities/0` comes from `data/foundry-items.json#/item/31/activities/1`; source activity 0 is excluded. Its effect comes from `/item/31/effects/0`; the entire changes array remains.

## Prose omissions and interpretation risks

- Every selected row name is removed. `effects.name` is specifically removed at original `/optionalfeature/45/effects/0/name`, `/optionalfeature/45/effects/1/name` and `/item/31/effects/0/name`. Boon of the Night Spirit effect 0 has no name in the original; its named effect 1 is wholly excluded. Effect names can carry meaning or linkage: this subset does not recover that context from ENG_name.
- Nonempty original `data/foundry-items.json#/item/31/activities/1/activation/condition` is removed. The remaining `activation.type:"special"` **cannot prove an unconditional activity**. The selected Nature's Veil and Arcane Vigor source activations have no condition field, but these partial records still cannot prove unconditional operation or absence of constraints elsewhere. No blank condition is fabricated. Source `data/foundry-items.json#/item/31/effects/0/description` is also removed.
- **value omitted**: `effects.json#/1/effects/0/changes/0` preserves the original `key:system.description.value` and `mode:ADD` only. The original value is present and contains body text; it is deliberately absent from this fixture. This is an incomplete metadata-change sentinel, **not a real complete change input**, and cannot demonstrate handling, validation or rejection of that original value. No valueOmitted field or substitute value is invented in raw JSON.
- `scales.json#/0/advancement[0,1].title` is removed. No English title or missing identifier is invented. IgnoreSrd flags and isIgnored stay booleans and do not grant any mechanics.
- `transfer:true` and absent duration are preserved where actually present. Disabled effects, spell availability, resource dependencies, enchantment/equipping/attunement requirements, condition gates and full mechanics are not inferred from these subsets. Damage/condition immunities, defense settlement, casting, healing and consumption are not executed here.
- Damage resistance and condition immunity effect keys are represented. Damage immunity/vulnerability, other ScaleValue types, broader activities, full catalogue resolution, and the main agent's mapping/coverage decisions remain outside these fixtures.

## Validation boundary

Read-only checks passed against the written fixtures: six source SHA-256/byte locks; eight original row identities; 161 exact primitive leaves and types against the source pointers; original order and declared nested selections; recursive prose-key exclusion; actual disabled/transfer/ignore values; both number/dice ScaleValue shapes; utility/heal/cast with real consumption targets; original dotted system keys; body value omitted and nonempty activation condition omitted. This establishes faithful field subsets only, not G4 mapping completion or complete-input validity.

Only files under `fixtures/g4/` are created. No implementation, schema, test, package, external documentation, source cache, git index or commit is changed by this fixture work.
