import { ABILITIES, fields, grant, integer, modifier, plain, unsupported, type DerivationContext, type Result } from './common.ts';
import { proficiencyBlocks } from './proficiencies.ts';
import { containsCjk } from '../../identity.ts';
import type { Material, Raw } from '../catalogue.ts';
import type { ClassModel } from '../../protocol.ts';
export function classes(row: Material, ctx: DerivationContext, out: Result): void {
  const raw = row.raw, model: ClassModel = {};
  const addProgression = (field: string, target: 'cantripProgression'|'preparedProgression'|'knownProgression') => fields(raw,out,[field],(_,value) => {
    if (Array.isArray(value) && value.length <= 20 && value.every(n=>integer(n,0,100))) model[target]=value.slice(); else unsupported(out,'classCasting','progression-shape',field);
  });
  fields(raw,out,['hd'],(field,value)=>{ if (plain(value)&&value.number===1&&[4,6,8,10,12].includes(value.faces)) model.hitDie=value.faces; else unsupported(out,'hitDice','hit-die-shape',field); });
  fields(raw,out,['proficiency'],(field,value)=>proficiencyBlocks(value,'savingThrow','ability',field,ctx,out,'firstClass'));
  for (const [field,scope] of [['startingProficiencies','firstClass'],['multiclassing','multiclass']] as const) fields(raw,out,[field],(_,value)=>{
    const block = field==='multiclassing'?value?.proficienciesGained:value;
    if (block) for (const [name,type,family] of [['skills','skillProficiency','skill'],['tools','toolProficiency','tool'],['languages','languageProficiency','language'],['armor','armorProficiency','armor'],['weapons','weaponProficiency','weapon']] as const) if (block[name]!==undefined) proficiencyBlocks(block[name],type,family,`${field}.${name}`,ctx,out,scope);
    if (field==='multiclassing' && (value?.requirements || value?.requirementsSpecial || value?.spellcasting)) unsupported(out,'multiclassing','multiclass-eligibility',field);
  });
  fields(raw,out,['casterProgression'],(field,value)=>{ const mapped=({'1/2':'half','1/3':'third'} as Record<string,string>)[value]||value;if (['full','half','third','artificer','pact','none'].includes(mapped)) model.casterProgression=mapped;else unsupported(out,'classCasting','caster-progression',field); });
  fields(raw,out,['spellcastingAbility'],(field,value)=>{ if (ABILITIES.includes(value)) model.spellcastingAbility=value;else unsupported(out,'classCasting','casting-ability',field); });
  addProgression('cantripProgression','cantripProgression');addProgression('preparedSpellsProgression','preparedProgression');addProgression('spellsKnownProgression','knownProgression');
  fields(raw,out,['preparedSpells'],(field,value)=>{
    if (typeof value !== 'string') { unsupported(out,'classCasting','prepared-formula',field);return; }
    const formula=value.replace(/<\$level\$>/g,'@class.level').replace(/<\$(str|dex|con|int|wis|cha)_mod\$>/g,'@abilities.$1.mod');
    // Validate with the same safe parser as resource formulas.
    model.preparedFormula=formula;
  });
  for (const field of ['preparedSpellsChange','cantripChange'] as const) fields(raw,out,[field],(_,value)=>{if (['level','restLong','manual'].includes(value)) model[field==='preparedSpellsChange'?'preparedChange':'cantripChange']=value;else unsupported(out,'classCasting','change-period',field);});
  fields(raw,out,['spellsKnownProgressionFixed'],(field,value)=>{
    if (plain(value)&&Object.entries(value).every(([level,n])=>integer(Number(level),1,20)&&integer(n,0,100))) { let count=0;model.bookProgression=Array.from({length:20},(_,i)=>count+=value[String(i+1)]||0); }
    else if (Array.isArray(value)&&value.length<=20&&value.every(n=>integer(n,0,100))) {let count=0;model.bookProgression=value.map(n=>count+=n);}else unsupported(out,'classCasting','book-progression',field);
  });
  fields(raw,out,['classTableGroups','subclassTableGroups'],(field,value)=>{
    if (!Array.isArray(value)) { unsupported(out,'classTable','table-shape',field);return; }
    for (const group of value) {
      if (group.rowsSpellProgression) {
        const rows=group.rowsSpellProgression;
        if (Array.isArray(rows)&&rows.length<=20&&rows.every((r:any)=>Array.isArray(r)&&r.length<=9&&r.every((n:any)=>integer(n,0,100)))) { if (model.spellSlots) unsupported(out,'classCasting','multiple-slot-tables',field);else model.spellSlots=structuredClone(rows); }
        else unsupported(out,'classCasting','slot-table-shape',field);
      }
      if (Array.isArray(group.rows)&&group.rows.some((r:any)=>Array.isArray(r)&&r.some((n:any)=>typeof n==='number'))) unsupported(out,'classTable','named-table-requires-link',field);
    }
  });
  fields(raw,out,['classFeatures','subclassFeatures'],(field,value)=>{
    if (!Array.isArray(value)) { unsupported(out,'featureProgression','feature-ref-shape',field);return; }
    const resolved:string[]=[];
    for (const ref of value) {
      const uid=typeof ref==='string'?ref:ref?.[field==='classFeatures'?'classFeature':'subclassFeature'];
      if (typeof uid!=='string') { unsupported(out,'featureProgression','feature-ref-shape',field);continue; }
      const p=uid.split('|'),sub=field==='subclassFeatures',source=sub?p[6]||p[4]||'PHB':p[4]||p[2]||'PHB',level=Number(p[sub?5:3]);
      const candidates=ctx.rows.filter(candidate=>candidate.identity.kind===(sub?'subclassFeature':'classFeature')&&candidate.identity.source.toLowerCase()===source.toLowerCase()&&candidate.identity.level===level&&[candidate.raw.name,candidate.raw.ENG_name].includes(p[0])&&[candidate.raw.className,candidate.identity.classEngName].includes(p[1])&&candidate.identity.classSource?.toLowerCase()===(p[2]||'PHB').toLowerCase()&&(!sub||[candidate.raw.subclassShortName,candidate.identity.subclassEngShortName].includes(p[3])));
      if(candidates.length===1&&row.edition&&candidates[0].edition&&row.edition!==candidates[0].edition){unsupported(out,'featureProgression','cross-edition-feature-ref',field);continue;}
      if (candidates.length===1) resolved.push(candidates[0].identity.key);else unsupported(out,'featureProgression','unresolved-feature-ref',field);
    }
    if (resolved.length) model[field==='classFeatures'?'classFeatures':'subclassFeatures']=resolved;
  });
  fields(raw,out,['cantripBonus'],(field,value)=>{if (integer(value,0,100))modifier(out,{target:'cantrips',op:'add',value});else unsupported(out,'classCasting','cantrip-bonus',field);});
  fields(raw,out,['optionalfeatureProgression'],(field,value)=>{
    if (!Array.isArray(value)) {unsupported(out,'featureProgression','optional-progression-shape',field);return;}
    for (const [index,part] of value.entries()) {
      if (!Array.isArray(part?.featureType)||!part.featureType.length||part.featureType.some((v:any)=>typeof v!=='string'||containsCjk(v))||!plain(part.progression)) {unsupported(out,'featureProgression','optional-progression-shape',field);continue;}
      const progression:{level:number;count:number}[]=[];
      let invalid=false;
      for (const [level,n] of Object.entries(part.progression)) {
        if (!integer(n,0,100)||level!=='*'&&!integer(Number(level),1,20)) {unsupported(out,'featureProgression','optional-progression-shape',field);invalid=true;continue;}
        progression.push({level:level==='*'?0:Number(level),count:n});
      }
      progression.sort((a,b)=>a.level-b.level);
      const first=progression.find(point=>point.count>0);
      if(!invalid&&first)grant(out,{type:'feature',choose:{count:first.count,filter:{kind:'optionalfeature',featureType:part.featureType}},key:`optionalfeature:${index}`,atLevel:first.level,choiceProgression:progression});
    }
  });
  fields(raw,out,['feats'],(field,value)=>{
    if (!Array.isArray(value)) {unsupported(out,'featGrant','feat-grant-shape',field);return;}
    for (const [index,part] of value.entries()) if (plain(part)) for (const [ref,n] of Object.entries(part)) {
      if (ref==='any'&&integer(n,1,100)) grant(out,{type:'feat',choose:{count:n,filter:{kind:'feat'}},key:`feats:${index}`});
      else if (n===true) {const target=ctx.resolve(ref,'feat',ref.includes('|')?undefined:row.identity.source);if(target)grant(out,{type:'feat',fixed:[target.identity.key],key:`feats:${index}`});else unsupported(out,'featGrant','unresolved-feat',field);}
      else unsupported(out,'featGrant','feat-grant-shape',field);
    }
  });
  if (Object.keys(model).length) out.mechanics.classModel=model;
}
