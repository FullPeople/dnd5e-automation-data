import {resolve} from 'node:path';
import {existsSync} from 'node:fs';
import {build} from 'esbuild';
export async function buildConsumerAdapter(webRoot:string,output:string,includeCatalog=true){
 const exports:Record<string,string[]>={'src/core/model.ts':['newCharacter','selectionAllowed'],'src/core/engine.ts':['evaluate'],'src/core/sheet.ts':['syncFeatures'],'src/core/resources.ts':['syncAutoResources'],'src/core/automation/state.ts':['newAutomationState'],'src/core/automation/choices.ts':['sheetChoices','chooseSheetOption','claimStartingEquipment'],'src/core/automation/sourceSpells.ts':['syncSourceSpells','planSourceSpells','setSourceSpellChoices'],'src/core/automation/weapons.ts':['automaticWeaponAttacks']};
 if(includeCatalog){exports['src/data/catalog.ts']=['normalizeCatalogData'];exports['src/data/homebrew.ts']=['homebrewBody'];}
 const ordinary=existsSync(resolve(webRoot,'src/core/automation/ordinarySpellCasting.ts'));
 const limited=existsSync(resolve(webRoot,'src/core/automation/limitedSourceUses.ts'));
 const itemCharges=existsSync(resolve(webRoot,'src/core/automation/itemChargeDebits.ts'));
 const required:Record<string,string[]>=ordinary?{
  'src/core/automation/ordinarySpellCasting.ts':['ordinaryCastingRule','ordinaryDirectBaseClassList','ordinarySpellOffer'],
  'src/core/spellcastingRules.ts':['casterProfiles'],
  'src/core/spellWorkspace.ts':['learnActiveSpell','chooseCantrip','classSpellGroups','cantripGroups','spellIsReady'],
  'src/core/spells.ts':['prepareSpellEntry'],
  'src/core/automation/actions.ts':['spellPayments','spellActionRequest','performSpellAction'],
  'src/core/export.ts':['exportCharacter'],
  'src/core/validation.ts':['readCharacter'],
  ...(includeCatalog?{'src/data/spellLookup.ts':['hydrateSpellLookup']}:{})
 }:{};
 if(limited){
  const additions:Record<string,string[]>={
   'src/core/automation/limitedSourceUses.ts':['limitedSourceRule','limitedSourceUseOffers','limitedSourceUseRequest','performLimitedSourceUseAction','limitedSourceSpellOffer','ownedLimitedSourceResource','assertLimitedSourceResourceEdit'],
   'src/core/resources.ts':['setResource'],
   'src/core/automation/featureResources.ts':['restResources'],
   'src/core/sheet.ts':['removeSelection'],
   'src/core/automation/actions.ts':['spellPayments','spellActionRequest','performSpellAction'],
   'src/core/export.ts':['exportCharacter'],
   'src/core/validation.ts':['readCharacter']
  };
  for(const [path,names] of Object.entries(additions))required[path]=[...new Set([...(required[path]||[]),...names])];
 }
 if(itemCharges){
  const additions:Record<string,string[]>={
   'src/core/automation/itemChargeDebits.ts':['itemChargeRule','itemChargeOffers','itemChargeRequest','performItemChargeAction','ownedItemChargeResource','assertItemChargeResourceEdit'],
   'src/core/resources.ts':['setResource'],
   'src/core/automation/featureResources.ts':['restResources'],
   'src/core/sheet.ts':['removeSelection'],
   'src/core/export.ts':['exportCharacter'],
   'src/core/validation.ts':['readCharacter']
  };
  for(const [path,names] of Object.entries(additions))required[path]=[...new Set([...(required[path]||[]),...names])];
 }
 // Namespace reads remain live through bundling: esbuild can erase an invalid
 // type-only reexport, so a usable module must also check runtime function types.
 const checked=Object.entries(required).flatMap(([path,names],index)=>{
  const namespace=`__ordinary${index}`;
  return [`import * as ${namespace} from ${JSON.stringify(resolve(webRoot,path).replaceAll('\\','/'))};`,...names.map(name=>`if(typeof ${namespace}.${name}!=="function")throw new Error(${JSON.stringify('Missing ordinary casting runtime export: '+name)}); export const ${name}=${namespace}.${name};`)];
 });
 const contents=[...Object.entries(exports).map(([p,n])=>`export {${n.join(',')}} from ${JSON.stringify(resolve(webRoot,p).replaceAll('\\','/'))};`),...checked,...(ordinary?['export const ordinaryCastingCapability=1;']:[]),...(limited?['export const limitedSourceCapability=1;']:[]),...(itemCharges?['export const itemChargeDebitCapability=1;']:[])].join('\n');
 return build({stdin:{contents,resolveDir:resolve(webRoot),loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:output,metafile:true,define:{'import.meta.env.MODE':'"standalone"','import.meta.env.DEV':'false'}});
}
