import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {resolve,relative,isAbsolute,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {materialize} from '../src/derive/catalogue.ts';
import {buildSourceDiscovery,type DiscoveryInput} from './source_discovery.ts';
const [legacyRoot,extraRoot,indexFile,output]=process.argv.slice(2);if(!legacyRoot||!extraRoot||!indexFile||!output)throw Error('Usage: export_source_discovery.ts LEGACY_CACHE EXTRA_DISCOVERY LIVE_INDEX_JSON NEW_OUTPUT_JSON');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),sha=(bytes:Buffer|string)=>createHash('sha256').update(bytes).digest('hex');
const git=(...args:string[])=>execFileSync('git',['--no-replace-objects',...args],{cwd:root,maxBuffer:16*1024*1024});
const producerRevision=git('rev-parse','HEAD').toString().trim();
git('diff','--quiet','HEAD','--','src','aliases');
for(const path of ['scripts/source_discovery.ts','scripts/export_source_discovery.ts'])assert(readFileSync(resolve(root,path)).equals(git('cat-file','blob',producerRevision+':'+path)),'Commit the exact discovery generator before exporting');
function contained(directory:string,path:string){const base=realpathSync(directory),file=realpathSync(resolve(base,path)),inside=relative(base,file);assert(!isAbsolute(inside)&&inside!=='..'&&!inside.startsWith('../')&&!inside.startsWith('..\\'),'Cache input escaped its directory');return file;}
function inputs(directory:string,role:DiscoveryInput['role']):DiscoveryInput[]{
 const index=JSON.parse(readFileSync(resolve(directory,'index.json'),'utf8'));
 return index.rows.map((row:any)=>{const bytes=readFileSync(contained(directory,row.path)),body=JSON.parse(bytes.toString());assert.equal(sha(JSON.stringify(body)),row.sha256,'Canonical source input changed');if(row.rawSha256)assert.equal(sha(bytes),row.rawSha256,'Raw source input changed');
  if(row.recoveredFrom){const proof=index.resolutions?.find((proof:any)=>proof.originalUrl===row.url&&proof.recoveredUrl===row.recoveredFrom);assert(proof&&proof.rawSha256===sha(bytes)&&proof.sha256===row.sha256,'Recovery provenance missing');assert(/\/[a-f0-9]{40}\//.test(row.recoveredFrom),'Recovery must be immutable');}
  return {url:row.url,sha256:row.sha256,rawSha256:sha(bytes),role,body,...(row.recoveredFrom?{recoveredFrom:row.recoveredFrom}:{})};});
}
const legacy=inputs(legacyRoot,'legacy'),extra=inputs(extraRoot,'extra'),indexBytes=readFileSync(indexFile),sourceIndex=JSON.parse(indexBytes.toString());
const aliasesRaw=JSON.parse(readFileSync(resolve(root,'aliases/identities.json'),'utf8')),aliases=Array.isArray(aliasesRaw)?aliasesRaw:aliasesRaw.aliases;
const corpus=(rows:DiscoveryInput[])=>rows.map(row=>({input:{namespace:row.url.includes('homebrew.kiwee')?'kiwee-homebrew':'kiwee',path:new URL(row.url).pathname,role:'catalog' as const,sha256:row.sha256},body:row.body}));
const snapshotBytes=git('cat-file','blob','HEAD:reports/progress/automation-rule-status.json');assert(snapshotBytes.equals(readFileSync(resolve(root,'reports/progress/automation-rule-status.json'))),'Legacy snapshot differs from its committed blob');const snapshot=JSON.parse(snapshotBytes.toString());
const original=materialize(corpus(legacy),aliases),combined=materialize(corpus([...legacy,...extra]),aliases),legacyIdentities=original.rows.map(row=>row.identity.key),all=new Set(combined.rows.map(row=>row.identity.key));assert.deepEqual(legacyIdentities,snapshot.records.map((row:any)=>row.id));assert(legacyIdentities.every(id=>all.has(id)),'Discovery changed an existing identity');
const originalIds=new Set(legacyIdentities),candidateIdentities=combined.rows.filter(row=>!originalIds.has(row.identity.key)).map(row=>({id:row.identity.key,source:row.identity.source}));
const report=buildSourceDiscovery({producerRevision,generatedAt:new Date().toISOString(),legacySnapshotSha256:sha(snapshotBytes),legacySources:snapshot.sources.map((row:any)=>({id:row.id,name:row.name})),legacyIdentities,candidateIdentities,inputs:[...legacy,...extra],index:{url:'https://homebrew.kiwee.top/_generated/index-sources.json',sha256:sha(indexBytes),body:sourceIndex},diagnostics:combined.diagnostics});
assert.equal(report.counts.provisionalCombinedIdentities,combined.rows.length);git('diff','--quiet','HEAD','--','src','aliases');assert.equal(git('rev-parse','HEAD').toString().trim(),producerRevision,'Discovery producer changed');
const bytes=JSON.stringify(report,null,2)+'\n';writeFileSync(output,bytes,{flag:'wx'});console.log(JSON.stringify({output,sha256:sha(bytes),bytes:Buffer.byteLength(bytes),producerRevision,counts:report.counts,unclassifiedExtraFiles:report.unclassifiedExtraFiles.length,diagnostics:report.diagnostics.counts,indexIssues:report.indexIssues.length,creditAdded:report.creditAdded,sourceBodiesPublished:false}));
