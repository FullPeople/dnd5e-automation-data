import {expect,it} from 'vitest';
import {probeEntry} from '../src/runtimeCoverage/probe.ts';

function fixture(options={available:2,reject:false,silent:false}){
 const calls:{key:string;refs:string[]}[]=[],entry={id:'authored-owner',kind:'feat',edition:'2014',source:'PHB',raw:{additionalSpells:[{}]}},catalog=[entry],keys=['first','second'];
 const api:any={
  newCharacter:()=>({selections:[],profile:{enabledSources:[],optional:{}},runtime:{resources:{}}}),newAutomationState:()=>({}),selectionAllowed:()=>true,syncAutoResources:()=>{},syncFeatures:()=>{},evaluate:()=>({skills:{}}),automaticWeaponAttacks:()=>({attacks:[]}),
  planSourceSpells:(card:any)=>({choices:keys.map(key=>{const own=card.automation.spellChoices?.[key]||[],used=Object.entries(card.automation.spellChoices||{}).filter(([other])=>other!==key).flatMap(([,refs])=>refs as string[]);return {key,ownerId:'candidate',count:1,distinctGroup:'authored-group',spells:['one|PHB','two|PHB'].slice(0,options.available),blockedSpells:used.filter(ref=>!own.includes(ref))};})}),
  setSourceSpellChoices:(card:any,key:string,refs:string[])=>{
   if(options.reject)throw Error('authored consumer failure');if(options.silent)return;
   const blocked=api.planSourceSpells(card).choices.find((choice:any)=>choice.key===key).blockedSpells;if(refs.some(ref=>blocked.includes(ref)))throw Error('authored duplicate rejected');
   (card.automation.spellChoices||={})[key]=[...refs];calls.push({key,refs:[...refs]});
  },
  syncSourceSpells:(card:any)=>{for(const [key,refs] of Object.entries(card.automation.spellChoices||{}))for(const ref of refs as string[])if(!card.selections.some((row:any)=>row.id===`grant:${key}:${ref}`))card.selections.push({id:`grant:${key}:${ref}`,parentId:'candidate',grantKey:'source-spell:'+key,entry:{id:ref}});},
 };
 return {calls,api,entry,catalog};
}
it('refreshes offered candidates between source choices instead of selecting a duplicate from a stale plan',()=>{
 const f=fixture(),result=probeEntry(f.api,f.entry,f.catalog,[]);expect(f.calls).toEqual([{key:'first',refs:['one|PHB']},{key:'second',refs:['two|PHB']}]);expect(result).toMatchObject({kind:'source-spell-choice',before:[],after:['one|PHB','two|PHB']});
});
it('retains a valid partial grant without inventing a second selection when all remaining candidates are blocked',()=>{
 const f=fixture({available:1,reject:false,silent:false}),result=probeEntry(f.api,f.entry,f.catalog,[]);expect(f.calls).toEqual([{key:'first',refs:['one|PHB']}]);expect(result?.after).toEqual(['one|PHB']);
});
it('continues to fail the whole observation on a genuine consumer rejection',()=>{
 const f=fixture({available:2,reject:true,silent:false});expect(()=>probeEntry(f.api,f.entry,f.catalog,[])).toThrow('authored consumer failure');expect(f.calls).toEqual([]);
});
it('does not turn a silently unrecorded edit into execution evidence',()=>{
 const f=fixture({available:2,reject:false,silent:true});expect(()=>probeEntry(f.api,f.entry,f.catalog,[])).toThrow('Source spell choice was not recorded');expect(f.calls).toEqual([]);
});
