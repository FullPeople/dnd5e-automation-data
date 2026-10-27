import type {RuntimeAdapter,RuntimeWitness} from './probe.ts';
const required=['itemChargeRule','itemChargeOffers','itemChargeRequest','performItemChargeAction','ownedItemChargeResource','assertItemChargeResourceEdit','setResource','restResources','removeSelection','exportCharacter','readCharacter'] as const;
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const authority={canEdit:true,gm:false};
const observe=(c:any,fn:()=>any)=>{const before=JSON.stringify(c),result=fn();if(JSON.stringify(c)!==before)throw Error('Item charge observation mutated its disposable character');return result;};
const rejected=(c:any,fn:()=>any)=>{const before=JSON.stringify(c),result=fn();return result?.status==='rejected'&&JSON.stringify(c)===before;};
const blocked=(c:any,fn:()=>any)=>{const before=JSON.stringify(c);try{fn();return false;}catch{return JSON.stringify(c)===before;}};
/** Full non-owned state, not a hand-picked HP/resource sentinel alone. */
const manual=(c:any,key:string)=>{const copy=structuredClone(c);delete copy.runtime.itemChargeDebits;delete copy.runtime.resources[key];return copy;};

/** Bounded source-proved fixed1 bookkeeping. No spell/effect execution, recovery,
 * terminal destruction or inferred campaign acquisition. Offers are always live. */
