# Foundry to automation-ir mapping

The main agent reviewed every whitelist decision. Only migrationVersion 3 is executable input to this derivation; future versions produce unreviewed-migration-version. G4 produces a draft, not a complete-coverage claim.

The whitelist has 236 keys observed in all six locked sidecars. Every row is exercised as a bounded input in test/foundry.vitest.ts; dedicated cases verify modes, local consumption, scale shapes, disabled/timed/item effects, alternative proficiencies and conflict handling. No key with observed frequency >=3 has a generic unimplemented-foundry-field disposition.

## Interpretation rules

- Join canonical English identity, source, complete class/subclass/race parents and feature level. Unmatched rows retain a source SHA and JSON pointer in unsupported.json.foundryOrphans.
- Dotted and nested system objects flatten identically. Empty uses.max remains unsupported and never initializes a finite counter.
- ADD/add, OVERRIDE/set, UPGRADE/max and DOWNGRADE/min retain values. Numeric Foundry modes 2/5/4/3 are accepted. CUSTOM and MULTIPLY remain identified deferred families. Trait OVERRIDE is a whole-set replacement and cannot be reduced to individual true flags.
- transfer:true without duration may duplicate modifiers only for enabled non-item effects without opaque flags/riders. Item ownership needs equipped/attuned binding; all effects remain deferred wrappers. No temporary, disabled or opaque effect is applied as a permanent modifier.
- Spell melee and spell ranged attack/damage are distinct channels. Global and specific bonuses cannot be collapsed into a doubled generic value.
- ScaleValue number and dice tables retain sparse levels, including explicit level 0. Dice uses number/faces or historical n/die; missing count/identifier remains unsupported. Identifier hyphens normalize to underscores only against known identifiers; arithmetic subtraction remains untouched.
- itemUses/activityUses bind only to a declared local resource. External consumers, negative recovery consumers, hit-die/slot consumers and translated actor paths require explicit binding. The original translated attribute value remains in the SHA-locked private cache; public reports preserve its pointer and reason, satisfying the no-CJK artifact invariant.
- Cast activities require a complete same-edition spell identity. Utility/cast may carry a non-deferred representation only when their represented fields have no additional deferred conditions. Target settlement, heal, damage, attack, saves and checks remain deferred. The Web executor must also respect record review status.
- entryData uses the same structured deriver. Proficiency object-array alternatives share setKey/setOption; tokens in one object are cumulative. Inherited parent/child proficiency groups are independent cumulative sources. Omitted choose.count defaults to one.
- ignoreSrdEffects/ignoreSrdActivities suppress implicit SRD defaults, not explicit sidecar payloads. isIgnored suppresses that sidecar payload. All three markers are preserved in record.foundryFlags; markers alone never establish automation.
- Identical mechanism objects deduplicate. Same-target or same-key conflicts produce layerConflict and keep the existing structured mechanism rather than silently stacking or overwriting it.
- No name or narrative substring chooses behavior. Names remain identity/display data. Sidecars may be factually wrong; G6 narrative overlays can reverse them with evidence.

## Review receipt

All 233 rows are retained in reports/g4/four-class-review.json: Fighter 73, Cleric 76, Barbarian 39 and Wizard 45. Each contains the source SHA/pointer, field decisions, full typed translation and deferred families. The main review corrected Scholar alternative expertise, inherited proficiency groups, omitted choice counts, historical dice shapes and Temporal Awareness initiative. Missing translated scale identifiers and suspicious sidecar payloads remain visibly pending.

## Whitelist

