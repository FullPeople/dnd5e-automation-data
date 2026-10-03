import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import type { AutomationEnvelope, AutomationRecord, OverlayRecord, VersionLock } from '../protocol.ts';
import { validateOverlay, overlayErrors, publicArtifact } from '../validate/index.ts';

const canonical=(value:unknown):unknown=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,child])=>[key,canonical(child)])):value;
export const fingerprint=(value:unknown)=>createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
export function inputLock(lock:VersionLock):string {
 return fingerprint({version:lock.kiweeChangelogVersion,date:lock.kiweeChangelogDate,migrations:lock.foundryMigrationVersion,inputs:lock.inputs.filter(input=>input.namespace!=='automation-overlay').map(({namespace,path,sha256,bytes,role})=>({namespace,path,sha256,bytes,role})).sort((a,b)=>`${a.namespace}/${a.path}`.localeCompare(`${b.namespace}/${b.path}`))});
}
export interface BatchReview {schemaVersion:1;batch:string;path:string;sha256:string;inputLock:string;reviewedBy:string;reviewedAt:string;sampleKeys:string[];mechanicErrors:0;decision:'accepted'}
export interface OverlayBatch {review:BatchReview;records:OverlayRecord[];byteCount?:number}
const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const validDate=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
function checkReview(batch:OverlayBatch){
 if(!Array.isArray(batch.records))throw Error('Overlay records must be an array');
 const r=batch.review,keys=batch.records.map(row=>row.identity?.key);
 if(!r||r.schemaVersion!==1||batch.records.length<1||batch.records.length>50||!r.batch||!r.path||!/^[a-f0-9]{64}$/.test(r.sha256)||!/^[a-f0-9]{64}$/.test(r.inputLock)||!r.reviewedBy?.trim()||!validDate(r.reviewedAt)||r.decision!=='accepted'||r.mechanicErrors!==0||!Array.isArray(r.sampleKeys)||r.sampleKeys.length!==Math.min(10,keys.length)||new Set(r.sampleKeys).size!==r.sampleKeys.length||r.sampleKeys.some(key=>!keys.includes(key))||batch.records.some(row=>row.batch!==r.batch))throw Error('Overlay batch requires at most 50 entries and an accepted, complete main-review receipt');
}
export async function readOverlayBatches(directory:string):Promise<OverlayBatch[]> {
 const root=resolve(directory);let reviews:BatchReview[];
 try{reviews=JSON.parse(await readFile(resolve(root,'reviews.json'),'utf8'));}catch(error:any){if(error.code==='ENOENT')return [];throw error;}
 if(!Array.isArray(reviews))throw Error('Overlay reviews must be an array');
 const batches:OverlayBatch[]=[];
 for(const review of reviews){
  if(typeof review.path!=='string'||!/^[A-Za-z0-9_./-]+\.json$/.test(review.path)||review.path.split('/').some(part=>!part||part==='.'||part==='..'))throw Error('Unsafe overlay path');
  const path=resolve(root,review.path);if(!path.startsWith(root+sep))throw Error('Overlay path escapes the overlay directory');
  const bytes=await readFile(path);if(hash(bytes)!==review.sha256)throw Error('Overlay differs from its main-review receipt');
  const batch={review,records:JSON.parse(bytes.toString('utf8')),byteCount:bytes.length};checkReview(batch);batches.push(batch);
 }
 return batches;
}
/** Full reviewed replacement, never an implicit additive merge of uncertain mechanics. */
export function applyOverlays(envelope:AutomationEnvelope,batches:OverlayBatch[]){
 const records=structuredClone(envelope.records),index=new Map(records.map((record,at)=>[record.identity.key,at])),seen=new Set<string>();
 const reversals:{key:string;batch:string;layers:string[];reason:string}[]=[],stale:{key:string;batch:string;reason:string}[]=[];
 const active:OverlayBatch[]=[];
 for(const batch of batches){
  checkReview(batch);
  const intrinsic=overlayErrors(batch.records).filter(issue=>!['reference-missing','spell-filter'].includes(issue.code));
  if(intrinsic.length)throw Error(intrinsic.map(issue=>`${issue.code}: ${issue.message}`).join('\n'));
  for(const row of batch.records){if(seen.has(row.identity.key))throw Error('Duplicate identity across overlay batches');seen.add(row.identity.key);}
  if(batch.review.inputLock!==inputLock(envelope.versionLock)){
   for(const row of batch.records)stale.push({key:row.identity.key,batch:row.batch,reason:'reviewed-input-lock-changed'});
  }else active.push(batch);
 }
 const all=active.flatMap(batch=>batch.records);validateOverlay(all,records);
 for(const batch of active)for(const [offset,row]of batch.records.entries()){
  const at=index.get(row.identity.key);if(at===undefined)throw Error('Overlay identity is missing from the current catalogue');
  const base=records[at],changed=fingerprint(base.mechanics??null)!==fingerprint(row.mechanics??null)||fingerprint(base.unsupported)!==fingerprint(row.unsupported);
  const layers=[...new Set(base.provenance.map(p=>p.layer).filter(layer=>layer==='structured'||layer==='foundry'))];
  if(changed&&layers.some(layer=>!row.overrides?.includes(layer)))throw Error('Changed derived mechanics or unsupported reasons require explicit layer overrides');
  if(row.edition!==undefined&&row.edition!==base.edition)throw Error('Overlay cannot replace the catalogue edition');
  const {reviewer,reviewedAt,batch:batchName,overrides,overrideReason,identity,entryIds,...annotation}=row;
  const next:AutomationRecord={...base,...annotation,identity:base.identity,entryIds:base.entryIds,provenance:[...base.provenance,{layer:'overlay',ref:`overlay/${batch.review.path}#${offset}`,reviewer,reviewedAt}]};
  if(row.mechanics===undefined)delete next.mechanics;if(row.reasonCode===undefined)delete next.reasonCode;delete next.autoGenerated;
  records[at]=next;
  if(changed)reversals.push({key:identity.key,batch:batchName,layers:overrides||[],reason:overrideReason||''});
 }
 // Changed upstream inputs invalidate review; current derivation stays unresolved.
 for(const gap of stale){const at=index.get(gap.key);if(at===undefined)continue;const row=records[at];row.verdict='needsAnnotation';row.autoGenerated=true;delete row.reasonCode;row.unsupported.push({code:gap.reason,family:'overlayReview',ref:gap.batch});}
 const output=publicArtifact({...envelope,records});
 return {envelope:output,reversals,stale,reviewed:all.length};
}
