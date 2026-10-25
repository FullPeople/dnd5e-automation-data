/** Binding failures must happen before bundling or writing a success report.
 * These tiny fixtures contain no source snapshots or real character data. */
import {it,expect} from 'vitest';
import {execFileSync,spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';

const script=resolve('scripts/audit_invocation_atwill.ts');
const frozenRevision='e2623b204ddbdf2bcfa8317acfc962de89c676e2';
const inputs={
 'optionalfeatures.json':'031970dfac1770a548549bd30535319c2493c47ebeaedfdb6a601651bbfc3844',
 'class/class-warlock.json':'34721a04db792923cf0a19fbab3f90616093d9f6519a7cfe6f81a9eb52e775d4',
 'spells/spells-phb.json':'e1f2221020cfb5d31995c99b78dc09435c9962476ef1cef81b52399e6df0263d',
};
const rules=[
 {reference:'Fiendish Vigor|PHB',mechanism:'spell',page:111,spell:'虚假生命',spellReference:'False Life|PHB',spellLevel:1,selfOnly:true},
 {reference:'Master of Myriad Forms|PHB',mechanism:'spell',page:111,spell:'变身术',spellReference:'Alter Self|PHB',spellLevel:2,requiredClassLevel:15,selfOnly:true},
 {reference:'Visions of Distant Realms|PHB',mechanism:'spell',page:111,spell:'秘法眼',spellReference:'Arcane Eye|PHB',spellLevel:4,requiredClassLevel:15,selfOnly:false},
];
const entryHashes={
 'Fiendish Vigor|PHB':'2ee65d3e6f574dbf89909617ee0401a97ca2cd209b4054e385e69f9bf12a4a47',
 'Master of Myriad Forms|PHB':'1b140781b1dae4ddd4117ee454984e7156ed8ef767330c7f8a2b58e232b950bb',
 'Visions of Distant Realms|PHB':'757d3105f2fa1ec7a2f94ef3413389f4adf0c806deb938909012c68b61567200',
 'False Life|PHB':'05126f60c10a2a74bb62a6df5f1ccb86b28a28b5fbb9277f59dbaeecff2fd745',
 'Alter Self|PHB':'ecc05d8ae14df11abbdf8e468666f813cebd1c9b9f9478c5d52058ecdde677d3',
 'Arcane Eye|PHB':'08bc21c42b722e8185524b350534af02631f6f42f4a9c72ce15a9837197e242d',
};
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'invocation-atwill-binding-')),web=join(root,'web'),input=join(root,'inputs'),output=join(root,'report.json');
 mkdirSync(join(web,'src/core/automation'),{recursive:true});mkdirSync(input);
 const evidencePath=join(web,'src/core/automation/invocationEvidence.json');
 writeFileSync(evidencePath,JSON.stringify({frozenRevision,inputs}));
 const atwillPath=join(web,'src/core/automation/invocationAtWillEvidence.json');
 writeFileSync(atwillPath,JSON.stringify({frozenRevision,rules,entryHashes}));
 writeFileSync(join(web,'src/tracked.ts'),'export const value=1;\n');
 writeFileSync(join(web,'.gitignore'),'src/ignored.ts\n');
 const git=(...args:string[])=>execFileSync('git',args,{cwd:web,stdio:'pipe'});
 git('init','-q');git('add','.');git('-c','user.name=Audit fixture','-c','user.email=fixture@example.invalid','commit','-qm','Fixture');
 const row={url:'https://5e.kiwee.top/data/optionalfeatures.json',path:'optionalfeatures.json',sha256:inputs['optionalfeatures.json']};
 const index=(rows:unknown[])=>writeFileSync(join(input,'index.json'),JSON.stringify({rows}));
 index([row]);writeFileSync(join(input,'optionalfeatures.json'),'{}');
 const reject=(message:string)=>{
  const result=spawnSync(process.execPath,['--experimental-strip-types',script,web,input,output],{encoding:'utf8'});
  expect(result.status).not.toBe(0);expect(result.stderr+result.stdout).toContain(message);expect(existsSync(output)).toBe(false);
 };
 return {root,web,input,output,row,index,evidencePath,atwillPath,git,reject,close:()=>rmSync(root,{recursive:true,force:true})};
}
for(const state of ['unstaged','staged','untracked','ignored'])it(`refuses ${state} consumer src before bundling`,()=>{
 const f=fixture();try{
  if(state==='untracked'||state==='ignored')writeFileSync(join(f.web,`src/${state}.ts`),'export const unexpected=true;');
  else {writeFileSync(join(f.web,'src/tracked.ts'),'export const value=2;');if(state==='staged')f.git('add','src/tracked.ts');}
  f.reject('Consumer src must be clean');
 }finally{f.close();}
});
for(const [label,alter,reason] of [
 ['revision',(e:any)=>{e.frozenRevision='0'.repeat(40);},'Consumer source revision'],
 ['canonical hashes',(e:any)=>{e.inputs['optionalfeatures.json']='0'.repeat(64);},'Consumer canonical input hashes'],
] as const)it(`refuses a clean consumer with changed ${label}`,()=>{
 const f=fixture();try{
  const evidence=JSON.parse(readFileSync(f.evidencePath,'utf8'));alter(evidence);writeFileSync(f.evidencePath,JSON.stringify(evidence));
  f.git('add','.');f.git('-c','user.name=Audit fixture','-c','user.email=fixture@example.invalid','commit','-qm','Changed binding');f.reject(reason);
 }finally{f.close();}
});
for(const count of [0,2])it(`refuses ${count} matching manifest entries`,()=>{
 const f=fixture();try{f.index(Array.from({length:count},()=>f.row));f.reject('Expected exactly one frozen input');}finally{f.close();}
});
for(const path of ['../outside.json','/tmp/outside.json'])it(`refuses manifest path escape: ${path}`,()=>{
 const f=fixture();try{f.index([{...f.row,path}]);f.reject('Input must remain inside frozen directory');}finally{f.close();}
});
it('refuses a frozen-input symlink outside the input directory',()=>{
 const f=fixture();try{
  writeFileSync(join(f.root,'outside.json'),'{}');rmSync(join(f.input,'optionalfeatures.json'));symlinkSync(join(f.root,'outside.json'),join(f.input,'optionalfeatures.json'));
  f.reject('Resolved input must remain inside frozen directory');
 }finally{f.close();}
});
it('refuses modified source bytes even when the manifest claims the expected hash',()=>{
 const f=fixture();try{f.reject('Frozen input mismatch optionalfeatures.json');}finally{f.close();}
});

