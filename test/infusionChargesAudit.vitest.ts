/** Exact source binding failures occur before bundling or publishing a report.
 * Tiny authored fixtures contain no publisher source text or character data. */
import {it,expect} from 'vitest';
import {execFileSync,spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const script=resolve('scripts/audit_infusion_charges.ts');
const frozenRevision='e2623b204ddbdf2bcfa8317acfc962de89c676e2';
const inputs={
 'class/class-warlock.json':'34721a04db792923cf0a19fbab3f90616093d9f6519a7cfe6f81a9eb52e775d4',
 'optionalfeatures.json':'031970dfac1770a548549bd30535319c2493c47ebeaedfdb6a601651bbfc3844',
 'class/class-artificer.json':'c65cad57eebdfff6508a0cfb821ec670a41cc3f057512cadd19f3805cf1a01d7',
 'items.json':'883f7bb4df2eb35fb37e7caa3a8765e0209014caa360d1c0358daa6f4b2da488',
 'items-base.json':'8933a3e70e47aa4fd6196bd7f1f2e3a57d6d8dbe7e781d37bb6a0519d7c4ffff',
};
const entryHashes={
 'Repulsion Shield|TCE':'28ec9c4a9c276621b12dd971841d6837b5d2bfc3132d286b6e51d1acd885f64b',
 'Mind Sharpener|TCE':'d8a1185d43052a39b5ddd0ae50758fb34acbc7bd9765474898957305c3591f84',
 'Robes|PHB':'6bfbf76315967903d54c62cd91771b280d4e3063c737fc9e2d9835450831ada9',
 'Shield|PHB':'b83f2a31bea90264a7897c65cea8573da00915f5fef7db19308b2c960c378985',
 'Infuse Item|Artificer|TCE|2':'5ea883f06ec7afaba3f78859d665806f32edba0d95c42d2dc35dc2675765b457',
 'Artificer|TCE':'2c4248ad45438e0dd27a57a7a274c15756308e8e23c410b0f0f58bc7eadfc5e1',
};
const knownProgression=[0,4,4,4,4,6,6,6,6,8,8,8,8,10,10,10,10,12,12,12];
const activeProgression=[0,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6];
const rules=[
 {reference:'Repulsion Shield|TCE',owner:'Artificer|TCE',mechanism:'armor-bonus',itemTypes:['S'],minLevel:6,requiresAttunement:true,requiresHeld:true,bonus:1,charges:{max:4,use:1,recovery:'dawn-1d4'}},
 {reference:'Mind Sharpener|TCE',owner:'Artificer|TCE',mechanism:'concentration-reaction',itemTypes:['LA','MA','HA','G'],targetReferences:['Robes|PHB'],minLevel:2,bonus:0,charges:{max:4,use:1,recovery:'dawn-1d4'}},
];
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'infusion-charge-binding-')),web=join(root,'web'),input=join(root,'inputs'),output=join(root,'report.json');
 mkdirSync(join(web,'src/core/automation'),{recursive:true});mkdirSync(input);
 const evidencePath=join(web,'src/core/automation/infusionEvidence.json');
 writeFileSync(evidencePath,JSON.stringify({frozenRevision,inputs,classFeatureReference:'物品注法|奇械师|TCE|2',classFeatureEnglish:'Infuse Item',knownProgression,activeProgression,rules,entryHashes}));
 writeFileSync(join(web,'src/tracked.ts'),'export const value=1;\n');writeFileSync(join(web,'.gitignore'),'src/ignored.ts\n');
 const git=(...args:string[])=>execFileSync('git',args,{cwd:web,stdio:'pipe'});
 git('init','-q');git('add','.');git('-c','user.name=Audit fixture','-c','user.email=fixture@example.invalid','commit','-qm','Fixture');
 const row={url:'https://5e.kiwee.top/data/optionalfeatures.json',path:'optionalfeatures.json',sha256:inputs['optionalfeatures.json']};
 const index=(rows:unknown[])=>writeFileSync(join(input,'index.json'),JSON.stringify({rows}));
 index([row]);writeFileSync(join(input,'optionalfeatures.json'),'{}');
 const reject=(message:string)=>{const result=spawnSync(process.execPath,['--experimental-strip-types',script,web,input,output],{encoding:'utf8'});expect(result.status).not.toBe(0);expect(result.stderr+result.stdout).toContain(message);expect(existsSync(output)).toBe(false);};
 const alter=(fn:(e:any)=>void)=>{const e=JSON.parse(readFileSync(evidencePath,'utf8'));fn(e);writeFileSync(evidencePath,JSON.stringify(e));git('add','.');git('-c','user.name=Audit fixture','-c','user.email=fixture@example.invalid','commit','-qm','Changed binding');};
 return {root,web,input,output,row,index,evidencePath,git,reject,alter,close:()=>rmSync(root,{recursive:true,force:true})};
}
for(const state of ['unstaged','staged','untracked','ignored'])it(`refuses ${state} consumer src before bundling`,()=>{const f=fixture();try{if(state==='untracked'||state==='ignored')writeFileSync(join(f.web,`src/${state}.ts`),'export const unexpected=true;');else{writeFileSync(join(f.web,'src/tracked.ts'),'export const value=2;');if(state==='staged')f.git('add','src/tracked.ts');}f.reject('Consumer src must be clean');}finally{f.close();}});
for(const [label,alter,reason] of [
 ['revision',(e:any)=>{e.frozenRevision='0'.repeat(40);},'Consumer source revision'],
 ['input hash',(e:any)=>{e.inputs['items.json']='0'.repeat(64);},'Consumer canonical input hashes'],
 ['missing robes source',(e:any)=>{delete e.inputs['items.json'];},'Consumer canonical input hashes'],
 ['source reference',(e:any)=>{e.classFeatureReference='物品注法|奇械师|XPHB|2';},'Consumer exact class source reference'],
 ['feature identity',(e:any)=>{e.classFeatureEnglish='Other';},'Consumer exact class source identity'],
 ['known capacity',(e:any)=>{e.knownProgression[1]=5;},'Consumer exact known infusion capacity'],
 ['active capacity',(e:any)=>{e.activeProgression[1]=3;},'Consumer exact active infusion capacity'],
 ...Object.keys(entryHashes).map(key=>['entry hash '+key,(e:any)=>{e.entryHashes[key]='0'.repeat(64);},'Consumer independently reviewed entry hash '+key] as const),
] as const)it(`refuses changed ${label}`,()=>{const f=fixture();try{f.alter(alter);f.reject(reason);}finally{f.close();}});
for(const name of ['Repulsion Shield','Mind Sharpener'])for(const [label,alter] of [
 ['missing rule',(r:any,e:any)=>{e.rules=e.rules.filter((x:any)=>x!==r);}],
 ['duplicate rule',(r:any,e:any)=>{e.rules.push({...r});}],
 ['source alias',(r:any)=>{r.reference=name+'|XPHB';}],
 ['wrong class',(r:any)=>{r.owner='Artificer|UA';}],
 ['wrong mechanism',(r:any)=>{r.mechanism='weapon-bonus';}],
 ['automatic full initialization',(r:any)=>{r.charges.initial=4;}],
 ['wrong maximum',(r:any)=>{r.charges.max=5;}],
 ['variable cost',(r:any)=>{r.charges.use=2;}],
 ['long-rest recovery',(r:any)=>{r.charges.recovery='long-rest';}],
 ['fixed dawn refill',(r:any)=>{r.charges.recovery='dawn-full';}],
 ['wrong minimum level',(r:any)=>{r.minLevel=1;}],
 ['extra target type',(r:any)=>{r.itemTypes.push('SCF');}],
] as const)it(`refuses ${name} ${label}`,()=>{const f=fixture();try{f.alter(e=>alter(e.rules.find((r:any)=>r.reference===name+'|TCE'),e));f.reject('Consumer exact '+name+' mechanics');}finally{f.close();}});
for(const [label,alter] of [
 ['Repulsion missing attunement',(e:any)=>{delete e.rules[0].requiresAttunement;}],
 ['Repulsion missing holding',(e:any)=>{delete e.rules[0].requiresHeld;}],
 ['Mind invented AC',(e:any)=>{e.rules[1].bonus=1;}],
 ['Mind invented attunement',(e:any)=>{e.rules[1].requiresAttunement=true;}],
 ['Mind invented holding',(e:any)=>{e.rules[1].requiresHeld=true;}],
 ['Mind broader robes aliases',(e:any)=>{e.rules[1].targetReferences.push('Robes|XPHB');}],
] as const)it(`refuses ${label}`,()=>{const f=fixture();try{f.alter(alter);f.reject('Consumer exact '+(label.startsWith('Repulsion')?'Repulsion Shield':'Mind Sharpener')+' mechanics');}finally{f.close();}});
for(const count of [0,2])it(`refuses ${count} matching manifest entries`,()=>{const f=fixture();try{f.index(Array.from({length:count},()=>f.row));f.reject('Expected exactly one frozen input');}finally{f.close();}});
for(const path of ['../outside.json','/tmp/outside.json'])it(`refuses manifest path escape: ${path}`,()=>{const f=fixture();try{f.index([{...f.row,path}]);f.reject('Input must remain inside frozen directory');}finally{f.close();}});
it('refuses a symlink outside the frozen directory',()=>{const f=fixture();try{writeFileSync(join(f.root,'outside.json'),'{}');rmSync(join(f.input,'optionalfeatures.json'));symlinkSync(join(f.root,'outside.json'),join(f.input,'optionalfeatures.json'));f.reject('Resolved input must remain inside frozen directory');}finally{f.close();}});
it('refuses changed source content despite a manifest claiming the expected hash',()=>{const f=fixture();try{f.reject('Frozen input mismatch optionalfeatures.json');}finally{f.close();}});
it('requires the frozen source manifest rather than silently accepting another layout',()=>{const f=fixture();try{rmSync(join(f.input,'index.json'));f.reject('Frozen input manifest is required');}finally{f.close();}});
