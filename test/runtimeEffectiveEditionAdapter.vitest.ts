import {expect,it} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
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
  const expected='Missing ordinary casting runtime export: entryEdition';
  const source=`try{const api=await import(${JSON.stringify(pathToFileURL(output).href)});process.stdout.write(api.entryEdition({edition:'both'}));process.exitCode=0;}catch(error){if(error instanceof Error&&error.message===${JSON.stringify(expected)}){process.stderr.write(error.message);process.exitCode=23;}else{process.stderr.write('UNEXPECTED_NATIVE_IMPORT_ERROR');process.exitCode=24;}}`;
  const result=spawnSync(process.execPath,['--input-type=module','-e',source],{encoding:'utf8',timeout:3500});
  expect(result.error).toBeUndefined();expect(result.status).toBe(erased?23:0);expect(result.stdout).toBe(erased?'':'both');expect(result.stderr).toBe(erased?expected:'');
 }finally{
  if(dirname(root)!==base)throw Error('Unexpected adapter fixture path');rmSync(root,{recursive:true});
 }
});
