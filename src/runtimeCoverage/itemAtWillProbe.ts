import type {RuntimeAdapter,RuntimeWitness} from './probe.ts';
const required=['itemAtWillRule','itemAtWillOffers','itemAtWillOffer','setItemAtWillIntent','itemAtWillObservedIntent','newCharacter','newAutomationState','selectionAllowed','syncSourceSpells','planSourceSpells','spellPayments','spellActionRequest','performSpellAction','removeSelection','exportCharacter','readCharacter'] as const;
const authority={canEdit:true,gm:false};
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const observe=(c:any,fn:()=>any)=>{const before=JSON.stringify(c),result=fn();if(JSON.stringify(c)!==before)throw Error('Item at-will observation mutated its disposable character');return result;};
const rejected=(c:any,fn:()=>any)=>{const before=JSON.stringify(c),result=fn();return result?.status==='rejected'&&JSON.stringify(c)===before;};
const blocked=(c:any,fn:()=>any)=>{const before=JSON.stringify(c);try{fn();return false;}catch{return JSON.stringify(c)===before;}};
/** Compare every unrelated field, not just a hand-picked resource sentinel. */
const manual=(c:any,ownerId:string)=>{const copy=structuredClone(c),ids=copy.selections.filter((s:any)=>s.parentId===ownerId&&s.grantKey?.startsWith('source-spell:item-atwill/')).map((s:any)=>s.id);copy.selections=copy.selections.filter((s:any)=>!ids.includes(s.id));if(copy.spellSettings?.special)for(const id of ids)delete copy.spellSettings.special[id];delete copy.automation.itemAtWill;delete copy.runtime.automationActions;return copy;};
/** One explicit physical source, every reviewed direct branch, real free action
 * receipts and live guards. No effects, use counters or campaign ownership facts. */
