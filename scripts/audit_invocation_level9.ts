/** Read-only, exact frozen-source replay for three reviewed 9th-level PHB invocation spells.
 * No downloaded source text, card snapshots or generated bundle enters the report.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,realpathSync,writeFileSync} from 'node:fs';
import {basename,dirname,isAbsolute,join,resolve,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const [webRoot,inputRoot,output='.cache/invocation-level9.json']=process.argv.slice(2);
if(!webRoot||!inputRoot)throw Error('Usage: audit_invocation_level9.ts WEB_ROOT FROZEN_INPUT_ROOT [OUTPUT]');
const sourceRevision='e2623b204ddbdf2bcfa8317acfc962de89c676e2';
const expectedInputs:Record<string,string>={
 'optionalfeatures.json':'031970dfac1770a548549bd30535319c2493c47ebeaedfdb6a601651bbfc3844',
 'class/class-warlock.json':'34721a04db792923cf0a19fbab3f90616093d9f6519a7cfe6f81a9eb52e775d4',
 'spells/spells-phb.json':'e1f2221020cfb5d31995c99b78dc09435c9962476ef1cef81b52399e6df0263d',
};
const additions=[
 {name:'Otherworldly Leap',spell:'Jump',page:111,spellLevel:1},
 {name:'Ascendant Step',spell:'Levitate',page:110,spellLevel:2},
 {name:'Whispers of the Grave',spell:'Speak with Dead',page:111,spellLevel:3},
];
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const json=(value:any)=>JSON.parse(JSON.stringify(value));
const git=(...args:string[])=>execFileSync('git',args,{cwd:webRoot,encoding:'utf8'}).trim();
function assertCleanSource(){
 assert.equal(git('status','--porcelain','--untracked-files=all','--ignored=matching','--','src'),'','Consumer src must be clean, including staged, untracked and ignored files');
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
assert.deepEqual(evidence.level9Prerequisite,[{level:{level:9,class:{ENG_name:'Warlock',name:'魔契师'}}}],'Consumer exact level-9 prerequisite');
const inputs:Record<string,string>={};
function input(path:string){
 const rows=index?.rows?.filter((row:any)=>row.url===`https://5e.kiwee.top/data/${path}`);
 if(index)assert.equal(rows?.length,1,'Expected exactly one frozen input '+path);
 const filename=index?rows[0].path:basename(path).replace(/\.json$/,`-${sourceRevision}.json`);
 assert.equal(typeof filename,'string','Frozen filename');
 const local=resolve(inputRoot,filename);
 assert(!isAbsolute(filename)&&local.startsWith(resolve(inputRoot)+sep),'Input must remain inside frozen directory');
 assert(realpathSync(local).startsWith(realpathSync(inputRoot)+sep),'Resolved input must remain inside frozen directory');
 const body=JSON.parse(readFileSync(local,'utf8')),sha256=hash(body);
 assert.equal(sha256,expectedInputs[path],'Frozen input mismatch '+path);
 assert.equal(sha256,evidence.inputs[path],'Consumer input mismatch '+path);
 if(index)assert.equal(sha256,rows[0].sha256,'Frozen manifest mismatch '+path);
 inputs[path]=sha256;return body;
}
const optional=input('optionalfeatures.json'),classes=input('class/class-warlock.json'),spells=input('spells/spells-phb.json');
const entryHashes:Record<string,string>={};
for(const {name,spell,page,spellLevel} of additions){
 const reference=`${name}|PHB`,rule=evidence.rules.find((row:any)=>row.reference===reference);
 assert(rule,'Reviewed invocation is absent '+reference);
 assert.equal(rule.mechanism,'spell');assert.equal(rule.spellReference,`${spell}|PHB`);assert.equal(rule.page,page);
 assert.equal(rule.spellLevel,spellLevel);assert.equal(rule.requiredClassLevel,9);assert.equal(rule.selfOnly,spellLevel!==3);
 const rows=optional.optionalfeature.filter((row:any)=>`${row.ENG_name}|${row.source}`===reference);
 assert.equal(rows.length,1,'Exact invocation source identity '+reference);
 assert.equal(rows[0].page,page);
 assert.deepEqual(rows[0].prerequisite,[{level:{level:9,class:{ENG_name:'Warlock',name:'魔契师'}}}],'Real frozen prerequisite has no class source');
 const spellRows=spells.spell.filter((row:any)=>row.ENG_name===spell&&row.source==='PHB');
 assert.equal(spellRows.length,1,'Exact spell source identity '+spell);assert.equal(spellRows[0].level,spellLevel);
 entryHashes[`${spell}|PHB`]=hash(spellRows[0]);
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
const adapter=resolve('.cache/invocation-level9-consumer.mjs');
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
const entries=api.normalizeData({...optional,...classes,...spells},'frozen-invocation-level9');
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
 card.selections=[{id:'proof-warlock',entry:structuredClone(owner),level:9,quantity:1,equipped:false}];
 card.abilities.cha=16;card.notes='Authored invocation workflow preservation probe';card.sheetBonuses={ac:3};
 card.proficiencies={persuasion:true};card.expertise={persuasion:true};card.runtime.hp=2;card.runtime.tempHp=1;
 card.runtime.resources={'manual-sentinel':{current:1,max:7},'spell-slot:1':{current:1,max:4},'spell-slot:2':{current:1,max:3},'spell-slot:3':{current:0,max:3},'pact-slot:5':{current:1,max:2}};
 sync(card,entries);return card;
}
for(const {name,spell,spellLevel} of additions){
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
  assert.equal(payments.some((payment:any)=>payment.label.includes('仅自身')),spellLevel!==3,'Self-only restriction belongs only to Jump and Levitate');
  assert.deepEqual(payments.map((p:any)=>({id:p.id,cost:p.cost,level:p.level,available:p.available,resourceId:p.resourceId})),[{id:'free',cost:0,level:spellLevel,available:true,resourceId:undefined}]);
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
 check('Warlock 8 cannot learn even with total character level 9',()=>{
  const saved=structuredClone(card),classRow=card.selections.find((row:any)=>row.id==='proof-warlock');classRow.level=8;
  card.selections.push({id:'other-class',entry:{...structuredClone(owner),id:'proof-other-class',name:'Other class',english:'Other class',raw:{name:'Other class',ENG_name:'Other class',source:'PHB',_category:'class'}},level:1,quantity:1,equipped:false});
  const choice=api.sheetChoices(card,entries).find((row:any)=>row.id===choiceId),option=choice?.options.find((row:any)=>row.value===entry.id);
  assert.equal(choice.count,4,'Three test positions remain within level-8 capacity');assert(option?.unavailable,'Class level, not character level, gates learning');
  const before=JSON.stringify(card);assert.throws(()=>api.setSheetChoiceSlot(card,choiceId,0,entry.id,entries));assert.equal(JSON.stringify(card),before);
  card=saved;
 });
 check('Explicit class learning grants only the matching free spell',()=>{api.setSheetChoiceSlot(card,choiceId,0,entry.id,entries);sync(card,entries);active();});
 const {root,child}=active(),rootId=root.id,spellId=child.id;
 const answers=JSON.stringify(card.answers),tree=json(card.selections.filter((row:any)=>row.id===rootId||row.parentId===rootId));
 check('Repeated free casts preserve spell slots, pact slots and manual counters',()=>{
  for(let i=0;i<3;i++){
   const request=api.spellActionRequest(card,spellId,'free',`free-${name}-${i}`),result=api.performSpellAction(card,request);
   assert.equal(result.status,'applied');assert.equal(result.receipt.resourceId,undefined);assert.equal(result.receipt.level,spellLevel,'Free cast uses the spell’s exact native level');
   const after=JSON.stringify(card);assert.equal(api.performSpellAction(card,request).status,'duplicate');assert.equal(JSON.stringify(card),after,'Duplicate click must not change the card');
  }
  active(rootId,spellId);
 });
 check('Unrequested paid-slot casting and source-use recovery are rejected',()=>{reject(spellId,'slot:spell-slot:1');reject(spellId,'slot:spell-slot:2');reject(spellId,'slot:spell-slot:3');reject(spellId,'slot:pact-slot:5');reject(spellId,'source','restore');});
 check('Forged canonical spell identity cannot retain a stale free-payment grant',()=>{
  const saved=structuredClone(card),row=card.selections.find((selection:any)=>selection.id===spellId);
  row.entry.english='Unreviewed Spell Identity';reject(spellId);card=saved;active(rootId,spellId);
 });
 check('Changing the spell parent immediately revokes stale free-payment eligibility',()=>{
  const saved=structuredClone(card);card.selections.find((selection:any)=>selection.id===spellId).parentId='proof-warlock';
  reject(spellId);card=saved;active(rootId,spellId);
 });
 const malformed:[string,(entry:any)=>void][]=[
  ['unknown English identity',entry=>{entry.english='Unreviewed Invocation';entry.raw.ENG_name='Unreviewed Invocation';}],
  ['different normalized source',entry=>{entry.source='TCE';}],
  ['different raw source',entry=>{entry.raw.source='TCE';}],
  ['additional prerequisite',entry=>{entry.raw.prerequisite[0].ability=[{cha:13}];}],
  ['different class prerequisite source',entry=>{entry.raw.prerequisite[0].level.class.source='PHB';}],
  ['changed level prerequisite',entry=>{entry.raw.prerequisite[0].level.level=8;}],
  ['copied record',entry=>{entry.raw._copy={name:entry.name,source:'PHB'};}],
  ['unresolved parent',entry=>{entry.raw._unresolvedParent=true;}],
 ];
 for(const [label,alter] of malformed)check('Reject '+label+' before sync and after reconciliation',()=>{
  const saved=structuredClone(card),root=learned(card,name);alter(root.entry);
  assert.equal(api.invocationRule(root.entry),undefined,'Unreviewed identity/shape must not gain reviewed mechanics');reject(spellId);
  sync(card);reject(spellId);assert(!api.planSourceSpells(card).grants.some((grant:any)=>grant.owner.id===rootId&&grant.config.sourceGrant?.usage==='free'&&grant.config.sourceGrant.active));
  card=saved;active(rootId,spellId);
 });
 check('Changing invocation parent rejects stale free casting',()=>{
  const saved=structuredClone(card);learned(card,name).parentId='proof-warlock';reject(spellId);sync(card);reject(spellId);card=saved;active(rootId,spellId);
 });
 check('Changing the owner away from PHB Warlock rejects free casting',()=>{
  const saved=structuredClone(card),classRow=card.selections.find((row:any)=>row.id==='proof-warlock');classRow.entry.source='TCE';classRow.entry.raw.source='TCE';
  reject(spellId);sync(card);reject(spellId);card=saved;active(rootId,spellId);
 });
 check('Manual same-name invocation stays manual and cannot inherit the class free grant',()=>{
  const saved=structuredClone(card);card=baseCard();
  const manualInvocation={id:'manual-same-invocation',entry:structuredClone(entry),level:9,quantity:1,equipped:false};
  card.selections.push(manualInvocation);sync(card,entries);
  assert.deepEqual(card.selections.find((row:any)=>row.id===manualInvocation.id),manualInvocation);
  assert(!api.planSourceSpells(card,entries).grants.some((grant:any)=>grant.owner.id===manualInvocation.id&&grant.config.sourceGrant?.usage==='free'));
  const before=JSON.stringify(card);assert.throws(()=>api.setSheetChoiceSlot(card,choiceId,0,entry.id,entries));assert.equal(JSON.stringify(card),before);card=saved;
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
 check('Warlock 9 to 8 rejects stale payment before sync and archives within-capacity selection',()=>{
  card.selections.find((row:any)=>row.id==='proof-warlock').level=8;reject(spellId);sync(card);reject(spellId);
  assert.equal(learned(card,name),undefined);assert.deepEqual(json(card.classChoiceArchive[rootId].selections),tree);assert.equal(JSON.stringify(card.answers),answers);
 });
 check('Native reopen at Warlock 8 retains archived intent without a free payment',()=>{card=reopen(card);sync(card);reject(spellId);assert.equal(learned(card,name),undefined);assert.equal(JSON.stringify(card.answers),answers);});
 check('Warlock 9 restore after native reopen recovers the same owned spell',()=>{card.selections.find((row:any)=>row.id==='proof-warlock').level=9;sync(card);active(rootId,spellId);});
 check('Replacing learned invocation revokes old free payment only',()=>{
  api.setSheetChoiceSlot(card,choiceId,0,replacement.id,entries);sync(card,entries);assert.equal(learned(card,name),undefined);reject(spellId);assert(learned(card,replacement.english));
 });
 check('Relearning after replacement restores archived identities without catalog',()=>{card=reopen(card);api.setSheetChoiceSlot(card,choiceId,0,entry.id,[]);sync(card);active(rootId,spellId);});
 check('Explicit withdrawal revokes casting but retains manual same-name spell',()=>{api.setSheetChoiceSlot(card,choiceId,0,undefined,[]);sync(card);assert.equal(learned(card,name),undefined);reject(spellId);});
 check('Relearning after withdrawal does not duplicate or replenish resources',()=>{card=reopen(card);api.setSheetChoiceSlot(card,choiceId,0,entry.id,[]);sync(card);active(rootId,spellId);});
 check('Deleting the class removes its grants but leaves independent manual spell',()=>{api.removeSelection(card,'proof-warlock');sync(card);assert.equal(learned(card,name),undefined);reject(spellId);assert.equal(card.selections.filter((row:any)=>row.grantKey?.startsWith('source-spell:')).length,0);});
}

// All three are deliberately in the first three slots: level 8 still permits
// four invocations, so quota truncation cannot conceal a missing level gate.
let combined=baseCard();
for(const [slot,{name}] of additions.entries()){api.setSheetChoiceSlot(combined,choiceId,slot,find('feature',name).id,entries);sync(combined,entries);}
const combinedResources=json(combined.runtime.resources),combinedAnswers=json(combined.answers);
const combinedIds=additions.map(({name,spellLevel})=>{const root=learned(combined,name);assert(root);const children=granted(combined,root.id);assert.equal(children.length,1);return {name,spellLevel,rootId:root.id,spellId:children[0].id,tree:json([root,...children])};});
assert.equal(combined.selections.filter((row:any)=>row.grantKey?.startsWith('source-spell:')).length,3);
combined.selections.find((row:any)=>row.id==='proof-warlock').level=8;
assert.equal(api.sheetChoices(combined,entries).find((row:any)=>row.id===choiceId).count,4);
for(const row of combinedIds){
 const before=JSON.stringify(combined);assert.deepEqual(api.spellPayments(combined,row.spellId).options,[]);
 assert.equal(api.performSpellAction(combined,api.spellActionRequest(combined,row.spellId,'free',`combined-before-sync-${row.name}`)).status,'rejected');
 assert.equal(JSON.stringify(combined),before,'Level-8 stale payment must reject without mutation');
}
sync(combined);
for(const row of combinedIds){assert.equal(learned(combined,row.name),undefined);assert.deepEqual(json(combined.classChoiceArchive[row.rootId].selections),row.tree);}
combined=reopen(combined);sync(combined);
for(const row of combinedIds)assert.deepEqual(api.spellPayments(combined,row.spellId).options,[]);
assert.deepEqual(json(combined.answers),combinedAnswers);
combined.selections.find((row:any)=>row.id==='proof-warlock').level=9;sync(combined);
for(const row of combinedIds){assert.equal(learned(combined,row.name).id,row.rootId);assert.equal(granted(combined,row.rootId)[0].id,row.spellId);assert.equal(api.spellPayments(combined,row.spellId).options[0]?.level,row.spellLevel);}
assert.deepEqual(json(combined.runtime.resources),combinedResources);api.validateCharacter(json(combined));
steps.push({rule:'PHB level-9 invocation prerequisite',label:'First three slots simultaneously reject at 8 before sync, archive and reopen at 8, restore exact IDs at 9 without quota masking',passed:true,manualDataPreserved:true});

assert.equal(git('rev-parse','HEAD'),consumerRevision,'Consumer revision changed during replay');assertCleanSource();
const report={
 schemaVersion:1,updatedAt:new Date().toISOString(),consumerRevision,producerRevision,sourceRevision,inputs,entryHashes,
 rules:additions.map(({name})=>`${name}|PHB`),steps,
 definition:'Bounded exact-source consumer API workflow proof; not complete class/spell automation, browser coverage or release certification',
 manualBoundaries:[
  'Otherworldly Leap: self-only targeting and material-component exemption are stated boundaries; jump distance, movement and duration remain manual',
  'Ascendant Step: self-only targeting and material-component exemption are stated boundaries; vertical movement, concentration, duration and descent remain manual',
  'Whispers of the Grave: material components are still required; corpse eligibility, ten-day restriction, questions, answers and duration remain manual',
  'Invocation replacement timing and DM eligibility adjudication are not automatically authorized',
 ],
 browser:'not-run',currentReleaseAvailable:null,
};
mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,consumerRevision,passed:steps.length,failed:0}));
