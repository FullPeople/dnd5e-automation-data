import {beforeAll,afterAll,it,expect} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,readdirSync,rmSync,symlinkSync,unlinkSync,cpSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {STATIC_PATHS,FOUNDRY_PATHS} from '../src/fetch/manifest.ts';
import {validateAutomation} from '../src/validate/index.ts';
import {createIdentity} from '../src/identity.ts';
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
  const directory=join(data,'class'),outside=join(work,'outside');
  cpSync(directory,outside,{recursive:true});
  rmSync(directory,{recursive:true});symlinkSync(outside,directory,'junction');
  expect(()=>run()).toThrow('Input escapes the data directory');expect(readFileSync(join(out,'gendata-automation-manifest.json'))).toEqual(before);
  unlinkSync(directory);cpSync(outside,directory,{recursive:true});
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
it('source-built and checked-in generators retain collisions as diagnostics without losing valid sibling groups',()=>{
 source('data/class/class-synthetic.json',{class:[{ENG_name:'Synthetic Collision Class',source:'PHB',optionalfeatureProgression:[
  {featureType:['EI'],progression:{'1':1,'01':2}},
  {featureType:['PB'],progression:{'3':1}},
 ]}]});
 run('--fetched-at','2026-10-03T00:00:00.000Z');
 const filename='gendata-automation-class.json',built=JSON.parse(readFileSync(join(out,filename),'utf8'));
 expect(built.records).toHaveLength(1);
 expect(built.records[0]).toMatchObject({verdict:'needsAnnotation',autoGenerated:true,unsupported:[{family:'featureProgression',code:'optional-progression-shape',ref:'optionalfeatureProgression'}]});
 expect(built.records[0].mechanics.grants).toEqual([{type:'feature',key:'optionalfeature:1',atLevel:3,choose:{count:1,filter:{kind:'optionalfeature',featureType:['PB']}},choiceProgression:[{level:3,count:1}]}]);
 const checked=join(work,'checked-collision-output');
 execFileSync(process.execPath,[fileURLToPath(new URL('../generate-automation.mjs',import.meta.url)),'--data',data,'--out',checked,'--fetched-at','2026-10-03T00:00:00.000Z'],{cwd:work,stdio:'pipe'});
 expect(JSON.parse(readFileSync(join(checked,filename),'utf8'))).toEqual(built);
});
it('source-built and checked-in generators preserve independent feat quotas and their eligibility gap',()=>{
 const feats=[0,1].map(index=>({ENG_name:`Synthetic Progression Feat ${index}`,source:'XPHB',category:'FS:P'}));
 source('data/feats.json',{feat:feats});
 const options=feats.map(raw=>createIdentity({kind:'feat',source:raw.source,engName:raw.ENG_name}).key).sort();
 source('data/class/class-synthetic.json',{class:[{ENG_name:'Synthetic Feat Class',source:'XPHB',featProgression:[{category:['FS:P'],progression:{5:1,11:2}}]}]});
 run('--fetched-at','2026-10-03T00:00:00.000Z');
 const filename='gendata-automation-class.json',built=JSON.parse(readFileSync(join(out,filename),'utf8'));
 expect(built.records).toHaveLength(1);expect(built.records[0]).toMatchObject({verdict:'needsAnnotation',autoGenerated:true,unsupported:[{family:'featGrant',code:'feat-progression-eligibility',ref:'featProgression'}]});
 expect(built.records[0].mechanics.grants).toEqual([5,11].map((level,index)=>({type:'feat',key:`featProgression:0:${level}`,atLevel:level,choose:{count:index+1,from:options}})));
 const published=join(work,'checked-in-output');
 execFileSync(process.execPath,[fileURLToPath(new URL('../generate-automation.mjs',import.meta.url)),'--data',data,'--out',published,'--fetched-at','2026-10-03T00:00:00.000Z'],{cwd:work,stdio:'pipe'});
 expect(JSON.parse(readFileSync(join(published,filename),'utf8'))).toEqual(built);
});
it('source-built and checked-in generators preserve the declared optional-feature kind beside a same-name class feature',()=>{
 const className='Synthetic Typed Class',feature=(name:string)=>({name,ENG_name:name,source:'PHB',className,classSource:'PHB',level:3,entries:[] as unknown[]});
 source('data/class/class-synthetic.json',{class:[{name:className,ENG_name:className,source:'PHB'}],classFeature:[
  {...feature('Synthetic Choice'),entries:[{type:'options',count:1,entries:[{type:'refOptionalfeature',optionalfeature:'Synthetic Option|PHB'}]}]},
  feature('Synthetic Option'),
 ]});
 source('data/optionalfeatures.json',{optionalfeature:[{name:'Synthetic Option',ENG_name:'Synthetic Option',source:'PHB',featureType:['EI'],entries:[]}]});
 run('--fetched-at','2026-10-03T00:00:00.000Z');
 const filename='gendata-automation-classfeature.json',built=JSON.parse(readFileSync(join(out,filename),'utf8'));
 const choice=built.records.find((r:any)=>r.identity.engName==='Synthetic Choice'),key=createIdentity({kind:'optionalfeature',source:'PHB',engName:'Synthetic Option'}).key;
 expect(choice).toMatchObject({verdict:'needsAnnotation',autoGenerated:true,unsupported:[]});
 expect(choice.mechanics.grants).toEqual([{type:'feature',key:'text-option:entries:0',choose:{count:1,from:[key]}}]);
 const checked=join(work,'checked-kind-output');
 execFileSync(process.execPath,[fileURLToPath(new URL('../generate-automation.mjs',import.meta.url)),'--data',data,'--out',checked,'--fetched-at','2026-10-03T00:00:00.000Z'],{cwd:work,stdio:'pipe'});
 expect(JSON.parse(readFileSync(join(checked,filename),'utf8'))).toEqual(built);
});

