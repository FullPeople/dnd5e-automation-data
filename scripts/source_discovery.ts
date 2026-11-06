import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {KINDS} from '../src/fetch/manifest.ts';
const sha=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const hash=(value:unknown)=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const text=(value:unknown):value is string=>typeof value==='string'&&!!value.trim()&&value.length<=2000&&!/[\u0000-\u001f]/.test(value);
const onlyKeys=(value:unknown,keys:readonly string[])=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(key=>keys.includes(key));
const sourceId=(value:string)=>value.trim().toUpperCase();
const sourceUrl=(value:unknown)=>{try{const url=new URL(String(value));return url.protocol==='https:'&&['5e.kiwee.top','homebrew.kiwee.top','raw.githubusercontent.com'].includes(url.hostname)&&!url.username&&!url.password&&!url.search&&!url.hash;}catch{return false;}};
/** Compare URL transport spelling with the Git member name; never use this
 * decoding to locate a private filesystem input. */
export function sourceInputMatchesGitPath(inputUrl:string,localPath:string,upstreamPath:string):boolean{
 try{const url=new URL(inputUrl);return url.protocol==='https:'&&['5e.kiwee.top','homebrew.kiwee.top'].includes(url.hostname)&&!url.username&&!url.password&&!url.search&&!url.hash&&url.pathname.slice(1)===localPath&&decodeURIComponent(url.pathname.slice(1))===upstreamPath;}catch{return false;}
}
export interface DiscoveryInput {url:string;sha256:string;rawSha256:string;role:'legacy'|'extra';body:Record<string,any>;recoveredFrom?:string}
export interface SourceDiscoveryInput {
 producerRevision:string;generatedAt:string;legacySnapshotSha256:string;legacySources:{id:string;name:string}[];
 legacyIdentities:string[];candidateIdentities:{id:string;source:string}[];inputs:DiscoveryInput[];
 index:{url:string;sha256:string;body:Record<string,unknown>};diagnostics:{key:string;code:string;files:string[]}[];
}
export interface SourceDiscoveryReport {
 schemaVersion:1;definition:'discovered directory; no source-review, modeling, execution or acceptance credit';producerRevision:string;generatedAt:string;legacySnapshotSha256:string;
 index:{url:string;sha256:string;sourceIds:number};inputs:Omit<DiscoveryInput,'body'>[];
 sources:{id:string;name:string;names:string[];nameStatus:'baseline'|'unique-metadata'|'code-only'|'needs-review';inventory:'legacy'|'pending';inputRefs:string[]}[];
 counts:{sources:number;legacyInputs:number;extraInputs:number;legacyRegisteredIdentities:number;newCandidateIdentities:number;provisionalCombinedIdentities:number};
 identitySets:{legacySha256:string;candidateSha256:string};diagnostics:{counts:Record<string,number>;sha256:string};
 indexIssues:{id:string;reason:'unusable-index-path'}[];unclassifiedExtraFiles:{url:string;sha256:string;reason:'needs-category-review'}[];
 creditAdded:{sourceReviewed:0;modeled:0;executed:0;accepted:0};sourceBodiesPublished:false;
}
/** Compare separate epochs without deriving a mixed corpus or deleting absent
 * legacy identities. A source-directory union is not the current rule count. */