| Input key | Route | Protocol target | Family | Reason |
| --- | --- | --- | --- | --- |
| activity:attack | activity | attack | activity | typed-action-with-explicit-deferred-settlement |
| activity:cast | activity | cast | activity | typed-action-with-explicit-deferred-settlement |
| activity:check | activity | check | activity | typed-action-with-explicit-deferred-settlement |
| activity:damage | activity | damage | activity | typed-action-with-explicit-deferred-settlement |
| activity:enchant | unsupported |  | activityEnchant | activity-type-execution-deferred |
| activity:forward | unsupported |  | activityForward | activity-type-execution-deferred |
| activity:heal | activity | heal | activity | typed-action-with-explicit-deferred-settlement |
| activity:save | activity | save | activity | typed-action-with-explicit-deferred-settlement |
| activity:summon | unsupported |  | activitySummon | activity-type-execution-deferred |
| activity:teleport | unsupported |  | activityTeleport | activity-type-execution-deferred |
| activity:transform | unsupported |  | activityTransform | activity-type-execution-deferred |
| activity:utility | activity | utility | activity | typed-action-with-explicit-deferred-settlement |
| advancement:ScaleValue | scale |  | scale | typed-level-values-and-normalized-identifier |
| effect.key:activities[attack].attack.ability | unsupported |  | activityMutation | activity-mutation-execution-deferred |
| effect.key:activities[attack].attack.bonus | unsupported |  | activityMutation | activity-mutation-execution-deferred |
| effect.key:activities[attack].description.chatFlavor | unsupported |  | activityMutation | activity-mutation-execution-deferred |
| effect.key:activities[enchant].activation.condition | unsupported |  | activityMutation | activity-mutation-execution-deferred |
| effect.key:activities[enchant].activation.type | unsupported |  | activityMutation | activity-mutation-execution-deferred |
| effect.key:activities[enchant].consumption.targets | unsupported |  | activityMutation | activity-mutation-execution-deferred |
| effect.key:activities[enchant].name | unsupported |  | activityMutation | activity-mutation-execution-deferred |
| effect.key:activities[forward].activation.override | unsupported |  | activityMutation | activity-mutation-execution-deferred |
| effect.key:activities[forward].activation.type | unsupported |  | activityMutation | activity-mutation-execution-deferred |
| effect.key:activities[forward].name | unsupported |  | activityMutation | activity-mutation-execution-deferred |
| effect.key:activities[summon].bonuses.attackDamage | unsupported |  | activityMutation | activity-mutation-execution-deferred |
| effect.key:activities[summon].bonuses.hp | unsupported |  | activityMutation | activity-mutation-execution-deferred |
| effect.key:activities[summon].creatureTypes | unsupported |  | activityMutation | activity-mutation-execution-deferred |
| effect.key:attributes.senses.darkvision | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:check | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:damage | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:flags.dnd-players-handbook.mirrorImages | unsupported |  | systemExtension | external-system-extension-execution-deferred |
| effect.key:flags.dnd5e.diamondSoul | unsupported |  | systemExtension | external-system-extension-execution-deferred |
| effect.key:flags.dnd5e.elvenAccuracy | unsupported |  | systemExtension | external-system-extension-execution-deferred |
| effect.key:flags.dnd5e.halflingLucky | unsupported |  | systemExtension | external-system-extension-execution-deferred |
| effect.key:flags.dnd5e.initiativeAdv | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:flags.dnd5e.initiativeAlert | unsupported |  | systemExtension | external-system-extension-execution-deferred |
| effect.key:flags.dnd5e.jackOfAllTrades | unsupported |  | systemExtension | external-system-extension-execution-deferred |
| effect.key:flags.dnd5e.meleeCriticalDamageDice | modifier | criticalDice | passiveModifier | literal-or-whitelisted-formula |
| effect.key:flags.dnd5e.observantFeat | unsupported |  | systemExtension | external-system-extension-execution-deferred |
| effect.key:flags.dnd5e.powerfulBuild | unsupported |  | systemExtension | external-system-extension-execution-deferred |
| effect.key:flags.dnd5e.reliableTalent | unsupported |  | systemExtension | external-system-extension-execution-deferred |
| effect.key:flags.dnd5e.remarkableAthlete | unsupported |  | systemExtension | external-system-extension-execution-deferred |
| effect.key:flags.dnd5e.tavernBrawlerFeat | unsupported |  | systemExtension | external-system-extension-execution-deferred |
| effect.key:flags.dnd5e.weaponCriticalThreshold | unsupported |  | criticalRange | critical-range-settlement-deferred |
| effect.key:flags.world.dbDice | unsupported |  | systemExtension | external-system-extension-execution-deferred |
| effect.key:img | metadata |  | displayMetadata | image-presentation-only |
| effect.key:name | metadata |  | displayMetadata | never-copy-source-body-or-name-change |
| effect.key:system.abilities.cha.bonuses.check | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.abilities.cha.check.roll.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.abilities.cha.max | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.abilities.cha.save.roll.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.abilities.cha.value | modifier | cha | passiveModifier | literal-or-whitelisted-formula |
| effect.key:system.abilities.con.bonuses.check | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.abilities.con.bonuses.save | modifier | save:con | saveBonus | ability-specific-save-bonus |
| effect.key:system.abilities.con.check.roll.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.abilities.con.max | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.abilities.con.save.roll.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.abilities.con.value | modifier | con | passiveModifier | literal-or-whitelisted-formula |
| effect.key:system.abilities.dex.bonuses.save | modifier | save:dex | saveBonus | ability-specific-save-bonus |
| effect.key:system.abilities.dex.check.roll.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.abilities.dex.max | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.abilities.dex.save.roll.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.abilities.dex.value | modifier | dex | passiveModifier | literal-or-whitelisted-formula |
| effect.key:system.abilities.int.check.roll.min | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.abilities.int.check.roll.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.abilities.int.max | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.abilities.int.save.roll.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.abilities.int.value | modifier | int | passiveModifier | literal-or-whitelisted-formula |
| effect.key:system.abilities.str.bonuses.check | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.abilities.str.bonuses.save | modifier | save:str | saveBonus | ability-specific-save-bonus |
| effect.key:system.abilities.str.check.roll.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.abilities.str.max | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.abilities.str.save.roll.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.abilities.str.value | modifier | str | passiveModifier | literal-or-whitelisted-formula |
| effect.key:system.abilities.wis.check.roll.min | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.abilities.wis.check.roll.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.abilities.wis.max | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.abilities.wis.save.roll.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.abilities.wis.value | modifier | wis | passiveModifier | literal-or-whitelisted-formula |
| effect.key:system.activation.condition | unsupported |  | itemMutation | target-item-context-required |
| effect.key:system.activation.cost | unsupported |  | itemMutation | target-item-context-required |
| effect.key:system.activation.type | unsupported |  | itemMutation | target-item-context-required |
| effect.key:system.armor.magicalBonus | unsupported |  | itemMutation | target-item-context-required |
| effect.key:system.attack.bonus | unsupported |  | itemActivityMutation | target-item-or-activity-context-required |
| effect.key:system.attributes.ac.bonus | modifier | ac | passiveModifier | literal-or-whitelisted-formula |
| effect.key:system.attributes.ac.calc | unsupported |  | armorCalculation | armor-calculation-and-condition-model-required |
| effect.key:system.attributes.ac.formula | unsupported |  | armorCalculation | armor-calculation-and-condition-model-required |
| effect.key:system.attributes.ac.min | unsupported |  | armorCalculation | armor-calculation-and-condition-model-required |
| effect.key:system.attributes.attunement.max | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.attributes.bonus | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.attributes.concentration.bonuses.save | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.attributes.concentration.roll.bonus | unsupported |  | concentration | concentration-check-lifecycle-deferred |
| effect.key:system.attributes.concentration.roll.min | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.attributes.concentration.roll.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.attributes.death.roll.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.attributes.hp.bonuses.level | hpPerLevel | hp | passiveModifier | literal-or-whitelisted-formula |
| effect.key:system.attributes.hp.bonuses.overall | modifier | hp | passiveModifier | literal-or-whitelisted-formula |
| effect.key:system.attributes.hp.max | unsupported |  | temporaryHitPoints | hit-point-effect-settlement-deferred |
| effect.key:system.attributes.hp.tempmax | unsupported |  | temporaryHitPoints | hit-point-effect-settlement-deferred |
| effect.key:system.attributes.init.bonus | modifier | initiative | passiveModifier | literal-or-whitelisted-formula |
| effect.key:system.attributes.init.roll.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.attributes.init.total | modifier | initiative | passiveModifier | literal-or-whitelisted-formula |
| effect.key:system.attributes.movement.bonus | unsupported |  | movementCalculation | existing-speed-guard-or-multiplication-model-required |
| effect.key:system.attributes.movement.burrow | modifier | speed.burrow | movementCalculation | existing-speed-guard-or-multiplication-model-required |
| effect.key:system.attributes.movement.climb | modifier | speed.climb | movementCalculation | existing-speed-guard-or-multiplication-model-required |
| effect.key:system.attributes.movement.fly | modifier | speed.fly | movementCalculation | existing-speed-guard-or-multiplication-model-required |
| effect.key:system.attributes.movement.hover | unsupported |  | movementCalculation | existing-speed-guard-or-multiplication-model-required |
| effect.key:system.attributes.movement.ignoredDifficultTerrain | unsupported |  | movementCalculation | existing-speed-guard-or-multiplication-model-required |
| effect.key:system.attributes.movement.multiplier | unsupported |  | movementCalculation | existing-speed-guard-or-multiplication-model-required |
| effect.key:system.attributes.movement.speeds.burrow | unsupported |  | movementCalculation | existing-speed-guard-or-multiplication-model-required |
| effect.key:system.attributes.movement.speeds.climb | unsupported |  | movementCalculation | existing-speed-guard-or-multiplication-model-required |
| effect.key:system.attributes.movement.speeds.fly | unsupported |  | movementCalculation | existing-speed-guard-or-multiplication-model-required |
| effect.key:system.attributes.movement.speeds.walk | unsupported |  | movementCalculation | existing-speed-guard-or-multiplication-model-required |
| effect.key:system.attributes.movement.swim | modifier | speed.swim | movementCalculation | existing-speed-guard-or-multiplication-model-required |
| effect.key:system.attributes.movement.walk | modifier | speed.walk | movementCalculation | existing-speed-guard-or-multiplication-model-required |
| effect.key:system.attributes.prof | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.attributes.senses.blindsight | modifier | sense:blindsight | passiveModifier | literal-or-whitelisted-formula |
| effect.key:system.attributes.senses.darkvision | modifier | sense:darkvision | passiveModifier | literal-or-whitelisted-formula |
| effect.key:system.attributes.senses.ranges.blindsight | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.attributes.senses.ranges.darkvision | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.attributes.senses.special | unsupported |  | conditionalSenses | unstructured-special-sense-predicate |
| effect.key:system.attributes.senses.tremorsense | modifier | sense:tremorsense | passiveModifier | literal-or-whitelisted-formula |
| effect.key:system.attributes.senses.truesight | modifier | sense:truesight | passiveModifier | literal-or-whitelisted-formula |
| effect.key:system.attunement | unsupported |  | itemMutation | target-item-context-required |
| effect.key:system.bonuses.abilities.check | unsupported |  | abilityCheckBonus | global-ability-check-model-required |
| effect.key:system.bonuses.abilities.save | saveBonus |  | saveBonus | six-save-modifiers |
| effect.key:system.bonuses.msak.attack | modifier | attack.spellMelee | passiveModifier | literal-or-whitelisted-formula |
| effect.key:system.bonuses.msak.damage | modifier | damage.spellMelee | passiveModifier | literal-or-whitelisted-formula |
| effect.key:system.bonuses.mwak.attack | modifier | attack.melee | passiveModifier | literal-or-whitelisted-formula |
| effect.key:system.bonuses.mwak.damage | modifier | damage.melee | passiveModifier | literal-or-whitelisted-formula |
| effect.key:system.bonuses.rsak.attack | modifier | attack.spellRanged | passiveModifier | literal-or-whitelisted-formula |
| effect.key:system.bonuses.rsak.damage | modifier | damage.spellRanged | passiveModifier | literal-or-whitelisted-formula |
| effect.key:system.bonuses.rwak.attack | modifier | attack.ranged | passiveModifier | literal-or-whitelisted-formula |
| effect.key:system.bonuses.rwak.damage | modifier | damage.ranged | passiveModifier | literal-or-whitelisted-formula |
| effect.key:system.bonuses.spell.dc | modifier | dc.spell | passiveModifier | literal-or-whitelisted-formula |
| effect.key:system.damage.base.bonus | unsupported |  | itemActivityMutation | target-item-or-activity-context-required |
| effect.key:system.damage.base.custom.enabled | unsupported |  | itemActivityMutation | target-item-or-activity-context-required |
| effect.key:system.damage.base.custom.formula | unsupported |  | itemActivityMutation | target-item-or-activity-context-required |
| effect.key:system.damage.base.denomination | unsupported |  | itemActivityMutation | target-item-or-activity-context-required |
| effect.key:system.damage.base.number | unsupported |  | itemActivityMutation | target-item-or-activity-context-required |
| effect.key:system.damage.base.types | unsupported |  | itemActivityMutation | target-item-or-activity-context-required |
| effect.key:system.damage.bonus | unsupported |  | itemActivityMutation | target-item-or-activity-context-required |
| effect.key:system.damage.parts | unsupported |  | itemActivityMutation | target-item-or-activity-context-required |
| effect.key:system.damage.versatile.bonus | unsupported |  | itemActivityMutation | target-item-or-activity-context-required |
| effect.key:system.damage.versatile.denomination | unsupported |  | itemActivityMutation | target-item-or-activity-context-required |
| effect.key:system.damage.versatile.number | unsupported |  | itemActivityMutation | target-item-or-activity-context-required |
| effect.key:system.damage.versatile.types | unsupported |  | itemActivityMutation | target-item-or-activity-context-required |
| effect.key:system.description.value | metadata |  | displayMetadata | never-copy-source-body-or-name-change |
| effect.key:system.details.alignment | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.magicalBonus | unsupported |  | itemActivityMutation | target-item-or-activity-context-required |
| effect.key:system.mastery | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.preparation.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.proficient | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.properties | unsupported |  | itemProperties | target-item-property-mutation-deferred |
| effect.key:system.range.units | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.range.value | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.rolls.ability.check.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.rolls.ability.save.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.rolls.attack.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.skills.acr.bonuses.check | modifier | skill:acrobatics | skillBonus | skill-specific-check-bonus |
| effect.key:system.skills.acr.roll.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.skills.ani.bonuses.check | modifier | skill:animalHandling | skillBonus | skill-specific-check-bonus |
| effect.key:system.skills.arc.bonuses.check | modifier | skill:arcana | skillBonus | skill-specific-check-bonus |
| effect.key:system.skills.ath.bonuses.check | modifier | skill:athletics | skillBonus | skill-specific-check-bonus |
| effect.key:system.skills.ath.roll.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.skills.dec.bonuses.check | modifier | skill:deception | skillBonus | skill-specific-check-bonus |
| effect.key:system.skills.dec.roll.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.skills.his.bonuses.check | modifier | skill:history | skillBonus | skill-specific-check-bonus |
| effect.key:system.skills.ins.bonuses.check | modifier | skill:insight | skillBonus | skill-specific-check-bonus |
| effect.key:system.skills.inv.bonuses.check | modifier | skill:investigation | skillBonus | skill-specific-check-bonus |
| effect.key:system.skills.itm.bonuses.check | modifier | skill:intimidation | skillBonus | skill-specific-check-bonus |
| effect.key:system.skills.itm.roll.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.skills.med.bonuses.check | modifier | skill:medicine | skillBonus | skill-specific-check-bonus |
| effect.key:system.skills.nat.bonuses.check | modifier | skill:nature | skillBonus | skill-specific-check-bonus |
| effect.key:system.skills.per.bonuses.check | modifier | skill:persuasion | skillBonus | skill-specific-check-bonus |
| effect.key:system.skills.per.roll.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.skills.prc.bonuses.check | modifier | skill:perception | skillBonus | skill-specific-check-bonus |
| effect.key:system.skills.prc.roll.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.skills.prf.bonuses.check | modifier | skill:performance | skillBonus | skill-specific-check-bonus |
| effect.key:system.skills.rel.bonuses.check | modifier | skill:religion | skillBonus | skill-specific-check-bonus |
| effect.key:system.skills.slt.bonuses.check | modifier | skill:sleightOfHand | skillBonus | skill-specific-check-bonus |
| effect.key:system.skills.ste.bonuses.check | modifier | skill:stealth | skillBonus | skill-specific-check-bonus |
| effect.key:system.skills.ste.roll.mode | unsupported |  | rollMode | advantage-roll-mode-execution-deferred |
| effect.key:system.skills.sur.bonuses.check | modifier | skill:survival | skillBonus | skill-specific-check-bonus |
| effect.key:system.tools.brewer | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.tools.mason | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.traits.ci.value | trait | conditionImmune | defense | finite-trait-values |
| effect.key:system.traits.di.value | trait | immune | defense | finite-trait-values |
| effect.key:system.traits.dm.amount.bludgeoning | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.traits.dm.amount.piercing | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.traits.dm.amount.slashing | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.traits.dr | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.traits.dr.value | trait | resist | defense | finite-trait-values |
| effect.key:system.traits.languages.custom | unsupported |  | languagePredicate | unstructured-custom-language-text |
| effect.key:system.traits.languages.value | grant | languageProficiency | proficiency | finite-catalogue-values |
| effect.key:system.traits.weaponProf.mastery.bonus | unsupported |  | weaponMastery | mastery-eligibility-and-execution-deferred |
| effect.key:system.traits.weaponProf.value | grant | weaponProficiency | proficiency | finite-catalogue-values |
| effect.key:system.type.value | unsupported |  | foundryField | unimplemented-foundry-field |
| effect.key:system.uses.max | unsupported |  | itemMutation | target-item-context-required |
| effect.key:system.uses.per | unsupported |  | itemMutation | target-item-context-required |
| effect.key:system.uses.recovery | unsupported |  | itemMutation | target-item-context-required |
| effect.key:token.light.dim | unsupported |  | foundryField | unimplemented-foundry-field |
| entryData:additionalSpells | structured | additionalSpells | structuredEntryData | delegate-declared-field-to-structured-deriver |
| entryData:armorProficiencies | structured | armorProficiencies | structuredEntryData | delegate-declared-field-to-structured-deriver |
| entryData:conditionImmune | structured | conditionImmune | structuredEntryData | delegate-declared-field-to-structured-deriver |
| entryData:expertise | structured | expertise | structuredEntryData | delegate-declared-field-to-structured-deriver |
| entryData:immune | structured | immune | structuredEntryData | delegate-declared-field-to-structured-deriver |
| entryData:languageProficiencies | structured | languageProficiencies | structuredEntryData | delegate-declared-field-to-structured-deriver |
| entryData:resist | structured | resist | structuredEntryData | delegate-declared-field-to-structured-deriver |
| entryData:resources | structured | resources | structuredEntryData | delegate-declared-field-to-structured-deriver |
| entryData:savingThrowProficiencies | structured | savingThrowProficiencies | structuredEntryData | delegate-declared-field-to-structured-deriver |
| entryData:senses | structured | senses | structuredEntryData | delegate-declared-field-to-structured-deriver |
| entryData:skillProficiencies | structured | skillProficiencies | structuredEntryData | delegate-declared-field-to-structured-deriver |
| entryData:toolProficiencies | structured | toolProficiencies | structuredEntryData | delegate-declared-field-to-structured-deriver |
| entryData:weaponProficiencies | structured | weaponProficiencies | structuredEntryData | delegate-declared-field-to-structured-deriver |
| flag:ignoreSrdActivities | marker |  | srdMarker | preserve-marker-without-granting-mechanics |
| flag:ignoreSrdEffects | marker |  | srdMarker | preserve-marker-without-granting-mechanics |
| flag:isIgnored | marker |  | srdMarker | preserve-marker-without-granting-mechanics |
| system:advancement.tkAWLfJZfdNCKVl7.configuration.spell.uses.max | unsupported |  | foundryField | unimplemented-foundry-field |
| system:armor.dex | unsupported |  | foundryArmorModel | armor-model-migration-pending-explicit-target |
| system:armor.type | unsupported |  | foundryArmorModel | armor-model-migration-pending-explicit-target |
| system:armor.value | unsupported |  | foundryArmorModel | armor-model-migration-pending-explicit-target |
| system:duration.units | metadata |  | targetDurationMetadata | informational-shape-no-automatic-target-or-duration-execution |
| system:duration.value | metadata |  | targetDurationMetadata | informational-shape-no-automatic-target-or-duration-execution |
| system:magicalBonus | unsupported |  | foundryField | unimplemented-foundry-field |
| system:range.units | metadata |  | targetDurationMetadata | informational-shape-no-automatic-target-or-duration-execution |
| system:range.value | metadata |  | targetDurationMetadata | informational-shape-no-automatic-target-or-duration-execution |
| system:recovery | unsupported |  | foundryField | unimplemented-foundry-field |
| system:target.affects.count | metadata |  | targetDurationMetadata | informational-shape-no-automatic-target-or-duration-execution |
| system:target.affects.type | metadata |  | targetDurationMetadata | informational-shape-no-automatic-target-or-duration-execution |
| system:target.template.size | metadata |  | targetDurationMetadata | informational-shape-no-automatic-target-or-duration-execution |
| system:target.template.type | metadata |  | targetDurationMetadata | informational-shape-no-automatic-target-or-duration-execution |
| system:type.subtype | metadata |  | itemTypeMetadata | item-type-display-metadata |
| system:type.value | metadata |  | itemTypeMetadata | item-type-display-metadata |
| system:uses.autoDestroy | unsupported |  | foundryField | unimplemented-foundry-field |
| system:uses.max | resource |  | resource | explicit-max-and-recovery-only |
| system:uses.recovery | resource |  | resource | explicit-max-and-recovery-only |
