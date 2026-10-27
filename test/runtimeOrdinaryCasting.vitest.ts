import {createHash} from 'node:crypto';
import {cpSync,mkdtempSync,readFileSync,statSync,rmSync,writeFileSync,existsSync,symlinkSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {afterAll,beforeAll,describe,expect,it} from 'vitest';
import {buildConsumerAdapter} from '../src/runtimeCoverage/adapter.ts';
import {probeEntry,type RuntimeAdapter} from '../src/runtimeCoverage/probe.ts';
import {probeOrdinaryCasting} from '../src/runtimeCoverage/ordinaryProbe.ts';

const oldConsumerRevision='bfdc77419b37773a1e762ab096898690e4d0fe0d';
const oldConsumerSourceTree='3637581a13ac843f65dbb5ea282716757e536a5b';
const names=['RUNTIME_ORDINARY_SOURCE_TESTS','RUNTIME_ORDINARY_CONSUMER_ROOT','RUNTIME_ORDINARY_OLD_CONSUMER_ROOT','ORDINARY_CASTING_FROZEN_DIR'] as const;
const opted=process.env.RUNTIME_ORDINARY_SOURCE_TESTS==='1';
if(!opted&&names.some(name=>process.env[name]!==undefined))throw Error('RUNTIME_ORDINARY_SOURCE_TESTS=1 is mandatory for configured ordinary source tests');
const directory=(name:string)=>{const value=process.env[name];if(!value?.trim())throw Error('Required explicit directory: '+name);const path=resolve(value);if(!statSync(path).isDirectory())throw Error('Required directory: '+name);return path;};
const current=opted?directory('RUNTIME_ORDINARY_CONSUMER_ROOT'):'';
const old=opted?directory('RUNTIME_ORDINARY_OLD_CONSUMER_ROOT'):'';
const frozen=opted?directory('ORDINARY_CASTING_FROZEN_DIR'):'';
const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const pins={
 'https://5e.kiwee.top/data/class/class-wizard.json':'7533f3fb7bab70cd2d2f2b5dfb7e259dc66a2bfee24ee6ad3809042e53ba8a03',
 'https://5e.kiwee.top/data/class/class-sorcerer.json':'cc1c7c87b28903114e98310b00f6c820541a6f3458bd67e6badb79b014e4c670',
 'https://5e.kiwee.top/data/class/class-warlock.json':'34721a04db792923cf0a19fbab3f90616093d9f6519a7cfe6f81a9eb52e775d4',
 'https://5e.kiwee.top/data/spells/spells-phb.json':'e1f2221020cfb5d31995c99b78dc09435c9962476ef1cef81b52399e6df0263d',
 'https://5e.kiwee.top/data/spells/spells-xphb.json':'87e4b76595ea895e01641de2cba3d75bff590957f08a9210530c28ffa296770d',
 'https://5e.kiwee.top/data/generated/gendata-spell-source-lookup.json':'8b78d1ce68d080a760b41bc65e846755c98fa1a3916b70d3d5d0dc8f5af1b9a9',
 'https://homebrew.kiwee.top/collection/1985%20Games%3B%20%E8%83%A7%E5%BF%86%E5%B2%9B%EF%BC%9A%E8%92%BF%E9%87%8E%E7%89%A9%E8%AF%AD.json':'d53f251428233b1b8852e3044093348909b8be0ebafad30196e594a43de9a007'
} as const;
let scratch:string,api:RuntimeAdapter,oldApi:RuntimeAdapter,entries:any[],oldEntries:any[];
const input=()=>{const index=JSON.parse(readFileSync(join(frozen,'index.json'),'utf8'));return Object.entries(pins).map(([url,sha256])=>{const rows=index.rows.filter((row:any)=>row.url===url);if(rows.length!==1||rows[0].sha256!==sha256||!/^files\/[a-f0-9]{64}\.json$/.test(rows[0].path))throw Error('Exact original source manifest required: '+url);const body=JSON.parse(readFileSync(join(frozen,rows[0].path),'utf8'));if(digest(body)!==sha256)throw Error('Original source hash mismatch: '+url);return {url,sha256,body};});};
const catalog=(adapter:RuntimeAdapter)=>{const files=input(),lookup=files.find(file=>file.url.endsWith('/gendata-spell-source-lookup.json'))!;return files.filter(file=>file!==lookup).flatMap(file=>{const brew=file.url.startsWith('https://homebrew.kiwee.top/'),body=structuredClone(file.body);return adapter.normalizeCatalogData(brew?adapter.homebrewBody(body):body,file.sha256,brew?'kiwee-homebrew':'kiwee').map((entry:any)=>adapter.hydrateSpellLookup?adapter.hydrateSpellLookup(entry,lookup.body,lookup.sha256):entry);});};
const unique=(rows:any[],kind:string,english:string,source='PHB')=>{const found=rows.filter(entry=>entry.kind===kind&&entry.english===english&&entry.source===source);if(found.length!==1)throw Error('Unique real source entry required: '+kind+'/'+english+'/'+source);return found[0];};
const load=async(root:string,name:string)=>{const file=join(scratch,name+'.mjs');await buildConsumerAdapter(root,file);return import(pathToFileURL(file).href);};
const pair=(caster='Wizard',english='Magic Missile',source='PHB')=>{const spell=unique(entries,'spell',english,source),cls=unique(entries,'class',caster,source==='XPHB'?'XPHB':'PHB');return {spell,cls,catalog:[cls,spell]};};
const assertWitness=(result:any,spell:any,cls:any)=>{
 expect(result?.kind).toBe('ordinary-source-cast');expect(result.edition).toBe(spell.edition);expect(result.level).toBe(20);
 expect(Object.keys(result.before).sort()).toEqual(['classId','ready','remaining','spellId']);
 expect(Object.keys(result.after).sort()).toEqual(['castLevel','casts','classId','duplicateUnchanged','exhausted','manualPreserved','nativePreserved','remaining','resourceDebit','sequenceDelta','spellId','spellLevel']);
 expect(result.before.spellId===spell.id&&result.before.classId===cls.id&&result.before.ready===true).toBe(true);
 expect(result.after.spellId===spell.id&&result.after.classId===cls.id).toBe(true);expect(result.after.spellLevel).toBe(spell.raw.level);
 const free=spell.raw.level===0;expect(result.before.remaining).toBe(free?0:4);expect(result.after.casts).toBe(free?1:result.before.remaining);
 expect(result.after.remaining).toBe(0);expect(result.after.resourceDebit).toBe(free?0:result.before.remaining);expect(result.after.sequenceDelta).toBe(result.after.casts);
 for(const key of ['duplicateUnchanged','nativePreserved','manualPreserved'])expect(result.after[key]).toBe(true);expect(result.after.exhausted).toBe(!free);
};

describe.skipIf(!opted)('ordinary casting real-source transaction bridge, not spell-effect completion',()=>{
 beforeAll(async()=>{scratch=mkdtempSync(join(tmpdir(),'ordinary-cast-data-'));input();api=await load(current,'current');oldApi=await load(old,'old');entries=catalog(api);oldEntries=catalog(oldApi);},30000);
 afterAll(()=>{if(scratch)rmSync(scratch,{recursive:true,force:true});});
 it('real PHB Magic Missile obtains an owned ready allocation and an actual ordinary transaction witness',()=>{
  const spell=unique(entries,'spell','Magic Missile'),wizard=unique(entries,'class','Wizard');
  const before=digest(entries),result=probeEntry(api,spell,[wizard,spell],[]);
  assertWitness(result,spell,wizard);expect(digest(entries)).toBe(before);
 });
 it.each([
  ['Sorcerer','Magic Missile','PHB'],['Warlock','Armor of Agathys','PHB'],['Wizard','Fire Bolt','PHB'],['Wizard','Magic Missile','XPHB'],['Wizard','Armament','OBOJIMATALLGRASS']
 ])('real %s/%s/%s uses actual known/cantrip/prepared ownership and paid/free action', (caster,english,source)=>{
  const {spell,cls,catalog}=pair(caster,english,source),before=digest(catalog),result=probeOrdinaryCasting(api,spell,catalog);assertWitness(result,spell,cls);expect(digest(catalog)).toBe(before);
 });
 it('old explicit root and an equivalent no-Git copy have no capability or ordinary witness, not editing-security acceptance',async()=>{
  expect(oldConsumerRevision).toMatch(/^[a-f0-9]{40}$/);expect(oldConsumerSourceTree).toMatch(/^[a-f0-9]{40}$/);
  expect(oldApi.ordinaryCastingCapability).toBeUndefined();
  const spell=unique(oldEntries,'spell','Magic Missile'),cls=unique(oldEntries,'class','Wizard');expect(probeEntry(oldApi,spell,[cls,spell],[])).toBeNull();
  const portable=join(scratch,'portable-old');cpSync(join(old,'src'),join(portable,'src'),{recursive:true});symlinkSync(realpathSync(join(old,'node_modules')),join(portable,'node_modules'),'dir');expect(existsSync(join(portable,'.git'))).toBe(false);
  const portableApi=await load(portable,'portable-old-adapter');expect(portableApi.ordinaryCastingCapability).toBeUndefined();expect(probeEntry(portableApi,spell,[cls,spell],[])).toBeNull();
 });
 it('exports the actual shared primary/homebrew helper and audit-facing hydrated snapshots, without touching source input',()=>{
  expect(api.ordinaryCastingCapability).toBe(1);expect(typeof api.hydrateSpellLookup).toBe('function');
  const files=input(),lookup=files.find(f=>f.url.endsWith('/gendata-spell-source-lookup.json'))!,before=digest(files);
  for(const file of files.filter(f=>f!==lookup)){
   const brew=file.url.startsWith('https://homebrew.kiwee.top/'),body=structuredClone(file.body),normalized=api.normalizeCatalogData(brew?api.homebrewBody(body):body,file.sha256,brew?'kiwee-homebrew':'kiwee');
   for(const spell of normalized.filter((entry:any)=>entry.kind==='spell')){
    const snapshot=digest(spell),row=lookup.body[spell.source.toLowerCase()]?.[spell.name.toLowerCase()]||lookup.body[spell.source.toLowerCase()]?.[spell.english.toLowerCase()],value=api.hydrateSpellLookup(spell,lookup.body,lookup.sha256),actual=entries.find(e=>e.id===spell.id);
    expect(value.raw._spellClassLookupLoaded).toBe(!!row);expect(digest(actual)).toBe(digest(value));expect(digest(spell)).toBe(snapshot);
   }
  }
  expect(digest(files)).toBe(before);
 });
 it.each(['source','edition','pack','kind','canonical','raw','text','alias-edited','copy'] as const)('does not emit a source witness for a forged %s',mode=>{
  const {spell,cls}=pair(),changed=structuredClone(spell);if(mode==='source')changed.source='XPHB';if(mode==='edition')changed.edition='2024';if(mode==='pack')changed.packId='authored';if(mode==='kind')changed.kind='item';if(mode==='canonical')changed.id=unique(entries,'spell','Fire Bolt').id;if(mode==='raw')changed.raw.level=9;if(mode==='text')changed.entries=['authored changed text'];if(mode==='alias-edited'){changed.id='authored-live-alias';changed.raw.level=9;}if(mode==='copy')changed.raw._copy={name:spell.name,source:spell.source};
  const before=digest([changed,cls]);expect(probeOrdinaryCasting(api,changed,[cls,changed])).toBeNull();expect(digest([changed,cls])).toBe(before);
 });
 it('authenticates a live exact alias without broadening canonical ownership',()=>{const {spell,cls}=pair(),alias={...spell,id:'authored-live-alias'};expect(probeOrdinaryCasting(api,alias,[cls,alias])?.kind).toBe('ordinary-source-cast');});
 it.each(['spell','alias-canonical','class'] as const)('retains current explicit disabled-ID authority for %s',mode=>{
  const {spell,cls}=pair(),entry=mode==='alias-canonical'?{...spell,id:'authored-live-alias'}:spell;
  const wrapped={...api,newCharacter:(edition:string)=>{const c=api.newCharacter(edition);c.profile.disabledEntries=[mode==='class'?cls.id:spell.id];return c;}};
  expect(probeOrdinaryCasting(wrapped,entry,[cls,entry])).toBeNull();
 });
 it.each(['offer-held','allocation-noop','ready-only','cast-noop','receipt-corrupt','duplicate-mutates','exhaustion-applies','native-refill','native-drop','manual-mutates','unrelated-selection-mutates','manual-pool','mirror-corrupt','readonly','locked-after-offer','stale-after-offer','source-paused'] as const)('requires the real workflow rather than a false witness: %s',mode=>{
  const {spell,cls,catalog}=pair(),wrapped:RuntimeAdapter={...api};let touched=0;
  if(mode==='offer-held')wrapped.ordinarySpellOffer=()=>({options:[],casters:[]});
  if(mode==='allocation-noop')wrapped.prepareSpellEntry=()=>undefined;
  if(mode==='ready-only'){wrapped.prepareSpellEntry=(c:any,e:any)=>{c.selections.push({id:'unowned',entry:structuredClone(e),level:1,quantity:1,equipped:false});return 'unowned';};wrapped.spellIsReady=()=>true;}
  if(['cast-noop','receipt-corrupt','duplicate-mutates','exhaustion-applies','manual-mutates','unrelated-selection-mutates','readonly','locked-after-offer','stale-after-offer','source-paused'].includes(mode))wrapped.performSpellAction=(c:any,q:any,a:any)=>{
   touched++;if(mode==='cast-noop')return {status:'applied',receipt:{id:q.id,sequence:q.sequence,selectionId:q.selectionId,mode:'cast',level:1}};
   if(mode==='readonly'){const before=digest(c),r=api.performSpellAction(c,q,{canEdit:false,gm:true});expect(digest(c)).toBe(before);return r;}
   if(mode==='locked-after-offer'){const key=q.paymentId.slice('ordinary:'.length);c.runtime.resources[key].locked=true;const before=digest(c),r=api.performSpellAction(c,q,a);expect(digest(c)).toBe(before);return r;}
   if(mode==='stale-after-offer'){c.revision++;const before=digest(c),r=api.performSpellAction(c,q,a);expect(digest(c)).toBe(before);return r;}
   if(mode==='source-paused'){c.profile.enabledSources=[];const before=digest(c),r=api.performSpellAction(c,q,a);expect(digest(c)).toBe(before);return r;}
   const r=api.performSpellAction(c,q,a);
   if(mode==='receipt-corrupt'&&r.status==='applied')return {...r,receipt:{...r.receipt,sequence:999}};
   if(mode==='duplicate-mutates'&&r.status==='duplicate')c.notes='authored corrupt duplicate';
   if(mode==='manual-mutates'&&r.status==='applied')c.runtime.resources['ordinary-audit-manual'].current++;
   if(mode==='unrelated-selection-mutates'&&r.status==='applied')c.selections.push({id:'unrelated-authored',entry:{...spell,id:'authored'},level:1,quantity:1,equipped:false});
   if(mode==='exhaustion-applies'&&r.status==='rejected')return {status:'applied'};return r;
  };
  if(['native-refill','manual-pool','mirror-corrupt'].includes(mode))wrapped.syncAutoResources=(c:any)=>{const r=api.syncAutoResources(c);if(mode==='native-refill'&&c.runtime.automationActions)for(const [id,pool] of Object.entries(c.runtime.resources) as any)if(id.startsWith('spell-slot:'))pool.current=pool.max;if(mode==='manual-pool')for(const [id,pool] of Object.entries(c.runtime.resources) as any)if(id.startsWith('spell-slot:'))pool.automatic=false;if(mode==='mirror-corrupt')for(const slot of Object.values(c.spellSettings?.slots||{}) as any)slot.used=1;return r;};
  if(mode==='native-drop')wrapped.readCharacter=(v:any)=>{const r=api.readCharacter(v);delete r.character.runtime.automationActions;return r;};
  const before=digest(catalog);expect(probeOrdinaryCasting(wrapped,spell,catalog)).toBeNull();expect(digest(catalog)).toBe(before);
  if(['cast-noop','receipt-corrupt','duplicate-mutates','exhaustion-applies','manual-mutates','unrelated-selection-mutates','readonly','locked-after-offer','stale-after-offer','source-paused'].includes(mode))expect(touched).toBeGreaterThan(0);
 });
 it('does not fall back to a special/source/ritual option when ordinary options are absent',()=>{const {spell,catalog}=pair();const wrapped={...api,ordinarySpellOffer:()=>({options:[],casters:[]}),spellPayments:()=>({options:[{id:'book-ritual:authored',available:true,level:1,cost:0}]})};expect(probeOrdinaryCasting(wrapped,spell,catalog)).toBeNull();});
 it('never caches live offers/readiness/actions/native observations',()=>{const {spell,catalog}=pair();let calls=0;const wrapped={...api,ordinarySpellOffer:(...args:any[])=>{calls++;return api.ordinarySpellOffer(...args);}};expect(probeOrdinaryCasting(wrapped,spell,catalog)?.kind).toBe('ordinary-source-cast');const first=calls;expect(first).toBeGreaterThan(4);expect(probeOrdinaryCasting(wrapped,spell,catalog)?.kind).toBe('ordinary-source-cast');expect(calls).toBe(first*2);});
 it.each(['ordinarySpellOffer','performSpellAction','readCharacter'] as const)('present runtime with missing %s is a hard error, not old absence',name=>{const {spell,catalog}=pair();expect(()=>probeOrdinaryCasting({...api,[name]:undefined},spell,catalog)).toThrow('Missing ordinary casting runtime export: '+name);});
 it('rejects a present broken module at the usable bundled-import boundary',async()=>{
  const broken=join(scratch,'broken-runtime');cpSync(join(current,'src'),join(broken,'src'),{recursive:true});symlinkSync(realpathSync(join(current,'node_modules')),join(broken,'node_modules'),'dir');
  const file=join(broken,'src/core/automation/ordinarySpellCasting.ts');writeFileSync(file,readFileSync(file,'utf8').replace('export function ordinarySpellOffer(','function ordinarySpellOffer('));
  await expect(load(broken,'broken-adapter')).rejects.toThrow(/ordinarySpellOffer|Missing ordinary casting runtime export/);
 });
 it('hard-fails usable import when esbuild erases a mandatory type-only export, without a second module load',async()=>{
  const broken=join(scratch,'erased-runtime');cpSync(join(current,'src'),join(broken,'src'),{recursive:true});symlinkSync(realpathSync(join(current,'node_modules')),join(broken,'node_modules'),'dir');
  const file=join(broken,'src/core/validation.ts');writeFileSync(file,readFileSync(file,'utf8').replace('export function readCharacter(','function readCharacter(')+'\nexport type readCharacter={unusable:true};\n');
  const output=join(scratch,'erased-adapter.mjs');await buildConsumerAdapter(broken,output);
  await expect(import(pathToFileURL(output).href)).rejects.toThrow('Missing ordinary casting runtime export: readCharacter');
 });
});
