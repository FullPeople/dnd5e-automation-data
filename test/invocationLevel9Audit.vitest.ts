/** Binding failures must happen before bundling or writing a success report.
 * These tiny fixtures contain no source snapshots or real character data. */
import {it,expect} from 'vitest';
import {execFileSync,spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';

const script=resolve('scripts/audit_invocation_level9.ts');
const frozenRevision='e2623b204ddbdf2bcfa8317acfc962de89c676e2';
const inputs={
 'optionalfeatures.json':'031970dfac1770a548549bd30535319c2493c47ebeaedfdb6a601651bbfc3844',
 'class/class-warlock.json':'34721a04db792923cf0a19fbab3f90616093d9f6519a7cfe6f81a9eb52e775d4',
 'spells/spells-phb.json':'e1f2221020cfb5d31995c99b78dc09435c9962476ef1cef81b52399e6df0263d',
};
const prerequisite=[{level:{level:9,class:{ENG_name:'Warlock',name:'魔契师'}}}];
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'invocation-level9-binding-')),web=join(root,'web'),input=join(root,'inputs'),output=join(root,'report.json');
 mkdirSync(join(web,'src/core/automation'),{recursive:true});mkdirSync(input);
 const evidencePath=join(web,'src/core/automation/invocationEvidence.json');
 writeFileSync(evidencePath,JSON.stringify({frozenRevision,inputs,level9Prerequisite:prerequisite}));
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
 return {root,web,input,output,row,index,evidencePath,git,reject,close:()=>rmSync(root,{recursive:true,force:true})};
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
 ['prerequisite source',(e:any)=>{e.level9Prerequisite[0].level.class.source='PHB';},'Consumer exact level-9 prerequisite'],
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