export function probeItemAtWill(api:RuntimeAdapter,entry:any,catalog:any[]):RuntimeWitness|null{
 if(api.itemAtWillCapability===undefined)return null;
 if(api.itemAtWillCapability!==1)throw Error('Unsupported item at-will adapter capability');
 for(const name of required)if(typeof api[name]!=='function')throw Error('Missing item at-will runtime export: '+name);
 if(entry?.kind!=='item')return null;const rule=api.itemAtWillRule(entry);if(!rule||!Array.isArray(rule.grants)||rule.grants.length<1||rule.grants.length>100||rule.grants.some((g:any)=>typeof g.key!=='string'||!g.key||typeof g.targetEntryId!=='string'||!g.targetEntryId||!['self','spell'].includes(g.targetScope)||!['action','bonus-action','spell-default'].includes(g.sourceActionTiming)))return null;
 for(const edition of entry.edition==='both'?['2014','2024']:[entry.edition]){
  const c=api.newCharacter(edition);c.id='item-atwill-audit';c.automation=api.newAutomationState();c.profile.enabledSources=[...new Set([entry.source,...(entry.dependencies||[]),...rule.grants.map((g:any)=>g.targetSource).filter(Boolean)])];c.name='Authored at-will audit character';c.notes='Authored whole-card manual sentinel';c.baseHp=20;c.runtime.hp=7;c.runtime.resources['atwill-manual']={name:'Authored spent resource',max:7,current:2,locked:true};
  c.spellSettings={mode:'prepared',modeOverride:true,ability:'wis',abilityOverride:true,capacity:2,attackBonus:3,dcBonus:4,prepared:[],slots:{},special:{}};
  const owner={id:'item-atwill-audit-owner',entry:structuredClone(entry),level:1,quantity:1,equipped:true,attuned:true};c.selections.push(owner);
  if(!api.selectionAllowed(c,entry))continue;api.syncSourceSpells(c,catalog);
  const initial=observe(c,()=>api.itemAtWillOffer(c,owner.id,catalog,authority)),before={entryId:entry.id,confirmed:initial.active,grantCount:c.selections.filter((s:any)=>s.parentId===owner.id&&s.grantKey?.startsWith('source-spell:item-atwill/')).length,actionSequence:c.runtime.automationActions?.sequence??0};
  if(!initial.canConfirm||before.confirmed!==false||before.grantCount!==0||before.actionSequence!==0||c.automation.itemAtWill!==undefined)continue;
  const preserved=manual(c,owner.id),beforeConsent=structuredClone(c);api.setItemAtWillIntent(c,owner.id,{confirmedGenuineOwnedItem:true},catalog,authority);
  const observed=observe(c,()=>api.itemAtWillObservedIntent(c,owner.id)),expected=structuredClone(beforeConsent);expected.automation.itemAtWill=structuredClone(c.automation.itemAtWill);
  if(!same(c,expected)||!observed||observed.ownerId!==owner.id||observed.entryId!==entry.id||observed.canonicalEntryId!==rule.id||observed.snapshotSha256!==rule.fullNormalizedSnapshotSha256||observed.enabled!==true||observed.nonce!==1||c.automation.itemAtWill.sequence!==1||c.automation.itemAtWill.records.length!==1)continue;
  api.syncSourceSpells(c,catalog);const live=observe(c,()=>api.itemAtWillOffer(c,owner.id,catalog,authority)),children=c.selections.filter((s:any)=>s.parentId===owner.id&&s.grantKey?.startsWith('source-spell:item-atwill/'));
  if(!live.active||children.length!==rule.grants.length||!same(manual(c,owner.id),preserved))continue;
  const branches:any[]=[];let valid=true,duplicateUnchanged=true;
  for(const branch of rule.grants){
   const rows=children.filter((s:any)=>s.grantKey===`source-spell:item-atwill/${encodeURIComponent(branch.key)}`);if(rows.length!==1){valid=false;break;}const row=rows[0],payments=observe(c,()=>api.spellPayments(c,row.id,authority)).options;
   if(payments.length!==1){valid=false;break;}const payment=payments[0];if(payment.id!=='free'||payment.cost!==0||!payment.available||payment.resourceId!==undefined||payment.debits!==undefined||payment.targetEntryId!==branch.targetEntryId||payment.targetScope!==branch.targetScope||payment.sourceActionTiming!==branch.sourceActionTiming||!Number.isInteger(payment.level)||payment.level<0||payment.level>9){valid=false;break;}
   const request=observe(c,()=>api.spellActionRequest(c,row.id,payment.id,`item-atwill-${branches.length}`)),prior=structuredClone(c),action=api.performSpellAction(c,request,authority),receipt=action?.receipt;
   if(action?.status!=='applied'||receipt?.id!==request.id||receipt.selectionId!==row.id||receipt.mode!=='cast'||receipt.level!==payment.level||receipt.sequence!==(prior.runtime.automationActions?.sequence??0)||receipt.resourceId!==undefined||receipt.spent!==undefined||receipt.recovered!==undefined||receipt.before!==undefined||receipt.after!==undefined||!same(c.runtime.automationActions.last,receipt)||c.runtime.automationActions.sequence!==receipt.sequence+1||request.targetScope!==payment.targetScope||request.sourceActionTiming!==payment.sourceActionTiming){valid=false;break;}
   const expected=structuredClone(prior);expected.runtime.automationActions=structuredClone(c.runtime.automationActions);if(!same(c,expected)||!same(manual(c,owner.id),preserved)){valid=false;break;}
   duplicateUnchanged&&=observe(c,()=>api.performSpellAction(c,request,authority))?.status==='duplicate';if(!duplicateUnchanged){valid=false;break;}
   branches.push({key:branch.key,spellId:payment.targetEntryId,targetScope:payment.targetScope,sourceActionTiming:payment.sourceActionTiming,paymentId:payment.id,spellLevel:receipt.level,casts:1,resourceDebit:0});
  }
  if(!valid||branches.length!==rule.grants.length)continue;
  const first=children[0],marks=['equipped',...(rule.requiresAttunement===true?['attuned']:[])];let markLossRejected=true;
  for(const mark of marks){const paused=structuredClone(c),q=api.spellActionRequest(paused,first.id,'free','mark-loss'),o=paused.selections.find((s:any)=>s.id===owner.id);o[mark]=false;if(!rejected(paused,()=>api.performSpellAction(paused,q,authority))||observe(paused,()=>api.itemAtWillOffer(paused,owner.id,catalog,authority)).active){markLossRejected=false;break;}}
  const off=structuredClone(c),offRequest=api.spellActionRequest(off,first.id,'free','source-off');off.profile.enabledSources=off.profile.enabledSources.filter((s:string)=>s!==entry.source);const sourceOffRejected=rejected(off,()=>api.performSpellAction(off,offRequest,authority))&&!observe(off,()=>api.itemAtWillOffer(off,owner.id,catalog,authority)).active;
  const denied=structuredClone(c),deniedRequest=api.spellActionRequest(denied,first.id,'free','readonly'),locked=structuredClone(c),lockedRequest=api.spellActionRequest(locked,first.id,'free','locked');locked.locked=true;
  const currentAuthorityRejected=rejected(denied,()=>api.performSpellAction(denied,deniedRequest,{canEdit:false,gm:true}))&&blocked(denied,()=>api.setItemAtWillIntent(denied,owner.id,null,catalog,{canEdit:false,gm:true}))&&rejected(locked,()=>api.performSpellAction(locked,lockedRequest,authority));
  const reopened=api.readCharacter(JSON.parse(JSON.stringify(api.exportCharacter(c)))),native=reopened.character,nativePreserved=Array.isArray(reopened.repaired)&&reopened.repaired.length===0&&same(native,c);
  if(!nativePreserved)continue;api.syncSourceSpells(native,catalog);if(!same(native,c))continue;
  const withdrawn=structuredClone(native),oldQueued=api.spellActionRequest(withdrawn,first.id,'free','before-withdraw');api.setItemAtWillIntent(withdrawn,owner.id,null,catalog,authority);api.syncSourceSpells(withdrawn,catalog);
  const withdrawnOffer=observe(withdrawn,()=>api.itemAtWillOffer(withdrawn,owner.id,catalog,authority));let withdrawPreserved=withdrawnOffer.record?.enabled===false&&!withdrawnOffer.active&&rejected(withdrawn,()=>api.performSpellAction(withdrawn,oldQueued,authority))&&same(manual(withdrawn,owner.id),preserved);
  api.setItemAtWillIntent(withdrawn,owner.id,{confirmedGenuineOwnedItem:true},catalog,authority);api.syncSourceSpells(withdrawn,catalog);withdrawPreserved&&=observe(withdrawn,()=>api.itemAtWillOffer(withdrawn,owner.id,catalog,authority)).active&&rejected(withdrawn,()=>api.performSpellAction(withdrawn,oldQueued,authority))&&same(manual(withdrawn,owner.id),preserved);
  const relearn=structuredClone(native);api.removeSelection(relearn,owner.id);relearn.selections.push(structuredClone(owner));api.syncSourceSpells(relearn,catalog);withdrawPreserved&&=observe(relearn,()=>api.itemAtWillOffer(relearn,owner.id,catalog,authority)).record?.enabled===false&&!observe(relearn,()=>api.itemAtWillOffer(relearn,owner.id,catalog,authority)).active&&same(manual(relearn,owner.id),preserved);
  const manualPreserved=same(manual(c,owner.id),preserved)&&same(manual(native,owner.id),preserved);
  if(!markLossRejected||!sourceOffRejected||!currentAuthorityRejected||!withdrawPreserved||!manualPreserved)continue;
  return {kind:'item-atwill-source-cast',level:1,edition,before,after:{entryId:entry.id,explicitConfirmation:observed.enabled,grantCount:children.length,branches,casts:branches.reduce((n,b)=>n+b.casts,0),actionSequenceDelta:c.runtime.automationActions.sequence-before.actionSequence,resourceDebit:0,itemEffectsApplied:false,duplicateUnchanged,nativePreserved,withdrawPreserved,markLossRejected,sourceOffRejected,currentAuthorityRejected,manualPreserved}};
 }
 return null;
}
