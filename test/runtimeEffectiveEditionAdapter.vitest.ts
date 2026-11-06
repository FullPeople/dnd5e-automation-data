import {expect,it} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {buildConsumerAdapter} from '../src/runtimeCoverage/adapter.ts';

it.each([false,true])('requires a callable consumer edition policy after bundling; erased type=%s',async erased=>{
 const base=resolve(tmpdir()),root=mkdtempSync(join(base,'effective-edition-adapter-'));
 try{
  const modules:Record<string,string[]>={
   'src/core/model.ts':['newCharacter','selectionAllowed'],
   'src/core/engine.ts':['evaluate'],'src/core/sheet.ts':['syncFeatures'],'src/core/resources.ts':['syncAutoResources'],
   'src/core/automation/state.ts':['newAutomationState'],
   'src/core/automation/choices.ts':['sheetChoices','chooseSheetOption','claimStartingEquipment'],
   'src/core/automation/sourceSpells.ts':['syncSourceSpells','planSourceSpells','setSourceSpellChoices'],
   'src/core/automation/weapons.ts':['automaticWeaponAttacks'],
  };
  for(const [path,exports] of Object.entries(modules)){
   const file=join(root,path);mkdirSync(dirname(file),{recursive:true});
   writeFileSync(file,exports.map(name=>`export const ${name}=()=>undefined;`).join('\n')+(path.endsWith('/model.ts')?erased?'\nexport type entryEdition={notCallable:true};':'\nexport const entryEdition=(entry:{edition:string})=>entry.edition;':''));
  }
  const output=join(root,'consumer.mjs');await buildConsumerAdapter(root,output,false);
  if(erased)await expect(import(pathToFileURL(output).href)).rejects.toThrow('Missing ordinary casting runtime export: entryEdition');
  else expect((await import(pathToFileURL(output).href)).entryEdition({edition:'both'})).toBe('both');
 }finally{
  if(dirname(root)!==base)throw Error('Unexpected adapter fixture path');rmSync(root,{recursive:true});
 }
});
