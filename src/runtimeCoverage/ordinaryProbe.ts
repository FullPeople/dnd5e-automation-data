import type {RuntimeAdapter,RuntimeWitness} from './probe.ts';

const required=['ordinaryCastingRule','ordinaryDirectBaseClassList','ordinarySpellOffer','casterProfiles','learnActiveSpell','chooseCantrip','prepareSpellEntry','classSpellGroups','cantripGroups','spellIsReady','spellPayments','spellActionRequest','performSpellAction','exportCharacter','readCharacter'] as const;
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const immutableClasses=new WeakMap<RuntimeAdapter,WeakMap<any[],any[]>>();
/** Only immutable catalog authentication is cached, never character state. */
export function ordinaryProbeClasses(api:RuntimeAdapter,catalog:any[]):any[]{
 let catalogs=immutableClasses.get(api);if(!catalogs){catalogs=new WeakMap();immutableClasses.set(api,catalogs);}
 let classes=catalogs.get(catalog);if(!classes){classes=catalog.filter(entry=>entry?.kind==='class'&&api.ordinaryCastingRule(entry));catalogs.set(catalog,classes);}return classes;
}
const observe=(read:()=>any,c:any)=>{const before=JSON.stringify(c),result=read();if(JSON.stringify(c)!==before)throw Error('Ordinary casting observation mutated its disposable character');return result;};
const authority={canEdit:true,gm:false};

/** Actual source allocation and transactions on one disposable authenticated
 * class. A witness does not apply spell effects, infer activation or grant a
 * real player's class, learning permission, preparation or resources. */
