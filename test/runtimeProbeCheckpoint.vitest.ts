import {it,expect} from 'vitest';
import {mkdtempSync,readFileSync,appendFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openRuntimeProbeCheckpoint} from '../src/runtimeCoverage/checkpoint.ts';
const fixture=()=>{const root=mkdtempSync(join(tmpdir(),'probe-checkpoint-'));return {root,path:join(root,'receipts.jsonl')};};
it('reopens completed observations and resumes only missing indices',()=>{
 const {root,path}=fixture();try{
  const first=openRuntimeProbeCheckpoint(path,'recipe-a',[0,3,9]);first.append({index:3,witness:null});first.close();
  const resumed=openRuntimeProbeCheckpoint(path,'recipe-a',[0,3,9]);expect([...resumed.completed]).toEqual([[3,null]]);expect([0,3,9].filter(index=>!resumed.completed.has(index))).toEqual([0,9]);resumed.append({index:9,witness:null});resumed.append({index:0,witness:null});resumed.close();
  const final=openRuntimeProbeCheckpoint(path,'recipe-a',[0,3,9]);expect(final.completed.size).toBe(3);final.close();
 }finally{rmSync(root,{recursive:true,force:true});}
});
it('rejects a different source/input recipe without overwriting evidence',()=>{
 const {root,path}=fixture();try{const c=openRuntimeProbeCheckpoint(path,'old',[0]);c.append({index:0,witness:null});c.close();const before=readFileSync(path);expect(()=>openRuntimeProbeCheckpoint(path,'new',[0])).toThrow('binding');expect(readFileSync(path).equals(before)).toBe(true);}finally{rmSync(root,{recursive:true,force:true});}
});
it('discards only a truncated final write and preserves committed receipts',()=>{
 const {root,path}=fixture();try{const c=openRuntimeProbeCheckpoint(path,'same',[0,1]);c.append({index:0,witness:null});c.close();appendFileSync(path,'{"index":1');const reopened=openRuntimeProbeCheckpoint(path,'same',[0,1]);expect([...reopened.completed]).toEqual([[0,null]]);reopened.append({index:1,witness:null});reopened.close();expect(readFileSync(path,'utf8').split('\n').filter(Boolean)).toHaveLength(3);}finally{rmSync(root,{recursive:true,force:true});}
});
it('rejects changed, duplicated or foreign receipts rather than reporting partial success',()=>{
 for(const corruption of ['checksum','duplicate','foreign']){const {root,path}=fixture();try{const c=openRuntimeProbeCheckpoint(path,'same',[0]);c.append({index:0,witness:null});c.close();const lines=readFileSync(path,'utf8').trim().split('\n');if(corruption==='checksum')lines[1]=lines[1].replace('"witness":null','"witness":{}');else if(corruption==='duplicate')lines.push(lines[1]);else lines[1]=lines[1].replace('"index":0','"index":7');writeFileSync(path,lines.join('\n')+'\n');expect(()=>openRuntimeProbeCheckpoint(path,'same',[0])).toThrow();}finally{rmSync(root,{recursive:true,force:true});}}
});
it('rejects duplicate writes, unknown jobs and append after close',()=>{
 const {root,path}=fixture();try{const c=openRuntimeProbeCheckpoint(path,'same',[0]);expect(()=>c.append({index:1,witness:null})).toThrow();c.append({index:0,witness:null});expect(()=>c.append({index:0,witness:null})).toThrow();c.close();expect(()=>c.append({index:0,witness:null})).toThrow();}finally{rmSync(root,{recursive:true,force:true});}
});
