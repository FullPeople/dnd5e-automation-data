import { containsCjk } from '../../identity.ts';
import { label } from '../../inventory/identity.ts';
import { deriveStructured } from '../structured/index.ts';
import { recovery } from '../structured/resources.ts';
import { amount, canonical, integer, numeric, plain, result, unsupported, type DerivationContext, type Result } from '../structured/common.ts';
import { mapping, observedKeys, systemLeaves } from './mapping.ts';
import { formula, scales } from './scales.ts';
import type { Material, Raw } from '../catalogue.ts';
import type { Action, Effect, Modifier, Resource } from '../../protocol.ts';

export interface Decision { key: string; route: string; reason: string; ref: string }
const mode = (value: unknown): Modifier['op'] | undefined => ({ADD:'add',OVERRIDE:'set',UPGRADE:'max',DOWNGRADE:'min','2':'add','5':'set','4':'max','3':'min'} as Record<string,Modifier['op']>)[String(value).toUpperCase()];
const tokenList = (value: unknown): string[] | undefined => Array.isArray(value) && value.every(v=>typeof v==='string') ? value : typeof value === 'string' ? value.split(/[;,]/).map(s=>s.trim()).filter(Boolean) : undefined;
const activation = (value: unknown): Action['activation'] => ['action','bonus','reaction','special','minute','hour','day','rest'].includes(String(value)) ? String(value) : 'none';
const target = (value: unknown): Action['target'] => ['self','creature','object'].includes(String(value)) ? String(value) : ['space','sphere','cube','cone','cylinder','line'].includes(String(value)) ? 'area' : 'other';
function addGaps(out: Result, other: Result): void { for(const gap of other.unsupported)unsupported(out,gap.family,gap.code,gap.ref); }
function numberOrFormula(value: unknown, aliases: Map<string,string>): Pick<Modifier,'value'|'formula'> | undefined {
  const number=numeric(typeof value==='string'?value.replace(/^([+-])\s+/, '$1'):value);
  if(number!==undefined && Math.abs(number)<=1e6)return {value:number};
  const f=formula(value,aliases);return f?{formula:f}:undefined;
}
function mappedChange(change: Raw, out: Result, ctx: DerivationContext, aliases: Map<string,string>, ref: string): { modifiers: Modifier[]; grants: NonNullable<Result['mechanics']['grants']> } {
  const spec=mapping(`effect.key:${change.key||'unspecified'}`), op=mode(change.mode), mods:Modifier[]=[],grants:NonNullable<Result['mechanics']['grants']>=[];
  if(spec.route==='metadata')return {modifiers:mods,grants};
  if(spec.route==='unsupported'){unsupported(out,spec.family,spec.reason,ref);return {modifiers:mods,grants};}
  if(!op){unsupported(out,'effectMode',['CUSTOM','0'].includes(String(change.mode))?'custom-effect-deferred':['MULTIPLY','1'].includes(String(change.mode))?'multiply-effect-deferred':'unknown-effect-mode',ref);return {modifiers:mods,grants};}
  if(spec.route==='trait'||spec.route==='grant'){
    // OVERRIDE must replace the whole set; setting one flag cannot model that.
    if(op!=='add'){unsupported(out,'traitReplacement','trait-set-replacement-deferred',ref);return {modifiers:mods,grants};}
    const values=tokenList(change.value), family=spec.target==='conditionImmune'?'condition':spec.route==='trait'?'damage':spec.target==='languageProficiency'?'language':'weapon';
    const tokens=values?.map(v=>ctx.token(v,family));
    if(!tokens?.length || tokens.some(v=>!v)){unsupported(out,spec.family,'unresolved-effect-token',ref);return {modifiers:mods,grants};}
    if(spec.route==='trait')for(const t of new Set(tokens))mods.push({target:`${spec.target}:${t}`,op:'set',value:true});
    else grants.push({type:spec.target!,fixed:[...new Set(tokens as string[])]});
  } else {
    let value=numberOrFormula(change.value,aliases);
    if(!value){unsupported(out,'formula','unmapped-foundry-formula',ref);return {modifiers:mods,grants};}
    if(spec.route==='hpPerLevel'){
      const f=formula(`(${value.formula??value.value}) * @details.level`,aliases);
      if(!f){unsupported(out,'formula','unmapped-foundry-formula',ref);return {modifiers:mods,grants};}value={formula:f};
    }
    for(const t of spec.route==='saveBonus'?['save:str','save:dex','save:con','save:int','save:wis','save:cha']:[spec.target!])mods.push({target:t,op,...value});
  }
  return {modifiers:mods,grants};
}
function resourceFrom(raw: Raw, key: string, out: Result, aliases: Map<string,string>, ref: string): Resource | undefined {
  const maximum=raw.max, f=formula(maximum,aliases), max=typeof maximum==='number'?amount(maximum):f?amount(f):undefined;
  if(!max){unsupported(out,'resources','foundry-resource-maximum',ref);return;}
  const periods=recovery(raw.recovery);
  if(!periods)unsupported(out,'recovery','foundry-recovery-definition',ref);
  const r:Resource={key,max,recovery:periods||[]};(out.mechanics.resources||=[]).push(r);return r;
}
function actionFormula(a:Raw,aliases:Map<string,string>): string | undefined {
  if(a.type==='utility')return formula(a.roll?.formula,aliases);
  const part=a.type==='heal'?a.healing:a.damage?.parts?.length===1?a.damage.parts[0]:undefined;
  if(!part)return;
  if(part.custom?.enabled)return formula(part.custom.formula,aliases);
  const count=numeric(part.number),faces=numeric(part.denomination);
  if(count!==undefined&&integer(count,1,100)&&faces!==undefined&&integer(faces,2,1000))return formula(`${count}d${faces}${part.bonus?` + (${part.bonus})`:''}`,aliases);
  return formula(part.bonus,aliases);
}
function activities(raw:Raw,row:Material,out:Result,ctx:DerivationContext,aliases:Map<string,string>):void {
  for(const [index,a] of (raw.activities||[]).entries()){
    const ref=`activities/${index}`,spec=mapping(`activity:${a.type||'unspecified'}`);
    if(spec.route!=='activity'){unsupported(out,spec.family,spec.reason,ref);continue;}
    const gapsBefore=out.unsupported.length,key=`foundry:activity:${index}`;
    if(a.uses)resourceFrom(a.uses,`${key}:uses`,out,aliases,`${ref}/uses`);
    const action:Action={type:spec.target!,key,activation:activation(a.activation?.type),target:target(a.target?.affects?.type)};
    const f=actionFormula(a,aliases);
    if(f)action.formula=f;
    else if(a.roll?.formula||a.healing||a.damage?.parts?.length)unsupported(out,'activityFormula','unmapped-activity-formula',ref);
    if(a.type==='cast'){
      const uid=a.spell?.uuid,match=typeof uid==='string'&&uid.startsWith('@spell[')?ctx.resolve(uid.slice(7,-1),'spell',row.identity.source):undefined;
      if(!match || row.edition&&match.edition&&row.edition!==match.edition){unsupported(out,'spellReference','unresolved-cast-spell',`${ref}/spell`);continue;}action.spell=match.identity.key;
      if(a.spell.ability||a.spell.level||a.spell.challenge||a.spell.spellbook)unsupported(out,'castConfiguration','cast-configuration-deferred',`${ref}/spell`);
    }
    if(a.type==='save'){
      const ability=Array.isArray(a.save?.ability)?a.save.ability[0]:a.save?.ability,dc=numeric(a.save?.dc?.formula)??formula(a.save?.dc?.formula,aliases);
      if(['str','dex','con','int','wis','cha'].includes(ability)&&dc!==undefined&&(typeof dc==='string'||integer(dc,0,100))&&(!Array.isArray(a.save?.ability)||a.save.ability.length===1))action.save={ability,dc};
      else unsupported(out,'saveCalculation','save-dc-calculation-deferred',`${ref}/save`);
    }
    const consumes=a.consumption?.targets||[];
    if(consumes.length){
      if(consumes.length!==1)unsupported(out,'consumption','multiple-consumption-targets',`${ref}/consumption`);
      else {
        const c=consumes[0],current=c.type==='itemUses'&&!c.target?'foundry:uses':c.type==='activityUses'&&!c.target?`${key}:uses`:undefined;
        const n=numeric(c.value)??formula(c.value,aliases);
        if(current&&out.mechanics.resources?.some(r=>r.key===current)&&n!==undefined&&(typeof n==='string'||integer(n,0,10000))&&!c.scaling?.mode&&(!c.scaling||!c.scaling.formula))action.consumes={resource:current,amount:n};
        else unsupported(out,'consumption',c.type==='attribute'&&containsCjk(String(c.target))?'translated-attribute-target':c.type==='attribute'?'actor-attribute-binding-required':'external-or-unresolved-consumption',`${ref}/consumption/targets/0`);
      }
    }
    // Opaque conditions are never translated by looking for words in prose.
    for(const [field,family] of [['activation.condition','activityCondition'],['duration','effectDuration'],['effects','effectLifecycle'],['visibility','activityCondition'],['attack','attackSettlement'],['check','checkSettlement'],['damage.onSave','saveDamage'],['healing.scaling','activityScaling'],['damage.parts.0.scaling','activityScaling']] as const){
      const value=field.split('.').reduce((v,k)=>v?.[k],a);
      if(value && !(Array.isArray(value)&&!value.length))unsupported(out,family,'activity-field-deferred',`${ref}/${field.replaceAll('.','/')}`);
    }
    if(a.activation?.value && a.activation.value!==1)unsupported(out,'activationCount','activation-count-deferred',`${ref}/activation/value`);
    const known=new Set(['type','ENG_name','name','img','description','descriptionEntries','descriptionChat','descriptionEntriesChat','foundryId','activation','target','consumption','uses','roll','healing','damage','spell','save','duration','effects','visibility','attack','check','range']);
    for(const field of Object.keys(a))if(!known.has(field))unsupported(out,'activityConfiguration','activity-field-deferred',`${ref}/${label(field)}`);
    if(a.consumption?.scaling?.allowed)unsupported(out,'consumption','scaled-consumption-deferred',`${ref}/consumption/scaling`);
    if(a.range?.value||a.target?.template||a.target?.affects?.count||a.target?.affects?.special)unsupported(out,'targeting','targeted-settlement-deferred',`${ref}/target`);
    if(!['utility','cast'].includes(a.type)||out.unsupported.length>gapsBefore)action.deferred=true;
    (out.mechanics.actions||=[]).push(action);
  }
}
function effects(raw:Raw,row:Material,out:Result,ctx:DerivationContext,aliases:Map<string,string>):void {
  for(const [index,e] of (raw.effects||[]).entries()){
    const ref=`effects/${index}`,isItem=['item','baseitem','magicvariant'].includes(row.identity.kind),permanent=e.transfer===true&&!e.duration&&!e.disabled&&!e.condition&&!e.flags&&!e.enchantmentRiderParent&&!isItem;
    if(isItem&&e.transfer===true)unsupported(out,'itemEffectOwnership','equipping-attunement-binding-required',ref);
    const effect:Effect={name:`Effect ${index+1}`,duration:{unit:permanent?'permanent':'special'},changes:[],statuses:[],deferred:true};
    for(const [n,c] of (e.changes||[]).entries()){
      const translated=mappedChange(c,out,ctx,aliases,`${ref}/changes/${n}`);effect.changes.push(...translated.modifiers);
      if(permanent){(out.mechanics.modifiers||=[]).push(...translated.modifiers);(out.mechanics.grants||=[]).push(...translated.grants);}
      else if(translated.grants.length)unsupported(out,'effectGrant','temporary-grant-deferred',ref);
    }
    if(Array.isArray(e.statuses))for(const s of e.statuses){const token=ctx.token(s,'condition');if(token&&!containsCjk(token))effect.statuses.push(token);else unsupported(out,'effectStatus','unresolved-effect-status',ref);}
    (out.mechanics.effects||=[]).push(effect);unsupported(out,'effectLifecycle','effect-lifecycle-deferred',ref);
  }
}
export function deriveFoundry(raw:Raw,row:Material,ctx:DerivationContext,knownScales=new Map<string,string>()):Result&{decisions:Decision[];flags:string[]} {
  const out=result(),keys=observedKeys(raw),decisions=keys.map((key,index)=>{const m=mapping(key);return {key:label(key),route:m.route,reason:m.reason,ref:`observed/${index}`};});
  const flags=['ignoreSrdEffects','ignoreSrdActivities','isIgnored'].filter(key=>raw[key]);
  if(raw.migrationVersion!==3){unsupported(out,'foundryMigration','unreviewed-migration-version');return {...out,decisions,flags};}
  if(raw.isIgnored){unsupported(out,'foundryMarker','foundry-entry-ignored');return {...out,decisions,flags};}
  const aliases=new Map([...knownScales,...scales(raw,out)]),system=new Map(systemLeaves(raw.system||{}));
  for(const [key] of system){const m=mapping(`system:${key}`);if(m.route==='unsupported')unsupported(out,m.family,m.reason,`system/${label(key)}`);}
  if(system.has('uses.max'))resourceFrom({max:system.get('uses.max'),recovery:system.get('uses.recovery')},'foundry:uses',out,aliases,'system/uses');
  else if(system.has('uses.recovery'))unsupported(out,'resources','recovery-without-resource','system/uses');
  if(plain(raw.entryData)){
    const entry=deriveStructured({...row,raw:raw.entryData},ctx);addGaps(out,entry);
    for(const [key,value]of Object.entries(entry.mechanics)) { const old=(out.mechanics as Raw)[key];(out.mechanics as Raw)[key]=Array.isArray(value)?[...(old||[]),...value]:value; }
    for(const key of Object.keys(raw.entryData)){const m=mapping(`entryData:${key}`);if(m.route!=='structured'||!entry.handled.has(key))unsupported(out,m.family,m.route==='unsupported'?m.reason:'unhandled-entry-data',`entryData/${label(key)}`);}
  }
  // ignoreSrd* suppresses implicit SRD defaults, not these explicit sidecar payloads.
  effects(raw,row,out,ctx,aliases);activities(raw,row,out,ctx,aliases);
  if(raw.subEntities)unsupported(out,'foundrySubEntity','inline-foundry-entity-unmatched','subEntities');
  for(const field of ['_copy','_merge','actorTokenMod'])if(raw[field])unsupported(out,field==='actorTokenMod'?'actorToken':'foundryInheritance','foundry-root-field-deferred',field);
  return {...out,decisions,flags};
}
