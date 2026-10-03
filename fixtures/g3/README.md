# G3 locked real mechanism subsets

Authorization: `/workspace/dnd-automation-web/docs/AUTOMATION-EXECUTION-PLAN.md` §4.5 / G3 plus the fixture-only delegation. This directory contains input snapshots; no protocol records, expected verdicts or equivalence assertions are generated here.

Each family JSON is an array of raw input objects. There are **16 mechanism samples**, 1–3 per listed family, and **4 identity-alias metadata rows**, **20 rows total** (aliases and repeated source rows counted). `identity-aliases.json` is resolver metadata, not a further mechanism family.

Only present upstream identity fields `ENG_name/source/className/classSource/subclassShortName/subclassSource/level` and selected mechanism fields are copied. No `name`, `displayName`, `entries`, `additionalEntries`, `description`, page evidence or prose is present in any JSON. Values are copied without changing primitive types, array order, formulas, translated mechanism tokens, UID spellings or source codes. Dropped members are omissions, never English replacements.

Translated class/weapon/damage/recharge/UID tokens belong to these test inputs only. They must resolve through supported catalogue/token mappings or stay explicitly unsupported; they must not be copied into public automation artifacts. No English spell, weapon, damage or recovery value has been guessed.

## Source lock

Original paths below are relative to `/workspace/dnd5e-automation-data/.cache/upstream/kiwee/`. Pointers are RFC 6901. SHA-256 values hash the **entire original file bytes**, not the subsets. All 9 referenced input files match namespace `kiwee` SHA-256 **and byte count** in `.cache/upstream/inputs-sha256.json`. Each sample and alias below includes its file hash.

## Mechanism samples

`kind` in this table supplies the catalogue kind when constructing Material records; it is not added to raw inputs. Array indices are zero-based. Identity metadata is present when the original row has it.

| Fixture pointer | Kind | Original file + JSON pointer | File SHA-256 | Real fields / payload boundary |
| --- | --- | --- | --- | --- |
| `abilities.json#/0` | `race` | `data/races.json#/race/33` | `d60b2cde3733e363aa4d1bd0bb8465d79213d247948ff46561d883fc55c00df7` | `ability`. Fixed con +2; other racial mechanisms excluded. |
| `abilities.json#/1` | `background` | `data/backgrounds.json#/background/2` | `8f5b5c44ced42e9fce5e2cf4cba251a015e920eb4418fd51c0dc1a6844e4d9d2` | `ability`. Two real weighted alternatives [2,1] and [1,1,1]; no allocation preselected. |
| `proficiencies.json#/0` | `background` | `data/backgrounds.json#/background/1` | `8f5b5c44ced42e9fce5e2cf4cba251a015e920eb4418fd51c0dc1a6844e4d9d2` | `skillProficiencies, languageProficiencies`. Fixed insight/religion and the actual anyStandard:2 language shape; language catalogue omitted. |
| `proficiencies.json#/1` | `class` | `data/class/class-fighter.json#/class/1` | `da2d63f3d4eb692db32f22b081dafecbc08394f27fbaeff7a51503824aefd1e0` | `proficiency, startingProficiencies, multiclassing`. Fighter XPHB saving throws, skill choice count 2, armor scopes, translated weapon tokens; no class-table or equipment payload. |
| `traits.json#/0` | `race` | `data/races.json#/race/33` | `d60b2cde3733e363aa4d1bd0bb8465d79213d247948ff46561d883fc55c00df7` | `size, speed, darkvision, resist`. M size, numeric walk 25, darkvision 60 and original translated poison token; no narrative defenses. |
| `resources.json#/0` | `subclassFeature` | `data/class/foundry.json#/subclassFeature/292` | `1894f7d8230b91e44ff055e8fa28186c1f97d392bebde09fbd8e17ed88f65340` | `entryData.resources, system.uses, system.recovery`. Only entryData.resources (nested name omitted) and system.uses/system.recovery; uses.max is the real empty string, recovery is the real empty array. |
| `resources.json#/1` | `item` | `data/items.json#/item/2408` | `3a4b176a3de1d6a02e8f35ca5c9171c99d174cbc22b7fce64b5ada98c982c1a3` | `type, charges, recharge, rechargeAmount`. DMG charges:7; original translated recharge token and dice-tag rechargeAmount; no inferred dawn formula. |
| `classes.json#/0` | `class` | `data/class/class-fighter.json#/class/0` | `da2d63f3d4eb692db32f22b081dafecbc08394f27fbaeff7a51503824aefd1e0` | `hd, proficiency, startingProficiencies, multiclassing`. Fighter PHB hit die, saving throws, first-class and multiclass scopes/requirements; feature references and equipment omitted. |
| `classes.json#/1` | `class` | `data/class/class-cleric.json#/class/0` | `949c918679e385384a4979398219165807332ff6ca400f39a87c6fe1779bc65a` | `hd, proficiency, startingProficiencies, multiclassing, spellcastingAbility, casterProgression, preparedSpellsChange, cantripProgression, preparedSpells, classTableGroups[*].rowsSpellProgression`. Cleric PHB prepared formula and slots; classTableGroups retains only rowsSpellProgression, preserving original group indices. |
| `classes.json#/2` | `class` | `data/class/class-cleric.json#/class/1` | `949c918679e385384a4979398219165807332ff6ca400f39a87c6fe1779bc65a` | `hd, proficiency, startingProficiencies, multiclassing, spellcastingAbility, casterProgression, preparedSpellsChange, cantripProgression, preparedSpellsProgression, classTableGroups[*].rowsSpellProgression`. Cleric XPHB prepared progression and slots; classTableGroups retains only rowsSpellProgression, preserving original group indices. |
| `equipment.json#/0` | `baseitem` | `data/items-base.json#/baseitem/150` | `9f1346c69344d66088dbdb1c26ea5872102d318ac148805a8ae9b5fedc5fc94f` | `type, ac, strength, stealth, weight, value`. Plate Armor HA: AC 18; strength remains string "15", stealth remains boolean true. |
| `equipment.json#/1` | `baseitem` | `data/items-base.json#/baseitem/174` | `9f1346c69344d66088dbdb1c26ea5872102d318ac148805a8ae9b5fedc5fc94f` | `type, ac, weight, value`. Shield S: AC 2; no armor rewrite or dex rule inserted. |
| `equipment.json#/2` | `baseitem` | `data/items-base.json#/baseitem/117` | `9f1346c69344d66088dbdb1c26ea5872102d318ac148805a8ae9b5fedc5fc94f` | `type, weaponCategory, property, dmg1, dmg2, dmgType, weight, value`. Longsword M: martial, V, 1d8/1d10, original damage code S; no slashing replacement. |
| `spells.json#/0` | `feat` | `data/feats.json#/feat/176/_versions/0` | `6712bbf38c5955415aa2b0b155d9ecbd13d8e1914d0a8f212ce44cce13866fbc` | `additionalSpells`. Magic Initiate; Cleric XPHB actual variant: shared ability choice, two cantrip choices and daily[1] level-1 class filter. |
| `spells.json#/1` | `subrace` | `data/races.json#/subrace/14` | `d60b2cde3733e363aa4d1bd0bb8465d79213d247948ff46561d883fc55c00df7` | `additionalSpells`. Eladrin DMG known[1].rest[1] contains the actual untranslated UID token; no PHB source suffix inserted. |
| `spells.json#/2` | `spell` | `data/spells/spells-phb.json#/spell/232` | `f0757303c7145a6c70763fa41d60ae28610d44f84a1eb52a4985973fbe94a60d` | `school, duration`. Misty Step PHB spell level 2, school C and instant duration; no generated class lookup included. |