export function probeItemChargeAccounting(api:RuntimeAdapter,entry:any,catalog:any[]):RuntimeWitness|null{
 if(api.itemChargeDebitCapability===undefined)return null;
 if(api.itemChargeDebitCapability!==1)throw Error('Unsupported item charge adapter capability');
 for(const name of required)if(typeof api[name]!=='function')throw Error('Missing item charge runtime export: '+name);
 if(entry?.kind!=='item')return null;const rule=api.itemChargeRule(entry),action=rule?.action;
 if(!rule?.supported||action?.cost!==1||![0,1].includes(action.minAfter)||!Number.isSafeInteger(rule.capacity)||rule.capacity<1||rule.capacity>10000)return null;
 const minimumAfter=action.minAfter,knownInitial=1+minimumAfter;if(knownInitial>rule.capacity)return null;
 for(const edition of entry.edition==='both'?['2014','2024']:[entry.edition]){
  if(action.requiredCardEdition&&action.requiredCardEdition!==edition)continue;
  const c=api.newCharacter(edition);c.id='item-charge-audit';c.automation=api.newAutomationState();c.profile.enabledSources=[...new Set([entry.source,...(entry.dependencies||[]),...(action.requiredSources||[])])];
  c.name='Authored charge accounting character';c.notes='Authored immutable manual sentinel';c.baseHp=20;c.runtime.hp=7;c.runtime.resources['item-charge-manual']={name:'Authored spent manual counter',max:7,current:2,locked:true};
  const owner={id:'item-charge-audit-owner',entry:structuredClone(entry),level:1,quantity:1,equipped:action.equipmentRequired===true};c.selections.push(owner);
  if(!api.selectionAllowed(c,entry))continue;api.syncAutoResources(c);api.syncSourceSpells(c,catalog);
  const offers=observe(c,()=>api.itemChargeOffers(c,authority)).filter((o:any)=>o.ownerId===owner.id),offer=offers[0];
  if(offers.length!==1||!offer.canAcquire||offer.initialized||c.runtime.itemChargeDebits!==undefined||c.runtime.resources[offer.key]||offer.capacity!==rule.capacity||offer.cost!==action.cost||offer.actionKey!==action.key||offer.minAfter!==minimumAfter)continue;
  const before={entryId:entry.id,initialized:offer.initialized,resourcePresent:!!c.runtime.resources[offer.key]},manualBefore=manual(c,offer.key),cardBefore=structuredClone(c),sequence=c.runtime.itemChargeDebits?.sequence??0;
  const acquire=observe(c,()=>api.itemChargeRequest(c,owner.id,'item-charge-audit-acquire',{kind:'acquire',knownRemaining:knownInitial,confirmedGenuineItem:true,confirmedKnownBalance:true})),acquired=api.performItemChargeAction(c,acquire,authority),state=c.runtime.itemChargeDebits,record=state?.records?.[0],resource=c.runtime.resources[offer.key];
  if(acquired?.status!=='applied'||acquired.receipt?.id!==acquire.id||acquired.receipt.key!==offer.key||acquired.receipt.kind!=='acquire'||acquired.receipt.sequence!==sequence||acquired.receipt.before!==0||acquired.receipt.after!==knownInitial||state?.sequence!==sequence+1||state.records.length!==1||!same(state.last,acquired.receipt)||record?.ownerId!==owner.id||record.entryId!==entry.id||record.canonicalEntryId!==rule.id||record.snapshotSha256!==rule.fullNormalizedSnapshotSha256||record.capacity!==rule.capacity||record.initial!==knownInitial||record.spent!==0||record.withdrawn!==false||record.events.length!==1||!same(record.events[0],{id:acquire.id,kind:'acquire',before:0,after:knownInitial,sequence})||resource?.max!==rule.capacity||resource.current!==knownInitial||resource.itemChargeDebitGrant?.key!==offer.key||api.ownedItemChargeResource(c,offer.key)!==true)continue;
  const expectedAcquire=structuredClone(cardBefore);expectedAcquire.runtime.itemChargeDebits=structuredClone(state);expectedAcquire.runtime.resources[offer.key]=structuredClone(resource);if(!same(c,expectedAcquire)||!same(manual(c,offer.key),manualBefore))continue;
  let duplicateUnchanged=observe(c,()=>api.performItemChargeAction(c,acquire,authority))?.status==='duplicate';if(!duplicateUnchanged)continue;
  const live=observe(c,()=>api.itemChargeOffers(c,authority)).find((o:any)=>o.ownerId===owner.id);
  if(!live?.canDebit||live.actionKey!==action.key||live.cost!==1||live.minAfter!==minimumAfter||live.remaining!==knownInitial||live.capacity!==rule.capacity)continue;
  const debit=observe(c,()=>api.itemChargeRequest(c,owner.id,'item-charge-audit-debit',{kind:'debit',actionKey:live.actionKey})),debitBefore=structuredClone(c),paid=api.performItemChargeAction(c,debit,authority),receipt=paid?.receipt;
  if(paid?.status!=='applied'||receipt?.id!==debit.id||receipt.key!==offer.key||receipt.kind!=='debit'||receipt.sequence!==sequence+1||receipt.actionKey!==action.key||receipt.before!==knownInitial||receipt.after!==minimumAfter)continue;
  const expected=structuredClone(debitBefore),next=expected.runtime.itemChargeDebits,event={id:debit.id,kind:'debit',actionKey:action.key,before:knownInitial,after:minimumAfter,sequence:sequence+1};next.records[0].spent=1;next.records[0].events.push(event);next.sequence=sequence+2;next.last={...event,key:offer.key,fingerprint:receipt.fingerprint};expected.runtime.resources[offer.key].current=minimumAfter;
  if(!same(c,expected)||!same(manual(c,offer.key),manualBefore))continue;
  duplicateUnchanged&&=observe(c,()=>api.performItemChargeAction(c,debit,authority))?.status==='duplicate';if(!duplicateUnchanged)continue;
  const boundaryDebitRejected=rejected(c,()=>api.performItemChargeAction(c,api.itemChargeRequest(c,owner.id,'item-charge-audit-boundary',{kind:'debit',actionKey:action.key}),authority));
  if(!boundaryDebitRejected||!rejected(c,()=>api.performItemChargeAction(c,api.itemChargeRequest(c,owner.id,'item-charge-audit-reinit',{kind:'acquire',knownRemaining:knownInitial,confirmedGenuineItem:true,confirmedKnownBalance:true}),authority)))continue;
  const genericEditsNoRefill=blocked(c,()=>api.setResource(c,offer.key,rule.capacity))&&blocked(c,()=>api.assertItemChargeResourceEdit(c,offer.key,{...c.runtime.resources[offer.key],current:rule.capacity}));if(!genericEditsNoRefill)continue;
  const rest=structuredClone(c),restBefore=structuredClone(rest);api.restResources(rest,'short');api.restResources(rest,'long');api.syncAutoResources(rest);api.syncSourceSpells(rest,catalog);
  const restNoRefill=same(rest.runtime.itemChargeDebits,restBefore.runtime.itemChargeDebits)&&same(rest.runtime.resources,restBefore.runtime.resources)&&same(manual(rest,offer.key),manualBefore);
  const reopened=api.readCharacter(JSON.parse(JSON.stringify(api.exportCharacter(c)))),native=reopened.character;
  const nativePreserved=Array.isArray(reopened.repaired)&&reopened.repaired.length===0&&same(native,c);api.syncAutoResources(native);api.syncSourceSpells(native,catalog);
  if(!restNoRefill||!nativePreserved||!same(native.runtime.itemChargeDebits,c.runtime.itemChargeDebits)||!same(native.runtime.resources,c.runtime.resources)||!same(manual(native,offer.key),manualBefore))continue;
  // Later native-copy withdrawal/relearning is not counted as debit sequence2.
  const revoked=structuredClone(native),oldRecord=structuredClone(native.runtime.itemChargeDebits.records[0]);api.removeSelection(revoked,owner.id);revoked.selections.push(structuredClone(owner));api.syncAutoResources(revoked);api.syncSourceSpells(revoked,catalog);
  const retained=revoked.runtime.itemChargeDebits?.records?.[0],revokedOffer=observe(revoked,()=>api.itemChargeOffers(revoked,authority)).find((o:any)=>o.ownerId===owner.id);
  const ownerRevocationPreserved=retained?.withdrawn===true&&retained.initial===knownInitial&&retained.spent===1&&retained.events.length===3&&same(retained.events.slice(0,2),oldRecord.events)&&retained.events[2].kind==='withdraw'&&revoked.runtime.itemChargeDebits.sequence===sequence+3&&revoked.runtime.resources[offer.key]?.current===minimumAfter&&revokedOffer?.canAcquire===false&&revokedOffer.canDebit===false&&rejected(revoked,()=>api.performItemChargeAction(revoked,api.itemChargeRequest(revoked,owner.id,'item-charge-audit-relearn',{kind:'acquire',knownRemaining:knownInitial,confirmedGenuineItem:true,confirmedKnownBalance:true}),authority));
  const manualPreserved=same(manual(c,offer.key),manualBefore)&&same(manual(rest,offer.key),manualBefore)&&same(manual(native,offer.key),manualBefore)&&same(manual(revoked,offer.key),manualBefore);
  const sourceDerivedCapacity=api.itemChargeRule(entry)?.fullNormalizedSnapshotSha256===record.snapshotSha256&&rule.capacity===resource.max;
  if(!ownerRevocationPreserved||!manualPreserved||!sourceDerivedCapacity)continue;
  return {kind:'item-charge-accounting',level:owner.level,edition,before,after:{entryId:entry.id,actionKey:receipt.actionKey,capacity:resource.max,knownInitial:record.initial,minimumAfter,remaining:c.runtime.resources[offer.key].current,resourceDebit:receipt.before-receipt.after,sequenceDelta:c.runtime.itemChargeDebits.sequence-sequence,sourceDerivedCapacity,fixedCost:live.cost,itemEffectApplied:false,recoveryClaimed:false,duplicateUnchanged,boundaryDebitRejected,genericEditsNoRefill,restNoRefill,nativePreserved,ownerRevocationPreserved,manualPreserved}};
 }
 return null;
}
