/** Read-only, exact frozen-source replay for three remaining reviewed PHB at-will invocation spells.
 * No downloaded source text, card snapshots or generated bundle enters the report.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,realpathSync,writeFileSync} from 'node:fs';
import {basename,dirname,isAbsolute,join,resolve,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const [webRoot,inputRoot,output='.cache/invocation-atwill.json']=process.argv.slice(2);
if(!webRoot||!inputRoot)throw Error('Usage: audit_invocation_atwill.ts WEB_ROOT FROZEN_INPUT_ROOT [OUTPUT]');
const sourceRevision='e2623b204ddbdf2bcfa8317acfc962de89c676e2';
const expectedInputs:Record<string,string>={
 'optionalfeatures.json':'031970dfac1770a548549bd30535319c2493c47ebeaedfdb6a601651bbfc3844',
 'class/class-warlock.json':'34721a04db792923cf0a19fbab3f90616093d9f6519a7cfe6f81a9eb52e775d4',
 'spells/spells-phb.json':'e1f2221020cfb5d31995c99b78dc09435c9962476ef1cef81b52399e6df0263d',
};
const additions=[
 {name:'Fiendish Vigor',spell:'False Life',chinese:'虚假生命',page:111,spellLevel:1,level:2,selfOnly:true,materials:'waived',entryHash:'2ee65d3e6f574dbf89909617ee0401a97ca2cd209b4054e385e69f9bf12a4a47',spellHash:'05126f60c10a2a74bb62a6df5f1ccb86b28a28b5fbb9277f59dbaeecff2fd745'},
 {name:'Master of Myriad Forms',spell:'Alter Self',chinese:'变身术',page:111,spellLevel:2,level:15,selfOnly:true,materials:'absent',entryHash:'1b140781b1dae4ddd4117ee454984e7156ed8ef767330c7f8a2b58e232b950bb',spellHash:'ecc05d8ae14df11abbdf8e468666f813cebd1c9b9f9478c5d52058ecdde677d3'},
 {name:'Visions of Distant Realms',spell:'Arcane Eye',chinese:'秘法眼',page:111,spellLevel:4,level:15,selfOnly:false,materials:'required',entryHash:'757d3105f2fa1ec7a2f94ef3413389f4adf0c806deb938909012c68b61567200',spellHash:'08bc21c42b722e8185524b350534af02631f6f42f4a9c72ce15a9837197e242d'},
];
const prerequisite=(level:number)=>level===2?undefined:[{level:{level,class:{ENG_name:'Warlock',name:'魔契师'}}}];
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const json=(value:any)=>JSON.parse(JSON.stringify(value));
const git=(...args:string[])=>execFileSync('git',args,{cwd:webRoot,encoding:'utf8'}).trim();
function assertCleanSource(){
 assert.equal(git('status','--porcelain','--untracked-files=all','--ignored=matching','--','src'),'','Consumer src must be clean, including staged, untracked and ignored files');
}
assertCleanSource();
const consumerRevision=git('rev-parse','HEAD'),consumerSourceTree=git('rev-parse','HEAD:src');
const producerRevision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
assert.match(consumerRevision,/^[a-f0-9]{40}$/);
const evidence=JSON.parse(readFileSync(join(webRoot,'src/core/automation/invocationEvidence.json'),'utf8'));
assert.equal(evidence.frozenRevision,sourceRevision,'Consumer source revision');
assert.deepEqual(evidence.inputs,expectedInputs,'Consumer canonical input hashes');
const indexPath=join(inputRoot,'index.json');
const index=existsSync(indexPath)?JSON.parse(readFileSync(indexPath,'utf8')):undefined;
const atwillEvidence=JSON.parse(readFileSync(join(webRoot,'src/core/automation/invocationAtWillEvidence.json'),'utf8'));
assert.equal(atwillEvidence.frozenRevision,sourceRevision,'Consumer at-will source revision');
assert.deepEqual(atwillEvidence.rules.map((row:any)=>row.reference),additions.map(row=>`${row.name}|PHB`),'Consumer exactly three reviewed at-will identities');
for(const addition of additions){
 const rule=atwillEvidence.rules.find((row:any)=>row.reference===`${addition.name}|PHB`);
 assert.deepEqual({reference:rule.reference,mechanism:rule.mechanism,page:rule.page,spell:rule.spell,spellReference:rule.spellReference,spellLevel:rule.spellLevel,requiredClassLevel:rule.requiredClassLevel,selfOnly:rule.selfOnly,payment:rule.payment},{reference:`${addition.name}|PHB`,mechanism:'spell',page:111,spell:addition.chinese,spellReference:`${addition.spell}|PHB`,spellLevel:addition.spellLevel,requiredClassLevel:addition.level===2?undefined:addition.level,selfOnly:addition.selfOnly,payment:undefined},'Consumer exact at-will mechanical evidence '+addition.name);
 assert.equal(atwillEvidence.entryHashes[`${addition.name}|PHB`],addition.entryHash,'Consumer independently reviewed invocation hash');
 assert.equal(atwillEvidence.entryHashes[`${addition.spell}|PHB`],addition.spellHash,'Consumer independently reviewed spell hash');
}

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
for(const {name,spell,chinese,page,spellLevel,level,selfOnly,materials,entryHash,spellHash} of additions){
 const reference=`${name}|PHB`,rows=optional.optionalfeature.filter((row:any)=>`${row.ENG_name}|${row.source}`===reference);
 assert.equal(rows.length,1,'Exact invocation source identity '+reference);assert.equal(rows[0].page,page);
 assert.deepEqual(rows[0].featureType,['EI']);assert.deepEqual(rows[0].prerequisite,prerequisite(level),'Exact reviewed prerequisite including absence of class source');
 assert.deepEqual(rows[0].additionalSpells,[{innate:{_:[chinese]}}],'Exact at-will spell declaration');
 const spellRows=spells.spell.filter((row:any)=>row.ENG_name===spell&&row.source==='PHB');
 assert.equal(spellRows.length,1,'Exact spell source identity '+spell);assert.equal(spellRows[0].level,spellLevel);
 assert.equal(spellRows[0].range.distance.type==='self',selfOnly,'Self-only comes from exact spell range');
 assert.equal(!!spellRows[0].components.m,materials!=='absent','Actual material component shape');
 assert.equal(spellRows[0].components.v,true);assert.equal(spellRows[0].components.s,true);
 assert.equal(JSON.stringify(rows[0].entries).includes('材料'),materials==='waived','Only Fiendish Vigor waives material components');
 entryHashes[reference]=hash(rows[0]);entryHashes[`${spell}|PHB`]=hash(spellRows[0]);
 assert.equal(entryHashes[reference],entryHash,'Independent reviewed invocation entry hash '+reference);
 assert.equal(entryHashes[`${spell}|PHB`],spellHash,'Independent reviewed spell entry hash '+spell);
}
for(const [reference,rows,expectedHash] of [
 ['Warlock|PHB',classes.class.filter((row:any)=>row.ENG_name==='Warlock'&&row.source==='PHB'),'179a4e48b79fef7ae2244e88e614d04a0828caca4a854b6f65de61b6df802385'],
 ['Eldritch Invocations|Warlock|PHB|2',classes.classFeature.filter((row:any)=>row.ENG_name==='Eldritch Invocations'&&row.source==='PHB'&&row.level===2),'a482142444ed3639690525945c024d4b2476ac84bbe5e981ef3f7f0d323eaa8f'],
] as const){
 assert.equal(rows.length,1,'Exact class source identity '+reference);
 entryHashes[reference]=hash(rows[0]);assert.equal(entryHashes[reference],expectedHash,'Independent reviewed owner entry hash '+reference);
 assert.equal(entryHashes[reference],evidence.entryHashes[reference],'Consumer reviewed owner entry hash '+reference);
}

mkdirSync('.cache',{recursive:true});
const adapter=resolve('.cache/invocation-atwill-consumer.mjs');
const exports:Record<string,string[]>={
 'src/core/model.ts':['newCharacter'],
 'src/core/automation/state.ts':['newAutomationState'],
 'src/data/catalog.ts':['normalizeData'],
 'src/core/sheet.ts':['syncFeatures','removeSelection'],
 'src/core/automation/choices.ts':['sheetChoices','setSheetChoiceSlot'],
 'src/core/automation/invocations.ts':['invocationRule'],
 'src/core/automation/sourceSpells.ts':['syncSourceSpells','planSourceSpells'],
 'src/core/automation/actions.ts':['spellPayments','spellActionRequest','performSpellAction','sourceSpellRestPlan','sourceSpellRestoreOffer'],
 'src/core/specialSpells.ts':['setSpecialSpell','changeSpecialSpellUses','specialSpellResource'],
 'src/core/engine.ts':['evaluate'],
 'src/core/export.ts':['exportCharacter'],
 'src/core/validation.ts':['readCharacter','validateCharacter'],
};
await build({stdin:{contents:Object.entries(exports).map(([path,names])=>`export {${names.join(',')}} from ${JSON.stringify(resolve(webRoot,path))};`).join('\n'),resolveDir:resolve(webRoot),loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:adapter,define:{'import.meta.env.MODE':'"standalone"','import.meta.env.DEV':'false'}});
const api=await import(pathToFileURL(adapter).href);
const entries=api.normalizeData({...optional,...classes,...spells},'frozen-invocation-atwill');
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
function baseCard(level=15){
 const card=api.newCharacter('2014');card.automation=api.newAutomationState();card.profile.enabledSources=['PHB'];
 card.selections=[{id:'proof-warlock',entry:structuredClone(owner),level,quantity:1,equipped:false}];
 card.abilities.cha=16;card.notes='Authored invocation workflow preservation probe';card.sheetBonuses={ac:3};
 card.proficiencies={persuasion:true};card.expertise={persuasion:true};card.runtime.hp=2;card.runtime.tempHp=1;
 card.runtime.resources={'manual-sentinel':{current:1,max:7},'spell-slot:1':{current:1,max:4},'spell-slot:2':{current:1,max:3},'spell-slot:3':{current:0,max:3},'spell-slot:4':{current:1,max:2},'pact-slot:5':{current:1,max:2}};
 sync(card,entries);return card;
}
for(const {name,spell,spellLevel,level,selfOnly,materials} of additions){
 const reference=`${name}|PHB`,entry=find('feature',name),spellEntry=find('spell',spell);
 assert.equal(api.invocationRule(entry)?.reference,reference,'Consumer reviewed rule '+reference);
 let card=baseCard(level);
 card.selections.push({id:'manual-same-spell',entry:structuredClone(spellEntry),level:1,quantity:1,equipped:false});
 assert.equal(api.setSpecialSpell(card,'manual-same-spell',{mode:'uses',max:5,recovery:'manual'}),true);
 api.changeSpecialSpellUses(card,'manual-same-spell',1);
 const preserved=(c:any)=>json({abilities:c.abilities,notes:c.notes,hp:c.runtime.hp,tempHp:c.runtime.tempHp,resources:c.runtime.resources,sheetBonuses:c.sheetBonuses,proficiencies:c.proficiencies,expertise:c.expertise,manualRow:c.selections.find((row:any)=>row.id==='manual-same-spell'),manualSpell:c.spellSettings?.special?.['manual-same-spell']});
 const manual=preserved(card),initialAc=api.evaluate(card).ac;
 const check=(label:string,fn:()=>void)=>{
  try{fn();assert.deepEqual(preserved(card),manual,label+' must preserve authored data and paid resources');}
  catch(error){throw Error(reference+': '+label,{cause:error});}
  api.validateCharacter(json(card));steps.push({rule:reference,label,passed:true,manualDataPreserved:true});
 };
 const active=(rootId?:string,spellId?:string)=>{
  const root=learned(card,name);assert(root,'Explicit learning record '+name);if(rootId)assert.equal(root.id,rootId);
  const children=granted(card,root.id);assert.equal(children.length,1,'Exactly one owned spell');const child=children[0];
  if(spellId)assert.equal(child.id,spellId);assert.equal(child.entry.id,spellEntry.id);assert.equal(child.entry.edition,'2014');
  const config=card.spellSettings.special[child.id];assert.equal(config.sourceGrant.ownerId,root.id);
  assert.equal(config.mode,'locked');assert.equal(config.sourceGrant.usage,'free');assert.equal(config.sourceGrant.canUseSlots,false);
  const before=JSON.stringify(card),payments=api.spellPayments(card,child.id).options;
  assert.equal(payments.some((payment:any)=>payment.label.includes('仅自身')),selfOnly,'False Life and Alter Self are self-only; Arcane Eye is not');
  assert.deepEqual(payments.map((p:any)=>({id:p.id,cost:p.cost,level:p.level,available:p.available,resourceId:p.resourceId})),[{id:'free',cost:0,level:spellLevel,available:true,resourceId:undefined}]);
  const plan=api.planSourceSpells(card),boundary=atwillEvidence.rules.find((row:any)=>row.reference===reference).boundary;
  assert(plan.issues.some((issue:any)=>issue.selectionId===root.id&&issue.message.includes(boundary)),'Reviewed boundaries must be surfaced in the real plan');
  assert.match(boundary,/言语、姿势/);assert.match(boundary,materials==='waived'?/不消耗法术位和材料成分/:materials==='absent'?/无材料成分/:/不豁免材料成分/);
  api.sheetChoices(card,[]);assert.equal(api.evaluate(card).ac,initialAc,'No automatic spell-effect or armor projection');
  assert.equal(api.sourceSpellRestoreOffer(card,child.id),undefined,'At-will grants have no per-use restoration');
  assert.deepEqual(api.sourceSpellRestPlan(card,'short').resources,[]);assert.deepEqual(api.sourceSpellRestPlan(card,'long').resources,[]);
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
 check('One lower Warlock level cannot learn, regardless of total multiclass level',()=>{
  const saved=structuredClone(card),classRow=card.selections.find((row:any)=>row.id==='proof-warlock');classRow.level=level-1;
  card.selections.push({id:'other-class',entry:{...structuredClone(owner),id:'proof-other-class',name:'Other class',english:'Other class',raw:{name:'Other class',ENG_name:'Other class',source:'PHB',_category:'class'}},level:20-level+1,quantity:1,equipped:false});
  const choice=api.sheetChoices(card,entries).find((row:any)=>row.id===choiceId),option=choice?.options.find((row:any)=>row.value===entry.id);
  assert(!choice||choice.count===0||option?.unavailable,'Class level, not total character level, gates learning');
  const before=JSON.stringify(card);assert.throws(()=>api.setSheetChoiceSlot(card,choiceId,0,entry.id,entries));assert.equal(JSON.stringify(card),before);card=saved;
 });
 check('Explicit class learning grants only the matching free spell',()=>{api.setSheetChoiceSlot(card,choiceId,0,entry.id,entries);sync(card,entries);active();});
 const {root,child}=active(),rootId=root.id,spellId=child.id;
 const answers=JSON.stringify(card.answers),tree=json(card.selections.filter((row:any)=>row.id===rootId||row.parentId===rootId));
 check('Repeated free casts preserve all slots, counters, authored HP and temporary HP without projecting spell effects',()=>{
  for(let i=0;i<3;i++){
   const before=json(card);delete before.runtime.automationActions;
   const request=api.spellActionRequest(card,spellId,'free',`free-${name}-${i}`),result=api.performSpellAction(card,request);
   const afterWithoutReceipt=json(card);delete afterWithoutReceipt.runtime.automationActions;assert.deepEqual(afterWithoutReceipt,before,'Casting changes only the action receipt, never character effects or resources');
   assert.equal(result.status,'applied');assert.equal(result.receipt.resourceId,undefined);assert.equal(result.receipt.spent,undefined);assert.equal(result.receipt.recovered,undefined);assert.equal(result.receipt.level,spellLevel,'Free cast uses the spell’s exact native level');
   const after=JSON.stringify(card);assert.equal(api.performSpellAction(card,request).status,'duplicate');assert.equal(JSON.stringify(card),after,'Duplicate click must not change the card');
  }
  active(rootId,spellId);
 });
 check('Real native roundtrip retains the action receipt and rejects replayed or colliding requests',()=>{
  const request=api.spellActionRequest(card,spellId,'free',`roundtrip-${name}`),result=api.performSpellAction(card,request);assert.equal(result.status,'applied');
  const actions=json(card.runtime.automationActions);card=reopen(card);assert.deepEqual(json(card.runtime.automationActions),actions);
  const before=JSON.stringify(card);assert.equal(api.performSpellAction(card,request).status,'duplicate');assert.equal(JSON.stringify(card),before);
  const stale={...api.spellActionRequest(card,spellId,'free',`stale-${name}`),sequence:request.sequence};
  assert.equal(api.performSpellAction(card,stale).status,'rejected');assert.equal(JSON.stringify(card),before);
  const collision={...api.spellActionRequest(card,spellId,'free',request.id),selectionId:'manual-same-spell'};
  assert.equal(api.performSpellAction(card,collision).status,'rejected');assert.equal(JSON.stringify(card),before);active(rootId,spellId);
 });
 check('Unrequested paid-slot casting and source-use recovery are rejected',()=>{reject(spellId,'slot:spell-slot:1');reject(spellId,'slot:spell-slot:2');reject(spellId,'slot:spell-slot:3');reject(spellId,'slot:spell-slot:4');reject(spellId,'slot:pact-slot:5');reject(spellId,'source','restore');});
 check('Forged canonical spell identity cannot retain a stale free-payment grant',()=>{
  const saved=structuredClone(card),row=card.selections.find((selection:any)=>selection.id===spellId);
  row.entry.english='Unreviewed Spell Identity';reject(spellId);card=saved;active(rootId,spellId);
 });
 const spellMutations:[string,(entry:any)=>void][]=[
  ['raw English identity',entry=>{entry.raw.ENG_name='Unreviewed Spell';}],
  ['normalized source',entry=>{entry.source='TCE';}],
  ['raw source',entry=>{entry.raw.source='TCE';}],
  ['spell level',entry=>{entry.raw.level=spellLevel+1;}],
  ['cross-edition identity',entry=>{entry.edition='2024';}],
  ['raw edition',entry=>{entry.raw.edition='one';}],
  ['copy declaration',entry=>{entry.raw._copy={name:entry.name,source:'PHB'};}],
  ['extra effect',entry=>{entry.effects=[{type:'armorClass',value:100}];}],
 ];
 for(const [label,alter] of spellMutations)check('Forged spell '+label+' cannot retain free payment',()=>{
  const saved=structuredClone(card);alter(card.selections.find((row:any)=>row.id===spellId).entry);reject(spellId);
  sync(card);reject(spellId);card=saved;active(rootId,spellId);
 });
 check('Changing the spell parent immediately revokes stale free-payment eligibility',()=>{
  const saved=structuredClone(card);card.selections.find((selection:any)=>selection.id===spellId).parentId='proof-warlock';
  reject(spellId);card=saved;active(rootId,spellId);
 });
 const malformed:[string,(entry:any)=>void][]=[
  ['unknown English identity',entry=>{entry.english='Unreviewed Invocation';entry.raw.ENG_name='Unreviewed Invocation';}],
  ['different normalized source',entry=>{entry.source='TCE';}],
  ['different raw source',entry=>{entry.raw.source='TCE';}],
  ['additional prerequisite',entry=>{entry.raw.prerequisite=[...(entry.raw.prerequisite||[]),{ability:[{cha:13}]}];}],
  ['different class prerequisite source',entry=>{entry.raw.prerequisite=[{level:{level,class:{ENG_name:'Warlock',name:'魔契师',source:'PHB'}}}];}],
  ['changed level prerequisite',entry=>{entry.raw.prerequisite=[{level:{level:level-1,class:{ENG_name:'Warlock',name:'魔契师'}}}];}],
  ['changed raw English identity',entry=>{entry.raw.ENG_name='Unreviewed Invocation';}],
  ['different edition',entry=>{entry.edition='2024';}],
  ['extra automatic effects',entry=>{entry.effects=[{type:'armorClass',value:100}];}],
  ['extra automatic choices',entry=>{entry.choices=[{id:'unreviewed',kind:'skill',count:1,options:['athletics']}];}],
  ['changed additional spell declaration',entry=>{entry.raw.additionalSpells=[{innate:{_:{daily:{'1e':['Unreviewed Spell']}}}}];}],
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
 const ownerMutations:[string,(card:any)=>void][]=[
  ['raw class English identity',c=>{c.selections.find((r:any)=>r.id==='proof-warlock').entry.raw.ENG_name='Other class';}],
  ['raw class source',c=>{c.selections.find((r:any)=>r.id==='proof-warlock').entry.raw.source='TCE';}],
  ['source feature raw English identity',c=>{c.selections.find((r:any)=>r.id===learned(c,name).parentId).entry.raw.ENG_name='Unreviewed Feature';}],
  ['source feature raw source',c=>{c.selections.find((r:any)=>r.id===learned(c,name).parentId).entry.raw.source='TCE';}],
  ['source feature kind',c=>{c.selections.find((r:any)=>r.id===learned(c,name).parentId).entry.kind='feat';}],
  ['source feature raw edition',c=>{c.selections.find((r:any)=>r.id===learned(c,name).parentId).entry.raw.edition='one';}],
  ['source feature effects',c=>{c.selections.find((r:any)=>r.id===learned(c,name).parentId).entry.effects=[{type:'armorClass',value:100}];}],
  ['source feature choices',c=>{c.selections.find((r:any)=>r.id===learned(c,name).parentId).entry.choices=[{id:'unreviewed',kind:'skill',count:1,options:['athletics']}];}],
 ];
 for(const [label,alter] of ownerMutations)check('Unreviewed '+label+' blocks stale free actions',()=>{
  const saved=structuredClone(card);alter(card);reject(spellId);sync(card);reject(spellId);card=saved;active(rootId,spellId);
 });
 check('Manual same-name invocation stays manual and cannot inherit the class free grant',()=>{
  const saved=structuredClone(card);card=baseCard(level);
  const manualInvocation={id:'manual-same-invocation',entry:structuredClone(entry),level,quantity:1,equipped:false};
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
 check('Dropping below the exact Warlock level rejects stale payment before sync and archives the selection',()=>{
  card.selections.find((row:any)=>row.id==='proof-warlock').level=level-1;reject(spellId);sync(card);reject(spellId);
  assert.equal(learned(card,name),undefined);assert.deepEqual(json(card.classChoiceArchive[rootId].selections),tree);assert.equal(JSON.stringify(card.answers),answers);
 });
 check('Native reopen below the class gate retains archived intent without free payment',()=>{card=reopen(card);sync(card);reject(spellId);assert.equal(learned(card,name),undefined);assert.equal(JSON.stringify(card.answers),answers);});
 check('Qualified Warlock level restores the same owned spell after native reopen',()=>{card.selections.find((row:any)=>row.id==='proof-warlock').level=level;sync(card);active(rootId,spellId);});
 check('Replacing learned invocation revokes old free payment only',()=>{
  api.setSheetChoiceSlot(card,choiceId,0,replacement.id,entries);sync(card,entries);assert.equal(learned(card,name),undefined);reject(spellId);assert(learned(card,replacement.english));
 });
 check('Relearning after replacement restores archived identities without catalog',()=>{card=reopen(card);api.setSheetChoiceSlot(card,choiceId,0,entry.id,[]);sync(card);active(rootId,spellId);});
 check('Explicit withdrawal revokes casting but retains manual same-name spell',()=>{api.setSheetChoiceSlot(card,choiceId,0,undefined,[]);sync(card);assert.equal(learned(card,name),undefined);reject(spellId);});
 check('Relearning after withdrawal does not duplicate or replenish resources',()=>{card=reopen(card);api.setSheetChoiceSlot(card,choiceId,0,entry.id,[]);sync(card);active(rootId,spellId);});
 check('Deleting the class removes its grants but leaves independent manual spell',()=>{api.removeSelection(card,'proof-warlock');sync(card);assert.equal(learned(card,name),undefined);reject(spellId);assert.equal(card.selections.filter((row:any)=>row.grantKey?.startsWith('source-spell:')).length,0);});
}

// Three selected positions stay within the level-14 capacity of six. A downgrade
// must revoke only the two level-15 rules, never hide a missing gate via quota.
let combined=baseCard(15);
for(const [slot,{name}] of additions.entries()){api.setSheetChoiceSlot(combined,choiceId,slot,find('feature',name).id,entries);sync(combined,entries);}
const combinedProtected=json({runtime:combined.runtime,abilities:combined.abilities,notes:combined.notes}),combinedAnswers=json(combined.answers);
const combinedIds=additions.map(({name,spellLevel,level})=>{const root=learned(combined,name);assert(root);const children=granted(combined,root.id);assert.equal(children.length,1);return {name,spellLevel,level,rootId:root.id,spellId:children[0].id,tree:json([root,...children])};});
assert.equal(combined.selections.filter((row:any)=>row.grantKey?.startsWith('source-spell:')).length,3);
combined.selections.find((row:any)=>row.id==='proof-warlock').level=14;
assert.equal(api.sheetChoices(combined,entries).find((row:any)=>row.id===choiceId).count,6);
for(const row of combinedIds){
 const before=JSON.stringify(combined),payments=api.spellPayments(combined,row.spellId).options;
 if(row.level===2)assert.equal(payments[0]?.id,'free','Fiendish Vigor remains qualified');
 else {assert.deepEqual(payments,[]);assert.equal(api.performSpellAction(combined,api.spellActionRequest(combined,row.spellId,'free',`combined-before-sync-${row.name}`)).status,'rejected');}
 assert.equal(JSON.stringify(combined),before,'Level-14 stale payment must reject without mutation');
}
sync(combined);
for(const row of combinedIds)if(row.level===15){assert.equal(learned(combined,row.name),undefined);assert.deepEqual(json(combined.classChoiceArchive[row.rootId].selections),row.tree);}else assert.equal(learned(combined,row.name).id,row.rootId);
combined=reopen(combined);sync(combined);
for(const row of combinedIds)if(row.level===15)assert.deepEqual(api.spellPayments(combined,row.spellId).options,[]);
assert.deepEqual(json(combined.answers),combinedAnswers);
combined.selections.find((row:any)=>row.id==='proof-warlock').level=15;sync(combined);
for(const row of combinedIds){assert.equal(learned(combined,row.name).id,row.rootId);assert.equal(granted(combined,row.rootId)[0].id,row.spellId);assert.equal(api.spellPayments(combined,row.spellId).options[0]?.level,row.spellLevel);}
assert.deepEqual(json({runtime:combined.runtime,abilities:combined.abilities,notes:combined.notes}),combinedProtected);api.validateCharacter(json(combined));
steps.push({rule:'PHB remaining at-will invocation class gates',label:'First three slots simultaneously preserve Fiendish Vigor at Warlock 14, suspend only level-15 spells before sync, archive and reopen at 14, restore exact IDs at 15 without quota masking',passed:true,manualDataPreserved:true});

assert.equal(git('rev-parse','HEAD'),consumerRevision,'Consumer revision changed during replay');assertCleanSource();
assert.equal(git('rev-parse','HEAD:src'),consumerSourceTree,'Consumer source tree changed during replay');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),producerRevision,'Producer revision changed during replay');
const report={
 schemaVersion:1,updatedAt:new Date().toISOString(),consumerRevision,consumerSourceTree,producerRevision,sourceRevision,inputs,entryHashes,
 rules:additions.map(({name,spell,spellLevel,level,selfOnly,materials})=>({reference:`${name}|PHB`,spellReference:`${spell}|PHB`,spellLevel,minimumWarlockLevel:level,selfOnly,materials})),steps,
 definition:'Bounded exact-source consumer API workflow proof; not complete class/spell automation, browser coverage or release certification',
 manualBoundaries:[
  'Fiendish Vigor: first-level self-only cast with material exemption; V/S, rolling and applying temporary HP, duration and replacement remain manual; repeated casts never set or stack temporary HP',
  'Master of Myriad Forms: self-only Alter Self with V/S and no material component; form choice, aquatic adaptation, appearance, natural weapons, attacks, concentration and duration remain manual',
  'Visions of Distant Realms: Arcane Eye is not self-only and V/S/M are retained; eye placement, vision, movement, concentration and duration remain manual',
  'Invocation replacement timing and DM eligibility adjudication are not automatically authorized',
  'Native export/import proves character schema and saved grant roundtrip, not browser storage, failure recovery, server authority or multiplayer delivery',
 ],
 browser:'not-run',currentReleaseAvailable:null,
};
mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,consumerRevision,consumerSourceTree,producerRevision,passed:steps.length,failed:0}));
