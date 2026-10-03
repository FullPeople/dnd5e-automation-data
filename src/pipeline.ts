import {readFile,mkdir,writeFile,mkdtemp,rename,rm} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {deriveFiles} from './derive/index.ts';
import {fetchCorpus} from './fetch/index.ts';
import {applyOverlays,readOverlayBatches} from './overlay/index.ts';
import {coverage,coverageMarkdown} from './report/coverage.ts';
import {diffReport} from './report/diff.ts';
import {validateAutomation} from './validate/index.ts';
import type {AutomationEnvelope} from './protocol.ts';
const stable=(value:unknown)=>JSON.stringify(value,null,2)+'\n';
export const CORE_KINDS=new Set(['class','subclass','classFeature','subclassFeature','race','subrace','background','feat','optionalfeature','spell','item','baseitem','magicvariant']);
export const CORE_BOOKS=new Set(['PHB','XPHB','DMG','XDMG']);
export async function pipeline(options:{cache:string;out:string;overlay:string;offline?:boolean;previous?:string;requireCoreComplete?:boolean}){
 const manifest=await fetchCorpus(options.cache,{offline:options.offline});
 const out=resolve(options.out);await mkdir(dirname(out),{recursive:true});const stage=await mkdtemp(join(dirname(out),'.automation-stage-'));
 try{
  const derived=await deriveFiles(options.cache,stage,manifest),batches=await readOverlayBatches(options.overlay),applied=applyOverlays(derived.envelope,batches);
  const envelope=applied.envelope;
  let sourceCommit='unpublished';try{sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:resolve(new URL('..',import.meta.url).pathname),encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{}
  const sourceUrl=`https://github.com/FullPeople/dnd5e-automation-data/raw/${sourceCommit}/overlay/`;
  for(const batch of batches)envelope.versionLock.inputs.push({namespace:'automation-overlay',path:`overlay/${batch.review.path}`,role:'catalog',url:sourceUrl+batch.review.path,sha256:batch.review.sha256,bytes:batch.byteCount!});
  try{const bytes=await readFile(join(options.overlay,'reviews.json'));envelope.versionLock.inputs.push({namespace:'automation-overlay',path:'overlay/reviews.json',role:'index',url:sourceUrl+'reviews.json',sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});}catch(error:any){if(error.code!=='ENOENT')throw error;}
  validateAutomation(envelope);
  const core=envelope.records.filter(r=>r.identity.packId==='kiwee'&&CORE_BOOKS.has(r.identity.source)&&CORE_KINDS.has(r.identity.kind));
  const summary={records:envelope.records.length,core:core.length,coreNeedsAnnotation:core.filter(r=>r.verdict==='needsAnnotation').length,acceptedReviews:applied.reviewed,staleReviews:applied.stale.length};
  if(options.requireCoreComplete&&summary.coreNeedsAnnotation)throw Error('Core annotation gate is not complete');
  const report=coverage(envelope,derived.diagnostics,'G6-overlay-review');let previous:AutomationEnvelope|undefined;
  if(options.previous){previous=JSON.parse(await readFile(options.previous,'utf8'));validateAutomation(previous);}
  await writeFile(join(stage,'automation.json'),stable(envelope));
  await writeFile(join(stage,'coverage-report.json'),stable({...report,coreSummary:summary}));
  await writeFile(join(stage,'coverage-report.md'),coverageMarkdown(report)+'\n## Core annotation gate\n\n'+stable(summary)+'\n## Version lock\n\n```json\n'+stable(envelope.versionLock)+'```\n');
  await writeFile(join(stage,'unsupported.json'),stable({schemaVersion:1,versionLock:envelope.versionLock,foundryOrphans:derived.foundry.filter(r=>!r.matched),identityDiagnostics:derived.diagnostics,staleReviews:applied.stale,records:envelope.records.filter(r=>r.unsupported.length).map(r=>({identity:r.identity,verdict:r.verdict,unsupported:r.unsupported}))}));
  await writeFile(join(stage,'diff-report.md'),diffReport(envelope,previous,applied.reversals,applied.stale));
  await writeFile(join(stage,'inputs-sha256.json'),stable({versionLock:envelope.versionLock,inputs:envelope.versionLock.inputs}));
  // Publish a complete validated directory and retain the previous build for rollback.
  const prior=out+'.previous';await rm(prior,{recursive:true,force:true});let moved=false;
  try{await rename(out,prior);moved=true;}catch(error:any){if(error.code!=='ENOENT')throw error;}
  try{await rename(stage,out);}catch(error){if(moved)await rename(prior,out);throw error;}
  return summary;
 }catch(error){await rm(stage,{recursive:true,force:true});throw error;}
}
