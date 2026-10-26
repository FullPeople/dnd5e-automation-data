/** Bounded preparation guards only. These do not execute or replace the committed-source proof. */
import {it,expect} from 'vitest';
import {execFileSync,spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const script=resolve('scripts/audit_reviewed_alert.ts');
const evidence={schemaVersion:1,mechanism:'reviewed-phb2014-alert',rule:'alert',source:'PHB',edition:'2014',initiativeBonus:5,inputs:{'feats.json':'0491b421f5f1db6628c3a8aeb86bbc3b72b56bf101a14ba96acbe19c829a56a6','variantrules.json':'21eef107d25cf438eb85894387fb6f834478d80bc467791c54fe66db9e498c44'}};
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'alert-binding-')),web=join(root,'web'),input=join(root,'inputs'),output=join(root,'report.json');mkdirSync(join(web,'src/core/automation'),{recursive:true});mkdirSync(input);
 const evidencePath=join(web,'src/core/automation/reviewedAlertEvidence.json');writeFileSync(evidencePath,JSON.stringify(evidence));writeFileSync(join(web,'src/tracked.ts'),'export const value=1;\n');writeFileSync(join(web,'.gitignore'),'src/ignored.ts\n');
 const git=(...args:string[])=>execFileSync('git',args,{cwd:web,stdio:'pipe'});git('init','-q');git('add','.');git('-c','user.name=Audit fixture','-c','user.email=fixture@example.invalid','commit','-qm','Fixture');
 const row={url:'https://5e.kiwee.top/data/class/class-artificer.json',path:'class-artificer.json',sha256:'c65cad57eebdfff6508a0cfb821ec670a41cc3f057512cadd19f3805cf1a01d7'};
 const index=(rows:unknown[])=>writeFileSync(join(input,'index.json'),JSON.stringify({rows}));index([row]);writeFileSync(join(input,row.path),'{}');
 const reject=(message:string)=>{const result=spawnSync(process.execPath,['--experimental-strip-types',script,web,input,output],{encoding:'utf8'});expect(result.status).not.toBe(0);expect(result.stderr+result.stdout).toContain(message);expect(existsSync(output)).toBe(false);};
 const alter=(fn:(value:any)=>void)=>{const value=JSON.parse(readFileSync(evidencePath,'utf8'));fn(value);writeFileSync(evidencePath,JSON.stringify(value));git('add','.');git('-c','user.name=Audit fixture','-c','user.email=fixture@example.invalid','commit','-qm','Changed binding');};
 return {root,web,input,output,row,index,git,reject,alter,close:()=>rmSync(root,{recursive:true,force:true})};
}
for(const state of ['unstaged','staged','untracked','ignored'])it(`rejects ${state} consumer source before building`,()=>{const f=fixture();try{if(state==='untracked'||state==='ignored')writeFileSync(join(f.web,`src/${state}.ts`),'export const unexpected=true;');else{writeFileSync(join(f.web,'src/tracked.ts'),'export const value=2;');if(state==='staged')f.git('add','src/tracked.ts');}f.reject('Consumer src must be clean');}finally{f.close();}});
for(const [label,alter,reason] of [
 ['schema',(e:any)=>{e.schemaVersion=2;},'Consumer Alert evidence version'],['mechanism',(e:any)=>{e.mechanism='generic-initiative';},'Consumer bounded mechanism'],['rule',(e:any)=>{e.rule='observant';},'Consumer bounded rule'],['source',(e:any)=>{e.source='XPHB';},'Consumer PHB source'],['edition',(e:any)=>{e.edition='2024';},'Consumer original edition'],['initiative bonus',(e:any)=>{e.initiativeBonus=6;},'Consumer fixed initiative bonus'],
] as const)it(`rejects changed ${label}`,()=>{const f=fixture();try{f.alter(alter);f.reject(reason);}finally{f.close();}});
for(const path of Object.keys(evidence.inputs))it(`binds canonical ${path} input hash`,()=>{const f=fixture();try{f.alter(e=>{e.inputs[path]='0'.repeat(64);});f.reject('Consumer canonical input hashes');}finally{f.close();}});
for(const count of [0,2])it(`refuses ${count} matching frozen URLs`,()=>{const f=fixture();try{f.index(Array.from({length:count},()=>f.row));f.reject('Expected exactly one frozen input');}finally{f.close();}});
for(const url of ['https://untrusted.invalid/data/class/class-artificer.json','https://5e.kiwee.top/data/class/class-artificer.json?lookalike=1','http://5e.kiwee.top/data/class/class-artificer.json'])it(`refuses lookalike frozen URL ${url}`,()=>{const f=fixture();try{f.index([{...f.row,url}]);f.reject('Expected exactly one frozen input');}finally{f.close();}});
for(const path of ['../outside.json','/tmp/outside.json'])it(`refuses frozen path escape ${path}`,()=>{const f=fixture();try{f.index([{...f.row,path}]);f.reject('Input must remain inside frozen directory');}finally{f.close();}});
it('refuses external frozen-file symlinks',()=>{const f=fixture();try{writeFileSync(join(f.root,'outside.json'),'{}');rmSync(join(f.input,f.row.path));symlinkSync(join(f.root,'outside.json'),join(f.input,f.row.path));f.reject('Resolved input must remain inside frozen directory');}finally{f.close();}});
it('checks source content instead of trusting manifest hash',()=>{const f=fixture();try{f.reject('Frozen input mismatch class/class-artificer.json');}finally{f.close();}});
it('requires frozen manifest before any proof output',()=>{const f=fixture();try{rmSync(join(f.input,'index.json'));f.reject('Frozen input manifest is required');}finally{f.close();}});

