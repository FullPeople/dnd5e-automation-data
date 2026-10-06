/** Calls the consumer's real functions on disposable cards; never executes IR payloads. */
export interface RuntimeAdapter { [name: string]: any }
export interface RuntimeWitness { kind: string; level: number; edition: string; before: unknown; after: unknown }
const sourceCache=new WeakMap<any[],any[]>();
const stats=(d:any)=>({abilities:d.abilities,ac:d.ac,maxHp:d.maxHp,speed:d.speed,initiative:d.initiative,passive:d.passive,skills:Object.fromEntries(Object.entries(d.skills).map(([k,v]:any)=>[k,[v.value,v.proficient,v.expertise]])),saves:d.saves});
const resources=(c:any)=>Object.fromEntries(Object.entries(c.runtime.resources).filter(([,r]:any)=>r.automatic||r.featureGrant).map(([k,r]:any)=>[k,r.max]));
const changed=(a:unknown,b:unknown)=>JSON.stringify(a)!==JSON.stringify(b);
export function probeEntry(api:RuntimeAdapter,entry:any,catalog:any[],parents:any[]):RuntimeWitness|null {
 let sources=sourceCache.get(catalog);if(!sources){sources=[...new Set(catalog.map(e=>e.source))];sourceCache.set(catalog,sources);}
 const root=['class','subclass','race','background'].includes(entry.kind);
 const gated=entry.raw.additionalSpells!=null;
 const levels=entry.kind==='item'||entry.kind==='spell'||entry.kind==='condition'||entry.kind==='rule'?[1]:gated?Array.from({length:20},(_,i)=>i+1).filter(n=>n>=Number(entry.raw.level||0)):[Math.max(1,Number(entry.raw.level||0)),20];
 for(const edition of entry.edition==='both'?['2014','2024']:[entry.edition])for(const level of levels){
  const base=api.newCharacter(edition);base.id='audit';base.automation=api.newAutomationState();base.profile.enabledSources=sources;base.profile.optional.multiclass=true;
  base.training={armor:'轻甲、中甲、重甲、盾牌',weapons:'简易武器、军用武器'};
  for(const parent of parents)base.selections.push({id:'parent:'+parent.id,entry:parent,level,quantity:1,equipped:false});
  api.syncAutoResources(base);
  const card=structuredClone(base),owner={id:'candidate',entry,level,quantity:1,equipped:entry.kind==='item',attuned:true};card.selections.push(owner);
  if(!api.selectionAllowed(card,entry))continue;
  if(root)api.syncFeatures(card,catalog);api.syncAutoResources(card);if(entry.raw.additionalSpells!=null||root)api.syncSourceSpells(card,catalog);
  const before=stats(api.evaluate(base)),after=stats(api.evaluate(card));
  if(changed(before,after))return {kind:'calculated-sheet',level,edition,before,after};
  const rb=resources(base),ra=resources(card);if(changed(rb,ra))return {kind:'calculated-resource',level,edition,before:rb,after:ra};
  const attacks=api.automaticWeaponAttacks(card,api.evaluate(card)).attacks.filter((a:any)=>a.origin.selectionId==='candidate');
  if(attacks.length)return {kind:'calculated-weapon',level,edition,before:[],after:attacks.map((a:any)=>({attackBonus:a.attack_bonus,damage:a.damage,mode:a.modeLabel}))};
  const grants=card.selections.filter((s:any)=>s.parentId==='candidate'&&s.grantKey?.startsWith('source-spell:'));
  if(grants.length)return {kind:'source-spell-grant',level,edition,before:[],after:grants.map((s:any)=>s.entry.id).sort()};
  // Declared choices must produce a real resolved spell grant after saving.
  if(gated)for(const set of Array.isArray(entry.raw.additionalSpells)?entry.raw.additionalSpells.map((_:any,i:number)=>i):[]){
   const trial=structuredClone(card);trial.automation.spellSets={candidate:set};
   for(const q of api.planSourceSpells(trial,catalog).choices.filter((q:any)=>q.ownerId==='candidate')){if(q.abilities?.length)(trial.automation.spellAbilities||={})[q.key]=q.abilities[0];if(q.spells?.length)api.setSourceSpellChoices(trial,q.key,q.spells.slice(0,q.count),catalog);}
   api.syncSourceSpells(trial,catalog);const delivered=trial.selections.filter((s:any)=>s.parentId==='candidate'&&s.grantKey?.startsWith('source-spell:'));
   if(delivered.length)return {kind:'source-spell-choice',level,edition,before:[],after:delivered.map((s:any)=>s.entry.id).sort()};
  }
  for(const choice of api.sheetChoices(card,catalog).filter((q:any)=>q.ownerId==='candidate'&&!q.restricted)){
   for(const option of choice.options.filter((o:any)=>!o.unavailable)){
    const trial=structuredClone(card);try{
     if(choice.channel==='equipment')api.claimStartingEquipment(trial,choice.id,option.value,catalog);
     else api.chooseSheetOption(trial,choice.id,option.value,catalog);
     const selected=api.sheetChoices(trial,catalog).find((q:any)=>q.id===choice.id)?.selected;
     const delivered=trial.selections.filter((s:any)=>s.requirementId===choice.id||s.grantKey?.startsWith('equipment:')&&s.parentId==='candidate');
     if(selected?.includes(option.value)||delivered.length)return {kind:'choice:'+choice.channel,level,edition,before:choice.selected,after:{selected,delivered:delivered.map((s:any)=>s.entry.id).sort()}};
    }catch{/* A listed but unusable option is not evidence. */}
   }
  }
  // Fixed speed can equal the empty-card default. Replace a real alternative
  // race and compare the walking-speed calculation, without counting other traits.
  const walk=typeof entry.raw.speed==='number'?entry.raw.speed:entry.raw.speed?.walk;
  const speed=typeof walk==='number'?walk:walk?.number;
  if(entry.kind==='race'&&Number.isFinite(speed)){
   const alternate=catalog.find(e=>e.kind==='race'&&api.selectionAllowed(card,e)&&typeof e.raw.speed?.walk==='number'&&e.raw.speed.walk!==speed);
   if(alternate){const previous=structuredClone(base);previous.selections.push({id:'previous-race',entry:alternate,level:1,quantity:1,equipped:false});const b=api.evaluate(previous).speed,a=api.evaluate(card).speed;if(a!==b&&a===speed)return {kind:'calculated-speed',level,edition,before:b,after:a};}
  }
  // Armor-dependent traits and automatic training need actual worn equipment.
  if(['race','background','feat','feature','subclass'].includes(entry.kind)){
   const worn=catalog.find(e=>e.kind==='item'&&e.source===(edition==='2024'?'XPHB':'PHB')&&['LA','LA|XPHB'].includes(e.raw.type)&&typeof e.raw.ac==='number');
   const weapon=catalog.find(e=>e.kind==='item'&&e.source===(edition==='2024'?'XPHB':'PHB')&&['M','M|XPHB'].includes(e.raw.type)&&e.raw.dmg1);
   const shield=catalog.find(e=>e.kind==='item'&&e.source===(edition==='2024'?'XPHB':'PHB')&&['S','S|XPHB'].includes(e.raw.type));
   const b=structuredClone(base),a=structuredClone(card);delete b.training;delete a.training;
   for(const equipment of [worn,weapon,shield].filter(Boolean))for(const c of [b,a])c.selections.push({id:'context:'+equipment.id,entry:equipment,level:1,quantity:1,equipped:true,attuned:true});
   const bv=stats(api.evaluate(b)),av=stats(api.evaluate(a));if(changed(bv,av))return {kind:'calculated-equipment-context',level,edition,before:bv,after:av};
   const signature=(c:any)=>api.automaticWeaponAttacks(c,api.evaluate(c)).attacks.filter((x:any)=>x.origin.selectionId.startsWith('context:')).map((x:any)=>[x.attack_bonus,x.damage]);
   const ba=signature(b),aa=signature(a);if(changed(ba,aa))return {kind:'calculated-training',level,edition,before:ba,after:aa};
  }
 }
 return null;
}
