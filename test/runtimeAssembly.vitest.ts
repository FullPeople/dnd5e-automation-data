import {expect,it} from 'vitest';
import {assertSameObservationRecipe,splitConsumerSourcePaths} from '../scripts/runtime_assembly.ts';
it('retains runtime code gates while binding styles separately without accepting new source kinds',()=>{
 expect(splitConsumerSourcePaths(['src/core/engine.ts','src/ui/ObservantControl.tsx','src/ui/observantPassive.css','src/core/model.ts','src/core/engine.ts'])).toEqual({runtime:['src/core/engine.ts','src/ui/ObservantControl.tsx','src/core/model.ts'],styles:['src/ui/observantPassive.css']});
 for(const path of ['src/../player.json','src/./bad.ts','src/unknown.js','other/private.ts'])expect(()=>splitConsumerSourcePaths([path])).toThrow();
});
it('rejects any changed probe source, aliases or observation recipe before complete receipts can be reused',()=>{
 const source='const catalogue=1;\nconst producerRevision=old;',assembly='const catalogue=1;\nconst producerRevision=new;';
 expect(()=>assertSameObservationRecipe(source,assembly,'src','src','aliases','aliases')).not.toThrow();
 for(const args of [[source,assembly,'src-old','src-new','aliases','aliases'],[source,assembly,'src','src','old','new'],[source,assembly.replace('catalogue=1','catalogue=2'),'src','src','aliases','aliases'],['no marker',assembly,'src','src','aliases','aliases']])expect(()=>assertSameObservationRecipe(...args as [string,string,string,string,string,string])).toThrow('fresh full replay');
});
