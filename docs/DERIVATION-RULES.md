# Structured derivation rules

G3 baseline: tool 0.1.0. Derivation is independent of React, browser storage and player state. All inputs are immutable source snapshots; output mechanics are declarative. Unknown shapes receive explicit family/reason codes. No record is promoted to automated merely because structured fields exist.

| Family | Supported mapping | Explicit limits |
| --- | --- | --- |
| ability | Fixed numeric modifiers; fixed/from/weighted allocation grants; distinct alternatives | Invalid members and quotas rejected; background allocation is saved intent and must not be applied twice |
| proficiency | Fixed skills/tools/languages/armor/weapons/saves; finite choices; first-class/multiclass scope | Mixed and conditional forms remain visible; untranslated or noncatalogue tokens are never copied as prose |
| traits | Fixed defense flags, movement, darkvision/senses, size | Conditional/equal/relative movement and conditional defenses remain unsupported |
| resources | max/value/uses/system.uses; safe formulas; short/long/dawn/manual recovery; partial recovery | Empty max is unusable; external consumption links remain unsupported; dice-pool counter can be derived while roll expression stays unsupported |
| class model | Hit die, caster progression, preparation/known/book/cantrip/slot tables, feature references | Named resource columns need links; spellbook additions are cumulative; optionalfeature progression is one cumulative quota, never additive level grants |
| equipment | Armor, weapons, bonuses, attunement, charges, weight/value, typed equipment packages | Prerequisites/special equipment stay explicit; unresolved package parts block atomic delivery at the executor boundary |
| additional spells | Source-qualified UIDs, finite/filter choices, ability group, source level/spell level gates, uses and schedules | Multi-spell daily pool ambiguity is retained; no guessed edition, reference, shared pool or slot eligibility |
| inline choices | Typed options nodes referencing existing features; legacy answer keys retained | Plain prose does not determine a quota; unnamed/unlinked inline options require annotation |

## Identity and source annotations

Catalogue normalization matches the locked G1 expansion: copies per namespace, subrace inheritance, versions and concrete magic items. `aliases/identities.json` resolves 55 color-template English identifiers using reviewed declarative aliases. Three third-party items without English names stay in identity diagnostics. Two conflicting third-party keys remain visible; no arbitrary semantic merge is approved.

The reviewed numeric correction in `aliases/input-corrections.json` preserves the existing XPHB Cleric package: 7000 copper upstream becomes 700 copper (7 GP), page 68. It binds to the exact input SHA and original numeric path. Stale/changed data is diagnosed. The correction clones the input, records overlay provenance/evidence and never infers currency from prose in an executor.

## Real equivalence and dispositions

`test/equivalence.vitest.ts` checks input SHA/bytes and requires Web source code to match baseline `80c94e082fcbf11be10893622b03d4220bff4d60`. Set DND_AUTOMATION_REAL_DATA to the namespace directory and DND_WEB_EQUIVALENCE_REPO to the unchanged Web checkout. Missing paths produce explicit skips.

Eleven actual-data groups compare fixed race bonuses, armor bases/caps, background allocations, first-class proficiencies, movement/hit dice, cantrip/book capacities, thrown/versatile weapons, domain spells, resource boundaries, equipment currency and typed feature choices against existing functions. Synthetic positive/negative tests cover additional shapes, quotas, unsupported boundaries, annotation immutability and source conflicts. Table rows/loops are not inflated into test counts.

Dispositions are in `reports/g3/equivalence-dispositions.json`: preserve the Cleric correction through data; implement the explicit dice-pool counter while keeping its unsupported roll expression. New typed choices/resources are within the authorized derivation goal. Existing prose heuristics remain in the untouched Web baseline until G5; removing them requires an explicit IR annotation or visible unknown state, not a fallback inference.

## Appendix C field audit

The execution plan lists 81 fields including consumes. The following audit separates 48 mechanism fields from identity, source display, expansion metadata and excluded creature/manual-combat fields. These are migration roles, not claims that every possible value shape is automated. Each unsupported form keeps a family/reason. The Web runtime has not yet been switched to these fields.

