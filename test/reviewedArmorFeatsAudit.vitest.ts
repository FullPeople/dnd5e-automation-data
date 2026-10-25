/** Binding guards only. Behavior is proved by the separate actual source/API run. */
import {it,expect} from 'vitest';
import {execFileSync,spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const script=resolve('scripts/audit_reviewed_armor_feats.ts');
const evidence={"schemaVersion":1,"mechanism":"explicit-owned-legacy-passive-feat","source":"PHB","edition":"2014","inputs":{"feats.json":"0491b421f5f1db6628c3a8aeb86bbc3b72b56bf101a14ba96acbe19c829a56a6","variantrules.json":"21eef107d25cf438eb85894387fb6f834478d80bc467791c54fe66db9e498c44"},"rules":[{"kind":"tough","reference":"Tough|PHB","english":"Tough","page":170,"entryHash":"8536c66d7553dfd58e14c195a886b241c62e174251fb248f45d0634eef15115f","hpPerTotalLevel":2},{"kind":"resilient","reference":"Resilient|PHB","english":"Resilient","page":168,"entryHash":"19c5167ba7f0f74652805354c71c2ed037177dc38d3db53f4a4dc0fac3abcdf7","abilityBonus":1,"cap":20,"sameAbilitySave":true,"requiresUnproficientSave":false},{"kind":"lightly-armored","reference":"Lightly Armored|PHB","english":"Lightly Armored","page":167,"entryHash":"5e87f09b022c56e00d9283ce52708ee38059e7349d815443d3bb2c5da5a41a42","abilityBonus":1,"cap":20,"abilities":["str","dex"],"armorTraining":["light"]},{"kind":"moderately-armored","reference":"Moderately Armored|PHB","english":"Moderately Armored","page":168,"entryHash":"98b557e88aeeb29328dddf9924ddce14a695945979de06cd766ed7cb119708fa","abilityBonus":1,"cap":20,"abilities":["str","dex"],"armorTraining":["medium","shield"],"requiredArmor":"light"},{"kind":"heavily-armored","reference":"Heavily Armored|PHB","english":"Heavily Armored","page":167,"entryHash":"5a822e4ac8cba9147dfa9b28f0a6a5ccf80dcd4f30c047e879af62c4ec15d297","abilityBonus":1,"cap":20,"abilities":["str"],"armorTraining":["heavy"],"requiredArmor":"medium"}],"retrievalRevisions":{"feats.json":"5cc0bbe2c2b241a334e731af4448bdba2168e8bd","variantrules.json":"e2623b204ddbdf2bcfa8317acfc962de89c676e2"},"supportingEntryHashes":{"Feats|PHB":"75b2156dacae2a779a04406c4f12fe1feb5541631d463f22c3ccaab53dc50269","Multiclassing|PHB":"dbfd50fed582b56c5069992230c886e5e6d710fed98aedc25833d918af0871fc"}};
const modernEvidence={"schemaVersion":1,"mechanism":"preserve-existing-modern-armor-training","source":"XPHB","edition":"2024","input":{"path":"feats.json","sha256":"0491b421f5f1db6628c3a8aeb86bbc3b72b56bf101a14ba96acbe19c829a56a6","retrievalRevision":"5cc0bbe2c2b241a334e731af4448bdba2168e8bd"},"rules":[{"reference":"Lightly Armored|XPHB","english":"Lightly Armored","page":205,"entryHash":"423fb6efa58add6c891b114c273e96e135977ab6f06d9db8daa7c70d2a6a10d9","minimumLevel":4,"abilities":["str","dex"],"armorTraining":["light","shield"],"typedChoiceSupported":true},{"reference":"Moderately Armored|XPHB","english":"Moderately Armored","page":205,"entryHash":"b86f5aeef2bc39ce9b9d03e863b8d4fd10097b6273b9afbf37e62e1954ed1c35","minimumLevel":4,"abilities":["str","dex"],"armorTraining":["medium"],"requiredArmor":"light","typedChoiceSupported":false},{"reference":"Heavily Armored|XPHB","english":"Heavily Armored","page":204,"entryHash":"6ef86668d2f7d2d91d829769f34758fbecb3e52b0487445378ce595524b569af","minimumLevel":4,"abilities":["con","str"],"armorTraining":["heavy"],"requiredArmor":"medium","typedChoiceSupported":false}]};
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'armor-feat-binding-')),web=join(root,'web'),input=join(root,'inputs'),output=join(root,'report.json');mkdirSync(join(web,'src/core/automation'),{recursive:true});mkdirSync(input);
 const evidencePath=join(web,'src/core/automation/reviewedFeatEvidence.json');writeFileSync(evidencePath,JSON.stringify(evidence));const modernPath=join(web,'src/core/automation/modernArmorTrainingEvidence.json');writeFileSync(modernPath,JSON.stringify(modernEvidence));writeFileSync(join(web,'src/tracked.ts'),'export const value=1;\n');writeFileSync(join(web,'.gitignore'),'src/ignored.ts\n');
 const git=(...args:string[])=>execFileSync('git',args,{cwd:web,stdio:'pipe'});git('init','-q');git('add','.');git('-c','user.name=Audit fixture','-c','user.email=fixture@example.invalid','commit','-qm','Fixture');
 const row={url:'https://5e.kiwee.top/data/class/class-artificer.json',path:'class-artificer.json',sha256:'c65cad57eebdfff6508a0cfb821ec670a41cc3f057512cadd19f3805cf1a01d7'};
 const index=(rows:unknown[])=>writeFileSync(join(input,'index.json'),JSON.stringify({rows}));index([row]);writeFileSync(join(input,row.path),'{}');
 const reject=(message:string)=>{const result=spawnSync(process.execPath,['--experimental-strip-types',script,web,input,output],{encoding:'utf8'});expect(result.status).not.toBe(0);expect(result.stderr+result.stdout).toContain(message);expect(existsSync(output)).toBe(false);};
 const alter=(fn:(e:any)=>void)=>{const e=JSON.parse(readFileSync(evidencePath,'utf8'));fn(e);writeFileSync(evidencePath,JSON.stringify(e));git('add','.');git('-c','user.name=Audit fixture','-c','user.email=fixture@example.invalid','commit','-qm','Changed binding');};
 const alterModern=(fn:(e:any)=>void)=>{const e=JSON.parse(readFileSync(modernPath,'utf8'));fn(e);writeFileSync(modernPath,JSON.stringify(e));git('add','.');git('-c','user.name=Audit fixture','-c','user.email=fixture@example.invalid','commit','-qm','Changed modern binding');};
 return {root,web,input,output,row,index,git,reject,alter,alterModern,close:()=>rmSync(root,{recursive:true,force:true})};
}
for(const state of ['unstaged','staged','untracked','ignored'])it(`rejects ${state} consumer source before building`,()=>{const f=fixture();try{if(state==='untracked'||state==='ignored')writeFileSync(join(f.web,`src/${state}.ts`),'export const unexpected=true;');else{writeFileSync(join(f.web,'src/tracked.ts'),'export const value=2;');if(state==='staged')f.git('add','src/tracked.ts');}f.reject('Consumer src must be clean');}finally{f.close();}});
for(const [label,alter,reason] of [
 ['version',(e:any)=>{e.schemaVersion=2;},'Consumer reviewed evidence version'],
 ['mechanism',(e:any)=>{e.mechanism='generic-feat';},'Consumer reviewed mechanism'],
 ['source',(e:any)=>{e.source='XPHB';},'Consumer PHB source'],
 ['edition',(e:any)=>{e.edition='2024';},'Consumer original edition'],
 ['input hash',(e:any)=>{e.inputs['feats.json']='0'.repeat(64);},'Consumer reviewed canonical input hashes'],
 ['support source missing',(e:any)=>{delete e.inputs['variantrules.json'];},'Consumer reviewed canonical input hashes'],
 ['unreviewed source added',(e:any)=>{e.inputs['unknown.json']='0'.repeat(64);},'Consumer reviewed canonical input hashes'],
 ['wrong feat retrieval revision',(e:any)=>{e.retrievalRevisions['feats.json']=e.retrievalRevisions['variantrules.json'];},'Consumer independently verified retrieval revisions'],
 ['repeatability hash',(e:any)=>{e.supportingEntryHashes['Feats|PHB']='0'.repeat(64);},'Consumer repeatability and total-level source hashes'],
 ['total-level hash',(e:any)=>{e.supportingEntryHashes['Multiclassing|PHB']='0'.repeat(64);},'Consumer repeatability and total-level source hashes'],
] as const)it(`rejects changed ${label}`,()=>{const f=fixture();try{f.alter(alter);f.reject(reason);}finally{f.close();}});
for(const [label,alter] of [
 ['Tough multiplier',(e:any)=>{e.rules[0].hpPerTotalLevel=1;}],
 ['Tough reference',(e:any)=>{e.rules[0].reference='Tough|XPHB';}],
 ['Tough source hash',(e:any)=>{e.rules[0].entryHash='0'.repeat(64);}],
 ['Tough unknown semantics',(e:any)=>{e.rules[0].autoConfirm=true;}],
 ['Resilient amount',(e:any)=>{e.rules[1].abilityBonus=2;}],
 ['Resilient cap',(e:any)=>{e.rules[1].cap=30;}],
 ['Resilient detached save',(e:any)=>{e.rules[1].sameAbilitySave=false;}],
 ['XPHB unproficient-save restriction',(e:any)=>{e.rules[1].requiresUnproficientSave=true;}],
 ['Resilient source hash',(e:any)=>{e.rules[1].entryHash='0'.repeat(64);}],
 ['Resilient repeated feat',(e:any)=>{e.rules[1].repeatable=true;}],
 ['Lightly amount',(e:any)=>{e.rules[2].abilityBonus=2;}],
 ['Lightly cap',(e:any)=>{e.rules[2].cap=30;}],
 ['Lightly invented shield',(e:any)=>{e.rules[2].armorTraining.push('shield');}],
 ['Lightly added prerequisite',(e:any)=>{e.rules[2].requiredArmor='light';}],
 ['Moderately missing shield',(e:any)=>{e.rules[3].armorTraining=['medium'];}],
 ['Moderately missing prerequisite',(e:any)=>{delete e.rules[3].requiredArmor;}],
 ['Moderately wrong prerequisite',(e:any)=>{e.rules[3].requiredArmor='shield';}],
 ['Heavily added Dexterity',(e:any)=>{e.rules[4].abilities.push('dex');}],
 ['Heavily added Constitution',(e:any)=>{e.rules[4].abilities.push('con');}],
 ['Heavily wrong prerequisite',(e:any)=>{e.rules[4].requiredArmor='light';}],
 ['Heavily unknown semantics',(e:any)=>{e.rules[4].autoConfirm=true;}],
 ['Armor unsupported sixth rule',(e:any)=>{e.rules.push({kind:'actor'});}],
 ['missing rule',(e:any)=>{e.rules.pop();}],
 ['duplicate rule',(e:any)=>{e.rules.push({...e.rules[0]});}],
] as const)it(`rejects changed ${label} mechanics`,()=>{const f=fixture();try{f.alter(alter);f.reject('Consumer reviewed armor feat mechanics');}finally{f.close();}});
for(const count of [0,2])it(`refuses ${count} matching frozen paths`,()=>{const f=fixture();try{f.index(Array.from({length:count},()=>f.row));f.reject('Expected exactly one frozen input');}finally{f.close();}});
for(const path of ['../outside.json','/tmp/outside.json'])it(`refuses frozen path escape ${path}`,()=>{const f=fixture();try{f.index([{...f.row,path}]);f.reject('Input must remain inside frozen directory');}finally{f.close();}});
it('refuses external input symlinks',()=>{const f=fixture();try{writeFileSync(join(f.root,'outside.json'),'{}');rmSync(join(f.input,f.row.path));symlinkSync(join(f.root,'outside.json'),join(f.input,f.row.path));f.reject('Resolved input must remain inside frozen directory');}finally{f.close();}});
it('checks source bytes instead of trusting a claimed manifest hash',()=>{const f=fixture();try{f.reject('Frozen input mismatch class/class-artificer.json');}finally{f.close();}});
it('requires a frozen manifest',()=>{const f=fixture();try{rmSync(join(f.input,'index.json'));f.reject('Frozen input manifest is required');}finally{f.close();}});
it('reuses independently pinned source inputs and replays the actual armor consumer in CI',()=>{const workflow=readFileSync('.github/workflows/build.yml','utf8'),start=workflow.indexOf('Replay exact reviewed PHB2014 passive feat workflows'),end=workflow.indexOf('Replay three explicit attuned TCE infusion workflows',start),block=workflow.slice(start,end);expect(start).toBeGreaterThan(0);for(const revision of ['5cc0bbe2c2b241a334e731af4448bdba2168e8bd','e2623b204ddbdf2bcfa8317acfc962de89c676e2'])expect(block).toContain(revision);for(const name of ['artificer','barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard'])expect(block).toContain(`class/class-${name}.json`);expect(block).toContain('variantrules.json');expect(block).toContain('items-base.json');expect(block).toContain('scripts/audit_reviewed_armor_feats.ts .cache/web-consumer .cache/passive-feat-inputs');});
it('binds the upstream cap interpretation separately from original feat entry hashes',()=>{const source=readFileSync(script,'utf8');expect(source).toContain("gitBlobSha:'fd559e0baad858c2bc59a813603a55e41972a1f4'");expect(source).toContain("path:'js/render.js'");expect(source).toContain("publisherFeatProse:'not independently accessible in this audit'");expect(source).toContain('raw.ability[0].max,undefined');expect(source).toContain("'Proof script bytes match producer revision'");expect(source).toContain("'Bundled consumer bytes equal committed source'");});
it('retains prior module gates while binding all shared armor safety layers',()=>{const source=readFileSync('scripts/audit_runtime_coverage.ts','utf8');expect(source).toContain('...previousCoverage.consumer.modules.map((row:any)=>row.path)');for(const path of ['src/core/automation/active.ts','src/core/automation/baseAbilities.ts','src/core/automation/reviewedFeatIdentity.ts','src/core/automation/modernArmorTrainingEvidence.json','src/core/automation/training.ts','src/core/automation/equipment.ts','src/ui/TrainingChips.tsx'])expect(source).toContain(`'${path}'`);});

