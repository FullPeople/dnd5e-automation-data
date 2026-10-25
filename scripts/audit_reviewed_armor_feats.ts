/** Bounded PHB2014 Lightly / Moderately / Heavily Armored source-to-choice API proof.
 * Original publisher prose, raw snapshots and private cards remain local. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,realpathSync,writeFileSync} from 'node:fs';
import {dirname,isAbsolute,join,resolve,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
const [webRoot,inputRoot,output='.cache/reviewed-armor-feats.json']=process.argv.slice(2);
if(!webRoot||!inputRoot)throw Error('Usage: audit_reviewed_armor_feats.ts WEB_ROOT FROZEN_INPUT_ROOT [OUTPUT]');
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
 "items-base.json": "8933a3e70e47aa4fd6196bd7f1f2e3a57d6d8dbe7e781d37bb6a0519d7c4ffff",
 "variantrules.json": "21eef107d25cf438eb85894387fb6f834478d80bc467791c54fe66db9e498c44"
};
const retrievalRevisions=Object.fromEntries(Object.keys(expectedInputs).map(path=>[path,path==='feats.json'?'5cc0bbe2c2b241a334e731af4448bdba2168e8bd':'e2623b204ddbdf2bcfa8317acfc962de89c676e2']));
const expectedEntries:Record<string,string>={
 'Lightly Armored|XPHB':'423fb6efa58add6c891b114c273e96e135977ab6f06d9db8daa7c70d2a6a10d9',
 'Moderately Armored|XPHB':'b86f5aeef2bc39ce9b9d03e863b8d4fd10097b6273b9afbf37e62e1954ed1c35',
 'Heavily Armored|XPHB':'6ef86668d2f7d2d91d829769f34758fbecb3e52b0487445378ce595524b569af',
 'Tough|XPHB':'6ca1a61e752edcf90a71ce4ab05d89e198e25ab763739560201766bca99d7e5c',
 'Resilient|XPHB':'62d27d34751547ff77699a7802b68a27f56e2fa0cbaedb6395e0f571385792f8',
 'Lightly Armored|PHB':'5e87f09b022c56e00d9283ce52708ee38059e7349d815443d3bb2c5da5a41a42',
 'Moderately Armored|PHB':'98b557e88aeeb29328dddf9924ddce14a695945979de06cd766ed7cb119708fa',
 'Heavily Armored|PHB':'5a822e4ac8cba9147dfa9b28f0a6a5ccf80dcd4f30c047e879af62c4ec15d297',
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
const previousRules=[
 {kind:'tough',reference:'Tough|PHB',english:'Tough',page:170,entryHash:expectedEntries['Tough|PHB'],hpPerTotalLevel:2},
 {kind:'resilient',reference:'Resilient|PHB',english:'Resilient',page:168,entryHash:expectedEntries['Resilient|PHB'],abilityBonus:1,cap:20,sameAbilitySave:true,requiresUnproficientSave:false},
];
const reviewedRules=[
 {kind:'lightly-armored',reference:'Lightly Armored|PHB',english:'Lightly Armored',page:167,entryHash:expectedEntries['Lightly Armored|PHB'],abilityBonus:1,cap:20,abilities:['str','dex'],armorTraining:['light']},
 {kind:'moderately-armored',reference:'Moderately Armored|PHB',english:'Moderately Armored',page:168,entryHash:expectedEntries['Moderately Armored|PHB'],abilityBonus:1,cap:20,abilities:['str','dex'],armorTraining:['medium','shield'],requiredArmor:'light'},
 {kind:'heavily-armored',reference:'Heavily Armored|PHB',english:'Heavily Armored',page:167,entryHash:expectedEntries['Heavily Armored|PHB'],abilityBonus:1,cap:20,abilities:['str'],armorTraining:['heavy'],requiredArmor:'medium'},
];
// This is the upstream data-format contract, not a claimed WotC prose extraction.
// All three frozen entries omit max. The same pinned renderer defaults omitted
// max to 20 for fixed and choose.from abilities. No publisher prose is stored.
const abilityCapSupport={repository:'tjliqy/5etools-cn',revision:'5cc0bbe2c2b241a334e731af4448bdba2168e8bd',path:'js/render.js',gitBlobSha:'fd559e0baad858c2bc59a813603a55e41972a1f4',lines:[7093,7123],function:'Renderer.feat._mergeAbilityIncrease_getText',semantics:'abilityObj.max defaults to20; fixed and choose.from branches use that cap',url:'https://github.com/tjliqy/5etools-cn/blob/5cc0bbe2c2b241a334e731af4448bdba2168e8bd/js/render.js#L7093-L7123',publisherFeatProse:'not independently accessible in this audit'};
const retainedModernRules=[
 {reference:'Lightly Armored|XPHB',english:'Lightly Armored',page:205,entryHash:expectedEntries['Lightly Armored|XPHB'],minimumLevel:4,abilities:['str','dex'],armorTraining:['light','shield'],typedChoiceSupported:true},
 {reference:'Moderately Armored|XPHB',english:'Moderately Armored',page:205,entryHash:expectedEntries['Moderately Armored|XPHB'],minimumLevel:4,abilities:['str','dex'],armorTraining:['medium'],requiredArmor:'light',typedChoiceSupported:false},
 {reference:'Heavily Armored|XPHB',english:'Heavily Armored',page:204,entryHash:expectedEntries['Heavily Armored|XPHB'],minimumLevel:4,abilities:['con','str'],armorTraining:['heavy'],requiredArmor:'medium',typedChoiceSupported:false},
];
const evidence=JSON.parse(readFileSync(join(webRoot,'src/core/automation/reviewedFeatEvidence.json'),'utf8'));
assert.equal(evidence.schemaVersion,1,'Consumer reviewed evidence version');assert.equal(evidence.mechanism,'explicit-owned-legacy-passive-feat','Consumer reviewed mechanism');
assert.equal(evidence.source,'PHB','Consumer PHB source');assert.equal(evidence.edition,'2014','Consumer original edition');
assert.deepEqual(evidence.inputs,Object.fromEntries(['feats.json','variantrules.json'].map(path=>[path,expectedInputs[path]])),'Consumer reviewed canonical input hashes');
assert.deepEqual(evidence.retrievalRevisions,Object.fromEntries(['feats.json','variantrules.json'].map(path=>[path,retrievalRevisions[path]])),'Consumer independently verified retrieval revisions');
assert.deepEqual(evidence.supportingEntryHashes,Object.fromEntries(['Feats|PHB','Multiclassing|PHB'].map(key=>[key,expectedEntries[key]])),'Consumer repeatability and total-level source hashes');
assert.deepEqual(evidence.rules,[...previousRules,...reviewedRules],'Consumer reviewed armor feat mechanics');
const modernEvidence=JSON.parse(readFileSync(join(webRoot,'src/core/automation/modernArmorTrainingEvidence.json'),'utf8'));
assert.equal(modernEvidence.schemaVersion,1,'Retained XPHB training evidence version');
assert.equal(modernEvidence.mechanism,'preserve-existing-modern-armor-training','Retained XPHB training mechanism');
assert.equal(modernEvidence.source,'XPHB','Retained XPHB source');assert.equal(modernEvidence.edition,'2024','Retained XPHB edition');
assert.deepEqual(modernEvidence.input,{path:'feats.json',sha256:expectedInputs['feats.json'],retrievalRevision:retrievalRevisions['feats.json']},'Retained XPHB canonical input');
assert.deepEqual(modernEvidence.rules,retainedModernRules,'Retained XPHB training mechanics only');
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
for(const [key,rows] of [['Lightly Armored|XPHB',feats],['Moderately Armored|XPHB',feats],['Heavily Armored|XPHB',feats],['Tough|XPHB',feats],['Resilient|XPHB',feats],['Lightly Armored|PHB',feats],['Moderately Armored|PHB',feats],['Heavily Armored|PHB',feats],['Tough|PHB',feats],['Resilient|PHB',feats],['Feats|PHB',variants],['Multiclassing|PHB',variants],['Fighter|PHB',bodies['class/class-fighter.json'].class],['Artificer|TCE',bodies['class/class-artificer.json'].class]] as const){const [name,source]=key.split('|');entryHashes[key]=hash(exact(rows,name,source));assert.equal(entryHashes[key],expectedEntries[key],'Independent original entry hash '+key);}
for(const rule of reviewedRules){
 const raw=exact(feats,rule.english,'PHB');assert.equal(raw.page,rule.page);assert.equal(raw.repeatable,undefined,'PHB default once-per-feat');
 assert.deepEqual(raw.ability,rule.kind==='heavily-armored'?[{str:1}]:[{choose:{from:['str','dex'],amount:1}}],'Exact canonical ability shape');
 assert.deepEqual(raw.armorProficiencies,[Object.fromEntries(rule.armorTraining.map(key=>[key,true]))],'Exact canonical training shape');
 assert.deepEqual(raw.prerequisite,rule.requiredArmor?[{proficiency:[{armor:rule.requiredArmor}]}]:undefined,'Exact canonical proficiency prerequisite');
 assert.equal(raw.ability[0].max,undefined,'Cap comes from pinned upstream default, not an invented raw field');
}
for(const rule of retainedModernRules){
 const raw=exact(feats,rule.english,'XPHB');assert.equal(raw.page,rule.page);assert.equal(raw.category,'G');
 assert.deepEqual(raw.ability,[{choose:{from:rule.abilities}}],'Retained XPHB exact ability shape is identity only, not new ability automation');
 assert.deepEqual(raw.armorProficiencies,[Object.fromEntries(rule.armorTraining.map(key=>[key,true]))],'Retained XPHB exact training');
 assert.deepEqual(raw.prerequisite,[{level:4,...(rule.requiredArmor?{proficiency:[{armor:rule.requiredArmor}]}:{})}],'Retained XPHB exact prerequisites');
 assert.equal(raw.reprintedAs,undefined);assert.equal(raw.repeatable,undefined);assert.equal(raw.entries.length,2);
 assert.equal(raw.entries[1].ENG_name,'Armor Training');assert.equal(raw.entries[1].type,'entries');assert.equal(raw.entries[1].entries.length,1);
}
const featRuleText=JSON.stringify(exact(variants,'Feats','PHB').entries);
assert(featRuleText.includes('每个专长只可被选用一次'),'Pinned PHB default nonrepeatability');
assert(featRuleText.includes('直至重新满足该先决条件'),'Pinned PHB loss and restoration of prerequisite');
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
const producerScript='scripts/audit_reviewed_armor_feats.ts';
function assertProducerClean(){assert.equal(execFileSync('git',['status','--porcelain','--untracked-files=all','--',producerScript],{encoding:'utf8'}).trim(),'','Producer proof script must be committed and clean');}
assertProducerClean();const producerScriptSha256=bytesHash(producerScript);
assert.equal(createHash('sha256').update(execFileSync('git',['cat-file','blob',`${producerRevision}:${producerScript}`])).digest('hex'),producerScriptSha256,'Proof script bytes match producer revision');
mkdirSync('.cache',{recursive:true});const adapter=resolve('.cache/reviewed-armor-feats-consumer.mjs');
const exports:Record<string,string[]>={
 'src/core/model.ts':['newCharacter'],'src/core/automation/state.ts':['newAutomationState'],'src/data/catalog.ts':['normalizeData'],
 'src/core/sheet.ts':['syncFeatures','removeSelection'],'src/core/automation/choices.ts':['sheetChoices','setSheetChoiceSlot','syncChoiceContent'],
 'src/core/automation/reviewedFeats.ts':['reviewedFeatRule','reviewedFeatStatus','setReviewedFeatIntent'],
 'src/core/automation/reviewedFeatIdentity.ts':['retainedModernArmorRule'],
 'src/core/proficiencyText.ts':['equipmentTraining'],'src/core/automation/training.ts':['effectiveTrainingDeclarations'],'src/core/automation/equipment.ts':['armorTraining'],
 'src/core/automation/asi.ts':['setAsiAllocation'],'src/core/engine.ts':['evaluate'],
 'src/core/export.ts':['exportCharacter','exportLinkedOwlbear'],'src/core/validation.ts':['readCharacter','validateCharacter','importOwlbear'],
};
const bundle=await build({stdin:{contents:Object.entries(exports).map(([path,names])=>`export {${names.join(',')}} from ${JSON.stringify(resolve(webRoot,path))};`).join('\n'),resolveDir:resolve(webRoot),loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:adapter,metafile:true,define:{'import.meta.env.MODE':'"standalone"','import.meta.env.DEV':'false'}});
const api=await import(pathToFileURL(adapter).href);
const merged:any={feat:feats,baseitem:bodies['items-base.json'].baseitem};for(const key of ['class','subclass','classFeature','subclassFeature'])merged[key]=Object.entries(bodies).filter(([path])=>path.startsWith('class/')).flatMap(([,body])=>body[key]||[]);
const entries=api.normalizeData(structuredClone(merged),'frozen-reviewed-armor-feats'),catalogBefore=hash(entries);assert.equal(hash(bodies),sourceBefore,'Normalizer preserves original source');
const find=(kind:string,name:string,source='PHB')=>{const rows=entries.filter((e:any)=>e.kind===kind&&e.english===name&&e.source===source);assert.equal(rows.length,1,'Unique normalized '+name+'|'+source);return rows[0];};
const light=find('feat','Lightly Armored'),moderate=find('feat','Moderately Armored'),heavy=find('feat','Heavily Armored'),armors=[light,moderate,heavy];
const ruleFor=(e:any)=>reviewedRules.find(rule=>rule.english===e.english)!;
const abilityFor=(e:any)=>e===heavy?'str':'dex';
const steps:{mechanism:string;label:string;passed:true}[]=[];
const preserve=(c:any)=>json({abilities:c.abilities,baseHp:c.baseHp,hpProgression:c.hpProgression,notes:c.notes,runtime:c.runtime,sheetBonuses:c.sheetBonuses,saveBonuses:c.saveBonuses,skillBonuses:c.skillBonuses,proficiencies:c.proficiencies,expertise:c.expertise,adjustments:c.adjustments,training:c.training,inventory:c.inventory});
function baseCard(level=4,name='Wizard',source='PHB'){
 const c=api.newCharacter('2014');c.automation=api.newAutomationState();c.profile.enabledSources=['PHB','TCE'];c.abilities.dex=13;c.abilities.str=13;
 c.notes='Authored armor-feat preservation probe';c.sheetBonuses={ac:3};c.skillBonuses={athletics:1};c.proficiencies={athletics:true};c.expertise={athletics:true};c.runtime.hp=2;c.runtime.tempHp=1;c.runtime.resources={'manual-sentinel':{current:1,max:7},'Moderately Armored':{current:77,max:99,unlimited:true}};
 c.selections=[{id:'proof-owner',entry:structuredClone(find('class',name,source)),level,quantity:1,equipped:false}];api.syncFeatures(c,entries);return c;
}
const cardFor=(e:any,level=4)=>baseCard(level,e===moderate?'Bard':e===heavy?'Cleric':'Wizard');
const choice=(c:any,level=4)=>{const owner=c.selections.find((s:any)=>s.id==='proof-owner'),feature=c.selections.find((s:any)=>s.parentId===owner.id&&s.entry.english==='Ability Score Improvement'&&s.entry.raw.level===level&&s.entry.source===owner.entry.source);assert(feature,'Generated real ASI feature '+level);const id=`${owner.id}:class-legacy-feat:${feature.entry.id}`,row=api.sheetChoices(c,entries).find((r:any)=>r.id===id);assert(row,'Generated real class choice '+level);return row;};
const select=(c:any,e:any,level=4)=>{const row=choice(c,level);assert(row.options.some((o:any)=>o.value===e.id),'Real feat alternative is offered');api.setSheetChoiceSlot(c,row.id,0,e.id,entries);assert.deepEqual(c.answers[row.id],[e.id]);assert.equal(c.classChoiceSnapshots[e.id].id,e.id);return row.id;};
const intent=(e:any,ability=abilityFor(e))=>({kind:ruleFor(e).kind,ability,confirmedManualAbilityExcluded:true});
const activate=(c:any,e:any,ability=abilityFor(e),level=4)=>{const id=select(c,e,level);api.setReviewedFeatIntent(c,id,e.id,intent(e,ability));assert.equal(api.reviewedFeatStatus(c,id,e.id).active,true,'Explicit reviewed feat activates');return id;};
function evaluate(c:any){const before=JSON.stringify(c),d=api.evaluate(c);assert.equal(JSON.stringify(c),before,'Evaluation is pure');return d;}
function training(c:any){const before=JSON.stringify(c),t=[...api.armorTraining(c,c.selections)].sort(),declarations=api.effectiveTrainingDeclarations(c,c.selections,'armor');assert.deepEqual([...new Set(declarations.map((value:string)=>api.equipmentTraining(value)?.[0]).filter(Boolean))].sort(),t,'Equipment and shared display/prerequisite training projections agree');assert.equal(JSON.stringify(c),before,'Training projection is pure');return t;}
function status(c:any,id:string,e:any){const before=JSON.stringify(c),s=api.reviewedFeatStatus(c,id,e.id);assert.equal(JSON.stringify(c),before,'Status is pure');return s;}
function reject(c:any,fn:()=>void){const before=JSON.stringify(c);assert.throws(fn);assert.equal(JSON.stringify(c),before,'Rejected mutation is atomic');}
function reopen(c:any,linked=false){const before=JSON.stringify(c),payload=json(linked?api.exportLinkedOwlbear(c,evaluate(c)):api.exportCharacter(c)),inputBefore=JSON.stringify(payload),loaded=linked?{character:api.importOwlbear(payload),repaired:[]}:api.readCharacter(payload);assert.deepEqual(loaded.repaired,[],'No roundtrip repair');assert.equal(JSON.stringify(c),before,'Export is pure');assert.equal(JSON.stringify(payload),inputBefore,'Import is pure');assert.deepEqual(loaded.character.reviewedFeats,c.reviewedFeats,'Explicit intent persists');assert.deepEqual(preserve(loaded.character),preserve(c),'Manual data roundtrip unchanged');return loaded.character;}
function check(mechanism:string,label:string,fn:()=>void){try{fn();}catch(error){throw Error(label,{cause:error});}steps.push({mechanism,label,passed:true});}
function equip(c:any,name:string,source='PHB'){const row={id:'equipment-probe',entry:structuredClone(find('item',name,source)),level:1,quantity:1,equipped:true};c.selections.push(row);return row;}
for(const profile of profiles)for(const e of armors)check(ruleFor(e).kind,`Real ${profile.owner} level ${profile.level} ASI alternative explicitly applies and revokes ${e.english}`,()=>{
 const [name,source]=profile.owner.split('|'),c=baseCard(profile.level,name,source),ability=abilityFor(e);
 // An authored declaration is a legitimate prerequisite. It stays authoritative,
 // so these 204 paths establish source ownership, not 204 novel rule semantics.
 if(ruleFor(e).requiredArmor)c.training={armor:ruleFor(e).requiredArmor};
 const before=evaluate(c),oldTraining=training(c),manual=preserve(c),id=select(c,e,profile.level);
 assert.equal(status(c,id,e).active,false,'Choosing a feat alone never adopts handwritten values');assert.deepEqual(evaluate(c).abilities,before.abilities);assert.deepEqual(training(c),oldTraining);
 api.setReviewedFeatIntent(c,id,e.id,intent(e));assert.equal(status(c,id,e).active,true);assert.equal(evaluate(c).abilities[ability],before.abilities[ability]+1);assert.deepEqual(preserve(c),manual);
 api.setReviewedFeatIntent(c,id,e.id,null);assert.equal(status(c,id,e).active,false);assert.deepEqual(evaluate(c).abilities,before.abilities);assert.deepEqual(training(c),oldTraining);assert.deepEqual(preserve(c),manual);api.validateCharacter(json(c));
});
for(const e of armors)for(const ability of ruleFor(e).abilities)check(ruleFor(e).kind,`${e.english} confirmed ${ability} applies training without writing manual fields`,()=>{
 const c=cardFor(e),before=evaluate(c),oldTraining=training(c),manual=preserve(c),id=select(c,e);assert.equal(status(c,id,e).active,false);assert.deepEqual(training(c),oldTraining);
 api.setReviewedFeatIntent(c,id,e.id,intent(e,ability));assert.equal(evaluate(c).abilities[ability],before.abilities[ability]+1);for(const type of ruleFor(e).armorTraining)assert(training(c).includes(type));assert.deepEqual(preserve(c),manual);
 if(e===light)assert(!training(c).includes('shield'),'2014 Lightly Armored does not grant shield training');
 api.setReviewedFeatIntent(c,id,e.id,null);assert.deepEqual(evaluate(c).abilities,before.abilities);assert.deepEqual(training(c),oldTraining);assert.deepEqual(preserve(c),manual);
});
for(const e of armors)check(ruleFor(e).kind,`${e.english} native and linked save/reopen work without catalog`,()=>{
 let c=cardFor(e);const manual=preserve(c),id=activate(c,e),expected=evaluate(c),expectedTraining=training(c);
 for(const linked of [false,true]){c=reopen(c,linked);api.syncFeatures(c,[]);assert.equal(status(c,id,e).active,true);assert.deepEqual(evaluate(c).abilities,expected.abilities);assert.deepEqual(training(c),expectedTraining);assert.deepEqual(preserve(c),manual);}
});
for(const e of armors)for(const invalid of [undefined,false])check(ruleFor(e).kind,`${e.english} missing/false manual exclusion ${String(invalid)} is atomic`,()=>{const c=cardFor(e),id=select(c,e);reject(c,()=>api.setReviewedFeatIntent(c,id,e.id,{...intent(e),confirmedManualAbilityExcluded:invalid}));assert.equal(status(c,id,e).active,false);});
for(const e of armors)for(const invalid of ['con','int','wis','cha','luck','',null,13,...(e===heavy?['dex']:[])])check(ruleFor(e).kind,`${e.english} invalid ability ${String(invalid)} is atomic`,()=>{const c=cardFor(e),id=select(c,e);reject(c,()=>api.setReviewedFeatIntent(c,id,e.id,{...intent(e),ability:invalid}));});
for(const e of armors)for(const base of [19,20,22])check(ruleFor(e).kind,`${e.english} base ${base} respects cap20 without lowering authored score`,()=>{const c=cardFor(e),ability=abilityFor(e);c.abilities[ability]=base;const id=select(c,e),manual=preserve(c),oldTraining=training(c);if(base===19){api.setReviewedFeatIntent(c,id,e.id,intent(e));assert.equal(evaluate(c).abilities[ability],20);}else{reject(c,()=>api.setReviewedFeatIntent(c,id,e.id,intent(e)));assert.equal(evaluate(c).abilities[ability],base);assert.deepEqual(training(c),oldTraining);}assert.deepEqual(preserve(c),manual);});
for(const e of armors)check(ruleFor(e).kind,`${e.english} raising base to20 suspends ability and owned training then restores saved intent`,()=>{let c=cardFor(e);const oldTraining=training(c),ability=abilityFor(e),id=activate(c,e),saved=json(c.reviewedFeats);c.abilities[ability]=20;assert.equal(status(c,id,e).active,false);assert(status(c,id,e).reason);assert.equal(evaluate(c).abilities[ability],20);assert.deepEqual(training(c),oldTraining);c=reopen(c);assert.deepEqual(c.reviewedFeats,saved);c.abilities[ability]=19;assert.equal(status(c,id,e).active,true);assert.equal(evaluate(c).abilities[ability],20);});
for(const e of armors)check(ruleFor(e).kind,`${e.english} duplicate second class ASI selection is rejected atomically`,()=>{const c=cardFor(e,8),first=activate(c,e),later=choice(c,8);assert.notEqual(first,later.id);reject(c,()=>api.setSheetChoiceSlot(c,later.id,0,e.id,entries));});
for(const e of armors)check(ruleFor(e).kind,`${e.english} answer withdrawal clears consent and restoration never accumulates`,()=>{let c=cardFor(e);const original=evaluate(c),oldTraining=training(c),id=activate(c,e),active=evaluate(c);api.setSheetChoiceSlot(c,id,0,undefined,entries);assert.equal(status(c,id,e).active,false);assert.deepEqual(evaluate(c).abilities,original.abilities);assert.deepEqual(training(c),oldTraining);c=reopen(c);api.setSheetChoiceSlot(c,id,0,e.id,entries);assert.equal(status(c,id,e).active,false);api.setReviewedFeatIntent(c,id,e.id,intent(e));assert.deepEqual(evaluate(c).abilities,active.abilities);});
check('replacement','Replacing confirmed Lightly with Tough and back clears obsolete ability/training and consent',()=>{const c=baseCard(),manual=preserve(c),id=activate(c,light),tough=find('feat','Tough');assert(training(c).includes('light'));api.setSheetChoiceSlot(c,id,0,tough.id,entries);assert.equal(evaluate(c).abilities.dex,13);assert(!training(c).includes('light'));api.setReviewedFeatIntent(c,id,tough.id,{kind:'tough',confirmedManualHpExcluded:true});const hp=evaluate(c).maxHp;api.setSheetChoiceSlot(c,id,0,light.id,entries);assert.equal(status(c,id,light).active,false);assert.equal(evaluate(c).maxHp,hp-8);api.setReviewedFeatIntent(c,id,light.id,intent(light));assert.equal(evaluate(c).abilities.dex,14);assert.deepEqual(preserve(c),manual);});
for(const e of armors)for(const [label,off,on] of [
 ['automation',(c:any)=>{c.automation.enabled=false;},(c:any)=>{c.automation.enabled=true;}],
 ['PHB source',(c:any)=>{c.profile.enabledSources=['TCE'];},(c:any)=>{c.profile.enabledSources=['PHB','TCE'];}],
 ['feat optional rule',(c:any)=>{c.profile.optional.feats=false;},(c:any)=>{c.profile.optional.feats=true;}],
] as const)check(ruleFor(e).kind,`${e.english} disabling ${label} preserves inactive intent and restores once`,()=>{let c=cardFor(e);const id=activate(c,e),saved=json(c.reviewedFeats),answers=json(c.answers),snapshots=json(c.classChoiceSnapshots);off(c);assert.equal(status(c,id,e).active,false);assert(status(c,id,e).reason);assert.deepEqual(c.reviewedFeats,saved);assert.deepEqual(c.answers,answers);assert.deepEqual(c.classChoiceSnapshots,snapshots);c=reopen(c);on(c);assert.equal(status(c,id,e).active,true);assert.equal(evaluate(c).abilities[abilityFor(e)],14);});
for(const e of armors)check(ruleFor(e).kind,`${e.english} downgrade and offline restoration retain owned intent without stacking`,()=>{let c=cardFor(e);const oldTraining=training(c),id=activate(c,e),saved=json(c.reviewedFeats);c.selections.find((s:any)=>s.id==='proof-owner').level=3;api.syncFeatures(c,[]);assert.equal(status(c,id,e).active,false);assert.deepEqual(training(c),oldTraining);assert.deepEqual(c.reviewedFeats,saved);c=reopen(c);c.selections.find((s:any)=>s.id==='proof-owner').level=4;api.syncFeatures(c,[]);assert.equal(status(c,id,e).active,true);assert.equal(evaluate(c).abilities[abilityFor(e)],14);});
for(const e of armors)for(const [label,edit] of [
 ['missing owner',(c:any)=>{c.selections=c.selections.filter((s:any)=>s.id!=='proof-owner');}],
 ['missing ASI feature',(c:any,id:string)=>{const binding=c.reviewedFeats.bindings.find((b:any)=>b.choiceId===id);c.selections=c.selections.filter((s:any)=>s.id!==binding.selectionId);}],
 ['cyclic ancestry',(c:any,id:string)=>{const binding=c.reviewedFeats.bindings.find((b:any)=>b.choiceId===id);c.selections.find((s:any)=>s.id==='proof-owner').parentId=binding.selectionId;}],
 ['dismissed ASI',(c:any,id:string)=>{const binding=c.reviewedFeats.bindings.find((b:any)=>b.choiceId===id),feature=c.selections.find((s:any)=>s.id===binding.selectionId);c.dismissedFeatures=[`proof-owner|${feature.grantKey}`];}],
 ['changed raw owner identity',(c:any)=>{c.selections.find((s:any)=>s.id==='proof-owner').entry.raw.ENG_name='Other';}],
 ['changed raw ASI identity',(c:any,id:string)=>{const binding=c.reviewedFeats.bindings.find((b:any)=>b.choiceId===id);c.selections.find((s:any)=>s.id===binding.selectionId).entry.raw.ENG_name='Other';}],
] as const)check(ruleFor(e).kind,`${e.english} ${label} suspends saved effect visibly`,()=>{const c=cardFor(e),id=activate(c,e),saved=json(c.reviewedFeats);edit(c,id);assert.equal(status(c,id,e).active,false);assert(status(c,id,e).reason);assert.deepEqual(c.reviewedFeats,saved);assert.equal(evaluate(c).abilities[abilityFor(e)],13);});
for(const e of armors)for(const [label,edit] of [
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
 ['changed ability amount',(entry:any)=>{entry.raw.ability=[{str:3}];}],
 ['extra ability cap',(entry:any)=>{entry.raw.ability[0].max=30;}],
 ['changed armor categories',(entry:any)=>{entry.raw.armorProficiencies=[{light:true,medium:true,heavy:true,shield:true}];}],
 ['changed prerequisite',(entry:any)=>{entry.raw.prerequisite=[{proficiency:[{armor:'shield'}]}];}],
 ['repeatable injected',(entry:any)=>{entry.raw.repeatable=true;}],
] as const)check(ruleFor(e).kind,`${e.english} ${label} cannot acquire reviewed authorization`,()=>{const c=cardFor(e),oldTraining=training(c),id=activate(c,e),saved=json(c.reviewedFeats);edit(c.classChoiceSnapshots[e.id]);assert.equal(api.reviewedFeatRule(c.classChoiceSnapshots[e.id]),undefined);assert.equal(status(c,id,e).active,false);reject(c,()=>api.setReviewedFeatIntent(c,id,e.id,intent(e)));assert.deepEqual(c.reviewedFeats,saved);assert.deepEqual(training(c),oldTraining);});
for(const e of armors)check(ruleFor(e).kind,`Exact newer ${e.english}|XPHB remains separate and unsupported`,()=>{assert.equal(api.reviewedFeatRule(find('feat',e.english,'XPHB')),undefined);});
for(const e of armors)check(ruleFor(e).kind,`Manually dragged ${e.english} cannot manufacture an owned ASI ability grant`,()=>{const c=cardFor(e),before=evaluate(c);c.selections.push({id:'manual-feat',entry:structuredClone(e),level:1,quantity:1,equipped:false});const id=choice(c).id;assert.equal(status(c,id,e).eligible,false);reject(c,()=>api.setReviewedFeatIntent(c,id,e.id,intent(e)));assert.deepEqual(evaluate(c).abilities,before.abilities);});
for(const e of armors)check(ruleFor(e).kind,`${e.english} imported duplicate confirmation stays ambiguous and inactive`,()=>{const c=cardFor(e),oldTraining=training(c),id=activate(c,e);c.reviewedFeats.bindings.push(structuredClone(c.reviewedFeats.bindings[0]));const before=JSON.stringify(c);assert.equal(status(c,id,e).active,false);assert(status(c,id,e).reason);assert.equal(evaluate(c).abilities[abilityFor(e)],13);assert.deepEqual(training(c),oldTraining);assert.equal(JSON.stringify(c),before);});
for(const e of armors)check(ruleFor(e).kind,`${e.english} imported second nonrepeatable selected grant cannot multiply effects`,()=>{const c=cardFor(e,8),id=activate(c,e),id2=choice(c,8).id,featureId=id2.split(':class-legacy-feat:')[1],feature=c.selections.find((s:any)=>s.entry.id===featureId);assert(feature);c.answers[id2]=[e.id];c.reviewedFeats.bindings.push({...structuredClone(c.reviewedFeats.bindings[0]),choiceId:id2,selectionId:feature.id});const before=JSON.stringify(c),s=status(c,id,e),s2=status(c,id2,e);assert(!(s.active&&s2.active));assert(evaluate(c).abilities[abilityFor(e)]<=14);assert(s.reason||s2.reason);assert.equal(JSON.stringify(c),before);});
for(const e of armors)check(ruleFor(e).kind,`${e.english} unknown future intent version remains unchanged and inactive after reopen`,()=>{let c=cardFor(e);const oldTraining=training(c),id=activate(c,e);c.reviewedFeats={version:99,opaque:{authored:'preserve'}};const saved=json(c.reviewedFeats);assert.equal(status(c,id,e).active,false);reject(c,()=>api.setReviewedFeatIntent(c,id,e.id,intent(e)));c=reopen(c);assert.deepEqual(c.reviewedFeats,saved);assert.equal(evaluate(c).abilities[abilityFor(e)],13);assert.deepEqual(training(c),oldTraining);});
for(const e of [moderate,heavy])for(const declaration of ['', 'shield','heavy','Plate Armor','{@item Leather Armor|PHB}','{@item Breastplate|PHB}'])check('prerequisite',`${e.english} declaration ${JSON.stringify(declaration)} is not its required category`,()=>{const c=baseCard();c.training={armor:declaration};const row=choice(c);reject(c,()=>api.setSheetChoiceSlot(c,row.id,0,e.id,entries));assert.equal(status(c,row.id,e).active,false);});
for(const e of [moderate,heavy])check('prerequisite',`${e.english} missing prerequisite rejects selection and explicit confirmation`,()=>{const c=baseCard(),row=choice(c);reject(c,()=>api.setSheetChoiceSlot(c,row.id,0,e.id,entries));reject(c,()=>api.setReviewedFeatIntent(c,row.id,e.id,intent(e)));assert.equal(evaluate(c).abilities[abilityFor(e)],13);});
for(const e of [moderate,heavy])check('prerequisite',`${e.english} losing and restoring manual prerequisite suspends/restores all owned effects`,()=>{let c=baseCard();c.training={armor:ruleFor(e).requiredArmor};const id=activate(c,e),saved=json(c.reviewedFeats);c.training.armor='';const manual=preserve(c);assert.equal(status(c,id,e).active,false);assert(status(c,id,e).reason);assert.equal(evaluate(c).abilities[abilityFor(e)],13);assert.deepEqual(training(c),[]);c=reopen(c);assert.deepEqual(c.reviewedFeats,saved);assert.deepEqual(preserve(c),manual);c.training.armor=ruleFor(e).requiredArmor;assert.equal(status(c,id,e).active,true);assert.equal(evaluate(c).abilities[abilityFor(e)],14);assert.deepEqual(training(c),[ruleFor(e).requiredArmor]);});
for(const declaration of ['', 'shield','heavy','light, medium, heavy, shield'])check('manual-training',`Lightly Armored preserves explicit armor override ${JSON.stringify(declaration)}`,()=>{let c=baseCard();c.training={armor:declaration,weapons:'manual weapons',tools:'manual tools',languages:'manual language'};const before=training(c),manual=preserve(c),id=activate(c,light);assert.equal(evaluate(c).abilities.dex,14);assert.deepEqual(training(c),before);assert.deepEqual(preserve(c),manual);c=reopen(c);assert.equal(status(c,id,light).active,true);assert.deepEqual(training(c),before);assert.deepEqual(preserve(c),manual);});
check('manual-training','Clearing versus deleting an authored override are different and never mutate the stored string',()=>{const c=baseCard(),id=activate(c,light);assert(training(c).includes('light'));c.training={armor:''};assert.equal(status(c,id,light).active,true);assert.deepEqual(training(c),[]);assert.equal(c.training.armor,'');delete c.training.armor;assert(training(c).includes('light'));assert.equal(c.training.armor,undefined);});
check('prerequisite-chain','Earlier confirmed Lightly→Moderately→Heavily grants qualify in authentic ASI order across reopen',()=>{
 let c=baseCard(12);const manual=preserve(c),first=activate(c,light,'dex',4),second=activate(c,moderate,'dex',8),third=activate(c,heavy,'str',12);
 assert.deepEqual(training(c),['heavy','light','medium','shield']);assert.equal(evaluate(c).abilities.dex,15);assert.equal(evaluate(c).abilities.str,14);assert.deepEqual(preserve(c),manual);
 c.reviewedFeats.bindings.reverse();c=reopen(c);for(const [id,e] of [[first,light],[second,moderate],[third,heavy]])assert.equal(status(c,id as string,e).active,true);assert.deepEqual(training(c),['heavy','light','medium','shield']);
 api.setReviewedFeatIntent(c,first,light.id,null);assert.equal(status(c,second,moderate).active,false);assert.equal(status(c,third,heavy).active,false);assert.deepEqual(training(c),[]);assert.equal(evaluate(c).abilities.dex,13);assert.equal(evaluate(c).abilities.str,13);
 api.setReviewedFeatIntent(c,first,light.id,intent(light));assert.equal(status(c,second,moderate).active,true);assert.equal(status(c,third,heavy).active,true);assert.deepEqual(training(c),['heavy','light','medium','shield']);assert.deepEqual(preserve(c),manual);
});
check('prerequisite-chain','A later Lightly grant cannot qualify an earlier Moderately grant after removing temporary manual training',()=>{const c=baseCard(8);c.training={armor:'light'};const early=activate(c,moderate,'dex',4),later=activate(c,light,'dex',8);delete c.training;assert.equal(status(c,early,moderate).active,false);assert(status(c,early,moderate).reason);assert.equal(status(c,later,light).active,true);assert.deepEqual(training(c),['light']);assert.equal(evaluate(c).abilities.dex,14);});
check('prerequisite-chain','An unconfirmed earlier Lightly answer cannot qualify later Moderately',()=>{const c=baseCard(8);select(c,light,4);reject(c,()=>api.setSheetChoiceSlot(c,choice(c,8).id,0,moderate.id,entries));assert.deepEqual(training(c),[]);});
check('prerequisite-chain','An inactive capped earlier grant cannot qualify its later dependent',()=>{const c=baseCard(8),first=activate(c,light,'str',4),second=activate(c,moderate,'dex',8),saved=json(c.reviewedFeats);c.abilities.str=20;assert.equal(status(c,first,light).active,false);assert.equal(status(c,second,moderate).active,false);assert.deepEqual(training(c),[]);assert.equal(evaluate(c).abilities.dex,13);assert.deepEqual(c.reviewedFeats,saved);});
check('prerequisite-chain','Heavily cannot use its own training as its medium prerequisite',()=>{const c=baseCard();c.training={armor:'medium'};const id=activate(c,heavy);delete c.training;assert.equal(status(c,id,heavy).active,false);assert.deepEqual(training(c),[]);assert.equal(evaluate(c).abilities.str,13);});
check('prerequisite-chain','Replacing earlier Lightly withdraws dependent training without deleting later intents',()=>{const c=baseCard(8),first=activate(c,light,'str',4),later=activate(c,moderate,'dex',8),saved=json(c.reviewedFeats.bindings.find((b:any)=>b.choiceId===later)),tough=find('feat','Tough');api.setSheetChoiceSlot(c,first,0,tough.id,entries);assert.equal(status(c,later,moderate).active,false);assert.deepEqual(c.reviewedFeats.bindings.find((b:any)=>b.choiceId===later),saved);assert.deepEqual(training(c),[]);assert.equal(evaluate(c).abilities.dex,13);});
function applyAsi(c:any,level:number,ability:string,amount:number){const row=choice(c,level),plan=row.options.find((o:any)=>o.entry?.raw._classAbilityRecord);assert(plan);api.setSheetChoiceSlot(c,row.id,0,plan.value,entries);api.setAsiAllocation(c,row.id,{[ability]:amount});return row.id;}
check('shared-cap','Earlier armor feat and later explicit ASI share cap20 without touching authored Dexterity',()=>{const c=baseCard(8);c.abilities.dex=17;const id=activate(c,light);applyAsi(c,8,'dex',2);assert.equal(evaluate(c).abilities.dex,20);assert.equal(status(c,id,light).active,true);assert.equal(c.abilities.dex,17);});
check('shared-cap','Earlier ASI and later armor feat share cap20 independent of call order',()=>{const c=baseCard(8);c.abilities.dex=17;applyAsi(c,4,'dex',2);const id=activate(c,light,'dex',8);assert.equal(evaluate(c).abilities.dex,20);assert.equal(status(c,id,light).active,true);assert.equal(c.abilities.dex,17);});
check('shared-cap','Earlier ASI already reaching20 rejects later armor confirmation atomically',()=>{const c=baseCard(8);c.abilities.dex=18;applyAsi(c,4,'dex',2);const id=select(c,light,8);reject(c,()=>api.setReviewedFeatIntent(c,id,light.id,intent(light)));assert.equal(evaluate(c).abilities.dex,20);assert.deepEqual(training(c),[]);});
check('shared-cap','Confirming an earlier armor feat cannot silently disable an existing later ASI',()=>{const c=baseCard(8);c.abilities.dex=18;applyAsi(c,8,'dex',2);const id=select(c,light,4);reject(c,()=>api.setReviewedFeatIntent(c,id,light.id,intent(light)));assert.equal(evaluate(c).abilities.dex,20);assert.deepEqual(training(c),[]);});
check('shared-cap','Two armor feats share cap in grant order even after imported binding reversal',()=>{const c=baseCard(8);c.abilities.dex=18;const first=activate(c,light,'dex',4),second=activate(c,moderate,'dex',8);assert.equal(evaluate(c).abilities.dex,20);c.reviewedFeats.bindings.reverse();c.abilities.dex=19;const before=JSON.stringify(c);assert.equal(status(c,first,light).active,true);assert.equal(status(c,second,moderate).active,false);assert.equal(evaluate(c).abilities.dex,20);assert.deepEqual(training(c),['light']);assert.equal(JSON.stringify(c),before);});
for(const [e,name] of [[light,'Leather Armor'],[moderate,'Shield'],[heavy,'Chain Mail']] as const)check('equipment',`${e.english} removes real ${name} training warning without inventing AC or altering equipment`,()=>{let c=cardFor(e);const item=equip(c,name),selected=json(item),before=evaluate(c),manual=preserve(c);assert(before.issues.some((i:any)=>i.id===`armor-training:${item.id}`));const id=activate(c,e,'str'),after=evaluate(c);assert(!after.issues.some((i:any)=>i.id===`armor-training:${item.id}`));assert.equal(after.ac,before.ac,'Training does not itself grant AC; Strength confirmation avoids a Dex modifier change');assert.deepEqual(c.selections.find((s:any)=>s.id===item.id),selected);assert.deepEqual(preserve(c),manual);c=reopen(c);assert(!evaluate(c).issues.some((i:any)=>i.id===`armor-training:${item.id}`));api.setReviewedFeatIntent(c,id,e.id,null);assert(evaluate(c).issues.some((i:any)=>i.id===`armor-training:${item.id}`));assert.deepEqual(preserve(c),manual);});
check('equipment','Moderately shield training without a shield grants no free +2AC',()=>{const c=cardFor(moderate),before=evaluate(c);activate(c,moderate,'str');assert(training(c).includes('shield'));assert.equal(evaluate(c).ac,before.ac);});
for(const e of armors)check(ruleFor(e).kind,`${e.english} future ASI archive state cannot authorize offline restoration`,()=>{let c=cardFor(e);const id=activate(c,e),saved=json(c.reviewedFeats);c.asiAllocations={version:99,opaque:{authored:'future ASI intent'}};const opaque=json(c.asiAllocations);c.selections[0].level=3;api.syncFeatures(c,[]);assert.equal(status(c,id,e).active,false);assert.equal(c.classChoiceArchive?.[saved.bindings[0].selectionId],undefined);c=reopen(c);assert.deepEqual(c.reviewedFeats,saved);assert.deepEqual(c.asiAllocations,opaque);c.selections[0].level=4;api.syncFeatures(c,[]);assert.equal(status(c,id,e).active,false);assert(status(c,id,e).reason);assert.deepEqual(c.reviewedFeats,saved);});
check('adversarial-import','A real later Wizard ASI with injected raw training cannot qualify an earlier ASI grant',()=>{const c=baseCard(8);c.training={armor:'light'};const first=activate(c,moderate,'dex',4),later=choice(c,8),featureId=later.id.split(':class-legacy-feat:')[1],donor=c.selections.find((row:any)=>row.entry.id===featureId);assert(donor);donor.entry.raw.armorProficiencies=[{light:true}];delete c.training;const saved=json(c.reviewedFeats),before=JSON.stringify(c);assert.equal(status(c,first,moderate).active,false);assert(status(c,first,moderate).reason);assert.equal(evaluate(c).abilities.dex,13);assert(!training(c).includes('medium'));assert.deepEqual(c.reviewedFeats,saved);reject(c,()=>api.setReviewedFeatIntent(c,first,moderate.id,intent(moderate)));assert.equal(JSON.stringify(c),before);});
check('adversarial-import','A no-level child of a real future Wizard ASI cannot hide its late training ancestor',()=>{const c=baseCard(8);c.training={armor:'light'};const first=activate(c,moderate,'dex',4),later=choice(c,8),featureId=later.id.split(':class-legacy-feat:')[1],donor=c.selections.find((row:any)=>row.entry.id===featureId);assert(donor);const entry=structuredClone(light);entry.id='adversarial-child';entry.kind='feature';entry.english='Injected Future Training';entry.raw={name:'Injected Future Training',ENG_name:'Injected Future Training',source:'PHB',_category:'feature',armorProficiencies:[{light:true}]};entry.entries=[];c.selections.push({id:'future-training-child',entry,level:1,quantity:1,equipped:false,parentId:donor.id});delete c.training;assert.equal(status(c,first,moderate).active,false);assert.equal(evaluate(c).abilities.dex,13);assert(!training(c).includes('medium'));reject(c,()=>api.setReviewedFeatIntent(c,first,moderate.id,intent(moderate)));});
check('adversarial-import','Cyclic authentic owner ancestry is inactive consistently in status, evaluation and both training APIs',()=>{const c=baseCard(),id=activate(c,light),binding=c.reviewedFeats.bindings[0];c.selections.find((row:any)=>row.id==='proof-owner').parentId=binding.selectionId;const saved=json(c.reviewedFeats),before=JSON.stringify(c);assert.equal(status(c,id,light).active,false);assert.equal(evaluate(c).abilities.dex,13);assert.deepEqual(training(c),[]);assert.deepEqual(c.reviewedFeats,saved);assert.equal(JSON.stringify(c),before);});
check('adversarial-import','An unrelated cyclic injected ability effect cannot corrupt cap eligibility or training projection',()=>{const c=baseCard(),id=activate(c,light),injected=structuredClone(light);injected.kind='feature';injected.effects=[{op:'add',target:'dex',value:10}];c.selections.push({id:'cycle-a',parentId:'cycle-b',entry:injected,level:1,quantity:1,equipped:false},{id:'cycle-b',parentId:'cycle-a',entry:structuredClone(injected),level:1,quantity:1,equipped:false});const before=JSON.stringify(c);assert.equal(status(c,id,light).active,true);assert.equal(evaluate(c).abilities.dex,14);assert.deepEqual(training(c),['light']);assert.equal(JSON.stringify(c),before);});
for(const e of armors)for(const kind of ['feature','race','item'])check('adversarial-import',`Retyping ${e.english} as ${kind} cannot bypass explicit training consent`,()=>{const c=baseCard(),entry=structuredClone(e),manual=preserve(c);entry.kind=kind;c.selections.push({id:'retyped-armor-feat',entry,level:1,quantity:1,equipped:true});const before=JSON.stringify(c);assert.equal(api.reviewedFeatRule(entry),undefined);assert.deepEqual(training(c),[]);assert.equal(evaluate(c).abilities.dex,13);assert.equal(evaluate(c).abilities.str,13);assert.equal(JSON.stringify(c),before);assert.deepEqual(preserve(c),manual);});
// Preserve old XPHB training only. These cases are separate from the204 PHB
// source-slot paths and do not claim new XPHB ability, HP or saving automation.
const modernArmors=retainedModernRules.map(rule=>find('feat',rule.english,'XPHB'));
function modernCard(e:any,level=4){
 const c=api.newCharacter('2024');c.automation=api.newAutomationState();c.profile.enabledSources=['PHB','XPHB'];c.abilities.str=13;c.abilities.dex=13;
 c.notes='Retained modern training compatibility probe';c.runtime.hp=2;c.runtime.tempHp=1;c.runtime.resources={'manual-modern':{current:1,max:7}};
 const owner=e.english==='Moderately Armored'?'Bard':e.english==='Heavily Armored'?'Cleric':'Wizard';
 c.selections=[{id:'modern-owner',entry:structuredClone(find('class',owner,'XPHB')),level,quantity:1,equipped:false}];api.syncFeatures(c,entries);return c;
}
const modernChoice=(c:any)=>{const row=api.sheetChoices(c,entries).find((r:any)=>r.id.includes(':class-typed-feat:')&&r.grantLevel===4);assert(row,'Real XPHB4 ASI choice');return row;};
function importedModern(c:any,e:any){c.selections.push({id:'retained-modern-record',entry:structuredClone(e),level:4,quantity:1,equipped:e.kind==='item'});}
for(const e of modernArmors)check('retained-modern-training',`Existing lawful level4 ${e.english}|XPHB keeps training and equipment warning behavior without PHB abilities`,()=>{
 let c=modernCard(e);const item=equip(c,e.english==='Lightly Armored'?'Shield':e.english==='Moderately Armored'?'Breastplate':'Chain Mail','XPHB'),before=evaluate(c),manual=preserve(c),row=modernChoice(c),rule=retainedModernRules.find(r=>r.english===e.english)!;
 assert(before.issues.some((i:any)=>i.id===`armor-training:${item.id}`));assert.equal(api.reviewedFeatRule(e),undefined);assert(api.retainedModernArmorRule(e));
 if(e.english==='Lightly Armored'){
  assert.equal(row.options.find((o:any)=>o.value===e.id)?.unavailable,undefined,'Previously supported real Wizard ASI4 path');
  api.setSheetChoiceSlot(c,row.id,0,e.id,entries);api.syncChoiceContent(c,entries);
  assert.equal(c.selections.filter((s:any)=>s.entry.id===e.id&&s.grantKey?.startsWith('choice:')).length,1,'One actual materialized class-choice grant');
 }else{
  assert(row.options.find((o:any)=>o.value===e.id)?.unavailable,'Existing typed acquisition boundary remains unsupported');
  reject(c,()=>api.setSheetChoiceSlot(c,row.id,0,e.id,entries));importedModern(c,e);
 }
 const after=evaluate(c);for(const type of rule.armorTraining)assert(training(c).includes(type));assert(!after.issues.some((i:any)=>i.id===`armor-training:${item.id}`));
 assert.deepEqual(after.abilities,before.abilities);assert.equal(after.maxHp,before.maxHp);assert.deepEqual(after.saves,before.saves);assert.equal(after.ac,e.english==='Lightly Armored'?before.ac+2:before.ac);
 reject(c,()=>api.setReviewedFeatIntent(c,row.id,e.id,{kind:rule.english.toLowerCase().replace(' ','-'),ability:'str',confirmedManualAbilityExcluded:true}));
 assert.deepEqual(preserve(c),manual);const expectedTraining=training(c);c=reopen(c);assert.deepEqual(training(c),expectedTraining);assert.deepEqual(evaluate(c).abilities,before.abilities);assert.deepEqual(preserve(c),manual);
});
for(const e of modernArmors)check('retained-modern-training',`${e.english}|XPHB unlawful level1 probe no longer authorizes training`,()=>{const c=modernCard(e,1),before=training(c);importedModern(c,e);assert.deepEqual(training(c),before);assert.equal(evaluate(c).abilities.str,13);assert.equal(evaluate(c).abilities.dex,13);});
for(const e of modernArmors)check('retained-modern-training',`${e.english}|XPHB manual empty training override remains authoritative`,()=>{const c=modernCard(e);importedModern(c,e);c.training={armor:''};const manual=preserve(c);assert.deepEqual(training(c),[]);assert.deepEqual(preserve(c),manual);});
for(const e of modernArmors)check('retained-modern-training',`${e.english}|XPHB level loss/restoration preserves recorded content without changing abilities`,()=>{const c=modernCard(e),baseline=training(c);importedModern(c,e);const entry=json(c.selections.find((s:any)=>s.id==='retained-modern-record')),expected=training(c);c.selections.find((s:any)=>s.id==='modern-owner').level=3;assert.deepEqual(training(c),baseline);assert.deepEqual(c.selections.find((s:any)=>s.id==='retained-modern-record'),entry);c.selections.find((s:any)=>s.id==='modern-owner').level=4;assert.deepEqual(training(c),expected);assert.equal(evaluate(c).abilities.str,13);assert.equal(evaluate(c).abilities.dex,13);});
for(const e of [modernArmors[1],modernArmors[2]])check('retained-modern-training',`${e.english}|XPHB missing actual prerequisite never receives retained training`,()=>{const c=modernCard(modernArmors[0]);importedModern(c,e);assert.deepEqual(training(c),[]);assert.equal(evaluate(c).abilities.str,13);});
check('retained-modern-training','An existing modern manual training record with no acquisition time cannot qualify an earlier PHB ASI',()=>{const c=baseCard(8);c.profile.enabledSources=['PHB','TCE','XPHB'];importedModern(c,modernArmors[0]);const row=choice(c,4);reject(c,()=>api.setSheetChoiceSlot(c,row.id,0,moderate.id,entries));assert.equal(status(c,row.id,moderate).active,false);});
for(const e of armors)for(const [label,edit] of [
 ['normalized source',(entry:any)=>{entry.source='XPHB';}],
 ['raw source',(entry:any)=>{entry.raw.source='XPHB';}],
 ['both sources and edition',(entry:any)=>{entry.source='XPHB';entry.raw.source='XPHB';entry.edition='2024';}],
 ['new source plus feature kind',(entry:any)=>{entry.source='XPHB';entry.raw.source='XPHB';entry.edition='2024';entry.kind='feature';}],
 ['new source plus race kind',(entry:any)=>{entry.source='XPHB';entry.raw.source='XPHB';entry.edition='2024';entry.kind='race';}],
 ['new source plus equipped item kind',(entry:any)=>{entry.source='XPHB';entry.raw.source='XPHB';entry.edition='2024';entry.kind='item';}],
 ['new page/category without new mechanics',(entry:any)=>{entry.source='XPHB';entry.raw.source='XPHB';entry.edition='2024';entry.page=entry.raw.page=entry.english==='Heavily Armored'?204:205;entry.raw.category='G';}],
] as const)check('cross-edition-forgery',`PHB ${e.english} relabeled ${label} cannot acquire the XPHB compatibility exemption`,()=>{const c=modernCard(modernArmors[0]),entry=structuredClone(e),manual=preserve(c);edit(entry);assert.equal(api.retainedModernArmorRule(entry),undefined);importedModern(c,entry);const before=JSON.stringify(c);assert.deepEqual(training(c),[]);assert.equal(evaluate(c).abilities.str,13);assert.equal(evaluate(c).abilities.dex,13);assert.equal(JSON.stringify(c),before);assert.deepEqual(preserve(c),manual);});
for(const e of modernArmors)for(const [label,edit] of [
 ['different kind',(entry:any)=>{entry.kind='race';}],
 ['different edition',(entry:any)=>{entry.edition='2014';}],
 ['normalized source',(entry:any)=>{entry.source='PHB';}],
 ['raw source',(entry:any)=>{entry.raw.source='PHB';}],
 ['raw page',(entry:any)=>{entry.raw.page=167;}],
 ['category',(entry:any)=>{entry.raw.category='O';}],
 ['missing level prerequisite',(entry:any)=>{delete entry.raw.prerequisite[0].level;}],
 ['unknown ability max',(entry:any)=>{entry.raw.ability[0].max=30;}],
 ['wrong ability list',(entry:any)=>{entry.raw.ability[0].choose.from=['str','dex','con'];}],
 ['extra training',(entry:any)=>{entry.raw.armorProficiencies=[{light:true,medium:true,heavy:true,shield:true}];}],
 ['unknown raw field',(entry:any)=>{entry.raw.unreviewed=true;}],
 ['generic effect',(entry:any)=>{entry.effects=[{op:'add',target:'str',value:10}];}],
 ['unknown choice',(entry:any)=>{entry.choices=[{id:'unreviewed',count:1,options:['str']}];}],
 ['copied source',(entry:any)=>{entry.raw._copy={name:entry.name,source:'XPHB'};}],
] as const)check('cross-edition-forgery',`XPHB ${e.english} ${label} cannot retain canonical training authorization`,()=>{const c=modernCard(modernArmors[0]),entry=structuredClone(e);edit(entry);assert.equal(api.retainedModernArmorRule(entry),undefined);importedModern(c,entry);const before=JSON.stringify(c);assert.deepEqual(training(c),[]);assert.equal(evaluate(c).abilities.str,13);assert.equal(evaluate(c).abilities.dex,13);assert.equal(JSON.stringify(c),before);});
check('cross-edition-forgery','An imported fake typed Moderate grant cannot borrow future raw training to open an unsupported modern acquisition',()=>{
 const c=modernCard(modernArmors[0],8),early=modernChoice(c),owner=c.selections.find((row:any)=>row.id==='modern-owner');
 api.setSheetChoiceSlot(c,early.id,0,modernArmors[0].id,entries);api.syncChoiceContent(c,entries);
 const grant=c.selections.find((row:any)=>row.entry.id===modernArmors[0].id&&row.grantKey?.startsWith('choice:'));assert(grant);
 grant.entry=structuredClone(modernArmors[1]);grant.grantKey=`choice:${early.id}:${modernArmors[1].id}`;c.answers[early.id]=[modernArmors[1].id];
 const ref=`Adversarial Later Training|${owner.entry.raw.name}|XPHB|6`;owner.entry.raw.classFeatures.push(ref);
 const entry=structuredClone(modernArmors[0]);entry.id='adversarial-modern-future';entry.kind='feature';entry.name=entry.english='Adversarial Later Training';entry.entries=[];entry.raw={name:entry.name,ENG_name:entry.english,source:'XPHB',_category:'classFeature',className:owner.entry.raw.name,classSource:'XPHB',level:6,armorProficiencies:[{light:true}]};
 c.selections.push({id:'adversarial-modern-future',entry,level:6,quantity:1,equipped:false,parentId:owner.id,grantKey:`ref:${ref}`});
 const before=JSON.stringify(c);assert(!training(c).includes('medium'),'Unsupported typed acquisition cannot regain training through a future prerequisite');
 const later=api.sheetChoices(c,entries).find((row:any)=>row.id.includes(':class-typed-feat:')&&row.grantLevel===8);assert(later);
 const featureId=later.id.split(':class-typed-feat:')[1],feature=c.selections.find((row:any)=>row.entry.id===featureId);assert(feature);
 const prior=api.effectiveTrainingDeclarations(c,c.selections,'armor',{level:8,choiceId:later.id,selectionId:feature.id});assert(!prior.some((value:string)=>api.equipmentTraining(value)?.[0]==='medium'));
 assert.equal(evaluate(c).abilities.dex,13);assert.equal(JSON.stringify(c),before);
});
for(const name of ['Tough','Resilient'])check('cross-edition-isolation',`${name}|XPHB remains separate from every PHB explicit adapter and gains no unintended new effect`,()=>{const e=find('feat',name,'XPHB'),c=modernCard(modernArmors[0]),before=evaluate(c),oldTraining=training(c);assert.equal(api.reviewedFeatRule(e),undefined);assert.equal(api.retainedModernArmorRule(e),undefined);importedModern(c,e);const after=evaluate(c);assert.deepEqual(after.abilities,before.abilities);assert.equal(after.maxHp,before.maxHp);assert.deepEqual(after.saves,before.saves);assert.deepEqual(training(c),oldTraining);reject(c,()=>api.setReviewedFeatIntent(c,modernChoice(c).id,e.id,name==='Tough'?{kind:'tough',confirmedManualHpExcluded:true}:{kind:'resilient',ability:'dex',confirmedManualAbilityExcluded:true}));});
assert.equal(hash(bodies),sourceBefore,'Workflow preserves frozen source objects');assert.equal(hash(entries),catalogBefore,'Workflow preserves normalized catalog');
for(const [path,before] of Object.entries(inputFiles))assert.equal(bytesHash(path),before,'Frozen file changed during proof');
assert.equal(git('rev-parse','HEAD'),consumerRevision,'Consumer revision changed during proof');assertCleanSource();assert.equal(git('rev-parse','HEAD:src'),consumerSourceTree,'Consumer source tree changed during proof');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),producerRevision,'Producer revision changed during proof');assertProducerClean();assert.equal(bytesHash(producerScript),producerScriptSha256,'Proof script changed during replay');
const modules=Object.keys(bundle.metafile!.inputs).map(path=>resolve(path)).filter(path=>path.startsWith(resolve(webRoot)+'/src/')).map(path=>({path:path.slice(resolve(webRoot).length+1),sha256:bytesHash(path)})).sort((a,b)=>a.path.localeCompare(b.path));
for(const row of modules)assert.equal(createHash('sha256').update(execFileSync('git',['cat-file','blob',`${consumerRevision}:${row.path}`],{cwd:webRoot,maxBuffer:16*1024*1024})).digest('hex'),row.sha256,'Bundled consumer bytes equal committed source');
const report={schemaVersion:1,updatedAt:new Date().toISOString(),consumerRevision,consumerSourceTree,consumerModules:modules,producerRevision,producerScriptSha256,retrievalRevisions,inputs,entryHashes,abilityCapSupport,legacyClassSlots:profiles,rules:reviewedRules,retainedModernTraining:retainedModernRules,steps,
 definition:'Bounded PHB2014 Lightly, Moderately and Heavily Armored original-source legal-class-choice API proof; not a full corpus replay, browser certification or publication claim',
 status:{source:'verified-against-frozen-data-and-rendering-contract',mechanisms:'partial',fullRuleAutomation:false,reviewedArmorFeats:3,retainedModernTrainingCompatibility:3,legacyClassSlots:profiles.length,browser:'not-run',fullRuntimeReplay:'not-run',oldConsumerCompatibility:'not-claimed',currentReleaseAvailable:null},
 boundaries:['Only three independently reviewed PHB2014 armor feats selected through68 PHB/TCE legacy class ASI alternative slots are eligible. Manual dragging cannot grant an owned ASI ability increment; XPHB, custom and unsupported source shapes do not authorize these adapters.',
 'Original entry hashes bind this source audit. Runtime authorization checks exact reviewed canonical mechanical/structural shape, not arbitrary imported prose cryptographically.',
 'The frozen ability objects omit a max field. Cap20 is corroborated by the pinned upstream renderer default, not a nonexistent raw field or an independently retrieved WotC feat page.',
 'Players explicitly confirm the selected ability increase is not already included in their authored score. Authored abilities, armor declarations including empty strings, equipment and current resources stay unchanged.',
 'Earlier active grants may qualify later armor prerequisites. Self, future, duplicate, inactive and unsupported grants cannot supply prerequisite training; lost prerequisites retain inactive intent.',
 'The204 paired grant paths establish original class-source ownership, not204 completed rules or any corpus-completion percentage.',
 'Training informs prerequisites, displayed declarations and equipment warnings. It does not grant extra2014 shield AC or automate casting restrictions, disadvantage, heavy-armor strength/speed or equip lifecycle.',
 'Exact XPHB4 training compatibility is separate: only Lightly had a supported typed ASI path; Moderately and Heavily retain existing lawful imported/manual training without opening their previously unsupported typed acquisition. No XPHB ability, HP or saving automation is claimed. Invalid level1 probes are not lawful source evidence.',
 'Native and linked imports exercise current consumer persistence only. Browser storage, older clients, server delivery, multiplayer recovery and deployment require separate evidence.']};
mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,consumerRevision,consumerSourceTree,producerRevision,passed:steps.length,failed:0,skipped:0}));
