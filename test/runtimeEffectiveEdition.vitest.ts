import {expect,it} from 'vitest';
import {probeEntry} from '../src/runtimeCoverage/probe.ts';

function fixture(published:'2014'|'2024'|'both',effective:string,allowed='2024'){
 const attempts:string[]=[],entry={id:'authored-versioned-feature',kind:'feature',source:'AUTHORED',edition:published,raw:{level:3,className:'Authored caster',classSource:'XPHB'}};
 const api:any={
  entryEdition:()=>effective,
  newCharacter:(edition:string)=>{attempts.push(edition);return {edition,selections:[],profile:{enabledSources:[],optional:{}},runtime:{resources:{}}};},
  newAutomationState:()=>({}),selectionAllowed:(card:any)=>card.edition===allowed,
  syncAutoResources:()=>{},syncFeatures:()=>{},syncSourceSpells:()=>{},
  evaluate:(card:any)=>({skills:{},ac:card.selections.some((row:any)=>row.id==='candidate')?12:10}),
 };
 return {api,entry,attempts};
}

it('uses the consumer effective class edition instead of the expansion publication edition',()=>{
 const f=fixture('2014','2024'),witness=probeEntry(f.api,f.entry,[f.entry],[]);
 expect(witness).toMatchObject({kind:'calculated-sheet',edition:'2024',level:3,before:{ac:10},after:{ac:12}});expect(f.attempts).toEqual(['2024']);
});
it('does not force an effective 2014 class adaptation into its outer 2024 publication field',()=>{
 const f=fixture('2024','2014','2014'),witness=probeEntry(f.api,f.entry,[f.entry],[]);
 expect(witness?.edition).toBe('2014');expect(f.attempts).toEqual(['2014']);
});
it('actually tries both permitted editions when the consumer exposes a version-neutral entry',()=>{
 const f=fixture('2014','both'),witness=probeEntry(f.api,f.entry,[f.entry],[]);
 expect(witness?.edition).toBe('2024');expect(f.attempts).toEqual(['2014','2014','2024']);
});
it('fails closed before creating a card when the consumer edition policy returns an unknown value',()=>{
 const f=fixture('2014','future');expect(()=>probeEntry(f.api,f.entry,[f.entry],[])).toThrow('Invalid consumer entry edition');expect(f.attempts).toEqual([]);
});
