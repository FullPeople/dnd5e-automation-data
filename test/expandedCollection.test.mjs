import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parseArgs,parseRawCollection,ERROR_CODES} from '../scripts/expanded_collect_roster.mjs';
const root='/authored-web',path='tests/authored.test.ts',hash=value=>createHash('sha256').update(value).digest('hex');
function graph(){
 const file={id:'file',type:'suite',name:path,filepath:root+'/'+path,mode:'run',tasks:[],projectName:undefined};file.file=file;
 let nextId=0;const add=(parent,name,type='test')=>{const task={id:'task-'+(++nextId),type,name,mode:'run',file,suite:parent===file?undefined:parent};if(type==='suite')task.tasks=[];parent.tasks.push(task);return task;};
 const suite=add(file,'literal > suite','suite');add(suite,'nested > title');add(file,'root > title');for(let i=0;i<3;i++)add(file,'same duplicate');return{file,add};
}
const parse=(file,extra={})=>parseRawCollection({webRoot:root,files:[path],rawFiles:[file],unhandledErrors:[],...extra});
test('strict CLI accepts only exact root/output/file arguments',()=>{
 const args=['--web-root',root,'--output','/private/roster.json','--files-json',JSON.stringify([path])];assert.deepEqual(parseArgs(args),{webRoot:root,output:'/private/roster.json',files:[path]});
 for(const bad of [args.slice(0,-2),[...args,'--url','https://invalid.example'],[...args.slice(0,4),'--files-json','not-json'],[...args.slice(0,4),'--files-json','["tests/../escape.test.ts"]'],[...args.slice(0,4),'--files-json',JSON.stringify([path,path])],['--web-root','relative','--output','/private/roster.json','--files-json',JSON.stringify([path])]])assert.throws(()=>parseArgs(bad),/^Error: EXPANDED_COLLECTION_ARGUMENT$/);
});
test('raw JSON identity includes literal greater-than names and preserves all three duplicate instances',()=>{
 const {file}=graph(),result=parse(file);assert.equal(result.accepted,true);assert.deepEqual(result.counts,{files:1,instances:5,distinctIdentities:3});assert.deepEqual(result.files,[{file:path,instances:5,distinctIdentities:3}]);
 assert.equal(result.instances.filter(row=>row.identitySha256===hash('same duplicate')).length,3);assert.ok(result.instances.some(row=>row.identitySha256===hash('literal > suite nested > title')));assert.ok(result.instances.some(row=>row.identitySha256===hash('root > title')));assert.ok(!JSON.stringify(result).includes('literal'));assert.equal(result.testBodiesExecuted,false);
});
test('unknown task schemas, result bodies and broken raw ancestry fail closed without leaking payloads',()=>{
 for(const mutate of [f=>{f.tasks[0].type='unknown';},f=>{f.tasks[0].tasks[0].suite=undefined;},f=>{f.tasks[0].tasks[0].name=42;},f=>{f.tasks[0].tasks[0].result={state:'pass',secret:'AUTHORED_PRIVATE_PAYLOAD'};},f=>{f.tasks.push(f.tasks[0]);}]){const {file}=graph();mutate(file);const result=parse(file);assert.equal(result.accepted,false);assert.ok(ERROR_CODES.includes(result.errorCode));assert.equal(result.instances.length,0);assert.ok(!JSON.stringify(result).includes('AUTHORED_PRIVATE_PAYLOAD'));}
});
test('module failures, unhandled errors, skip/todo/only and containsOnly reject without arbitrary diagnostics',()=>{
 for(const mode of ['skip','todo','only','queued','unknown']){const{file}=graph();file.tasks[0].mode=mode;assert.equal(parse(file).errorCode,'MODE');}
 const{file}=graph();file.containsOnly=true;assert.equal(parse(file).errorCode,'MODE');delete file.containsOnly;file.result={state:'fail',errors:[{message:'AUTHORED_PRIVATE_PAYLOAD'}]};assert.equal(parse(file).errorCode,'MODULE_ERROR');delete file.result;
 const result=parse(file,{unhandledErrors:[{message:'AUTHORED_PRIVATE_PAYLOAD'}]});assert.equal(result.errorCode,'UNHANDLED');assert.ok(!JSON.stringify(result).includes('AUTHORED_PRIVATE_PAYLOAD'));
});
test('zero matches, missing files, foreign files and unexpected projects cannot be accepted',()=>{
 assert.equal(parseRawCollection({webRoot:root,files:[path],rawFiles:[],unhandledErrors:[]}).errorCode,'NO_TESTS');
 const{file}=graph();assert.equal(parse(file,{files:[path,'tests/missing.test.ts']}).errorCode,'FILE_SET');assert.equal(parse(file,{files:['tests/other.test.ts']}).errorCode,'FILE_SET');file.projectName='foreign-project';assert.equal(parse(file).errorCode,'SCHEMA');
 const empty=graph().file;empty.tasks=[];assert.equal(parse(empty).errorCode,'NO_TESTS');
});
