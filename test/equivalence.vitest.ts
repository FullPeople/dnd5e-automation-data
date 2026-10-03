import { expect, test, beforeAll } from 'vitest';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { materialize, type Material } from '../src/derive/catalogue.ts';
import { makeContext } from '../src/derive/structured/common.ts';
import { deriveStructured } from '../src/derive/structured/index.ts';
const root=process.env.DND_AUTOMATION_REAL_DATA,web=process.env.DND_WEB_EQUIVALENCE_REPO;
const available=!!root&&!!web;
if(!available) console.warn('G3 real-data equivalence skipped: set DND_AUTOMATION_REAL_DATA and DND_WEB_EQUIVALENCE_REPO to locked input and unchanged Web worktree paths.');
let api:any,rows:Material[]=[];
beforeAll(async()=>{
 if(!available)return;
 expect(execFileSync('git',['diff','80c94e082fcbf11be10893622b03d4220bff4d60','--name-only','--','src'],{cwd:web,encoding:'utf8'}).trim()).toBe('');
 const model=await import(/* @vite-ignore */ `${web}/src/core/model.ts`),engine=await import(/* @vite-ignore */ `${web}/src/core/engine.ts`),racial=await import(/* @vite-ignore */ `${web}/src/core/racialAbilities.ts`),background=await import(/* @vite-ignore */ `${web}/src/core/automation/backgroundAbilities.ts`),armor=await import(/* @vite-ignore */ `${web}/src/core/automation/equipment.ts`),weapons=await import(/* @vite-ignore */ `${web}/src/core/automation/weapons.ts`),state=await import(/* @vite-ignore */ `${web}/src/core/automation/state.ts`),catalogue=await import(/* @vite-ignore */ `${web}/src/data/catalog.ts`),casting=await import(/* @vite-ignore */ `${web}/src/core/spellcastingRules.ts`),spellChoices=await import(/* @vite-ignore */ `${web}/src/core/automation/classSpellChoices.ts`),sourceSpells=await import(/* @vite-ignore */ `${web}/src/core/automation/sourceSpells.ts`),choices=await import(/* @vite-ignore */ `${web}/src/core/automation/choices.ts`),featureResources=await import(/* @vite-ignore */ `${web}/src/core/automation/featureResources.ts`);
 api={...model,...engine,...racial,...background,...armor,...weapons,...state,...catalogue,...casting,...spellChoices,...sourceSpells,...featureResources,...choices};
 const paths=['data/races.json','data/backgrounds.json','data/items-base.json','data/items.json','data/feats.json','data/optionalfeatures.json','data/class/class-fighter.json','data/class/class-cleric.json','data/class/class-wizard.json','data/spells/spells-phb.json','data/spells/spells-xphb.json'];
 const manifest=JSON.parse(readFileSync(join(root!,'..','inputs-sha256.json'),'utf8'));
 const files=paths.map(path=>{const bytes=readFileSync(join(root!,path)),input=manifest.inputs.find((file:any)=>file.namespace==='kiwee'&&file.path===path);expect(input,path).toBeDefined();expect(createHash('sha256').update(bytes).digest('hex'),path).toBe(input.sha256);expect(bytes.length,path).toBe(input.bytes);return {input,body:JSON.parse(bytes.toString('utf8'))};});
 rows=materialize(files,JSON.parse(readFileSync('aliases/identities.json','utf8'))).rows;
});
function entry(row:Material){return api.normalizeData({[row.identity.kind]:[{...row.raw,name:row.raw.name||row.identity.engName}]},'locked-equivalence')[0];}
function character(row:Material,level=1){const c=api.newCharacter(row.edition||'2014');c.automation=api.newAutomationState();c.profile.enabledSources.push(row.identity.source);c.selections=[{id:'sample',entry:entry(row),level,quantity:1,equipped:true}];return c;}
const dispositions:any[]=[];
test.skipIf(!available)('real fixed race attributes match the unchanged planRacialAbilities output',()=>{
 const samples=rows.filter(row=>row.identity.kind==='race'&&['PHB','XPHB'].includes(row.identity.source)&&Array.isArray(row.raw.ability)&&row.raw.ability.length===1&&Object.keys(row.raw.ability[0]).every(key=>api.ABILITIES.includes(key))&&!row.raw._copy&&!row.raw._unresolvedParent);
 expect(samples.length).toBeGreaterThan(3);
 for(const row of samples){const c=character(row),old=api.planRacialAbilities(c,c.selections[0]).bonuses,derived=deriveStructured(row,makeContext(rows));const bonuses=Object.fromEntries((derived.mechanics.modifiers||[]).filter(mod=>api.ABILITIES.includes(mod.target)&&mod.value!==0).map(mod=>[mod.target,mod.value]));expect(bonuses, row.identity.key).toEqual(old);}
});
test.skipIf(!available)('real armor models retain base armor and dexterity caps across both editions',()=>{
 const samples=rows.filter(row=>row.identity.kind==='baseitem'&&['PHB','XPHB'].includes(row.identity.source)&&['LA','MA','HA','S'].includes(String(row.raw.type).split('|')[0])&&typeof row.raw.ac==='number');expect(samples.length).toBeGreaterThan(15);
 for(const row of samples){const c=character(row),old=api.armorRule(c.selections[0]).rule,model=deriveStructured(row,makeContext(rows)).mechanics.equipmentModel!;expect(model.ac,row.identity.key).toBe(old.base);expect(model.dexCap,row.identity.key).toBe(old.dexCap);expect(model.requiresAttunement||false,row.identity.key).toBe(old.attunementRequired);}
});
test.skipIf(!available)('real background allocation options match the saved-allocation control',()=>{
 const samples=rows.filter(row=>row.identity.kind==='background'&&row.identity.source==='XPHB'&&Array.isArray(row.raw.ability));expect(samples.length).toBeGreaterThan(10);
 for(const row of samples){
  const old=api.backgroundAbilityOptions(entry(row)).map((option:any)=>option.value).sort(),model=deriveStructured(row,makeContext(rows)).mechanics,values=new Set<string>();
  const fixed=Object.fromEntries((model.modifiers||[]).filter(mod=>api.ABILITIES.includes(mod.target)).map(mod=>[mod.target,mod.value]));
  const choices=(model.grants||[]).filter(grant=>grant.type==='abilityScore');
  for(const choice of choices){const choose=choice.choose;if(!choose)continue;const visit=(i:number,used:string[],scores:Record<string,number>)=>{if(i===choose.count){values.add(api.backgroundAbilityValue(scores));return;}for(const key of choose.from!)if(!used.includes(key))visit(i+1,[...used,key],{...scores,[key]:(scores[key]||0)+(choose.weights?.[i]||choice.amount||1)});};visit(0,[],fixed as Record<string,number>);}
  if(!choices.length)values.add(api.backgroundAbilityValue(fixed));expect([...values].sort(),row.identity.key).toEqual(old);
 }
});
test.skipIf(!available)('real first-class skill and save proficiency grants match evaluate()',()=>{
 const samples=rows.filter(row=>row.identity.kind==='class'&&['PHB','XPHB'].includes(row.identity.source));expect(samples).toHaveLength(6);
 for(const row of samples){const c=character(row),old=api.evaluate(c),grants=deriveStructured(row,makeContext(rows)).mechanics.grants||[];const skills=grants.filter(grant=>grant.type==='skillProficiency'&&grant.scope==='firstClass').flatMap(grant=>grant.fixed||[]),saves=grants.filter(grant=>grant.type==='savingThrow'&&grant.scope==='firstClass').flatMap(grant=>grant.fixed||[]);expect(Object.keys(old.skills).filter(key=>old.skills[key].proficient).sort(),row.identity.key).toEqual(skills.sort());expect(Object.keys(old.saves).filter(key=>old.saves[key].proficient).sort(),row.identity.key).toEqual(saves.sort());}
});
test.skipIf(!available)('real fixed movement and hit dice retain evaluate() numbers',()=>{
 const samples=rows.filter(row=>row.identity.kind==='race'&&['PHB','XPHB'].includes(row.identity.source)&&typeof row.raw.speed==='number');expect(samples.length).toBeGreaterThan(10);
 for(const row of samples){const old=api.evaluate(character(row)),mods=deriveStructured(row,makeContext(rows)).mechanics.modifiers||[];expect(mods.find(mod=>mod.target==='speed.walk')!.value,row.identity.key).toBe(old.speed);}
 const classes=rows.filter(row=>row.identity.kind==='class'&&['PHB','XPHB'].includes(row.identity.source));for(const row of classes){const c=character(row,3),old=api.evaluate(c),faces=deriveStructured(row,makeContext(rows)).mechanics.classModel!.hitDie!;expect(old.hitDice).toBe(`3d${faces}`);expect(old.maxHp).toBe(faces+2*(Math.floor(faces/2)+1));}
});
test.skipIf(!available)('real cantrip and cumulative spellbook capacities match classSpellChoices()',()=>{
 const samples=rows.filter(row=>row.identity.kind==='class'&&['PHB','XPHB'].includes(row.identity.source));
 for(const row of samples)for(const level of [1,3,5,10,20]){const c=character(row,level),model=deriveStructured(row,makeContext(rows)).mechanics.classModel!,choices=api.classSpellChoices(c,[]),cantrips=choices.find((choice:any)=>choice.spellKind==='cantrips'),book=choices.find((choice:any)=>choice.spellKind==='book');expect(cantrips?.count||0,`${row.identity.key}:${level}`).toBe(model.cantripProgression?.[level-1]||0);if(book)expect(book.count,`${row.identity.key}:${level}`).toBe(model.bookProgression?.[level-1]);}
});
test.skipIf(!available)('real thrown and versatile weapon modes retain damage and attack numbers',()=>{
 for(const source of ['PHB','XPHB'])for(const name of ['Dagger','Spear','Shortbow']){const row=rows.find(row=>row.identity.kind==='baseitem'&&row.identity.source===source&&row.identity.engName===name)!;expect(row).toBeDefined();const c=character(row);c.abilities.str=14;c.abilities.dex=16;c.training={weapons:'simple'};const d=api.evaluate(c),old=api.automaticWeaponAttacks(c,d).attacks,model=deriveStructured(row,makeContext(rows)).mechanics.equipmentModel!;const finesse=model.properties!.includes('F'),ability=finesse?Math.max(d.modifiers.str,d.modifiers.dex):model.weaponType==='melee'?d.modifiers.str:d.modifiers.dex;expect(old.every((attack:any)=>attack.attack_bonus===ability+d.proficiency)).toBe(true);expect(old[0].damage).toBe(`${model.damage}+${ability}`);if(model.properties!.includes('V'))expect(old.at(-1).damage).toBe(`${model.versatileDamage}+${ability}`);expect(old.length).toBe(1+(model.weaponType==='melee'&&model.properties!.includes('T')?1:0)+(model.properties!.includes('V')?1:0));}
});
test.skipIf(!available)('real 2014 and 2024 domain spell grants retain source ownership and gates',()=>{
 const spellRows=rows.filter(row=>row.identity.kind==='spell'),catalog=spellRows.map(entry);
 for(const [edition,source,level]of [['2014','PHB',5],['2024','XPHB',4]] as const){const cls=rows.find(row=>row.identity.kind==='class'&&row.identity.source===source&&row.identity.engName==='Cleric')!,domain=rows.find(row=>row.identity.kind==='subclass'&&row.identity.source===source&&row.identity.engName==='Life Domain')!;expect(domain).toBeDefined();const c=character(cls,level);c.edition=edition;c.selections.push({id:'domain',entry:entry(domain),level:1,quantity:1,equipped:false,parentId:'sample'});const old=api.planSourceSpells(c,catalog).grants.filter((grant:any)=>grant.eligible).map((grant:any)=>grant.entry.id).sort(),model=deriveStructured(domain,makeContext(rows)).mechanics.grants||[],fresh=model.filter(grant=>grant.type==='spell'&&(grant.atLevel||0)<=level).flatMap(grant=>(grant.fixed||[]).map(key=>api.entryIdentity('spell',spellRows.find(row=>row.identity.key===key)!.raw))).sort();expect(fresh,domain.identity.key).toEqual(old);}
});
test.skipIf(!available)('real Foundry empty uses and dice pools retain visible limitations rather than fake usable counters',()=>{
 const raw=JSON.parse(readFileSync('fixtures/g3/resources.json','utf8'))[0],row:Material={identity:rows.find(row=>row.identity.kind==='subclassFeature'&&row.identity.engName==='Combat Superiority'&&row.identity.source==='XPHB')!.identity,raw,namespace:'kiwee',files:['data/class/foundry.json'],expansion:'source',edition:'2024'};
 const c=character(row),old=api.planFeatureResources(c),empty=deriveStructured(row,makeContext(rows));expect(old.grants).toEqual([]);expect(empty.mechanics.resources).toBeUndefined();expect(empty.unsupported.map(reason=>reason.code)).toContain('resource-definition');
 const nested=deriveStructured({...row,raw:raw.entryData},makeContext(rows)),counter=nested.mechanics.resources![0];expect(counter.max).toEqual({formula:'floor((@class.level + 1) / 8) + 4'});expect(counter.recovery).toEqual([{period:'short',amount:'all'},{period:'long',amount:'all'}]);expect(nested.unsupported.map(reason=>reason.family)).toContain('dicePool');
 dispositions.push({identity:row.identity.key,family:'resources',difference:'Foundry dice-pool count is newly derived; dice-roll expression remains explicitly unsupported',decision:'Implement the typed counter and keep the roll-expression gap visible; do not infer a usable empty system.uses counter'});
});
test.skipIf(!available)('real starting-equipment packages preserve concrete currency and expose existing prose corrections',()=>{
 const samples=rows.filter(row=>['background','class'].includes(row.identity.kind)&&['PHB','XPHB'].includes(row.identity.source)&&(Array.isArray(row.raw.startingEquipment)||Array.isArray(row.raw.startingEquipment?.defaultData)));expect(samples.length).toBeGreaterThan(20);
 for(const row of samples){const prior=entry(row).raw.startingEquipment,old=Array.isArray(prior)?prior:prior.defaultData,model=deriveStructured(row,makeContext(rows)).mechanics.startingEquipment!;for(const [i,block]of (Array.isArray(row.raw.startingEquipment)?row.raw.startingEquipment:row.raw.startingEquipment.defaultData).entries())for(const [key,list]of Object.entries(block)){const upstream=(list as any[]).filter(item=>item?.value!==undefined||item?.containsValue!==undefined).map(item=>item.value??item.containsValue),legacy=(old[i][key] as any[]).filter(item=>item?.value!==undefined||item?.containsValue!==undefined).map(item=>item.value??item.containsValue),fresh=model.blocks.find(part=>part.key===String(i))?.options.find(option=>option.key===key)?.items.filter(part=>part.copper!==undefined).map(part=>part.copper)||[];expect(fresh,`${row.identity.key}/${i}/${key}`).toEqual(upstream);if(JSON.stringify(legacy)!==JSON.stringify(upstream))dispositions.push({identity:row.identity.key,family:'startingEquipment',path:`startingEquipment/defaultData/${i}/${key}`,upstream,legacy,difference:'The Web normalizer currently corrects a currency amount from labelled GP prose',decision:'Preserve the previously validated numeric correction in a reviewed data annotation; do not port prose inference into the protocol executor'});}}
 mkdirSync('evidence/g3',{recursive:true});writeFileSync('evidence/g3/equivalence-dispositions.json',JSON.stringify(dispositions,null,2)+'\n');
});

test.skipIf(!available)('real typed fighting-style options retain their saved answer key and catalogue identities',()=>{
 const parent=rows.find(row=>row.identity.kind==='class'&&row.identity.source==='PHB'&&row.identity.engName==='Fighter')!,feature=rows.find(row=>row.identity.kind==='classFeature'&&row.identity.source==='PHB'&&row.identity.engName==='Fighting Style')!,c=character(parent),catalog=rows.filter(row=>row.identity.kind==='optionalfeature').map(entry);c.selections.push({id:'style',entry:entry(feature),level:1,quantity:1,equipped:false,parentId:'sample'});
 const old=api.sheetChoices(c,catalog).find((choice:any)=>choice.ownerId==='style'&&choice.channel==='content'),fresh=deriveStructured(feature,makeContext(rows)).mechanics.grants!.find(grant=>grant.key!.startsWith('text-option:'))!;
 expect(old.id).toBe(`style:${fresh.key}`);expect(old.count).toBe(fresh.choose!.count);expect(old.options.map((option:any)=>option.entry.id).sort()).toEqual(fresh.choose!.from!.map(key=>{const row=rows.find(row=>row.identity.key===key)!;return api.entryIdentity('feature',row.raw);}).sort());
});