export function compareDiscoveryEpochs(legacyIdentities:readonly string[],currentRows:readonly {id:string;source:string}[]){
 assert(legacyIdentities.every(text)&&new Set(legacyIdentities).size===legacyIdentities.length,'Invalid or duplicate legacy identity');
 assert(currentRows.every(row=>text(row.id)&&text(row.source))&&new Set(currentRows.map(row=>row.id)).size===currentRows.length,'Invalid or duplicate current identity');
 const old=new Set(legacyIdentities),current=new Set(currentRows.map(row=>row.id));
 const candidateIdentities=currentRows.filter(row=>!old.has(row.id)).map(row=>({id:row.id,source:row.source}));
 const absentLegacyIdentities=legacyIdentities.filter(id=>!current.has(id));
 return {candidateIdentities,absentLegacyIdentities,currentIdentityCount:currentRows.length,retainedIdentityCount:currentRows.length-candidateIdentities.length,provisionalUnionIdentityCount:legacyIdentities.length+candidateIdentities.length};
}
export function buildSourceDiscovery(input:SourceDiscoveryInput):SourceDiscoveryReport {
 assert(new Set(input.legacyIdentities).size===input.legacyIdentities.length&&new Set(input.candidateIdentities.map(row=>row.id)).size===input.candidateIdentities.length,'Duplicate identity');
 const original=new Set(input.legacyIdentities);assert(input.candidateIdentities.every(row=>text(row.id)&&text(row.source)&&!original.has(row.id)),'Overlapping or invalid identity');
 const candidateSha=sha(input.candidateIdentities),baselineNames=new Map(input.legacySources.map(row=>[sourceId(row.id),row.name])),rows=new Map<string,{names:Set<string>;refs:Set<string>}>(),indexIssues:SourceDiscoveryReport['indexIssues']=[];
 const add=(rawId:unknown,name:unknown,ref:string)=>{assert(text(rawId),'Invalid source directory identity');const id=sourceId(rawId),row=rows.get(id)||{names:new Set<string>(),refs:new Set<string>()};if(text(name))row.names.add(name.trim());row.refs.add(ref);rows.set(id,row);};
 for(const row of input.legacySources)add(row.id,row.name,input.legacySnapshotSha256);
 for(const [id,path]of Object.entries(input.index.body)){
  add(id,undefined,input.index.sha256);
  if(typeof path!=='string'||!path.endsWith('.json')||/^[a-z]+:|^[\\/]|[?#\\]/i.test(path)||path.split('/').some(part=>!part||part==='.'||part==='..'))indexIssues.push({id:sourceId(id),reason:'unusable-index-path'});
 }
 for(const file of input.inputs){
  for(const row of Array.isArray(file.body._meta?.sources)?file.body._meta.sources:[])add(row.json,row.full||row.abbreviation,file.sha256);
  // Only these primary metadata indexes own book/adventure titles. A chapter's
  // document ID is not a source ID (for example PS-A versus declared PSA).
  const metadataKind=file.url==='https://5e.kiwee.top/data/books.json'?'book':file.url==='https://5e.kiwee.top/data/adventures.json'?'adventure':undefined;
  if(metadataKind)for(const row of Array.isArray(file.body[metadataKind])?file.body[metadataKind]:[])if(text(row?.source))add(row.source,row.name,file.sha256);
 }
 for(const row of input.candidateIdentities)add(row.source,undefined,candidateSha);
 const diagnostics:Record<string,number>={};for(const row of input.diagnostics)diagnostics[row.code]=(diagnostics[row.code]||0)+1;
 const sources=[...rows].map<SourceDiscoveryReport['sources'][number]>(([id,row])=>{const names=[...row.names].sort(),baseline=baselineNames.get(id);return{id,name:baseline|| (names.length===1?names[0]:id),names,nameStatus:baseline?'baseline':names.length===1?'unique-metadata':names.length?'needs-review':'code-only',inventory:baselineNames.has(id)?'legacy':'pending',inputRefs:[...row.refs].sort()};}).sort((a,b)=>a.id.localeCompare(b.id));
 const report:SourceDiscoveryReport={schemaVersion:1,definition:'discovered directory; no source-review, modeling, execution or acceptance credit',producerRevision:input.producerRevision,generatedAt:input.generatedAt,legacySnapshotSha256:input.legacySnapshotSha256,index:{url:input.index.url,sha256:input.index.sha256,sourceIds:Object.keys(input.index.body).length},inputs:input.inputs.map(file=>({url:file.url,sha256:file.sha256,rawSha256:file.rawSha256,role:file.role,...(file.recoveredFrom?{recoveredFrom:file.recoveredFrom}:{})})),sources,
  counts:{sources:sources.length,legacyInputs:input.inputs.filter(row=>row.role==='legacy').length,extraInputs:input.inputs.filter(row=>row.role==='extra').length,legacyRegisteredIdentities:input.legacyIdentities.length,newCandidateIdentities:input.candidateIdentities.length,provisionalCombinedIdentities:input.legacyIdentities.length+input.candidateIdentities.length},identitySets:{legacySha256:sha(input.legacyIdentities),candidateSha256:candidateSha},diagnostics:{counts:diagnostics,sha256:sha(input.diagnostics)},indexIssues,
  unclassifiedExtraFiles:input.inputs.filter(file=>file.role==='extra'&&!KINDS.some(kind=>Array.isArray(file.body[kind])&&file.body[kind].length)).map(file=>({url:file.url,sha256:file.sha256,reason:'needs-category-review'})),creditAdded:{sourceReviewed:0,modeled:0,executed:0,accepted:0},sourceBodiesPublished:false};
 return validateSourceDiscovery(report);
}
export function validateSourceDiscovery(value:unknown):SourceDiscoveryReport {
 const report=value as SourceDiscoveryReport;
 assert(onlyKeys(report,['schemaVersion','definition','producerRevision','generatedAt','legacySnapshotSha256','index','inputs','sources','counts','identitySets','diagnostics','indexIssues','unclassifiedExtraFiles','creditAdded','sourceBodiesPublished']),'Unexpected discovery report fields');
 assert(report?.schemaVersion===1&&report.definition==='discovered directory; no source-review, modeling, execution or acceptance credit','Invalid source discovery definition');
 assert(/^[a-f0-9]{40}$/.test(report.producerRevision)&&Number.isFinite(Date.parse(report.generatedAt))&&hash(report.legacySnapshotSha256),'Invalid discovery provenance');
 assert(onlyKeys(report.index,['url','sha256','sourceIds'])&&sourceUrl(report.index?.url)&&hash(report.index.sha256)&&Number.isSafeInteger(report.index.sourceIds)&&report.index.sourceIds>=0,'Invalid discovery source index');
 assert(Array.isArray(report.inputs)&&report.inputs.every(row=>onlyKeys(row,['url','sha256','rawSha256','role','recoveredFrom'])&&sourceUrl(row.url)&&hash(row.sha256)&&hash(row.rawSha256)&&['legacy','extra'].includes(row.role)&&(!row.recoveredFrom||sourceUrl(row.recoveredFrom))),'Invalid discovery input pin');
 assert(new Set(report.inputs.map(row=>row.role+'\0'+row.url)).size===report.inputs.length,'Duplicate discovery input');
 assert(Array.isArray(report.sources)&&new Set(report.sources.map(row=>row.id)).size===report.sources.length,'Duplicate source directory identity');
 const refs=new Set([report.legacySnapshotSha256,report.index.sha256,report.identitySets?.candidateSha256,...report.inputs.map(row=>row.sha256)]);
 for(const row of report.sources)assert(onlyKeys(row,['id','name','names','nameStatus','inventory','inputRefs'])&&text(row.id)&&sourceId(row.id)===row.id&&text(row.name)&&Array.isArray(row.names)&&row.names.every(text)&&['baseline','unique-metadata','code-only','needs-review'].includes(row.nameStatus)&&['legacy','pending'].includes(row.inventory)&&Array.isArray(row.inputRefs)&&row.inputRefs.length>0&&new Set(row.inputRefs).size===row.inputRefs.length&&row.inputRefs.every(ref=>hash(ref)&&refs.has(ref)),'Invalid discovered source');
 assert(onlyKeys(report.counts,['sources','legacyInputs','extraInputs','legacyRegisteredIdentities','newCandidateIdentities','provisionalCombinedIdentities']),'Unexpected discovery count fields');
 assert(report.counts?.sources===report.sources.length&&report.counts.legacyInputs===report.inputs.filter(row=>row.role==='legacy').length&&report.counts.extraInputs===report.inputs.filter(row=>row.role==='extra').length,'Invalid discovery counts');
 for(const field of ['legacyRegisteredIdentities','newCandidateIdentities','provisionalCombinedIdentities']as const)assert(Number.isSafeInteger(report.counts[field])&&report.counts[field]>=0,'Invalid candidate identity count');
 assert(report.counts.provisionalCombinedIdentities===report.counts.legacyRegisteredIdentities+report.counts.newCandidateIdentities,'Discovery identity denominator changed');
 assert(onlyKeys(report.identitySets,['legacySha256','candidateSha256'])&&onlyKeys(report.diagnostics,['counts','sha256'])&&hash(report.identitySets?.legacySha256)&&hash(report.identitySets?.candidateSha256)&&hash(report.diagnostics?.sha256),'Invalid identity/diagnostic provenance');
 assert(Object.values(report.diagnostics.counts).every(count=>Number.isSafeInteger(count)&&count>=0),'Invalid diagnostic counts');
 assert(Array.isArray(report.indexIssues)&&report.indexIssues.every(row=>onlyKeys(row,['id','reason'])&&text(row.id)&&row.reason==='unusable-index-path'),'Invalid unknown index state');
 assert(Array.isArray(report.unclassifiedExtraFiles)&&report.unclassifiedExtraFiles.every(row=>onlyKeys(row,['url','sha256','reason'])&&row.reason==='needs-category-review'&&report.inputs.some(pin=>pin.role==='extra'&&pin.url===row.url&&pin.sha256===row.sha256)),'Invalid unclassified source file');
 assert(report.sourceBodiesPublished===false&&onlyKeys(report.creditAdded,['sourceReviewed','modeled','executed','accepted'])&&['sourceReviewed','modeled','executed','accepted'].every(key=>report.creditAdded[key as keyof typeof report.creditAdded]===0),'Discovery cannot grant review or execution credit');
 return report;
}
