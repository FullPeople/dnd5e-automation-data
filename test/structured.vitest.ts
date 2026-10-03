import { expect, test } from 'vitest';
import { createIdentity } from '../src/identity.ts';
import { deriveStructured } from '../src/derive/structured/index.ts';
import { makeContext } from '../src/derive/structured/common.ts';
import { materialize, type Material, type Raw } from '../src/derive/catalogue.ts';
import { evaluateFormula } from '../src/validate/formula.ts';
import { applyCorrections } from '../src/derive/corrections.ts';
import { readFileSync } from 'node:fs';
const material=(kind:string,raw:Raw):Material=>({identity:createIdentity({kind,source:raw.source||'PHB',engName:raw.ENG_name||'Synthetic'}),raw,namespace:'kiwee',files:['fixtures/synthetic.json'],expansion:'source'});
const run=(kind:string,raw:Raw,context:Material[]=[])=>{const row=material(kind,raw);return deriveStructured(row,makeContext([row,...context]));};
test('fixed feats cannot cross editions, including extension books with explicit edition metadata',()=>{
 const target:Material={...material('feat',{ENG_name:'Synthetic Feat',source:'EXT24'}),edition:'2024'},row:Material={...material('background',{source:'EXT14',feats:[{'Synthetic Feat|EXT24':true}],ability:[{wis:1}]}),edition:'2014'};
 const blocked=deriveStructured(row,makeContext([row,target]));expect(blocked.unsupported.map(gap=>gap.code)).toContain('edition-reference');expect(blocked.mechanics.grants).toBeUndefined();expect(blocked.mechanics.modifiers).toEqual([{target:'wis',op:'add',value:1}]);
 row.edition='2024';expect(deriveStructured(row,makeContext([row,target])).mechanics.grants![0].fixed).toEqual([target.identity.key]);
});
test('an explicitly both-edition source retains its declared spell references without allowing a mismatched single edition',()=>{
 const target:Material={...material('spell',{name:'Synthetic New Spell',ENG_name:'Synthetic New Spell',source:'EXT24',level:1}),edition:'2024'},row:Material={...material('feat',{source:'EXT',additionalSpells:[{prepared:{_:{daily:{'1':['Synthetic New Spell|EXT24']}}}}]}),edition:'both'};
 expect(deriveStructured(row,makeContext([row,target])).mechanics.grants![0].fixed).toEqual([target.identity.key]);
 row.edition='2014';expect(deriveStructured(row,makeContext([row,target])).mechanics.grants).toBeUndefined();
 row.edition='2024';target.edition='both';expect(deriveStructured(row,makeContext([row,target])).mechanics.grants![0].fixed).toEqual([target.identity.key]);
});
test('fixed attributes and weighted allocations preserve values and explicit player choices',()=>{
  const fixed=run('race',{ability:[{con:2,str:1}]});expect(fixed.mechanics.modifiers).toEqual([{target:'con',op:'add',value:2},{target:'str',op:'add',value:1}]);
  const weighted=run('background',{ability:[{choose:{weighted:{from:['str','dex','con'],weights:[2,1]}}}]});expect(weighted.mechanics.grants![0].choose).toEqual({count:2,from:['str','dex','con'],weights:[2,1]});
  expect(run('race',{ability:[{script:'synthetic'}]}).unsupported.map(row=>row.code)).toContain('ability-block');
});
test('proficiencies keep fixed and chosen declarations without generating an answer',()=>{
  const result=run('background',{skillProficiencies:[{arcana:true,choose:{from:['history','religion'],count:1}}],armorProficiencies:['light armor'],savingThrowProficiencies:['wis']});
  expect(result.mechanics.grants!.map(grant=>[grant.type,grant.fixed,grant.choose])).toEqual([['skillProficiency',['arcana'],undefined],['skillProficiency',undefined,{count:1,from:['history','religion']}],['armorProficiency',['light'],undefined],['savingThrow',['wis'],undefined]]);
  expect(run('feat',{skillToolLanguageProficiencies:[{choose:{from:['tool','skill']}}]}).unsupported.map(row=>row.code)).toContain('mixed-proficiency-choice');
});
test('conditional traits stay unsupported while permanent movement and defenses retain numbers',()=>{
  const result=run('race',{speed:{walk:30,fly:{number:60,condition:'Synthetic condition'}},darkvision:60,resist:['poison',{resist:['fire'],note:'Synthetic condition'}],size:['M']});
  expect(result.mechanics.modifiers!.map(modifier=>[modifier.target,modifier.value])).toEqual([['resist:poison',true],['speed.walk',30],['sense:darkvision',60],['size','M']]);
  expect(result.unsupported.map(row=>row.code)).toEqual(['conditional-defense','conditional-speed']);
});
test('explicit resource recovery retains partial rest amounts and safe formulas',()=>{
  const result=run('classFeature',{uses:{max:'@prof+1',recovery:[{period:'sr',type:'formula',formula:'1'},{period:'lr',type:'recoverAll'}]}});
  expect(result.mechanics.resources![0]).toEqual({key:'resource:0',max:{formula:'@prof+1'},recovery:[{period:'short',amount:1},{period:'long',amount:'all'}]});
  expect(evaluateFormula((result.mechanics.resources![0].max as {formula:string}).formula,{'@prof':3})).toBe(4);
  expect(run('feat',{uses:{max:'@actor.hp'}}).unsupported.map(row=>row.code)).toContain('resource-definition');
});
test('class models separate first-class grants, multiclass grants, preparation and cumulative book entries',()=>{
  const result=run('class',{hd:{number:1,faces:10},proficiency:['str','con'],startingProficiencies:{skills:[{choose:{from:['athletics','perception'],count:1}}]},multiclassing:{proficienciesGained:{armor:['light']}},casterProgression:'1/2',preparedSpells:'<$level$> + <$wis_mod$>',preparedSpellsChange:'restLong',spellsKnownProgressionFixed:{1:6,2:2},classTableGroups:[{rowsSpellProgression:[[2,0],[3,0]]}]});
  expect(result.mechanics.classModel).toMatchObject({hitDie:10,casterProgression:'half',preparedFormula:'@class.level + @abilities.wis.mod',preparedChange:'restLong',spellSlots:[[2,0],[3,0]]});
  expect(result.mechanics.classModel!.bookProgression!.slice(0,3)).toEqual([6,8,8]);
  expect(result.mechanics.grants!.map(grant=>grant.scope)).toEqual(['firstClass','firstClass','firstClass','multiclass']);
});
test('weapon bonuses add instead of replacing each other; armor and spell-focus models stay distinct',()=>{
  const weapon=run('baseitem',{type:'M|PHB',weaponCategory:'simple',dmg1:'1d4',dmgType:'P',property:['F','T'],bonusWeapon:'+1',bonusWeaponAttack:'+2',bonusWeaponDamage:'+3'});
  expect(weapon.mechanics.equipmentModel).toMatchObject({category:'weapon',weaponType:'melee',damage:'1d4',attackBonus:3,damageBonus:4,properties:['F','T']});
  expect(run('baseitem',{type:'MA',ac:14,stealth:true}).mechanics.equipmentModel).toMatchObject({category:'mediumArmor',ac:14,dexCap:2,stealthDisadvantage:true});
  expect(run('item',{charges:3,recharge:'dawn',rechargeAmount:'1d3'}).mechanics.resources![0].recovery).toEqual([{period:'dawn',amount:'1d3'}]);
});
test('one-time equipment resolves identity and copper without copying special-item prose',()=>{
  const dagger=material('baseitem',{ENG_name:'Synthetic Blade',name:'Synthetic Blade',source:'PHB',type:'M'});
  const result=run('background',{startingEquipment:{defaultData:[{_:[{item:'Synthetic Blade|PHB',quantity:2},{value:1500},{special:'Synthetic described equipment'}]}]}},[dagger]);
  expect(result.mechanics.startingEquipment!.blocks[0].options[0].items).toEqual([{quantity:2,identity:dagger.identity.key},{quantity:1,copper:1500},{quantity:1,unresolved:true}]);
  expect(result.unsupported.map(row=>row.code)).toContain('special-equipment');
});
test('source spells preserve shared ability choices, gates and ambiguity in multi-spell daily pools',()=>{
  const one=material('spell',{ENG_name:'Synthetic One',name:'Synthetic One',source:'PHB',level:1}),two=material('spell',{ENG_name:'Synthetic Two',name:'Synthetic Two',source:'PHB',level:1});
  const result=run('feat',{additionalSpells:[{ability:{choose:['int','wis']},prepared:{3:{daily:{'1':['Synthetic One','Synthetic Two']}}}}]},[one,two]);
  expect(result.mechanics.grants).toHaveLength(2);expect(new Set(result.mechanics.grants!.map(grant=>grant.abilityChoiceKey)).size).toBe(1);expect(result.mechanics.grants!.every(grant=>grant.atLevel===3&&grant.ambiguous&&grant.canUseSlots)).toBe(true);
  expect(result.unsupported.map(row=>row.code)).toContain('spell-usage-pool-ambiguous');
  const crossed=run('feat',{source:'XPHB',additionalSpells:[{known:{_:['Synthetic One|PHB']}}]},[one]);expect(crossed.mechanics.grants).toBeUndefined();expect(crossed.unsupported.map(row=>row.code)).toContain('unresolved-spell-choice');
});
test('optional feature choices, feats and unread mechanism fields remain explicit',()=>{
  const result=run('class',{optionalfeatureProgression:[{featureType:['EI'],progression:{'*':1,3:2}}],feats:[{any:1}],mastery:['synthetic']});
  expect(result.mechanics.grants!.map(grant=>[grant.type,grant.choose?.count])).toEqual([['feature',1],['feat',1]]);expect(result.mechanics.grants![0].choiceProgression).toEqual([{level:0,count:1},{level:3,count:2}]);expect(result.unsupported.map(row=>row.ref)).toContain('mastery');
  expect(run('subclass',{optionalfeatureProgression:[{featureType:[],progression:{'*':1}}]}).unsupported.map(row=>row.code)).toContain('optional-progression-shape');
});
test('materialization and derivation do not mutate inputs or change the synthetic denominator',()=>{
  const body={race:[{name:'Synthetic Parent',ENG_name:'Synthetic Parent',source:'PHB',speed:25,_versions:[{name:'Synthetic Variant',ENG_name:'Synthetic Variant',source:'PHB'}]}]},before=structuredClone(body);
  const material=materialize([{input:{path:'data/races.json',namespace:'kiwee',role:'catalog',sha256:'synthetic'},body}]);
  expect(material.rows).toHaveLength(2);for(const row of material.rows)deriveStructured(row,makeContext(material.rows));expect(body).toEqual(before);
});
test('reviewed currency annotations preserve the legacy correction without mutation and refuse stale inputs',()=>{
  const corrections=JSON.parse(readFileSync('aliases/input-corrections.json','utf8')),annotation=corrections[0],row=material('class',{ENG_name:'Cleric',source:'XPHB',startingEquipment:{defaultData:[{A:[{},{},{},{},{},{value:7000}]}]}}),before=structuredClone(row);
  const manifest:any={toolVersion:'synthetic',inputs:[{namespace:'kiwee',path:'data/class/class-cleric.json',sha256:annotation.sha256}]},result=applyCorrections([row],manifest,corrections);
  expect(result.rows[0].raw.startingEquipment.defaultData[0].A[5].value).toBe(700);expect(row).toEqual(before);expect(result.annotations.get(row.identity.key)![0].evidence).toEqual({page:68,quote:'7 GP'});
  const stale=applyCorrections([row],{...manifest,inputs:[]},corrections);expect(stale.rows[0].raw.startingEquipment.defaultData[0].A[5].value).toBe(7000);expect(stale.diagnostics[0].code).toBe('input-correction-stale');
  expect(()=>applyCorrections([row],manifest,[annotation,annotation])).toThrow('Duplicate');
});
test('real mechanism-subset fixtures preserve unsupported resource boundaries and translated tokens',()=>{
  const charges=JSON.parse(readFileSync('fixtures/g3/resources.json','utf8'))[1],derived=run('item',charges);expect(derived.mechanics.resources![0]).toEqual({key:'charges',max:{value:7},recovery:[{period:'dawn',amount:'1d6 + 1'}]});
  const armor=JSON.parse(readFileSync('fixtures/g3/equipment.json','utf8'))[0];expect(run('baseitem',armor).mechanics.equipmentModel).toMatchObject({ac:18,strength:15,stealthDisadvantage:true});
  const traits=JSON.parse(readFileSync('fixtures/g3/traits.json','utf8'))[0];expect(run('race',traits).mechanics.modifiers).toContainEqual({target:'resist:poison',op:'set',value:true});
});
test('every appendix C field has an explicit migration role and deferred manual mechanisms stay visible',()=>{
  const fields=JSON.parse(readFileSync('fixtures/g3/appendix-c-fields.json','utf8')),roles=JSON.parse(readFileSync('src/derive/field-roles.json','utf8'));
  expect(roles.map((row:any)=>row.field)).toEqual(fields);expect(new Set(fields).size).toBe(fields.length);expect(roles.every((row:any)=>row.mapping&&['mechanism','identity','display','bookkeeping','outOfScope'].includes(row.role))).toBe(true);
  const result=run('item',{script:'synthetic',attackBonus:2,items:['synthetic']});expect(result.unsupported.map(row=>row.family)).toEqual(['scripts','manualWeapon','equipmentBundle']);
});
test('typed inline option nodes resolve finite choices; plain text never determines a feat quota',()=>{
  const option=material('optionalfeature',{ENG_name:'Synthetic Option',name:'Synthetic Option',source:'PHB'}),row=run('classFeature',{entries:[{type:'options',count:1,entries:[{optionalfeature:'Synthetic Option|PHB'}]}]},[option]);
  expect(row.mechanics.grants![0]).toEqual({type:'feature',choose:{count:1,from:[option.identity.key]},key:'text-option:entries:0'});
  expect(run('classFeature',{entries:['Choose one synthetic feat']}).mechanics.grants).toBeUndefined();
  expect(run('classFeature',{entries:[{type:'options',entries:[{name:'Synthetic unlinked option'}]}]}).unsupported.map(reason=>reason.code)).toContain('unresolved-inline-choice');
});