## Identity alias context

The alias metadata is the explicit exception for original identity lookup. `translatedIdentityAlias` is an exact copy of the indicated upstream identity field; `ENG_name` and source/parent metadata are exact original fields. `kind` comes from the original top-level collection. It contains no narrative text. Aliases may populate a test-only resolver; never copy this metadata into protocol output.

The Battle Master row maps the actual `shortName` to the actual `ENG_name`; it does not invent a missing `ENG_shortName`. The Cleric alias resolves `class=牧师` in the Magic Initiate filter; Fighter/Battle Master resolve the Foundry parent identity; Misty Step resolves Eladrin’s `迷踪步` through the real PHB spell row.

| Fixture pointer | Kind | Original file + JSON pointer | Alias value field | File SHA-256 |
| --- | --- | --- | --- | --- |
| `identity-aliases.json#/0` | `class` | `data/class/class-cleric.json#/class/1` | `/class/1/name` → `translatedIdentityAlias`; original `ENG_name` | `949c918679e385384a4979398219165807332ff6ca400f39a87c6fe1779bc65a` |
| `identity-aliases.json#/1` | `class` | `data/class/class-fighter.json#/class/1` | `/class/1/name` → `translatedIdentityAlias`; original `ENG_name` | `da2d63f3d4eb692db32f22b081dafecbc08394f27fbaeff7a51503824aefd1e0` |
| `identity-aliases.json#/2` | `subclass` | `data/class/class-fighter.json#/subclass/20` | `/subclass/20/shortName` → `translatedIdentityAlias`; original `ENG_name` | `da2d63f3d4eb692db32f22b081dafecbc08394f27fbaeff7a51503824aefd1e0` |
| `identity-aliases.json#/3` | `spell` | `data/spells/spells-phb.json#/spell/232` | `/spell/232/name` → `translatedIdentityAlias`; original `ENG_name` | `f0757303c7145a6c70763fa41d60ae28610d44f84a1eb52a4985973fbe94a60d` |

