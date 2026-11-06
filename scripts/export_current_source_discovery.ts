import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {resolve,relative,isAbsolute,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {materialize} from '../src/derive/catalogue.ts';
import {buildSourceDiscovery,compareDiscoveryEpochs,sourceInputMatchesGitPath,type DiscoveryInput} from './source_discovery.ts';

const args=process.argv.slice(2);
assert(args.length===5,'Usage: export_current_source_discovery.ts LEGACY_CACHE CURRENT_CACHE CURRENT_GIT_OBJECT_PROOF NEW_REPORT_JSON NEW_PROOF_JSON');
const [legacyRoot,currentRoot,gitProofFile,output,proofOutput]=args;
assert(resolve(output)!==resolve(proofOutput),'Report and proof outputs must be distinct');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),sha=(bytes:Buffer|string)=>createHash('sha256').update(bytes).digest('hex');
const git=(...values:string[])=>execFileSync('git',['--no-replace-objects',...values],{cwd:root,maxBuffer:24*1024*1024,env:{...process.env,GIT_TERMINAL_PROMPT:'0',GIT_NO_LAZY_FETCH:'1'}});
const producerRevision=git('rev-parse','HEAD').toString().trim();
git('diff','--quiet','HEAD','--','src','aliases');
for(const file of ['scripts/source_discovery.ts','scripts/export_current_source_discovery.ts'])assert(readFileSync(resolve(root,file)).equals(git('cat-file','blob',producerRevision+':'+file)),'Commit the exact current discovery generator before exporting');
function contained(directory:string,path:string){
 const base=realpathSync(directory),file=realpathSync(resolve(base,path)),inside=relative(base,file);
 assert(!isAbsolute(inside)&&inside!=='..'&&!inside.startsWith('../')&&!inside.startsWith('..\\'),'Private input escaped its cache');return file;
}
const legacyIndex=JSON.parse(readFileSync(resolve(legacyRoot,'index.json'),'utf8'));
const legacy:DiscoveryInput[]=legacyIndex.rows.map((row:any)=>{
 const bytes=readFileSync(contained(legacyRoot,row.path)),body=JSON.parse(bytes.toString());
 assert.equal(sha(JSON.stringify(body)),row.sha256,'Legacy canonical input changed');if(row.rawSha256)assert.equal(sha(bytes),row.rawSha256,'Legacy raw input changed');
 if(row.recoveredFrom){const receipt=legacyIndex.resolutions?.find((r:any)=>r.originalUrl===row.url&&r.recoveredUrl===row.recoveredFrom);assert(receipt&&receipt.rawSha256===sha(bytes)&&receipt.sha256===row.sha256&&/\/[a-f0-9]{40}\//.test(row.recoveredFrom),'Legacy recovery receipt missing');}
 return {url:row.url,sha256:row.sha256,rawSha256:sha(bytes),role:'legacy',body,...(row.recoveredFrom?{recoveredFrom:row.recoveredFrom}:{})};
});
const manifestBytes=readFileSync(resolve(currentRoot,'inputs-sha256.json')),manifest=JSON.parse(manifestBytes.toString());
const gitProofBytes=readFileSync(gitProofFile),gitProof=JSON.parse(gitProofBytes.toString());
assert(Array.isArray(manifest.inputs)&&manifest.inputs.length>0&&new Set(manifest.inputs.map((p:any)=>p.namespace+'\0'+p.path)).size===manifest.inputs.length,'Current manifest has duplicate inputs');
assert(gitProof.unmatched===0&&gitProof.matched===gitProof.total&&gitProof.rows.length===gitProof.total,'Current Git-object receipt is incomplete');
const repositories:Record<string,string>={kiwee:'tjliqy/5etools-cn','kiwee-homebrew':'tjliqy/homebrew-deploy'};
const current:DiscoveryInput[]=[],currentCorpus:any[]=[];let indexBody:any,indexPin:any,rawBytes=0,gitObjects=0;
for(const pin of manifest.inputs){
 assert(repositories[pin.namespace]&&typeof pin.path==='string'&&!isAbsolute(pin.path)&&!pin.path.replaceAll('\\','/').split('/').some((s:string)=>s==='.'||s==='..'||!s),'Current input path is invalid');
 assert(/^[a-f0-9]{64}$/.test(pin.sha256)&&Number.isSafeInteger(pin.bytes)&&pin.bytes>=0,'Current raw pin is invalid');
 const bytes=readFileSync(contained(currentRoot,pin.namespace+'/'+pin.path));assert(bytes.length===pin.bytes&&sha(bytes)===pin.sha256,'Current raw input changed');rawBytes+=bytes.length;
 if(!['catalog','index'].includes(pin.role)){assert(['foundry','version'].includes(pin.role),'Unknown current input role');continue;}
 const rows=gitProof.rows.filter((row:any)=>row.url===pin.url);assert(rows.length===1,'Current input has no unique Git-object receipt');const receipt=rows[0];
 const actualBlob=createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`),bytes])).digest('hex');
 assert(receipt.repository===repositories[pin.namespace]&&sourceInputMatchesGitPath(pin.url,pin.path,receipt.upstreamPath)&&/^[a-f0-9]{40}$/.test(receipt.revision)&&receipt.matched===true&&receipt.rawSha256===pin.sha256&&receipt.expectedBytes===bytes.length&&receipt.gitBlobSha1===actualBlob&&receipt.expectedBlob===actualBlob,'Current Git object differs from its immutable receipt');
 const repository=gitProof.repositories.filter((row:any)=>row.repository===receipt.repository&&row.revision===receipt.revision);assert(repository.length===1&&/^[a-f0-9]{40}$/.test(repository[0].treeSha),'Current repository epoch is ambiguous');gitObjects++;
 const body=JSON.parse(bytes.toString()),canonical=sha(JSON.stringify(body));assert.equal(canonical,receipt.sha256,'Current canonical input changed');
 if(pin.url==='https://homebrew.kiwee.top/_generated/index-sources.json'){assert(pin.role==='index'&&!indexPin,'Current source index is ambiguous');indexBody=body;indexPin=pin;}
 if(pin.role!=='catalog')continue;
 for(const [url,kind]of [['https://5e.kiwee.top/data/books.json','book'],['https://5e.kiwee.top/data/adventures.json','adventure']])if(pin.url===url){assert(Array.isArray(body[kind])&&body[kind].every((row:any)=>typeof row.source==='string'&&!!row.source.trim()),'Primary metadata has an unmapped source identity; inspect before exporting');}
 current.push({url:pin.url,sha256:canonical,rawSha256:pin.sha256,role:'extra',body,recoveredFrom:`https://raw.githubusercontent.com/${receipt.repository}/${receipt.revision}/${receipt.upstreamPath.split('/').map(encodeURIComponent).join('/')}`});
 currentCorpus.push({input:pin,body});
}
assert(indexPin,'Current source index is missing');
const aliasesRaw=JSON.parse(readFileSync(resolve(root,'aliases/identities.json'),'utf8')),aliases=Array.isArray(aliasesRaw)?aliasesRaw:aliasesRaw.aliases;
const legacyCorpus=legacy.map(row=>({input:{namespace:row.url.includes('homebrew.kiwee')?'kiwee-homebrew':'kiwee',path:new URL(row.url).pathname,role:'catalog' as const,sha256:row.sha256},body:row.body}));
const snapshotBytes=git('cat-file','blob','HEAD:reports/progress/automation-rule-status.json');assert(snapshotBytes.equals(readFileSync(resolve(root,'reports/progress/automation-rule-status.json'))),'Legacy registered snapshot differs from its committed blob');const snapshot=JSON.parse(snapshotBytes.toString());
const original=materialize(legacyCorpus,aliases),present=materialize(currentCorpus,aliases),legacyIds=original.rows.map(row=>row.identity.key),currentRows=present.rows.map(row=>({id:row.identity.key,source:row.identity.source}));
assert(legacyIds.length===snapshot.records.length&&legacyIds.every((id,index)=>id===snapshot.records[index].id),'Legacy source identities do not match the registered snapshot');
const compared=compareDiscoveryEpochs(legacyIds,currentRows);
const report=buildSourceDiscovery({producerRevision,generatedAt:new Date().toISOString(),legacySnapshotSha256:sha(snapshotBytes),legacySources:snapshot.sources.map((row:any)=>({id:row.id,name:row.name})),legacyIdentities:legacyIds,candidateIdentities:compared.candidateIdentities,inputs:[...legacy,...current],index:{url:indexPin.url,sha256:indexPin.sha256,body:indexBody},diagnostics:present.diagnostics});
assert.equal(report.counts.provisionalCombinedIdentities,compared.provisionalUnionIdentityCount,'Source-directory union count changed');
const bytes=JSON.stringify(report,null,2)+'\n';
const proof={schemaVersion:1,scope:'current-epoch source-directory metadata only; old registered records preserved; no rule-body publication or acceptance credit',producerRevision,producerSourceTree:git('rev-parse','HEAD:src').toString().trim(),reportSha256:sha(bytes),currentManifestSha256:sha(manifestBytes),gitObjectReceiptSha256:sha(gitProofBytes),currentInputs:manifest.inputs.length,currentRawBytes:rawBytes,currentCatalogInputs:current.length,gitObjectsVerified:gitObjects,currentRepositories:gitProof.repositories.map(({repository,revision,treeSha}:any)=>({repository,revision,treeSha})),legacyRegisteredIdentities:legacyIds.length,currentIdentities:compared.currentIdentityCount,retainedIdentities:compared.retainedIdentityCount,newCandidateIdentities:compared.candidateIdentities.length,legacyAbsentFromCurrent:compared.absentLegacyIdentities.length,legacyAbsentIdentitySetSha256:sha(JSON.stringify(compared.absentLegacyIdentities)),provisionalUnionIdentities:compared.provisionalUnionIdentityCount,legacyIdentitySetSha256:sha(JSON.stringify(legacyIds)),currentIdentitySetSha256:sha(JSON.stringify(currentRows.map(row=>row.id))),sourceDirectoryCount:report.sources.length,creditAdded:report.creditAdded,sourceBodiesPublished:false};
git('diff','--quiet','HEAD','--','src','aliases');assert.equal(git('rev-parse','HEAD').toString().trim(),producerRevision,'Discovery producer changed');
writeFileSync(output,bytes,{flag:'wx'});writeFileSync(proofOutput,JSON.stringify(proof,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(proof));
