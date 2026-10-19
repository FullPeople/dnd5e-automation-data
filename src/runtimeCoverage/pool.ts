import {Worker} from 'node:worker_threads';
import type {RuntimeWitness} from './probe.ts';

export interface ProbeJob {index:number;entry?:string;parents:string[]}
export interface ProbeResult {index:number;witness:RuntimeWitness|null}
/** Fresh bounded batches prevent consumer memoization from retaining a whole
 * corpus in one isolate. Every job still executes the unchanged real probe. */
export async function runRuntimeProbePool(adapter:string,catalog:any[],jobs:ProbeJob[],options:{workers?:number;recycleAfter?:number;onResult?:(result:ProbeResult)=>void}={}){
 const workers=options.workers??1,recycleAfter=options.recycleAfter??250;
 if(!Number.isInteger(workers)||workers<1||workers>4)throw Error('Runtime coverage workers must be 1..4');
 if(!Number.isInteger(recycleAfter)||recycleAfter<1||recycleAfter>1000)throw Error('Runtime probe batch must be 1..1000');
 if(jobs.some(job=>!Number.isSafeInteger(job.index)||job.index<0)||new Set(jobs.map(job=>job.index)).size!==jobs.length)throw Error('Runtime probe indices must be unique nonnegative integers');
 const results=new Map<number,RuntimeWitness|null>(),active=new Set<Worker>();let next=0,failure:unknown;
 const runner=async()=>{
  try{while(next<jobs.length&&!failure){
   const worker=new Worker(new URL(import.meta.url.endsWith('.ts')?'./worker.ts':'./worker.js',import.meta.url),{workerData:{adapter,catalog},execArgv:['--experimental-strip-types']});active.add(worker);
   let terminated:Error|undefined;
   worker.on('error',error=>{terminated=error instanceof Error?error:Error(String(error));});worker.on('exit',code=>{terminated??=Error('Probe worker exited before its result: '+code);});
   try{for(let used=0;used<recycleAfter&&next<jobs.length&&!failure;used++){
    if(terminated)throw terminated;
    const job=jobs[next++];
    const result=await new Promise<ProbeResult>((resolve,reject)=>{
     const clear=()=>{worker.off('message',message);worker.off('error',error);worker.off('exit',exit);};
     const message=(value:any)=>{clear();if(value?.error)reject(Error(value.error));else if(value?.index!==job.index||!Object.hasOwn(value,'witness'))reject(Error('Probe worker returned a mismatched result'));else resolve(value);};
     const error=(value:Error)=>{clear();reject(value);},exit=(code:number)=>{clear();reject(Error('Probe worker exited before its result: '+code));};
     worker.once('message',message);worker.once('error',error);worker.once('exit',exit);worker.postMessage(job);
    });
    options.onResult?.(result);results.set(result.index,result.witness);
   }}finally{active.delete(worker);await worker.terminate();}
  }}catch(error){failure??=error;await Promise.allSettled([...active].map(worker=>worker.terminate()));throw error;}
 };
 await Promise.allSettled(Array.from({length:Math.min(workers,jobs.length)},runner));
 if(failure)throw failure;
 if(results.size!==jobs.length)throw Error('Runtime probe pool did not finish every job');
 return results;
}
