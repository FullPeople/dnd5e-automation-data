import {mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {buildConsumerAdapter} from '../src/runtimeCoverage/adapter.ts';
import {probeEntry} from '../src/runtimeCoverage/probe.ts';
import {Worker} from 'node:worker_threads';
import {runRuntimeProbePool} from '../src/runtimeCoverage/pool.ts';
import {openRuntimeProbeCheckpoint} from '../src/runtimeCoverage/checkpoint.ts';
const web=process.argv[2];if(!web)throw Error('Supply pinned Web checkout');mkdirSync('.cache',{recursive:true});
const path=resolve('.cache/probe-test.mjs');await buildConsumerAdapter(web,path,false);const api=await import(pathToFileURL(path).href);
const entry=(id:string,kind:string,raw:any,entries:any[]=[])=>({id,kind,name:id,english:id,source:'PHB',packId:'authored',revision:'fixture',edition:'2014',raw,entries});
const armor=entry('authored-armor','item',{type:'LA',ac:11});
const weapon=entry('authored-weapon','item',{type:'M',weaponCategory:'simple',dmg1:'1d6',dmgType:'B'});
const text=entry('authored-text','feat',{ability:[{str:2}],effects:[{op:'add',target:'hp',value:5}],weight:2},['Unmapped payloads remain manual.']);
const race=entry('authored-race','race',{ability:[{str:2}],speed:{walk:25}});
const cls=entry('authored-class','class',{hd:{faces:10},startingProficiencies:{skills:[{choose:{from:['athletics','arcana'],count:1}}]}});
const choice=entry('authored-choice','feature',{},[{type:'options',count:1,entries:[{type:'entries',name:'Authored option',entries:['A usable selected option.']}]}]);
const unresolved=entry('authored-unresolved','feature',{},[{type:'options',count:1,entries:[{optionalfeature:'missing|PHB'}]}]);
const catalog=[armor,weapon,text,race,cls,choice,unresolved];
assert.equal(probeEntry(api,armor,catalog,[])?.kind,'calculated-sheet');
assert.equal(probeEntry(api,weapon,catalog,[])?.kind,'calculated-weapon');
assert.equal(probeEntry(api,text,catalog,[]),null);
assert.equal(probeEntry(api,race,catalog,[])?.kind,'calculated-sheet');
assert.equal(probeEntry(api,cls,catalog,[])?.kind,'calculated-sheet');
assert.equal(probeEntry(api,choice,catalog,[])?.kind,'choice:content');
assert.equal(probeEntry(api,unresolved,catalog,[]),null);
const parentFeature=entry('parent-resource','feature',{className:'Parent',classSource:'PHB',level:1,resources:[{name:'Parent resource',max:3,recovery:'long'}]});
const parent=entry('Parent','class',{hd:{faces:10},classFeatures:['parent-resource|Parent|PHB|1|PHB']});
const emptyChild=entry('empty-child','subclass',{className:'Parent',classSource:'PHB',subclassFeatures:[]});
const contextual=[...catalog,parent,parentFeature,emptyChild];
const calibration=api.newCharacter('2014');calibration.profile.enabledSources=['PHB'];calibration.automation=api.newAutomationState();calibration.selections=[{id:'parent',entry:parent,level:1,quantity:1,equipped:false}];api.syncFeatures(calibration,contextual);api.syncAutoResources(calibration);assert.ok(Object.values(calibration.runtime.resources).some((r:any)=>r.featureGrant&&r.max===3),'The parent context must actually contain an automatic feature resource');
assert.equal(probeEntry(api,emptyChild,contextual,[parent]),null);
const worker=new Worker(new URL('../src/runtimeCoverage/worker.ts',import.meta.url),{workerData:{adapter:path,catalog:contextual},execArgv:['--experimental-strip-types']});
try{for(const [index,item] of contextual.entries()){
 const parents=item===emptyChild?[parent]:[],expected=probeEntry(api,item,contextual,parents);
 const actual=await new Promise<any>((resolve,reject)=>{worker.once('message',resolve);worker.once('error',reject);worker.postMessage({index,entry:item.id,parents:parents.map(row=>row.id)});});
 assert.equal(actual.error,undefined);assert.equal(actual.index,index);assert.deepEqual(actual.witness,expected,'Parallel probes must return the exact real-consumer witness.');
}}finally{await worker.terminate();}
for(const options of [{workers:1,recycleAfter:2},{workers:2,recycleAfter:1}]){
 const jobs=contextual.map((item,index)=>({index,entry:item.id,parents:item===emptyChild?[parent.id]:[]}));
 const results=await runRuntimeProbePool(path,contextual,jobs,options);
 for(const [index,item] of contextual.entries())assert.deepEqual(results.get(index),probeEntry(api,item,contextual,item===emptyChild?[parent]:[]),'Recycled probes must equal the serial real-consumer witness.');
}
console.log('Runtime probe: 8 real-consumer positive/negative scenarios passed; recycled one/two-worker results equal serial results.');
const checkpointRoot=mkdtempSync(join(tmpdir(),'real-probe-checkpoint-'));
try{
 const jobs=contextual.map((item,index)=>({index,entry:item.id,parents:item===emptyChild?[parent.id]:[]})),file=join(checkpointRoot,'receipts.jsonl');
 const first=openRuntimeProbeCheckpoint(file,'authored-real-consumer',jobs.map(job=>job.index));
 try{await runRuntimeProbePool(path,contextual,jobs.slice(0,4),{workers:1,recycleAfter:2,onResult:result=>first.append(result)});}finally{first.close();}
 const resumed=openRuntimeProbeCheckpoint(file,'authored-real-consumer',jobs.map(job=>job.index));assert.equal(resumed.completed.size,4);
 try{await runRuntimeProbePool(path,contextual,jobs.filter(job=>!resumed.completed.has(job.index)),{workers:2,recycleAfter:2,onResult:result=>resumed.append(result)});
  for(const [index,item] of contextual.entries())assert.deepEqual(resumed.completed.get(index),probeEntry(api,item,contextual,item===emptyChild?[parent]:[]),'Interrupted/resumed receipts must equal fresh serial observations.');
 }finally{resumed.close();}
 console.log('Runtime checkpoint: interrupted and resumed real-consumer results equal serial results.');
}finally{rmSync(checkpointRoot,{recursive:true,force:true});}