| Field | Role | Mapping or retained boundary |
| --- | --- | --- |
| level | mechanism | spells |
| name | identity | shared identity or source-qualified reference context |
| ability | mechanism | abilities |
| _category | display | source snapshot display; never mechanism inference |
| speed | mechanism | traits |
| classSource | identity | shared identity or source-qualified reference context |
| _custom | mechanism | unsupported.customRule |
| casterProgression | mechanism | classes |
| ac | mechanism | equipment |
| ENG_name | identity | shared identity or source-qualified reference context |
| type | mechanism | equipment |
| dmg | outOfScope | creature/manual combat data outside this catalogue contract |
| startingEquipment | mechanism | equipment |
| property | mechanism | equipment |
| className | identity | shared identity or source-qualified reference context |
| _castingSource | display | source snapshot display; never mechanism inference |
| source | identity | shared identity or source-qualified reference context |
| proficiency | mechanism | classes |
| edition | identity | shared identity or source-qualified reference context |
| weaponCategory | mechanism | equipment |
| spellcastingAbility | mechanism | classes |
| weight | mechanism | equipment |
| size | mechanism | traits |
| preparedSpellsProgression | mechanism | classes |
| hd | mechanism | classes |
| entries | display | source display plus typed inline choice nodes; plain prose never determines a grant |
| classes | mechanism | spells |
| classTableGroups | mechanism | classes |
| _equipmentRef | display | source snapshot display; never mechanism inference |
| uses | mechanism | resources |
| subclassTableGroups | mechanism | classes |
| subclassShortName | identity | shared identity or source-qualified reference context |
| startingProficiencies | mechanism | classes |
| spellsKnownProgression | mechanism | classes |
| preparedSpells | mechanism | classes |
| dmgType | mechanism | equipment |
| classFeatures | mechanism | classes |
| _spellClasses | mechanism | spells |
| time | mechanism | spells |
| system | mechanism | resources |
| scfType | mechanism | equipment |
| reqAttune | mechanism | equipment |
| range | mechanism | spells |
| multiclassing | mechanism | classes |
| legendaryGroup | outOfScope | creature/manual combat data outside this catalogue contract |
| hp | outOfScope | creature/manual combat data outside this catalogue contract |
| duration | mechanism | spells |
| attackBonus | mechanism | unsupported.manualWeapon |
| additionalEntries | display | source snapshot display; never mechanism inference |
| _legendaryGroup | outOfScope | creature/manual combat data outside this catalogue contract |
| subclassSource | identity | shared identity or source-qualified reference context |
| subclassName | identity | shared identity or source-qualified reference context |
| subclassFeatures | mechanism | classes |
| spellsKnownProgressionFixed | mechanism | classes |
| shortName | identity | shared identity or source-qualified reference context |
| script | mechanism | unsupported.scripts |
| resources | mechanism | resources |
| resource | mechanism | resources |
| raceName | identity | shared identity or source-qualified reference context |
| preparedSpellsChange | mechanism | classes |
| page | display | source snapshot display; never mechanism inference |
| overwrite | bookkeeping | catalogue expansion and visible inheritance diagnostics |
| items | mechanism | unsupported.equipmentBundle |
| inherits | bookkeeping | catalogue expansion and visible inheritance diagnostics |
| feats | mechanism | classes |
| entriesHigherLevel | display | source snapshot display; never mechanism inference |
| classEnglish | identity | shared identity or source-qualified reference context |
| classENG_name | identity | shared identity or source-qualified reference context |
| cantripProgression | mechanism | classes |
| bonusAc | mechanism | equipment |
| additionalSpells | mechanism | spells |
| _workbenchCustom | mechanism | unsupported.customRule |
| _variantIdentity | identity | shared identity or source-qualified reference context |
| _unresolvedParent | bookkeeping | catalogue expansion and visible inheritance diagnostics |
| _trainingCategory | display | source snapshot display; never mechanism inference |
| _spellSources | display | source snapshot display; never mechanism inference |
| _copy | bookkeeping | catalogue expansion and visible inheritance diagnostics |
| _classEdition | identity | shared identity or source-qualified reference context |
| ENG_shortName | identity | shared identity or source-qualified reference context |
| value | mechanism | equipment |
| consumes | mechanism | resources |
