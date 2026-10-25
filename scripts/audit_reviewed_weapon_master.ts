/** Bounded PHB2014 Weapon Master source-to-real-class-ASI API proof.
 * Original publisher prose, raw snapshots and private cards remain local. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,realpathSync,writeFileSync} from 'node:fs';
import {dirname,isAbsolute,join,resolve,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
const [webRoot,inputRoot,output='.cache/reviewed-weapon-master.json']=process.argv.slice(2);
if(!webRoot||!inputRoot)throw Error('Usage: audit_reviewed_weapon_master.ts WEB_ROOT FROZEN_INPUT_ROOT [OUTPUT]');
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
 "magicvariants.json": "4a4b0f3c8b268d8b134386f16e705df9b14d60419b2f2fa160da45b78bd4967d",
 "items.json": "883f7bb4df2eb35fb37e7caa3a8765e0209014caa360d1c0358daa6f4b2da488",
 "items-base.json": "8933a3e70e47aa4fd6196bd7f1f2e3a57d6d8dbe7e781d37bb6a0519d7c4ffff",
 "variantrules.json": "21eef107d25cf438eb85894387fb6f834478d80bc467791c54fe66db9e498c44"
};
const retrievalRevisions=Object.fromEntries(Object.keys(expectedInputs).map(path=>[path,['feats.json','items.json','magicvariants.json'].includes(path)?'5cc0bbe2c2b241a334e731af4448bdba2168e8bd':'e2623b204ddbdf2bcfa8317acfc962de89c676e2']));
const expectedEntries:Record<string,string>={
 'Weapon Master|PHB':'058b1e469d74445bb81c838588ef6452732d7ac1e4a3a1eefbc6d274d9d19008',
 'Feats|PHB':'75b2156dacae2a779a04406c4f12fe1feb5541631d463f22c3ccaab53dc50269',
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
const rule={kind:'weapon-master',reference:'Weapon Master|PHB',english:'Weapon Master',page:170,entryHash:expectedEntries['Weapon Master|PHB'],abilityBonus:1,cap:20,abilities:['str','dex'],weaponCount:4,weaponFilter:'type=军用武器;寻常武器|miscellaneous=平凡的'};
const fromFilter='type=军用武器;寻常武器|miscellaneous=平凡的';
const upstreamContracts={
 repository:'tjliqy/5etools-cn',revision:'e2623b204ddbdf2bcfa8317acfc962de89c676e2',
 cap:{path:'js/render.js',gitBlobSha:'fd559e0baad858c2bc59a813603a55e41972a1f4',lines:[7093,7123],semantics:'missing ability max defaults to20',publisherFeatProse:'not independently accessible in this audit'},
 mundane:{path:'js/render.js',gitBlobSha:'fd559e0baad858c2bc59a813603a55e41972a1f4',lines:[13745],semantics:'rarity none or unknown counts as mundane'},
 filter:{path:'js/filter-items.js',gitBlobSha:'1be153e23086198a26a441902a5b5eaa98f2a043',lines:[398,400],semantics:'mundane label is 寻常, not raw feat 平凡的'},
 categories:{path:'js/parser.js',gitBlobSha:'6ff93e4c461362abe7d7c11557eb9049f00d744d',lines:[2105,2112],semantics:'simple=简易, martial=军用; raw feat 寻常武器 is translation drift'},
 sourceDates:{path:'js/parser.js',gitBlobSha:'6ff93e4c461362abe7d7c11557eb9049f00d744d',dates:{OotA:'2015-09-15',ToA:'2017-09-19',ERLW:'2019-11-19',DSotDQ:'2022-11-22'},lines:[3953,3959,3993,4035]},
 license:{path:'LICENSE.md',gitBlobSha:'5fc90b54c6dc961c0e1fef50e567e8c081ec6f6c',declaredCode:'MIT',declaredLocalizedData:'CC-BY-NC-SA-4.0',publisherRights:'not independently established; no original prose or snapshots distributed'},
};
const evidence=JSON.parse(readFileSync(join(webRoot,'src/core/automation/reviewedFeatEvidence.json'),'utf8'));
assert.deepEqual(evidence.rules.filter((row:any)=>row.kind==='weapon-master'),[rule],'Consumer reviewed Weapon Master mechanics');
assert.equal(evidence.schemaVersion,1,'Consumer reviewed evidence version');assert.equal(evidence.source,'PHB','Consumer PHB source');assert.equal(evidence.edition,'2014','Consumer original edition');
assert.deepEqual(evidence.inputs,Object.fromEntries(['feats.json','variantrules.json'].map(path=>[path,expectedInputs[path]])),'Consumer reviewed canonical input hashes');
const weaponEvidence=JSON.parse(readFileSync(join(webRoot,'src/core/automation/reviewedWeaponEvidence.json'),'utf8'));
assert.equal(weaponEvidence.schemaVersion,1,'Consumer weapon evidence version');assert.equal(weaponEvidence.mechanism,'reviewed-phb2014-weapon-master-kind','Consumer weapon evidence mechanism');
assert.equal(weaponEvidence.inputHash,expectedInputs['items-base.json'],'Consumer weapon canonical input hash');assert.equal(weaponEvidence.inputRevision,retrievalRevisions['items-base.json'],'Consumer weapon retrieval revision');assert.equal(weaponEvidence.filter,fromFilter,'Consumer original weapon filter');
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
const exact=(rows:any[],english:string,source:string)=>{const matches=rows.filter(row=>row.ENG_name===english&&row.source.toUpperCase()===source.toUpperCase());assert.equal(matches.length,1,'Unique original '+english+'|'+source);return matches[0];};
const feats=bodies['feats.json'].feat,variants=bodies['variantrules.json'].variantrule,rawFeat=exact(feats,'Weapon Master','PHB'),entryHashes:Record<string,string>={};
for(const [key,rows] of [['Weapon Master|PHB',feats],['Feats|PHB',variants]] as const){const [name,source]=key.split('|');entryHashes[key]=hash(exact(rows,name,source));assert.equal(entryHashes[key],expectedEntries[key],'Independent original entry hash '+key);}
assert.equal(rawFeat.page,170);assert.deepEqual(rawFeat.ability,[{choose:{from:['str','dex'],amount:1}}]);assert.equal(rawFeat.ability[0].max,undefined,'Cap comes from renderer, not a fabricated raw field');
assert.deepEqual(rawFeat.weaponProficiencies,[{choose:{fromFilter,count:4}}]);assert.equal(rawFeat.repeatable,undefined);assert.equal(rawFeat.prerequisite,undefined);
assert(JSON.stringify(exact(variants,'Feats','PHB').entries).includes('每个专长只可被选用一次'),'Pinned PHB default nonrepeatability');
const rawCandidates=bodies['items-base.json'].baseitem.filter((r:any)=>['simple','martial'].includes(r.weaponCategory)&&['M','R'].includes(r.type)&&['none','unknown'].includes(r.rarity));
const candidateGroups=Object.fromEntries(['PHB','DMG','ERLW','DSotDQ','ToA','OotA'].map(source=>[source,rawCandidates.filter((r:any)=>r.source===source).length]));
assert.deepEqual(candidateGroups,{PHB:37,DMG:10,ERLW:1,DSotDQ:1,ToA:1,OotA:2});assert.equal(rawCandidates.length,52,'Reviewed semantic candidate domain, not a literal translated filter claim');
const candidates=rawCandidates.map((r:any)=>({reference:`${r.ENG_name}|${r.source.toUpperCase()}`,english:r.ENG_name,name:r.name,source:r.source.toUpperCase(),rawSource:r.source,page:r.page,rawEdition:r.edition??null,normalizedEdition:r.edition==='classic'?'2014':'both',rarity:r.rarity,type:r.type,weaponCategory:r.weaponCategory,entryHash:hash(r)}));
assert.equal(new Set(candidates.map((r:any)=>r.reference)).size,52,'Distinct canonical source-qualified kinds');
for(const r of rawCandidates){assert.equal(r.weapon,true);assert.equal(r.baseItem,undefined);assert.equal(r.bonusWeapon,undefined);if(['PHB','DMG'].includes(r.source))assert.equal(r.edition,'classic');else assert.equal(r.edition,undefined,'Supplement edition is not silently rewritten');}
const metadata=new Set(['name','ENG_name','source','page','edition','entries','additionalEntries','srd','basicRules','referenceSources','reprintedAs','hasFluff','hasFluffImages','translator','otherSources','_category']);
const expectedWeaponRules=rawCandidates.map((r:any)=>({reference:`${r.ENG_name}|${r.source.toUpperCase()}`,english:r.ENG_name,name:r.name,source:r.source.toUpperCase(),rawSource:r.source,edition:r.edition==='classic'?'2014':'both',entryId:['kiwee','item',r.source,r.ENG_name,'','','','','',''].map(v=>encodeURIComponent(v.toLowerCase())).join(':'),page:r.page,entryHash:hash(r),mechanics:Object.fromEntries(Object.entries(r).filter(([key])=>!metadata.has(key))),rawKeys:Object.keys(r)}));
assert.deepEqual(weaponEvidence.rules,expectedWeaponRules,'Every candidate identity, edition, original hash and mechanical shape matches frozen source');
const net=exact(rawCandidates,'Net','PHB');assert.equal(net.dmg1,undefined);assert.equal(net.weaponCategory,'martial');
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
assert.equal(profiles.length,68);assert.deepEqual(legacyEvidence.profiles,profiles,'Exact original owned class feature hashes and progression');
const producerScript='scripts/audit_reviewed_weapon_master.ts';
function assertProducerClean(){assert.equal(execFileSync('git',['status','--porcelain','--untracked-files=all','--',producerScript],{encoding:'utf8'}).trim(),'','Producer proof script must be committed and clean');}
assertProducerClean();const producerScriptSha256=bytesHash(producerScript);
assert.equal(createHash('sha256').update(execFileSync('git',['cat-file','blob',`${producerRevision}:${producerScript}`])).digest('hex'),producerScriptSha256,'Proof script bytes match producer revision');
const bundleRoot=resolve(`.cache/weapon-master-proof-${process.pid}`);mkdirSync(bundleRoot,{recursive:true});const adapter=join(bundleRoot,'consumer.mjs');
const exports:Record<string,string[]>={
 'src/data/expand.ts':['specificMagicItems'],'src/core/model.ts':['newCharacter'],'src/core/automation/state.ts':['newAutomationState'],'src/data/catalog.ts':['normalizeData'],
 'src/core/sheet.ts':['syncFeatures','removeSelection'],'src/core/automation/choices.ts':['sheetChoices','setSheetChoiceSlot','syncChoiceContent'],
 'src/core/automation/reviewedFeats.ts':['reviewedFeatRule','reviewedFeatStatus','setReviewedFeatIntent'],
 'src/core/automation/reviewedWeapons.ts':['reviewedWeaponOptions','reviewedWeaponReference','reviewedWeaponNeedsFirearmsConsent','reviewedWeaponTrainingMatches'],
 'src/core/automation/training.ts':['effectiveTrainingDeclarations'],'src/core/automation/weapons.ts':['automaticWeaponAttacks'],
 'src/core/automation/asi.ts':['setAsiAllocation'],'src/core/engine.ts':['evaluate'],
 'src/core/export.ts':['exportCharacter','exportLinkedOwlbear'],'src/core/validation.ts':['readCharacter','validateCharacter','importOwlbear'],
};
const bundle=await build({stdin:{contents:Object.entries(exports).map(([path,names])=>`export {${names.join(',')}} from ${JSON.stringify(resolve(webRoot,path))};`).join('\n'),resolveDir:resolve(webRoot),loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:adapter,metafile:true,define:{'import.meta.env.MODE':'"standalone"','import.meta.env.DEV':'false'}});
const api=await import(pathToFileURL(adapter).href);
const merged:any={feat:feats,baseitem:bodies['items-base.json'].baseitem,item:bodies['items.json'].item};for(const key of ['class','subclass','classFeature','subclassFeature'])merged[key]=Object.entries(bodies).filter(([path])=>path.startsWith('class/')).flatMap(([,body])=>body[key]||[]);
const entries=api.normalizeData(structuredClone(merged),'frozen-reviewed-weapon-master'),catalogBefore=hash(entries);assert.equal(hash(bodies),sourceBefore,'Normalizer preserves original source');
const find=(kind:string,name:string,source='PHB')=>{const rows=entries.filter((e:any)=>e.kind===kind&&e.english===name&&e.source===source.toUpperCase());assert.equal(rows.length,1,'Unique normalized '+name+'|'+source);return rows[0];};
const feat=find('feat','Weapon Master'),steps:{mechanism:string;label:string;passed:true}[]=[];
const preserve=(c:any)=>json({abilities:c.abilities,baseHp:c.baseHp,hpProgression:c.hpProgression,notes:c.notes,runtime:c.runtime,sheetBonuses:c.sheetBonuses,saveBonuses:c.saveBonuses,skillBonuses:c.skillBonuses,proficiencies:c.proficiencies,expertise:c.expertise,adjustments:c.adjustments,training:c.training,inventory:c.inventory});
function baseCard(level=4,name='Wizard',source='PHB'){
 const c=api.newCharacter('2014');c.automation=api.newAutomationState();c.profile.enabledSources=['PHB','DMG','TCE','ERLW','DSOTDQ','TOA','OOTA'];c.abilities.dex=12;c.abilities.str=12;
 c.notes='Authored weapon-feat preservation probe';c.sheetBonuses={ac:3};c.skillBonuses={athletics:1};c.proficiencies={athletics:true};c.expertise={athletics:true};c.runtime.hp=2;c.runtime.tempHp=1;c.runtime.resources={'manual-sentinel':{current:1,max:7},'Weapon Master':{current:77,max:99,unlimited:true}};
 c.selections=[{id:'proof-owner',entry:structuredClone(find('class',name,source)),level,quantity:1,equipped:false}];api.syncFeatures(c,entries);return c;
}
const choice=(c:any,level=4)=>{const owner=c.selections.find((s:any)=>s.id==='proof-owner'),feature=c.selections.find((s:any)=>s.parentId===owner.id&&s.entry.english==='Ability Score Improvement'&&s.entry.raw.level===level&&s.entry.source===owner.entry.source);assert(feature,'Generated real ASI feature '+level);const id=`${owner.id}:class-legacy-feat:${feature.entry.id}`,row=api.sheetChoices(c,entries).find((r:any)=>r.id===id);assert(row,'Generated real class choice '+level);return row;};
const select=(c:any,level=4)=>{const row=choice(c,level);assert(row.options.some((o:any)=>o.value===feat.id),'Real feat alternative is offered');api.setSheetChoiceSlot(c,row.id,0,feat.id,entries);assert.deepEqual(c.answers[row.id],[feat.id]);assert.equal(c.classChoiceSnapshots[feat.id].id,feat.id);return row.id;};
const defaultWeapons=['Longsword|PHB','Longbow|PHB','Spear|PHB','Net|PHB'];
const intent=(ability='str',weapons=defaultWeapons)=>({kind:'weapon-master',ability,weapons:[...weapons],confirmedManualAbilityExcluded:true});
const activate=(c:any,ability='str',weapons=defaultWeapons,level=4)=>{const id=select(c,level);api.setReviewedFeatIntent(c,id,feat.id,intent(ability,weapons));assert.equal(api.reviewedFeatStatus(c,id,feat.id).active,true,'Explicit reviewed feat activates');return id;};
function evaluate(c:any){const before=JSON.stringify(c),d=api.evaluate(c);assert.equal(JSON.stringify(c),before,'Evaluation is pure');return d;}
function training(c:any){const before=JSON.stringify(c),t=api.effectiveTrainingDeclarations(c,c.selections,'weapons');assert.equal(JSON.stringify(c),before,'Training projection is pure');return t;}
function status(c:any,id:string){const before=JSON.stringify(c),s=api.reviewedFeatStatus(c,id,feat.id);assert.equal(JSON.stringify(c),before,'Status is pure');return s;}
function reject(c:any,fn:()=>void){const before=JSON.stringify(c);assert.throws(fn);assert.equal(JSON.stringify(c),before,'Rejected mutation is atomic');}
function reopen(c:any,linked=false){const before=JSON.stringify(c),payload=json(linked?api.exportLinkedOwlbear(c,evaluate(c)):api.exportCharacter(c)),inputBefore=JSON.stringify(payload),loaded=linked?{character:api.importOwlbear(payload),repaired:[]}:api.readCharacter(payload);assert.deepEqual(loaded.repaired,[],'No roundtrip repair');assert.equal(JSON.stringify(c),before,'Export is pure');assert.equal(JSON.stringify(payload),inputBefore,'Import is pure');assert.deepEqual(loaded.character.reviewedFeats,c.reviewedFeats,'Prior reviewed intents persist');assert.deepEqual(loaded.character.reviewedWeaponMaster,c.reviewedWeaponMaster,'Explicit weapon intent persists');assert.deepEqual(preserve(loaded.character),preserve(c),'Manual data roundtrip unchanged');return loaded.character;}
function check(mechanism:string,label:string,fn:()=>void){try{fn();}catch(error){throw Error(label,{cause:error});}steps.push({mechanism,label,passed:true});}
function equip(c:any,name:string,source='PHB'){const row={id:`equipment-${name}-${source}`,entry:structuredClone(find('item',name,source)),level:1,quantity:1,equipped:true,attuned:true};c.selections.push(row);return row;}
function attacks(c:any){const before=JSON.stringify(c),result=api.automaticWeaponAttacks(c,evaluate(c));assert.equal(JSON.stringify(c),before,'Attacks are pure');return result;}
const options=(c:any,catalog=entries)=>api.reviewedWeaponOptions(c,catalog);
const available=(c:any,catalog=entries)=>options(c,catalog).filter((o:any)=>!o.unavailable).map((o:any)=>o.value).sort();
const ownsTraining=(c:any,reference:string)=>{const [name,source]=reference.split('|'),raw=exact(rawCandidates,name,source);return training(c).some((value:string)=>{const uid=value.replace(/^\{@item ([^{}]+)\}$/,'$1'),parts=uid.split('|');return [raw.name.toLowerCase(),raw.ENG_name.toLowerCase()].includes(parts[0].toLowerCase())&&(parts[1]||'PHB').toLowerCase()===source.toLowerCase();});};
check('candidate-domain','Enabled reviewed sources offer exactly52 canonical kinds including damage-less Net and five unchanged both-edition entries',()=>{
 const c=baseCard();assert.deepEqual(available(c),candidates.map((r:any)=>r.reference).sort());assert(available(c).includes('Net|PHB'));
 for(const r of candidates)assert.equal(find('item',r.english,r.source).edition,r.normalizedEdition);
 for(const modern of entries.filter((e:any)=>e.kind==='item'&&['XPHB','XDMG'].includes(e.source)))assert(!available(c).includes(`${modern.english}|${modern.source}`));
});
for(const source of ['DMG','ERLW','DSOTDQ','TOA','OOTA'])check('candidate-source',`${source} is independently gated; its candidates do not borrow PHB availability`,()=>{const c=baseCard();c.profile.enabledSources=c.profile.enabledSources.filter((s:string)=>s!==source);assert(!available(c).some((value:string)=>value.endsWith('|'+source)));});
for(const profile of profiles)check('source-slot',`Real ${profile.owner} level ${profile.level} ASI alternative explicitly applies and revokes Weapon Master`,()=>{
 const [name,source]=profile.owner.split('|'),c=baseCard(profile.level,name,source),before=evaluate(c),oldTraining=training(c),manual=preserve(c),id=select(c,profile.level);
 assert.equal(status(c,id).active,false);assert.deepEqual(evaluate(c).abilities,before.abilities);assert.deepEqual(training(c),oldTraining);
 api.setReviewedFeatIntent(c,id,feat.id,intent());assert.equal(status(c,id).active,true);assert.equal(evaluate(c).abilities.str,before.abilities.str+1);for(const value of defaultWeapons)assert(ownsTraining(c,value));assert.deepEqual(preserve(c),manual);
 api.setReviewedFeatIntent(c,id,feat.id,null);assert.equal(status(c,id).active,false);assert.deepEqual(evaluate(c).abilities,before.abilities);assert.deepEqual(training(c),oldTraining);assert.deepEqual(preserve(c),manual);api.validateCharacter(json(c));
});
for(const ability of ['str','dex'])check('consent',`Explicit ${ability} plus four distinct kinds is pure and never creates weapon items`,()=>{const c=baseCard(),manual=preserve(c),items=c.selections.filter((s:any)=>s.entry.kind==='item'),id=activate(c,ability);assert.equal(evaluate(c).abilities[ability],13);assert.equal(status(c,id).active,true);assert.deepEqual(c.selections.filter((s:any)=>s.entry.kind==='item'),items);assert.deepEqual(preserve(c),manual);});
for(const linked of [false,true])check('persistence',`${linked?'Linked':'Native'} save/reopen restores owned weapon intent without catalog`,()=>{let c=baseCard();const id=activate(c),manual=preserve(c),before=evaluate(c),oldTraining=training(c);c=reopen(c,linked);api.syncFeatures(c,[]);assert.equal(status(c,id).active,true);assert.deepEqual(evaluate(c).abilities,before.abilities);assert.deepEqual(training(c),oldTraining);assert.deepEqual(preserve(c),manual);});
for(const bad of [[],defaultWeapons.slice(0,3),[...defaultWeapons,'Dagger|PHB'],[defaultWeapons[0],defaultWeapons[0],...defaultWeapons.slice(2)],['Longsword|PHB','长剑|PHB','Spear|PHB','Net|PHB'],['longsword|phb',...defaultWeapons.slice(1)],['Longsword|XPHB',...defaultWeapons.slice(1)],['Longsword',...defaultWeapons.slice(1)],['Moonblade|DMG',...defaultWeapons.slice(1)],['Custom Weapon|PHB',...defaultWeapons.slice(1)]])check('quota',`Reject invalid four-kind choice ${JSON.stringify(bad)}`,()=>{const c=baseCard(),id=select(c);reject(c,()=>api.setReviewedFeatIntent(c,id,feat.id,intent('str',bad)));assert.equal(status(c,id).active,false);assert.equal(evaluate(c).abilities.str,12);});
for(const invalid of [undefined,false])check('consent',`Reject absent/false authored-score exclusion ${String(invalid)}`,()=>{const c=baseCard(),id=select(c);reject(c,()=>api.setReviewedFeatIntent(c,id,feat.id,{...intent(),confirmedManualAbilityExcluded:invalid}));});
for(const invalid of ['con','int','wis','cha','luck','',null,13])check('ability',`Reject unsupported ability ${String(invalid)}`,()=>{const c=baseCard(),id=select(c);reject(c,()=>api.setReviewedFeatIntent(c,id,feat.id,{...intent(),ability:invalid}));});
for(const base of [19,20,22])check('cap',`Base ${base} respects cap20 without lowering authored score`,()=>{const c=baseCard();c.abilities.str=base;const id=select(c),manual=preserve(c),before=training(c);if(base===19){api.setReviewedFeatIntent(c,id,feat.id,intent());assert.equal(evaluate(c).abilities.str,20);}else{reject(c,()=>api.setReviewedFeatIntent(c,id,feat.id,intent()));assert.equal(evaluate(c).abilities.str,base);assert.deepEqual(training(c),before);}assert.deepEqual(preserve(c),manual);});
check('cap','Raising authored score to20 suspends both effects and lowering to19 restores once',()=>{let c=baseCard(),id=activate(c);c.abilities.str=20;assert.equal(status(c,id).active,false);assert(!ownsTraining(c,'Longsword|PHB'));c=reopen(c);c.abilities.str=19;assert.equal(status(c,id).active,true);assert.equal(evaluate(c).abilities.str,20);assert(ownsTraining(c,'Longsword|PHB'));});
check('repeatability','Second real ASI cannot acquire the same nonrepeatable feat',()=>{const c=baseCard(8);activate(c);reject(c,()=>api.setSheetChoiceSlot(c,choice(c,8).id,0,feat.id,entries));});
check('replacement','Replacing the four owned weapon kinds withdraws removed training without adding a second grant',()=>{let c=baseCard(),id=activate(c);api.setReviewedFeatIntent(c,id,feat.id,intent('str',['Rapier|PHB',...defaultWeapons.slice(1)]));assert(!ownsTraining(c,'Longsword|PHB'));assert(ownsTraining(c,'Rapier|PHB'));assert.equal(c.reviewedWeaponMaster.bindings.length,1);assert.equal(evaluate(c).abilities.str,13);c=reopen(c);assert(!ownsTraining(c,'Longsword|PHB'));assert(ownsTraining(c,'Rapier|PHB'));});
for(const extra of [{bonus:99},{grantProficiency:true},{weapons:{first:'Longsword|PHB'}},{confirmedDmFirearmsAllowed:'yes'}])check('intent-shape',`Unknown or malformed intent fields reject atomically ${JSON.stringify(extra)}`,()=>{const c=baseCard(),id=select(c);reject(c,()=>api.setReviewedFeatIntent(c,id,feat.id,{...intent(),...extra}));assert.equal(status(c,id).active,false);});
check('replacement','Replacing Weapon Master with Tough and back withdraws old training and consent',()=>{const c=baseCard(),manual=preserve(c),id=activate(c),tough=find('feat','Tough');api.setSheetChoiceSlot(c,id,0,tough.id,entries);assert(!ownsTraining(c,'Longsword|PHB'));assert.equal(evaluate(c).abilities.str,12);api.setReviewedFeatIntent(c,id,tough.id,{kind:'tough',confirmedManualHpExcluded:true});const hp=evaluate(c).maxHp;api.setSheetChoiceSlot(c,id,0,feat.id,entries);assert.equal(status(c,id).active,false);assert.equal(evaluate(c).maxHp,hp-8);api.setReviewedFeatIntent(c,id,feat.id,intent());assert.equal(evaluate(c).abilities.str,13);assert.deepEqual(preserve(c),manual);});
check('withdrawal','Clearing answer and reselecting never silently restores withdrawn consent',()=>{let c=baseCard(),id=activate(c);api.setSheetChoiceSlot(c,id,0,undefined,entries);assert.equal(status(c,id).active,false);c=reopen(c);api.setSheetChoiceSlot(c,id,0,feat.id,entries);assert.equal(status(c,id).active,false);assert(!ownsTraining(c,'Longsword|PHB'));api.setReviewedFeatIntent(c,id,feat.id,intent());assert.equal(evaluate(c).abilities.str,13);});
for(const [label,off,on] of [
 ['automation',(c:any)=>{c.automation.enabled=false;},(c:any)=>{c.automation.enabled=true;}],
 ['PHB source',(c:any)=>{c.profile.enabledSources=['TCE'];},(c:any)=>{c.profile.enabledSources=['PHB','TCE'];}],
 ['feat optional rule',(c:any)=>{c.profile.optional.feats=false;},(c:any)=>{c.profile.optional.feats=true;}],
] as const)check('availability',`Disabling ${label} preserves inactive intent across reopen and restores once`,()=>{let c=baseCard(),id=activate(c);off(c);assert.equal(status(c,id).active,false);assert(status(c,id).reason);c=reopen(c);on(c);assert.equal(status(c,id).active,true);assert.equal(evaluate(c).abilities.str,13);});
for(const reference of ['Double-Bladed Scimitar|ERLW','Hoopak|DSOTDQ','Yklwa|TOA','Hooked Shortspear|OOTA','Light Repeating Crossbow|OOTA'])check('supplement-source',`Reviewed ${reference} retains both edition and follows its exact source across reopen`,()=>{let c=baseCard(),weapons=[reference,...defaultWeapons.slice(1)],id=activate(c,'str',weapons),source=reference.split('|')[1];assert(ownsTraining(c,reference));c.profile.enabledSources=c.profile.enabledSources.filter((s:string)=>s!==source);assert.equal(status(c,id).active,false);assert(!ownsTraining(c,reference));c=reopen(c);c.profile.enabledSources.push(source);assert.equal(status(c,id).active,true);assert(ownsTraining(c,reference));});
check('availability','Downgrade and offline restoration preserve owned intent without stacking',()=>{let c=baseCard(),id=activate(c);c.selections.find((s:any)=>s.id==='proof-owner').level=3;api.syncFeatures(c,[]);assert.equal(status(c,id).active,false);c=reopen(c);c.selections.find((s:any)=>s.id==='proof-owner').level=4;api.syncFeatures(c,[]);assert.equal(status(c,id).active,true);assert.equal(evaluate(c).abilities.str,13);});
for(const declaration of ['', 'manual weapons','martial','Longsword|PHB'])check('manual-protection',`Explicit weapon override ${JSON.stringify(declaration)} remains authoritative`,()=>{let c=baseCard();c.training={weapons:declaration,armor:'manual armor',tools:'manual tools',languages:'manual languages'};const before=training(c),manual=preserve(c),id=activate(c);assert.equal(evaluate(c).abilities.str,13);assert.deepEqual(training(c),before);assert.deepEqual(preserve(c),manual);c=reopen(c);assert.equal(status(c,id).active,true);assert.deepEqual(training(c),before);assert.deepEqual(preserve(c),manual);});
check('manual-protection','Deleting versus clearing manual override is distinct',()=>{const c=baseCard();activate(c);c.training={weapons:''};assert.deepEqual(training(c),[]);delete c.training.weapons;assert(ownsTraining(c,'Longsword|PHB'));});
for(const [name,modes] of [['Longsword',['main','two-handed']],['Longbow',['main']],['Spear',['main','thrown','two-handed']]] as const)check('actual-attacks',`${name} all actual attack modes gain exactly one PB and no extra damage`,()=>{let c=baseCard();const item=equip(c,name),manual=preserve(c),raw=json(item),before=attacks(c).attacks;const id=activate(c),after=attacks(c).attacks;for(const mode of modes){const old=before.find((a:any)=>a.key===`auto-weapon:${item.id}:${mode}`),now=after.find((a:any)=>a.key===`auto-weapon:${item.id}:${mode}`);assert(old&&now,'Actual attack mode '+mode);assert.equal(now.attack_bonus,old.attack_bonus+evaluate(c).proficiency);assert.equal(now.damage,old.damage);}assert.deepEqual(c.selections.find((s:any)=>s.id===item.id),raw);assert.deepEqual(preserve(c),manual);c=reopen(c);assert.deepEqual(attacks(c).attacks.map((a:any)=>a.attack_bonus),after.map((a:any)=>a.attack_bonus));api.setReviewedFeatIntent(c,id,feat.id,null);assert.deepEqual(attacks(c).attacks.map((a:any)=>a.attack_bonus),before.map((a:any)=>a.attack_bonus));});
check('net','Damage-less Net gains training and removes missing-proficiency warning without inventing damage',()=>{const c=baseCard(),item=equip(c,'Net'),before=attacks(c);assert(before.issues.some((i:any)=>i.id===`weapon-training:${item.id}`));activate(c);assert(ownsTraining(c,'Net|PHB'));const after=attacks(c);assert(!after.issues.some((i:any)=>i.id===`weapon-training:${item.id}`));assert(!after.attacks.some((a:any)=>a.origin.selectionId===item.id),'Net special no-damage attack remains an explicit manual boundary');assert(after.issues.some((i:any)=>i.id===`weapon-thrown:${item.id}`));});
check('existing-training','Already-proficient fighter can choose all four kinds and never receives double PB',()=>{const c=baseCard(4,'Fighter'),item=equip(c,'Longsword'),before=attacks(c).attacks.filter((a:any)=>a.origin.selectionId===item.id);activate(c);assert.deepEqual(attacks(c).attacks.filter((a:any)=>a.origin.selectionId===item.id).map((a:any)=>({attack:a.attack_bonus,damage:a.damage})),before.map((a:any)=>({attack:a.attack_bonus,damage:a.damage})));});
check('base-item','Real Moonblade|DMG inherits exact localized Longsword|PHB training but is not a candidate',()=>{const c=baseCard(),item=equip(c,'Moonblade','DMG'),before=attacks(c).attacks.filter((a:any)=>a.origin.selectionId===item.id);assert(before.length);assert(!available(c).includes('Moonblade|DMG'));activate(c);const after=attacks(c).attacks.filter((a:any)=>a.origin.selectionId===item.id);assert.equal(after.length,before.length);for(let i=0;i<before.length;i++){assert.equal(after[i].attack_bonus,before[i].attack_bonus+evaluate(c).proficiency);assert.equal(after[i].damage,before[i].damage);}});
check('base-item','Wrong or missing explicit baseItem source cannot borrow PHB kind proficiency',()=>{for(const reference of ['长剑|xphb','长剑','长剑|']){const c=baseCard(),item=equip(c,'Moonblade','DMG');item.entry.raw.baseItem=reference;const before=attacks(c).attacks.map((a:any)=>a.attack_bonus);activate(c);assert.deepEqual(attacks(c).attacks.map((a:any)=>a.attack_bonus),before,'Base-item source must be explicit and match: '+reference);}});
const legacyMagicVariant=bodies['magicvariants.json'].magicvariant.find((row:any)=>row.ENG_name==='+1 Weapon'&&row.inherits?.source==='DMG'&&row.edition==='classic');
assert(legacyMagicVariant);assert.equal(hash(legacyMagicVariant),'6a3525587d78abd77aa023cbb31c372f48db99f44aa438e55326d8d5aa91aaf2');
const supplementBases=rawCandidates.filter((row:any)=>row.edition===undefined),generatedMagic=api.normalizeData({item:api.specificMagicItems({baseitem:supplementBases,magicvariant:[legacyMagicVariant]})},'frozen-legacy-magic-kind-proof');
assert.equal(generatedMagic.length,5,'All five supplement bases generate actual legacy +1 magic variants');
for(const base of supplementBases)check('base-item',`Real generated ${base.ENG_name} (+1 Weapon)|DMG inherits its both-edition ${base.source} kind`,()=>{
 const reference=`${base.ENG_name}|${base.source.toUpperCase()}`,magic=generatedMagic.find((row:any)=>row.english===`${base.ENG_name} (+1 Weapon)`);assert(magic);assert.equal(magic.edition,'2014');assert.equal(magic.source,'DMG');assert.equal(magic.raw.baseItem,`${base.name}|${base.source}`);
 const c=baseCard(),item={id:'actual-generated-magic',entry:structuredClone(magic),quantity:1,level:1,equipped:true};c.selections.push(item);const before=attacks(c).attacks.filter((a:any)=>a.origin.selectionId===item.id);assert(before.length);
 activate(c,'str',[reference,...defaultWeapons.slice(1)]);const after=attacks(c).attacks.filter((a:any)=>a.origin.selectionId===item.id);assert.equal(after.length,before.length);for(let i=0;i<before.length;i++){assert.equal(after[i].attack_bonus,before[i].attack_bonus+evaluate(c).proficiency);assert.equal(after[i].damage,before[i].damage);}assert(!available(c,[magic]).length,'Magic variants are never candidate kinds');
});
const unreviewedItemDomain=[{english:'Iron Ball',source:'IDRotF',entryHash:'9322e62fc78a20017c92f71767cd6dc41613c6e5ced61bc61533c8d71442d3c0',reason:'Game-specific item outside reviewed baseitem kinds; proficiency semantics not generalized'}, {english:'Oversized Longbow',source:'WDH',entryHash:'39455108356be700b1c40c91ede7eb4924a725a0c676907a0f41bdc42b8356d4',reason:'Unique item outside reviewed baseitem kinds with STR18 and size restrictions; not generalized'}, {english:'Psychic Blade',source:'XPHB',entryHash:'5e26e335bad615b2b261a1a7c13a58c45324f962f0fadd267c350ae2fa548284',reason:'2024 feature weapon, not a reviewed2014 base kind'}];
for(const item of unreviewedItemDomain)check('domain-boundary',`${item.english}|${item.source} matches raw category but does not silently become a reviewed kind`,()=>{const raw=exact(bodies['items.json'].item,item.english,item.source);assert.equal(hash(raw),item.entryHash);assert(['simple','martial'].includes(raw.weaponCategory));assert(['none','unknown'].includes(raw.rarity));const normalized=find('item',item.english,item.source);assert.equal(api.reviewedWeaponReference(normalized),undefined);assert(!available(baseCard(),[normalized]).length);});
for(const [label,edit] of [
 ['XDMG source over forged both edition',(entry:any)=>{entry.source=entry.raw.source='XDMG';entry.edition='both';delete entry.raw.edition;}],
 ['XPHB source over forged both edition',(entry:any)=>{entry.source=entry.raw.source='XPHB';entry.edition='both';delete entry.raw.edition;}],
 ['one raw edition over forged both edition',(entry:any)=>{entry.edition='both';entry.raw.edition='one';}],
 ['unknown raw edition over forged both edition',(entry:any)=>{entry.edition='both';entry.raw.edition='future';}],
 ['modern type namespace over forged legacy identity',(entry:any)=>{entry.raw.type='M|XPHB';}],
] as const)check('base-item-forgery',`${label} cannot borrow PHB base-item proficiency or actual attackPB`,()=>{const c=baseCard(),item=equip(c,'Moonblade','DMG');c.profile.enabledSources.push('XDMG','XPHB');edit(item.entry);const matches=api.reviewedWeaponTrainingMatches(item.entry,'Longsword|PHB');const before=attacks(c).attacks.filter((row:any)=>row.origin.selectionId===item.id).map((row:any)=>row.attack_bonus);activate(c);assert.deepEqual(attacks(c).attacks.filter((row:any)=>row.origin.selectionId===item.id).map((row:any)=>row.attack_bonus),before,'Forged magic identity must not gain proficiency bonus');assert.equal(matches,false);});
check('manual-attack','Handwritten attack formula remains untouched and never gets a derived duplicate',()=>{const c=baseCard(),item=equip(c,'Longsword');item.entry.raw.attackBonus='+7';item.entry.raw.damage='author formula';const saved=json(item);activate(c);assert(!attacks(c).attacks.some((a:any)=>a.origin.selectionId===item.id));assert.deepEqual(item,saved);});
function applyAsi(c:any,level:number,ability:string,amount:number){const row=choice(c,level),plan=row.options.find((o:any)=>o.entry?.raw._classAbilityRecord);assert(plan);api.setSheetChoiceSlot(c,row.id,0,plan.value,entries);api.setAsiAllocation(c,row.id,{[ability]:amount});return row.id;}
check('shared-cap','Earlier Weapon Master and later ASI share cap20',()=>{const c=baseCard(8);c.abilities.str=17;activate(c);applyAsi(c,8,'str',2);assert.equal(evaluate(c).abilities.str,20);assert.equal(c.abilities.str,17);});
check('shared-cap','Earlier capped ASI rejects later Weapon Master without mutation',()=>{const c=baseCard(8);c.abilities.str=18;applyAsi(c,4,'str',2);const id=select(c,8);reject(c,()=>api.setReviewedFeatIntent(c,id,feat.id,intent()));assert.equal(evaluate(c).abilities.str,20);assert(!ownsTraining(c,'Longsword|PHB'));});
check('shared-cap','Confirming earlier Weapon Master cannot disable already active later ASI',()=>{const c=baseCard(8);c.abilities.str=18;applyAsi(c,8,'str',2);const id=select(c,4);reject(c,()=>api.setReviewedFeatIntent(c,id,feat.id,intent()));assert.equal(evaluate(c).abilities.str,20);});
for(const [label,edit] of [
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
 ['arbitrary injected field',(entry:any)=>{entry.raw.unreviewedBonus=99;}],
 ['generic effect injection',(entry:any)=>{entry.effects=[{op:'add',target:'hp',value:99}];}],
 ['generic choice injection',(entry:any)=>{entry.choices=[{id:'unsafe',label:'Unsafe',count:1,options:['dex'],abilityBonus:99}];}],
 ['changed ability amount',(entry:any)=>{entry.raw.ability=[{str:3}];}],
 ['extra ability cap',(entry:any)=>{entry.raw.ability[0].max=30;}],
 ['changed weapon quota',(entry:any)=>{entry.raw.weaponProficiencies[0].choose.count=5;}],
 ['changed weapon filter',(entry:any)=>{entry.raw.weaponProficiencies[0].choose.fromFilter='all';}],
 ['repeatable injected',(entry:any)=>{entry.raw.repeatable=true;}],
] as const)check('feat-identity',`${label} cannot acquire reviewed authorization`,()=>{const c=baseCard(),id=activate(c),saved=json(c.reviewedWeaponMaster);edit(c.classChoiceSnapshots[feat.id]);assert.equal(api.reviewedFeatRule(c.classChoiceSnapshots[feat.id]),undefined);assert.equal(status(c,id).active,false);reject(c,()=>api.setReviewedFeatIntent(c,id,feat.id,intent()));assert.deepEqual(c.reviewedWeaponMaster,saved);assert.equal(evaluate(c).abilities.str,12);assert(!ownsTraining(c,'Longsword|PHB'));});
for(const [label,edit] of [
 ['source',(e:any)=>{e.source='CUSTOM';}],['raw source',(e:any)=>{e.raw.source='CUSTOM';}],['edition',(e:any)=>{e.edition='2024';}],['raw edition',(e:any)=>{e.raw.edition='one';}],
 ['custom pack',(e:any)=>{e.packId='homebrew';}],['custom identity',(e:any)=>{e.id='fake';}],['wrong kind',(e:any)=>{e.kind='feat';}],['not base item',(e:any)=>{e.raw._category='item';}],['magic rarity',(e:any)=>{e.raw.rarity='rare';}],['magic base',(e:any)=>{e.raw.baseItem='Longsword|PHB';}],['unknown mechanical field',(e:any)=>{e.raw.effect=99;}],['effect injection',(e:any)=>{e.effects=[{op:'add',target:'hp',value:99}];}],['choice injection',(e:any)=>{e.choices=[{id:'unsafe',count:1,options:['dex']}];}],['dependency injection',(e:any)=>{e.dependencies=['unsafe'];}],['copy directive',(e:any)=>{e.raw._copy={name:'Longsword',source:'PHB'};}],['removed firearm flag',(e:any)=>{delete e.raw.firearm;}],
] as const)check('weapon-identity',`${label} cannot forge a canonical candidate`,()=>{const e=structuredClone(find('item',label==='removed firearm flag'?'Pistol':'Longsword',label==='removed firearm flag'?'DMG':'PHB'));edit(e);assert.equal(api.reviewedWeaponReference(e),undefined);assert(!available(baseCard(),[e]).includes(label==='removed firearm flag'?'Pistol|DMG':'Longsword|PHB'));});
check('weapon-identity','Conflicting duplicate alias cannot win by catalog order',()=>{const good=find('item','Longsword'),bad=structuredClone(good);bad.raw.rarity='rare';for(const rows of [[good,bad],[bad,good]])assert(!available(baseCard(),rows).includes('Longsword|PHB'));assert.deepEqual(available(baseCard(),[good,structuredClone(good)]),['Longsword|PHB']);});
for(const [label,edit] of [
 ['missing owner',(c:any)=>{c.selections=c.selections.filter((s:any)=>s.id!=='proof-owner');}],
 ['missing ASI feature',(c:any,id:string)=>{const binding=c.reviewedWeaponMaster.bindings.find((b:any)=>b.choiceId===id);c.selections=c.selections.filter((s:any)=>s.id!==binding.selectionId);}],
 ['cyclic ancestry',(c:any,id:string)=>{const binding=c.reviewedWeaponMaster.bindings.find((b:any)=>b.choiceId===id);c.selections.find((s:any)=>s.id==='proof-owner').parentId=binding.selectionId;}],
 ['changed raw owner identity',(c:any)=>{c.selections.find((s:any)=>s.id==='proof-owner').entry.raw.ENG_name='Other';}],
] as const)check('ownership',`${label} suspends saved effect visibly`,()=>{const c=baseCard(),id=activate(c),saved=json(c.reviewedWeaponMaster);edit(c,id);assert.equal(status(c,id).active,false);assert(status(c,id).reason);assert.deepEqual(c.reviewedWeaponMaster,saved);assert.equal(evaluate(c).abilities.str,12);});
check('manual-feat','Manually dragged same PHB feat does not authorize or double an owned grant',()=>{const c=baseCard(),id=activate(c);c.selections.push({id:'manual-feat',entry:structuredClone(feat),level:1,quantity:1,equipped:false});assert.equal(status(c,id).active,false);assert.equal(evaluate(c).abilities.str,12);assert(!ownsTraining(c,'Longsword|PHB'));});
check('adversarial-import','Imported duplicate weapon consent remains ambiguous and inactive',()=>{const c=baseCard(),id=activate(c);c.reviewedWeaponMaster.bindings.push(structuredClone(c.reviewedWeaponMaster.bindings[0]));const before=JSON.stringify(c);assert.equal(status(c,id).active,false);assert.equal(evaluate(c).abilities.str,12);assert(!ownsTraining(c,'Longsword|PHB'));assert.equal(JSON.stringify(c),before);});
check('adversarial-import','Unknown future weapon state stays preserved and inactive without disabling old feats',()=>{let c=baseCard(8);const id=activate(c),tough=find('feat','Tough'),later=choice(c,8);api.setSheetChoiceSlot(c,later.id,0,tough.id,entries);api.setReviewedFeatIntent(c,later.id,tough.id,{kind:'tough',confirmedManualHpExcluded:true});const hp=evaluate(c).maxHp,legacy=json(c.reviewedFeats);c.reviewedWeaponMaster={version:99,opaque:{authored:'future weapon intent'}};const saved=json(c.reviewedWeaponMaster);assert.equal(status(c,id).active,false);reject(c,()=>api.setReviewedFeatIntent(c,id,feat.id,intent()));c=reopen(c);assert.deepEqual(c.reviewedWeaponMaster,saved);assert.deepEqual(c.reviewedFeats,legacy);assert.equal(evaluate(c).maxHp,hp);assert.equal(evaluate(c).abilities.str,12);});
for(const [name,oldIntent,manualArmor] of [
 ['Tough',{kind:'tough',confirmedManualHpExcluded:true},undefined],
 ['Resilient',{kind:'resilient',ability:'con',confirmedManualAbilityExcluded:true},undefined],
 ['Lightly Armored',{kind:'lightly-armored',ability:'dex',confirmedManualAbilityExcluded:true},undefined],
 ['Moderately Armored',{kind:'moderately-armored',ability:'dex',confirmedManualAbilityExcluded:true},'light'],
 ['Heavily Armored',{kind:'heavily-armored',ability:'str',confirmedManualAbilityExcluded:true},'medium'],
] as const)check('legacy-isolation',`Existing ${name} retains v1 state and effects alongside independent Weapon Master`,()=>{let c=baseCard(8);if(manualArmor)c.training={armor:manualArmor};const old=find('feat',name),row=choice(c);api.setSheetChoiceSlot(c,row.id,0,old.id,entries);api.setReviewedFeatIntent(c,row.id,old.id,oldIntent);assert.equal(c.reviewedFeats.version,1);const saved=json(c.reviewedFeats),before=evaluate(c),wmAbility=name==='Heavily Armored'?'dex':'str',id=activate(c,wmAbility,defaultWeapons,8);assert.deepEqual(c.reviewedFeats,saved);assert.equal(evaluate(c).maxHp,before.maxHp);assert.deepEqual(evaluate(c).saves,before.saves);assert.equal(evaluate(c).abilities[wmAbility],before.abilities[wmAbility]+1);assert(api.reviewedFeatStatus(c,row.id,old.id).active);c=reopen(c);assert.deepEqual(c.reviewedFeats,saved);assert(api.reviewedFeatStatus(c,row.id,old.id).active);api.setReviewedFeatIntent(c,id,feat.id,null);assert.deepEqual(evaluate(c).abilities,before.abilities);assert.equal(evaluate(c).maxHp,before.maxHp);assert.deepEqual(c.reviewedFeats,saved);});
const firearms=rawCandidates.filter((r:any)=>r.firearm===true).map((r:any)=>`${r.ENG_name}|${r.source.toUpperCase()}`);
assert.equal(firearms.length,10);assert.deepEqual(firearms,candidates.filter((r:any)=>r.source==='DMG').map((r:any)=>r.reference),'Firearms are exactly ten reviewed identities, not a source-wide assumption');
const firearmsRule=exact(variants,'Firearms','DMG');assert.equal(hash(firearmsRule),'ed8af9c501803acb562fbee219af160f47862b68f4f4bcc7009d1e69add593d0');assert.equal(firearmsRule.page,267);assert.equal(firearmsRule.ruleType,'O');assert(firearmsRule.entries.some((row:any)=>row.ENG_name==='Proficiency'));
for(const reference of firearms)check('dm-firearms-consent',`${reference} needs explicit DM permission beyond an enabled DMG source`,()=>{let c=baseCard(),id=select(c),weapons=[reference,...defaultWeapons.slice(1)];assert(available(c).includes(reference));assert(api.reviewedWeaponNeedsFirearmsConsent(weapons));reject(c,()=>api.setReviewedFeatIntent(c,id,feat.id,intent('str',weapons)));api.setReviewedFeatIntent(c,id,feat.id,{...intent('str',weapons),confirmedDmFirearmsAllowed:true});assert.equal(status(c,id).active,true);assert(ownsTraining(c,reference));c=reopen(c);assert.equal(status(c,id).active,true);const saved=[...c.reviewedWeaponMaster.bindings[0].intent.weapons];delete c.reviewedWeaponMaster.bindings[0].intent.confirmedDmFirearmsAllowed;assert.equal(status(c,id).active,false);assert(!ownsTraining(c,reference));assert.equal(evaluate(c).abilities.str,12);assert.deepEqual(c.reviewedWeaponMaster.bindings[0].intent.weapons,saved);});
check('dm-firearms-consent','DM consent cannot override disabled individual firearm source',()=>{const c=baseCard(),id=select(c),weapons=['Pistol|DMG',...defaultWeapons.slice(1)];c.profile.enabledSources=['PHB'];reject(c,()=>api.setReviewedFeatIntent(c,id,feat.id,{...intent('str',weapons),confirmedDmFirearmsAllowed:true}));});
check('modern-isolation','Same-name Weapon Master|XPHB remains separate, without gaining four-kind proficiency',()=>{const modern=find('feat','Weapon Master','XPHB');assert.equal(modern.page,209);assert.deepEqual(modern.raw.ability,[{choose:{from:['str','dex']}}]);assert.equal(modern.raw.weaponProficiencies,undefined);assert.equal(api.reviewedFeatRule(modern),undefined);});
assert.equal(hash(bodies),sourceBefore,'Workflow preserves frozen source objects');assert.equal(hash(entries),catalogBefore,'Workflow preserves normalized catalog');
for(const [path,before] of Object.entries(inputFiles))assert.equal(bytesHash(path),before,'Frozen file changed during proof');
assert.equal(git('rev-parse','HEAD'),consumerRevision,'Consumer revision changed during proof');assertCleanSource();assert.equal(git('rev-parse','HEAD:src'),consumerSourceTree,'Consumer source tree changed during proof');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),producerRevision,'Producer revision changed during proof');assertProducerClean();assert.equal(bytesHash(producerScript),producerScriptSha256,'Proof script changed during replay');
const modules=Object.keys(bundle.metafile!.inputs).map(path=>resolve(path)).filter(path=>path.startsWith(resolve(webRoot)+'/src/')).map(path=>({path:path.slice(resolve(webRoot).length+1),sha256:bytesHash(path)})).sort((a,b)=>a.path.localeCompare(b.path));
for(const row of modules)assert.equal(createHash('sha256').update(execFileSync('git',['cat-file','blob',`${consumerRevision}:${row.path}`],{cwd:webRoot,maxBuffer:16*1024*1024})).digest('hex'),row.sha256,'Bundled consumer bytes equal committed source');
const report={schemaVersion:1,updatedAt:new Date().toISOString(),consumerRevision,consumerSourceTree,consumerModules:modules,producerRevision,producerScriptSha256,retrievalRevisions,inputs,entryHashes,upstreamContracts,legacyClassSlots:profiles,rules:[rule],candidateGroups,candidates,firearms,unreviewedItemDomain,steps,
 definition:'Bounded PHB2014 Weapon Master original-source semantic-domain and legal-class-choice API proof; not a literal translated filter execution, full corpus replay, browser certification or publication claim',
 status:{source:'verified-against-frozen-data-and-rendering-contract',mechanisms:'partial',fullRuleAutomation:false,reviewedFeats:1,legacyClassSlots:profiles.length,canonicalWeaponKinds:candidates.length,browser:'not-run',fullRuntimeReplay:'not-run',oldConsumerCompatibility:'not-claimed',currentReleaseAvailable:null},
 boundaries:['Only one independently reviewed PHB2014 feat selected through68 authentic original PHB/TCE class ASI slots. No manual feat-drag ability grant, arbitrary both-edition item, reprinted2024 alias or generic fromFilter execution.',
 'The translated filter labels have drifted. The domain is independently reviewed category and mundane semantics with52 exact identities; OotA unknown-rarity kinds are mundane under the upstream predicate. Five supplement kinds remain normalized both, not relabeled2014.',
 'Ten exact firearm identities additionally require an explicit player record of DM permission. This UI confirmation is a conservative product boundary, not a claim the rule text requires a checkbox; enablingDMG alone is not permission.',
 'Ability cap20 comes from the upstream renderer default, not a raw max field or independently retrieved WotC page. Four distinct kinds are required; existing proficiency is legal and cannot doublePB.',
 'Original hashes bind this audit; runtime eligibility checks reviewed canonical identity and mechanical/structural shape, not cryptographic authentication of arbitrary imported publisher prose.',
 'Effects are derived and source-owned. Authored scores, declarations including empty strings, inventory, hand-written attack formulas and current resources remain untouched.',
 'Damage-less Net can grant proficiency but its special no-damage attack still requires manual handling. No ammunition, reload, burst-fire, disadvantage or special-property automation is claimed.',
 'The52 reviewed baseitem kinds are not the entire raw filter domain: Iron Ball and Oversized Longbow item semantics remain unsupported; Psychic Blade is a separate2024 feature item.',
 'Magic weapons are not candidates; exact source-qualified baseItem inheritance feeds actual attack proficiency without creating inventory.',
 'Independent Weapon Master state preserves existing reviewedFeats v1; old consumers do not understand the new effect or its clear/reselect lifecycle. Retaining an opaque field is not safe roundtrip/rollback compatibility, which is not claimed.',
 'Native/linked imports establish current consumer persistence only. Browser storage, earlier clients, server delivery and deployment require separate evidence.']};
mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,consumerRevision,consumerSourceTree,producerRevision,passed:steps.length,failed:0,skipped:0}));
