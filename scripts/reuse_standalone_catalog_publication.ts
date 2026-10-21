/** Rebind staged standalone catalog publication only when every rule dependency and frozen
 * input remains byte-identical. This is not a new full replay. */
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import {buildConsumerAdapter} from '../src/runtimeCoverage/adapter.ts';
import {validateCoverage} from '../src/runtimeCoverage/report.ts';
import {verifyConsumerBytes} from '../src/runtimeCoverage/consumerBytes.ts';

const [webRoot,inputRoot,output]=process.argv.slice(2);
if(!webRoot||!inputRoot||!output)throw Error('Usage: WEB_ROOT FROZEN_CACHE OUTPUT');
const previousData='da16799d89046d252e7f9a2a3ad382b32041fa64';
const approvedWeb='baafdacfbb6d12ca0b6d788f6ee1da765e82ab2c';
const git=(root:string,...args:string[])=>execFileSync('git',['--no-replace-objects',...args],{cwd:root,maxBuffer:16*1024*1024});
const hash=(bytes:Buffer|string)=>createHash('sha256').update(bytes).digest('hex');
const previousBytes=git(process.cwd(),'cat-file','blob',previousData+':reports/progress/runtime-coverage.json');
const original=validateCoverage(JSON.parse(previousBytes.toString()));
if(hash(readFileSync(join(webRoot,'docs/data/automation-rule-status.json')))!==original.snapshotSha256)throw Error('Pinned inventory changed; reuse refused');
const index=JSON.parse(readFileSync(join(inputRoot,'index.json'),'utf8'));
if(JSON.stringify(index.rows.map((r:any)=>({url:r.url,sha256:r.sha256})))!==JSON.stringify(original.inputs))throw Error('Frozen input inventory changed; reuse refused');
for(const row of index.rows){const body=JSON.parse(readFileSync(join(inputRoot,row.path),'utf8'));if(hash(JSON.stringify(body))!==row.sha256)throw Error('Frozen input hash changed; reuse refused');}
const sourceChanges=git(webRoot,'diff','--name-only',approvedWeb,'HEAD','--','src').toString().trim().split('\n');
if(JSON.stringify(sourceChanges)!==JSON.stringify(['src/platform/standaloneCatalogPublication.ts','src/ui/App.tsx']))throw Error('Unexpected source changes; catalog-publication reuse refused');
const changed=original.consumer.modules.filter(m=>hash(readFileSync(join(webRoot,m.path)))!==m.sha256).map(m=>m.path);
if(JSON.stringify([...changed].sort())!==JSON.stringify(['src/ui/App.tsx']))throw Error('Unexpected bound consumer changes; reuse refused');
const adapter=await buildConsumerAdapter(webRoot,resolve('.cache/reuse-catalog-publication-runtime.mjs'));
const runtimePaths=Object.keys(adapter.metafile!.inputs).map(p=>resolve(p)).filter(p=>p.replaceAll('\\','/').startsWith(resolve(webRoot).replaceAll('\\','/')+'/src/')).map(p=>p.slice(resolve(webRoot).length+1).replaceAll('\\','/')).sort();
for(const path of runtimePaths){const old=original.consumer.modules.find(m=>m.path===path);if(!old||hash(readFileSync(join(webRoot,path)))!==old.sha256)throw Error('Real rule dependency changed; full replay required: '+path);}
const revision=git(webRoot,'rev-parse','HEAD').toString().trim();
const modules=[...original.consumer.modules.map(m=>({path:m.path,sha256:hash(readFileSync(join(webRoot,m.path)))})),...['src/platform/snapshotMemo.ts','src/platform/standaloneCatalogPublication.ts','src/ui/CharacterTabs.tsx'].filter(path=>!original.consumer.modules.some(m=>m.path===path)).map(path=>({path,sha256:hash(readFileSync(join(webRoot,path)))}))];
const reuse={...original.replayReuse,schemaVersion:1,verifiedAt:new Date().toISOString(),fullReplayRun:false,unchangedRuntimeModules:runtimePaths.length,unchangedFrozenInputs:original.inputs.length,recordsAndWitnessesUnchanged:true,previousDataRevision:previousData,previousArtifactSha256:hash(previousBytes),changedPreviousConsumerModules:changed,scope:'Stage and prepare the local catalog context before publication; diagnostics removed; all real rule dependencies, inputs, records, witnesses and replay timestamp unchanged. No new full replay or browser/cloud acceptance claim.'};
const reused={...original,consumer:{repository:original.consumer.repository,revision,modules},replayReuse:reuse};
validateCoverage(reused);verifyConsumerBytes(reused,webRoot);
for(const key of Object.keys(original).filter(key=>!['consumer','replayReuse'].includes(key)))if(JSON.stringify(reused[key])!==JSON.stringify(original[key]))throw Error('Reuse changed existing coverage data: '+key);
writeFileSync(output,JSON.stringify(reused)+'\n');
writeFileSync(output+'.reuse-proof.json',JSON.stringify({success:true,...reuse,currentConsumer:revision,boundModules:modules.length,baselineReplayUpdatedAt:original.updatedAt,records:original.total,implemented:original.implemented},null,2)+'\n');
console.log(JSON.stringify({success:true,fullReplayRun:false,unchangedRuntimeModules:runtimePaths.length,boundModules:modules.length,inputs:original.inputs.length,records:original.total,implemented:original.implemented}));