// These are intentionally source-contract checks, not claims that the formal cases ran.
const source=()=>readFileSync(script,'utf8');
const checkBody=(mechanism:string)=>{const lines=source().split('\n').filter(line=>line.includes(`check('${mechanism}'`));expect(lines.length).toBeGreaterThan(0);return lines.join('\n');};
const contains=(code:string,commitments:string[])=>{for(const commitment of commitments)expect(code).toContain(commitment);};
it('authenticates all three exact PHB clauses and the independent modern entry/list hashes',()=>{
 const code=source();contains(code,['707e24458c9da6b00493f79f4317d844f5c27bc93b8e8415fafee885fef4a7db','2bfaa2b022b5868524b02878d7a27671b04a59e4ecc475cbad1bd83b171f10f2','bfd5af6f1ff20da6c01ddc6d706af7a6356737a631a640f2384031381d8228b7','ac77107ad9a59813f0d986e500aa4692a05d9ade118ca84732f4f49b4cd3f0fb','e3b8727427a2f27a1fa427246bc171aa6220d8a5eb49b6108884edc7ff519e5f','bytesSha(rawFeat.entries[1].items[clause.index]),clause.sha256','entriesSha256:hash(rawModern.entries)','assert.deepEqual(evidence.feat,featEvidence','assert.deepEqual(evidence.modern,modernEvidence']);
 expect(code).toMatch(/initiative:\{index:0,sha256:'[a-f0-9]{64}',bonus:5\}/);expect(code).toMatch(/surprise:\{index:1,sha256:'[a-f0-9]{64}',automated:false\}/);expect(code).toMatch(/unseenAttackers:\{index:2,sha256:'[a-f0-9]{64}',automated:false\}/);
});
it('has a feat/class domain with no borrowed passive book or renderer ability-cap default',()=>{
 const code=source(),inputs=JSON.parse(code.match(/const expectedInputs:Record<string,string>=(\{[\s\S]*?\});/)![1]);expect(Object.keys(inputs).filter(path=>!path.startsWith('class/')).sort()).toEqual(['feats.json','generated/gendata-tables.json','items-base.json','items.json','languages.json','magicvariants.json','skills.json','variantrules.json']);expect(Object.keys(inputs).filter(path=>path.startsWith('class/'))).toHaveLength(13);expect(Object.keys(inputs).some(path=>/book|render/.test(path))).toBe(false);expect(code).not.toContain('book-phb.json');expect(code).not.toContain('render.js');expect(code).not.toContain('abilityObj.max ?? 20');contains(code,['mechanics(rawFeat),{}','Alert owns no ability cap event']);
});
it('requires committed clean producer/current/old source bytes and isolated proof roots',()=>{
 contains(source(),["'--untracked-files=all','--ignored=matching','--','src'",'Producer proof script must be committed and clean','Proof script bytes match producer revision','Bundled consumer bytes equal committed source','Old compatibility module bytes equal pinned revision','alert-proof-${process.pid}-','Consumer source tree changed during proof','Proof script changed during source proof']);
});
it('pins exact immutable pre-Alert commit and source tree without replacement objects',()=>{
 const code=source();contains(code,["oldConsumerRevision='8e48bbbe801b21a57fbb9072b4d4c324379448ea'","oldConsumerSourceTree='ae3ae366ea3e70d096426410b5badc711164353e'","git('rev-parse',`${oldConsumerRevision}:src`),oldConsumerSourceTree","['--no-replace-objects','cat-file','blob',`${oldConsumerRevision}:${row.path}`]",'Old consumer src must be clean']);
});
it('separates exact full229 directory construction from targeted scope without invoking rule replay',()=>{
 const code=source();contains(code,["process.env.ALERT_FULL_CATALOG==='1'",'assert.equal(index.rows.length,229','fingerprint(index.rows),fingerprint(locked.inputs)','committedCorpusReportSha256:bytesSha(committedCoverageBytes)','inputBinding:directoryInputBinding','full-original229-input-directory-construction-only','targeted-complete-feat-class-skill-language-equipment-domain','fullCorpusRuleEvaluation:false',"fullRuntimeReplay:'not-run'"]);expect(code).not.toContain('runRuntimeProbePool');expect(code).not.toContain('openRuntimeProbeCheckpoint');
});
it('constructs actual App full/cold/cache catalogs instead of normalizing only the feat',()=>{
 contains(source(),['api.normalizeCatalogData(structuredClone(body)','api.homebrewBody(file.body)',"combined-existing-cache",'api.cardCatalogEntries([...api.EQUIPMENT_TRAINING_ENTRIES,...directoryEntries]','await api.loadCatalogSnapshot','Cache hit must not fetch','assert.equal(loads,1)','assert.equal(hash(a),hash(b)','api.setReviewedAlertIntent(c,id,feat.id,intent(),json(b))']);
});
it('reconstructs all68 localized source slots and tests canonical/instance aliases and custom packs',()=>{
 const code=source();contains(code,['assert.equal(profiles.length,68)','e.raw.className===owner.raw.name','featureEntryId:rows[0].id','assert.deepEqual(evidence.legacyClassSlots,expectedLegacyClassSlots',"for(const kind of ['owner','ASI','feat'])for(const identity of ['canonical','instance'])","for(const kind of ['owner','ASI','feat'])for(const alias of [false,true])"]);contains(checkBody('source-slot'),['api.setReviewedAlertIntent','status(c,id).initiativeBonus,5','preserve(c),manual']);contains(checkBody('pack-identity'),['custom-unreviewed','status(c,id).active,false']);
});
it('covers canonical-ID corruption, source mechanics mutations, mismatched snapshots and atomic rejection',()=>{
 contains(checkBody('catalog-domain'),['other.id=feat.id','reject(c,()=>api.setReviewedAlertIntent']);contains(checkBody('feat-identity'),['e.raw.entries[1].items[0]','e.raw.entries[1].items[1]','e.raw.entries[1].items[2]','api.reviewedAlertRule(bad),undefined','alter(c.classChoiceSnapshots[feat.id])']);contains(checkBody('snapshot-anchor'),["['foreign-snapshot-entry','',undefined]",'status(c,id).active,false']);contains(source(),["assert.equal(hash(c),before,'Rejected mutation is atomic')"]);
});
it('requires explicit initiative-only consent rather than caller-authored effects or silent manual5 removal',()=>{
 contains(checkBody('intent-shape'),['confirmedManualInitiativeExcluded:false',"{ability:'dex'}",'{effects:[]}',"{target:'initiative'}",'reject(c,()=>api.setReviewedAlertIntent']);contains(checkBody('manual-review'),['c.sheetBonuses={initiative:5}','status(c,id).active,false','assert.equal(preserve(c),manual)']);
});
it('uses finalPB Jack half-proficiency and signed sheet offsets without rewriting manual values',()=>{
 contains(checkBody('initiative-manual'),['[4,8,13,20]','[false,true]','[-3,0,2]','proficiency:1','2+(jack?Math.floor(d.proficiency/2):0)+5+offset','assert.equal(preserve(c),manual)']);
});
it('keeps absolute initiative total before independent sheet offset and Alert outside finalDEX ASI order',()=>{
 contains(checkBody('manual-absolute'),["target:'initiative',value:11","target:'initiative',value:17",'c.sheetBonuses={initiative:2}','evaluate(c).initiative,19']);contains(checkBody('mixed-ASI-order'),['[4,8]','api.setAsiAllocation(c,asi.id,{dex:2})','evaluate(c).abilities.dex,16','evaluate(c).initiative,8','status(c,id).active,true']);
});
it('retains duplicate/stale/future ownership and explicit-withdrawal source lifecycle boundaries',()=>{
 contains(checkBody('ownership'),['duplicate confirmation','alien source claim','status(c,id).active,false','reject(c,()=>api.setReviewedAlertIntent']);contains(checkBody('invalid-future-store'),['reviewed-alert-invalid','reviewed-alert-version','api.setReviewedAlertIntent(c,id,feat.id,null','hash(reopen(c).reviewedAlert)']);contains(checkBody('level-archive'),['classChoiceArchive[grant.id]','manual-child','hash(c.reviewedAlert),saved','preserve(c),manual']);contains(checkBody('parent-withdrawal'),['c.reviewedAlert.bindings.length,0','status(c,id).active,false']);
});
it('requires actual pinned-old retention but explicitly denies safe old editing compatibility',()=>{
 contains(checkBody('old-consumer'),['old.readCharacter','old.importOwlbear','old.evaluate(loaded).initiative,2','evaluate(back).initiative,7']);contains(checkBody('old-consumer-unsafe'),["['clear','replace','toggle']",'old.chooseSheetOption','loaded.abilities.dex=18',"target:'initiative',value:17",'old.syncFeatures','status(back,id).active,false','api.setReviewedAlertIntent(back,id,feat.id,null)']);contains(source(),['safeEditingCompatibility:false','clearReselectRetainsStaleConsent=true','manualEditsCannotAttestFreshReview=true','downgradeLosesOwnedSourceLifecycle=true']);
});
it('compares full genuine-modern output and choices by fingerprint while thin totals remain manual/unowned',()=>{
 contains(checkBody('old-modern-equality'),["id:'imported-modern-Alert'",'hash(evaluate(c)),hash(old.evaluate(c))','hash(api.sheetChoices(c,appCatalog)),hash(old.sheetChoices(c,appCatalog))','evaluate(c).initiative,2']);contains(checkBody('native-transfer'),['api.exportCharacters','api.exportLinkedOwlbear','thin.core_stats.initiative,7','imported.reviewedAlert,undefined']);contains(source(),["surprise:'manual'","unseenAttackers:'manual'","modernPBAndSwap:'manual-preserved'",'safeEditingCompatibility=false']);
});
it('keeps source-bearing failure comparisons fingerprint-only and makes no browser/storage completion claim',()=>{
 const code=source();contains(code,['assert.equal(hash(c),before','assert.equal(hash(appCatalog),appCatalogBefore',"browser:'not-run'",'No browser/UI, IndexedDB or corpus rule replay is claimed']);for(const unsafe of ['assert.deepEqual(c.selections','assert.deepEqual(appCatalog','assert.equal(JSON.stringify(c),','assert.equal(JSON.stringify(payload),'])expect(code).not.toContain(unsafe);
});
it('adds Alert runtime gates without dropping prior module coverage',()=>{
 const runtime=readFileSync('scripts/audit_runtime_coverage.ts','utf8');contains(runtime,['...previousCoverage.consumer.modules.map((row:any)=>row.path)',"'src/core/automation/reviewedAlert.ts'","'src/core/automation/reviewedAlertSource.ts'","'src/core/automation/reviewedAlertEvidence.json'","'src/ui/AlertControl.tsx'","'src/core/automation/reviewedObservant.ts'","'src/core/automation/reviewedLinguist.ts'","'src/core/automation/reviewedSkilled.ts'"]);
});

