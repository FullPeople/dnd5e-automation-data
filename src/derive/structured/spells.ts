import { ABILITIES, amount, canonical, fields, grant, integer, plain, unsupported, type DerivationContext, type Result } from './common.ts';
import type { Material } from '../catalogue.ts';
import type { Grant } from '../../protocol.ts';
const coreEdition = (source:string) => ['PHB','DMG'].includes(source)?'2014':['XPHB','XDMG'].includes(source)?'2024':undefined;
function filter(input:string, source:string, ctx:DerivationContext):Record<string,string|number|string[]>|undefined {
  const result:Record<string,string|number|string[]>={};
  for(const part of input.split('|')) {
    const match=/^([a-zA-Z]+)=(.+)$/.exec(part.trim());if(!match)return;
    const [,key,value]=match;
    if(key==='level'){if(!/^\d$/.test(value))return;result.level=Number(value);}
    else if(key==='class'){const parent=ctx.resolve(`${value}|${source}`,'class')||ctx.resolve(`${value}|PHB`,'class');if(!parent)return;result.class=parent.identity.engName;result.classSource=parent.identity.source;}
    else if(key==='school'){if(!/^[A-Za-z]+$/.test(value))return;result.school=value;}
    else if(key==='source'){if(!/^[A-Za-z0-9_-]+$/.test(value))return;result.source=value.toUpperCase();}
    else return;
  }
  return Object.keys(result).length?result:undefined;
}
export function spells(row:Material,ctx:DerivationContext,out:Result):void {
  const raw=row.raw;
  if(row.identity.kind==='spell') {
    fields(raw,out,['level'],(field,value)=>{if(integer(value,0,9))out.mechanics.spellModel={level:value};else unsupported(out,'spellMetadata','spell-level',field);});
    if(out.mechanics.spellModel) {
      fields(raw,out,['school'],(field,value)=>{if(typeof value==='string'&&/^[A-Za-z]+$/.test(value))out.mechanics.spellModel!.school=value;else unsupported(out,'spellMetadata','spell-school',field);});
      if(raw.meta?.ritual===true)out.mechanics.spellModel.ritual=true;
      if(Array.isArray(raw.duration)&&raw.duration.some((d:any)=>d?.concentration))out.mechanics.spellModel.concentration=true;
      const lists:{engName:string;source:string}[]=[];
      const add=(name:string,source:string)=>{const english=ctx.className(name,source);if(!english){unsupported(out,'spellMetadata','unresolved-spell-class','classes');return;}if(!lists.some(c=>c.engName===english&&c.source===source))lists.push({engName:english,source});};
      for(const list of [...(raw.classes?.fromClassList||[]),...(raw.classes?.fromClassListVariant||[])])if(list?.name)add(list.name,list.source||'PHB');
      for(const [source,names] of Object.entries(raw._spellClasses||{}))if(plain(names))for(const name of Object.keys(names))add(name,source);
      if(lists.length)out.mechanics.spellModel.classes=lists.sort((a,b)=>`${a.source}/${a.engName}`.localeCompare(`${b.source}/${b.engName}`));
      out.handled.add('classes');out.handled.add('_spellClasses');out.handled.add('meta');
    }
    fields(raw,out,['time','range','components','duration'],field=>unsupported(out,field==='duration'?'spellDuration':'spellCastingMetadata','casting-metadata-pending',field));
  }
  fields(raw,out,['additionalSpells'],(field,value)=>{
    if(!Array.isArray(value)){unsupported(out,'additionalSpells','additional-spells-shape',field);return;}
    for(const [index,block] of value.entries()) {
      if(!plain(block)||Object.keys(block).some(key=>!['name','ENG_name','ability','known','prepared','innate','expanded','resourceName'].includes(key))){unsupported(out,'additionalSpells','spell-set-shape',`${field}/${index}`);continue;}
      let ability:Grant['ability'];
      if(ABILITIES.includes(block.ability))ability=block.ability;
      else if(plain(block.ability)&&Array.isArray(block.ability.choose)&&block.ability.choose.length&&block.ability.choose.every((v:any)=>ABILITIES.includes(v)))ability={choose:[...block.ability.choose]};
      else if(block.ability!==undefined)unsupported(out,'additionalSpells','spell-ability',`${field}/${index}`);
      const set=value.length>1?{setKey:'additionalSpells',setOption:index}:{};
      for(const kind of ['known','prepared','innate','expanded']) {
        const levels=block[kind];if(levels===undefined)continue;
        if(!plain(levels)){unsupported(out,'additionalSpells','spell-gates',`${field}/${index}/${kind}`);continue;}
        for(const [gate,lists] of Object.entries(levels)) {
          const gating=gate==='_'?{atLevel:0}:/^\d+$/.test(gate)&&integer(Number(gate),0,20)?{atLevel:Number(gate)}:/^s[0-9]$/.test(gate)?{atSpellLevel:Number(gate.slice(1))}:undefined;
          if(!gating){unsupported(out,'additionalSpells','spell-gate',`${field}/${index}/${kind}`);continue;}
          const add=(list:unknown,path:string,usage:Grant['usage'],count?:string,period?:'short'|'long')=>{
            if(!Array.isArray(list)){unsupported(out,'additionalSpells','spell-list',`${field}/${index}/${kind}/${gate}/${path}`);return;}
            const pool=`source-spell:${index}/${kind}/${gate}/${path}`;
            const ambiguous=!!count&&!count.endsWith('e')&&list.reduce((sum,node)=>sum+(typeof node==='string'?1:node?.count??node?.choose?.count??1),0)>1;
            if(ambiguous)unsupported(out,'additionalSpells','spell-usage-pool-ambiguous',pool);
            for(const [nodeIndex,node] of list.entries()) {
              let selection:Pick<Grant,'fixed'|'choose'>|undefined,spellLevel:number|undefined;const referenceAliases:Record<string,string>={};
              const ref=(value:string)=>{
                const [uid,level]=value.split('#'),target=ctx.resolve(uid,'spell',uid.includes('|')?undefined:'PHB');
                if(level&&!/^(c|[1-9])$/.test(level)||level==='c'&&target?.raw.level!==0)return;
                const edition=row.edition||coreEdition(row.identity.source),targetEdition=target?.edition||coreEdition(target?.identity.source||'');if(target&&edition&&edition!=='both'&&targetEdition&&targetEdition!=='both'&&edition!==targetEdition)return;
                if(level&&level!=='c')spellLevel=Number(level);if(target)referenceAliases[target.identity.key]=encodeURIComponent(value);return target?.identity.key;
              };
              if(typeof node==='string'){const key=ref(node);if(key)selection={fixed:[key]};}
              else if(plain(node)&&node.choose) {
                const choose=node.choose,count=node.count??(plain(choose)?choose.count:undefined)??1;
                if(integer(count,1,100)) {
                  if(typeof choose==='string'){const book=(row.edition||coreEdition(row.identity.source))==='2024'?'XPHB':'PHB',parsed=filter(choose,book,ctx);if(parsed){const options=ctx.rows.filter(candidate=>candidate.identity.kind==='spell'&&(!row.edition||!candidate.edition||candidate.edition===row.edition)&&(parsed.level===undefined||candidate.raw.level===parsed.level)&&(!parsed.source||candidate.identity.source===parsed.source)&&(!parsed.school||candidate.raw.school===parsed.school)&&(!parsed.class||Object.keys(candidate.raw._spellClasses?.[String(parsed.classSource)]||{}).some(name=>ctx.className(name,String(parsed.classSource))===parsed.class)||candidate.raw.classes?.fromClassList?.some((c:any)=>ctx.className(c.name,c.source||'PHB')===parsed.class&&(c.source||'PHB')===parsed.classSource)));if(options.length>=count)selection={choose:{count,filter:parsed}};else unsupported(out,'additionalSpells','unresolved-spell-filter',pool);}}
                  else if(plain(choose)&&Array.isArray(choose.from)){const from=choose.from.map((uid:any)=>typeof uid==='string'?ref(uid):undefined);if(from.length&&from.every(Boolean))selection={choose:{count,from:from as string[]}};}
                }
              }
              if(!selection){unsupported(out,'additionalSpells','unresolved-spell-choice',`${pool}/${nodeIndex}`);continue;}
              const max=count?count.replace(/e$/,'')==='pb'?{formula:'@prof'}:amount(count.replace(/e$/,'')):undefined;
              if(count&&(!max||!period)){unsupported(out,'additionalSpells','spell-frequency',pool);continue;}
              grant(out,{type:'spell',...selection,...(Object.keys(referenceAliases).length?{referenceAliases}:{}),key:`${pool}/${nodeIndex}`,origin:kind,...set,...gating,usage:kind==='expanded'?'expanded':usage,canUseSlots:kind==='known'||kind==='prepared',...(ability?{ability,abilityChoiceKey:`additionalSpells:${index}:ability`}:{}),...(spellLevel?{spellLevel}:{}),...(max&&period?{uses:{max,recovery:[{period,amount:'all'}]},usagePool:pool}:{}),...(ambiguous?{ambiguous:true}:{})});
            }
          };
          const baseUsage=kind==='known'||kind==='prepared'?'slotOrUses':kind==='expanded'?'expanded':'uses';
          if(Array.isArray(lists)){add(lists,'_',baseUsage);continue;}
          if(!plain(lists)){unsupported(out,'additionalSpells','spell-schedule',`${field}/${index}/${kind}/${gate}`);continue;}
          for(const [schedule,values] of Object.entries(lists)) {
            if(['_','will','ritual'].includes(schedule)){add(values,schedule,schedule==='will'?'free':schedule==='ritual'?'ritual':baseUsage);continue;}
            if(['daily','rest'].includes(schedule)&&plain(values))for(const [count,list]of Object.entries(values)){if(/^(?:[1-9]\d?e?|pbe?)$/.test(count))add(list,`${schedule}/${count}`,'uses',count,schedule==='daily'?'long':'short');else unsupported(out,'additionalSpells','spell-frequency',`${field}/${index}/${kind}/${gate}/${schedule}`);}
            else unsupported(out,'additionalSpells','spell-schedule',`${field}/${index}/${kind}/${gate}/${schedule}`);
          }
        }
      }
    }
  });
}
