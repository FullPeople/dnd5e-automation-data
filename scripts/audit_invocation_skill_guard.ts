/** Bounded, read-only exact-source workflow proof for PHB Beguiling Influence.
 * Private source text, character snapshots and adapter bytes stay out of reports. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,realpathSync,writeFileSync} from 'node:fs';
import {basename,dirname,isAbsolute,join,resolve,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const [webRoot,inputRoot,output='.cache/invocation-skill-guard.json']=process.argv.slice(2);
if(!webRoot||!inputRoot)throw Error('Usage: audit_invocation_skill_guard.ts WEB_ROOT FROZEN_INPUT_ROOT [OUTPUT]');
const sourceRevision='e2623b204ddbdf2bcfa8317acfc962de89c676e2';
const expectedInputs:Record<string,string>={
 'optionalfeatures.json':'031970dfac1770a548549bd30535319c2493c47ebeaedfdb6a601651bbfc3844',
 'class/class-warlock.json':'34721a04db792923cf0a19fbab3f90616093d9f6519a7cfe6f81a9eb52e775d4',
 'spells/spells-phb.json':'e1f2221020cfb5d31995c99b78dc09435c9962476ef1cef81b52399e6df0263d',
};
const expectedEntries:Record<string,string>={
 'Beguiling Influence|PHB':'133c935633e85c878481a634c8064e96b41a8842c378c91a489f58ea3d407702',
 'Warlock|PHB':'179a4e48b79fef7ae2244e88e614d04a0828caca4a854b6f65de61b6df802385',
 'Eldritch Invocations|Warlock|PHB|2':'a482142444ed3639690525945c024d4b2476ac84bbe5e981ef3f7f0d323eaa8f',
};
const knownProgression=[0,2,2,2,3,3,4,4,5,5,5,6,6,6,7,7,7,8,8,8];
const reference='Beguiling Influence|PHB',skills=['deception','persuasion'];
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const bytesHash=(path:string)=>createHash('sha256').update(readFileSync(path)).digest('hex');
const json=(value:any)=>JSON.parse(JSON.stringify(value));
const git=(...args:string[])=>execFileSync('git',args,{cwd:webRoot,encoding:'utf8'}).trim();
function assertCleanSource(){assert.equal(git('status','--porcelain','--untracked-files=all','--ignored=matching','--','src'),'','Consumer src must be clean, including staged, untracked and ignored files');}
assertCleanSource();
const consumerRevision=git('rev-parse','HEAD'),consumerSourceTree=git('rev-parse','HEAD:src');
const producerRevision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
assert.match(consumerRevision,/^[a-f0-9]{40}$/);
const evidence=JSON.parse(readFileSync(join(webRoot,'src/core/automation/invocationEvidence.json'),'utf8'));
assert.equal(evidence.frozenRevision,sourceRevision,'Consumer source revision');
assert.deepEqual(evidence.inputs,expectedInputs,'Consumer canonical input hashes');
assert.equal(evidence.owner,'Warlock|PHB','Consumer exact class owner');
assert.equal(evidence.classFeatureReference,'魔能祈唤|魔契师|PHB|2','Consumer exact class source reference');
assert.equal(evidence.classFeatureEnglish,'Eldritch Invocations','Consumer exact class source identity');
assert.equal(evidence.classFeaturePage,105,'Consumer exact class source page');
assert.deepEqual(evidence.knownProgression,knownProgression,'Consumer exact invocation capacity');
const skillRules=evidence.rules.filter((row:any)=>row.reference===reference);
assert.equal(skillRules.length,1,'Consumer exactly one reviewed Beguiling Influence identity');
const rule=skillRules[0];
assert.deepEqual({reference:rule.reference,page:rule.page,mechanism:rule.mechanism,skills:rule.skills,spell:rule.spell,spellReference:rule.spellReference,spellLevel:rule.spellLevel,requiredClassLevel:rule.requiredClassLevel,payment:rule.payment},{reference,page:110,mechanism:'skills',skills,spell:undefined,spellReference:undefined,spellLevel:undefined,requiredClassLevel:undefined,payment:undefined},'Consumer exact skill mechanical evidence');
for(const [key,sha256] of Object.entries(expectedEntries))assert.equal(evidence.entryHashes[key],sha256,'Consumer independently reviewed entry hash '+key);
const indexPath=join(inputRoot,'index.json');
const index=existsSync(indexPath)?JSON.parse(readFileSync(indexPath,'utf8')):undefined;
const inputs:Record<string,string>={},inputFiles:Record<string,string>={};
if(index)inputFiles[indexPath]=bytesHash(indexPath);
function input(path:string){
 const rows=index?.rows?.filter((row:any)=>row.url===`https://5e.kiwee.top/data/${path}`);
 if(index)assert.equal(rows?.length,1,'Expected exactly one frozen input '+path);
 const filename=index?rows[0].path:basename(path).replace(/\.json$/,`-${sourceRevision}.json`);
 assert.equal(typeof filename,'string','Frozen filename');
 const local=resolve(inputRoot,filename);
 assert(!isAbsolute(filename)&&local.startsWith(resolve(inputRoot)+sep),'Input must remain inside frozen directory');
 assert(realpathSync(local).startsWith(realpathSync(inputRoot)+sep),'Resolved input must remain inside frozen directory');
 const body=JSON.parse(readFileSync(local,'utf8')),sha256=hash(body);
 assert.equal(sha256,expectedInputs[path],'Frozen input mismatch '+path);
 if(index)assert.equal(sha256,rows[0].sha256,'Frozen manifest mismatch '+path);
 inputs[path]=sha256;inputFiles[local]=bytesHash(local);return body;
}
const optional=input('optionalfeatures.json'),classes=input('class/class-warlock.json'),spells=input('spells/spells-phb.json');
const entryHashes:Record<string,string>={};
for(const [key,rows] of [
 [reference,optional.optionalfeature.filter((row:any)=>row.ENG_name==='Beguiling Influence'&&row.source==='PHB')],
 ['Warlock|PHB',classes.class.filter((row:any)=>row.ENG_name==='Warlock'&&row.source==='PHB')],
 ['Eldritch Invocations|Warlock|PHB|2',classes.classFeature.filter((row:any)=>row.ENG_name==='Eldritch Invocations'&&row.source==='PHB'&&row.level===2)],
] as const){assert.equal(rows.length,1,'Exact source identity '+key);entryHashes[key]=hash(rows[0]);assert.equal(entryHashes[key],expectedEntries[key],'Independent reviewed entry hash '+key);}
const raw=optional.optionalfeature.find((row:any)=>row.ENG_name==='Beguiling Influence'&&row.source==='PHB');
assert.equal(raw.page,110);assert.deepEqual(raw.featureType,['EI']);
assert.deepEqual(raw.skillProficiencies,[{deception:true,persuasion:true}]);
assert.equal(raw.prerequisite,undefined);assert.equal(raw.additionalSpells,undefined);assert.equal(raw.expertise,undefined);
const rawOwner=classes.class.find((row:any)=>row.ENG_name==='Warlock'&&row.source==='PHB');
assert.deepEqual(rawOwner.optionalfeatureProgression[0].featureType,['EI']);assert.deepEqual(rawOwner.optionalfeatureProgression[0].progression,knownProgression);
assert(rawOwner.classFeatures.includes('魔能祈唤|魔契师||2'));

mkdirSync('.cache',{recursive:true});
const adapter=resolve('.cache/invocation-skill-guard-consumer.mjs');
const exports:Record<string,string[]>={
 'src/core/model.ts':['newCharacter'],
 'src/core/automation/state.ts':['newAutomationState'],
 'src/data/catalog.ts':['normalizeData'],
 'src/core/sheet.ts':['syncFeatures','removeSelection'],
 'src/core/automation/choices.ts':['sheetChoices','setSheetChoiceSlot'],
 'src/core/automation/invocations.ts':['invocationRule','learnedInvocationRule'],
 'src/core/automation/sourceSpells.ts':['syncSourceSpells','planSourceSpells'],
 'src/core/automation/actions.ts':['spellPayments','spellActionRequest','performSpellAction'],
 'src/core/engine.ts':['evaluate'],
 'src/core/export.ts':['exportCharacter'],
 'src/core/validation.ts':['readCharacter','validateCharacter'],
};
await build({stdin:{contents:Object.entries(exports).map(([path,names])=>`export {${names.join(',')}} from ${JSON.stringify(resolve(webRoot,path))};`).join('\n'),resolveDir:resolve(webRoot),loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:adapter,define:{'import.meta.env.MODE':'"standalone"','import.meta.env.DEV':'false'}});
const api=await import(pathToFileURL(adapter).href);
const sourceBefore=hash({optional,classes,spells});
// The normalizer prepares metadata on an owned working copy; never lend it the frozen audit objects.
const entries=api.normalizeData(structuredClone({...optional,...classes,...spells}),'frozen-invocation-skill-guard');
assert.equal(hash({optional,classes,spells}),sourceBefore,'Normalization working copy must not mutate frozen source objects');
const catalogBefore=hash(entries);
const find=(kind:string,name:string)=>{const rows=entries.filter((entry:any)=>entry.kind===kind&&entry.english===name&&entry.source==='PHB');assert.equal(rows.length,1,'Unique normalized PHB entry '+name);return rows[0];};
const owner=find('class','Warlock'),entry=find('feature','Beguiling Influence'),replacement=find('feature','Eldritch Sight');
const choiceId='proof-warlock:class-optional:0',origin=`${entry.name} · PHB`;
const steps:{label:string;passed:true;manualDataPreserved:true}[]=[];
const sync=(c:any,catalog:any[]=[])=>{api.syncFeatures(c,catalog);api.syncSourceSpells(c,catalog);};
const root=(c:any)=>c.selections.find((row:any)=>row.entry.english==='Beguiling Influence'&&row.grantKey?.startsWith('choice:'));
const source=(c:any)=>c.selections.find((row:any)=>row.id===root(c)?.parentId);
const classRow=(c:any)=>c.selections.find((row:any)=>row.id==='proof-warlock');
const preserve=(c:any)=>json({abilities:c.abilities,notes:c.notes,hp:c.runtime.hp,tempHp:c.runtime.tempHp,resources:c.runtime.resources,sheetBonuses:c.sheetBonuses,skillBonuses:c.skillBonuses,proficiencies:c.proficiencies,expertise:c.expertise});
function reopen(c:any){
 const before=JSON.stringify(c),exported=json(api.exportCharacter(c)),inputBefore=JSON.stringify(exported),loaded=api.readCharacter(exported);
 assert.deepEqual(loaded.repaired,[],'Native roundtrip must not need repair');
 assert.equal(JSON.stringify(c),before,'Native export must not mutate input character');assert.equal(JSON.stringify(exported),inputBefore,'Native import must not mutate source payload');
 return loaded.character;
}
function baseCard(level=2){
 const c=api.newCharacter('2014');c.automation=api.newAutomationState();c.profile.enabledSources=['PHB'];
 c.selections=[{id:'proof-warlock',entry:structuredClone(owner),level,quantity:1,equipped:false}];
 c.abilities.cha=16;c.notes='Authored skill workflow preservation probe';c.sheetBonuses={ac:3};
 c.proficiencies={athletics:true};c.expertise={athletics:true};c.skillBonuses={athletics:1};
 c.runtime.hp=2;c.runtime.tempHp=1;c.runtime.resources={'manual-sentinel':{current:1,max:7},'pact-slot:1':{current:0,max:2}};
 sync(c,entries);return c;
}
let card=baseCard(),manual=preserve(card);
function check(label:string,fn:()=>void){try{fn();assert.deepEqual(preserve(card),manual,label+' preserves authored state');api.validateCharacter(json(card));}catch(error){throw Error(label,{cause:error});}steps.push({label,passed:true,manualDataPreserved:true});}
function derived(c:any,active:boolean){
 const before=JSON.stringify(c),d=api.evaluate(c);
 for(const skill of skills){
  const expertise=!!c.expertise?.[skill],proficient=active||expertise||!!c.proficiencies?.[skill];
  assert.equal(d.skills[skill].proficient,proficient,skill+' current proficiency');assert.equal(d.skills[skill].expertise,expertise,skill+' never gains automatic expertise');
  assert.equal(d.skills[skill].value,d.modifiers.cha+(proficient?d.proficiency*(expertise?2:1):0)+(c.skillBonuses?.[skill]||0),skill+' uses proficiency once, not an invented flat bonus');
  assert.equal(d.skills[skill].sources.filter((s:string)=>s===origin).length,active?1:0,skill+' current source provenance');
 }
 assert.equal(d.skills.athletics.expertise,true,'Independent manual expertise remains');
 assert.equal(JSON.stringify(c),before,'Evaluate must be pure');return d;
}
function noSpellAction(c:any,id:string){
 const before=JSON.stringify(c);assert.deepEqual(api.spellPayments(c,id).options,[],'Skill invocation never becomes a spell payment');
 assert.equal(api.performSpellAction(c,api.spellActionRequest(c,id,'free',`skill-reject-${steps.length}`)).status,'rejected');assert.equal(JSON.stringify(c),before,'Rejected action is transactional');
}
check('Unlearned exact option grants nothing during pure evaluation or choice planning',()=>{
 derived(card,false);const before=JSON.stringify(card),choice=api.sheetChoices(card,entries).find((row:any)=>row.id===choiceId);
 assert(choice?.options.find((row:any)=>row.value===entry.id)?.grant);api.planSourceSpells(card,entries);assert.equal(JSON.stringify(card),before);assert.equal(root(card),undefined);
});
check('Explicit class choice grants only deception and persuasion once, without expertise',()=>{
 api.setSheetChoiceSlot(card,choiceId,0,entry.id,entries);sync(card,entries);assert.equal(api.learnedInvocationRule(card,root(card))?.reference,reference);derived(card,true);
 const trained=Object.entries(api.evaluate(card).skills).filter(([,s]:any)=>s.sources.includes(origin)).map(([key])=>key).sort();assert.deepEqual(trained,[...skills].sort());
 noSpellAction(card,root(card).id);assert.equal(card.selections.filter((row:any)=>row.grantKey?.startsWith('source-spell:')).length,0);
});
const rootId=root(card).id,tree=json([root(card)]),answers=json(card.answers);
check('Native reopen and repeated offline sync retain exact learned identity and manual state',()=>{card=reopen(card);for(let i=0;i<3;i++)sync(card);derived(card,true);assert.equal(root(card).id,rootId);assert.deepEqual(json([root(card)]),tree);assert.deepEqual(json(card.answers),answers);});
const activeBaseline=structuredClone(card);
const mutations:[string,(c:any)=>void][]=[
 ['source raw English identity only',c=>{source(c).entry.raw.ENG_name='Unreviewed Feature';}],
 ['source raw source only',c=>{source(c).entry.raw.source='TCE';}],
 ['source raw edition',c=>{source(c).entry.raw.edition='one';}],
 ['source raw copy',c=>{source(c).entry.raw._copy={};}],
 ['source normalized kind',c=>{source(c).entry.kind='feat';}],
 ['source raw category',c=>{source(c).entry.raw._category='feat';}],
 ['source declared effects',c=>{source(c).entry.effects=[{op:'proficiency',skill:'intimidation'}];}],
 ['source declared choices',c=>{source(c).entry.choices=[{id:'unreviewed',label:'Unreviewed',kind:'feature',count:1,options:['intimidation']}];}],
 ['source injected raw skills',c=>{source(c).entry.raw.skillProficiencies=[{deception:true,persuasion:true,intimidation:true}];}],
 ['source injected raw effects',c=>{source(c).entry.raw.effects=[{op:'proficiency',skill:'intimidation'}];}],
 ['source injected raw choices',c=>{source(c).entry.raw.choices=[{id:'unreviewed',label:'Unreviewed',count:1,options:['intimidation']}];}],
 ['source raw level',c=>{source(c).entry.raw.level=3;}],
 ['source normalized source',c=>{source(c).entry.source='TCE';}],
 ['source normalized identity',c=>{source(c).entry.english='Unreviewed Feature';}],
 ['source owner link',c=>{source(c).parentId='unrelated-class';}],
 ['source grant key',c=>{source(c).grantKey='ref:Unreviewed|Warlock|PHB|2';}],
 ['source dismissed by owner',c=>{c.dismissedFeatures=[`proof-warlock|${source(c).grantKey}`];}],
 ['class raw English identity only',c=>{classRow(c).entry.raw.ENG_name='Other class';}],
 ['class raw source only',c=>{classRow(c).entry.raw.source='TCE';}],
 ['class normalized source',c=>{classRow(c).entry.source='TCE';}],
 ['class raw copy',c=>{classRow(c).entry.raw._copy={};}],
 ['class progression',c=>{classRow(c).entry.raw.optionalfeatureProgression[0].progression=[0,2];}],
 ['class declared source references',c=>{classRow(c).entry.raw.classFeatures=[];}],
 ['class missing ancestor',c=>{classRow(c).parentId='missing-ancestor';}],
 ['class self-cycle',c=>{classRow(c).parentId=classRow(c).id;}],
 ['class and source cycle',c=>{classRow(c).parentId=source(c).id;}],
 ['class and learned invocation cycle',c=>{classRow(c).parentId=root(c).id;}],
 ['invocation parent link',c=>{root(c).parentId='proof-warlock';}],
 ['invocation raw source',c=>{root(c).entry.raw.source='TCE';}],
 ['invocation normalized source',c=>{root(c).entry.source='TCE';}],
 ['invocation raw English identity only',c=>{root(c).entry.raw.ENG_name='Unreviewed Invocation';}],
 ['invocation normalized identity',c=>{root(c).entry.english='Unreviewed Invocation';}],
 ['invocation raw copy',c=>{root(c).entry.raw._copy={};}],
 ['invocation normalized kind',c=>{root(c).entry.kind='feat';}],
 ['invocation raw category',c=>{root(c).entry.raw._category='feat';}],
 ['invocation declared effects',c=>{root(c).entry.effects=[{op:'proficiency',skill:'intimidation'}];}],
 ['invocation declared choices',c=>{root(c).entry.choices=[{id:'unreviewed',label:'Unreviewed',kind:'feature',count:1,options:['intimidation']}];}],
 ['invocation injected raw effects',c=>{root(c).entry.raw.effects=[{op:'proficiency',skill:'intimidation'}];}],
 ['invocation erased identities with retained snapshot',c=>{const row=root(c);row.entry.english='Unreviewed Invocation';row.entry.raw.ENG_name='Unreviewed Invocation';}],
 ['invocation prerequisite',c=>{root(c).entry.raw.prerequisite=[{ability:[{cha:13}]}];}],
 ['invocation extra skill payload',c=>{root(c).entry.raw.skillProficiencies=[{deception:true,persuasion:true,intimidation:true}];}],
 ['invocation missing skill payload',c=>{delete root(c).entry.raw.skillProficiencies;}],
 ['invocation added spell payload',c=>{root(c).entry.raw.additionalSpells=[{innate:{_:['侦测魔法']}}];}],
 ['answer removed directly',c=>{c.answers[choiceId]=[];}],
 ['answer moved beyond class capacity',c=>{c.answers[choiceId]=['','',entry.id];}],
 ['source disabled',c=>{c.profile.enabledSources=[];}],
 ['owner entry disabled',c=>{c.profile.disabledEntries=[classRow(c).entry.id];}],
 ['source entry disabled',c=>{c.profile.disabledEntries=[source(c).entry.id];}],
 ['invocation entry disabled',c=>{c.profile.disabledEntries=[root(c).entry.id];}],
 ['automation disabled',c=>{c.automation.enabled=false;}],
 ['Warlock level one',c=>{classRow(c).level=1;}],
];
for(const [label,alter] of mutations)check('Immediate revocation, native reopen and offline reconciliation: '+label,()=>{
 card=structuredClone(activeBaseline);const display=source(card).entry.name;alter(card);if(label==='source raw English identity only')assert.equal(source(card).entry.name,display,'Display label is untouched');
 derived(card,false);noSpellAction(card,rootId);card=reopen(card);derived(card,false);sync(card);derived(card,false);noSpellAction(card,rootId);
 assert.equal(api.evaluate(card).skills.intimidation.proficient,false,'Forged extra skill never gains proficiency');
 assert.deepEqual(preserve(card),manual,'Tampered workflow preserves authored state before restoring fixture');
 card=structuredClone(activeBaseline);derived(card,true);
});
check('Compound source identity and progression tamper stays denied without trusting snapshots',()=>{
 card=structuredClone(activeBaseline);const parent=source(card);delete card.classChoiceSnapshots[parent.entry.id];
 parent.entry.english='Other';parent.entry.raw.ENG_name='Other';parent.entry.raw.skillProficiencies=[{deception:true}];classRow(card).entry.raw.optionalfeatureProgression[0].progression=[0,2];
 derived(card,false);card=reopen(card);derived(card,false);noSpellAction(card,rootId);assert.deepEqual(preserve(card),manual);
 // Unsupported declarations stay recorded for repair; this proof does not sync or silently repair them.
});
check('Compound erased source and invocation identity cannot escape retained automatic provenance',()=>{
 card=structuredClone(activeBaseline);const parent=source(card),learned=root(card);delete card.classChoiceSnapshots;
 parent.entry.english='Other';parent.entry.raw.ENG_name='Other';learned.entry.english='Other';learned.entry.raw.ENG_name='Other';learned.entry.kind='feat';learned.entry.raw._category='feat';learned.entry.raw.featureType=['AI'];
 derived(card,false);card=reopen(card);derived(card,false);noSpellAction(card,rootId);assert.deepEqual(preserve(card),manual);
});
for(const mode of ['source','level','automation'] as const)check('Legitimate '+mode+' restoration after archived native reopen reuses exact ID',()=>{
 card=structuredClone(activeBaseline);if(mode==='source')card.profile.enabledSources=[];if(mode==='level')classRow(card).level=1;if(mode==='automation')card.automation.enabled=false;
 derived(card,false);sync(card);derived(card,false);card=reopen(card);sync(card);derived(card,false);assert.deepEqual(json(card.answers),answers);
 card.profile.enabledSources=['PHB'];classRow(card).level=2;card.automation.enabled=true;sync(card);derived(card,true);assert.equal(root(card).id,rootId);assert.deepEqual(json([root(card)]),tree);
});
check('Correcting raw source identity before sync restores qualification without rewriting choices',()=>{
 card=structuredClone(activeBaseline);const row=source(card),original=row.entry.raw.ENG_name;row.entry.raw.ENG_name='Unreviewed Feature';derived(card,false);row.entry.raw.ENG_name=original;derived(card,true);assert.equal(root(card).id,rootId);assert.deepEqual(json(card.answers),answers);
});
check('Repairing retained source identity after archive and native reopen restores the same grant',()=>{
 card=structuredClone(activeBaseline);const sourceId=source(card).id,identity=source(card).entry.raw.ENG_name;
 source(card).entry.raw.ENG_name='Unreviewed Feature';derived(card,false);sync(card);derived(card,false);assert.equal(root(card),undefined);assert.deepEqual(json(card.classChoiceArchive[rootId].selections),tree);
 card=reopen(card);derived(card,false);const retained=card.selections.find((row:any)=>row.id===sourceId);assert(retained,'Source remains retained for explicit repair');retained.entry.raw.ENG_name=identity;
 sync(card);derived(card,true);assert.equal(root(card).id,rootId);assert.deepEqual(json(card.answers),answers);
});
for(const authored of ['proficiency','expertise','both'] as const)check('Authored same-skill '+authored+' survives revoke, archive and native import without stacking',()=>{
 card=structuredClone(activeBaseline);card.proficiencies.persuasion=true;if(authored==='proficiency'||authored==='both')card.proficiencies.deception=true;if(authored==='expertise'||authored==='both')card.expertise.deception=true;manual=preserve(card);
 derived(card,true);source(card).entry.raw.ENG_name='Unreviewed Feature';derived(card,false);card=reopen(card);derived(card,false);sync(card);derived(card,false);
 assert.deepEqual(preserve(card),manual,'Authored same-skill state remains intact before restoring fixture');
 card=structuredClone(activeBaseline);manual=preserve(card);
});
check('Saved generic skill and custom answers cannot inject extra proficiency or retain revoked grants',()=>{
 card=structuredClone(activeBaseline);const learned=root(card);
 card.answers[`${learned.id}:skills:0`]=['deception','persuasion','intimidation'];card.answers[`${learned.id}:custom:0`]=['deception','persuasion','intimidation'];
 const retainedAnswers=json(card.answers);derived(card,true);assert.equal(api.evaluate(card).skills.intimidation.proficient,false);
 source(card).entry.raw.ENG_name='Unreviewed Feature';derived(card,false);card=reopen(card);derived(card,false);sync(card);derived(card,false);assert.equal(api.evaluate(card).skills.intimidation.proficient,false);assert.deepEqual(json(card.answers),retainedAnswers);
});
check('Manual same-name invocation is retained but never launders class proficiency authority',()=>{
 card=baseCard();const manualRow={id:'manual-invocation',entry:structuredClone(entry),level:1,quantity:1,equipped:false};card.selections.push(manualRow);derived(card,false);
 assert.equal(api.learnedInvocationRule(card,manualRow),undefined);card=reopen(card);sync(card,entries);derived(card,false);assert.deepEqual(json(card.selections.find((row:any)=>row.id===manualRow.id)),manualRow);assert.equal(root(card),undefined);
 const before=JSON.stringify(card);assert.throws(()=>api.setSheetChoiceSlot(card,choiceId,0,entry.id,entries));assert.equal(JSON.stringify(card),before,'Manual same-source record cannot be adopted by learning');
});
check('Unrelated manual skill features keep their own training through invocation revocation',()=>{
 card=structuredClone(activeBaseline);
 const manualEntry={...structuredClone(entry),id:'manual-independent-feature',name:'Independent training',english:'Independent Training',raw:{name:'Independent training',ENG_name:'Independent Training',source:'PHB',_category:'feature',skillProficiencies:[{deception:true}],entries:[]}};
 const manualRow={id:'manual-independent-selection',entry:manualEntry,level:1,quantity:1,equipped:false};card.selections.push(manualRow);
 source(card).entry.raw.ENG_name='Unreviewed Feature';card=reopen(card);sync(card);
 const before=JSON.stringify(card),d=api.evaluate(card);assert.equal(d.skills.deception.proficient,true);assert.equal(d.skills.deception.expertise,false);assert.deepEqual(d.skills.deception.sources,['Independent training · PHB']);assert.equal(d.skills.persuasion.proficient,false);assert.equal(JSON.stringify(card),before);
 assert.deepEqual(json(card.selections.find((row:any)=>row.id===manualRow.id)),manualRow);
});
check('Answers and snapshots alone remain intent until explicit legitimate sync',()=>{
 card=baseCard();card.answers[choiceId]=[entry.id];card.classChoiceSnapshots={[entry.id]:structuredClone(entry)};derived(card,false);card=reopen(card);derived(card,false);
 const before=JSON.stringify(card);api.sheetChoices(card,entries);assert.equal(JSON.stringify(card),before);sync(card);derived(card,true);
});
check('Raw parent tamper cannot be laundered by refreshing choice snapshots or native export',()=>{
 card=structuredClone(activeBaseline);source(card).entry.raw.ENG_name='Unreviewed Feature';card.classChoiceSnapshots[entry.id]=structuredClone(entry);
 card=reopen(card);derived(card,false);sync(card,entries);derived(card,false);assert.equal(root(card),undefined);
});
check('Replacing learned skills revokes only source proficiency and restoration reuses identity',()=>{
 card=structuredClone(activeBaseline);api.setSheetChoiceSlot(card,choiceId,0,replacement.id,entries);derived(card,false);sync(card,entries);derived(card,false);assert.equal(root(card),undefined);
 card=reopen(card);api.setSheetChoiceSlot(card,choiceId,0,entry.id,[]);sync(card);derived(card,true);assert.equal(root(card).id,rootId);
});
check('Explicit withdrawal, reopen and relearning preserve authored data and exact grant',()=>{
 card=structuredClone(activeBaseline);api.setSheetChoiceSlot(card,choiceId,0,undefined,[]);derived(card,false);sync(card);card=reopen(card);derived(card,false);
 api.setSheetChoiceSlot(card,choiceId,0,entry.id,[]);sync(card);derived(card,true);assert.equal(root(card).id,rootId);
});
check('Removing the Warlock source removes its learned skills without modifying manual training',()=>{card=structuredClone(activeBaseline);api.removeSelection(card,'proof-warlock');derived(card,false);sync(card);derived(card,false);assert.equal(root(card),undefined);});

assert.equal(hash({optional,classes,spells}),sourceBefore,'Workflow must not mutate frozen source objects');
assert.equal(hash(entries),catalogBefore,'Workflow must not mutate normalized catalog');
for(const [path,before] of Object.entries(inputFiles))assert.equal(bytesHash(path),before,'Frozen file changed during replay');
assert.equal(git('rev-parse','HEAD'),consumerRevision,'Consumer revision changed during replay');assertCleanSource();
assert.equal(git('rev-parse','HEAD:src'),consumerSourceTree,'Consumer source tree changed during replay');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),producerRevision,'Producer revision changed during replay');
const report={schemaVersion:1,updatedAt:new Date().toISOString(),consumerRevision,consumerSourceTree,producerRevision,sourceRevision,inputs,entryHashes,
 rules:[{reference,skills,grantsExpertise:false,minimumWarlockLevel:2}],steps,
 definition:'Bounded exact-source consumer API proof for PHB Beguiling Influence qualification and authored-data preservation; not all skills, invocations, classes, browser coverage or release certification',
 manualBoundaries:['Invocation replacement timing and DM eligibility remain manual.','Skill rolls, outcomes and expertise remain manually authored.','Native export/import verifies schema and current derived qualification, not browser storage, account authority, server recovery or multiplayer delivery.'],
 browser:'not-run',currentReleaseAvailable:null};
mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,consumerRevision,consumerSourceTree,producerRevision,passed:steps.length,failed:0}));
