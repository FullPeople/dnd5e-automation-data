import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,renameSync,unlinkSync,lstatSync,existsSync,realpathSync} from 'node:fs';
import {resolve,join,dirname,isAbsolute,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {Writable} from 'node:stream';

// Vitest 5.0.1 public runtime collection API. Do not substitute static CLI
// listing, display fullName, or a separator rewrite for JSON-reporter identity.
export const VITEST_VERSION='5.0.1';
export const ERROR_CODES=Object.freeze(['ARGUMENT','PATH','NETWORK_BOUNDARY','DEPENDENCY','API','COLLECTION','CLOSE','UNHANDLED','SCHEMA','FILE_SET','MODE','MODULE_ERROR','TASK_RESULT','NO_TESTS','WRITE']);
const fail=code=>{throw Object.assign(Error('EXPANDED_COLLECTION_'+code),{code});};
const plain=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const sha=value=>createHash('sha256').update(value).digest('hex');
const safeFile=value=>typeof value==='string'&&/^tests\/[A-Za-z0-9_./-]+\.test\.ts$/.test(value)&&!value.split('/').some(part=>part==='..'||part==='.'||part==='');
function validateOptions(options){
 if(!plain(options)||Object.keys(options).sort().join(',')!=='files,output,webRoot'||typeof options.webRoot!=='string'||typeof options.output!=='string'||![options.webRoot,options.output].every(path=>isAbsolute(path)&&resolve(path)===path&&!path.includes('\0'))||!Array.isArray(options.files)||!options.files.length||options.files.some(file=>!safeFile(file))||new Set(options.files).size!==options.files.length)fail('ARGUMENT');
 return options;
}
export function parseArgs(args){
 if(!Array.isArray(args)||args.length!==6)fail('ARGUMENT');
 const flags={'--web-root':'webRoot','--output':'output','--files-json':'files'},options={};
 for(let i=0;i<args.length;i+=2){const key=flags[args[i]],value=args[i+1];if(!key||Object.hasOwn(options,key)||typeof value!=='string'||!value||value.startsWith('-')||value.includes('\0'))fail('ARGUMENT');if(key==='files'){try{options.files=JSON.parse(value);}catch{fail('ARGUMENT');}}else options[key]=value;}
 return validateOptions(options);
}
function receipt(errorCode=null,instances=[],files=[]){
 return {schemaVersion:1,kind:'actual-runtime-test-collection',mode:'runtime',testBodiesExecuted:false,accepted:errorCode===null,instances,files,counts:{files:files.length,instances:instances.length,distinctIdentities:new Set(instances.map(row=>row.file+'\0'+row.identitySha256)).size},errorCode};
}
function errorCode(error,fallback){return ERROR_CODES.includes(error?.code)?error.code:fallback;}

/** Pure parser of RAW task graphs, not Vitest's human/display wrappers. Extra
 * diagnostic/meta fields are deliberately never copied or stringified. Identity
 * fields, graph ownership, modes and result schema are checked fail-closed. */
export function parseRawCollection({webRoot,files,rawFiles,unhandledErrors}){
 try{
  validateOptions({webRoot,output:join(webRoot,'.collection-parser-output.json'),files});
  if(!Array.isArray(unhandledErrors))fail('SCHEMA');if(unhandledErrors.length)fail('UNHANDLED');
  if(!Array.isArray(rawFiles))fail('SCHEMA');if(!rawFiles.length)fail('NO_TESTS');
  const wanted=new Set(files),seenFiles=new Set(),seenTasks=new Set(),instances=[],summaries=[];
  for(const file of rawFiles){
   if(!plain(file)||file.type!=='suite'||typeof file.filepath!=='string'||!isAbsolute(file.filepath)||resolve(file.filepath)!==file.filepath)fail('SCHEMA');
   const path=relative(webRoot,file.filepath);if(!safeFile(path)||!wanted.has(path)||seenFiles.has(path))fail('FILE_SET');seenFiles.add(path);
   if(file.file!==file||file.suite!==undefined||file.projectName!==undefined&&file.projectName!=='')fail('SCHEMA');
   const start=instances.length;
   const visit=(task,parent)=>{
    if(!plain(task)||seenTasks.has(task)||!['suite','test'].includes(task.type)||typeof task.id!=='string'||!task.id||typeof task.name!=='string'||task.name.length>4000)fail('SCHEMA');seenTasks.add(task);
    if(task.containsOnly!==undefined&&typeof task.containsOnly!=='boolean')fail('SCHEMA');if(task.mode!=='run'||task.containsOnly===true)fail('MODE');
    if(task.result!==undefined){if(plain(task.result)&&(task.result.state==='fail'||Array.isArray(task.result.errors)&&task.result.errors.length))fail('MODULE_ERROR');fail('TASK_RESULT');}
    if(task!==file&&(task.file!==file||task.suite!==(parent===file?undefined:parent)))fail('SCHEMA');
    if(task.type==='suite'){
     if(!Array.isArray(task.tasks))fail('SCHEMA');for(const child of task.tasks)visit(child,task);
    }else{
     if(task.tasks!==undefined)fail('SCHEMA');
     const names=[],chain=new Set();let ancestor=task.suite;
     while(ancestor){if(chain.has(ancestor)||ancestor===file||ancestor.type!=='suite'||typeof ancestor.name!=='string')fail('SCHEMA');chain.add(ancestor);names.push(ancestor.name);ancestor=ancestor.suite;}
     names.reverse();const fullName=task.name?[...names,task.name].join(' '):names.join(' ');if(!fullName||fullName.length>4000)fail('SCHEMA');
     instances.push({file:path,identitySha256:sha(fullName)});
    }
   };
   visit(file,undefined);const own=instances.slice(start);if(!own.length)fail('NO_TESTS');summaries.push({file:path,instances:own.length,distinctIdentities:new Set(own.map(row=>row.identitySha256)).size});
  }
  if(seenFiles.size!==wanted.size)fail('FILE_SET');
  instances.sort((a,b)=>a.file.localeCompare(b.file)||a.identitySha256.localeCompare(b.identitySha256));summaries.sort((a,b)=>a.file.localeCompare(b.file));return receipt(null,instances,summaries);
 }catch(error){return receipt(errorCode(error,'SCHEMA'));}
}
function noSymlink(path){for(let at=path;;at=dirname(at)){if(existsSync(at)&&lstatSync(at).isSymbolicLink())fail('PATH');if(at===dirname(at))break;}}
function boundary(){const key=Symbol.for('dnd.offlineCatalogFetch.v1'),descriptor=Object.getOwnPropertyDescriptor(globalThis,key),guard=globalThis[key];if(!descriptor||descriptor.writable!==false||descriptor.configurable!==false||!Object.isFrozen(guard)||guard.version!==1||globalThis.fetch!==guard.deny||!Array.isArray(guard.unexpected)||guard.unexpected.length)fail('NETWORK_BOUNDARY');}
function validateOutput(options){noSymlink(options.output);if(!lstatSync(dirname(options.output)).isDirectory()||existsSync(options.output))fail('PATH');}
function validatePaths(options){
 validateOutput(options);noSymlink(options.webRoot);if(!lstatSync(options.webRoot).isDirectory()||realpathSync(options.webRoot)!==options.webRoot)fail('PATH');
 const protectedPaths=[join(options.webRoot,'vitest.config.ts'),...options.files.map(file=>join(options.webRoot,file))];for(const path of protectedPaths){noSymlink(path);if(!lstatSync(path).isFile())fail('PATH');}if(protectedPaths.includes(options.output))fail('PATH');
}
function writeReceipt(output,result){const temporary=output+'.tmp-'+process.pid;try{writeFileSync(temporary,JSON.stringify(result)+'\n',{flag:'wx',mode:0o600});renameSync(temporary,output);}catch{try{unlinkSync(temporary);}catch{}fail('WRITE');}}
export async function collectRoster(options){
 let ctx,result=receipt('COLLECTION'),closeError=false;
 try{
  validateOptions(options);validatePaths(options);boundary();
  const directory=join(options.webRoot,'node_modules/vitest'),pkg=JSON.parse(readFileSync(join(directory,'package.json'),'utf8'));if(pkg.name!=='vitest'||pkg.version!==VITEST_VERSION)fail('DEPENDENCY');
  const api=await import(pathToFileURL(join(directory,'dist/node.js')).href);if(typeof api.createVitest!=='function')fail('API');
  // Discard framework/module diagnostics rather than exposing arbitrary test
  // names, rule snapshots, import failures, console payloads or source stacks.
  const sink=new Writable({write(_chunk,_encoding,done){done();}});
  ctx=await api.createVitest('test',{root:options.webRoot,config:join(options.webRoot,'vitest.config.ts'),watch:false,run:true,maxWorkers:1,fileParallelism:false,retry:0},{},{stdout:sink,stderr:sink});
  const collected=await ctx.collect(options.files,{staticParse:false});
  if(!plain(collected)||!Array.isArray(collected.testModules)||!Array.isArray(collected.unhandledErrors)||typeof ctx.state?.getFiles!=='function'||typeof ctx.state?.getUnhandledErrors!=='function')fail('API');
  result=parseRawCollection({webRoot:options.webRoot,files:options.files,rawFiles:ctx.state.getFiles(),unhandledErrors:[...collected.unhandledErrors,...ctx.state.getUnhandledErrors()]});
 }catch(error){result=receipt(errorCode(error,'COLLECTION'));}
 finally{if(ctx){try{await ctx.close();}catch{closeError=true;}try{if(ctx.state.getUnhandledErrors().length)result=receipt('UNHANDLED');}catch{closeError=true;}}}
 if(closeError)result=receipt('CLOSE');try{boundary();}catch{result=receipt('NETWORK_BOUNDARY');}
 // Invalid paths/arguments never become an alternate output write channel.
 validateOptions(options);validateOutput(options);writeReceipt(options.output,result);return result;
}
export async function main(args=process.argv.slice(2)){
 try{const options=parseArgs(args),result=await collectRoster(options);if(!result.accepted)process.exitCode=1;return result;}
 catch(error){process.stderr.write('EXPANDED_COLLECTION_'+errorCode(error,'COLLECTION')+'\n');process.exitCode=1;}
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)await main();
