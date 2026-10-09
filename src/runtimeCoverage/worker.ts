import {parentPort,workerData} from 'node:worker_threads';
import {pathToFileURL} from 'node:url';
import {probeEntry} from './probe.ts';
const api=await import(pathToFileURL(workerData.adapter).href),catalog=workerData.catalog as any[],byId=new Map(catalog.map(entry=>[entry.id,entry]));
parentPort!.on('message',({index,entry,parents})=>{try{parentPort!.postMessage({index,witness:entry?probeEntry(api,byId.get(entry),catalog,parents.map((id:string)=>byId.get(id))):null});}catch(error){parentPort!.postMessage({index,error:error instanceof Error?error.stack:String(error)});}});
