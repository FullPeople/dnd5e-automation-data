import type {RuntimeAdapter,RuntimeWitness} from './probe.ts';
const required=['limitedSourceRule','limitedSourceUseOffers','limitedSourceUseRequest','performLimitedSourceUseAction','limitedSourceSpellOffer','ownedLimitedSourceResource','assertLimitedSourceResourceEdit','setResource','restResources','removeSelection','spellPayments','spellActionRequest','performSpellAction','exportCharacter','readCharacter'] as const;
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const authority={canEdit:true,gm:false};
const observe=(c:any,fn:()=>any)=>{const before=JSON.stringify(c),result=fn();if(JSON.stringify(c)!==before)throw Error('Limited source observation mutated its disposable character');return result;};
const rejectedUnchanged=(c:any,fn:()=>any)=>{const before=JSON.stringify(c),result=fn();return result?.status==='rejected'&&JSON.stringify(c)===before;};
const throwsUnchanged=(c:any,fn:()=>any)=>{const before=JSON.stringify(c);try{fn();return false;}catch{return JSON.stringify(c)===before;}};
const sentinel=(c:any)=>({hp:c.runtime.hp,abilities:c.abilities,notes:c.notes,manual:c.runtime.resources['limited-audit-manual']});
/** One explicitly authored known remaining use, not automatic grant/full balance,
 * campaign permission, or execution of the spell's effects. No live result cache. */
