/** Binding guards are not rule-behavior tests. No source prose or saved cards. */
import {it,expect} from 'vitest';
import {execFileSync,spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const script=resolve('scripts/audit_radiant_refueling.ts');
const frozenRevision='e2623b204ddbdf2bcfa8317acfc962de89c676e2';
const inputs={
 'optionalfeatures.json':'031970dfac1770a548549bd30535319c2493c47ebeaedfdb6a601651bbfc3844',
 'class/class-artificer.json':'c65cad57eebdfff6508a0cfb821ec670a41cc3f057512cadd19f3805cf1a01d7',
 'items-base.json':'8933a3e70e47aa4fd6196bd7f1f2e3a57d6d8dbe7e781d37bb6a0519d7c4ffff',
 'items.json':'883f7bb4df2eb35fb37e7caa3a8765e0209014caa360d1c0358daa6f4b2da488',
 'class/class-warlock.json':'34721a04db792923cf0a19fbab3f90616093d9f6519a7cfe6f81a9eb52e775d4',
};
const entryHashes={
 'Radiant Weapon|TCE':'fe3bd279c34d94541e26a8b3fbb113f0154194fd09b5d2942a4de4656832301e',
 'Spell-Refueling Ring|TCE':'5ad5a802bbd8769717ecf6d54990a953bab9b1a0777abbf5be4ed71f6a180ce4',
 'Signet Ring|PHB':'157759344ac477dd06caf047439a9ff233886f84f5b83e8a056b899943c3a007',
 'Artificer|TCE':'2c4248ad45438e0dd27a57a7a274c15756308e8e23c410b0f0f58bc7eadfc5e1',
 'Infuse Item|Artificer|TCE|2':'5ea883f06ec7afaba3f78859d665806f32edba0d95c42d2dc35dc2675765b457',
 'Spellcasting|Artificer|TCE|1':'aae73a44790df6e2f55ef846ac90dc8b2d8a381ea2b6936bab648b0dc386bd6b',
 'Warlock|PHB':'179a4e48b79fef7ae2244e88e614d04a0828caca4a854b6f65de61b6df802385',
 'Pact Magic|Warlock|PHB|1':'da68ce072732185a89c9b7d4354f20eb1a92717c87cf267e2af39f55b64bfd3a',
};
const knownProgression=[0,4,4,4,4,6,6,6,6,8,8,8,8,10,10,10,10,12,12,12];
const activeProgression=[0,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6];
const rules=[
 {reference:'Radiant Weapon|TCE',owner:'Artificer|TCE',mechanism:'weapon-bonus',itemTypes:['M','R'],weaponCategories:['simple','martial'],minLevel:6,requiresAttunement:true,requiresHeld:true,bonus:1,charges:{max:4,use:1,recovery:'dawn-1d4'}},
 {reference:'Spell-Refueling Ring|TCE',owner:'Artificer|TCE',mechanism:'spell-refueling',itemTypes:['G'],targetReferences:['Signet Ring|PHB'],minLevel:6,requiresAttunement:true,bonus:0,refueling:{max:1,use:1,recovery:'dawn',maxSlotLevel:3,action:'action'}},
];
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'radiant-refueling-binding-')),web=join(root,'web'),input=join(root,'inputs'),output=join(root,'report.json');
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
 ['missing Warlock source',(e:any)=>{delete e.inputs['class/class-warlock.json'];},'Consumer canonical input hashes'],
 ['unexpected source',(e:any)=>{e.inputs['class/class-wizard.json']='0'.repeat(64);},'Consumer canonical input hashes'],
 ['source reference',(e:any)=>{e.classFeatureReference='物品注法|奇械师|EFA|2';},'Consumer exact class source reference'],
 ['feature identity',(e:any)=>{e.classFeatureEnglish='Other';},'Consumer exact class source identity'],
 ['known capacity',(e:any)=>{e.knownProgression[5]=7;},'Consumer exact known infusion capacity'],
 ['active capacity',(e:any)=>{e.activeProgression[5]=4;},'Consumer exact active infusion capacity'],
 ...Object.keys(entryHashes).map(key=>['entry hash '+key,(e:any)=>{e.entryHashes[key]='0'.repeat(64);},'Consumer independently reviewed entry hash '+key] as const),
] as const)it(`binding guard refuses changed ${label}`,()=>{const f=fixture();try{f.alter(alter);f.reject(reason);}finally{f.close();}});
for(const name of ['Radiant Weapon','Spell-Refueling Ring'])for(const [label,alter] of [
 ['missing rule',(r:any,e:any)=>{e.rules=e.rules.filter((x:any)=>x!==r);}],
 ['duplicate rule',(r:any,e:any)=>{e.rules.push({...r});}],
 ['source alias',(r:any)=>{r.reference=name+'|EFA';}],
 ['wrong class',(r:any)=>{r.owner='Artificer|EFA';}],
 ['wrong mechanism',(r:any)=>{r.mechanism='armor-bonus';}],
 ['wrong level',(r:any)=>{r.minLevel=2;}],
 ['extra target',(r:any)=>{r.itemTypes.push('SCF');}],
 ['missing attunement',(r:any)=>{delete r.requiresAttunement;}],
 ['invented bonus',(r:any)=>{r.bonus=2;}],
 ['invented level-ten upgrade',(r:any)=>{r.upgradeLevel=10;r.upgradedBonus=2;}],
] as const)it(`binding guard refuses ${name} ${label}`,()=>{const f=fixture();try{f.alter(e=>alter(e.rules.find((r:any)=>r.reference===name+'|TCE'),e));f.reject('Consumer exact '+name+' mechanics');}finally{f.close();}});
for(const [label,alter] of [
 ['missing holding',(r:any)=>{delete r.requiresHeld;}],
 ['wrong charge maximum',(r:any)=>{r.charges.max=5;}],
 ['wrong cost',(r:any)=>{r.charges.use=2;}],
 ['long-rest recovery',(r:any)=>{r.charges.recovery='long-rest';}],
 ['fixed full recovery',(r:any)=>{r.charges.recovery='dawn-full';}],
 ['implicit initialization',(r:any)=>{r.charges.initial=4;}],
 ['nonweapon category',(r:any)=>{r.weaponCategories.push('improvised');}],
] as const)it(`binding guard refuses Radiant ${label}`,()=>{const f=fixture();try{f.alter(e=>alter(e.rules[0]));f.reject('Consumer exact Radiant Weapon mechanics');}finally{f.close();}});
for(const [label,alter] of [
 ['charge inheritance',(r:any)=>{r.charges={max:4,use:1,recovery:'dawn-1d4'};}],
 ['EFA bonus action',(r:any)=>{r.refueling.action='bonus-action';}],
 ['reaction instead of action',(r:any)=>{r.refueling.action='reaction';}],
 ['d4 recovery',(r:any)=>{r.refueling.recovery='dawn-1d4';}],
 ['four uses',(r:any)=>{r.refueling.max=4;}],
 ['multiple-slot credit',(r:any)=>{r.refueling.use=2;}],
 ['level-four credit',(r:any)=>{r.refueling.maxSlotLevel=4;}],
 ['missing refueling semantics',(r:any)=>{delete r.refueling;}],
 ['generic Ring aliases',(r:any)=>{r.targetReferences.push('Signet Ring|XPHB');}],
 ['holding invented',(r:any)=>{r.requiresHeld=true;}],
] as const)it(`binding guard refuses Ring ${label}`,()=>{const f=fixture();try{f.alter(e=>alter(e.rules[1]));f.reject('Consumer exact Spell-Refueling Ring mechanics');}finally{f.close();}});
for(const count of [0,2])it(`binding guard refuses ${count} manifest matches`,()=>{const f=fixture();try{f.index(Array.from({length:count},()=>f.row));f.reject('Expected exactly one frozen input');}finally{f.close();}});
for(const path of ['../outside.json','/tmp/outside.json'])it(`binding guard refuses path escape ${path}`,()=>{const f=fixture();try{f.index([{...f.row,path}]);f.reject('Input must remain inside frozen directory');}finally{f.close();}});
it('binding guard refuses external symlinks',()=>{const f=fixture();try{writeFileSync(join(f.root,'outside.json'),'{}');rmSync(join(f.input,'optionalfeatures.json'));symlinkSync(join(f.root,'outside.json'),join(f.input,'optionalfeatures.json'));f.reject('Resolved input must remain inside frozen directory');}finally{f.close();}});
it('binding guard checks actual bytes, not a hash claimed by the manifest',()=>{const f=fixture();try{f.reject('Frozen input mismatch optionalfeatures.json');}finally{f.close();}});
it('binding guard requires original-source manifest',()=>{const f=fixture();try{rmSync(join(f.input,'index.json'));f.reject('Frozen input manifest is required');}finally{f.close();}});
it('keeps items retrieval at its independently verified revision',()=>{const workflow=readFileSync('.github/workflows/build.yml','utf8');const start=workflow.indexOf('Replay exact Radiant Weapon and Spell-Refueling Ring workflows');expect(start).toBeGreaterThan(0);const block=workflow.slice(start,workflow.indexOf('      - name:',start+10));expect(block).toContain('5cc0bbe2c2b241a334e731af4448bdba2168e8bd');expect(block).toContain('class/class-warlock.json');expect(block).toContain('spells/spells-phb.json');expect(block).toContain('scripts/audit_radiant_refueling.ts');});
it('preserves old runtime module gates and binds all new independent mutation and UI paths',()=>{const source=readFileSync('scripts/audit_runtime_coverage.ts','utf8');expect(source).toContain('...previousCoverage.consumer.modules.map((row:any)=>row.path)');for(const path of ['src/core/automation/infusionCharges.ts','src/core/automation/refuelingRing.ts','src/core/automation/refuelingSlotResolver.ts','src/ui/InfusionChargeControl.tsx','src/ui/infusionChargePresentation.ts','src/ui/infusionChargeSubmission.ts','src/ui/RefuelingRingControl.tsx','src/ui/refuelingRingPresentation.ts','src/ui/refuelingRingSubmission.ts'])expect(source).toContain(`'${path}'`);});
