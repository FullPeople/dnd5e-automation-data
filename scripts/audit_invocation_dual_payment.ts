/** Exact frozen-source consumer replay of seven PHB invocation payments.
 * The report contains only hashes and workflow findings, never source/card snapshots.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,realpathSync,writeFileSync} from 'node:fs';
import {basename,dirname,isAbsolute,join,resolve,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const [webRoot,inputRoot,output='.cache/invocation-dual-payment.json']=process.argv.slice(2);
if(!webRoot||!inputRoot)throw Error('Usage: audit_invocation_dual_payment.ts WEB_ROOT FROZEN_INPUT_ROOT [OUTPUT]');
const sourceRevision='e2623b204ddbdf2bcfa8317acfc962de89c676e2';
const expectedInputs:Record<string,string>={
 'optionalfeatures.json':'031970dfac1770a548549bd30535319c2493c47ebeaedfdb6a601651bbfc3844',
 'class/class-warlock.json':'34721a04db792923cf0a19fbab3f90616093d9f6519a7cfe6f81a9eb52e775d4',
 'spells/spells-phb.json':'e1f2221020cfb5d31995c99b78dc09435c9962476ef1cef81b52399e6df0263d',
};
const additions=[
 {name:'Thief of Five Fates',spell:'Bane',chinese:'灾祸术',page:111,spellLevel:1,level:2,entryHash:'e9d5064cb44797e36af3981434ebab5e1883c74b6867ee63fe2f8c1f6abdbd10'},
 {name:'Mire the Mind',spell:'Slow',chinese:'缓慢术',page:111,spellLevel:3,level:5,entryHash:'88afa2a72c37e4f983fd3b41981119f7088d3d42c16977b77f95eeef5eb047cf'},
 {name:'Sign of Ill Omen',spell:'Bestow Curse',chinese:'降咒',page:111,spellLevel:3,level:5,entryHash:'df0504d6ffd05ee46396de3b464bbe03ae43f0a9633691e00085a5efa0c03c2e'},
 {name:'Bewitching Whispers',spell:'Compulsion',chinese:'强迫术',page:110,spellLevel:4,level:7,entryHash:'2b01c6f5c3a0936f16b08008047c4c7bea593977dacbeb0d2a352d08a4e9cccb'},
 {name:'Dreadful Word',spell:'Confusion',chinese:'困惑术',page:110,spellLevel:4,level:7,entryHash:'ae980c2360187ded3bf6e2cdc6125d30a07edca6c269667049469cb30085296b'},
 {name:'Sculptor of Flesh',spell:'Polymorph',chinese:'变形术',page:111,spellLevel:4,level:7,entryHash:'77e71d1e54204e58582f77d9f347de1db27f0862cdd7b7da0b474728fd0c959a'},
 {name:'Minions of Chaos',spell:'Conjure Elemental',chinese:'咒唤元素',page:111,spellLevel:5,level:9,entryHash:'c5cc2ec5af6403af7a472b069b1d47d35bffe3010c652e72197e84d9664a0f58'},
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
assert.deepEqual(evidence.level9Prerequisite,prerequisite(9),'Consumer exact level-9 prerequisite');
const dualEvidence=JSON.parse(readFileSync(join(webRoot,'src/core/automation/invocationDualEvidence.json'),'utf8'));
assert.equal(dualEvidence.frozenRevision,sourceRevision,'Consumer dual-payment source revision');
assert.equal(dualEvidence.pactFeatureReference,'契约魔法|魔契师|PHB|1','Consumer exact Pact Magic reference');
assert.equal(dualEvidence.pactFeatureEnglish,'Pact Magic','Consumer exact Pact Magic English identity');
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
 assert(realpathSync(local).startsWith(realpathSync(inputRoot)+sep),'Resolved input must remain inside frozen directory');
 const body=JSON.parse(readFileSync(local,'utf8')),sha256=hash(body);
 assert.equal(sha256,expectedInputs[path],'Frozen input mismatch '+path);
 assert.equal(sha256,evidence.inputs[path],'Consumer input mismatch '+path);
 if(index)assert.equal(sha256,rows[0].sha256,'Frozen manifest mismatch '+path);
 inputs[path]=sha256;return body;
}
const optional=input('optionalfeatures.json'),classes=input('class/class-warlock.json'),spells=input('spells/spells-phb.json');
const entryHashes:Record<string,string>={};
for(const {name,spell,chinese,page,spellLevel,level,entryHash} of additions){
 const reference=`${name}|PHB`,rule=dualEvidence.rules.find((row:any)=>row.reference===reference);
 assert(rule,'Reviewed invocation is absent '+reference);
 assert.equal(rule.mechanism,'spell');assert.equal(rule.payment,'pact-and-use');assert.equal(rule.spellReference,`${spell}|PHB`);assert.equal(rule.page,page);
 assert.equal(rule.spellLevel,spellLevel);assert.equal(rule.requiredClassLevel??2,level);
 assert(!rule.selfOnly,'These seven spells do not carry a self-only invocation restriction');
 const rows=optional.optionalfeature.filter((row:any)=>`${row.ENG_name}|${row.source}`===reference);
 assert.equal(rows.length,1,'Exact invocation source identity '+reference);assert.equal(rows[0].page,page);
 assert.deepEqual(rows[0].prerequisite,prerequisite(level),'Exact class gate, including absent source qualifier '+reference);
 assert.deepEqual(rows[0].additionalSpells,[{innate:{_:{daily:{'1e':[chinese]}}}}],'Each reviewed rule declares one independent daily use');
 const prose=JSON.stringify(rows[0].entries);
 assert(prose.includes('消耗你的魔契师法术位')&&prose.includes('完成一次长休'),'Dual payment requires reviewed prose, not a daily-list inference');
 assert(!prose.includes('无需')&&!prose.includes('材料'),'No component exemption is granted');
 const spellRows=spells.spell.filter((row:any)=>row.ENG_name===spell&&row.source==='PHB');
 assert.equal(spellRows.length,1,'Exact spell source identity '+spell);assert.equal(spellRows[0].level,spellLevel);
 entryHashes[`${spell}|PHB`]=hash(spellRows[0]);entryHashes[reference]=hash(rows[0]);
 assert.equal(entryHashes[`${spell}|PHB`],dualEvidence.entryHashes[`${spell}|PHB`],'Consumer reviewed spell entry hash');
 assert.equal(entryHashes[reference],entryHash,'Independent reviewed invocation hash '+reference);
 assert.equal(entryHashes[reference],dualEvidence.entryHashes[reference],'Consumer reviewed invocation hash '+reference);
}
for(const [reference,english,level,expectedHash] of [
 ['Warlock|PHB','Warlock',0,'179a4e48b79fef7ae2244e88e614d04a0828caca4a854b6f65de61b6df802385'],
 ['Eldritch Invocations|Warlock|PHB|2','Eldritch Invocations',2,'a482142444ed3639690525945c024d4b2476ac84bbe5e981ef3f7f0d323eaa8f'],
 ['Pact Magic|Warlock|PHB|1','Pact Magic',1,'da68ce072732185a89c9b7d4354f20eb1a92717c87cf267e2af39f55b64bfd3a'],
] as const){
 const rows=(level?classes.classFeature:classes.class).filter((row:any)=>row.ENG_name===english&&row.source==='PHB'&&(!level||row.level===level));
 assert.equal(rows.length,1,'Exact class source identity '+reference);entryHashes[reference]=hash(rows[0]);
 assert.equal(entryHashes[reference],expectedHash,'Independent reviewed owner hash '+reference);
 assert.equal(entryHashes[reference],(level===1?dualEvidence:evidence).entryHashes[reference],'Consumer owner entry hash');
 if(english==='Pact Magic'){
  const prose=JSON.stringify(rows[0].entries);assert(prose.includes('所有的法术位都属于同一环阶')&&prose.includes('完成长休或短休后恢复')&&prose.includes('作为一个3环法术施放'),'Real Pact Magic explains slot level and recovery');
 }
}

mkdirSync('.cache',{recursive:true});
const adapter=resolve('.cache/invocation-dual-payment-consumer.mjs');
const exports:Record<string,string[]>={
 'src/core/model.ts':['newCharacter'],
 'src/core/automation/state.ts':['newAutomationState'],
 'src/data/catalog.ts':['normalizeData'],
 'src/core/sheet.ts':['syncFeatures','removeSelection'],
 'src/core/automation/choices.ts':['sheetChoices','setSheetChoiceSlot'],
 'src/core/automation/invocations.ts':['invocationRule'],
 'src/core/automation/sourceSpells.ts':['syncSourceSpells','planSourceSpells'],
 'src/core/automation/actions.ts':['spellPayments','spellActionRequest','performSpellAction','sourceSpellRestPlan','sourceSpellRestRequest','sourceSpellRestoreOffer'],
 'src/core/specialSpells.ts':['setSpecialSpell','changeSpecialSpellUses','specialSpellResource'],
 'src/core/resources.ts':['syncAutoResources','setResource'],
 'src/core/engine.ts':['evaluate'],
 'src/core/export.ts':['exportCharacter'],
 'src/core/validation.ts':['readCharacter','validateCharacter'],
};
await build({stdin:{contents:Object.entries(exports).map(([path,names])=>`export {${names.join(',')}} from ${JSON.stringify(resolve(webRoot,path))};`).join('\n'),resolveDir:resolve(webRoot),loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:adapter,define:{'import.meta.env.MODE':'"standalone"','import.meta.env.DEV':'false'}});
const api=await import(pathToFileURL(adapter).href);
const entries=api.normalizeData({...optional,...classes,...spells},'frozen-invocation-dual-payment');
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
const pactLevel=(level:number)=>Math.min(5,Math.ceil(level/2));
const pactMax=(level:number)=>level===1?1:level<11?2:level<17?3:4;
function baseCard(level:number){
 const card=api.newCharacter('2014');card.automation=api.newAutomationState();card.profile.enabledSources=['PHB'];
 card.selections=[{id:'proof-warlock',entry:structuredClone(owner),level,quantity:1,equipped:false}];
 card.abilities.cha=16;card.notes='Authored dual-payment preservation probe';card.sheetBonuses={ac:3};
 card.proficiencies={persuasion:true};card.expertise={persuasion:true};card.runtime.hp=2;card.runtime.tempHp=1;
 card.runtime.resources={'manual-sentinel':{current:1,max:7},'spell-slot:1':{current:1,max:4},'spell-slot:5':{current:2,max:3}};
 sync(card,entries);api.syncAutoResources(card);
 assert.deepEqual({current:card.runtime.resources[`pact-slot:${pactLevel(level)}`].current,max:card.runtime.resources[`pact-slot:${pactLevel(level)}`].max},{current:pactMax(level),max:pactMax(level)});
 return card;
}
const paymentId='invocation-pact';
let actionNumber=0;
const request=(card:any,id:string,payment=paymentId,mode='cast')=>api.spellActionRequest(card,id,payment,`dual-proof-${++actionNumber}`,mode);
function rejectRequest(card:any,req:any){
 const before=JSON.stringify(card);assert.equal(api.performSpellAction(card,req).status,'rejected');
 assert.equal(JSON.stringify(card),before,'Rejected request must leave the entire character and action sequence untouched');
}
function reject(card:any,id:string,payment=paymentId,mode='cast'){rejectRequest(card,request(card,id,payment,mode));}
function learn(card:any,name:string,slot=0){api.setSheetChoiceSlot(card,choiceId,slot,find('feature',name).id,entries);sync(card,entries);const root=learned(card,name);assert(root);const children=granted(card,root.id);assert.equal(children.length,1);return {root,child:children[0]};}
function offer(card:any,id:string,level:number){
 const before=JSON.stringify(card),options=api.spellPayments(card,id).options;
 assert.equal(options.length,1,'Exactly one joint payment, never a free/slot alternative');
 const payment=options[0],pool=api.specialSpellResource(id,card),pact=`pact-slot:${pactLevel(level)}`;
 assert.equal(payment.id,paymentId);assert.equal(payment.level,pactLevel(level),'Cast level is the actual Warlock pact slot level');
 assert.deepEqual(payment.debits,[{resourceId:pool,cost:1},{resourceId:pact,cost:1}],'Both resource debits are explicit');
 api.planSourceSpells(card);api.sheetChoices(card,[]);api.evaluate(card);
 assert.equal(JSON.stringify(card),before,'Planning, menus and evaluation are read-only');return {payment,pool,pact};
}
function cast(card:any,id:string,level:number){
 const {payment,pool,pact}=offer(card,id,level);assert.equal(payment.available,true);
 const before={pool:card.runtime.resources[pool].current,pact:card.runtime.resources[pact].current};
 const req=request(card,id),result=api.performSpellAction(card,req);assert.equal(result.status,'applied');
 assert.deepEqual(result.receipt.spent,[{resourceId:pool,before:before.pool,after:before.pool-1},{resourceId:pact,before:before.pact,after:before.pact-1}],'Receipt records both exact debits');
 assert.equal(result.receipt.level,pactLevel(level));assert.equal(card.runtime.resources[pool].current,before.pool-1);assert.equal(card.runtime.resources[pact].current,before.pact-1);
 const after=JSON.stringify(card);assert.equal(api.performSpellAction(card,req).status,'duplicate');assert.equal(JSON.stringify(card),after,'Duplicate click cannot debit either pool again');
 return {req,result};
}

for(const {name,spell,spellLevel,level} of additions){
 const reference=`${name}|PHB`,entry=find('feature',name),spellEntry=find('spell',spell);
 assert.equal(api.invocationRule(entry)?.reference,reference);
 let card=baseCard(level);
 card.selections.push({id:'manual-same-spell',entry:structuredClone(spellEntry),level:1,quantity:1,equipped:false});
 assert.equal(api.setSpecialSpell(card,'manual-same-spell',{mode:'uses',max:5,recovery:'manual'}),true);
 api.changeSpecialSpellUses(card,'manual-same-spell',1);
 const manualKeys=Object.keys(card.runtime.resources).filter(key=>!key.startsWith('pact-slot:'));
 const preserved=(c:any)=>json({abilities:c.abilities,notes:c.notes,hp:c.runtime.hp,tempHp:c.runtime.tempHp,resources:Object.fromEntries(manualKeys.map(key=>[key,c.runtime.resources[key]])),sheetBonuses:c.sheetBonuses,proficiencies:c.proficiencies,expertise:c.expertise,manualRow:c.selections.find((row:any)=>row.id==='manual-same-spell'),manualSpell:c.spellSettings?.special?.['manual-same-spell']});
 const manual=preserved(card);
 const check=(label:string,fn:()=>void)=>{
  try{fn();assert.deepEqual(preserved(card),manual,label+' preserves unrelated and authored data');api.validateCharacter(json(card));}
  catch(error){throw Error(`${reference}: ${label}`,{cause:error});}
  steps.push({rule:reference,label,passed:true,manualDataPreserved:true});
 };
 check('Unlearned option and same-name manual spell cannot acquire joint payment',()=>{
  assert.equal(learned(card,name),undefined);assert.equal(card.selections.filter((row:any)=>row.grantKey?.startsWith('source-spell:')).length,0);
  const before=JSON.stringify(card),choice=api.sheetChoices(card,entries).find((row:any)=>row.id===choiceId);
  assert(choice?.options.find((option:any)=>option.value===entry.id)?.grant,'Real source-qualified learn option');
  api.planSourceSpells(card,entries);assert.equal(JSON.stringify(card),before);reject(card,'manual-same-spell');
 });
 check('One lower Warlock level cannot learn, regardless of total character level',()=>{
  const saved=structuredClone(card);card.selections.find((row:any)=>row.id==='proof-warlock').level=level-1;
  card.selections.push({id:'other-class',entry:{...structuredClone(owner),id:'proof-other-class',name:'Other class',english:'Other class',raw:{name:'Other class',ENG_name:'Other class',source:'PHB',_category:'class'}},level:20-level+1,quantity:1,equipped:false});
  const choice=api.sheetChoices(card,entries).find((row:any)=>row.id===choiceId),option=choice?.options.find((row:any)=>row.value===entry.id);
  assert(!choice||choice.count===0||option?.unavailable,'Class level, not character total, gates learning');
  const before=JSON.stringify(card);assert.throws(()=>api.setSheetChoiceSlot(card,choiceId,0,entry.id,entries));assert.equal(JSON.stringify(card),before);card=saved;
 });
 check('Explicit class learning grants one exact spell with an independently owned long-rest use',()=>{
  learn(card,name);const root=learned(card,name),child=granted(card,root.id)[0],config=card.spellSettings.special[child.id];
  assert.equal(child.entry.id,spellEntry.id);assert.equal(child.entry.raw.level,spellLevel);assert.equal(child.parentId,root.id);
  assert.equal(config.mode,'uses');assert.equal(config.max,1);assert.equal(config.recovery,'long');assert.equal(config.sourceGrant.usage,'invocation-pact');assert.equal(config.sourceGrant.canUseSlots,false);assert.equal(config.sourceGrant.ability,'cha');
  const {pool,payment}=offer(card,child.id,level);assert(payment.available);assert.equal(card.runtime.resources[pool].current,1);
  assert.equal(config.sourceGrant.resourceKey,pool);assert.match(config.sourceGrant.usageKey,/proof-warlock/);assert(config.sourceGrant.usageKey.includes(reference));
  assert.deepEqual(card.runtime.resources[pool].sourceSpellGrant,{usageKey:config.sourceGrant.usageKey});
 });
 const root=learned(card,name),child=granted(card,root.id)[0],rootId=root.id,spellId=child.id;
 const {pool,pact}=offer(card,spellId,level),answers=JSON.stringify(card.answers),tree=json([root,child]);
 const active=()=>{assert.equal(learned(card,name)?.id,rootId);assert.equal(granted(card,rootId)[0]?.id,spellId);offer(card,spellId,level);};
 check('Opening and canceling cast or restore confirmation makes no writes',()=>{
  const before=JSON.stringify(card);request(card,spellId);request(card,spellId,'source','restore');
  const recovery=api.sourceSpellRestoreOffer(card,spellId);assert.equal(recovery.paymentId,'source');assert.equal(recovery.available,false);assert.match(recovery.label,/长休/);
  assert.equal(JSON.stringify(card),before);reject(card,spellId,'source','restore');
 });
 check('Free, source-only, ordinary-slot and pact-slot-only casts all reject transactionally',()=>{
  for(const id of ['free','source','slot:spell-slot:1','slot:spell-slot:5',`slot:${pact}`])reject(card,spellId,id);
 });
 for(const [label,key,alter] of [
  ['missing invocation counter',pool,(r:any)=>undefined],
  ['exhausted invocation counter',pool,(r:any)=>({...r,current:0})],
  ['negative invocation counter',pool,(r:any)=>({...r,current:-1})],
  ['fractional invocation counter',pool,(r:any)=>({...r,current:0.5})],
  ['overfull invocation counter',pool,(r:any)=>({...r,current:2})],
  ['wrong invocation maximum',pool,(r:any)=>({...r,max:2})],
  ['unlimited invocation counter',pool,(r:any)=>({...r,unlimited:true})],
  ['unowned manual invocation counter',pool,(r:any)=>{const copy={...r};delete copy.sourceSpellGrant;return copy;}],
  ['foreign invocation counter owner',pool,(r:any)=>({...r,sourceSpellGrant:{usageKey:'foreign-invocation-budget'}})],
  ['missing pact counter',pact,(r:any)=>undefined],
  ['exhausted pact counter',pact,(r:any)=>({...r,current:0})],
  ['negative pact counter',pact,(r:any)=>({...r,current:-1})],
  ['fractional pact counter',pact,(r:any)=>({...r,current:0.5})],
  ['overfull pact counter',pact,(r:any)=>({...r,current:r.max+1})],
  ['wrong pact maximum',pact,(r:any)=>({...r,max:r.max+1})],
  ['unlimited pact counter',pact,(r:any)=>({...r,unlimited:true})],
  ['manual pact counter',pact,(r:any)=>({...r,automatic:false})],
 ] as const)check('Reject '+label+' without spending the other resource',()=>{
  const saved=structuredClone(card),value=alter(card.runtime.resources[key]);if(value===undefined)delete card.runtime.resources[key];else card.runtime.resources[key]=value;
  reject(card,spellId);card=saved;
 });
 check('A forged different-level pact key cannot replace the actual current slot',()=>{
  const saved=structuredClone(card);card.runtime.resources['pact-slot:9']={...card.runtime.resources[pact],max:4,current:4};delete card.runtime.resources[pact];
  reject(card,spellId);reject(card,spellId,'slot:pact-slot:9');card=saved;
 });
 check('Stale revision, stale sequence and unfamiliar action ledger never debit either resource',()=>{
  const saved=structuredClone(card);const revision=request(card,spellId);revision.revision--;rejectRequest(card,revision);
  const sequence=request(card,spellId);sequence.sequence++;rejectRequest(card,sequence);
  card.runtime.automationActions={version:2,sequence:0};reject(card,spellId);card=saved;
 });
 check('A pending cast is stale after a resource edit even without a revision or sequence change',()=>{
  const saved=structuredClone(card),req=request(card,spellId);card.runtime.resources[pact].current--;
  rejectRequest(card,req);card=saved;
 });
 check('A pending cast is stale after a class-level edit even without a revision or sequence change',()=>{
  const saved=structuredClone(card),req=request(card,spellId);card.selections.find((r:any)=>r.id==='proof-warlock').level++;
  rejectRequest(card,req);card=saved;
 });
 const malformed:[string,(row:any)=>void][]=[
  ['unknown canonical invocation name',row=>{row.entry.english='Unreviewed Invocation';row.entry.raw.ENG_name='Unreviewed Invocation';}],
  ['different normalized invocation source',row=>{row.entry.source='TCE';}],
  ['different raw invocation source',row=>{row.entry.raw.source='TCE';}],
  ['different invocation edition',row=>{row.entry.edition='2024';}],
  ['an additional unknown prerequisite',row=>{row.entry.raw.prerequisite=[...(row.entry.raw.prerequisite||[]),{pact:'Chain'}];}],
  ['changed exact class prerequisite',row=>{row.entry.raw.prerequisite=prerequisite(level===2?5:level+1);}],
  ['a copied invocation',row=>{row.entry.raw._copy={name:row.entry.name,source:'PHB'};}],
  ['an unresolved invocation parent',row=>{row.entry.raw._unresolvedParent=true;}],
  ['unknown additional mechanical payload',row=>{row.entry.raw.resourceRecovery='short';}],
 ];
 for(const [label,alter] of malformed)check('Reject '+label+' before and after reconciliation',()=>{
  const saved=structuredClone(card);const changed=card.selections.find((row:any)=>row.id===rootId);alter(changed);assert.equal(api.invocationRule(changed.entry),undefined);
  reject(card,spellId);reject(card,spellId,'source','restore');sync(card);reject(card,spellId);card=saved;
 });
 for(const [label,alter] of [
  ['unknown canonical spell identity',(c:any)=>{c.selections.find((r:any)=>r.id===spellId).entry.english='Unreviewed Spell';}],
  ['wrong raw spell identity',(c:any)=>{c.selections.find((r:any)=>r.id===spellId).entry.raw.ENG_name='Unreviewed Spell';}],
  ['wrong spell parent',(c:any)=>{c.selections.find((r:any)=>r.id===spellId).parentId='proof-warlock';}],
  ['wrong invocation parent',(c:any)=>{learned(c,name).parentId='proof-warlock';}],
  ['missing saved learning answer',(c:any)=>{c.answers[choiceId]=[];}],
  ['non-PHB Warlock owner',(c:any)=>{const cls=c.selections.find((r:any)=>r.id==='proof-warlock');cls.entry.source='TCE';cls.entry.raw.source='TCE';}],
  ['forged Warlock English identity',(c:any)=>{c.selections.find((r:any)=>r.id==='proof-warlock').entry.english='Different class';}],
  ['missing Pact Magic parent feature',(c:any)=>{c.selections=c.selections.filter((r:any)=>r.entry.english!=='Pact Magic');}],
  ['manual same-name Pact Magic feature',(c:any)=>{const row=c.selections.find((r:any)=>r.entry.english==='Pact Magic');delete row.grantKey;}],
  ['changed Pact Magic identity',(c:any)=>{c.selections.find((r:any)=>r.entry.english==='Pact Magic').entry.english='Different feature';}],
  ['changed caster progression',(c:any)=>{c.selections.find((r:any)=>r.id==='proof-warlock').entry.raw.casterProgression='full';}],
  ['multiple pact casters',(c:any)=>{const cls=structuredClone(c.selections.find((r:any)=>r.id==='proof-warlock'));cls.id='second-pact-class';c.selections.push(cls);} ],
 ] as const)check('Reject '+label+' with no partial payment',()=>{
  const saved=structuredClone(card);alter(card);reject(card,spellId);card=saved;
 });
 let firstRequest:any;
 check('First cast atomically spends one invocation use plus one authentic pact slot',()=>{firstRequest=cast(card,spellId,level).req;});
 const consumed=()=>{assert.equal(card.runtime.resources[pool].current,0,'Invocation must remain consumed');assert.equal(card.runtime.resources[pact].current,pactMax(level)-1,'Pact slot must remain consumed');};
 check('A second cast is denied even with ordinary and pact spell slots left',()=>{reject(card,spellId);consumed();});
 check('Saved dual receipt and both balances survive native export and reopen without repair',()=>{
  const receipt=json(card.runtime.automationActions);card=reopen(card);assert.deepEqual(json(card.runtime.automationActions),receipt);consumed();
  const before=JSON.stringify(card);
  assert.equal(api.performSpellAction(card,firstRequest).status,'duplicate');assert.equal(JSON.stringify(card),before);
 });
 for(const [label,alter] of malformed)check('Exhausted invocation cannot be restored after '+label,()=>{
  const saved=structuredClone(card);alter(learned(card,name));reject(card,spellId,'source','restore');card=saved;consumed();
 });
 check('Native import rejects malformed dual-resource receipts without mutating the live card',()=>{
  const before=JSON.stringify(card);
  for(const alter of [
   (r:any)=>{r.spent[1].resourceId=r.spent[0].resourceId;},
   (r:any)=>{r.spent[1].after=r.spent[1].before;},
   (r:any)=>{r.spent[0].after=-1;},
   (r:any)=>{r.resourceId=pool;r.before=1;r.after=0;},
  ]){const invalid=json(api.exportCharacter(card));alter(invalid.character.runtime.automationActions.last);assert.throws(()=>api.readCharacter(invalid));}
  assert.equal(JSON.stringify(card),before);consumed();
 });
 check('Short-rest planning and request do not restore a long-rest invocation',()=>{
  const before=JSON.stringify(card);assert(!api.sourceSpellRestPlan(card,'short').resources.some((r:any)=>r.resourceId===pool));
  rejectRequest(card,api.sourceSpellRestRequest(card,'short',`short-${++actionNumber}`));assert.equal(JSON.stringify(card),before);consumed();
 });
 check('Long-rest planning is read-only and excludes all pact slots and manual resources',()=>{
  const before=JSON.stringify(card);assert.deepEqual(api.sourceSpellRestPlan(card,'long').resources,[{resourceId:pool,before:0,after:1}]);assert.equal(JSON.stringify(card),before);consumed();
 });
 check('Repeated offline synchronization preserves the exhausted use and pact slot',()=>{for(let i=0;i<3;i++)sync(card);active();consumed();});
 check('Automation off blocks casts and restores without discarding saved learning',()=>{
  card.automation.enabled=false;reject(card,spellId);reject(card,spellId,'source','restore');sync(card);assert.equal(JSON.stringify(card.answers),answers);consumed();
 });
 check('Automation re-enable after reopen does not replenish either resource',()=>{card=reopen(card);card.automation.enabled=true;sync(card);active();consumed();});
 check('Source disable immediately denies restoration then archives only the owned grant',()=>{
  card.profile.enabledSources=[];reject(card,spellId);reject(card,spellId,'source','restore');sync(card);assert.equal(learned(card,name),undefined);assert.deepEqual(json(card.classChoiceArchive[rootId].selections),tree);consumed();
 });
 check('Reopen while source-disabled preserves archive, balances and intent',()=>{card=reopen(card);sync(card);reject(card,spellId);assert.equal(JSON.stringify(card.answers),answers);consumed();});
 check('Source restore offline preserves the exact identities without granting new uses',()=>{card.profile.enabledSources=['PHB'];sync(card);active();consumed();});
 check('Class downgrade rejects stale cast and restore before reconciliation',()=>{
  card.selections.find((r:any)=>r.id==='proof-warlock').level=level-1;reject(card,spellId);reject(card,spellId,'source','restore');sync(card);reject(card,spellId);assert.equal(learned(card,name),undefined);consumed();
 });
 check('Native reopen below the gate preserves the archive and spent state',()=>{card=reopen(card);sync(card);reject(card,spellId);assert.equal(JSON.stringify(card.answers),answers);consumed();});
 check('Restoring the qualified class level recovers the same IDs but no resources',()=>{card.selections.find((r:any)=>r.id==='proof-warlock').level=level;sync(card);active();consumed();});
 check('Replacement revokes old cast and restoration without refunding either payment',()=>{
  api.setSheetChoiceSlot(card,choiceId,0,replacement.id,entries);sync(card,entries);assert.equal(learned(card,name),undefined);reject(card,spellId);reject(card,spellId,'source','restore');consumed();
 });
 check('Relearning a replaced invocation offline does not reset its one-use budget',()=>{card=reopen(card);api.setSheetChoiceSlot(card,choiceId,0,entry.id,[]);sync(card);active();consumed();});
 check('Explicit withdrawal rejects actions while preserving the manual same-name spell',()=>{
  api.setSheetChoiceSlot(card,choiceId,0,undefined,[]);sync(card);assert.equal(learned(card,name),undefined);reject(card,spellId);reject(card,spellId,'source','restore');consumed();
 });
 check('Relearning a withdrawn invocation reuses its spent ledger without duplication',()=>{card=reopen(card);api.setSheetChoiceSlot(card,choiceId,0,entry.id,[]);sync(card);active();consumed();});
 check('Explicit confirmed long-rest restore replenishes only this invocation, never pact slots or HP',()=>{
  const restore=api.sourceSpellRestoreOffer(card,spellId);assert.equal(restore.paymentId,'source');assert.equal(restore.available,true);assert.match(restore.label,/确认.*长休.*本祈唤/);
  const before=json(card.runtime.resources),req=request(card,spellId,'source','restore'),result=api.performSpellAction(card,req);assert.equal(result.status,'applied');
  assert.equal(result.receipt.resourceId,pool);assert.equal(result.receipt.before,0);assert.equal(result.receipt.after,1);assert.equal(result.receipt.spent,undefined);
  before[pool].current=1;assert.deepEqual(json(card.runtime.resources),before,'Single-item recovery may not change any other resource');
  const after=JSON.stringify(card);assert.equal(api.performSpellAction(card,req).status,'duplicate');assert.equal(JSON.stringify(card),after);reject(card,spellId,'source','restore');
 });
 check('Old cast requests and reused action IDs cannot debit after a newer restore',()=>{
  const req=request(card,spellId);req.sequence-=2;rejectRequest(card,req);
  const collision=request(card,spellId);collision.id=card.runtime.automationActions.last.id;rejectRequest(card,collision);
 });
 check('A second explicitly restored cast records two debits and persists both at zero',()=>{
  cast(card,spellId,level);assert.equal(card.runtime.resources[pool].current,0);assert.equal(card.runtime.resources[pact].current,pactMax(level)-2);card=reopen(card);sync(card);assert.equal(card.runtime.resources[pool].current,0);assert.equal(card.runtime.resources[pact].current,pactMax(level)-2);
 });
 check('Class deletion removes automatic grants but keeps authored same-name spell and balances',()=>{
  const resources=json(card.runtime.resources),spent=json(card.runtime.sourceSpellSpent);delete resources[pool];api.removeSelection(card,'proof-warlock');sync(card);assert.equal(learned(card,name),undefined);reject(card,spellId);assert.deepEqual(json(card.runtime.resources),resources);assert.deepEqual(json(card.runtime.sourceSpellSpent),spent);
 });
}

// Real progression, including upcasting a first-level spell and the 3/4-slot caps.
for(const rule of additions)for(const level of (rule.level===2?[2,3,5,7,9,11,17,20]:[rule.level,17])){
 const card=baseCard(level),{child}=learn(card,rule.name),before=json(card.runtime.resources);
 cast(card,child.id,level);const pool=api.specialSpellResource(child.id,card),pact=`pact-slot:${pactLevel(level)}`;
 before[pool].current--;before[pact].current--;assert.deepEqual(json(card.runtime.resources),before);
 const loaded=reopen(card);assert.equal(loaded.runtime.automationActions.last.level,pactLevel(level));
 steps.push({rule:`${rule.name}|PHB`,label:`Warlock ${level} pays an authentic ${pactLevel(level)}-level slot from a capacity-${pactMax(level)} pool, with native receipt roundtrip`,passed:true,manualDataPreserved:true});
}

// A genuine level-15 owner has seven learning positions, unlike level 9's five.
let combined=baseCard(15);
assert.equal(api.sheetChoices(combined,entries).find((row:any)=>row.id===choiceId).count,7);
const combinedIds=additions.map(({name},slot)=>{const {root,child}=learn(combined,name,slot);return {name,rootId:root.id,spellId:child.id,pool:api.specialSpellResource(child.id,combined)};});
assert.equal(new Set(combinedIds.map(row=>row.pool)).size,7,'Seven invocations must never share a daily pool');
for(const row of combinedIds)assert.equal(combined.runtime.resources[row.pool].current,1);
const combinedProtected=json({hp:combined.runtime.hp,tempHp:combined.runtime.tempHp,abilities:combined.abilities,notes:combined.notes,manual:combined.runtime.resources['manual-sentinel'],normal:combined.runtime.resources['spell-slot:5']});
for(const row of combinedIds.slice(0,3))cast(combined,row.spellId,15);
for(const [i,row] of combinedIds.entries())assert.equal(combined.runtime.resources[row.pool].current,i<3?0:1);
assert.equal(combined.runtime.resources['pact-slot:5'].current,0);reject(combined,combinedIds[3].spellId);
assert.equal(combined.runtime.resources[combinedIds[3].pool].current,1,'No-slot rejection does not consume a still-available invocation');
assert.deepEqual(api.sourceSpellRestPlan(combined,'short').resources,[]);
const restore=request(combined,combinedIds[0].spellId,'source','restore');assert.equal(api.performSpellAction(combined,restore).status,'applied');
for(const [i,row] of combinedIds.entries())assert.equal(combined.runtime.resources[row.pool].current,i===1||i===2?0:1);
assert.equal(combined.runtime.resources['pact-slot:5'].current,0,'One confirmed invocation restore is not a pact-slot rest');
combined=reopen(combined);sync(combined);
assert.deepEqual(json({hp:combined.runtime.hp,tempHp:combined.runtime.tempHp,abilities:combined.abilities,notes:combined.notes,manual:combined.runtime.resources['manual-sentinel'],normal:combined.runtime.resources['spell-slot:5']}),combinedProtected);
steps.push({rule:'Seven independent PHB invocation pools',label:'Real Warlock 15 learns seven grants, spends three authentic slots, preserves four independent budgets, rejects a fourth cast atomically and restores only one invocation through native persistence',passed:true,manualDataPreserved:true});

// Canonical invocation budgets survive a newly imported catalog entry ID.
for(const {name,level} of additions){
 let card=baseCard(level);const {child}=learn(card,name),pool=api.specialSpellResource(child.id,card),pact=`pact-slot:${pactLevel(level)}`;
 cast(card,child.id,level);const spent=json(card.runtime.sourceSpellSpent);
 api.setSheetChoiceSlot(card,choiceId,0,undefined,[]);sync(card);
 const entry=find('feature',name),alias={...structuredClone(entry),id:entry.id+':alternate-import-id'};
 const alternateCatalog=[...entries.filter((row:any)=>row.id!==entry.id),alias];
 api.setSheetChoiceSlot(card,choiceId,0,alias.id,alternateCatalog);sync(card,alternateCatalog);
 const next=granted(card,learned(card,name).id)[0];assert.notEqual(next.id,child.id,'This probe must exercise a different generated spell identity');
 assert.equal(api.specialSpellResource(next.id,card),pool,'Canonical rule and actual class owner identify the use pool, not imported entry IDs');
 assert.equal(card.runtime.resources[pool].current,0);assert.equal(card.runtime.resources[pact].current,pactMax(level)-1);reject(card,next.id);
 card=reopen(card);sync(card);assert.equal(card.runtime.resources[pool].current,0);assert.deepEqual(json(card.runtime.sourceSpellSpent),spent);
 steps.push({rule:`${name}|PHB`,label:'Withdrawal and relearning through a different imported entry ID preserve the same canonical consumed pool through native persistence',passed:true,manualDataPreserved:true});
}

// Manual same-name invocations and pre-existing counter collisions are not adopted.
for(const {name,level} of additions){
 let card=baseCard(level),entry=find('feature',name);
 const manual={id:'manual-invocation',entry:structuredClone(entry),level:1,quantity:1,equipped:false};card.selections.push(manual);
 sync(card,entries);assert.deepEqual(card.selections.find((r:any)=>r.id===manual.id),manual);
 assert(!api.planSourceSpells(card,entries).grants.some((g:any)=>g.owner.id===manual.id&&g.config.sourceGrant?.usage==='invocation-pact'));
 const before=JSON.stringify(card);assert.throws(()=>api.setSheetChoiceSlot(card,choiceId,0,entry.id,entries));assert.equal(JSON.stringify(card),before);
 card=baseCard(level);const probe=structuredClone(card),{child}=learn(probe,name),pool=api.specialSpellResource(child.id,probe);
 const balance={name:'Player-authored same-key balance',type:'count',max:7,current:4};card.runtime.resources[pool]=structuredClone(balance);
 const actual=learn(card,name);assert.equal(actual.child.id,child.id);assert.deepEqual(card.runtime.resources[pool],balance);
 reject(card,child.id);reject(card,child.id,'source','restore');for(let i=0;i<2;i++)sync(card);
 assert.deepEqual(card.runtime.resources[pool],balance);card=reopen(card);assert.deepEqual(card.runtime.resources[pool],balance);
 api.removeSelection(card,'proof-warlock');sync(card);assert.deepEqual(card.runtime.resources[pool],balance,'Deleting the class cannot delete a manual counter which the source never owned');
 steps.push({rule:`${name}|PHB`,label:'Same-name manual invocation and pre-existing same-key authored balance survive sync, reopen and class removal, never adopted for joint payment or recovery',passed:true,manualDataPreserved:true});
}

assert.equal(git('rev-parse','HEAD'),consumerRevision,'Consumer revision changed during replay');assertCleanSource();
assert.equal(git('rev-parse','HEAD:src'),consumerSourceTree,'Consumer source tree changed during replay');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),producerRevision,'Producer revision changed during replay');
const report={
 schemaVersion:1,updatedAt:new Date().toISOString(),consumerRevision,consumerSourceTree,producerRevision,sourceRevision,inputs,entryHashes,
 rules:additions.map(({name,spell,spellLevel,level})=>({reference:`${name}|PHB`,spellReference:`${spell}|PHB`,spellLevel,minimumWarlockLevel:level,usage:'one invocation use plus one authentic Warlock pact slot',recovery:'explicit confirmed long-rest invocation-only restore'})),steps,
 definition:'Bounded exact-source consumer API workflow proof; not complete class/spell automation, browser coverage, storage failure certification or release certification',
 manualBoundaries:[
  'Targets, components including materials, casting time, saves, concentration, duration, upcast effects and all actual spell effects remain manual',
  'Polymorph statistics and form choice, summoning selection/control and concentration-loss consequences remain manual',
  'Only the explicitly selected invocation use is restored; pact slots still use the existing resource editor; no general rest UI is enabled or certified',
  'Invocation replacement timing and unknown prerequisites are not automatically authorized',
  'Native export/import proves the card schema and saved ledger roundtrip, not a database failure, server authority or multiplayer delivery guarantee',
 ],browser:'not-run',currentReleaseAvailable:null,
};
mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,consumerRevision,producerRevision,passed:steps.length,failed:0}));
