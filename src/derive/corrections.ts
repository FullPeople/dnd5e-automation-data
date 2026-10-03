import { containsCjk } from '../identity.ts';
import type { Evidence, Provenance } from '../protocol.ts';
import type { InputManifest } from '../fetch/manifest.ts';
import type { Material, Diagnostic } from './catalogue.ts';
export interface InputCorrection { identityKey:string; input:string; sha256:string; path:string[]; previous:number; value:number; reviewer:string; reviewedAt:string; evidence:Evidence; reason:string }
/** Reviewed numeric annotations only. Never read text to infer currency at runtime. */
export function applyCorrections(rows:Material[],manifest:InputManifest,corrections:InputCorrection[]) {
  const hashes=new Map(manifest.inputs.map(input=>[`${input.namespace}/${input.path}`,input.sha256]));
  const annotations=new Map<string,{provenance:Provenance;evidence:Evidence}[]>(),diagnostics:Diagnostic[]=[],keys=new Set<string>();
  const byIdentity=new Map(rows.map(row=>[row.identity.key,{...row}]));
  for(const [index,correction]of corrections.entries()) {
    const key=`${correction.identityKey}/${correction.path.join('/')}`;
    if(keys.has(key))throw Error('Duplicate input correction');keys.add(key);
    if(containsCjk(JSON.stringify(correction))||!/^startingEquipment\/(?:defaultData\/)?\d+\/[A-Za-z_]\/(?:\d+)\/(?:value|containsValue)$/.test(correction.path.join('/'))||!Number.isSafeInteger(correction.value)||correction.value<0||correction.value>100000000||!Number.isSafeInteger(correction.previous)||!correction.reviewer||!/^\d{4}-\d{2}-\d{2}$/.test(correction.reviewedAt)||!Number.isSafeInteger(correction.evidence?.page)||correction.evidence.page<1||correction.evidence.quote&&correction.evidence.quote.trim().split(/\s+/).length>15)throw Error('Invalid numeric input correction');
    const row=byIdentity.get(correction.identityKey);
    if(!row||hashes.get(correction.input)!==correction.sha256){diagnostics.push({key:correction.identityKey,code:'input-correction-stale',files:[correction.input]});continue;}
    const copy=structuredClone(row.raw);let target:any=copy;const parts=correction.path.slice(0,-1);
    for(const part of parts)target=target&&Object.hasOwn(target,part)?target[part]:undefined;
    const field=correction.path.at(-1)!;
    if(!target||!Object.hasOwn(target,field)||target[field]!==correction.previous&&target[field]!==correction.value){diagnostics.push({key:correction.identityKey,code:'input-correction-shape-changed',files:[correction.input]});continue;}
    target[field]=correction.value;row.raw=copy;
    annotations.set(row.identity.key,[...(annotations.get(row.identity.key)||[]),{provenance:{layer:'overlay',ref:`aliases/input-corrections.json#/${index}`,reviewer:correction.reviewer,reviewedAt:correction.reviewedAt},evidence:correction.evidence}]);
  }
  return {rows:rows.map(row=>byIdentity.get(row.identity.key)!),annotations,diagnostics};
}