## Nested projections and absent payload

- `resources.json#/0/entryData/resources/0` keeps `ENG_name/type/recharge/count/number/faces` from `data/class/foundry.json#/subclassFeature/292/entryData/resources/0`. Only its translated `name` is dropped. The dice-pool `count` and `faces` stay formula strings; they are not converted to an invented max or top-level resource.
- `resources.json#/0/system/uses` is the unchanged `{ "max": "" }`; `system/recovery` is the unchanged empty array. Recovery is a sibling of uses in the real sidecar and has not been moved into uses. There is no usable numeric maximum or recovery period in these selected system fields.
- `classes.json#/1/classTableGroups` and `#/2/classTableGroups` preserve the original two-element group arrays: group 0 becomes `{}` because it has no selected slot field, group 1 keeps the exact `rowsSpellProgression` matrix at original `/class/0/classTableGroups/1/rowsSpellProgression` and `/class/1/classTableGroups/1/rowsSpellProgression`. Title, column labels and ordinary rows are dropped. No table label or translated heading is retained.
- Magic Initiate is extracted directly from `_versions/0`, whose additionalSpells blocks already have no name fields. No parent spell alternatives or prose are inherited.
- Eladrin omits its translated `raceName` parent and other racial fields. The input-only subrace identity would need its real parent alias for a full catalogue identity; the spell-grant subset only requires its source and the spell resolver.
- PHB Fighter and Cleric class rows contain no top-level resource payload. The PHB Second Wind row previously documented by G2 has no structured resource payload and has no matching PHB Foundry resource row; none is fabricated here.

## Uncovered real shapes

- Source scan: all **61** locked Kiwee JSON files were read. Among direct objects in top-level list collections, `resources`, `resource` and `uses` occurred **0** times. Foundry also has `data/class/foundry.json#/classFeature/153/system/uses/max` as an empty string (Font of Magic XPHB), omitted to keep the samples small. These absence counts do not claim anything about nested versions or arbitrary prose objects.
- Equipment numeric LA/MA shapes (Leather Armor `/baseitem/105`, Scale Mail `/baseitem/166`) are real but omitted under the three-item family limit. The selected equipment covers HA, shield and a versatile melee weapon. Light/medium armor proficiency tokens remain present in the class/proficiency samples, but do not replace LA/MA numeric-equipment coverage.
- Ability flat `choose.from/count/amount` is omitted; fixed and weighted alternatives are represented. Other backgrounds/races and allocation persistence remain outside these snapshots.
- Proficiencies omit translated skill choices, tools, expertise, mixed skill/tool/language choices, and an actual finite language catalogue. `anyStandard:2` remains its real shape; it must not be silently converted to a made-up option set.
- Traits omit immune/vulnerable/conditionImmune, object or conditional speed, multi-size choices, non-darkvision senses and modifySpeed. Only the Dwarf subset is represented.
- Resources omit activities/effects, consumes links, nonempty recovery definitions and fully usable system.uses. `entryData.resources` is a real dicePool schema with source formula tokens, not a schema-positive top-level resource.
- Classes omit named numeric class tables, feature UID resolution, optionalfeature/feat progressions, startingEquipment/defaultData, pact/half/third casting and known/book progressions. Fighter XPHB is represented in proficiencies; classes contains Fighter PHB and Cleric PHB/XPHB.
- Spells omit prepared/expanded/will/ritual and resource schedules, choose.from sets, pb/e frequency variants, spell-slot gates, generated spell-class lookup, full matching cantrip/level-1 catalogues, and combat/duration settlement. The selected rest UID and daily choose are genuine; no selected spell choices or long/short recovery rules are precomputed.
- DMG `recharge:拂晓` and `rechargeAmount:{@dice 1d6 + 1}`, class weapon tokens `简易/军用`, weapon damage code `S`, dice-pool `recharge:restShort` and `<$level$>` formulas deliberately expose raw normalization differences. Availability of these inputs does not assert the current structured derivation accepts them.

## Validation boundary

Read-only validation passed: 9 original file-lock SHA/byte checks, 632 exact original primitive leaves and types, original array lengths/order, recursive exclusion of prose/name keys, identity metadata allowlist, one to three samples per family, four exact identity aliases and 20 total rows. The 8 JSON files total 16,314 bytes. This establishes faithful subsets only. Pipeline/Web equivalence, emitted-artifact validation and G3 coverage decisions belong to the main agent; no tests, implementation, schemas, docs outside this directory, package files or commits are changed by this delegation.

Main-agent addition: `appendix-c-fields.json` is an 81-field audit list copied from the authorized execution plan, not a mechanism sample. It is separate from the 16 mechanism samples and 4 aliases above.
