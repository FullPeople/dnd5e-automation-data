/** Bounded exact-source replay for two TCE infusion charge mechanisms.
 * Publisher prose, character snapshots and generated adapters are not reports. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,realpathSync,writeFileSync} from 'node:fs';
import {dirname,isAbsolute,join,resolve,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
const [webRoot,inputRoot,output='.cache/infusion-charges.json']=process.argv.slice(2);
if(!webRoot||!inputRoot)throw Error('Usage: audit_infusion_charges.ts WEB_ROOT FROZEN_INPUT_ROOT [OUTPUT]');
const sourceRevision='e2623b204ddbdf2bcfa8317acfc962de89c676e2';
const expectedInputs:Record<string,string>={
 'optionalfeatures.json':'031970dfac1770a548549bd30535319c2493c47ebeaedfdb6a601651bbfc3844',
 'class/class-artificer.json':'c65cad57eebdfff6508a0cfb821ec670a41cc3f057512cadd19f3805cf1a01d7',
 'items.json':'883f7bb4df2eb35fb37e7caa3a8765e0209014caa360d1c0358daa6f4b2da488',
 'items-base.json':'8933a3e70e47aa4fd6196bd7f1f2e3a57d6d8dbe7e781d37bb6a0519d7c4ffff',
};
const expectedEntries:Record<string,string>={
 'Repulsion Shield|TCE':'28ec9c4a9c276621b12dd971841d6837b5d2bfc3132d286b6e51d1acd885f64b',
 'Mind Sharpener|TCE':'d8a1185d43052a39b5ddd0ae50758fb34acbc7bd9765474898957305c3591f84',
 'Robes|PHB':'6bfbf76315967903d54c62cd91771b280d4e3063c737fc9e2d9835450831ada9',
 'Shield|PHB':'b83f2a31bea90264a7897c65cea8573da00915f5fef7db19308b2c960c378985',
 'Infuse Item|Artificer|TCE|2':'5ea883f06ec7afaba3f78859d665806f32edba0d95c42d2dc35dc2675765b457',
 'Artificer|TCE':'2c4248ad45438e0dd27a57a7a274c15756308e8e23c410b0f0f58bc7eadfc5e1',
};
const knownProgression=[0,4,4,4,4,6,6,6,6,8,8,8,8,10,10,10,10,12,12,12],activeProgression=[0,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6];
const mechanics=[
 {reference:'Repulsion Shield|TCE',owner:'Artificer|TCE',mechanism:'armor-bonus',itemTypes:['S'],minLevel:6,requiresAttunement:true,requiresHeld:true,bonus:1,charges:{max:4,use:1,recovery:'dawn-1d4'}},
 {reference:'Mind Sharpener|TCE',owner:'Artificer|TCE',mechanism:'concentration-reaction',itemTypes:['LA','MA','HA','G'],targetReferences:['Robes|PHB'],minLevel:2,bonus:0,charges:{max:4,use:1,recovery:'dawn-1d4'}},
];
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const bytesHash=(path:string)=>createHash('sha256').update(readFileSync(path)).digest('hex');
const json=(value:any)=>JSON.parse(JSON.stringify(value));
const git=(...args:string[])=>execFileSync('git',args,{cwd:webRoot,encoding:'utf8'}).trim();
function assertCleanSource(){assert.equal(git('status','--porcelain','--untracked-files=all','--ignored=matching','--','src'),'','Consumer src must be clean, including staged, untracked and ignored files');}
assertCleanSource();
const consumerRevision=git('rev-parse','HEAD'),consumerSourceTree=git('rev-parse','HEAD:src');
const producerRevision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
assert.match(consumerRevision,/^[a-f0-9]{40}$/);
const evidence=JSON.parse(readFileSync(join(webRoot,'src/core/automation/infusionEvidence.json'),'utf8'));
assert.equal(evidence.frozenRevision,sourceRevision,'Consumer source revision');
assert.deepEqual(evidence.inputs,expectedInputs,'Consumer canonical input hashes');
assert.equal(evidence.classFeatureReference,'物品注法|奇械师|TCE|2','Consumer exact class source reference');
assert.equal(evidence.classFeatureEnglish,'Infuse Item','Consumer exact class source identity');
assert.deepEqual(evidence.knownProgression,knownProgression,'Consumer exact known infusion capacity');
assert.deepEqual(evidence.activeProgression,activeProgression,'Consumer exact active infusion capacity');
for(const expected of mechanics){
 const name=expected.reference.split('|')[0],rows=evidence.rules.filter((row:any)=>row.reference===expected.reference);
 assert.equal(rows.length,1,'Consumer exact '+name+' mechanics');
 const keys=['reference','owner','mechanism','itemTypes','targetReferences','minLevel','requiresAttunement','requiresHeld','bonus','charges'];
 assert.deepEqual(Object.fromEntries(keys.map(key=>[key,rows[0][key]])),Object.fromEntries(keys.map(key=>[key,(expected as any)[key]])),'Consumer exact '+name+' mechanics');
}
for(const [key,sha256] of Object.entries(expectedEntries))assert.equal(evidence.entryHashes[key],sha256,'Consumer independently reviewed entry hash '+key);
const indexPath=join(inputRoot,'index.json');assert(existsSync(indexPath),'Frozen input manifest is required');
const index=JSON.parse(readFileSync(indexPath,'utf8')),inputs:Record<string,string>={},inputFiles:Record<string,string>={[indexPath]:bytesHash(indexPath)};
function input(path:string){
 const rows=index.rows?.filter((row:any)=>row.url===`https://5e.kiwee.top/data/${path}`);
 assert.equal(rows?.length,1,'Expected exactly one frozen input '+path);
 const filename=rows[0].path;assert.equal(typeof filename,'string','Frozen filename');
 const local=resolve(inputRoot,filename);
 assert(!isAbsolute(filename)&&local.startsWith(resolve(inputRoot)+sep),'Input must remain inside frozen directory');
 assert(realpathSync(local).startsWith(realpathSync(inputRoot)+sep),'Resolved input must remain inside frozen directory');
 const body=JSON.parse(readFileSync(local,'utf8')),sha256=hash(body);
 assert.equal(sha256,expectedInputs[path],'Frozen input mismatch '+path);assert.equal(sha256,rows[0].sha256,'Frozen manifest mismatch '+path);
 inputs[path]=sha256;inputFiles[local]=bytesHash(local);return body;
}
const optional=input('optionalfeatures.json'),classes=input('class/class-artificer.json'),items=input('items.json'),base=input('items-base.json');
const entryHashes:Record<string,string>={};
for(const [key,rows] of [
 ['Repulsion Shield|TCE',optional.optionalfeature.filter((row:any)=>row.ENG_name==='Repulsion Shield'&&row.source==='TCE')],
 ['Mind Sharpener|TCE',optional.optionalfeature.filter((row:any)=>row.ENG_name==='Mind Sharpener'&&row.source==='TCE')],
 ['Robes|PHB',items.item.filter((row:any)=>row.ENG_name==='Robes'&&row.source==='PHB')],
 ['Shield|PHB',base.baseitem.filter((row:any)=>row.ENG_name==='Shield'&&row.source==='PHB')],
 ['Infuse Item|Artificer|TCE|2',classes.classFeature.filter((row:any)=>row.ENG_name==='Infuse Item'&&row.source==='TCE'&&row.level===2&&row.classSource==='TCE')],
 ['Artificer|TCE',classes.class.filter((row:any)=>row.ENG_name==='Artificer'&&row.source==='TCE')],
] as const){assert.equal(rows.length,1,'Exact source identity '+key);entryHashes[key]=hash(rows[0]);assert.equal(entryHashes[key],expectedEntries[key],'Independent reviewed entry hash '+key);}
const rawOwner=classes.class.find((row:any)=>row.ENG_name==='Artificer'&&row.source==='TCE');
assert.deepEqual(rawOwner.optionalfeatureProgression[0].featureType,['AI']);assert.deepEqual(rawOwner.optionalfeatureProgression[0].progression,knownProgression);
assert(rawOwner.classFeatures.includes(evidence.classFeatureReference));assert.deepEqual(rawOwner.classTableGroups[0].rows.map((row:any[])=>row[1]),activeProgression);
for(const name of ['Repulsion Shield','Mind Sharpener']){const raw=optional.optionalfeature.find((row:any)=>row.ENG_name===name&&row.source==='TCE');assert.deepEqual(raw.featureType,['AI']);assert.equal(raw.page,name==='Repulsion Shield'?23:22);}
const sourceBefore=hash({optional,classes,items,base});
mkdirSync('.cache',{recursive:true});const adapter=resolve('.cache/infusion-charges-consumer.mjs');
const exports:Record<string,string[]>={
 'src/core/model.ts':['newCharacter'],
 'src/core/automation/state.ts':['newAutomationState'],
 'src/data/catalog.ts':['normalizeData'],
 'src/core/sheet.ts':['syncFeatures','removeSelection'],
 'src/core/automation/choices.ts':['sheetChoices','setSheetChoiceSlot'],
 'src/core/automation/infusions.ts':['infusionRule','infusionTargets','setInfusionTarget','setInfusionHeld'],
 'src/core/automation/infusionCharges.ts':['infusionChargeOffer','infusionChargeKey','infusionChargeActionRequest','performInfusionChargeAction'],
 'src/core/engine.ts':['evaluate'],
 'src/core/export.ts':['exportCharacter','exportLinkedOwlbear'],
 'src/core/validation.ts':['readCharacter','validateCharacter','importOwlbear'],
 'src/core/automation/rest.ts':['performRest'],
 'src/core/resources.ts':['setResource'],
};
const bundle=await build({stdin:{contents:Object.entries(exports).map(([path,names])=>`export {${names.join(',')}} from ${JSON.stringify(resolve(webRoot,path))};`).join('\n'),resolveDir:resolve(webRoot),loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:adapter,metafile:true,define:{'import.meta.env.MODE':'"standalone"','import.meta.env.DEV':'false'}});
const api=await import(pathToFileURL(adapter).href);
const entries=api.normalizeData(structuredClone({...optional,...classes,...items,...base}),'frozen-infusion-charges');
assert.equal(hash({optional,classes,items,base}),sourceBefore,'Normalizer must not mutate frozen source objects');
const catalogBefore=hash(entries);
const find=(kind:string,name:string,source:string)=>{const rows=entries.filter((e:any)=>e.kind===kind&&e.english===name&&e.source===source);assert.equal(rows.length,1,'Unique normalized entry '+name+'|'+source);return rows[0];};
const owner=find('class','Artificer','TCE'),shield=find('feature','Repulsion Shield','TCE'),mind=find('feature','Mind Sharpener','TCE'),defense=find('feature','Enhanced Defense','TCE'),weapon=find('feature','Enhanced Weapon','TCE');
const shieldItem=find('item','Shield','PHB'),robes=find('item','Robes','PHB'),armor=find('item','Leather Armor','PHB'),sword=find('item','Longsword','PHB');
const choiceId='proof-artificer:class-optional:0';
const steps:{label:string;passed:true;manualDataPreserved:true}[]=[];
const preserve=(c:any)=>json({abilities:c.abilities,notes:c.notes,hp:c.runtime.hp,tempHp:c.runtime.tempHp,resources:c.runtime.resources,sheetBonuses:c.sheetBonuses,skillBonuses:c.skillBonuses,proficiencies:c.proficiencies,expertise:c.expertise});
const selection=(c:any,id:string)=>{const row=c.selections.find((r:any)=>r.id===id);assert(row,'Selection '+id);return row;};
function baseCard(level=6){
 const c=api.newCharacter('2014');c.automation=api.newAutomationState();c.profile.enabledSources=['TCE','PHB'];
 c.selections=[{id:'proof-artificer',entry:structuredClone(owner),level,quantity:1,equipped:false},...[[shieldItem,'shield-a'],[shieldItem,'shield-b'],[robes,'robes-a'],[robes,'robes-b'],[armor,'armor-a'],[sword,'weapon-a']].map(([entry,id])=>({id,entry:structuredClone(entry),level:1,quantity:1,equipped:false,attuned:false}))];
 c.abilities.dex=14;c.notes='Authored charge preservation probe';c.sheetBonuses={ac:3};c.skillBonuses={athletics:1};c.proficiencies={athletics:true};c.expertise={athletics:true};
 c.runtime.hp=2;c.runtime.tempHp=1;c.runtime.resources={'manual-sentinel':{current:1,max:7},'Repulsion Shield':{current:1,max:4},'Mind Sharpener':{current:2,max:9},[api.infusionChargeKey('proof-artificer','Mind Sharpener|TCE','robes-a')]:{current:77,max:99,unlimited:true,protocol:99}};
 api.syncFeatures(c,entries);
 const source=c.selections.filter((row:any)=>row.parentId==='proof-artificer'&&row.grantKey==='ref:物品注法|奇械师|TCE|2');assert.equal(source.length,1,'Real generated Infuse Item source');assert.equal(source[0].entry.english,'Infuse Item');
 const choice=api.sheetChoices(c,entries).find((row:any)=>row.id===choiceId);assert(choice,'Real generated infusion choice');
 api.setSheetChoiceSlot(c,choiceId,0,mind.id,entries);if(level>=6)api.setSheetChoiceSlot(c,choiceId,1,shield.id,entries);
 return c;
}
let card=baseCard(),manual=preserve(card),counter=0;
function check(label:string,fn:()=>void){try{fn();assert.deepEqual(preserve(card),manual,label+' preserves authored state');api.validateCharacter(json(card));}catch(error){throw Error(label,{cause:error});}steps.push({label,passed:true,manualDataPreserved:true});}
const offer=(c:any,e:any)=>{const before=JSON.stringify(c),result=api.infusionChargeOffer(c,choiceId,e.id);assert.equal(JSON.stringify(c),before,'Offer must be pure');return result;};
const request=(c:any,e:any,action:any)=>{const before=JSON.stringify(c),result=api.infusionChargeActionRequest(c,choiceId,e.id,`source-charge-${++counter}`,action);assert.equal(JSON.stringify(c),before,'Preparing a request must be pure');return result;};
function apply(c:any,e:any,action:any){const req=request(c,e,action),result=api.performInfusionChargeAction(c,req);assert.equal(result.status,'applied',result.message);return {req,result};}
function reject(c:any,e:any,action:any){const req=request(c,e,action),before=JSON.stringify(c),result=api.performInfusionChargeAction(c,req);assert.equal(result.status,'rejected','Expected rejection');assert.equal(JSON.stringify(c),before,'Rejection must not write');return result;}
const initialize=(c:any,e:any,initial:number)=>apply(c,e,{kind:'initialize',initial});
const use=(c:any,e:any)=>apply(c,e,{kind:'use',triggerConfirmed:true,reactionConfirmed:true});
const dawn=(c:any,e:any,roll:number)=>apply(c,e,{kind:'dawn',dawnConfirmed:true,roll});
function bind(c:any,e:any,targetId:string){api.setInfusionTarget(c,choiceId,e.id,targetId);}
function ready(c:any,e:any,targetId:string){bind(c,e,targetId);selection(c,targetId).equipped=true;if(e===shield){selection(c,targetId).attuned=true;api.setInfusionHeld(c,choiceId,e.id,true);}}
function reopen(c:any,linked=false){
 const before=JSON.stringify(c),payload=json(linked?api.exportLinkedOwlbear(c,api.evaluate(c)):api.exportCharacter(c)),inputBefore=JSON.stringify(payload),loaded=linked?{character:api.importOwlbear(payload),repaired:[]}:api.readCharacter(payload);
 assert.deepEqual(loaded.repaired,[],'Roundtrip must not need repair');assert.equal(JSON.stringify(c),before,'Export must not mutate input');assert.equal(JSON.stringify(payload),inputBefore,'Import must not mutate payload');assert.deepEqual(loaded.character.runtime.infusionCharges,c.runtime.infusionCharges,'Charge history survives roundtrip');return loaded.character;
}
check('Learning creates no binding or implicit full charges',()=>{assert.equal(card.infusions,undefined);assert.equal(card.runtime.infusionCharges,undefined);assert.equal(offer(card,shield).canUse,false);assert.equal(offer(card,mind).canInitialize,false);});
check('Existing Repulsion binding has no automatic full balance',()=>{ready(card,shield,'shield-a');assert.equal(card.runtime.infusionCharges,undefined);assert.equal(offer(card,shield).canUse,false);assert.equal(offer(card,shield).canInitialize,true);});
for(const initial of [0,1,2,3,4])check(`Explicit initial balance ${initial} is accepted once`,()=>{card=baseCard();ready(card,shield,'shield-a');initialize(card,shield,initial);assert.equal(offer(card,shield).current,initial);reject(card,shield,{kind:'initialize',initial:4});});
for(const initial of [-1,5,1.5,null,'4'])check(`Invalid initial balance ${String(initial)} writes nothing`,()=>{card=baseCard();ready(card,shield,'shield-a');reject(card,shield,{kind:'initialize',initial});assert.equal(card.runtime.infusionCharges,undefined);});
check('Fixed reaction cost one and duplicate request are idempotent',()=>{card=baseCard();ready(card,shield,'shield-a');initialize(card,shield,2);const {req}=use(card,shield);assert.equal(offer(card,shield).current,1);const before=JSON.stringify(card);assert.equal(api.performInfusionChargeAction(card,req).status,'duplicate');assert.equal(JSON.stringify(card),before);});
for(const [label,action] of [['missing trigger',{kind:'use',reactionConfirmed:true}],['missing reaction',{kind:'use',triggerConfirmed:true}],['false trigger',{kind:'use',triggerConfirmed:false,reactionConfirmed:true}],['false reaction',{kind:'use',triggerConfirmed:true,reactionConfirmed:false}]] as const)check(`Use rejects ${label} without writing`,()=>{card=baseCard();ready(card,shield,'shield-a');initialize(card,shield,2);reject(card,shield,action);});
check('Zero balance underflow rejects without a receipt or write',()=>{card=baseCard();ready(card,shield,'shield-a');initialize(card,shield,0);reject(card,shield,{kind:'use',triggerConfirmed:true,reactionConfirmed:true});assert.equal(offer(card,shield).current,0);});
for(const roll of [1,2,3,4])check(`Dawn restores actual d4 result ${roll}`,()=>{card=baseCard();ready(card,shield,'shield-a');initialize(card,shield,0);dawn(card,shield,roll);assert.equal(offer(card,shield).current,roll);});
check('Dawn caps recovery at four instead of overfilling',()=>{card=baseCard();ready(card,shield,'shield-a');initialize(card,shield,3);dawn(card,shield,4);assert.equal(offer(card,shield).current,4);});
for(const roll of [0,5,1.5,null,'4'])check(`Dawn rejects invalid actual roll ${String(roll)}`,()=>{card=baseCard();ready(card,shield,'shield-a');initialize(card,shield,1);reject(card,shield,{kind:'dawn',dawnConfirmed:true,roll});});
check('Dawn requires explicit confirmation',()=>{card=baseCard();ready(card,shield,'shield-a');initialize(card,shield,1);reject(card,shield,{kind:'dawn',roll:4});});
for(const kind of ['short-rest','long-rest','reset','refill'])check(`Unknown ${kind} charge action cannot grant recovery`,()=>{card=baseCard();ready(card,shield,'shield-a');initialize(card,shield,1);reject(card,shield,{kind});});
for(const state of ['unequipped','unattuned','unheld'])check(`Repulsion use needs ${state.slice(2)} while dawn does not`,()=>{card=baseCard();ready(card,shield,'shield-a');initialize(card,shield,1);if(state==='unequipped')selection(card,'shield-a').equipped=false;else if(state==='unattuned')selection(card,'shield-a').attuned=false;else api.setInfusionHeld(card,choiceId,shield.id,false);assert.equal(offer(card,shield).canUse,false);assert.equal(offer(card,shield).canDawn,true);reject(card,shield,{kind:'use',triggerConfirmed:true,reactionConfirmed:true});dawn(card,shield,2);assert.equal(offer(card,shield).current,3);});
check('Mind uses worn exact PHB Robes without attunement or holding and adds no AC',()=>{card=baseCard(2);ready(card,mind,'robes-a');const baseline=structuredClone(card);delete baseline.infusions;const before=JSON.stringify(card),d=api.evaluate(card);assert.equal(d.ac,api.evaluate(baseline).ac);assert.equal(JSON.stringify(card),before);initialize(card,mind,2);assert.equal(offer(card,mind).canUse,true);use(card,mind);assert.equal(offer(card,mind).current,1);});
check('Mind also accepts worn armor without attunement and adds no AC',()=>{card=baseCard(2);ready(card,mind,'armor-a');const plain=structuredClone(card);delete plain.infusions;assert.equal(api.evaluate(card).ac,api.evaluate(plain).ac);initialize(card,mind,2);use(card,mind);assert.equal(offer(card,mind).current,1);});
check('Mind requires wearing for use but not for dawn',()=>{card=baseCard(2);bind(card,mind,'robes-a');initialize(card,mind,0);assert.equal(offer(card,mind).canUse,false);assert.equal(offer(card,mind).canDawn,true);dawn(card,mind,2);reject(card,mind,{kind:'use',triggerConfirmed:true,reactionConfirmed:true});});
for(const [label,edit] of [
 ['display-name-only robes',(row:any)=>{row.entry.english='Other';row.entry.raw.ENG_name='Other';row.entry.name='Robes';}],
 ['XPHB robes',(row:any)=>{row.entry.source='XPHB';row.entry.raw.source='XPHB';}],
 ['generic gear',(row:any)=>{row.entry.english='Rope';row.entry.raw.ENG_name='Rope';}],
 ['magic robes',(row:any)=>{row.entry.raw.rarity='common';}],
 ['stacked robes',(row:any)=>{row.quantity=2;}],
 ['shield for Mind',(row:any)=>{row.entry=structuredClone(shieldItem);}],
] as const)check(`Mind rejects ${label}`,()=>{card=baseCard();edit(selection(card,'robes-a'));const before=JSON.stringify(card);assert.throws(()=>bind(card,mind,'robes-a'));assert.equal(JSON.stringify(card),before);});
check('Renaming display labels preserves canonical infusion and target identity',()=>{card=baseCard();card.classChoiceSnapshots[mind.id].name='Player label';selection(card,'robes-a').entry.name='Tailored robe';ready(card,mind,'robes-a');initialize(card,mind,2);use(card,mind);assert.equal(offer(card,mind).current,1);});
check('Artificer level rather than total level gates Repulsion',()=>{card=baseCard();ready(card,shield,'shield-a');initialize(card,shield,2);selection(card,'proof-artificer').level=5;card.selections.push({id:'other-class',entry:{...structuredClone(owner),id:'other-class-entry',english:'Other Class',name:'Other Class',raw:{_category:'class',source:'PHB',ENG_name:'Other Class'}},level:15,quantity:1,equipped:false});assert.equal(offer(card,shield).canUse,false);assert.equal(offer(card,shield).canDawn,false);reject(card,shield,{kind:'dawn',dawnConfirmed:true,roll:4});});
check('Downgrade below Infuse Item level suspends Mind',()=>{card=baseCard(2);ready(card,mind,'robes-a');initialize(card,mind,1);selection(card,'proof-artificer').level=1;assert.equal(offer(card,mind).canUse,false);assert.equal(offer(card,mind).canDawn,false);});
for(const [label,edit] of [
 ['source disabled',(c:any)=>{c.profile.enabledSources=['PHB'];}],
 ['automation disabled',(c:any)=>{c.automation.enabled=false;}],
 ['wrong optionalfeature source',(c:any)=>{c.classChoiceSnapshots[shield.id].source='XPHB';}],
 ['unreviewed source feature',(c:any)=>{c.selections.find((r:any)=>r.grantKey==='ref:物品注法|奇械师|TCE|2').entry.english='Other';}],
 ['wrong class identity',(c:any)=>{selection(c,'proof-artificer').entry.english='Other';}],
 ['unknown binding version',(c:any)=>{c.infusions.version=99;}],
 ['duplicate target binding',(c:any)=>{c.infusions.bindings.push({...c.infusions.bindings[0]});}],
] as const)check(`Current ${label} fails closed without losing history`,()=>{card=baseCard();ready(card,shield,'shield-a');initialize(card,shield,1);const stored=json(card.runtime.infusionCharges);edit(card);assert.equal(offer(card,shield).canUse,false);assert.equal(offer(card,shield).canDawn,false);reject(card,shield,{kind:'use',triggerConfirmed:true,reactionConfirmed:true});assert.deepEqual(card.runtime.infusionCharges,stored);});
for(const target of ['class','feature','infusion'])for(const field of ['ENG_name','source'])check(`Canonical ${target} raw ${field} tampering cannot authorize reaction charges`,()=>{card=baseCard();ready(card,shield,'shield-a');initialize(card,shield,1);const raw=target==='class'?selection(card,'proof-artificer').entry.raw:target==='feature'?card.selections.find((row:any)=>row.grantKey==='ref:物品注法|奇械师|TCE|2').entry.raw:card.classChoiceSnapshots[shield.id].raw;raw[field]=field==='ENG_name'?'Unreviewed Source':'XPHB';const stored=json(card.runtime.infusionCharges);assert.equal(offer(card,shield).canUse,false);assert.equal(offer(card,shield).canDawn,false);reject(card,shield,{kind:'use',triggerConfirmed:true,reactionConfirmed:true});reject(card,shield,{kind:'dawn',dawnConfirmed:true,roll:4});assert.deepEqual(card.runtime.infusionCharges,stored);});
for(const e of [shield,mind])for(const field of ['ENG_name','source'])check(`Canonical ${e.english} target raw ${field} mismatch cannot authorize charges`,()=>{card=baseCard();const targetId=e===shield?'shield-a':'robes-a';ready(card,e,targetId);initialize(card,e,1);selection(card,targetId).entry.raw[field]=field==='ENG_name'?'Unreviewed Item':'XPHB';const stored=json(card.runtime.infusionCharges);assert.equal(offer(card,e).canUse,false);assert.equal(offer(card,e).canDawn,false);reject(card,e,{kind:'use',triggerConfirmed:true,reactionConfirmed:true});reject(card,e,{kind:'dawn',dawnConfirmed:true,roll:4});assert.deepEqual(card.runtime.infusionCharges,stored);});
check('Over-capacity bindings suspend charges without deleting intent',()=>{card=baseCard();ready(card,shield,'shield-a');initialize(card,shield,1);bind(card,mind,'robes-a');api.setSheetChoiceSlot(card,choiceId,2,defense.id,entries);bind(card,defense,'armor-a');selection(card,'proof-artificer').level=5;assert.equal(offer(card,mind).canDawn,false);api.setSheetChoiceSlot(card,choiceId,3,weapon.id,entries);const before=JSON.stringify(card);assert.throws(()=>bind(card,weapon,'weapon-a'));assert.equal(JSON.stringify(card),before);assert.equal(card.runtime.infusionCharges.records[api.infusionChargeKey('proof-artificer','Repulsion Shield|TCE','shield-a')].current,1);});
check('One-item conflict cannot overwrite another binding or history',()=>{card=baseCard();ready(card,mind,'armor-a');initialize(card,mind,2);api.setSheetChoiceSlot(card,choiceId,2,defense.id,entries);const before=JSON.stringify(card);assert.throws(()=>bind(card,defense,'armor-a'));assert.equal(JSON.stringify(card),before);});
check('A to B to A preserves each target balance without automatic creation',()=>{card=baseCard();ready(card,shield,'shield-a');initialize(card,shield,3);use(card,shield);ready(card,shield,'shield-b');assert.equal(offer(card,shield).current,undefined);initialize(card,shield,1);ready(card,shield,'shield-a');assert.equal(offer(card,shield).current,2);reject(card,shield,{kind:'initialize',initial:4});ready(card,shield,'shield-b');assert.equal(offer(card,shield).current,1);});
check('Forgetting and relearning cannot wash spent charge history',()=>{card=baseCard();ready(card,mind,'robes-a');initialize(card,mind,2);use(card,mind);const key=offer(card,mind).key;api.setSheetChoiceSlot(card,choiceId,0,undefined,entries);assert.equal(card.infusions.bindings.some((r:any)=>r.entryId===mind.id),false);assert.equal(card.runtime.infusionCharges.records[key].current,1);card=reopen(card);api.setSheetChoiceSlot(card,choiceId,0,mind.id,entries);ready(card,mind,'robes-a');assert.equal(offer(card,mind).current,1);reject(card,mind,{kind:'initialize',initial:4});});
check('Source and automation disable then reopen preserve spent history',()=>{card=baseCard();ready(card,mind,'robes-a');initialize(card,mind,1);const stored=json(card.runtime.infusionCharges);card.profile.enabledSources=['PHB'];card.automation.enabled=false;card=reopen(card);assert.deepEqual(card.runtime.infusionCharges,stored);card.profile.enabledSources=['TCE','PHB'];card.automation.enabled=true;assert.equal(offer(card,mind).current,1);});
check('Canonical keys survive imported entry ID aliases without replenishing',()=>{card=baseCard();ready(card,mind,'robes-a');initialize(card,mind,2);use(card,mind);const key=offer(card,mind).key,newId='alias:'+mind.id,aliased={...structuredClone(card.classChoiceSnapshots[mind.id]),id:newId};card.classChoiceSnapshots[newId]=aliased;delete card.classChoiceSnapshots[mind.id];card.answers[choiceId]=card.answers[choiceId].map((id:string)=>id===mind.id?newId:id);card.infusions.bindings[0].entryId=newId;const result=api.infusionChargeOffer(card,choiceId,newId);assert.equal(result.key,key);assert.equal(result.current,1);});
check('Distinct class instances use distinct history keys',()=>{const a=api.infusionChargeKey('owner-a','Mind Sharpener|TCE','robes-a'),b=api.infusionChargeKey('owner-b','Mind Sharpener|TCE','robes-a');assert.notEqual(a,b);assert.notEqual(a,api.infusionChargeKey('owner-a','Repulsion Shield|TCE','robes-a'));assert.notEqual(a,api.infusionChargeKey('owner-a','Mind Sharpener|TCE','robes-b'));});
check('A different real Artificer class instance cannot inherit or erase old history',()=>{card=baseCard();ready(card,mind,'robes-a');initialize(card,mind,2);const originalKey=offer(card,mind).key;api.setInfusionTarget(card,choiceId,mind.id,null);api.removeSelection(card,'proof-artificer');card.selections.push({id:'second-artificer',entry:structuredClone(owner),level:6,quantity:1,equipped:false});api.syncFeatures(card,entries);const secondChoice='second-artificer:class-optional:0';assert(api.sheetChoices(card,entries).some((row:any)=>row.id===secondChoice));api.setSheetChoiceSlot(card,secondChoice,0,mind.id,entries);api.setInfusionTarget(card,secondChoice,mind.id,'robes-a');const second=api.infusionChargeOffer(card,secondChoice,mind.id);assert.notEqual(second.key,originalKey);assert.equal(second.current,undefined);const req=api.infusionChargeActionRequest(card,secondChoice,mind.id,`second-class-${++counter}`,{kind:'initialize',initial:1});assert.equal(api.performInfusionChargeAction(card,req).status,'applied');assert.equal(card.runtime.infusionCharges.records[originalKey].current,2);assert.equal(card.runtime.infusionCharges.records[second.key].current,1);card=reopen(card);});
check('Conflicting worn shields suspend reaction use but not dawn recovery',()=>{card=baseCard();ready(card,shield,'shield-a');initialize(card,shield,1);selection(card,'shield-b').equipped=true;assert.equal(offer(card,shield).canUse,false);assert.equal(offer(card,shield).canDawn,true);reject(card,shield,{kind:'use',triggerConfirmed:true,reactionConfirmed:true});dawn(card,shield,1);assert.equal(offer(card,shield).current,2);});
check('Identical card data with a different character ID rejects the original request',()=>{card=baseCard();ready(card,mind,'robes-a');initialize(card,mind,2);const req=request(card,mind,{kind:'use',triggerConfirmed:true,reactionConfirmed:true}),other=structuredClone(card);other.id='different-character';assert.equal(offer(other,mind).key,offer(card,mind).key,'Ownership record key intentionally excludes character ID');const before=JSON.stringify(other);assert.equal(api.performInfusionChargeAction(other,req).status,'rejected');assert.equal(JSON.stringify(other),before);});
check('Stale request basis rejects after target rebind without writing',()=>{card=baseCard();ready(card,mind,'robes-a');initialize(card,mind,2);const req=request(card,mind,{kind:'use',triggerConfirmed:true,reactionConfirmed:true});ready(card,mind,'robes-b');const before=JSON.stringify(card);assert.equal(api.performInfusionChargeAction(card,req).status,'rejected');assert.equal(JSON.stringify(card),before);});
check('Stale charge sequence rejects after another successful action',()=>{card=baseCard();ready(card,mind,'robes-a');initialize(card,mind,2);const req=request(card,mind,{kind:'use',triggerConfirmed:true,reactionConfirmed:true});dawn(card,mind,1);const before=JSON.stringify(card);assert.equal(api.performInfusionChargeAction(card,req).status,'rejected');assert.equal(JSON.stringify(card),before);});
check('Unknown charge store version remains preserved and unavailable',()=>{card=baseCard();ready(card,mind,'robes-a');card.runtime.infusionCharges={version:99,sequence:8,records:{opaque:{private:'preserve'}}};const before=JSON.stringify(card);assert.equal(offer(card,mind).canInitialize,false);assert.equal(offer(card,mind).canUse,false);assert.equal(offer(card,mind).canDawn,false);reject(card,mind,{kind:'initialize',initial:4});assert.equal(JSON.stringify(card),before);card=reopen(card);});
for(const kind of ['short','long'])check(`Actual ${kind} rest does not restore dawn charges`,()=>{card=baseCard();ready(card,mind,'robes-a');initialize(card,mind,1);const sample=structuredClone(card),stored=json(sample.runtime.infusionCharges),resources=json(sample.runtime.resources);api.performRest(sample,{id:`rest-${kind}`,revision:sample.revision,sequence:0,kind,rolls:[],recover:{}});assert.deepEqual(sample.runtime.infusionCharges,stored);assert.deepEqual(sample.runtime.resources,resources);});
check('Generic resource edits cannot change separately owned charge balances',()=>{card=baseCard();ready(card,mind,'robes-a');initialize(card,mind,1);const sample=structuredClone(card),stored=json(sample.runtime.infusionCharges),key=offer(sample,mind).key;api.setResource(sample,key,4);assert.deepEqual(sample.runtime.infusionCharges,stored);assert.equal(offer(sample,mind).current,1);assert.equal(sample.runtime.resources[key].current,4);});
for(const [label,edit] of [
 ['invalid maximum',(c:any,key:string)=>{c.runtime.infusionCharges.records[key].max=5;}],
 ['unlimited record',(c:any,key:string)=>{c.runtime.infusionCharges.records[key].unlimited=true;}],
 ['wrong ownership',(c:any,key:string)=>{c.runtime.infusionCharges.records[key].ownerId='other';}],
 ['invalid balance',(c:any,key:string)=>{c.runtime.infusionCharges.records[key].current=-1;}],
] as const)check(`Malformed owned ${label} is never adopted or overwritten`,()=>{card=baseCard();ready(card,mind,'robes-a');initialize(card,mind,1);const sample=structuredClone(card);edit(sample,offer(sample,mind).key);const before=JSON.stringify(sample);assert.equal(offer(sample,mind).canInitialize,false);reject(sample,mind,{kind:'initialize',initial:4});reject(sample,mind,{kind:'dawn',dawnConfirmed:true,roll:4});assert.throws(()=>api.validateCharacter(json(sample)));assert.equal(JSON.stringify(sample),before);});
for(const [label,edit] of [['revision',(req:any)=>{req.revision++;}],['basis',(req:any)=>{req.basis+='changed';}],['key',(req:any)=>{req.key+='changed';}]] as const)check(`Tampered request ${label} rejects without a write`,()=>{card=baseCard();ready(card,mind,'robes-a');initialize(card,mind,1);const req=request(card,mind,{kind:'use',triggerConfirmed:true,reactionConfirmed:true});edit(req);const before=JSON.stringify(card);assert.equal(api.performInfusionChargeAction(card,req).status,'rejected');assert.equal(JSON.stringify(card),before);});
check('Duplicate ID with changed action is rejected rather than reused',()=>{card=baseCard();ready(card,mind,'robes-a');initialize(card,mind,2);const {req}=use(card,mind),changed={...req,action:{kind:'dawn',dawnConfirmed:true,roll:4}},before=JSON.stringify(card);assert.equal(api.performInfusionChargeAction(card,changed).status,'rejected');assert.equal(JSON.stringify(card),before);});
check('Native and linked exports preserve exact independent charge store',()=>{card=baseCard();ready(card,mind,'robes-a');initialize(card,mind,2);use(card,mind);card=reopen(card);assert.equal(offer(card,mind).current,1);card=reopen(card,true);assert.equal(offer(card,mind).current,1);use(card,mind);assert.equal(offer(card,mind).current,0);});

assert.equal(hash({optional,classes,items,base}),sourceBefore,'Workflow must not mutate frozen source objects');assert.equal(hash(entries),catalogBefore,'Workflow must not mutate normalized catalog');
for(const [path,before] of Object.entries(inputFiles))assert.equal(bytesHash(path),before,'Frozen file changed during replay');
assert.equal(git('rev-parse','HEAD'),consumerRevision,'Consumer revision changed during replay');assertCleanSource();assert.equal(git('rev-parse','HEAD:src'),consumerSourceTree,'Consumer source tree changed during replay');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),producerRevision,'Producer revision changed during replay');
const modules=Object.keys(bundle.metafile!.inputs).map(path=>resolve(path)).filter(path=>path.startsWith(resolve(webRoot)+'/src/')).map(path=>({path:path.slice(resolve(webRoot).length+1),sha256:bytesHash(path)})).sort((a,b)=>a.path.localeCompare(b.path));
for(const row of modules)assert.equal(createHash('sha256').update(execFileSync('git',['cat-file','blob',`${consumerRevision}:${row.path}`],{cwd:webRoot,maxBuffer:16*1024*1024})).digest('hex'),row.sha256,'Bundled consumer bytes must equal committed source');
const report={schemaVersion:1,updatedAt:new Date().toISOString(),consumerRevision,consumerSourceTree,consumerModules:modules,producerRevision,sourceRevision,inputs,entryHashes,rules:mechanics,steps,
 definition:'Bounded exact-source current-consumer API proof for Repulsion Shield and Mind Sharpener charge ownership, use and dawn recovery; not all infusion rules, browser coverage, old-consumer compatibility or release certification',
 manualBoundaries:['Trigger occurrence and reaction availability are confirmed by the user, not simulated.','Dawn occurrence and the actual 1d4 result are user-confirmed, not inferred from rests or wall time.','Repulsion opponent movement, concentration outcomes, external wearers, transfer, death and long-rest infusion lifecycle remain manual.','Native and linked export/import prove these current consumer paths only; browser storage, server recovery, multiplayer delivery and old consumer roundtrips require separate evidence.','Plain unlinked Owlbear export is lossy and is not a charge-history backup.'],
 browser:'not-run',oldConsumerCompatibility:'not-claimed',fullRuntimeReplay:'not-run',currentReleaseAvailable:null};
mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,consumerRevision,consumerSourceTree,producerRevision,passed:steps.length,failed:0,skipped:0}));