for(const [label,alter,reason] of [
 ['source revision',(e:any)=>{e.frozenRevision='0'.repeat(40);},'Consumer at-will source revision'],
 ['missing rule',(e:any)=>{e.rules.pop();},'Consumer exactly three reviewed at-will identities'],
 ['extra rule',(e:any)=>{e.rules.push(e.rules[0]);},'Consumer exactly three reviewed at-will identities'],
 ['wrong PHB identity',(e:any)=>{e.rules[0].reference='Fiendish Vigor|XPHB';},'Consumer exactly three reviewed at-will identities'],
 ['wrong spell identity',(e:any)=>{e.rules[0].spellReference='False Life|XPHB';},'Consumer exact at-will mechanical evidence'],
 ['wrong native spell level',(e:any)=>{e.rules[0].spellLevel=2;},'Consumer exact at-will mechanical evidence'],
 ['invented Fiendish prerequisite',(e:any)=>{e.rules[0].requiredClassLevel=2;},'Consumer exact at-will mechanical evidence'],
 ['wrong level-15 prerequisite',(e:any)=>{e.rules[1].requiredClassLevel=14;},'Consumer exact at-will mechanical evidence'],
 ['missing level-15 prerequisite',(e:any)=>{delete e.rules[2].requiredClassLevel;},'Consumer exact at-will mechanical evidence'],
 ['invented dual payment',(e:any)=>{e.rules[0].payment='pact-and-use';},'Consumer exact at-will mechanical evidence'],
 ['removed self-only limit',(e:any)=>{e.rules[0].selfOnly=false;},'Consumer exact at-will mechanical evidence'],
 ['invented Arcane Eye self-only limit',(e:any)=>{e.rules[2].selfOnly=true;},'Consumer exact at-will mechanical evidence'],
 ['invocation hash',(e:any)=>{e.entryHashes['Fiendish Vigor|PHB']='0'.repeat(64);},'Consumer independently reviewed invocation hash'],
 ['spell hash',(e:any)=>{e.entryHashes['Arcane Eye|PHB']='0'.repeat(64);},'Consumer independently reviewed spell hash'],
] as const)it(`refuses changed at-will ${label} before touching frozen inputs`,()=>{
 const f=fixture();try{
  const evidence=JSON.parse(readFileSync(f.atwillPath,'utf8'));alter(evidence);writeFileSync(f.atwillPath,JSON.stringify(evidence));
  f.git('add','.');f.git('-c','user.name=Audit fixture','-c','user.email=fixture@example.invalid','commit','-qm','Changed at-will binding');f.reject(reason);
 }finally{f.close();}
});
