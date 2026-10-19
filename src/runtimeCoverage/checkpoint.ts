import {existsSync,readFileSync,writeFileSync,openSync,writeSync,fsyncSync,closeSync,truncateSync} from 'node:fs';
import {createHash} from 'node:crypto';
import type {RuntimeWitness} from './probe.ts';
import type {ProbeResult} from './pool.ts';
const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
/** Local mechanical receipts only. A changed producer, consumer, corpus or job
 * recipe must use a new path, never silently reuse old observations. */
export function openRuntimeProbeCheckpoint(path:string,binding:string,indices:number[]){
 if(!binding||indices.some(index=>!Number.isSafeInteger(index)||index<0)||new Set(indices).size!==indices.length)throw Error('Invalid checkpoint recipe');
 const allowed=new Set(indices),completed=new Map<number,RuntimeWitness|null>();
 if(!existsSync(path))writeFileSync(path,JSON.stringify({schemaVersion:1,binding})+'\n',{flag:'wx'});
 const bytes=readFileSync(path),last=bytes.lastIndexOf(10);
 if(last<0)throw Error('Incomplete checkpoint binding');
 const lines=bytes.subarray(0,last).toString('utf8').split('\n'),header=JSON.parse(lines.shift()!);
 if(header.schemaVersion!==1||header.binding!==binding)throw Error('Checkpoint binding differs from this replay');
 for(const line of lines){
  const value=JSON.parse(line),receipt={index:value.index,witness:value.witness};
  if(!Object.hasOwn(value,'witness')||!allowed.has(value.index)||completed.has(value.index)||value.sha256!==digest(receipt))throw Error('Invalid checkpoint receipt');
  completed.set(value.index,value.witness);
 }
 // A transport/process interruption can leave one unterminated append. Its
 // observation is rerun; complete malformed lines are always rejected above.
 if(last!==bytes.length-1)truncateSync(path,last+1);
 const fd=openSync(path,'a');let closed=false;
 return {completed,append(result:ProbeResult){
  if(closed||!allowed.has(result.index)||completed.has(result.index))throw Error('Invalid checkpoint append');
  const receipt={index:result.index,witness:result.witness};writeSync(fd,JSON.stringify({...receipt,sha256:digest(receipt)})+'\n');fsyncSync(fd);completed.set(result.index,result.witness);
 },close(){if(!closed){closeSync(fd);closed=true;}}};
}
