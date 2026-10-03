import { createIdentity } from '../../identity.ts';
import { identity as provisional, label } from '../../inventory/identity.ts';
import { deriveFoundry, type Decision } from './index.ts';
import { scaleIdentifier } from './scales.ts';
import { makeContext } from '../structured/common.ts';
import type { IdentityAlias, Material } from '../catalogue.ts';
import type { IdentityContext } from '../../inventory/identity.ts';
import type { CorpusBody } from '../../report/inventory.ts';
import type { AutomationRecord, Mechanics, Unsupported } from '../../protocol.ts';
export interface FoundryReview { key: string; source: string; kind: string; engName: string; classEngName?: string; file: string; pointer: string; inputSha256: string; migrationVersion?: number; matched: boolean; flags: string[]; decisions: Decision[]; mechanisms: Record<string,number>; translation: Mechanics; unsupported: Unsupported[] }
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
export function mergeMechanics(base:Mechanics,extra:Mechanics,gaps:Unsupported[]):Mechanics {
  const merged=structuredClone(base);
  for(const [key,value]of Object.entries(extra)){
    const old=(merged as Record<string,any>)[key];
    if(Array.isArray(value)){
      const list:any[]=[...(old||[])];
      for(const item of value){
        if(list.some(row=>same(row,item)))continue;
        const conflict=list.some(row=>key==='modifiers'?row.target===item.target&&same(row.condition,item.condition)&&!same(row,item):key==='resources'||key==='scales'||key==='actions'?row.key===item.key:false);
        if(conflict){gaps.push({family:'layerConflict',code:'structured-foundry-conflict',ref:`mechanics/${key}`});continue;}
        list.push(item);
      }
      (merged as Record<string,any>)[key]=list;
    }else if(!old)(merged as Record<string,any>)[key]=value;
    else if(!same(old,value))gaps.push({family:'layerConflict',code:'structured-foundry-conflict',ref:`mechanics/${key}`});
  }
  return merged;
}
export function attachFoundry(files:CorpusBody[],rows:Material[],records:AutomationRecord[],context:IdentityContext,aliases:IdentityAlias[]):FoundryReview[] {
  const index=new Map(records.map(row=>[row.identity.key,row])),materials=new Map(rows.map(row=>[row.identity.key,row])),aliasMap=new Map(aliases.map(row=>[row.inventoryKey,row])),ctx=makeContext(rows),reviews:FoundryReview[]=[];
  const scaleAliases=new Map<string,string>();
  for(const file of files.filter(f=>f.input.role==='foundry'))for(const raws of Object.values(file.body))if(Array.isArray(raws))for(const raw of raws)for(const a of raw.advancement||[]){const normalized=scaleIdentifier(a.configuration?.identifier);if(normalized)scaleAliases.set(a.configuration.identifier,normalized);}
  for(const file of files.filter(f=>f.input.role==='foundry'))for(const [kind,raws]of Object.entries(file.body))if(Array.isArray(raws))for(const [at,raw]of raws.entries()){
    const pending=provisional(kind,raw,context,file.input.namespace),alias=aliasMap.get(pending.key);if(alias)pending.engName=alias.engName;
    const unresolved=pending.unresolved.filter(f=>!(alias&&f==='engName'));
    const {key:_key,unresolved:_unresolved,...fields}=pending;
    let key=pending.key;
    if(!unresolved.length)try{key=createIdentity({...fields,packId:file.input.namespace}).key;}catch{unresolved.push('canonicalIdentity');}
    const record=unresolved.length?undefined:index.get(key),row=materials.get(key),pointer=`/${kind}/${at}`;
    const derived=record&&row?deriveFoundry(raw,row,ctx,scaleAliases):undefined;
    if(record&&derived){
      if(derived.flags.length)record.foundryFlags=[...new Set([...(record.foundryFlags||[]),...derived.flags])] as NonNullable<AutomationRecord['foundryFlags']>;
      record.provenance.push({layer:'foundry',ref:`${file.input.path}#${pointer}`,...(raw.migrationVersion===undefined?{}:{migrationVersion:raw.migrationVersion})});
      record.unsupported.push(...derived.unsupported);
      record.mechanics=mergeMechanics(record.mechanics||{},derived.mechanics,record.unsupported);
      if(!Object.values(record.mechanics).some(v=>Array.isArray(v)?v.length:!!v))delete record.mechanics;
    }
    reviews.push({key:label(key),source:pending.source,kind,engName:pending.engName,...(pending.classEngName?{classEngName:pending.classEngName}:{}),file:file.input.path,pointer,inputSha256:file.input.sha256,migrationVersion:raw.migrationVersion,matched:!!record,flags:derived?.flags||['isIgnored','ignoreSrdEffects','ignoreSrdActivities'].filter(f=>raw[f]),decisions:derived?.decisions||[],mechanisms:Object.fromEntries(Object.entries(derived?.mechanics||{}).map(([k,v])=>[k,Array.isArray(v)?v.length:1])),translation:derived?.mechanics||{},unsupported:derived?.unsupported||[{family:'foundryOrphan',code:unresolved.length?'unresolved-foundry-identity':'unmatched-foundry-entry',ref:`${file.input.path}#${pointer}`} ]});
  }
  return reviews;
}
