import { amount, fields, integer, modifier, numeric, plain, resource, unsupported, type DerivationContext, type Result } from './common.ts';
import { recovery } from './resources.ts';
import { parseFormula } from '../../validate/formula.ts';
import type { EquipmentModel, EquipmentPart } from '../../protocol.ts';
import type { Material } from '../catalogue.ts';
const code=(value:unknown)=>String(value||'').split('|')[0].toUpperCase();
export function equipment(row: Material, ctx: DerivationContext, out: Result): void {
  const raw=row.raw,model:EquipmentModel={};
  if (['item','baseitem','magicvariant'].includes(row.identity.kind)) {
    out.handled.add('type');const type=code(raw.type),category=({LA:'lightArmor',MA:'mediumArmor',HA:'heavyArmor',S:'shield',M:'weapon',R:'weapon'} as Record<string,string>)[type];
    model.category=category||'other';if(type==='M'||type==='R')model.weaponType=type==='M'?'melee':'ranged';if(type==='MA')model.dexCap=2;
    fields(raw,out,['ac','strength','weight','value'],(field,value)=>{const number=numeric(value);if(number!==undefined&&number>=0&&number<=1000000&&(field==='weight'||Number.isInteger(number))) (model as any)[field]=number;else unsupported(out,'equipment','equipment-number',field);});
    fields(raw,out,['stealth'],(field,value)=>{if(typeof value==='boolean')model.stealthDisadvantage=value;else unsupported(out,'equipment','stealth-condition',field);});
    fields(raw,out,['reqAttune'],(field,value)=>{if(typeof value==='boolean'||value==='YES')model.requiresAttunement=!!value;else if(typeof value==='string'){model.requiresAttunement=true;unsupported(out,'attunement','attunement-prerequisite',field);}else unsupported(out,'attunement','attunement-shape',field);});
    fields(raw,out,['weaponCategory'],(field,value)=>{if(['simple','martial'].includes(value))model.weaponCategory=value;else unsupported(out,'weapon','weapon-category',field);});
    fields(raw,out,['dmg1','dmg2'],(field,value)=>{if(typeof value==='string')try{parseFormula(value);model[field==='dmg1'?'damage':'versatileDamage']=value;return;}catch{}unsupported(out,'weapon','weapon-damage',field);});
    fields(raw,out,['dmgType'],(field,value)=>{if(typeof value==='string'){const token=ctx.token(value,'damage');if(token){model.damageType=token;return;}}unsupported(out,'weapon','damage-type',field);});
    fields(raw,out,['property'],(field,value)=>{if(Array.isArray(value)&&value.every(v=>typeof v==='string'))model.properties=value.map(code);else unsupported(out,'weapon','weapon-property-shape',field);});
    fields(raw,out,['baseItem'],(field,value)=>{const target=typeof value==='string'?ctx.resolve(value,'item'):undefined;if(target&&row.edition&&target.edition&&row.edition!==target.edition)unsupported(out,'equipment','cross-edition-base-item',field);else if(target)model.baseItem=target.identity.key;else unsupported(out,'equipment','unresolved-base-item',field);});
    fields(raw,out,['firearm'],(field,value)=>{if(typeof value==='boolean')model.firearm=value;else unsupported(out,'weapon','firearm-shape',field);});
    fields(raw,out,['scfType'],(field,value)=>{if(['holy','arcane','druid'].includes(value))model.spellFocus=value;else unsupported(out,'equipment','focus-shape',field);});
    for (const [field,target] of [['bonusWeapon','attackBonus'],['bonusWeaponAttack','attackBonus'],['bonusWeaponDamage','damageBonus'],['bonusSpellAttack','spellAttackBonus'],['bonusSpellSaveDc','spellDcBonus']] as const) fields(raw,out,[field],(_,value)=>{const n=numeric(value);if(n!==undefined&&integer(n,-100,100)){if(field==='bonusWeapon'){model.attackBonus=(model.attackBonus||0)+n;model.damageBonus=(model.damageBonus||0)+n;}else model[target]=(model[target]||0)+n;}else unsupported(out,'equipment','equipment-bonus',field);});
    fields(raw,out,['charges'],(field,value)=>{const max=amount(value),periods=recovery(raw.recharge);out.handled.add('recharge');out.handled.add('rechargeAmount');if(!max||!periods){unsupported(out,'charges','charge-definition',field);return;}if(raw.rechargeAmount!==undefined){const rawAmount=typeof raw.rechargeAmount==='string'?raw.rechargeAmount.replace(/^\{@dice ([^{}]+)\}$/,'$1'):raw.rechargeAmount,n=amount(rawAmount);if(!n)unsupported(out,'charges','charge-recovery-amount','rechargeAmount');else for(const r of periods)r.amount='value'in n?n.value:n.formula;}resource(out,{key:'charges',max,recovery:periods});});
    out.mechanics.equipmentModel=model;
  }
  for (const [field,target] of [['bonusAc','ac'],['bonusSavingThrow','save'],['bonusAbilityCheck','check'],['bonusProficiencyBonus','proficiency']] as const) fields(raw,out,[field],(_,value)=>{const n=numeric(value);if(n===undefined||!integer(n,-100,100)){unsupported(out,'equipment','equipment-bonus',field);return;}if(target==='save')for(const ability of ['str','dex','con','int','wis','cha'])modifier(out,{target:`save:${ability}`,op:'add',value:n,...(model.requiresAttunement?{condition:{target:'attuned' as const,op:'eq' as const,value:true}}:{})});else if(target==='check')unsupported(out,'checks','all-ability-check-bonus',field);else modifier(out,{target,op:'add',value:n});});
  fields(raw,out,['grantsProficiency','grantsLanguage'],field=>unsupported(out,'equipmentGrant','equipment-grant-shape',field));
  fields(raw,out,['startingEquipment'],(field,value)=>{
    const blocks=Array.isArray(value)?value:value?.defaultData;
    if(!Array.isArray(blocks)){if(value)unsupported(out,'startingEquipment','equipment-package-shape',field);return;}
    const output:{key:string;options:{key:string;items:EquipmentPart[]}[]}[]=[];
    for(const [i,block] of blocks.entries()) {
      if(!plain(block)||Object.values(block).some(v=>!Array.isArray(v))){unsupported(out,'startingEquipment','equipment-package-shape',`${field}/${i}`);continue;}
      const options:{key:string;items:EquipmentPart[]}[]=[];
      for(const [key,items] of Object.entries(block)) {
        const parts:EquipmentPart[]=[];
        for(const item of items) {
          const quantity=typeof item==='string'?1:item?.quantity??1;
          if(!integer(quantity,1,3000)){unsupported(out,'startingEquipment','equipment-quantity',`${field}/${i}/${key}`);continue;}
          const ref=typeof item==='string'?item:item?.item,part:EquipmentPart={quantity};
          if(ref){const target=typeof ref==='string'?ctx.resolve(ref,'item'):undefined,group=typeof ref==='string'?ctx.resolve(ref,'itemGroup'):undefined,focus=group&&code(group.raw.type)==='SCF'?({holy:'focusSpellcastingHoly',arcane:'focusSpellcastingArcane',druid:'focusSpellcastingDruidic'} as const)[group.raw.scfType as 'holy'|'arcane'|'druid']:undefined;if(target)part.identity=target.identity.key;else if(focus)part.category=focus;else{unsupported(out,'startingEquipment','unresolved-equipment',`${field}/${i}/${key}`);part.unresolved=true;}}
          else if(item?.equipmentType){if(['weaponSimple','weaponMartial','focusSpellcastingHoly','focusSpellcastingArcane','focusSpellcastingDruidic'].includes(item.equipmentType))part.category=item.equipmentType;else{unsupported(out,'startingEquipment','equipment-category',`${field}/${i}/${key}`);part.unresolved=true;}}
          else if(item?.special){unsupported(out,'startingEquipment','special-equipment',`${field}/${i}/${key}`);part.unresolved=true;}
          const copper=item?.value??item?.containsValue;if(copper!==undefined){if(!integer(copper,0,100000000)){unsupported(out,'startingEquipment','equipment-currency',`${field}/${i}/${key}`);continue;}part.copper=copper;}
          if(!part.identity&&!part.category&&part.copper===undefined&&!part.unresolved){unsupported(out,'startingEquipment','equipment-part-shape',`${field}/${i}/${key}`);continue;}
          parts.push(part);
        }
        options.push({key,items:parts});
      }
      if(options.length)output.push({key:String(i),options});
    }
    out.mechanics.startingEquipment={blocks:output,scope:row.identity.kind==='class'?'firstClass':'all'};
  });
}