it('both generators preserve declared source identifiers and reject invalid replacements before changing output',()=>{
 const fixture=JSON.parse(readFileSync(new URL('../fixtures/shared/source-identifiers.json',import.meta.url),'utf8')) as {acceptedSources:string[]};
 const paths=['data/feats.json','data/class/class-synthetic.json','data/spells/spells-synthetic.json','data/optionalfeatures.json'];
 const originals=paths.map(path=>readFileSync(join(work,path)));
 try{
  for(const path of paths.slice(1))source(path,{});
  const feats=fixture.acceptedSources.map(source=>({ENG_name:'Authored source-identity sentinel',source,ability:[{str:1}]}));
  source(paths[0],{feat:feats});
  const checked=join(work,'checked-source-identity-output'),generators=[[script,out],[fileURLToPath(new URL('../generate-automation.mjs',import.meta.url)),checked]];
  const results=generators.map(([generator,target])=>{
   execFileSync(process.execPath,[generator,'--data',data,'--out',target,'--fetched-at','2026-11-06T00:00:00.000Z'],{cwd:work,stdio:'pipe'});
   const body=JSON.parse(readFileSync(join(target,'gendata-automation-feat.json'),'utf8'));
   validateAutomation(body);expect(body.records).toHaveLength(feats.length);
   expect(body.records.every((row:any)=>row.verdict==='needsAnnotation'&&row.autoGenerated)).toBe(true);
   expect(body.records.map((row:any)=>row.identity.source).sort()).toEqual(fixture.acceptedSources.map(source=>source.toUpperCase()).sort());
   expect(new Set(body.records.map((row:any)=>row.identity.key)).size).toBe(feats.length);
   return body;
  });
  expect(results[1]).toEqual(results[0]);
  source(paths[0],{feat:[{...feats[0],source:'BOOK|PHB'}]});
  for(const [generator,target] of generators){
   const prior=Object.fromEntries(readdirSync(target).map(name=>[name,readFileSync(join(target,name))]));
   expect(()=>execFileSync(process.execPath,[generator,'--data',data,'--out',target],{cwd:work,stdio:'pipe'})).toThrow();
   expect(readdirSync(target).sort()).toEqual(Object.keys(prior).sort());
   for(const [name,bytes] of Object.entries(prior))expect(readFileSync(join(target,name))).toEqual(bytes);
  }
 }finally{paths.forEach((path,index)=>writeFileSync(join(work,path),originals[index]));}
});

it('both generators preserve extended cumulative books and native immunity independently of an unrelated catalog condition',()=>{
 const paths=['data/feats.json','data/foundry-feats.json','data/class/class-synthetic.json','data/class/foundry.json','data/spells/spells-synthetic.json','data/optionalfeatures.json','data/conditionsdiseases.json'];
 const originals=paths.map(path=>readFileSync(join(work,path))),generators=[script,fileURLToPath(new URL('../generate-automation.mjs',import.meta.url))],featSnapshots:any[]=[];
 try{
  for(const path of paths)source(path,{});
  source('data/class/class-synthetic.json',{class:[{ENG_name:'Authored Book Owner',source:'PHB',spellsKnownProgressionFixed:Array(20).fill(100)}]});
  source('data/feats.json',{feat:[{ENG_name:'Authored Immunity Owner',source:'PHB'}]});
  source('data/foundry-feats.json',{feat:[{ENG_name:'Authored Immunity Owner',source:'PHB',migrationVersion:3,effects:[{transfer:true,changes:[{key:'system.traits.ci.value',mode:'ADD',value:'diseased'}]}]}]});
  for(const withForeign of [false,true]){
   source('data/conditionsdiseases.json',withForeign?{condition:[{ENG_name:'Diseased',source:'HB'}]}:{});
   const results=generators.map((generator,index)=>{
    const target=join(work,`native-book-${withForeign}-${index}`);execFileSync(process.execPath,[generator,'--data',data,'--out',target,'--fetched-at','2026-11-06T00:00:00.000Z'],{cwd:work,stdio:'pipe'});
    const book=JSON.parse(readFileSync(join(target,'gendata-automation-class.json'),'utf8')),feat=JSON.parse(readFileSync(join(target,'gendata-automation-feat.json'),'utf8'));
    validateAutomation(book);validateAutomation(feat);expect(book.records).toHaveLength(1);expect(book.records[0].mechanics.classModel.bookProgression).toEqual(Array.from({length:20},(_,i)=>(i+1)*100));
    expect(feat.records).toHaveLength(1);expect(feat.records[0].mechanics.modifiers).toEqual([{target:'conditionImmune:diseased',op:'set',value:true}]);expect(feat.records[0].mechanics.effects[0].deferred).toBe(true);
    expect([...book.records,...feat.records].every(row=>row.verdict==='needsAnnotation')).toBe(true);return {book,feat};
   });
   expect(results[1]).toEqual(results[0]);featSnapshots.push(results[0].feat.records);
  }
  expect(featSnapshots[1]).toEqual(featSnapshots[0]);
 }finally{paths.forEach((path,index)=>writeFileSync(join(work,path),originals[index]));}
});