export function probeLimitedSourceUses(api:RuntimeAdapter,entry:any,catalog:any[]):RuntimeWitness|null{
 if(api.limitedSourceCapability===undefined)return null;
 if(api.limitedSourceCapability!==1)throw Error('Unsupported limited source adapter capability');
 for(const name of required)if(typeof api[name]!=='function')throw Error('Missing limited source runtime export: '+name);
 if(entry?.kind!=='feature')return null;const rule=api.limitedSourceRule(entry);if(!rule?.supported||!Array.isArray(rule.pools)||rule.pools.length!==1)return null;
 for(const edition of entry.edition==='both'?['2014','2024']:[entry.edition])for(const pool of rule.pools){
  if(pool.spellEdition!=='both'&&pool.spellEdition!==edition)continue;
  const c=api.newCharacter(edition);c.id='limited-source-audit';c.automation=api.newAutomationState();c.profile.enabledSources=[...new Set([entry.source,pool.spellSource,...(entry.dependencies||[])])];
  c.baseHp=20;c.runtime.hp=7;c.notes='Authored finite source accounting sentinel';c.runtime.resources['limited-audit-manual']={name:'Authored spent manual resource',max:7,current:2,locked:true};
  const owner={id:'limited-audit-owner',entry:structuredClone(entry),level:1,quantity:1,equipped:false};c.selections.push(owner);if(!api.selectionAllowed(c,entry))continue;
  api.syncAutoResources(c);api.syncSourceSpells(c,catalog);
  const initial=observe(c,()=>api.limitedSourceUseOffers(c,authority)).filter((o:any)=>o.ownerId===owner.id&&o.canAcquire&&o.capacity===pool.capacity),offer=initial.length===1?initial[0]:undefined;
  if(!offer||offer.initialized||c.runtime.resources[offer.key]||c.runtime.limitedSourceUses!==undefined||!Number.isSafeInteger(offer.capacity)||offer.capacity<1||offer.capacity>100||c.selections.some((s:any)=>c.spellSettings?.special?.[s.id]?.sourceGrant?.usage==='limited'))continue;
  const before={entryId:entry.id,initialized:offer.initialized,resourcePresent:!!c.runtime.resources[offer.key]},manual=structuredClone(sentinel(c)),preAcquire=structuredClone(c),limitedSequence=c.runtime.limitedSourceUses?.sequence??0,actionSequence=c.runtime.automationActions?.sequence??0;
  const acquire=observe(c,()=>api.limitedSourceUseRequest(c,owner.id,offer.poolId,'limited-audit-acquire',{kind:'acquire',knownRemaining:1,confirmedGenuineGrant:true,confirmedKnownBalance:true}));
  const acquired=api.performLimitedSourceUseAction(c,acquire,authority),record=c.runtime.limitedSourceUses?.records?.[0],mirror=c.runtime.resources[offer.key];
  const explicitAcquisition=acquired?.status==='applied'&&acquired.receipt?.id===acquire.id&&acquired.receipt.key===offer.key&&acquired.receipt.kind==='acquire'&&acquired.receipt.sequence===limitedSequence&&acquired.receipt.before===0&&acquired.receipt.after===1&&c.runtime.limitedSourceUses?.sequence===limitedSequence+1&&c.runtime.limitedSourceUses.records.length===1&&same(c.runtime.limitedSourceUses.last,acquired.receipt)&&record?.ownerId===owner.id&&record.entryId===entry.id&&record.canonicalEntryId===rule.id&&record.poolId===offer.poolId&&record.snapshotSha256===rule.snapshotSha256&&record.capacity===pool.capacity&&record.initial===1&&record.spent===0&&record.withdrawn===false&&record.events.length===1&&same(record.events[0],{id:acquire.id,kind:'acquire',before:0,after:1,sequence:limitedSequence})&&mirror?.max===pool.capacity&&mirror.current===1&&mirror.limitedSourceUseGrant?.key===offer.key&&api.ownedLimitedSourceResource(c,offer.key)===true;
  if(!explicitAcquisition)continue;
  const expectedAcquire=structuredClone(preAcquire);expectedAcquire.runtime.resources[offer.key]=structuredClone(mirror);expectedAcquire.runtime.limitedSourceUses=structuredClone(c.runtime.limitedSourceUses);
  if(!same(c,expectedAcquire))continue;
  let duplicateUnchanged=observe(c,()=>api.performLimitedSourceUseAction(c,acquire,authority))?.status==='duplicate';if(!duplicateUnchanged)continue;
  api.syncSourceSpells(c,catalog);
  const children=c.selections.filter((s:any)=>s.parentId===owner.id&&s.entry.id===pool.spellEntryId&&c.spellSettings?.special?.[s.id]?.sourceGrant?.usage==='limited');if(children.length!==1)continue;const child=children[0];
  const live=observe(c,()=>api.limitedSourceSpellOffer(c,child.id,authority)),options=observe(c,()=>api.spellPayments(c,child.id,authority)).options;
  if(!live||live.offer.key!==offer.key||live.pool.id!==pool.id||!same(live.payment,options.find((o:any)=>o.id==='limited'))||!live.payment.available||live.payment.cost!==1||live.payment.resourceId!==offer.key||live.payment.level!==pool.castLevel||options.some((o:any)=>o.id!=='limited'))continue;
  const cast=observe(c,()=>api.spellActionRequest(c,child.id,'limited','limited-audit-cast','cast',undefined,{confirmedLimitedSourceValid:true})),castBefore=structuredClone(c),castResult=api.performSpellAction(c,cast,authority),receipt=castResult?.receipt;
  const perCastConfirmed=cast.limitedIntent?.confirmedLimitedSourceValid===true&&castResult?.status==='applied'&&receipt?.id===cast.id&&receipt.selectionId===child.id&&receipt.resourceId===offer.key&&receipt.before===1&&receipt.after===0&&receipt.level===pool.castLevel&&receipt.mode==='cast'&&receipt.sequence===actionSequence;
  if(!perCastConfirmed)continue;
  const expectedCast=structuredClone(castBefore),next=expectedCast.runtime.limitedSourceUses,nextRecord=next.records[0],event={id:cast.id,kind:'cast',before:1,after:0,sequence:limitedSequence+1};nextRecord.spent=1;nextRecord.events.push(event);next.sequence=limitedSequence+2;next.last={...event,key:offer.key,fingerprint:cast.basis};expectedCast.runtime.resources[offer.key].current=0;expectedCast.runtime.automationActions={version:1,sequence:actionSequence+1,last:receipt};
  if(!same(c,expectedCast))continue;
  duplicateUnchanged&&=observe(c,()=>api.performSpellAction(c,cast,authority))?.status==='duplicate';if(!duplicateUnchanged)continue;
  const exhausted=rejectedUnchanged(c,()=>api.performSpellAction(c,api.spellActionRequest(c,child.id,'limited','limited-audit-empty','cast',undefined,{confirmedLimitedSourceValid:true}),authority));
  if(!exhausted||!rejectedUnchanged(c,()=>api.performLimitedSourceUseAction(c,api.limitedSourceUseRequest(c,owner.id,offer.poolId,'limited-audit-reinit',{kind:'acquire',knownRemaining:1,confirmedGenuineGrant:true,confirmedKnownBalance:true}),authority)))continue;
  // Two actual generic paths: resource pips/setter and resource-editor proposal
  // guard. Neither may refill, adopt or rewrite the dedicated history.
  const genericEditsNoRefill=throwsUnchanged(c,()=>api.setResource(c,offer.key,pool.capacity))&&throwsUnchanged(c,()=>api.assertLimitedSourceResourceEdit(c,offer.key,{...c.runtime.resources[offer.key],current:pool.capacity}));
  if(!genericEditsNoRefill)continue;
  const rest=structuredClone(c),restBefore=structuredClone(rest.runtime);api.restResources(rest,'short');api.restResources(rest,'long');api.syncAutoResources(rest);api.syncSourceSpells(rest,catalog);
  const restNoRefill=same(rest.runtime.resources,restBefore.resources)&&same(rest.runtime.limitedSourceUses,restBefore.limitedSourceUses)&&same(rest.runtime.automationActions,restBefore.automationActions)&&rest.runtime.resources[offer.key].current===0;
  const reopened=api.readCharacter(JSON.parse(JSON.stringify(api.exportCharacter(c)))),native=reopened.character;
  const nativePreserved=Array.isArray(reopened.repaired)&&reopened.repaired.length===0&&same(native.runtime,c.runtime)&&same(native.spellSettings,c.spellSettings)&&same(native.selections,c.selections);
  api.syncAutoResources(native);api.syncSourceSpells(native,catalog);
  if(!restNoRefill||!nativePreserved||!same(native.runtime.resources,c.runtime.resources)||!same(native.runtime.limitedSourceUses,c.runtime.limitedSourceUses)||!same(native.runtime.automationActions,c.runtime.automationActions))continue;
  // Withdrawal is deliberately on a LATER native copy: deltas below remain the
  // two measured acquisition/cast ledger events and one spell action only.
  const revoked=structuredClone(native),spentHistory=structuredClone(native.runtime.limitedSourceUses);api.removeSelection(revoked,owner.id);revoked.selections.push(structuredClone(owner));api.syncSourceSpells(revoked,catalog);
  const retained=revoked.runtime.limitedSourceUses?.records?.[0],revokedOffer=observe(revoked,()=>api.limitedSourceUseOffers(revoked,authority)).find((o:any)=>o.key===offer.key);
  const ownerRevocationPreserved=retained?.withdrawn===true&&retained.initial===1&&retained.spent===1&&same(retained.events.slice(0,2),spentHistory.records[0].events)&&retained.events.length===3&&retained.events[2].kind==='withdraw'&&revoked.runtime.limitedSourceUses.sequence===spentHistory.sequence+1&&revoked.runtime.resources[offer.key]?.current===0&&revokedOffer?.canAcquire===false&&!revoked.selections.some((s:any)=>s.parentId===owner.id&&revoked.spellSettings?.special?.[s.id]?.sourceGrant?.usage==='limited'&&revoked.spellSettings.special[s.id].sourceGrant.active)&&rejectedUnchanged(revoked,()=>api.performLimitedSourceUseAction(revoked,api.limitedSourceUseRequest(revoked,owner.id,offer.poolId,'limited-audit-relearn',{kind:'acquire',knownRemaining:1,confirmedGenuineGrant:true,confirmedKnownBalance:true}),authority));
  const manualPreserved=[c,rest,native,revoked].every(value=>same(sentinel(value),manual));
  if(!ownerRevocationPreserved||!manualPreserved)continue;
  return {kind:'limited-source-cast',level:owner.level,edition,before,after:{entryId:entry.id,spellId:child.entry.id,capacity:mirror.max,knownInitial:record.initial,casts:1,resourceDebit:receipt.before-receipt.after,remaining:c.runtime.resources[offer.key].current,limitedSequenceDelta:c.runtime.limitedSourceUses.sequence-limitedSequence,actionSequenceDelta:c.runtime.automationActions.sequence-actionSequence,explicitAcquisition,perCastConfirmed,duplicateUnchanged,exhausted,restNoRefill,genericEditsNoRefill,nativePreserved,ownerRevocationPreserved,manualPreserved}};
 }
 return null;
}
