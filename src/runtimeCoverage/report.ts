export interface CoverageReport {
 schemaVersion:1;definition:string;updatedAt:string;consumer:{repository:string;revision:string;modules:{path:string;sha256:string}[]};snapshotSha256:string;
 total:number;reviewed:number;implemented:number;unresolved:number;unavailable:number;
 sources:{id:string;name:string;origin:string;total:number;reviewed:number;implemented:number;unresolved:number}[];
 records:{id:string;source:string;reviewed:boolean;status:'implemented'|'manual'|'unresolved'|'unavailable';witness?:{kind:string;level:number;edition:string;before:unknown;after:unknown}}[];
 inputs:{url:string;sha256:string}[];
}
const sha=(s:unknown,n=64)=>typeof s==='string'&&new RegExp(`^[a-f0-9]{${n}}$`).test(s);
const n=(v:unknown)=>Number.isSafeInteger(v)&&Number(v)>=0;
// A cast witness is a closed observed transaction, never a supported tag or
// upstream payload. Keep the historical single-mechanism definition unchanged.
function ordinaryTransaction(w:NonNullable<CoverageReport['records'][number]['witness']>):boolean {
 const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
 const keys=(v:Record<string,unknown>,expected:string[])=>Object.keys(v).length===expected.length&&expected.every(k=>Object.hasOwn(v,k));
 const id=(v:unknown)=>typeof v==='string'&&v.length>0&&v.length<2000;
 const integer=(v:unknown,min:number,max:number)=>Number.isSafeInteger(v)&&Number(v)>=min&&Number(v)<=max;
 const b=w.before,a=w.after;
 if(!object(b)||!object(a)||!keys(b,['spellId','classId','ready','remaining'])||!keys(a,['spellId','classId','spellLevel','castLevel','casts','remaining','resourceDebit','duplicateUnchanged','exhausted','nativePreserved','manualPreserved','sequenceDelta']))return false;
 if(!id(b.spellId)||!id(b.classId)||a.spellId!==b.spellId||a.classId!==b.classId||b.ready!==true||!integer(b.remaining,0,100)||!integer(a.spellLevel,0,9)||!integer(a.castLevel,0,9)||Number(a.castLevel)<Number(a.spellLevel)||!integer(a.casts,1,100)||a.sequenceDelta!==a.casts||a.remaining!==0||a.duplicateUnchanged!==true||a.nativePreserved!==true||a.manualPreserved!==true)return false;
 return a.spellLevel===0
  ?b.remaining===0&&a.castLevel===0&&a.casts===1&&a.resourceDebit===0&&a.exhausted===false
  :Number(b.remaining)>0&&a.casts===b.remaining&&a.resourceDebit===a.casts&&a.exhausted===true;
}
export function validateCoverage(value:unknown):CoverageReport {
 const v=value as CoverageReport;
 const require=(fact:unknown,message:string)=>{if(!fact)throw Error('Invalid runtime coverage: '+message);};
 require(v?.schemaVersion===1&&Number.isFinite(Date.parse(v.updatedAt))&&v.definition==='at least one current calculation or usable choice; remaining effects are manual','identity/definition');
 require(v.consumer?.repository==='FullPeople/DND-card-web'&&sha(v.consumer.revision,40)&&sha(v.snapshotSha256),'version identity');
 require(Array.isArray(v.consumer.modules)&&v.consumer.modules.length>0&&v.consumer.modules.every(m=>/^src\/[\w./-]+\.(tsx?|json)$/.test(m.path)&&!m.path.split('/').includes('..')&&sha(m.sha256))&&new Set(v.consumer.modules.map(m=>m.path)).size===v.consumer.modules.length,'consumer modules');
 require(Array.isArray(v.inputs)&&v.inputs.length>0&&v.inputs.every(i=>/^https:\/\/(5e|homebrew)\.kiwee\.top\//.test(i.url)&&sha(i.sha256))&&new Set(v.inputs.map(i=>i.url)).size===v.inputs.length,'existing input hashes');
 require(['total','reviewed','implemented','unresolved','unavailable'].every(k=>n(v[k as keyof CoverageReport]))&&v.reviewed<=v.total&&v.implemented<=v.total,'counts');
 require(Array.isArray(v.records)&&v.records.length===v.total&&new Set(v.records.map(r=>r.id)).size===v.total,'one record per identity');
 for(const r of v.records){
  require(typeof r.id==='string'&&r.id.length<2000&&typeof r.source==='string'&&typeof r.reviewed==='boolean'&&['implemented','manual','unresolved','unavailable'].includes(r.status),'record');
  const w=r.witness;
  if(r.status==='implemented'){
   require(w&&/^(ordinary-source-cast|calculated-(sheet|resource|weapon|speed|equipment-context|training)|source-spell-(grant|choice)|choice:(skills|tools|languages|content|equipment|abilities|spells))$/.test(w.kind)&&Number.isInteger(w.level)&&w.level>=1&&w.level<=20&&['2014','2024'].includes(w.edition)&&w.before!==undefined&&w.after!==undefined&&JSON.stringify(w.before)!==JSON.stringify(w.after),'observed calculation/choice');
   if(w?.kind==='ordinary-source-cast')require(ordinaryTransaction(w),'ordinary transaction');
  }
  else require(w===undefined,'unverified record cannot have a positive witness');
 }
 require(v.records.filter(r=>r.reviewed).length===v.reviewed&&v.records.filter(r=>r.status==='implemented').length===v.implemented&&v.records.filter(r=>r.status==='unresolved').length===v.unresolved&&v.records.filter(r=>r.status==='unavailable').length===v.unavailable,'derived counts');
 require(Array.isArray(v.sources)&&new Set(v.sources.map(s=>s.id)).size===v.sources.length,'sources');
 for(const s of v.sources){const rows=v.records.filter(r=>r.source===s.id);require(typeof s.name==='string'&&['official','third-party','project'].includes(s.origin)&&s.total===rows.length&&s.reviewed===rows.filter(r=>r.reviewed).length&&s.implemented===rows.filter(r=>r.status==='implemented').length&&s.unresolved===rows.filter(r=>r.status==='unresolved').length,'source totals');}
 require(v.sources.reduce((sum,s)=>sum+s.total,0)===v.total&&v.sources.reduce((sum,s)=>sum+s.implemented,0)===v.implemented,'source partition');
 return v;
}
