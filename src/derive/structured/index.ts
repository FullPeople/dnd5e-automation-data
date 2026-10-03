import { abilities } from './abilities.ts';
import { proficiencies } from './proficiencies.ts';
import { traits } from './traits.ts';
import { resources } from './resources.ts';
import { classes } from './classes.ts';
import { equipment } from './equipment.ts';
import { spells } from './spells.ts';
import { choices } from './choices.ts';
import { result, unsupported, type DerivationContext } from './common.ts';
import type { Material } from '../catalogue.ts';
import { STRUCTURED_FIELDS } from '../../fetch/manifest.ts';
import { containsCjk } from '../../identity.ts';
import { parseFormula } from '../../validate/formula.ts';
export function deriveStructured(row:Material,ctx:DerivationContext) {
  const out=result(),raw=row.raw;
  abilities(raw,out);proficiencies(raw,ctx,out);traits(raw,ctx,out);resources(raw,out);classes(row,ctx,out);equipment(row,ctx,out);spells(row,ctx,out);choices(row,ctx,out);
  for(const field of STRUCTURED_FIELDS)if(Object.hasOwn(raw,field)&&!out.handled.has(field))unsupported(out,'structuredField','unmapped-field',field);
  for(const [field,family,code]of [['script','scripts','script-execution-deferred'],['_custom','customRule','custom-rule-conversion-required'],['_workbenchCustom','customRule','custom-rule-conversion-required'],['attackBonus','manualWeapon','manual-weapon-data'],['items','equipmentBundle','equipment-bundle-pending']] as const)if(Object.hasOwn(raw,field)){out.handled.add(field);unsupported(out,family,code,field);}
  if(raw._copy)unsupported(out,'inheritance','unresolved-copy');if(raw._unresolvedParent||raw._unresolvedVariant)unsupported(out,'inheritance','unresolved-parent');
  // Avoid publishing unsafe upstream formulas or token payloads, while retaining gaps.
  const sanitize=(value:any,path:string):any=>{
    if(typeof value==='string'&&containsCjk(value)){unsupported(out,'normalization','unresolved-token',path);return undefined;}
    if(Array.isArray(value))return value.map((part,i)=>sanitize(part,`${path}/${i}`)).filter(part=>part!==undefined);
    if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).flatMap(([key,part])=>{if(['formula','preparedFormula'].includes(key)&&typeof part==='string')try{parseFormula(part);}catch{unsupported(out,'formula','unmapped-formula',path);return [];}const next=sanitize(part,`${path}/${key}`);return next===undefined?[]:[[key,next]];}));
    return value;
  };
  out.mechanics=sanitize(out.mechanics,'mechanics');
  return out;
}