// The new denial probes are multiline. Keep the prior38 guards unchanged and
// inspect complete mechanism bodies, including their actual loop inputs/results.
const denialBodies=(mechanism:string)=>{
 const code=source(),bodies:string[]=[];let cursor=0;
 while(true){const at=code.indexOf(`check('${mechanism}'`,cursor);if(at<0)break;const start=code.lastIndexOf('\n',at)+1,end=code.indexOf('\n});',at);expect(end).toBeGreaterThan(at);bodies.push(code.slice(start,end+4));cursor=end+4;}
 expect(bodies.length).toBeGreaterThan(0);return bodies.join('\n');
};
it('labels actual full229 spell source versus targeted21 authored scaffold and requires resolving positive controls',()=>{
 contains(source(),["process.env.ALERT_FULL_CATALOG==='1'?directoryEntries.find((e:any)=>e.kind==='spell'&&e.english==='Light'&&e.source==='PHB')", "id:'authored-alert-denial-spell'", "'actual-full-directory-PHB-Light':'authored-technical-spell-targeted21-not-source-proof'", 'snapshotCacheReload:true,sourceMagicFixtureScope,fullCorpusRuleEvaluation:false']);
 contains(denialBodies('source-pool-retention'),['api.syncSourceSpells(c,[spell])',"r.entry.kind==='spell'",'assert(!!delivered&&!!key']);contains(denialBodies('source-class-spoof'),['assert.equal(count(),0)',"c.selections[0].level=5",'assert.equal(count(),1']);
});
it('denies all six forged magic forms across both original/modern canonical and alias identities without mutating records',()=>{
 contains(denialBodies('source-magic-denial'),["for(const source of ['PHB','XPHB'])for(const alias of [false,true])for(const mode of ['known','prepared','daily','rest','will','choices'])",'owner.entry.raw.additionalSpells=', 'api.planSourceSpells(c,[spell])','api.reviewedAlertIdentity(owner.entry),true','plan.grants.filter((r:any)=>r.owner.id===owner.id).length,0','plan.choices.filter((r:any)=>r.ownerId===owner.id).length,0','assert.equal(hash(c),before','api.syncSourceSpells(c,[spell])','assert.equal(hash(c.selections.map((r:any)=>r.id)),ids)','assert.equal(hash(c.runtime.resources),resources']);
});
it('denies class-table pool creation and payment resolution even when a genuine owned pool is offered',()=>{
 contains(denialBodies('source-pool-denial'),['cls.entry.raw.classTableGroups=','owner.parentId=cls.id','resourceName:name','ownerId:cls.id','api.planClassResourcePools(c,[]).length,0','api.sourceResourcePool(c,owner,0,name,[grant]).grant,false','api.planSourceSpells(c,[spell]).grants.filter','api.planFeatureResources(c).grants.filter','assert.equal(hash(c),before)','api.syncFeatureResources(c);api.syncSourceSpells(c,[spell])','assert.equal(hash(c.runtime.resources),resources)']);
});
it('retires prior source magic with delivered spell and spent counters retained but payment/action disabled',()=>{
 contains(denialBodies('source-pool-retention'),["owner.entry.english=owner.entry.raw.ENG_name='Authored prior source'",'assert(!!delivered&&!!key','c.runtime.resources[key!].current=0',"owner.entry.english=owner.entry.raw.ENG_name='Alert'",'api.spellPayments(c,delivered!.id).options.length,0','assert.equal(hash(c.selections.map((r:any)=>r.id)),ids)','assert.equal(hash(c.runtime.resources),resources)','c.spellSettings.special[delivered!.id].sourceGrant.active,false']);
});
it('retains independently owned genuine class pools and spent/manual counters after forged requester retirement',()=>{
 contains(denialBodies('source-pool-retention'),['const key=api.classPoolKey(c,cls,name)','name,max:3,current:1,featureGrant:{ownerId:cls.id','spent:2,classPool:{entryId:cls.entry.id,label:name}','hash(api.planClassResourcePools(c,[]).map((r:any)=>r.key)),hash([key])','api.syncFeatureResources(c);assert.equal(c.runtime.resources[key].current,1','c.runtime.resources[key].featureGrant.spent,2','c.runtime.resources[key].featureGrant.ownerId,cls.id',"c.runtime.resources['manual-sentinel'].current,1",'const before=hash(c.runtime.resources);api.syncFeatureResources(c);assert.equal(hash(c.runtime.resources),before']);
});
it('denies every nonfeat impersonation even through a player exception without rewriting the character',()=>{
 contains(denialBodies('source-kind-denial'),["for(const source of ['PHB','XPHB'])for(const alias of [false,true])for(const kind of ['class','subclass','race','feature','background','item','rule'])",'owner.entry.kind=kind','c.profile.exceptions[owner.entry.id]=','api.reviewedAlertIdentity(owner.entry),true','api.selectionAllowed(c,owner.entry),false','api.selectionEffectsAllowed(c,owner.entry),false','assert.equal(hash(c),before)']);
});
it('prevents forged-race speed and ability paths before generic effect loops',()=>{
 contains(denialBodies('source-kind-denial'),["entry.kind='race'",'entry.raw.speed=120',"entry.raw.size=['H']",'entry.raw.ability=[{dex:10}]','actual.speed,before.speed','hash(actual.abilities),hash(before.abilities)',"api.activeEffectSelections(c).some((r:any)=>r.entry.kind==='race'),false"]);
});
it('prevents forged-class level/PB/HP/hit-dice/caster authority and preserves existing automatic resources',()=>{
 contains(denialBodies('source-class-spoof'),["entry.kind='class'","entry.raw.casterProgression='full'",'entry.raw.hd={faces:20}',"id:'forged-alert-class',entry,level:20",'hash({level:d.level,pb:d.proficiency,hp:d.maxHp,dice:d.hitDice,abilities:d.abilities})','assert.equal(derived(actual),derived(before))',"api.casterProfiles(c).some((p:any)=>p.owner.id==='forged-alert-class'),false","api.activeEffectSelections(c).some((r:any)=>r.id==='forged-alert-class'),false",'assert.equal(hash(c),snapshot);api.syncAutoResources(c);assert.equal(hash(c.runtime.resources),resources)']);
});
it('prevents forged subclasses replacing genuine casting progression or source slot tables',()=>{
 contains(denialBodies('source-class-spoof'),["entry.kind='subclass'",'entry.raw.className=c.selections[0].entry.raw.name',"entry.raw.casterProgression='pact'",'entry.raw.subclassTableGroups=[{rowsSpellProgression:', 'hash(api.casterProfiles(c).map((r:any)=>({owner:r.owner.id,casting:r.casting.id,maxLevel:r.maxLevel})))','assert.equal(fingerprint(),profiles);api.syncAutoResources(c);assert.equal(hash(c.runtime.resources),resources)']);
});
it('keeps total-level and implicit-class source gates inert for forged classes but working for genuine current levels',()=>{
 contains(denialBodies('source-class-spoof'),["for(const mode of ['total','implicit-class'])",'known:{5:[spellRef(spell)]}',"if(mode==='implicit-class'){owner.entry.raw.className=forged.raw.name",'r.config.sourceGrant?.active','assert.equal(count(),0)','assert.equal(hash(c),before)','assert.equal(hash(c.runtime.resources),resources)','assert.equal(hash(c.selections.map((r:any)=>r.id)),ids)',"c.selections=c.selections.filter((r:any)=>r.id!=='forged-alert-level')",'c.selections[0].level=5',"if(mode==='implicit-class')owner.entry.raw.className=c.selections[0].entry.raw.name",'assert.equal(count(),1']);
});
it('preserves manual/opaque/locked spell and pact counters plus changed mirrors without automatic adoption',()=>{
 contains(denialBodies('slot-pool-preservation'),["for(const mode of ['manual','opaque','locked'])","mode==='manual'?{automatic:false}:mode==='locked'?{automatic:true,locked:true}:{}","spellKey='spell-slot:1',pactKey='pact-slot:3'",'max:9,current:2','max:4,current:1',"c.spellSettings.slots['1']={max:9,used:7}","c.spellSettings.slots['1']={max:11,used:5}",'api.syncAutoResources(c,before)','assert.equal(hash(c.runtime.resources),resources)','assert.equal(hash(c.spellSettings.slots),mirrors)','c.runtime.resources[spellKey].featureGrant,false','c.runtime.resources[pactKey].featureGrant,false']);
});
it('blocks descendant effect/skill/magic/resource ownership through forged ancestors using fingerprint comparisons',()=>{
 contains(denialBodies('source-ancestor-denial'),["parentId:'forged-alert-ancestor'","target:'dex',value:10","target:'hp',value:90",'skillProficiencies:[{perception:true}]','known:{_:[spellRef(sourceMagicSpell)]}', 'hash({abilities:actual.abilities,hp:actual.maxHp,perception:actual.skills.perception.value}),hash({abilities:before.abilities,hp:before.maxHp,perception:before.skills.perception.value})',"api.planFeatureResources(c).grants.filter((r:any)=>r.ownerId==='authored-alert-descendant').length,0",'api.planSourceSpells(c,[sourceMagicSpell]).grants.filter','r.config.sourceGrant?.active).length,0','every((r:any)=>r.restricted),true','assert.equal(hash(c),snapshot)']);
});
it('suspends an authentic confirmed PHB grant below forged ancestry without rewriting consent or resources',()=>{
 contains(denialBodies('source-ancestor-denial'),['id=activate(c)',"c.selections[0].parentId='forged-alert-ancestor'",'const before=hash(c);assert.equal(status(c,id).active,false);assert.equal(evaluate(c).initiative,2);assert.equal(hash(c),before)']);
});
it('requires exact retained snapshot key for withdrawal with or without owner and never repairs the embedded identity',()=>{
 contains(denialBodies('snapshot-cleanup'),['for(const ownerPresent of [true,false])','c.classChoiceSnapshots[feat.id].id=alias','if(!ownerPresent)c.selections=[]','api.reviewedAlertRule(c.classChoiceSnapshots[feat.id]),true','status(c,id).active,false','reject(c,()=>api.setReviewedAlertIntent(c,id,feat.id,intent(),appCatalog))','api.setReviewedAlertIntent(c,id,alias,null);assert.equal(c.reviewedAlert.bindings.length,1','api.setReviewedAlertIntent(c,id,feat.id,null);assert.equal(c.reviewedAlert.bindings.length,0)','assert.equal(preserve(c),manual)','c.classChoiceSnapshots[feat.id].id,alias']);
});
it('bundles real planners/payment/caster/availability modules for denial probes rather than reimplementing them',()=>{
 contains(source(),["'src/core/automation/sourceSpells.ts':['planSourceSpells','syncSourceSpells']","'src/core/automation/sourceResourcePools.ts':['classPoolKey','planClassResourcePools','sourceResourcePool']","'src/core/automation/actions.ts':['spellPayments']","'src/core/resources.ts':['syncAutoResources']","'src/core/spellcastingRules.ts':['casterProfiles']","'src/core/automation/active.ts':['activeEffectSelections']","'src/core/model.ts':['newCharacter','selectionAllowed','selectionEffectsAllowed']"]);
});
it('uses coherent frozen-edition classes and proves the same pool request succeeds for an ordinary non-Alert owner',()=>{
 const manual=source().split('\n').find(line=>line.startsWith('function manualAlert('));expect(manual).toBeDefined();contains(manual!,["c.edition=source==='PHB'?'2014':'2024'","c.selections=[{...c.selections[0],entry:json(find('class','Wizard',source))}]"]);
 contains(denialBodies('source-pool-denial'),["for(const source of ['PHB','XPHB'])for(const alias of [false,true])",'manualAlert(source,alias)','api.planClassResourcePools(c,[]).length,0','api.sourceResourcePool(c,owner,0,name,[grant]).grant,false','const control=json(c),ordinary=control.selections.find((r:any)=>r.id===owner.id)',"ordinary.entry.id='authored-ordinary-pool-requester'","ordinary.entry.kind='feature'","ordinary.entry.english=ordinary.entry.raw.ENG_name='Authored ordinary pool requester'",'api.reviewedAlertIdentity(ordinary.entry),false','api.planClassResourcePools(control,[]).length,1','api.sourceResourcePool(control,ordinary,0,name,[grant]).grant,true']);
});
