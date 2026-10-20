import {it,expect} from 'vitest';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {runRuntimeProbePool} from '../src/runtimeCoverage/pool.ts';

const fixture=(source:string)=>{const root=mkdtempSync(join(tmpdir(),'probe-pool-')),adapter=join(root,'adapter.mjs');writeFileSync(adapter,source);return {root,adapter};};
it('recycles an isolate after its bounded batch without dropping or duplicating observations',async()=>{
 const {root,adapter}=fixture(''),marker=join(root,'starts.txt');
 writeFileSync(adapter,`import {appendFileSync} from 'node:fs';appendFileSync(${JSON.stringify(marker)},'started'+String.fromCharCode(10));`);
 try{const seen:number[]=[],jobs=Array.from({length:5},(_,index)=>({index,parents:[]}));
  const results=await runRuntimeProbePool(adapter,[],jobs,{workers:1,recycleAfter:2,onResult:result=>seen.push(result.index)});
  expect([...results]).toEqual(jobs.map(job=>[job.index,null]));expect(seen).toEqual([0,1,2,3,4]);expect(readFileSync(marker,'utf8').trim().split('\n')).toHaveLength(3);
 }finally{rmSync(root,{recursive:true,force:true});}
});
it('completes sparse job indices with parallel recycled workers and handles empty work',async()=>{
 const {root,adapter}=fixture('');try{
  const jobs=[9,2,17,4,30,0].map(index=>({index,parents:[]}));
  const results=await runRuntimeProbePool(adapter,[],jobs,{workers:2,recycleAfter:1});expect([...results.keys()].sort((a,b)=>a-b)).toEqual([0,2,4,9,17,30]);expect([...results.values()].every(value=>value===null)).toBe(true);
  expect((await runRuntimeProbePool(resolve(adapter),[],[],{workers:2})).size).toBe(0);
 }finally{rmSync(root,{recursive:true,force:true});}
});
it('rejects a worker import failure instead of accepting an incomplete corpus',async()=>{
 const {root,adapter}=fixture('throw Error("authored import failure")');try{await expect(runRuntimeProbePool(adapter,[],[{index:0,parents:[]}])).rejects.toThrow('authored import failure');}finally{rmSync(root,{recursive:true,force:true});}
});
it('propagates real probe and receipt-write failures without leaving sibling workers active',async()=>{
 const {root,adapter}=fixture('');try{
  const entry={id:'authored',kind:'feat',edition:'2014',raw:{},source:'PHB'};
  await expect(runRuntimeProbePool(adapter,[entry],[{index:0,entry:entry.id,parents:[]}],{workers:2})).rejects.toThrow('newCharacter');
  await expect(runRuntimeProbePool(adapter,[],[{index:0,parents:[]},{index:1,parents:[]}],{workers:2,onResult:()=>{throw Error('authored receipt failure');}})).rejects.toThrow('authored receipt failure');
 }finally{rmSync(root,{recursive:true,force:true});}
});
it('rejects invalid concurrency, batch bounds and duplicate indices before execution',async()=>{
 for(const options of [{workers:0},{workers:5},{recycleAfter:0},{recycleAfter:1001}])await expect(runRuntimeProbePool('unused',[],[],options)).rejects.toThrow();
 await expect(runRuntimeProbePool('unused',[],[{index:1,parents:[]},{index:1,parents:[]}])).rejects.toThrow('indices');
});
