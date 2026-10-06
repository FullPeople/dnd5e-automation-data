import {resolve} from 'node:path';
import {build} from 'esbuild';
export async function buildConsumerAdapter(webRoot:string,output:string,includeCatalog=true){
 const exports:Record<string,string[]>={'src/core/model.ts':['newCharacter','selectionAllowed'],'src/core/engine.ts':['evaluate'],'src/core/sheet.ts':['syncFeatures'],'src/core/resources.ts':['syncAutoResources'],'src/core/automation/state.ts':['newAutomationState'],'src/core/automation/choices.ts':['sheetChoices','chooseSheetOption','claimStartingEquipment'],'src/core/automation/sourceSpells.ts':['syncSourceSpells','planSourceSpells','setSourceSpellChoices'],'src/core/automation/weapons.ts':['automaticWeaponAttacks']};
 if(includeCatalog){exports['src/data/catalog.ts']=['normalizeCatalogData'];exports['src/data/homebrew.ts']=['homebrewBody'];}
 return build({stdin:{contents:Object.entries(exports).map(([p,n])=>`export {${n.join(',')}} from ${JSON.stringify(resolve(webRoot,p).replaceAll('\\','/'))};`).join('\n'),resolveDir:resolve(webRoot),loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:output,metafile:true,define:{'import.meta.env.MODE':'"standalone"','import.meta.env.DEV':'false'}});
}
