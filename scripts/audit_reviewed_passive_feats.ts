/** Bounded PHB2014 Tough / Resilient source-to-choice API proof.
 * Original publisher prose, raw snapshots and private cards remain local. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,realpathSync,writeFileSync} from 'node:fs';
import {dirname,isAbsolute,join,resolve,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
const [webRoot,inputRoot,output='.cache/reviewed-passive-feats.json']=process.argv.slice(2);
if(!webRoot||!inputRoot)throw Error('Usage: audit_reviewed_passive_feats.ts WEB_ROOT FROZEN_INPUT_ROOT [OUTPUT]');
const expectedInputs:Record<string,string>={
 "class/class-artificer.json": "c65cad57eebdfff6508a0cfb821ec670a41cc3f057512cadd19f3805cf1a01d7",
 "class/class-barbarian.json": "23e2316b63e09a716519833a477f3452ec3ce229bd32c72374eb0c6673e5cb6f",
 "class/class-bard.json": "ac95dc8f1d795c0764ae6314e846d8efdcbbb4b42a8c721551265467885ed31c",
 "class/class-cleric.json": "011edfef6c76cd0f70143d83db3b5e8b9b0d31ca1557b4c0954bedc619615344",
 "class/class-druid.json": "71fca887392f6653f41d5900066cbe6fa1cac0280bb908257075925311e1ec2c",
 "class/class-fighter.json": "a4c5afc0e7ec7a444d1418a04ab4fe392b9a7a25907ac0fb9b8618a79d1ee509",
 "class/class-monk.json": "17f8612781788c6b614fdafb81711cb537e0bdb8bec5d1da2f32864d6ec28dcb",
 "class/class-paladin.json": "aa125ed2f15782924cf4d48677e1ff64c934076bbc4f66fa65f21ba797007b2e",
 "class/class-ranger.json": "a0e58735bc5f1ef9b260b88cf2c9778ffc0d367c0b132e72fadc95baf198310a",
 "class/class-rogue.json": "b5c62a8c5356438a09bc64bc96b71968fa3766d46102a0a1de11713e5ee0d251",
 "class/class-sorcerer.json": "cc1c7c87b28903114e98310b00f6c820541a6f3458bd67e6badb79b014e4c670",
 "class/class-warlock.json": "34721a04db792923cf0a19fbab3f90616093d9f6519a7cfe6f81a9eb52e775d4",
 "class/class-wizard.json": "7533f3fb7bab70cd2d2f2b5dfb7e259dc66a2bfee24ee6ad3809042e53ba8a03",
 "feats.json": "0491b421f5f1db6628c3a8aeb86bbc3b72b56bf101a14ba96acbe19c829a56a6",
 "variantrules.json": "21eef107d25cf438eb85894387fb6f834478d80bc467791c54fe66db9e498c44"
};
const retrievalRevisions=Object.fromEntries(Object.keys(expectedInputs).map(path=>[path,path==='feats.json'?'5cc0bbe2c2b241a334e731af4448bdba2168e8bd':'e2623b204ddbdf2bcfa8317acfc962de89c676e2']));
const expectedEntries:Record<string,string>={
 'Tough|PHB':'8536c66d7553dfd58e14c195a886b241c62e174251fb248f45d0634eef15115f',
 'Resilient|PHB':'19c5167ba7f0f74652805354c71c2ed037177dc38d3db53f4a4dc0fac3abcdf7',
 'Feats|PHB':'75b2156dacae2a779a04406c4f12fe1feb5541631d463f22c3ccaab53dc50269',
 'Multiclassing|PHB':'dbfd50fed582b56c5069992230c886e5e6d710fed98aedc25833d918af0871fc',
 'Fighter|PHB':'0537bb11aa8bff9b0deeb34784eee7b1784805bcb9d9d19535c26369a2512074',
 'Artificer|TCE':'2c4248ad45438e0dd27a57a7a274c15756308e8e23c410b0f0f58bc7eadfc5e1',
};
const abilities=['str','dex','con','int','wis','cha'];
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const bytesHash=(path:string)=>createHash('sha256').update(readFileSync(path)).digest('hex');
const json=(value:any)=>JSON.parse(JSON.stringify(value));
const git=(...args:string[])=>execFileSync('git',args,{cwd:webRoot,encoding:'utf8'}).trim();
function assertCleanSource(){assert.equal(git('status','--porcelain','--untracked-files=all','--ignored=matching','--','src'),'','Consumer src must be clean, including staged, untracked and ignored files');}
assertCleanSource();
const consumerRevision=git('rev-parse','HEAD'),consumerSourceTree=git('rev-parse','HEAD:src');
const producerRevision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const reviewedRules=[
 {kind:'tough',reference:'Tough|PHB',english:'Tough',page:170,entryHash:expectedEntries['Tough|PHB'],hpPerTotalLevel:2},
 {kind:'resilient',reference:'Resilient|PHB',english:'Resilient',page:168,entryHash:expectedEntries['Resilient|PHB'],abilityBonus:1,cap:20,sameAbilitySave:true,requiresUnproficientSave:false},
];
const evidence=JSON.parse(readFileSync(join(webRoot,'src/core/automation/reviewedFeatEvidence.json'),'utf8'));
assert.equal(evidence.schemaVersion,1,'Consumer reviewed evidence version');assert.equal(evidence.mechanism,'explicit-owned-legacy-passive-feat','Consumer reviewed mechanism');
assert.equal(evidence.source,'PHB','Consumer PHB source');assert.equal(evidence.edition,'2014','Consumer original edition');
assert.deepEqual(evidence.inputs,Object.fromEntries(['feats.json','variantrules.json'].map(path=>[path,expectedInputs[path]])),'Consumer reviewed canonical input hashes');
assert.deepEqual(evidence.retrievalRevisions,Object.fromEntries(['feats.json','variantrules.json'].map(path=>[path,retrievalRevisions[path]])),'Consumer independently verified retrieval revisions');
assert.deepEqual(evidence.supportingEntryHashes,Object.fromEntries(['Feats|PHB','Multiclassing|PHB'].map(key=>[key,expectedEntries[key]])),'Consumer repeatability and total-level source hashes');
assert.deepEqual(evidence.rules.filter((row:any)=>reviewedRules.some(rule=>rule.kind===row.kind)),reviewedRules,'Consumer reviewed passive feat mechanics');
const indexPath=join(inputRoot,'index.json');assert(existsSync(indexPath),'Frozen input manifest is required');
const index=JSON.parse(readFileSync(indexPath,'utf8')),inputs:Record<string,string>={},inputFiles:Record<string,string>={[indexPath]:bytesHash(indexPath)};
function input(path:string){
 const rows=index.rows?.filter((row:any)=>row.url===`https://5e.kiwee.top/data/${path}`);assert.equal(rows?.length,1,'Expected exactly one frozen input '+path);
 const filename=rows[0].path;assert.equal(typeof filename,'string','Frozen filename');const local=resolve(inputRoot,filename);
 assert(!isAbsolute(filename)&&local.startsWith(resolve(inputRoot)+sep),'Input must remain inside frozen directory');assert(realpathSync(local).startsWith(realpathSync(inputRoot)+sep),'Resolved input must remain inside frozen directory');
 const body=JSON.parse(readFileSync(local,'utf8')),sha256=hash(body);assert.equal(sha256,expectedInputs[path],'Frozen input mismatch '+path);assert.equal(sha256,rows[0].sha256,'Frozen manifest mismatch '+path);
 inputs[path]=sha256;inputFiles[local]=bytesHash(local);return body;
}
const bodies=Object.fromEntries(Object.keys(expectedInputs).map(path=>[path,input(path)])),sourceBefore=hash(bodies);
const exact=(rows:any[],english:string,source:string)=>{const matches=rows.filter(row=>row.ENG_name===english&&row.source===source);assert.equal(matches.length,1,'Unique original '+english+'|'+source);return matches[0];};
const feats=bodies['feats.json'].feat,variants=bodies['variantrules.json'].variantrule,entryHashes:Record<string,string>={};
for(const [key,rows] of [['Tough|PHB',feats],['Resilient|PHB',feats],['Feats|PHB',variants],['Multiclassing|PHB',variants],['Fighter|PHB',bodies['class/class-fighter.json'].class],['Artificer|TCE',bodies['class/class-artificer.json'].class]] as const){const [name,source]=key.split('|');entryHashes[key]=hash(exact(rows,name,source));assert.equal(entryHashes[key],expectedEntries[key],'Independent original entry hash '+key);}
const rawTough=exact(feats,'Tough','PHB'),rawResilient=exact(feats,'Resilient','PHB');
assert.equal(rawTough.page,170);assert.equal(rawResilient.page,168);assert.equal(rawTough.repeatable,undefined);assert.equal(rawResilient.repeatable,undefined);
assert.deepEqual(rawResilient.ability.map((row:any)=>({from:row.choose.from,amount:row.choose.amount})),[{from:abilities,amount:1}]);
assert.deepEqual(rawResilient.savingThrowProficiencies,[{choose:{from:abilities}}]);assert.equal(rawResilient.prerequisite,undefined,'PHB Resilient has no previously-unproficient prerequisite');
const legacyEvidence=JSON.parse(readFileSync(join(webRoot,'src/core/automation/legacyAsiEvidence.json'),'utf8'));
assert.deepEqual(legacyEvidence.inputs,Object.fromEntries(Object.entries(expectedInputs).filter(([path])=>path.startsWith('class/'))),'Preserved thirteen original class sources');
const profiles:any[]=[];
for(const [path,body] of Object.entries(bodies)){
 if(!path.startsWith('class/'))continue;const source=path.includes('artificer')?'TCE':'PHB';
 const owners=body.class.filter((e:any)=>e.source===source);assert.equal(owners.length,1,'Exactly one reviewed original owner '+path);const owner=owners[0];
 for(const feature of body.classFeature.filter((e:any)=>e.source===source&&e.className===owner.name&&e.classSource===source&&e.ENG_name==='Ability Score Improvement')){
  const refs=owner.classFeatures.map((r:any)=>typeof r==='string'?r:r.classFeature).filter((r:any)=>typeof r==='string'&&r.split('|')[0]===feature.name&&Number(r.split('|')[3])===feature.level);assert.equal(refs.length,1,'Unique owned original ASI reference');
  profiles.push({owner:`${owner.ENG_name}|${source}`,feature:refs[0],level:feature.level,entryHash:hash(feature)});
 }
}
assert.equal(profiles.length,68,'All previously reviewed legacy ASI slots');assert.deepEqual(legacyEvidence.profiles,profiles,'Exact original owned class feature hashes and progression');
const producerScript='scripts/audit_reviewed_passive_feats.ts';
function assertProducerClean(){assert.equal(execFileSync('git',['status','--porcelain','--untracked-files=all','--',producerScript],{encoding:'utf8'}).trim(),'','Producer proof script must be committed and clean');}
assertProducerClean();const producerScriptSha256=bytesHash(producerScript);
assert.equal(createHash('sha256').update(execFileSync('git',['cat-file','blob',`${producerRevision}:${producerScript}`])).digest('hex'),producerScriptSha256,'Proof script bytes match producer revision');
mkdirSync('.cache',{recursive:true});const adapter=resolve('.cache/reviewed-passive-feats-consumer.mjs');
const exports:Record<string,string[]>={
 'src/core/model.ts':['newCharacter'],'src/core/automation/state.ts':['newAutomationState'],'src/data/catalog.ts':['normalizeData'],
 'src/core/sheet.ts':['syncFeatures','removeSelection'],'src/core/automation/choices.ts':['sheetChoices','setSheetChoiceSlot'],
 'src/core/automation/reviewedFeats.ts':['reviewedFeatRule','reviewedFeatStatus','setReviewedFeatIntent'],
 'src/core/automation/asi.ts':['setAsiAllocation'],'src/core/engine.ts':['evaluate'],
 'src/core/export.ts':['exportCharacter','exportLinkedOwlbear'],'src/core/validation.ts':['readCharacter','validateCharacter','importOwlbear'],
};
const bundle=await build({stdin:{contents:Object.entries(exports).map(([path,names])=>`export {${names.join(',')}} from ${JSON.stringify(resolve(webRoot,path))};`).join('\n'),resolveDir:resolve(webRoot),loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:adapter,metafile:true,define:{'import.meta.env.MODE':'"standalone"','import.meta.env.DEV':'false'}});
const api=await import(pathToFileURL(adapter).href);
const merged:any={feat:feats};for(const key of ['class','subclass','classFeature','subclassFeature'])merged[key]=Object.entries(bodies).filter(([path])=>path.startsWith('class/')).flatMap(([,body])=>body[key]||[]);
const entries=api.normalizeData(structuredClone(merged),'frozen-reviewed-passive-feats'),catalogBefore=hash(entries);assert.equal(hash(bodies),sourceBefore,'Normalizer preserves original source');
const find=(kind:string,name:string,source:string)=>{const rows=entries.filter((e:any)=>e.kind===kind&&e.english===name&&e.source===source);assert.equal(rows.length,1,'Unique normalized '+name+'|'+source);return rows[0];};
const tough=find('feat','Tough','PHB'),resilient=find('feat','Resilient','PHB');
const steps:{mechanism:string;label:string;passed:true}[]=[];
const preserve=(c:any)=>json({abilities:c.abilities,baseHp:c.baseHp,hpProgression:c.hpProgression,notes:c.notes,runtime:c.runtime,sheetBonuses:c.sheetBonuses,saveBonuses:c.saveBonuses,skillBonuses:c.skillBonuses,proficiencies:c.proficiencies,expertise:c.expertise,adjustments:c.adjustments});
function baseCard(level=4,name='Fighter',source='PHB'){
 const c=api.newCharacter('2014');c.automation=api.newAutomationState();c.profile.enabledSources=['PHB','TCE'];c.abilities.dex=13;
 c.notes='Authored passive-feat preservation probe';c.sheetBonuses={ac:3};c.skillBonuses={athletics:1};c.proficiencies={athletics:true};c.expertise={athletics:true};c.runtime.hp=2;c.runtime.tempHp=1;c.runtime.resources={'manual-sentinel':{current:1,max:7},Tough:{current:77,max:99,unlimited:true}};
 c.selections=[{id:'proof-owner',entry:structuredClone(find('class',name,source)),level,quantity:1,equipped:false}];api.syncFeatures(c,entries);return c;
}
const choice=(c:any,level=4)=>{const owner=c.selections.find((s:any)=>s.id==='proof-owner'),feature=c.selections.find((s:any)=>s.parentId===owner.id&&s.entry.english==='Ability Score Improvement'&&s.entry.raw.level===level&&s.entry.source===owner.entry.source);assert(feature,'Generated real ASI feature '+level);const id=`${owner.id}:class-legacy-feat:${feature.entry.id}`,row=api.sheetChoices(c,entries).find((r:any)=>r.id===id);assert(row,'Generated real class choice '+level);return row;};
const select=(c:any,e:any,level=4)=>{const row=choice(c,level);assert(row.options.some((o:any)=>o.value===e.id),'Real feat alternative is offered');api.setSheetChoiceSlot(c,row.id,0,e.id,entries);assert.deepEqual(c.answers[row.id],[e.id]);assert.equal(c.classChoiceSnapshots[e.id].id,e.id);return row.id;};
const intent=(e:any,ability='dex')=>e===tough?{kind:'tough',confirmedManualHpExcluded:true}:{kind:'resilient',ability,confirmedManualAbilityExcluded:true};
const activate=(c:any,e:any,ability='dex',level=4)=>{const id=select(c,e,level);api.setReviewedFeatIntent(c,id,e.id,intent(e,ability));assert.equal(api.reviewedFeatStatus(c,id,e.id).active,true,'Explicit reviewed feat activates');return id;};
function evaluate(c:any){const before=JSON.stringify(c),d=api.evaluate(c);assert.equal(JSON.stringify(c),before,'Evaluation is pure');return d;}
function status(c:any,id:string,e:any){const before=JSON.stringify(c),s=api.reviewedFeatStatus(c,id,e.id);assert.equal(JSON.stringify(c),before,'Status is pure');return s;}
function reject(c:any,fn:()=>void){const before=JSON.stringify(c);assert.throws(fn);assert.equal(JSON.stringify(c),before,'Rejected mutation is atomic');}
function reopen(c:any,linked=false){const before=JSON.stringify(c),payload=json(linked?api.exportLinkedOwlbear(c,evaluate(c)):api.exportCharacter(c)),inputBefore=JSON.stringify(payload),loaded=linked?{character:api.importOwlbear(payload),repaired:[]}:api.readCharacter(payload);assert.deepEqual(loaded.repaired,[],'No roundtrip repair');assert.equal(JSON.stringify(c),before,'Export is pure');assert.equal(JSON.stringify(payload),inputBefore,'Import is pure');assert.deepEqual(loaded.character.reviewedFeats,c.reviewedFeats,'Explicit intent persists');assert.deepEqual(preserve(loaded.character),preserve(c),'Manual data roundtrip unchanged');return loaded.character;}
function check(mechanism:string,label:string,fn:()=>void){try{fn();}catch(error){throw Error(label,{cause:error});}steps.push({mechanism,label,passed:true});}
for(const profile of profiles)for(const e of [tough,resilient])check(e===tough?'tough':'resilient',`Real ${profile.owner} level ${profile.level} ASI alternative explicitly applies and revokes ${e.english}`,()=>{
 const [name,source]=profile.owner.split('|'),c=baseCard(profile.level,name,source),before=evaluate(c),manual=preserve(c),id=select(c,e,profile.level);
 assert.equal(status(c,id,e).active,false,'Choosing a feat alone never adopts handwritten values');assert.equal(evaluate(c).maxHp,before.maxHp);assert.equal(evaluate(c).abilities.dex,before.abilities.dex);
 api.setReviewedFeatIntent(c,id,e.id,intent(e));const actual=evaluate(c);assert.equal(status(c,id,e).active,true);
 if(e===tough)assert.equal(actual.maxHp-before.maxHp,2*profile.level);else{assert.equal(actual.abilities.dex,before.abilities.dex+1);assert.equal(actual.saves.dex.proficient,true);assert.equal(actual.saves.dex.value,actual.modifiers.dex+actual.proficiency);}
 assert.deepEqual(preserve(c),manual);api.setReviewedFeatIntent(c,id,e.id,null);assert.equal(status(c,id,e).active,false);assert.equal(evaluate(c).maxHp,before.maxHp);assert.equal(evaluate(c).abilities.dex,before.abilities.dex);assert.deepEqual(preserve(c),manual);api.validateCharacter(json(c));
});
for(const e of [tough,resilient])check(e===tough?'tough':'resilient',`${e.english} saves and reopens through native and linked imports without catalog`,()=>{
 let c=baseCard();const manual=preserve(c),id=activate(c,e),expected=evaluate(c);for(const linked of [false,true]){c=reopen(c,linked);api.syncFeatures(c,[]);assert.equal(status(c,id,e).active,true);const actual=evaluate(c);assert.equal(actual.maxHp,expected.maxHp);assert.deepEqual(actual.abilities,expected.abilities);assert.deepEqual(actual.saves,expected.saves);assert.deepEqual(preserve(c),manual);}
});
check('tough','Tough uses total multiclass level, not just its granting Fighter level',()=>{const c=baseCard(),id=activate(c,tough);assert.equal(evaluate(c).maxHp,36);c.selections.push({id:'other-class',entry:structuredClone(find('class','Artificer','TCE')),level:3,quantity:1,equipped:false});c.profile.optional.multiclass=true;api.syncFeatures(c,entries);const plain=structuredClone(c);api.setReviewedFeatIntent(plain,id,tough.id,null);assert.equal(evaluate(c).level,7);assert.equal(evaluate(c).maxHp-evaluate(plain).maxHp,14);});
check('tough','Tough follows total level 4→5→6 without resetting runtime health',()=>{const c=baseCard(),manual=preserve(c);activate(c,tough);for(const [level,hp] of [[4,36],[5,44],[6,52]]){c.selections.find((s:any)=>s.id==='proof-owner').level=level;api.syncFeatures(c,entries);assert.equal(evaluate(c).maxHp,hp);assert.deepEqual(preserve(c),manual);}});
for(const e of [tough,resilient])for(const invalid of [undefined,false])check(e===tough?'tough':'resilient',`${e.english} never enables with missing/false manual exclusion confirmation ${String(invalid)}`,()=>{const c=baseCard(),id=select(c,e),bad=e===tough?{kind:'tough',confirmedManualHpExcluded:invalid}:{kind:'resilient',ability:'dex',confirmedManualAbilityExcluded:invalid};reject(c,()=>api.setReviewedFeatIntent(c,id,e.id,bad));assert.equal(status(c,id,e).active,false);});
check('tough','Manual base HP and sheet offsets stay authored; confirmation only owns a derived Tough increment',()=>{const c=baseCard();c.baseHp=51;c.sheetBonuses.hp=7;const manual=preserve(c),id=select(c,tough);assert.equal(evaluate(c).maxHp,58);api.setReviewedFeatIntent(c,id,tough.id,intent(tough));assert.equal(evaluate(c).maxHp,66);assert.deepEqual(preserve(c),manual);api.setReviewedFeatIntent(c,id,tough.id,null);assert.equal(evaluate(c).maxHp,58);assert.deepEqual(preserve(c),manual);});
for(const ability of abilities)check('resilient',`Resilient couples only chosen ${ability} +1 with the same saving proficiency`,()=>{const c=baseCard();c.abilities[ability]=13;const before=evaluate(c),manual=preserve(c);activate(c,resilient,ability);const actual=evaluate(c);for(const key of abilities)assert.equal(actual.abilities[key],before.abilities[key]+(key===ability?1:0));assert.equal(actual.saves[ability].proficient,true);assert.equal(actual.saves[ability].value,actual.modifiers[ability]+actual.proficiency);assert.deepEqual(preserve(c),manual);if(ability==='con')assert.equal(actual.maxHp-before.maxHp,4);});
check('resilient','Resilient Dexterity scales saving bonus at total character level five',()=>{const c=baseCard();activate(c,resilient);assert.equal(evaluate(c).abilities.dex,14);assert.equal(evaluate(c).saves.dex.value,4);c.selections[0].level=5;api.syncFeatures(c,entries);assert.equal(evaluate(c).saves.dex.value,5);});
check('resilient','PHB Resilient accepts an already-proficient Fighter save without doubling proficiency',()=>{const c=baseCard();c.abilities.str=13;assert.equal(evaluate(c).saves.str.proficient,true);activate(c,resilient,'str');assert.equal(evaluate(c).saves.str.value,4);});
check('resilient','Explicit manual false saving proficiency override survives application and reopening',()=>{let c=baseCard();c.proficiencies['save:dex']=false;const manual=preserve(c);activate(c,resilient);for(let i=0;i<2;i++){assert.equal(evaluate(c).abilities.dex,14);assert.equal(evaluate(c).saves.dex.proficient,false);assert.equal(evaluate(c).saves.dex.value,2);assert.deepEqual(preserve(c),manual);c=reopen(c);}});
for(const base of [19,20,22])check('resilient',`Resilient base ${base} respects cap20 without clamping authored scores`,()=>{const c=baseCard();c.abilities.dex=base;const id=select(c,resilient),manual=preserve(c);if(base===19){api.setReviewedFeatIntent(c,id,resilient.id,intent(resilient));assert.equal(evaluate(c).abilities.dex,20);}else{reject(c,()=>api.setReviewedFeatIntent(c,id,resilient.id,intent(resilient)));assert.equal(evaluate(c).abilities.dex,base);assert.equal(evaluate(c).saves.dex.proficient,false);}assert.deepEqual(preserve(c),manual);});
check('resilient','Raising authored ability to20 suspends both effects visibly without reselecting, and restores original intent',()=>{let c=baseCard();const id=activate(c,resilient);c.abilities.dex=20;const saved=json(c.reviewedFeats);assert.equal(status(c,id,resilient).active,false);assert(status(c,id,resilient).reason);assert.equal(evaluate(c).abilities.dex,20);assert.equal(evaluate(c).saves.dex.proficient,false);assert(evaluate(c).issues.some((i:any)=>i.message.includes('20')));c=reopen(c);assert.deepEqual(c.reviewedFeats,saved);c.abilities.dex=19;assert.equal(evaluate(c).abilities.dex,20);assert.equal(status(c,id,resilient).active,true);});
for(const invalid of ['luck','',null,13])check('resilient',`Invalid Resilient ability ${String(invalid)} is an atomic rejection`,()=>{const c=baseCard(),id=select(c,resilient);reject(c,()=>api.setReviewedFeatIntent(c,id,resilient.id,{kind:'resilient',ability:invalid,confirmedManualAbilityExcluded:true}));});
for(const e of [tough,resilient])check(e===tough?'tough':'resilient',`${e.english} duplicate second class ASI alternative is rejected atomically`,()=>{const c=baseCard(6),first=activate(c,e),second=choice(c,6).id;assert.notEqual(first,second);reject(c,()=>api.setSheetChoiceSlot(c,second,0,e.id,entries));});
check('both','Replacing Tough with Resilient releases old effect; restoring Tough does not stack',()=>{const c=baseCard(),manual=preserve(c),id=activate(c,tough);assert.equal(evaluate(c).maxHp,36);api.setSheetChoiceSlot(c,id,0,resilient.id,entries);assert.equal(evaluate(c).maxHp,28);assert.equal(evaluate(c).abilities.dex,13);api.setReviewedFeatIntent(c,id,resilient.id,intent(resilient));assert.equal(evaluate(c).abilities.dex,14);api.setSheetChoiceSlot(c,id,0,tough.id,entries);assert.equal(status(c,id,tough).active,false,'Explicit replacement clears old consent');api.setReviewedFeatIntent(c,id,tough.id,intent(tough));assert.equal(evaluate(c).maxHp,36);assert.equal(evaluate(c).abilities.dex,13);assert.deepEqual(preserve(c),manual);});
for(const e of [tough,resilient])check(e===tough?'tough':'resilient',`${e.english} withdrawal of the selected answer and restoration never accumulates`,()=>{let c=baseCard();const id=activate(c,e),active=evaluate(c);api.setSheetChoiceSlot(c,id,0,undefined,entries);assert.equal(status(c,id,e).active,false);assert.equal(evaluate(c).maxHp,28);assert.equal(evaluate(c).abilities.dex,13);c=reopen(c);api.setSheetChoiceSlot(c,id,0,e.id,entries);assert.equal(status(c,id,e).active,false,'Explicit forgetting clears old consent');api.setReviewedFeatIntent(c,id,e.id,intent(e));assert.equal(evaluate(c).maxHp,active.maxHp);assert.equal(evaluate(c).abilities.dex,active.abilities.dex);});
for(const e of [tough,resilient])for(const [label,off,on] of [
 ['automation',(c:any)=>{c.automation.enabled=false;},(c:any)=>{c.automation.enabled=true;}],
 ['PHB source',(c:any)=>{c.profile.enabledSources=['TCE'];},(c:any)=>{c.profile.enabledSources=['PHB','TCE'];}],
 ['feat optional rule',(c:any)=>{c.profile.optional.feats=false;},(c:any)=>{c.profile.optional.feats=true;}],
] as const)check(e===tough?'tough':'resilient',`${e.english} disabling ${label} preserves intent inactive and restores once`,()=>{let c=baseCard();const id=activate(c,e),saved=json(c.reviewedFeats),answers=json(c.answers),snapshots=json(c.classChoiceSnapshots);off(c);assert.equal(status(c,id,e).active,false);assert(status(c,id,e).reason);assert.deepEqual(c.reviewedFeats,saved);assert.deepEqual(c.answers,answers);assert.deepEqual(c.classChoiceSnapshots,snapshots);c=reopen(c);on(c);assert.equal(status(c,id,e).active,true);assert.equal(evaluate(c).maxHp,e===tough?36:28);assert.equal(evaluate(c).abilities.dex,e===resilient?14:13);});
for(const e of [tough,resilient])check(e===tough?'tough':'resilient',`${e.english} downgrade and offline restore retains owned intent without duplicate`,()=>{let c=baseCard();const id=activate(c,e),saved=json(c.reviewedFeats);c.selections.find((s:any)=>s.id==='proof-owner').level=3;api.syncFeatures(c,[]);assert.equal(status(c,id,e).active,false);assert.deepEqual(c.reviewedFeats,saved);c=reopen(c);c.selections.find((s:any)=>s.id==='proof-owner').level=4;api.syncFeatures(c,[]);assert.equal(status(c,id,e).active,true);assert.equal(evaluate(c).maxHp,e===tough?36:28);assert.equal(evaluate(c).abilities.dex,e===resilient?14:13);});
for(const e of [tough,resilient])for(const [label,edit] of [
 ['missing owner',(c:any)=>{c.selections=c.selections.filter((s:any)=>s.id!=='proof-owner');}],
 ['missing ASI feature',(c:any,id:string)=>{const binding=c.reviewedFeats.bindings.find((b:any)=>b.choiceId===id);c.selections=c.selections.filter((s:any)=>s.id!==binding.selectionId);}],
 ['cyclic ancestry',(c:any,id:string)=>{const binding=c.reviewedFeats.bindings.find((b:any)=>b.choiceId===id);c.selections.find((s:any)=>s.id==='proof-owner').parentId=binding.selectionId;}],
 ['dismissed ASI',(c:any,id:string)=>{const binding=c.reviewedFeats.bindings.find((b:any)=>b.choiceId===id),feature=c.selections.find((s:any)=>s.id===binding.selectionId);c.dismissedFeatures=[`proof-owner|${feature.grantKey}`];}],
 ['changed raw owner identity',(c:any)=>{c.selections.find((s:any)=>s.id==='proof-owner').entry.raw.ENG_name='Other';}],
 ['changed raw ASI identity',(c:any,id:string)=>{const binding=c.reviewedFeats.bindings.find((b:any)=>b.choiceId===id);c.selections.find((s:any)=>s.id===binding.selectionId).entry.raw.ENG_name='Other';}],
] as const)check(e===tough?'tough':'resilient',`${e.english} ${label} suspends effect without changing saved intent`,()=>{const c=baseCard(),id=activate(c,e),saved=json(c.reviewedFeats);edit(c,id);assert.equal(status(c,id,e).active,false);assert(status(c,id,e).reason);assert.deepEqual(c.reviewedFeats,saved);});
for(const e of [tough,resilient])for(const [label,edit] of [
 ['CUSTOM source',(entry:any)=>{entry.source='CUSTOM';entry.raw.source='CUSTOM';}],
 ['XPHB source',(entry:any)=>{entry.source='XPHB';entry.raw.source='XPHB';entry.edition='2024';}],
 ['raw source',(entry:any)=>{entry.raw.source='CUSTOM';}],
 ['raw English identity',(entry:any)=>{entry.raw.ENG_name='Unreviewed';}],
 ['normalized English identity',(entry:any)=>{entry.english='Unreviewed';}],
 ['copy directive',(entry:any)=>{entry.raw._copy={name:entry.name,source:'PHB'};}],
 ['unresolved parent',(entry:any)=>{entry.raw._unresolvedParent=true;}],
 ['raw category',(entry:any)=>{entry.raw._category='optionalfeature';}],
 ['raw page',(entry:any)=>{entry.raw.page=999;}],
 ['normalized page',(entry:any)=>{entry.page=999;}],
 ['missing source body',(entry:any)=>{delete entry.raw.entries;}],
 ['empty source body',(entry:any)=>{entry.raw.entries=[];}],
 ['malformed source body',(entry:any)=>{entry.raw.entries=[{type:'unknown',value:99}];}],
 ['arbitrary injected field',(entry:any)=>{entry.raw.unreviewedBonus=99;}],
 ['generic effect injection',(entry:any)=>{entry.effects=[{op:'add',target:'hp',value:99}];}],
 ['generic choice injection',(entry:any)=>{entry.choices=[{id:'unsafe',label:'Unsafe',count:1,options:['dex'],abilityBonus:99}];}],
] as const)check(e===tough?'tough':'resilient',`${e.english} ${label} cannot receive reviewed authorization`,()=>{const c=baseCard(),id=activate(c,e),saved=json(c.reviewedFeats);edit(c.classChoiceSnapshots[e.id]);assert.equal(api.reviewedFeatRule(c.classChoiceSnapshots[e.id]),undefined);assert.equal(status(c,id,e).active,false);reject(c,()=>api.setReviewedFeatIntent(c,id,e.id,intent(e)));assert.deepEqual(c.reviewedFeats,saved);});
for(const name of ['Tough','Resilient'])check('both',`Exact newer ${name}|XPHB remains a separate unsupported identity`,()=>{assert.equal(api.reviewedFeatRule(find('feat',name,'XPHB')),undefined);});
for(const e of [tough,resilient])check(e===tough?'tough':'resilient',`Manually dragged ${e.english} alone cannot manufacture an ASI grant`,()=>{const c=baseCard(),before=evaluate(c);c.selections.push({id:'manual-feat',entry:structuredClone(e),level:1,quantity:1,equipped:false});const id=choice(c).id;assert.equal(status(c,id,e).eligible,false);reject(c,()=>api.setReviewedFeatIntent(c,id,e.id,intent(e)));assert.equal(evaluate(c).maxHp,before.maxHp);assert.deepEqual(evaluate(c).abilities,before.abilities);});
for(const e of [tough,resilient])check(e===tough?'tough':'resilient',`Imported duplicate ${e.english} intent is visibly ambiguous rather than double-counted`,()=>{const c=baseCard(),id=activate(c,e);c.reviewedFeats.bindings.push(structuredClone(c.reviewedFeats.bindings[0]));const before=JSON.stringify(c),s=status(c,id,e);assert.equal(s.active,false);assert(s.reason);assert.equal(evaluate(c).maxHp,28);assert.equal(evaluate(c).abilities.dex,13);assert.equal(JSON.stringify(c),before);});
for(const e of [tough,resilient])check(e===tough?'tough':'resilient',`Imported second ${e.english} selected grant never multiplies one nonrepeatable feat`,()=>{const c=baseCard(6),id=activate(c,e),id2=choice(c,6).id,featureId=id2.split(':class-legacy-feat:')[1],feature=c.selections.find((s:any)=>s.entry.id===featureId);assert(feature);c.answers[id2]=[e.id];c.reviewedFeats.bindings.push({...structuredClone(c.reviewedFeats.bindings[0]),choiceId:id2,selectionId:feature.id});const before=JSON.stringify(c),d=evaluate(c),s=status(c,id,e),s2=status(c,id2,e);assert(!(s.active&&s2.active),'At most one nonrepeatable grant can be active');assert(d.maxHp<=40+12);assert(d.abilities.dex<=14);assert(s.reason||s2.reason);assert.equal(JSON.stringify(c),before);});
for(const e of [tough,resilient])check(e===tough?'tough':'resilient',`A manual same-identity ${e.english} record is retained and never doubles derived contribution`,()=>{const c=baseCard(),id=activate(c,e),manualId='unrelated-manual-feat';c.selections.push({id:manualId,entry:structuredClone(e),level:1,quantity:1,equipped:false});const saved=json(c.selections.find((s:any)=>s.id===manualId)),before=JSON.stringify(c),d=evaluate(c);assert(d.maxHp<=36);assert(d.abilities.dex<=14);assert.equal(JSON.stringify(c),before);assert.deepEqual(c.selections.find((s:any)=>s.id===manualId),saved);if(!status(c,id,e).active)assert(status(c,id,e).reason);});
for(const e of [tough,resilient])check(e===tough?'tough':'resilient',`${e.english} unknown future intent version stays preserved and inactive across reopen`,()=>{let c=baseCard();const id=activate(c,e);c.reviewedFeats={version:99,opaque:{authored:'preserve'}};const saved=json(c.reviewedFeats);assert.equal(status(c,id,e).active,false);reject(c,()=>api.setReviewedFeatIntent(c,id,e.id,intent(e)));c=reopen(c);assert.deepEqual(c.reviewedFeats,saved);assert.equal(evaluate(c).maxHp,28);assert.equal(evaluate(c).abilities.dex,13);});
check('resilient','Reviewed Resilient and later explicit class ASI share cap20 without overwriting authored Dexterity',()=>{const c=baseCard(6);c.abilities.dex=17;const id=activate(c,resilient),later=choice(c,6),plan=later.options.find((o:any)=>o.entry?.raw._classAbilityRecord);assert(plan);api.setSheetChoiceSlot(c,later.id,0,plan.value,entries);api.setAsiAllocation(c,later.id,{dex:2});assert.equal(evaluate(c).abilities.dex,20);assert.equal(status(c,id,resilient).active,true);assert.equal(c.abilities.dex,17);});
for(const e of [tough,resilient])check(e===tough?'tough':'resilient',`${e.english} unknown future ASI version blocks archive adoption while preserving inactive feat intent`,()=>{let c=baseCard();const id=activate(c,e),saved=json(c.reviewedFeats);c.asiAllocations={version:99,opaque:{authored:'future ASI intent'}};const opaque=json(c.asiAllocations);c.selections[0].level=3;api.syncFeatures(c,[]);assert.equal(status(c,id,e).active,false);assert.equal(c.classChoiceArchive?.[saved.bindings[0].selectionId],undefined,'Unknown ASI cannot authorize archiving');c=reopen(c);assert.deepEqual(c.reviewedFeats,saved);assert.deepEqual(c.asiAllocations,opaque);c.selections[0].level=4;api.syncFeatures(c,[]);assert.equal(status(c,id,e).active,false,'No catalog and no authorized archive cannot recreate the old grant');assert(status(c,id,e).reason);assert.deepEqual(c.reviewedFeats,saved);assert.deepEqual(c.asiAllocations,opaque);});
check('both','Unknown future ASI state cannot restore unrelated legacy allocation archives',()=>{const c=baseCard(6),first=activate(c,tough),later=choice(c,6),plan=later.options.find((o:any)=>o.entry?.raw._classAbilityRecord);assert(plan);api.setSheetChoiceSlot(c,later.id,0,plan.value,entries);api.setAsiAllocation(c,later.id,{str:2});const oldAsi=c.asiAllocations.bindings[0];c.selections[0].level=4;api.syncFeatures(c,[]);assert(c.classChoiceArchive[oldAsi.selectionId]);const archive=json(c.classChoiceArchive[oldAsi.selectionId]);c.asiAllocations={version:99,opaque:{authored:'future ASI intent'}};const opaque=json(c.asiAllocations);c.selections[0].level=6;api.syncFeatures(c,[]);assert.deepEqual(c.classChoiceArchive?.[oldAsi.selectionId],archive,'Unrelated future-owned ASI archive stays parked');assert(!c.selections.some((row:any)=>row.id===oldAsi.selectionId));assert.deepEqual(c.asiAllocations,opaque);assert.equal(status(c,first,tough).active,true);});
assert.equal(hash(bodies),sourceBefore,'Workflow preserves frozen source objects');assert.equal(hash(entries),catalogBefore,'Workflow preserves normalized catalog');
for(const [path,before] of Object.entries(inputFiles))assert.equal(bytesHash(path),before,'Frozen file changed during proof');
assert.equal(git('rev-parse','HEAD'),consumerRevision,'Consumer revision changed during proof');assertCleanSource();assert.equal(git('rev-parse','HEAD:src'),consumerSourceTree,'Consumer source tree changed during proof');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),producerRevision,'Producer revision changed during proof');assertProducerClean();assert.equal(bytesHash(producerScript),producerScriptSha256,'Proof script changed during replay');
const modules=Object.keys(bundle.metafile!.inputs).map(path=>resolve(path)).filter(path=>path.startsWith(resolve(webRoot)+'/src/')).map(path=>({path:path.slice(resolve(webRoot).length+1),sha256:bytesHash(path)})).sort((a,b)=>a.path.localeCompare(b.path));
for(const row of modules)assert.equal(createHash('sha256').update(execFileSync('git',['cat-file','blob',`${consumerRevision}:${row.path}`],{cwd:webRoot,maxBuffer:16*1024*1024})).digest('hex'),row.sha256,'Bundled consumer bytes equal committed source');
const report={schemaVersion:1,updatedAt:new Date().toISOString(),consumerRevision,consumerSourceTree,consumerModules:modules,producerRevision,producerScriptSha256,retrievalRevisions,inputs,entryHashes,legacyClassSlots:profiles,rules:reviewedRules,steps,
 definition:'Bounded PHB2014 Tough and Resilient original-source legal-class-choice API proof; not a full corpus replay, browser certification or publication claim',
 status:{source:'verified',mechanisms:'partial',fullRuleAutomation:false,reviewedPassiveFeats:2,legacyClassSlots:profiles.length,browser:'not-run',fullRuntimeReplay:'not-run',oldConsumerCompatibility:'not-claimed',currentReleaseAvailable:null},
 boundaries:['Only independently reviewed PHB2014 Tough and Resilient selected through one of 68 PHB/TCE legacy class ASI alternative slots are eligible. Manual dragging, XPHB, unknown/custom entries and unsupported source shapes do not authorize these effects.',
 'Original full-entry hashes bind this source audit. Runtime authorization recognizes reviewed canonical identity and mechanical/structural shape, not arbitrary imported prose cryptographically.',
 'Players explicitly confirm that manually authored HP or chosen ability do not already include this feat. No historical handwritten value can be inferred or reconstructed.',
 'Tough owns only an additive derived maximum-HP contribution. Resilient owns one chosen ability increment plus the same saving proficiency; explicit manual false proficiency overrides remain effective.',
 'Existing source-disabled intent is retained and inactive. Existing proficiency never grants double proficiency; PHB default once-per-feat semantics are separate from XPHB.',
 'The 136 paired grant checks are source-path scenarios for two effects, not 136 completed rules or a corpus completion percentage.',
 'Native and linked imports exercise current consumer persistence only. Real browser storage, older clients, server delivery, multiplayer recovery and deployment require separate evidence.']};
mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,consumerRevision,consumerSourceTree,producerRevision,passed:steps.length,failed:0,skipped:0}));
