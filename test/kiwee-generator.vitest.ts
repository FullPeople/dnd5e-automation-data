import {beforeAll,afterAll,it,expect} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,readdirSync,rmSync,symlinkSync,unlinkSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {STATIC_PATHS,FOUNDRY_PATHS} from '../src/fetch/manifest.ts';
import {validateAutomation} from '../src/validate/index.ts';
const root=new URL('..',import.meta.url),work=mkdtempSync(join(tmpdir(),'dnd-kiwee-generator-')),script=join(work,'generate-automation.mjs'),data=join(work,'data'),out=join(data,'generated'),hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
function source(path:string,body:unknown){const file=join(work,path);mkdirSync(dirname(file),{recursive:true});writeFileSync(file,JSON.stringify(body)+'\n');}
function run(...extra:string[]){return execFileSync(process.execPath,[script,'--data',data,'--out',out,...extra],{cwd:work,stdio:'pipe',encoding:'utf8'});}
beforeAll(()=>{
 execFileSync(process.execPath,['scripts/kiwee-bundle.mjs',script],{cwd:root,stdio:'pipe'});
 for(const path of [...STATIC_PATHS,...FOUNDRY_PATHS])source(path,{});
 source('data/changelog.json',[{ver:'synthetic-1',date:'2026-10-03'}]);
 source('data/class/index.json',{Synthetic:'class-synthetic.json'});source('data/class/class-synthetic.json',{});
 source('data/spells/index.json',{Synthetic:'spells-synthetic.json'});source('data/spells/spells-synthetic.json',{spell:[{ENG_name:'Synthetic Spell',name:'测试法术',source:'PHB',page:1,level:0,school:'V'}]});
 source('data/feats.json',{feat:[{ENG_name:'Synthetic Feat',name:'测试专长',source:'PHB',page:1,ability:[{str:1}],entries:['Synthetic publisher prose stays private.']} ]});
 source('data/foundry-feats.json',{feat:[{ENG_name:'Synthetic Feat',name:'测试专长',source:'PHB',migrationVersion:3}]});
},30000);
afterAll(()=>rmSync(work,{recursive:true,force:true}));
it('runs without node_modules, locks every local input and validates the combined mechanical files',()=>{
 expect(readdirSync(work)).not.toContain('node_modules');expect(JSON.parse(run('--fetched-at','2026-10-03T00:00:00.000Z'))).toMatchObject({records:2,version:'synthetic-1',completeAutomationClaim:false});
 const manifest=JSON.parse(readFileSync(join(out,'gendata-automation-manifest.json'),'utf8')),files=manifest.files.map((f:{name:string;sha256:string;bytes:number})=>{const bytes=readFileSync(join(out,f.name));expect(hash(bytes)).toBe(f.sha256);expect(bytes.length).toBe(f.bytes);return {name:f.name,body:bytes.toString('utf8')};});
 const kinds=files.filter((f:{name:string})=>/^gendata-automation-(feat|spell)\.json$/.test(f.name)).map((f:{body:string})=>JSON.parse(f.body));
 const envelope={...kinds[0],records:kinds.flatMap((part:any)=>part.records)};validateAutomation(envelope);expect(envelope.records).toHaveLength(2);expect(envelope.records.every((r:any)=>r.verdict==='needsAnnotation')).toBe(true);
 expect(JSON.stringify(envelope)).not.toMatch(/测试|Synthetic publisher prose/);expect(envelope.versionLock.kiweeChangelogDate).toBe('2026-10-03');expect(envelope.versionLock.inputs).toHaveLength(STATIC_PATHS.length+FOUNDRY_PATHS.length+5);
 const snapshot=Object.fromEntries(readdirSync(out).map(name=>[name,readFileSync(join(out,name))]));run();for(const [name,bytes]of Object.entries(snapshot))expect(readFileSync(join(out,name))).toEqual(bytes);
});
it('rejects traversing indices before changing prior output or unrelated generated data',()=>{
 const before=readFileSync(join(out,'gendata-automation-manifest.json'));writeFileSync(join(out,'gendata-other.json'),'unrelated');source('data/class/index.json',{Synthetic:'../outside.json'});
 expect(()=>run()).toThrow();expect(readFileSync(join(out,'gendata-automation-manifest.json'))).toEqual(before);expect(readFileSync(join(out,'gendata-other.json'),'utf8')).toBe('unrelated');expect(readdirSync(out).some(name=>name.startsWith('.automation-stage-'))).toBe(false);
 source('data/class/index.json',{Synthetic:'class-synthetic.json'});
});
it('rejects a source symlink outside data and malformed local JSON without replacing prior output',()=>{
 const file=join(data,'feats.json'),bytes=readFileSync(file),before=readFileSync(join(out,'gendata-automation-manifest.json'));
 if(process.platform==='win32'){
  const directory=join(data,'class'),index=readFileSync(join(directory,'index.json')),entry=readFileSync(join(directory,'class-synthetic.json')),outside=join(work,'outside');
  mkdirSync(outside);writeFileSync(join(outside,'index.json'),index);writeFileSync(join(outside,'class-synthetic.json'),entry);
  rmSync(directory,{recursive:true});symlinkSync(outside,directory,'junction');
  expect(()=>run()).toThrow('Input escapes the data directory');expect(readFileSync(join(out,'gendata-automation-manifest.json'))).toEqual(before);
  unlinkSync(directory);mkdirSync(directory);writeFileSync(join(directory,'index.json'),index);writeFileSync(join(directory,'class-synthetic.json'),entry);
 }else{
  const outside=join(work,'outside.json');writeFileSync(outside,bytes);rmSync(file);symlinkSync(outside,file,'file');
  expect(()=>run()).toThrow();expect(readFileSync(join(out,'gendata-automation-manifest.json'))).toEqual(before);rmSync(file);
 }
 writeFileSync(file,'{malformed');expect(()=>run()).toThrow();expect(readFileSync(join(out,'gendata-automation-manifest.json'))).toEqual(before);writeFileSync(file,bytes);
});
it('source-built and checked-in generators emit the same cumulative array quota as an annotation draft',()=>{
 const counts=[0,2,2,4,...Array(16).fill(4)];
 source('data/class/class-synthetic.json',{class:[{ENG_name:'Synthetic Array Class',source:'PHB',optionalfeatureProgression:[{featureType:['AI'],progression:counts}]}]});
 run('--fetched-at','2026-10-03T00:00:00.000Z');
 const filename='gendata-automation-class.json',built=JSON.parse(readFileSync(join(out,filename),'utf8'));
 expect(built.records).toHaveLength(1);expect(built.records[0]).toMatchObject({verdict:'needsAnnotation',autoGenerated:true,unsupported:[]});
 expect(built.records[0].mechanics.grants).toEqual([{type:'feature',key:'optionalfeature:0',atLevel:2,choose:{count:2,filter:{kind:'optionalfeature',featureType:['AI']}},choiceProgression:counts.map((count,index)=>({level:index+1,count}))}]);
 const published=join(work,'checked-in-output');
 execFileSync(process.execPath,[fileURLToPath(new URL('../generate-automation.mjs',import.meta.url)),'--data',data,'--out',published,'--fetched-at','2026-10-03T00:00:00.000Z'],{cwd:work,stdio:'pipe'});
 expect(JSON.parse(readFileSync(join(published,filename),'utf8'))).toEqual(built);
});
