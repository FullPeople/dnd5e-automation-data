/** Compare exact producer revisions using an existing frozen corpus; emit no bodies. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const [baselinePath,candidatePath,inputPath,output]=process.argv.slice(2);
if(!baselinePath||!candidatePath||!inputPath||!output)throw Error('Usage: compare_structured_derivation.ts BASELINE CANDIDATE FROZEN_INPUTS RECEIPT');
const digest=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
const roots=[resolve(baselinePath),resolve(candidatePath)];
const git=(root:string,...args:string[])=>execFileSync('git',['--no-replace-objects',...args],{cwd:root,maxBuffer:16*1024*1024});
for(const root of roots)assert.equal(git(root,'diff','HEAD','--name-only','--','src').toString().trim(),'','Producer source must match its commit');
const index=JSON.parse(readFileSync(join(inputPath,'index.json'),'utf8'));
const expected=JSON.parse(readFileSync(join(roots[0],'reports/progress/runtime-coverage.json'),'utf8')).inputs;
const inputLocks=index.rows.map(({url,sha256}:any)=>({url,sha256}));
const sorted=(values:any[])=>[...values].sort((a,b)=>a.url.localeCompare(b.url));assert.deepEqual(sorted(inputLocks),sorted(expected));
const files=index.rows.map((row:any)=>{
 const body=JSON.parse(readFileSync(join(inputPath,row.path),'utf8'));assert.equal(digest(JSON.stringify(body)),row.sha256,row.url);
 return {input:{namespace:row.url.includes('homebrew.kiwee')?'kiwee-homebrew':'kiwee',path:new URL(row.url).pathname,role:'catalog',sha256:row.sha256},body};
});
// PR45/46 change only structured readers. Share the byte-identical inventory
// expansion instead of materializing two very large raw graphs simultaneously.
for(const path of ['src/derive/catalogue.ts','src/inventory/expand.ts','src/inventory/subrace.ts','src/inventory/identity.ts','src/identity.ts','src/fetch/manifest.ts','aliases/identities.json'])assert.equal(digest(readFileSync(join(roots[0],path))),digest(readFileSync(join(roots[1],path))),'Inventory materialization differs: '+path);
const catalogue=await import(pathToFileURL(join(roots[0],'src/derive/catalogue.ts')).href),aliases=JSON.parse(readFileSync(join(roots[0],'aliases/identities.json'),'utf8'));
const rows=catalogue.materialize(files,Array.isArray(aliases)?aliases:aliases.aliases).rows;
const load=async(root:string)=>{const [common,structured]=await Promise.all(['src/derive/structured/common.ts','src/derive/structured/index.ts'].map(path=>import(pathToFileURL(join(root,path)).href)));return {rows,context:common.makeContext(rows),derive:structured.deriveStructured};};
const [before,after]=await Promise.all(roots.map(load));
const snapshot=JSON.parse(readFileSync(join(roots[0],'reports/progress/automation-rule-status.json'),'utf8'));assert.deepEqual(before.rows.map((row:any)=>row.identity.key).sort(),snapshot.records.map((row:any)=>row.id).sort());
const comparable=(value:any)=>JSON.stringify({mechanics:value.mechanics,unsupported:value.unsupported,handled:[...value.handled].sort()});
const changes=[];let at=0;
for(const row of before.rows){
 const previous=before.derive({...row,raw:structuredClone(row.raw)},before.context),next=after.derive({...row,raw:structuredClone(row.raw)},after.context),a=comparable(previous),b=comparable(next);
 if(a!==b)changes.push({id:row.identity.key,beforeSha256:digest(a),afterSha256:digest(b),beforeDiagnostics:previous.unsupported.map((r:any)=>r.code),afterDiagnostics:next.unsupported.map((r:any)=>r.code)});
 if(++at%2000===0)console.log(JSON.stringify({derived:at,changed:changes.length}));
}
const receipt={schemaVersion:1,baseline:git(roots[0],'rev-parse','HEAD').toString().trim(),candidate:git(roots[1],'rev-parse','HEAD').toString().trim(),inputs:index.rows.length,inputsSha256:digest(JSON.stringify(sorted(inputLocks))),identities:before.rows.length,changed:changes.length,records:changes,rawInputPublished:false};
writeFileSync(output,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({identities:receipt.identities,changed:changes.length,output}));
