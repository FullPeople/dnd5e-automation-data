import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {cpSync,existsSync,mkdtempSync,readFileSync,realpathSync,statSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {afterAll,beforeAll,describe,expect,it} from 'vitest';
// A self-contained platform:node bundle must be tested by actual Node, not
// re-transformed by the Vitest host. Success or any other import error fails.
const assertNativeMissingRuntimeExport=(file:string,name:string)=>{
 const expected='Missing ordinary casting runtime export: '+name;
 const script=`try{await import(${JSON.stringify(pathToFileURL(file).href)});process.stdout.write('IMPORT_SUCCEEDED');process.exitCode=0;}catch(error){if(error instanceof Error&&error.message===${JSON.stringify(expected)}){process.stderr.write(error.message);process.exitCode=23;}else{process.stderr.write('UNEXPECTED_IMPORT_ERROR');process.exitCode=24;}}`;
 const result=spawnSync(process.execPath,['--input-type=module','-e',script],{encoding:'utf8',timeout:3500});
 expect(result.error).toBeUndefined();expect(result.status).toBe(23);expect(result.stdout).toBe('');expect(result.stderr).toBe(expected);
};

import {buildConsumerAdapter} from '../src/runtimeCoverage/adapter.ts';
import type {RuntimeAdapter} from '../src/runtimeCoverage/probe.ts';
import {probeLimitedSourceUses} from '../src/runtimeCoverage/limitedProbe.ts';
import {probeOrdinaryCasting,ordinaryProbeClasses} from '../src/runtimeCoverage/ordinaryProbe.ts';

const configuration=['RUNTIME_LIMITED_SOURCE_TESTS','RUNTIME_LIMITED_CONSUMER_ROOT','RUNTIME_LIMITED_OLD_CONSUMER_ROOT','LIMITED_SOURCE_FROZEN_DIR'];
const opted=process.env.RUNTIME_LIMITED_SOURCE_TESTS==='1';
if(!opted&&configuration.some(name=>process.env[name]!==undefined))throw Error('RUNTIME_LIMITED_SOURCE_TESTS=1 is mandatory for configured limited source tests');
const directory=(name:string)=>{const value=process.env[name];if(!value?.trim())throw Error('Required explicit directory: '+name);const path=resolve(value);if(!statSync(path).isDirectory())throw Error('Required directory: '+name);return path;};
const current=opted?directory('RUNTIME_LIMITED_CONSUMER_ROOT'):'',old=opted?directory('RUNTIME_LIMITED_OLD_CONSUMER_ROOT'):'',frozen=opted?directory('LIMITED_SOURCE_FROZEN_DIR'):'';
const digest=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const pins={
 'rewards.json':'03062ce964d2cd88be4b538bf8cbb10eb5b96dc33ab6f94720b4a1790ca30871',
 'spells/spells-phb.json':'e1f2221020cfb5d31995c99b78dc09435c9962476ef1cef81b52399e6df0263d',
 'spells/spells-xphb.json':'87e4b76595ea895e01641de2cba3d75bff590957f08a9210530c28ffa296770d',
 'spells/spells-aag.json':'3a7425c28fae9eabd41c3669b72312140a30d68c10e4d1e3404c2cb0cf26d16f',
 'class/class-wizard.json':'7533f3fb7bab70cd2d2f2b5dfb7e259dc66a2bfee24ee6ad3809042e53ba8a03',
 'https://homebrew.kiwee.top/class/Benjamin%20Huffman%3B%20%E6%8B%B3%E6%96%97%E5%A3%ABPugilist%20-%202014.json':'0593dd1ff41efae5fe35732dac306d6af94f3393f8224493e1368bb7924b3b5a',
 'https://homebrew.kiwee.top/collection/1985%20Games%3B%20%E8%83%A7%E5%BF%86%E5%B2%9B%EF%BC%9A%E8%92%BF%E9%87%8E%E7%89%A9%E8%AF%AD.json':'d53f251428233b1b8852e3044093348909b8be0ebafad30196e594a43de9a007',
 'generated/gendata-spell-source-lookup.json':'8b78d1ce68d080a760b41bc65e846755c98fa1a3916b70d3d5d0dc8f5af1b9a9'
};
const inputs=()=>{const index=JSON.parse(readFileSync(join(frozen,'index.json'),'utf8'));return Object.entries(pins).map(([path,sha256])=>{const url=path.startsWith('https:')?path:'https://5e.kiwee.top/data/'+path,rows=index.rows.filter((r:any)=>r.url===url);if(rows.length!==1||rows[0].sha256!==sha256||!/^files\/[a-f0-9]{64}\.json$/.test(rows[0].path))throw Error('Exact original limited source manifest required');const body=JSON.parse(readFileSync(join(frozen,rows[0].path),'utf8'));if(digest(body)!==sha256)throw Error('Original limited source hash mismatch');return {path,url,sha256,body};});};
const catalog=(api:RuntimeAdapter)=>{const files=inputs(),lookup=files.find(f=>f.path.startsWith('generated/'))!;return files.filter(f=>f!==lookup).flatMap(f=>{const body=structuredClone(f.body),brew=f.url.startsWith('https://homebrew.kiwee.top/');return api.normalizeCatalogData(brew?api.homebrewBody(body):body,f.sha256,brew?'kiwee-homebrew':'kiwee').map((e:any)=>api.hydrateSpellLookup(e,lookup.body,lookup.sha256));});};
let scratch:string,api:RuntimeAdapter,oldApi:RuntimeAdapter,portableOldApi:RuntimeAdapter,portableOldRoot:string,erasedOutput:string,entries:any[],oldEntries:any[];
const load=async(root:string,name:string)=>{const file=join(scratch,name+'.mjs');await buildConsumerAdapter(root,file);return import(pathToFileURL(file).href);};
const unique=(catalog:any[],english='Charm of Animal Conjuring',source='DMG')=>{const rows=catalog.filter(e=>e.kind==='feature'&&e.english===english&&e.source===source);if(rows.length!==1)throw Error('Unique source-qualified finite reward required');return rows[0];};
const fixture=(adapter=api,rows=entries)=>{const entry=unique(rows),c=adapter.newCharacter('2014');c.id='limited-data-authored';c.automation=adapter.newAutomationState();c.profile.enabledSources=['DMG','PHB','AAG'];c.notes='Authored finite bridge sentinel';c.runtime.hp=7;c.runtime.resources.manual={name:'Authored spent manual resource',max:7,current:2,locked:true};const owner={id:'limited-data-owner',entry:structuredClone(entry),level:1,quantity:1,equipped:false};c.selections.push(owner);return {c,entry,owner};};
const assertWitness=(w:any,entry:any)=>{const rule=api.limitedSourceRule(entry);expect(w?.kind).toBe('limited-source-cast');expect(Object.keys(w.before).sort()).toEqual(['entryId','initialized','resourcePresent']);expect(Object.keys(w.after).sort()).toEqual(['actionSequenceDelta','capacity','casts','duplicateUnchanged','entryId','exhausted','explicitAcquisition','genericEditsNoRefill','knownInitial','limitedSequenceDelta','manualPreserved','nativePreserved','ownerRevocationPreserved','perCastConfirmed','remaining','resourceDebit','restNoRefill','spellId']);expect(w.before).toEqual({entryId:entry.id,initialized:false,resourcePresent:false});expect(w.after.entryId===entry.id&&w.after.spellId===rule.pools[0].spellEntryId).toBe(true);expect(w.after.capacity).toBe(rule.pools[0].capacity);for(const field of ['knownInitial','casts','resourceDebit','actionSequenceDelta'])expect(w.after[field]).toBe(1);expect(w.after.limitedSequenceDelta).toBe(2);expect(w.after.remaining).toBe(0);for(const field of ['duplicateUnchanged','exhausted','explicitAcquisition','genericEditsNoRefill','manualPreserved','nativePreserved','ownerRevocationPreserved','perCastConfirmed','restNoRefill'])expect(w.after[field]).toBe(true);};

describe.skipIf(!opted)('real source-owned finite acquisition and cast accounting, not grant/effect permission',()=>{
 beforeAll(async()=>{
  scratch=mkdtempSync(join(tmpdir(),'limited-source-data-'));inputs();api=await load(current,'current');oldApi=await load(old,'old');entries=catalog(api);oldEntries=catalog(oldApi);
  // Immutable consumer fixture preparation belongs to setup, not to a timed
  // transaction. The original 5s test and 30s setup limits remain unchanged.
  portableOldRoot=join(scratch,'portable-old');cpSync(join(old,'src'),join(portableOldRoot,'src'),{recursive:true});symlinkSync(realpathSync(join(old,'node_modules')),join(portableOldRoot,'node_modules'),'dir');portableOldApi=await load(portableOldRoot,'portable-adapter');
  const erased=join(scratch,'erased-current');cpSync(join(current,'src'),join(erased,'src'),{recursive:true});symlinkSync(realpathSync(join(current,'node_modules')),join(erased,'node_modules'),'dir');const file=join(erased,'src/core/automation/limitedSourceUses.ts');writeFileSync(file,readFileSync(file,'utf8').replace('export function assertLimitedSourceResourceEdit(','function assertLimitedSourceResourceEdit(')+'\nexport type assertLimitedSourceResourceEdit={unusable:true};\n');erasedOutput=join(scratch,'erased-current.mjs');await buildConsumerAdapter(erased,erasedOutput);
 },30000);
 afterAll(()=>{if(scratch)rmSync(scratch,{recursive:true,force:true});});
 it('real DMG finite reward exposes an explicit known-balance acquisition choice instead of source tagging or automatic full uses',()=>{
  const {c,owner}=fixture(),before=digest(c),plan=api.planSourceSpells(c,entries);
  expect(plan.choices.filter((q:any)=>q.ownerId===owner.id&&q.limitedUse?.ownerId===owner.id).length).toBe(1);expect(digest(c)).toBe(before);
 });
 it('actual known1 acquisition and current child cast produce an owned exhausted persistent witness',()=>{
  const entry=unique(entries),before=digest(entries),result=probeLimitedSourceUses(api,entry,entries);
  assertWitness(result,entry);expect(digest(entries)).toBe(before);
 });
 it.each([['Charm of Animal Conjuring','XDMG'],['Charm of Air Bubbles','BAM']])('real %s/%s uses its own source-qualified pool and spell identity', (english,source)=>{const entry=unique(entries,english,source);assertWitness(probeLimitedSourceUses(api,entry,entries),entry);});
 it.each([['Charm of Restoration','DMG'],['Arcane Study Charm','XDMG']])('held %s/%s does not get an accounting/cast witness from generic source tags',(english,source)=>{const entry=unique(entries,english,source);expect(api.limitedSourceRule(entry)?.supported).toBe(false);expect(probeLimitedSourceUses(api,entry,entries)).toBeNull();});
 it('actual old source has no explicit known-balance acquisition and no new capability/witness; an equivalent no-Git root is portable',()=>{
  const f=fixture(oldApi,oldEntries),before=digest(f.c);expect(oldApi.limitedSourceCapability).toBeUndefined();expect(oldApi.planSourceSpells(f.c,oldEntries).choices.filter((q:any)=>q.limitedUse).length).toBe(0);expect(digest(f.c)).toBe(before);expect(probeLimitedSourceUses(oldApi,f.entry,oldEntries)).toBeNull();
  expect(existsSync(join(portableOldRoot,'.git'))).toBe(false);expect(portableOldApi.limitedSourceCapability).toBeUndefined();expect(probeLimitedSourceUses(portableOldApi,f.entry,oldEntries)).toBeNull();
 });
 it.each(['source','edition','pack','canonical','raw','text','copy','alias-edited'] as const)('does not turn forged %s metadata into a finite transaction',mode=>{
  const entry=structuredClone(unique(entries));if(mode==='source')entry.source='XDMG';if(mode==='edition')entry.edition='2024';if(mode==='pack')entry.packId='authored';if(mode==='canonical')entry.id=unique(entries,'Charm of Restoration').id;if(mode==='raw')entry.raw.additionalSpells=[];if(mode==='text')entry.entries=['Authored changed clause'];if(mode==='copy')entry.raw._copy={name:entry.name,source:entry.source};if(mode==='alias-edited'){entry.id='authored-alias';entry.raw.additionalSpells=[];}const before=digest(entry);expect(probeLimitedSourceUses(api,entry,entries)).toBeNull();expect(digest(entry)).toBe(before);
 });
 it('a genuine alias remains subject to its canonical disabled ID',()=>{const original=unique(entries),entry={...original,id:'authored-live-limited-alias'},wrapped={...api,newCharacter:(edition:string)=>{const c=api.newCharacter(edition);c.profile.disabledEntries=[original.id];return c;}};expect(probeLimitedSourceUses(wrapped,entry,entries)).toBeNull();});
 it.each(['acquire-noop','acquire-full','cast-noop','missing-cast-confirm','rest-refill','setter-bypass','editor-bypass','native-refill','remove-noop','readonly','locked-after-offer','source-paused'] as const)('does not publish an optimistic transaction flag: %s',mode=>{
  const entry=unique(entries),wrapped:RuntimeAdapter={...api};let called=0;
  if(mode==='acquire-noop')wrapped.performLimitedSourceUseAction=()=>({status:'applied'});
  if(mode==='acquire-full')wrapped.performLimitedSourceUseAction=(c:any,q:any,a:any)=>api.performLimitedSourceUseAction(c,{...q,intent:{...q.intent,knownRemaining:3}},a);
  if(mode==='cast-noop')wrapped.performSpellAction=()=>({status:'applied'});
  if(mode==='missing-cast-confirm')wrapped.spellActionRequest=(...args:any[])=>{const q=api.spellActionRequest(...args);delete q.limitedIntent;return q;};
  if(mode==='rest-refill')wrapped.restResources=(c:any,k:string)=>{api.restResources(c,k);for(const r of Object.values(c.runtime.resources) as any)if(r.limitedSourceUseGrant)r.current=r.max;};
  if(mode==='setter-bypass')wrapped.setResource=()=>undefined;if(mode==='editor-bypass')wrapped.assertLimitedSourceResourceEdit=()=>undefined;
  if(mode==='native-refill')wrapped.readCharacter=(v:any)=>{const r=api.readCharacter(v);for(const pool of Object.values(r.character.runtime.resources) as any)if(pool.limitedSourceUseGrant)pool.current=pool.max;return r;};
  if(mode==='remove-noop')wrapped.removeSelection=()=>undefined;
  if(['readonly','locked-after-offer','source-paused'].includes(mode))wrapped.performSpellAction=(c:any,q:any,a:any)=>{called++;if(mode==='locked-after-offer')c.runtime.resources[c.spellSettings.special[q.selectionId].sourceGrant.resourceKey].locked=true;if(mode==='source-paused')c.profile.enabledSources=[];const before=digest(c),r=api.performSpellAction(c,q,mode==='readonly'?{canEdit:false,gm:true}:a);expect(r.status).toBe('rejected');expect(digest(c)).toBe(before);return r;};
  expect(probeLimitedSourceUses(wrapped,entry,entries)).toBeNull();if(['readonly','locked-after-offer','source-paused'].includes(mode))expect(called).toBeGreaterThan(0);
 });
 it('does not cache live offer, authority, transaction or native observations',()=>{const entry=unique(entries);let calls=0;const wrapped={...api,limitedSourceUseOffers:(...args:any[])=>{calls++;return api.limitedSourceUseOffers(...args);}};assertWitness(probeLimitedSourceUses(wrapped,entry,entries),entry);const first=calls;expect(first).toBeGreaterThan(1);assertWitness(probeLimitedSourceUses(wrapped,entry,entries),entry);expect(calls).toBe(first*2);});
 it('prefilters a genuinely authenticated unsupported homebrew class before any live decoder, while native and homebrew spell controls still execute',()=>{
  const homebrew=entries.find(e=>e.kind==='class'&&e.packId==='kiwee-homebrew'),wizard=entries.find(e=>e.kind==='class'&&e.english==='Wizard'&&e.source==='PHB'),spell=entries.find(e=>e.kind==='spell'&&e.english==='Magic Missile'&&e.source==='PHB'),brewSpell=entries.find(e=>e.kind==='spell'&&e.english==='Armament'&&e.source==='OBOJIMATALLGRASS'),high=entries.find(e=>e.kind==='spell'&&e.english==='Wish'&&e.source==='PHB'),foreignList=entries.find(e=>e.kind==='spell'&&e.english==='Cure Wounds'&&e.source==='PHB');expect(!!api.ordinaryCastingRule(homebrew)).toBe(true);let live=0,sync=0;const wrapped={...api,newCharacter:(...args:any[])=>{live++;return api.newCharacter(...args);},syncFeatures:(...args:any[])=>{sync++;return api.syncFeatures(...args);}};
  expect(ordinaryProbeClasses(wrapped,[homebrew,spell]).length).toBe(0);expect(probeOrdinaryCasting(wrapped,spell,[homebrew,spell])).toBeNull();expect(live).toBe(0);
  expect(probeOrdinaryCasting(wrapped,foreignList,[wizard,foreignList])).toBeNull();expect(sync).toBe(0);
  const mutating={...wrapped,casterProfiles:(c:any)=>{c.notes='Authored invalid precheck mutation';return api.casterProfiles(c);}};expect(()=>probeOrdinaryCasting(mutating,spell,[wizard,spell])).toThrow('Ordinary casting observation mutated');expect(sync).toBe(0);
  expect(probeOrdinaryCasting(wrapped,spell,[wizard,spell])?.kind).toBe('ordinary-source-cast');expect(probeOrdinaryCasting(wrapped,brewSpell,[wizard,brewSpell])?.kind).toBe('ordinary-source-cast');expect(probeOrdinaryCasting(wrapped,high,[wizard,high])?.kind).toBe('ordinary-source-cast');expect(live).toBeGreaterThan(0);expect(sync).toBeGreaterThan(0);
 });
 it.each(['limitedSourceUseOffers','performLimitedSourceUseAction','removeSelection'] as const)('present missing %s is fatal, not an unsupported-old fallback',name=>{expect(()=>probeLimitedSourceUses({...api,[name]:undefined},unique(entries),entries)).toThrow('Missing limited source runtime export: '+name);});
 it('a type-only mandatory export must fail usable bundle import rather than disappear silently',async()=>{
  assertNativeMissingRuntimeExport(erasedOutput,'assertLimitedSourceResourceEdit');
 });
});