for(const [label,alter,reason] of [
 ['version',(e:any)=>{e.schemaVersion=2;},'Retained XPHB training evidence version'],
 ['mechanism',(e:any)=>{e.mechanism='new-full-xphb-automation';},'Retained XPHB training mechanism'],
 ['source',(e:any)=>{e.source='PHB';},'Retained XPHB source'],
 ['edition',(e:any)=>{e.edition='2014';},'Retained XPHB edition'],
 ['input hash',(e:any)=>{e.input.sha256='0'.repeat(64);},'Retained XPHB canonical input'],
 ['retrieval revision',(e:any)=>{e.input.retrievalRevision='0'.repeat(40);},'Retained XPHB canonical input'],
 ['Lightly shield missing',(e:any)=>{e.rules[0].armorTraining=['light'];},'Retained XPHB training mechanics only'],
 ['Lightly lowered minimum',(e:any)=>{e.rules[0].minimumLevel=1;},'Retained XPHB training mechanics only'],
 ['Lightly wrong page',(e:any)=>{e.rules[0].page=167;},'Retained XPHB training mechanics only'],
 ['Lightly wrong source hash',(e:any)=>{e.rules[0].entryHash='0'.repeat(64);},'Retained XPHB training mechanics only'],
 ['Moderately invented shield',(e:any)=>{e.rules[1].armorTraining.push('shield');},'Retained XPHB training mechanics only'],
 ['Moderately invented typed acquisition',(e:any)=>{e.rules[1].typedChoiceSupported=true;},'Retained XPHB training mechanics only'],
 ['Heavily invented typed acquisition',(e:any)=>{e.rules[2].typedChoiceSupported=true;},'Retained XPHB training mechanics only'],
 ['Moderately missing prerequisite',(e:any)=>{delete e.rules[1].requiredArmor;},'Retained XPHB training mechanics only'],
 ['Heavily missing Constitution',(e:any)=>{e.rules[2].abilities=['str'];},'Retained XPHB training mechanics only'],
 ['Heavily invented ability execution',(e:any)=>{e.rules[2].abilityBonus=1;},'Retained XPHB training mechanics only'],
 ['Heavily wrong source',(e:any)=>{e.rules[2].reference='Heavily Armored|PHB';},'Retained XPHB training mechanics only'],
 ['duplicate rule',(e:any)=>{e.rules.push({...e.rules[0]});},'Retained XPHB training mechanics only'],
 ['missing rule',(e:any)=>{e.rules.pop();},'Retained XPHB training mechanics only'],
] as const)it(`rejects changed retained modern ${label}`,()=>{const f=fixture();try{f.alterModern(alter);f.reject(reason);}finally{f.close();}});
