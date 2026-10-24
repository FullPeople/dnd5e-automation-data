/** Read-only, exact frozen-source replay for three reviewed PHB invocation spells.
 * No downloaded source text, card snapshots or generated bundle enters the report.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {basename,dirname,isAbsolute,join,resolve,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const [webRoot,inputRoot,output='.cache/invocation-spells.json']=process.argv.slice(2);
if(!webRoot||!inputRoot)throw Error('Usage: audit_invocation_spells.ts WEB_ROOT FROZEN_INPUT_ROOT [OUTPUT]');
const sourceRevision='e2623b204ddbdf2bcfa8317acfc962de89c676e2';
const expectedInputs:Record<string,string>={
 'optionalfeatures.json':'031970dfac1770a548549bd30535319c2493c47ebeaedfdb6a601651bbfc3844',
 'class/class-warlock.json':'34721a04db792923cf0a19fbab3f90616093d9f6519a7cfe6f81a9eb52e775d4',
 'spells/spells-phb.json':'e1f2221020cfb5d31995c99b78dc09435c9962476ef1cef81b52399e6df0263d',
};
const additions=[
 {name:'Beast Speech',spell:'Speak with Animals'},
 {name:'Mask of Many Faces',spell:'Disguise Self'},
 {name:'Misty Visions',spell:'Silent Image'},
];
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const json=(value:any)=>JSON.parse(JSON.stringify(value));
const git=(...args:string[])=>execFileSync('git',args,{cwd:webRoot,encoding:'utf8'}).trim();
function assertCleanSource(){
 assert.equal(git('status','--porcelain','--untracked-files=all','--','src'),'','Consumer src must be clean, including staged and untracked files');
}
assertCleanSource();
const consumerRevision=git('rev-parse','HEAD');
const producerRevision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
assert.match(consumerRevision,/^[a-f0-9]{40}$/);
const evidence=JSON.parse(readFileSync(join(webRoot,'src/core/automation/invocationEvidence.json'),'utf8'));
assert.equal(evidence.frozenRevision,sourceRevision,'Consumer source revision');
assert.deepEqual(evidence.inputs,expectedInputs,'Consumer canonical input hashes');
const indexPath=join(inputRoot,'index.json');
const index=existsSync(indexPath)?JSON.parse(readFileSync(indexPath,'utf8')):undefined;
const inputs:Record<string,string>={};
function input(path:string){
 const rows=index?.rows?.filter((row:any)=>row.url===`https://5e.kiwee.top/data/${path}`);
 if(index)assert.equal(rows?.length,1,'Expected exactly one frozen input '+path);
 const filename=index?rows[0].path:basename(path).replace(/\.json$/,`-${sourceRevision}.json`);
 assert.equal(typeof filename,'string','Frozen filename');
 const local=resolve(inputRoot,filename);
 assert(!isAbsolute(filename)&&local.startsWith(resolve(inputRoot)+sep),'Input must remain inside frozen directory');
 const body=JSON.parse(readFileSync(local,'utf8')),sha256=hash(body);
 assert.equal(sha256,expectedInputs[path],'Frozen input mismatch '+path);
 assert.equal(sha256,evidence.inputs[path],'Consumer input mismatch '+path);
 if(index)assert.equal(sha256,rows[0].sha256,'Frozen manifest mismatch '+path);
 inputs[path]=sha256;return body;
}
const optional=input('optionalfeatures.json'),classes=input('class/class-warlock.json'),spells=input('spells/spells-phb.json');
const entryHashes:Record<string,string>={};
for(const {name,spell} of additions){
 const reference=`${name}|PHB`,rule=evidence.rules.find((row:any)=>row.reference===reference);
 assert(rule,'Reviewed invocation is absent '+reference);
 assert.equal(rule.mechanism,'spell');assert.equal(rule.spellReference,`${spell}|PHB`);
 const rows=optional.optionalfeature.filter((row:any)=>`${row.ENG_name}|${row.source}`===reference);
 assert.equal(rows.length,1,'Exact invocation source identity '+reference);
 entryHashes[reference]=hash(rows[0]);
 assert.equal(entryHashes[reference],evidence.entryHashes[reference],'Reviewed invocation entry hash '+reference);
}
for(const [reference,rows] of [
 ['Warlock|PHB',classes.class.filter((row:any)=>row.ENG_name==='Warlock'&&row.source==='PHB')],
 ['Eldritch Invocations|Warlock|PHB|2',classes.classFeature.filter((row:any)=>row.ENG_name==='Eldritch Invocations'&&row.source==='PHB'&&row.level===2)],
] as const){
 assert.equal(rows.length,1,'Exact class source identity '+reference);
 entryHashes[reference]=hash(rows[0]);assert.equal(entryHashes[reference],evidence.entryHashes[reference],'Reviewed owner entry hash '+reference);
}

mkdirSync('.cache',{recursive:true});
const adapter=resolve('.cache/invocation-spell-consumer.mjs');
const exports:Record<string,string[]>={
 'src/core/model.ts':['newCharacter'],
 'src/core/automation/state.ts':['newAutomationState'],
 'src/data/catalog.ts':['normalizeData'],
 'src/core/sheet.ts':['syncFeatures','removeSelection'],
 'src/core/automation/choices.ts':['sheetChoices','setSheetChoiceSlot'],
 'src/core/automation/invocations.ts':['invocationRule'],
 'src/core/automation/sourceSpells.ts':['syncSourceSpells','planSourceSpells'],
 'src/core/automation/actions.ts':['spellPayments','spellActionRequest','performSpellAction'],
 'src/core/specialSpells.ts':['setSpecialSpell','changeSpecialSpellUses','specialSpellResource'],
 'src/core/engine.ts':['evaluate'],
 'src/core/export.ts':['exportCharacter'],
 'src/core/validation.ts':['readCharacter','validateCharacter'],
};
await build({stdin:{contents:Object.entries(exports).map(([path,names])=>`export {${names.join(',')}} from ${JSON.stringify(resolve(webRoot,path))};`).join('\n'),resolveDir:resolve(webRoot),loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:adapter,define:{'import.meta.env.MODE':'"standalone"','import.meta.env.DEV':'false'}});
const api=await import(pathToFileURL(adapter).href);
const entries=api.normalizeData({...optional,...classes,...spells},'frozen-invocation-spells');
const find=(kind:string,name:string)=>{
 const rows=entries.filter((entry:any)=>entry.kind===kind&&entry.english===name&&entry.source==='PHB');
 assert.equal(rows.length,1,'Unique normalized PHB entry '+name);return rows[0];
};
const owner=find('class','Warlock'),replacement=find('feature','Beguiling Influence');
const steps:{rule:string;label:string;passed:true;manualDataPreserved:true}[]=[];
const sync=(card:any,catalog:any[]=[])=>{api.syncFeatures(card,catalog);api.syncSourceSpells(card,catalog);};
const reopen=(card:any)=>{
 const loaded=api.readCharacter(json(api.exportCharacter(card)));
 assert.deepEqual(loaded.repaired,[],'Native roundtrip must not need repair');return loaded.character;
};
const choiceId='proof-warlock:class-optional:0';
const learned=(card:any,name:string)=>card.selections.find((row:any)=>row.entry.english===name&&row.grantKey?.startsWith('choice:'));
const granted=(card:any,rootId:string)=>card.selections.filter((row:any)=>row.parentId===rootId&&row.grantKey?.startsWith('source-spell:'));
function baseCard(){
 const card=api.newCharacter('2014');card.automation=api.newAutomationState();card.profile.enabledSources=['PHB'];
 card.selections=[{id:'proof-warlock',entry:structuredClone(owner),level:5,quantity:1,equipped:false}];
 card.abilities.cha=16;card.notes='Authored invocation workflow preservation probe';card.sheetBonuses={ac:3};
 card.proficiencies={persuasion:true};card.expertise={persuasion:true};card.runtime.hp=2;card.runtime.tempHp=1;
 card.runtime.resources={'manual-sentinel':{current:1,max:7},'spell-slot:1':{current:1,max:4},'pact-slot:3':{current:1,max:2}};
 sync(card,entries);return card;
}
for(const {name,spell} of additions){
 const reference=`${name}|PHB`,entry=find('feature',name),spellEntry=find('spell',spell);
 assert.equal(api.invocationRule(entry)?.reference,reference,'Consumer reviewed rule '+reference);
 let card=baseCard();
 card.selections.push({id:'manual-same-spell',entry:structuredClone(spellEntry),level:1,quantity:1,equipped:false});
 assert.equal(api.setSpecialSpell(card,'manual-same-spell',{mode:'uses',max:5,recovery:'manual'}),true);
 api.changeSpecialSpellUses(card,'manual-same-spell',1);
 const preserved=(c:any)=>json({abilities:c.abilities,notes:c.notes,hp:c.runtime.hp,tempHp:c.runtime.tempHp,resources:c.runtime.resources,sheetBonuses:c.sheetBonuses,proficiencies:c.proficiencies,expertise:c.expertise,manualRow:c.selections.find((row:any)=>row.id==='manual-same-spell'),manualSpell:c.spellSettings?.special?.['manual-same-spell']});
 const manual=preserved(card),initialAc=api.evaluate(card).ac;
 const check=(label:string,fn:()=>void)=>{
  fn();assert.deepEqual(preserved(card),manual,label+' must preserve authored data and paid resources');
  api.validateCharacter(json(card));steps.push({rule:reference,label,passed:true,manualDataPreserved:true});
 };
 const active=(rootId?:string,spellId?:string)=>{
  const root=learned(card,name);assert(root,'Explicit learning record '+name);if(rootId)assert.equal(root.id,rootId);
  const children=granted(card,root.id);assert.equal(children.length,1,'Exactly one owned spell');const child=children[0];
  if(spellId)assert.equal(child.id,spellId);assert.equal(child.entry.id,spellEntry.id);assert.equal(child.entry.edition,'2014');
  const config=card.spellSettings.special[child.id];assert.equal(config.sourceGrant.ownerId,root.id);
  assert.equal(config.sourceGrant.usage,'free');assert.equal(config.sourceGrant.canUseSlots,false);
  const before=JSON.stringify(card),payments=api.spellPayments(card,child.id).options;
  assert.deepEqual(payments.map((p:any)=>({id:p.id,cost:p.cost,level:p.level,available:p.available,resourceId:p.resourceId})),[{id:'free',cost:0,level:1,available:true,resourceId:undefined}]);
  api.planSourceSpells(card);api.sheetChoices(card,[]);assert.equal(api.evaluate(card).ac,initialAc,'No automatic spell-effect or armor projection');
  assert.equal(JSON.stringify(card),before,'Planning and payment menus are pure');
  assert(!api.spellPayments(card,'manual-same-spell').options.some((p:any)=>p.id==='free'),'Manual same-name spell must not inherit free payment');
  return {root,child};
 };
 const reject=(selectionId:string,paymentId='free',mode='cast')=>{
  const before=JSON.stringify(card),request=api.spellActionRequest(card,selectionId,paymentId,`reject-${steps.length}`,mode);
  assert.equal(api.performSpellAction(card,request).status,'rejected');assert.equal(JSON.stringify(card),before,'Rejected actions must be transactional');
 };
 check('Unlearned options and same-name manual spell create no automatic grant',()=>{
  assert.equal(learned(card,name),undefined);assert.equal(card.selections.filter((row:any)=>row.grantKey?.startsWith('source-spell:')).length,0);
  const before=JSON.stringify(card),choice=api.sheetChoices(card,entries).find((row:any)=>row.id===choiceId);
  assert(choice?.options.find((option:any)=>option.value===entry.id)?.grant,'Real source-qualified learn option');
  api.planSourceSpells(card,entries);api.evaluate(card);assert.equal(JSON.stringify(card),before);reject('manual-same-spell');
 });
 check('Explicit class learning grants only the matching free spell',()=>{api.setSheetChoiceSlot(card,choiceId,0,entry.id,entries);sync(card,entries);active();});
 const {root,child}=active(),rootId=root.id,spellId=child.id;
 const answers=JSON.stringify(card.answers),tree=json(card.selections.filter((row:any)=>row.id===rootId||row.parentId===rootId));
 check('Repeated free casts preserve spell slots, pact slots and manual counters',()=>{
  for(let i=0;i<3;i++){
   const request=api.spellActionRequest(card,spellId,'free',`free-${name}-${i}`),result=api.performSpellAction(card,request);
   assert.equal(result.status,'applied');assert.equal(result.receipt.resourceId,undefined);
   const after=JSON.stringify(card);assert.equal(api.performSpellAction(card,request).status,'duplicate');assert.equal(JSON.stringify(card),after,'Duplicate click must not change the card');
  }
  active(rootId,spellId);
 });
 check('Unrequested paid-slot casting and source-use recovery are rejected',()=>{reject(spellId,'slot:spell-slot:1');reject(spellId,'slot:pact-slot:3');reject(spellId,'source','restore');});
 check('Forged canonical spell identity cannot retain a stale free-payment grant',()=>{
  const saved=structuredClone(card),row=card.selections.find((selection:any)=>selection.id===spellId);
  row.entry.english='Unreviewed Spell Identity';reject(spellId);card=saved;active(rootId,spellId);
 });
 check('Changing the spell parent immediately revokes stale free-payment eligibility',()=>{
  const saved=structuredClone(card);card.selections.find((selection:any)=>selection.id===spellId).parentId='proof-warlock';
  reject(spellId);card=saved;active(rootId,spellId);
 });
 check('Native save/reopen and repeated offline sync retain exact grant identities',()=>{
  card=reopen(card);for(let i=0;i<3;i++)sync(card);active(rootId,spellId);assert.equal(JSON.stringify(card.answers),answers);
  assert.deepEqual(json(card.selections.filter((row:any)=>row.id===rootId||row.parentId===rootId)),tree);
 });
 check('Automation off immediately blocks free casting without touching saved intent',()=>{card.automation.enabled=false;reject(spellId);sync(card);assert.equal(JSON.stringify(card.answers),answers);});
 check('Automation on restores one grant without catalog or replenishment',()=>{card=reopen(card);card.automation.enabled=true;sync(card);active(rootId,spellId);});
 check('Source disable immediately rejects payment and archives owned spell',()=>{
  card.profile.enabledSources=[];reject(spellId);sync(card);assert.equal(learned(card,name),undefined);
  assert.deepEqual(json(card.classChoiceArchive[rootId].selections),tree);assert.equal(JSON.stringify(card.answers),answers);
 });
 check('Reopen while source-disabled preserves archive and consumed resources',()=>{card=reopen(card);sync(card);reject(spellId);assert.equal(learned(card,name),undefined);});
 check('Source restore offline reuses exact saved grant and spell IDs',()=>{card.profile.enabledSources=['PHB'];sync(card);active(rootId,spellId);assert.equal(JSON.stringify(card.answers),answers);});
 check('Level downgrade suspends learned spell without deleting the answer',()=>{card.selections.find((row:any)=>row.id==='proof-warlock').level=1;sync(card);reject(spellId);assert.equal(learned(card,name),undefined);assert.equal(JSON.stringify(card.answers),answers);});
 check('Level restore after native reopen recovers the same owned spell',()=>{card=reopen(card);card.selections.find((row:any)=>row.id==='proof-warlock').level=5;sync(card);active(rootId,spellId);});
 check('Replacing learned invocation revokes old free payment only',()=>{
  api.setSheetChoiceSlot(card,choiceId,0,replacement.id,entries);sync(card,entries);assert.equal(learned(card,name),undefined);reject(spellId);assert(learned(card,replacement.english));
 });
 check('Relearning after replacement restores archived identities without catalog',()=>{card=reopen(card);api.setSheetChoiceSlot(card,choiceId,0,entry.id,[]);sync(card);active(rootId,spellId);});
 check('Explicit withdrawal revokes casting but retains manual same-name spell',()=>{api.setSheetChoiceSlot(card,choiceId,0,undefined,[]);sync(card);assert.equal(learned(card,name),undefined);reject(spellId);});
 check('Relearning after withdrawal does not duplicate or replenish resources',()=>{card=reopen(card);api.setSheetChoiceSlot(card,choiceId,0,entry.id,[]);sync(card);active(rootId,spellId);});
 check('Deleting the class removes its grants but leaves independent manual spell',()=>{api.removeSelection(card,'proof-warlock');sync(card);assert.equal(learned(card,name),undefined);reject(spellId);assert.equal(card.selections.filter((row:any)=>row.grantKey?.startsWith('source-spell:')).length,0);});
}

// Exercise all three additions together against the real 5th-level capacity.
const combined=baseCard();
for(const [slot,{name}] of additions.entries()){api.setSheetChoiceSlot(combined,choiceId,slot,find('feature',name).id,entries);sync(combined,entries);}
const combinedResources=json(combined.runtime.resources);
const combinedIds=additions.map(({name})=>{const root=learned(combined,name);assert(root);const children=granted(combined,root.id);assert.equal(children.length,1);return {name,rootId:root.id,spellId:children[0].id};});
assert.equal(combined.selections.filter((row:any)=>row.grantKey?.startsWith('source-spell:')).length,3);
combined.selections.find((row:any)=>row.id==='proof-warlock').level=4;sync(combined);
for(const [slot,row] of combinedIds.entries())assert.equal(api.spellPayments(combined,row.spellId).options.some((p:any)=>p.id==='free'),slot<2,'Only the third grant exceeds the 4th-level capacity');
const restored=reopen(combined);restored.selections.find((row:any)=>row.id==='proof-warlock').level=5;sync(restored);
for(const row of combinedIds){assert.equal(learned(restored,row.name).id,row.rootId);assert.equal(granted(restored,row.rootId)[0].id,row.spellId);assert.equal(api.spellPayments(restored,row.spellId).options[0]?.id,'free');}
assert.deepEqual(json(restored.runtime.resources),combinedResources);api.validateCharacter(json(restored));
steps.push({rule:'PHB invocation progression',label:'Three simultaneous learned spells: level 5 to 4 parks only the third; offline reopen and level 5 restore all exact IDs',passed:true,manualDataPreserved:true});

assert.equal(git('rev-parse','HEAD'),consumerRevision,'Consumer revision changed during replay');assertCleanSource();
const report={
 schemaVersion:1,updatedAt:new Date().toISOString(),consumerRevision,producerRevision,sourceRevision,inputs,entryHashes,
 rules:additions.map(({name})=>`${name}|PHB`),steps,
 definition:'Bounded exact-source consumer API workflow proof; not complete class/spell automation, browser coverage or release certification',
 manualBoundaries:[
  'Beast Speech: animal targeting, understanding, conversation content and duration remain manual',
  'Mask of Many Faces: chosen appearance, physical inspection, Investigation checks and duration remain manual',
  'Misty Visions: material-component exemption is a stated boundary; illusion placement, manipulation, interactions, Investigation checks, concentration and duration remain manual',
  'Invocation replacement timing and DM eligibility adjudication are not automatically authorized',
 ],
 browser:'not-run',currentReleaseAvailable:null,
};
mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,consumerRevision,passed:steps.length,failed:0}));
