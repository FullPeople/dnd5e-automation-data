import {readFile,writeFile,mkdir,rename,rm,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join,relative} from 'node:path';
import {deriveCorpus} from '../derive/index.ts';
import {STATIC_PATHS,FOUNDRY_PATHS,type InputFile,type InputManifest} from '../fetch/manifest.ts';
import {publicArtifact} from '../validate/index.ts';
import {coverage,coverageMarkdown} from '../report/coverage.ts';
import type {CorpusBody} from '../report/inventory.ts';
import aliases from '../../aliases/identities.json' with {type:'json'};
import corrections from '../../aliases/input-corrections.json' with {type:'json'};
import {TOOL_VERSION} from '../version.ts';

const args=process.argv.slice(2),allowed=new Set(['--data','--out','--fetched-at']);
function option(key:string,fallback:string):string {
  const at=args.indexOf(key);return at<0?fallback:args[at+1];
}
function safePath(path:string):boolean {
  return typeof path==='string'&&path.endsWith('.json')&&!/^[a-z]+:|^[\\/]|[?#\\]/i.test(path)&&!path.split('/').some(part=>!part||part==='.'||part==='..');
}
const stable=(value:unknown)=>JSON.stringify(value,null,2)+'\n';
const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

export async function generate():Promise<void> {
  if(args.length%2||args.some((value,index)=>index%2===0&&(!allowed.has(value)||args.indexOf(value)!==index))||args.some((value,index)=>index%2===1&&(!value||value.startsWith('--'))))throw Error('Use --data DIR --out DIR [--fetched-at ISO_TIMESTAMP]');
  const data=await realpath(resolve(option('--data','./data'))),out=resolve(option('--out','./data/generated'));
  if(out===data)throw Error('Output must not replace the source data directory');
  const paths=new Map<string,InputFile['role']>([['data/changelog.json','version'],...STATIC_PATHS.map(path=>[path,'catalog'] as const),...FOUNDRY_PATHS.map(path=>[path,'foundry'] as const)]);
  const loaded=new Map<string,{bytes:Buffer;body:any}>();
  async function load(path:string):Promise<any> {
    if(!safePath(path)||!path.startsWith('data/'))throw Error('Unsafe input path');
    const file=await realpath(join(data,path.slice(5))),within=relative(data,file);
    if(within.startsWith('..')||resolve(data,within)!==file)throw Error('Input escapes the data directory');
    const bytes=await readFile(file),body=JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,''));
    loaded.set(path,{bytes,body});return body;
  }
  for(const category of ['class','spells']) {
    const path=`data/${category}/index.json`,index=await load(path);paths.set(path,'index');
    const values=[...new Set(Object.values(index))];
    if(!values.length||values.some(value=>typeof value!=='string'||!/^[\w.-]+\.json$/.test(value)))throw Error(`Invalid ${category} index`);
    for(const name of values)paths.set(`data/${category}/${name}`,'catalog');
  }
  for(const path of paths.keys())if(!loaded.has(path))await load(path);
  let previous:InputManifest|undefined;
  try {previous=JSON.parse(await readFile(join(out,'gendata-automation-inputs-sha256.json'),'utf8'));}catch(error:any){if(error.code!=='ENOENT')throw error;}
  const explicitDate=option('--fetched-at',''),now=explicitDate||new Date().toISOString();
  if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(now)||new Date(now).toISOString()!==now)throw Error('Invalid fetched-at ISO timestamp');
  const inputs:InputFile[]=[...paths].sort(([a],[b])=>a.localeCompare(b)).map(([path,role])=>{
    const bytes=loaded.get(path)!.bytes,sha256=hash(bytes),prior=previous?.inputs.find(input=>input.path===path&&input.sha256===sha256);
    return {namespace:'kiwee',path,role,url:`https://5e.kiwee.top/${path}`,sha256,bytes:bytes.length,fetchedAt:explicitDate||prior?.fetchedAt||now};
  });
  const manifest:InputManifest={toolVersion:TOOL_VERSION,inputs},files:CorpusBody[]=inputs.map(input=>({input,body:loaded.get(input.path)!.body}));
  const result=deriveCorpus(files,manifest,aliases,corrections),artifact=publicArtifact(result.envelope),report=coverage(artifact,result.diagnostics,'kiwee-local-structured-foundry-draft');
  const outputs=new Map<string,string>();
  for(const kind of [...new Set(artifact.records.map(record=>record.identity.kind))].sort())outputs.set(`gendata-automation-${kind.toLowerCase()}.json`,stable({...artifact,records:artifact.records.filter(record=>record.identity.kind===kind)}));
  // Validate globally before splitting: references may target another kind's file.
  outputs.set('gendata-automation-inputs-sha256.json',stable(manifest));
  outputs.set('gendata-automation-coverage.json',stable(report));
  outputs.set('gendata-automation-coverage.md',coverageMarkdown(report));
  outputs.set('gendata-automation-unsupported.json',stable({versionLock:artifact.versionLock,foundryOrphans:result.foundry.filter(row=>!row.matched),diagnostics:result.diagnostics,records:artifact.records.filter(row=>row.unsupported.length).map(row=>({identity:row.identity,unsupported:row.unsupported}))}));
  outputs.set('gendata-automation-manifest.json',stable({schemaVersion:1,protocol:3,versionLock:artifact.versionLock,phase:'structured-foundry-draft',completeAutomationClaim:false,files:[...outputs].map(([name,text])=>({name,bytes:Buffer.byteLength(text),sha256:hash(Buffer.from(text))}))}));
  // Only owned filenames are published; all input parsing/derivation/validation
  // completes first. A source failure leaves the previous generation untouched.
  await mkdir(out,{recursive:true});const stage=join(out,`.automation-stage-${process.pid}`),backup=join(stage,'previous'),published:string[]=[],previousNames=new Set<string>();await mkdir(backup,{recursive:true});
  try {
    for(const [name,text]of outputs)await writeFile(join(stage,name),text);
    // The manifest is last, so consumers never see a new manifest before its files.
    for(const name of outputs.keys()) {
      try {await rename(join(out,name),join(backup,name));previousNames.add(name);}catch(error:any){if(error.code!=='ENOENT')throw error;}
      published.push(name);await rename(join(stage,name),join(out,name));
    }
  }catch(error){
    for(const name of published.reverse()) {
      await rm(join(out,name),{force:true});if(previousNames.has(name))await rename(join(backup,name),join(out,name));
    }
    throw error;
  }finally{await rm(stage,{recursive:true,force:true});}
  console.log(stable({out,records:artifact.records.length,files:outputs.size,version:artifact.versionLock.kiweeChangelogVersion,verdict:'needsAnnotation',completeAutomationClaim:false}).trim());
}

generate().catch(error=>{console.error(`Automation generation failed; previous output retained: ${error.message}`);process.exitCode=1;});
