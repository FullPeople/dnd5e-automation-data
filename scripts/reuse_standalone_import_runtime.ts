/** Local import preparation reuses calculations only when their entire real
 * dependency graph and frozen inputs are byte-identical to the 303 baseline.
 * This does not claim a new full replay or player/browser acceptance. */
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import {build} from 'esbuild';
import {buildConsumerAdapter} from '../src/runtimeCoverage/adapter.ts';
import {validateCoverage} from '../src/runtimeCoverage/report.ts';
import {verifyConsumerBytes} from '../src/runtimeCoverage/consumerBytes.ts';

const [webRoot,inputRoot,output,parityPath]=process.argv.slice(2);
if(!webRoot||!inputRoot||!output||!parityPath)throw Error('Usage: WEB_ROOT FROZEN_CACHE OUTPUT PRIVATE_PARITY_RECEIPT');
const baselineData='f374806ba54158d74b3868cdf67431f3f962a790',baselineWeb='e5dbe0b97f4c762c425ee231c8f7f17088d18e25';
const git=(root:string,...args:string[])=>execFileSync('git',['--no-replace-objects',...args],{cwd:root,maxBuffer:16*1024*1024});
const hash=(bytes:Buffer|string)=>createHash('sha256').update(bytes).digest('hex');
const baselineBytes=git(process.cwd(),'cat-file','blob',baselineData+':reports/progress/runtime-coverage.json');
const original=validateCoverage(JSON.parse(baselineBytes.toString()));
const snapshot=readFileSync(join(webRoot,'docs/data/automation-rule-status.json'));
if(hash(snapshot)!==original.snapshotSha256)throw Error('Pinned rule inventory changed; reuse refused');
const index=JSON.parse(readFileSync(join(inputRoot,'index.json'),'utf8'));
if(JSON.stringify(index.rows.map((r:any)=>({url:r.url,sha256:r.sha256})))!==JSON.stringify(original.inputs))throw Error('Frozen input inventory changed; reuse refused');
for(const row of index.rows){const body=JSON.parse(readFileSync(join(inputRoot,row.path),'utf8'));if(hash(JSON.stringify(body))!==row.sha256)throw Error('Frozen input hash changed; reuse refused');}
const parity=JSON.parse(readFileSync(parityPath,'utf8'));
if(parity.originalDataUnchanged!==true||parity.frozenInputs!==original.inputs.length||parity.cards?.length!==3||!parity.cards.every((row:any)=>row.sameAs303===true&&row.prepared===true))throw Error('Actual-card read-view parity is missing');
const changed=original.consumer.modules.filter(m=>hash(readFileSync(join(webRoot,m.path)))!==m.sha256).map(m=>m.path);
if(JSON.stringify(changed)!==JSON.stringify(['src/ui/App.tsx']))throw Error('A previous runtime consumer changed beyond the reviewed App import path; reuse refused');

const adapter=await buildConsumerAdapter(webRoot,resolve('.cache/reuse-303-runtime.mjs'));
const runtimePaths=Object.keys(adapter.metafile!.inputs).map(p=>resolve(p)).filter(p=>p.replaceAll('\\','/').startsWith(resolve(webRoot).replaceAll('\\','/')+'/src/')).map(p=>p.slice(resolve(webRoot).length+1).replaceAll('\\','/')).sort();
for(const path of runtimePaths){const old=original.consumer.modules.find(m=>m.path===path);if(!old||hash(readFileSync(join(webRoot,path)))!==old.sha256)throw Error('Real runtime dependency changed; full replay required: '+path);}
const views=await build({stdin:{contents:`export {standaloneCardViews,prepareStandaloneCards} from ${JSON.stringify(resolve(webRoot,'src/platform/standaloneCardViews.ts').replaceAll('\\','/'))}`,resolveDir:resolve(webRoot),loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:resolve('.cache/reuse-303-views.mjs'),metafile:true,define:{'import.meta.env.MODE':'"standalone"','import.meta.env.DEV':'false'}});
const viewPaths=Object.keys(views.metafile!.inputs).map(p=>resolve(p)).filter(p=>p.replaceAll('\\','/').startsWith(resolve(webRoot).replaceAll('\\','/')+'/src/')).map(p=>p.slice(resolve(webRoot).length+1).replaceAll('\\','/')).sort();
const addedViews=['src/platform/standaloneCardViews.ts','src/platform/cardViewReconciliation.ts'];
for(const path of viewPaths){if(addedViews.includes(path))continue;if(hash(readFileSync(join(webRoot,path)))!==hash(git(webRoot,'cat-file','blob',baselineWeb+':'+path)))throw Error('View dependency changed beyond pure import preparation: '+path);}
const paths=[...new Set([...original.consumer.modules.map(m=>m.path),...viewPaths])].sort();
const modules=paths.map(path=>({path,sha256:hash(readFileSync(join(webRoot,path)))}));
const revision=git(webRoot,'rev-parse','HEAD').toString().trim();
const reused={...original,consumer:{repository:original.consumer.repository,revision,modules},replayReuse:{schemaVersion:1,baselineDataRevision:baselineData,baselineArtifactSha256:hash(baselineBytes),baselineConsumerRevision:original.consumer.revision,verifiedAt:new Date().toISOString(),fullReplayRun:false,unchangedRuntimeModules:runtimePaths.length,unchangedFrozenInputs:original.inputs.length,recordsAndWitnessesUnchanged:true,viewParityCards:3,scope:'Unchanged real calculations and choices reused; import read-view preparation checked separately; no browser/cloud acceptance claim'}};
validateCoverage(reused);verifyConsumerBytes(reused,webRoot);
if(hash(JSON.stringify(reused.records))!==hash(JSON.stringify(original.records))||reused.updatedAt!==original.updatedAt)throw Error('Reuse changed replay observations or their timestamp');
writeFileSync(output,JSON.stringify(reused)+'\n');
writeFileSync(output+'.reuse-proof.json',JSON.stringify({success:true,...reused.replayReuse,currentConsumer:revision,boundModules:modules.length,changedPreviousConsumerModules:changed,newViewModules:addedViews,baselineReplayUpdatedAt:original.updatedAt,records:original.total,implemented:original.implemented},null,2)+'\n');
console.log(JSON.stringify({success:true,fullReplayRun:false,unchangedRuntimeModules:runtimePaths.length,boundModules:modules.length,inputs:original.inputs.length,records:original.total,implemented:original.implemented}));
