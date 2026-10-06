import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {buildConsumerAdapter} from '../src/runtimeCoverage/adapter.ts';
import {context,identity as provisional} from '../src/inventory/identity.ts';
import {createIdentity} from '../src/identity.ts';
import {probeEntry} from '../src/runtimeCoverage/probe.ts';
import {materialize} from '../src/derive/catalogue.ts';
import {validateCoverage} from '../src/runtimeCoverage/report.ts';
const [webRoot,inputRoot,output='.cache/runtime-coverage.json']=process.argv.slice(2);if(!webRoot||!inputRoot)throw Error('Usage: audit_runtime_coverage.ts WEB_ROOT EXISTING_CACHE_DIRECTORY OUTPUT');
mkdirSync('.cache',{recursive:true});const adapter=resolve('.cache/consumer.mjs');
const bundle=await buildConsumerAdapter(webRoot,adapter);
const api=await import(pathToFileURL(adapter).href);
const index=JSON.parse(readFileSync(join(inputRoot,'index.json'),'utf8')),files=index.rows.map((r:any)=>({...r,body:JSON.parse(readFileSync(join(inputRoot,r.path),'utf8'))}));
const lookup=files.find((f:any)=>f.url.endsWith('/data/generated/gendata-spell-source-lookup.json'));
const ctx=context(files.map((f:any)=>f.body)),aliases=JSON.parse(readFileSync('aliases/identities.json','utf8')),aliasMap=new Map((Array.isArray(aliases)?aliases:aliases.aliases).map((a:any)=>[a.inventoryKey,a]));
const catalog=new Map<string,any>();
const add=(body:any,revision:string,namespace:string,operation='normalize')=>{for(const e of api.normalizeCatalogData(body,revision,namespace,operation)){
 if(e.kind==='spell'){const value=lookup?.body[e.source.toLowerCase()]?.[e.name.toLowerCase()]||lookup?.body[e.source.toLowerCase()]?.[e.english.toLowerCase()];e.raw._spellClasses=value?.class;e.raw._spellSources=value;e.raw._spellClassLookupLoaded=!!lookup;}
 catalog.set(e.id,e);
}};
const equipment:any={};
for(const file of files){const brew=file.url.includes('homebrew.kiwee');add(brew?api.homebrewBody(file.body):file.body,file.sha256,brew?'kiwee-homebrew':'kiwee');if(/\/data\/(items-base|items|magicvariants)\.json$/.test(file.url))Object.assign(equipment,file.body);if(brew&&file.body.magicvariant?.length&&file.body.baseitem?.length)add(api.homebrewBody(file.body),file.sha256,'kiwee-homebrew','magicItems');}
add(equipment,'combined-existing-cache','kiwee');add(equipment,'combined-existing-cache','kiwee','magicItems');
const entries=[...catalog.values()],byIdentity=new Map<string,any>();
for(const e of entries){const pending=provisional(e.raw._category,e.raw,ctx,e.packId);const alias:any=aliasMap.get(pending.key);if(alias)pending.engName=alias.engName;if(pending.unresolved.some((field:string)=>field!=='engName'||!alias))continue;const {key,unresolved,...fields}=pending;try{byIdentity.set(createIdentity({...fields,packId:e.packId}).key,e);}catch{}}
const snapshotBytes=readFileSync('reports/progress/automation-rule-status.json'),snapshot=JSON.parse(snapshotBytes.toString());
const denominator=materialize(files.map((f:any)=>({input:{namespace:f.url.includes('homebrew.kiwee')?'kiwee-homebrew':'kiwee',path:new URL(f.url).pathname,role:'catalog',sha256:f.sha256},body:f.body})),Array.isArray(aliases)?aliases:aliases.aliases);
const identities=new Set(denominator.rows.map(r=>r.identity.key));if(identities.size!==snapshot.records.length||snapshot.records.some((r:any)=>!identities.has(r.id)))throw Error('Existing corpus and pinned 18,789-rule inventory differ; counts are unknown');
for(const file of files)if(createHash('sha256').update(JSON.stringify(file.body)).digest('hex')!==file.sha256)throw Error('Existing cache input hash mismatch: '+file.url);
const matched=snapshot.records.filter((r:any)=>byIdentity.has(r.id));console.log(JSON.stringify({catalog:entries.length,total:snapshot.records.length,matched:matched.length,unmatched:snapshot.records.filter((r:any)=>!byIdentity.has(r.id)).map((r:any)=>({id:r.id,kind:r.identity.kind})).slice(0,12)}));
const records=[];let at=0;
for(const row of snapshot.records){const e=byIdentity.get(row.id),parents:any[]=[];if(e?.raw.className){const parent=entries.find(p=>p.kind==='class'&&p.source===(e.raw.classSource||'PHB')&&[p.name,p.english].includes(e.raw.className));if(parent)parents.push(parent);}
 const witness=e?probeEntry(api,e,entries,parents):null;records.push({id:row.id,source:row.source,reviewed:row.reviewed,status:e?(witness?'implemented':'manual'):'unavailable',...(witness?{witness}:{})});if(++at%1000===0)console.log(at,records.filter(r=>r.status==='implemented').length);
}
const sha=(v:Buffer|string)=>createHash('sha256').update(v).digest('hex');
const sources=snapshot.sources.map((s:any)=>{const rows=records.filter(r=>r.source===s.id);return {...s,total:rows.length,reviewed:rows.filter(r=>r.reviewed).length,implemented:rows.filter(r=>r.status==='implemented').length,unresolved:rows.filter(r=>r.status==='unresolved').length};}).filter((s:any)=>s.total);
const modules=Object.keys(bundle.metafile!.inputs).map(p=>resolve(p)).filter(p=>p.replaceAll('\\','/').startsWith(resolve(webRoot).replaceAll('\\','/')+'/src/')).map(p=>({path:p.slice(resolve(webRoot).length+1).replaceAll('\\','/'),sha256:sha(readFileSync(p))})).sort((a,b)=>a.path.localeCompare(b.path));
const report={schemaVersion:1,definition:'at least one current calculation or usable choice; remaining effects are manual',updatedAt:new Date().toISOString(),consumer:{repository:'FullPeople/DND-card-web',revision:execFileSync('git',['rev-parse','HEAD'],{cwd:webRoot,encoding:'utf8'}).trim(),modules},snapshotSha256:sha(snapshotBytes),inputs:index.rows.map((r:any)=>({url:r.url,sha256:r.sha256})),total:records.length,reviewed:records.filter(r=>r.reviewed).length,implemented:records.filter(r=>r.status==='implemented').length,unresolved:records.filter(r=>r.status==='unresolved').length,unavailable:records.filter(r=>r.status==='unavailable').length,sources,records};
for(const row of report.records){const w=row.witness;if(w&&w.kind.startsWith('calculated-')&&!Array.isArray(w.before)&&typeof w.before==='object'&&w.before!==null&&typeof w.after==='object'&&w.after!==null){const b=w.before as Record<string,unknown>,a=w.after as Record<string,unknown>,keys=[...new Set([...Object.keys(b),...Object.keys(a)])].filter(k=>JSON.stringify(b[k])!==JSON.stringify(a[k]));w.before=Object.fromEntries(keys.map(k=>[k,b[k]??null]));w.after=Object.fromEntries(keys.map(k=>[k,a[k]??null]));}}
validateCoverage(report);writeFileSync(output,JSON.stringify(report)+'\n');console.log(JSON.stringify({total:report.total,reviewed:report.reviewed,implemented:report.implemented,unresolved:report.unresolved,output}));