export function probeOrdinaryCasting(api:RuntimeAdapter,entry:any,catalog:any[]):RuntimeWitness|null{
 if(api.ordinaryCastingCapability===undefined)return null;
 if(api.ordinaryCastingCapability!==1)throw Error('Unsupported ordinary casting adapter capability');
 for(const name of required)if(typeof api[name]!=='function')throw Error('Missing ordinary casting runtime export: '+name);
 if(entry?.kind!=='spell'||!api.ordinaryCastingRule(entry)||!Number.isSafeInteger(entry.raw.level)||entry.raw.level<0||entry.raw.level>9)return null;
 for(const edition of entry.edition==='both'?['2014','2024']:[entry.edition])for(const cls of ordinaryProbeClasses(api,catalog)){
  if(cls.edition!=='both'&&cls.edition!==edition)continue;
  const c=api.newCharacter(edition);c.id='ordinary-cast-audit';c.automation=api.newAutomationState();
  c.profile.enabledSources=[...new Set([entry.source,cls.source,...(entry.dependencies||[]),...(cls.dependencies||[])])];
  for(const ability of ['str','dex','con','int','wis','cha'])c.abilities[ability]=16;
  c.baseHp=20;c.runtime.hp=7;c.notes='authored ordinary casting sentinel';
  c.runtime.resources['ordinary-audit-manual']={name:'authored spent manual counter',max:7,current:2,locked:true};
  const owner={id:'ordinary-audit-owner',entry:structuredClone(cls),level:20,quantity:1,equipped:false};c.selections.push(owner);
  if(!api.selectionAllowed(c,entry)||!api.selectionAllowed(c,cls))continue;
  api.syncFeatures(c,catalog);api.syncAutoResources(c);
  const profiles=observe(()=>api.casterProfiles(c),c).filter((p:any)=>p.owner.id===owner.id&&api.ordinaryCastingRule(p.casting.entry)&&p.maxLevel>=entry.raw.level&&api.ordinaryDirectBaseClassList(entry,p));
  if(profiles.length!==1)continue;const profile=profiles[0];
  const preserved={hp:c.runtime.hp,notes:c.notes,abilities:structuredClone(c.abilities),manual:structuredClone(c.runtime.resources['ordinary-audit-manual'])};
  const pools=structuredClone(c.runtime.resources);
  let id:string|undefined;
  if(entry.raw.level===0){const result=api.chooseCantrip(c,entry,owner.id);if(result?.error)continue;id=result?.id;}
  else if(profile.mode==='prepared')id=api.prepareSpellEntry(c,entry,undefined,owner.id);
  else {const result=api.learnActiveSpell(c,entry,owner.id);if(result?.error)continue;id=result?.id;}
  if(!same(pools,c.runtime.resources))continue;
  const rows=c.selections.filter((s:any)=>s.id===id&&s.entry.id===entry.id&&!s.parentId&&!s.grantKey&&!s.requirementId),row=rows[0];
  if(rows.length!==1||c.spellSettings?.special?.[id!])continue;
  const ready=observe(()=>api.spellIsReady(c,row),c);if(ready!==true)continue;
  const groups=observe(()=>entry.raw.level===0?api.cantripGroups(c):api.classSpellGroups(c),c);
  const allocation=groups.filter((g:any)=>(g.id??g.profile?.owner.id)===owner.id);
  if(allocation.length!==1||!(entry.raw.level===0?allocation[0].slots.slice(0,allocation[0].capacity):allocation[0].ids).includes(id))continue;
  const offered=observe(()=>api.ordinarySpellOffer(c,id,owner.id,authority),c);
  const payments=observe(()=>api.spellPayments(c,id,authority,owner.id),c);
  const options=offered.options.filter((option:any)=>option.available&&option.id.startsWith('ordinary:')&&payments.options.some((actual:any)=>same(actual,option)));
  const option=options[0];if(!option)continue;
  const free=option.id==='ordinary:cantrip',pool=option.resourceId&&c.runtime.resources[option.resourceId];
  if(free?(entry.raw.level!==0||option.cost!==0||option.resourceId!==undefined):(entry.raw.level===0||option.cost!==1||!/^ordinary:(spell|pact)-slot:[1-9]$/.test(option.id)||option.id!==`ordinary:${option.resourceId}`||!pool||pool.automatic!==true||pool.unlimited||pool.featureGrant||pool.sourceSpellGrant||!Number.isSafeInteger(pool.current)||pool.current<=0||pool.current>100||!Number.isSafeInteger(pool.max)||pool.max<pool.current))continue;
  const initial=free?0:pool.current,casts=free?1:initial,sequence=c.runtime.automationActions?.sequence??0;
  if(!Number.isSafeInteger(sequence)||sequence<0)continue;
  const before={spellId:entry.id,classId:cls.id,ready,remaining:initial};let duplicateUnchanged=true,valid=true;
  for(let at=0;at<casts;at++){
   const currentOffer=observe(()=>api.ordinarySpellOffer(c,id,owner.id,authority),c),currentOption=currentOffer.options.find((p:any)=>p.id===option.id&&p.available);
   if(!currentOption){valid=false;break;}
   const characterBefore=structuredClone(c),resourceBefore=structuredClone(c.runtime.resources),expected=structuredClone(resourceBefore);
   if(!free)expected[option.resourceId].current--;
   const q=observe(()=>api.spellActionRequest(c,id,option.id,`ordinary-audit-cast-${at}`,'cast',owner.id),c);
   const result=api.performSpellAction(c,q,authority),receipt=result?.receipt;
   if(result?.status!=='applied'||!receipt||receipt.id!==q.id||receipt.selectionId!==id||receipt.sequence!==sequence+at||receipt.mode!=='cast'||receipt.level!==option.level||c.runtime.automationActions?.sequence!==sequence+at+1||!same(c.runtime.automationActions.last,receipt)||!same(c.runtime.resources,expected)||(!free&&(receipt.resourceId!==option.resourceId||receipt.before!==resourceBefore[option.resourceId].current||receipt.after!==expected[option.resourceId].current))){valid=false;break;}
   characterBefore.runtime.resources=expected;characterBefore.runtime.automationActions={version:1,sequence:sequence+at+1,last:receipt};
   if(!free&&option.resourceId.startsWith('spell-slot:'))characterBefore.spellSettings.slots[option.resourceId.split(':')[1]]={max:expected[option.resourceId].max,used:expected[option.resourceId].max-expected[option.resourceId].current};
   if(!same(c,characterBefore)){valid=false;break;}
   const after=JSON.stringify(c),duplicate=api.performSpellAction(c,q,authority);duplicateUnchanged&&=duplicate?.status==='duplicate'&&JSON.stringify(c)===after;
   if(!duplicateUnchanged){valid=false;break;}
  }
  if(!valid)continue;
  let exhausted=false;
  if(!free){
   const snapshot=JSON.stringify(c),q=observe(()=>api.spellActionRequest(c,id,option.id,'ordinary-audit-exhausted','cast',owner.id),c),result=api.performSpellAction(c,q,authority);
   exhausted=c.runtime.resources[option.resourceId].current===0&&result?.status==='rejected'&&JSON.stringify(c)===snapshot;
   if(!exhausted)continue;
  }
  const reopened=api.readCharacter(JSON.parse(JSON.stringify(api.exportCharacter(c)))),persisted=reopened.character;
  const nativePreserved=Array.isArray(reopened.repaired)&&reopened.repaired.length===0&&same(persisted.runtime,c.runtime)&&same(persisted.spellSettings,c.spellSettings)&&same(persisted.selections,c.selections);
  api.syncAutoResources(persisted);
  const syncPreserved=same(persisted.runtime.resources,c.runtime.resources)&&same(persisted.runtime.automationActions,c.runtime.automationActions)&&same(persisted.spellSettings,c.spellSettings);
  const manualPreserved=[c,persisted].every(card=>same({hp:card.runtime.hp,notes:card.notes,abilities:card.abilities,manual:card.runtime.resources['ordinary-audit-manual']},preserved));
  if(!nativePreserved||!syncPreserved||!manualPreserved||(!free&&persisted.runtime.resources[option.resourceId].current!==0))continue;
  return {kind:'ordinary-source-cast',level:owner.level,edition,before,after:{spellId:entry.id,classId:cls.id,spellLevel:entry.raw.level,castLevel:option.level,casts,remaining:0,resourceDebit:free?0:initial,duplicateUnchanged,exhausted,nativePreserved:true,manualPreserved:true,sequenceDelta:c.runtime.automationActions.sequence-sequence}};
 }
 return null;
}
