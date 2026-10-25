/** Binding guards only. Behavior is proved by the separate actual source/API run. */
import {it,expect} from 'vitest';
import {execFileSync,spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const script=resolve('scripts/audit_reviewed_passive_feats.ts');
const evidence={schemaVersion:1,mechanism:'explicit-owned-legacy-passive-feat',source:'PHB',edition:'2014',inputs:{'feats.json':'0491b421f5f1db6628c3a8aeb86bbc3b72b56bf101a14ba96acbe19c829a56a6','variantrules.json':'21eef107d25cf438eb85894387fb6f834478d80bc467791c54fe66db9e498c44'},retrievalRevisions:{'feats.json':'5cc0bbe2c2b241a334e731af4448bdba2168e8bd','variantrules.json':'e2623b204ddbdf2bcfa8317acfc962de89c676e2'},supportingEntryHashes:{'Feats|PHB':'75b2156dacae2a779a04406c4f12fe1feb5541631d463f22c3ccaab53dc50269','Multiclassing|PHB':'dbfd50fed582b56c5069992230c886e5e6d710fed98aedc25833d918af0871fc'},rules:[
 {kind:'tough',reference:'Tough|PHB',english:'Tough',page:170,entryHash:'8536c66d7553dfd58e14c195a886b241c62e174251fb248f45d0634eef15115f',hpPerTotalLevel:2},
 {kind:'resilient',reference:'Resilient|PHB',english:'Resilient',page:168,entryHash:'19c5167ba7f0f74652805354c71c2ed037177dc38d3db53f4a4dc0fac3abcdf7',abilityBonus:1,cap:20,sameAbilitySave:true,requiresUnproficientSave:false},
]};
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'passive-feat-binding-')),web=join(root,'web'),input=join(root,'inputs'),output=join(root,'report.json');mkdirSync(join(web,'src/core/automation'),{recursive:true});mkdirSync(input);
 const evidencePath=join(web,'src/core/automation/reviewedFeatEvidence.json');writeFileSync(evidencePath,JSON.stringify(evidence));writeFileSync(join(web,'src/tracked.ts'),'export const value=1;\n');writeFileSync(join(web,'.gitignore'),'src/ignored.ts\n');
 const git=(...args:string[])=>execFileSync('git',args,{cwd:web,stdio:'pipe'});git('init','-q');git('add','.');git('-c','user.name=Audit fixture','-c','user.email=fixture@example.invalid','commit','-qm','Fixture');
 const row={url:'https://5e.kiwee.top/data/class/class-artificer.json',path:'class-artificer.json',sha256:'c65cad57eebdfff6508a0cfb821ec670a41cc3f057512cadd19f3805cf1a01d7'};
 const index=(rows:unknown[])=>writeFileSync(join(input,'index.json'),JSON.stringify({rows}));index([row]);writeFileSync(join(input,row.path),'{}');
 const reject=(message:string)=>{const result=spawnSync(process.execPath,['--experimental-strip-types',script,web,input,output],{encoding:'utf8'});expect(result.status).not.toBe(0);expect(result.stderr+result.stdout).toContain(message);expect(existsSync(output)).toBe(false);};
 const alter=(fn:(e:any)=>void)=>{const e=JSON.parse(readFileSync(evidencePath,'utf8'));fn(e);writeFileSync(evidencePath,JSON.stringify(e));git('add','.');git('-c','user.name=Audit fixture','-c','user.email=fixture@example.invalid','commit','-qm','Changed binding');};
 return {root,web,input,output,row,index,git,reject,alter,close:()=>rmSync(root,{recursive:true,force:true})};
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
 ['missing rule',(e:any)=>{e.rules.pop();}],
 ['duplicate rule',(e:any)=>{e.rules.push({...e.rules[0]});}],
] as const)it(`rejects changed ${label} mechanics`,()=>{const f=fixture();try{f.alter(alter);f.reject('Consumer reviewed passive feat mechanics');}finally{f.close();}});
for(const count of [0,2])it(`refuses ${count} matching frozen paths`,()=>{const f=fixture();try{f.index(Array.from({length:count},()=>f.row));f.reject('Expected exactly one frozen input');}finally{f.close();}});
for(const path of ['../outside.json','/tmp/outside.json'])it(`refuses frozen path escape ${path}`,()=>{const f=fixture();try{f.index([{...f.row,path}]);f.reject('Input must remain inside frozen directory');}finally{f.close();}});
it('refuses external input symlinks',()=>{const f=fixture();try{writeFileSync(join(f.root,'outside.json'),'{}');rmSync(join(f.input,f.row.path));symlinkSync(join(f.root,'outside.json'),join(f.input,f.row.path));f.reject('Resolved input must remain inside frozen directory');}finally{f.close();}});
it('checks source bytes instead of trusting a claimed manifest hash',()=>{const f=fixture();try{f.reject('Frozen input mismatch class/class-artificer.json');}finally{f.close();}});
it('requires a frozen manifest',()=>{const f=fixture();try{rmSync(join(f.input,'index.json'));f.reject('Frozen input manifest is required');}finally{f.close();}});
it('fetches the independently verified feat revision and all13 class sources in CI',()=>{const workflow=readFileSync('.github/workflows/build.yml','utf8'),start=workflow.indexOf('Replay exact reviewed PHB2014 passive feat workflows'),block=workflow.slice(start,workflow.indexOf('      - name:',start+10));expect(start).toBeGreaterThan(0);expect(block).toContain('5cc0bbe2c2b241a334e731af4448bdba2168e8bd');expect(block).toContain('e2623b204ddbdf2bcfa8317acfc962de89c676e2');for(const name of ['artificer','barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard'])expect(block).toContain(`class/class-${name}.json`);expect(block).toContain('variantrules.json');expect(block).toContain('scripts/audit_reviewed_passive_feats.ts');});
it('retains previous runtime module gates and adds necessary passive-feat modules',()=>{const source=readFileSync('scripts/audit_runtime_coverage.ts','utf8');expect(source).toContain('...previousCoverage.consumer.modules.map((row:any)=>row.path)');for(const path of ['src/core/automation/reviewedFeats.ts','src/core/automation/reviewedFeatEvidence.json','src/core/automation/abilityAdvancements.ts','src/ui/ReviewedFeatControl.tsx'])expect(source).toContain(`'${path}'`);});
