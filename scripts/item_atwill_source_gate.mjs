import {readFileSync,writeFileSync,mkdirSync,existsSync,realpathSync,lstatSync,mkdtempSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';

export const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const CURRENT='fd8aaf9045e22f08668c0c0367399a016c28b896', CURRENT_TREE='5b8d1ceee8c7c1424cce73c18b8005423d433309';
export const OLD='4069886e1bfcab2fb7e2958eca8919601a13dd62', OLD_TREE='03d4ab4759597059e6d501a5dcec911f65c6ef30';
export const ORIGINAL_REPORT_CONSUMER='b05e77ef248325e116a68106cfa140483138d858';
export const REPORT_SHA='cc6694329697a250bbf95b71a491705d8588069ef44854bc6b5f016cfe4685c8';
export const PINS=Object.freeze({
 'items-base.json':'8933a3e70e47aa4fd6196bd7f1f2e3a57d6d8dbe7e781d37bb6a0519d7c4ffff',
 'items.json':'883f7bb4df2eb35fb37e7caa3a8765e0209014caa360d1c0358daa6f4b2da488',
 'magicvariants.json':'4a4b0f3c8b268d8b134386f16e705df9b14d60419b2f2fa160da45b78bd4967d',
 'spells/spells-phb.json':'e1f2221020cfb5d31995c99b78dc09435c9962476ef1cef81b52399e6df0263d',
 'spells/spells-xphb.json':'87e4b76595ea895e01641de2cba3d75bff590957f08a9210530c28ffa296770d',
 'generated/gendata-spell-source-lookup.json':'8b78d1ce68d080a760b41bc65e846755c98fa1a3916b70d3d5d0dc8f5af1b9a9'
});
export const SOURCE_FILES=Object.freeze({
  "src/runtimeCoverage/adapter.ts": "09715848c21f9cc35004c712ed5f334a8a0c7ffbcc6997ba318da0c2c9cf8db5",
  "src/runtimeCoverage/probe.ts": "942eb3a2b8108c7423bcc644cd02754946c2f1564e836c17731d52af64d7e119",
  "src/runtimeCoverage/report.ts": "2c8f910b5a61acdfad3e52ae9fd4fbae95c4fbe6ade6a08b98e013356acbc474",
  "src/runtimeCoverage/itemAtWillProbe.ts": "a0746e37fbbad337006e6e1f47cc6aeac2b2631ef63a8b39115b6bdcb2744819",
  "scripts/audit_runtime_coverage.ts": "23f195e83faaa3e1ca6938fb9c2566f1fc5d3b839ea54ec4a4abd1556e50472a",
  "test/runtimeItemAtWill.vitest.ts": "659d7aa48fe2451f490df535ca29fdb48b4fa8cc910df18f0d5aa8ab2f6eacb4",
  "test/runtimeItemAtWillWitnessContract.vitest.ts": "ce3773b8c98271dba96ad75510a463d45897cbf657f1d0dbe2d342920ec0b807",
  "test/helpers/itemAtWillSource.ts": "9ea4d353608dc250be4d4b94efe6655fc3416916e2b8def6f3720ba7339151b6",
  "test/helpers/streamingJsonHash.ts": "66b7aa0341d17f135820c85b69e9c17f85d5a6f714f9f89a3686781afcdbbfb2",
  "test/streamingCatalogHash.test.ts": "ce97ea79e93a9793cc95428dfb954c3bcb19a2e87d5561e989538ab8ebc601eb"
});
const CURRENT_FILES=Object.freeze({
 'package.json':'dc7334404f7417cb469be7a1e86d0861431c228334d5971373dcab686a780faf',
 'package-lock.json':'e4eaa83a394c731a3772466be039cfe7742b144a4e3af8221ceb73e64a6e115f',
 'tools/fetchReviewedAlertCorpus.mjs':'13efb98da23086fb877e178b9f73a96deef9168da4425896695ee2c482afe2ad',
 'tools/reviewedAlertCorpusSources.json':'71c389aefe85d09d23808eb364a0225b775dd2780f1d2200a54c43f51c81754b',
 'src/core/automation/itemAtWill.ts':'b8f854ac90f0c5358122eefc8fd5c2d684cbb10e9919c02138baebd16afdcbb5',
 'src/core/automation/itemAtWillEvidence.json':'cede7fb2b54e08b022171705bdad8133d5959a6e6f64b2c657a099bc9deb17a7',
 'src/core/automation/actions.ts':'64b8e9201569401aa5cde46256f632214623b37754a47c00146c2e1ad2eab5ec'
});
const UNCHANGED=['src/data/catalog.ts','src/data/catalogNormalizer.ts','src/data/adapt.ts','src/data/expand.ts','src/data/spellLookup.ts','src/core/sourceCorrections.ts','src/core/proficiencyText.ts'];
export const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=code=>{throw Error('ITEM_ATWILL_GATE_'+code);};
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const hashFile=(root,path,expected)=>{if(sha(readFileSync(join(root,path)))!==expected)fail('FILE_HASH');};
const DEPENDENCIES=Object.freeze({
 vitest:{version:'4.0.18',integrity:'sha512-hOQuK7h0FGKgBAas7v0mSAsnvrIgAvWmRFjmzpJ7SwFHH3g1k2u37JtYwOwmEKhK6ZO3v9ggDBBm0La1LCK4uQ==',files:{'package.json':'d83c63a3391f403a6dce4793c90e9d9d02faf113c7ed8d77b424e59f48ef8328','vitest.mjs':'39db22f579acf5639bbb17a261408debbde03f4692c0c439e77e7f13aeba74d6'}},
 esbuild:{version:'0.28.2',integrity:'sha512-HKVLS8dvII+xoKW9kmqxbRKrnWEXfJJr/FZhhJmiqIB0e053QNYFqOBouTMO/k5sID4MvCiUCvv8b9M4h32wIA==',files:{'package.json':'9d0bc453f4e791553c4cc2298ba023b409241fd9801e494741666eb0f6051490','lib/main.js':'61ec0ba144ff93f4bf0e96ad6fab6f430ede0aa13e27ace8063ed63ba416b3cd'}},
 idb:{version:'8.0.3',integrity:'sha512-LtwtVyVYO5BqRvcsKuB2iUMnHwPVByPCXFXOpuU96IZPPoPN6xjOGxZQ74pgSVVLQWtUOYgyeL4GE98BY5D3wg==',files:{'package.json':'de27a90ed57e80ba48275b631ddd889b8f19d72a3a3a65de42c3daee71548269','build/index.js':'b6720d6ed812254ba61009ea6b3de8bbf46a4fb5c2d5b65385c7525d18f4c80b','build/index.cjs':'76ebce4e677107d3dc925a80487e3932858d07661fb7fb65a7301dc3956ca121'}}
});
export function verifyLockedDependencies(currentRoot,oldRoot,root=ROOT){
 const found={};
 for(const [owner,names] of [[root,['vitest','esbuild']],[currentRoot,['idb']]]){
  const lock=JSON.parse(readFileSync(join(owner,'package-lock.json'))),require=createRequire(join(owner,'package.json'));
  for(const name of names){
   const expected=DEPENDENCIES[name],row=lock.packages?.['node_modules/'+name];
   if(!row||row.version!==expected.version||row.integrity!==expected.integrity||row.resolved!==`https://registry.npmjs.org/${name}/-/${name}-${expected.version}.tgz`)fail('DEPENDENCY_LOCK');
   let directory,pkg,entry;try{directory=realpathSync(join(owner,'node_modules',name));pkg=realpathSync(require.resolve(name+'/package.json'));entry=realpathSync(require.resolve(name));}catch{fail('LOCKED_DEPENDENCY');}
   if(pkg!==join(directory,'package.json'))fail('DEPENDENCY_RESOLUTION');
   const installed=JSON.parse(readFileSync(pkg));if(installed.name!==name||installed.version!==row.version)fail('DEPENDENCY_VERSION');
   for(const [path,hash] of Object.entries(expected.files))hashFile(directory,path,hash);
   const expectedEntry=name==='idb'?'build/index.cjs':name==='esbuild'?'lib/main.js':'index.cjs';
   if(entry!==join(directory,expectedEntry))fail('DEPENDENCY_RESOLUTION');
   if(name==='vitest'&&realpathSync(join(root,'node_modules/vitest/vitest.mjs'))!==join(directory,'vitest.mjs'))fail('DEPENDENCY_RESOLUTION');
   found[name]={directory,entry,version:row.version,integrity:row.integrity};
  }
 }
 const oldModules=join(oldRoot,'node_modules');if(!lstatSync(oldModules).isSymbolicLink()||realpathSync(oldModules)!==realpathSync(join(currentRoot,'node_modules')))fail('OLD_DEPENDENCY_LINK');
 return found;
}
export async function verifyBundlerResolution(currentRoot,oldRoot,root=ROOT){
 const found=verifyLockedDependencies(currentRoot,oldRoot,root),esbuild=await import(pathToFileURL(found.esbuild.entry).href);
 if(esbuild.version!==DEPENDENCIES.esbuild.version)fail('BUNDLER_VERSION');
 // This compile-only smoke uses the same producer compiler and consumer
 // resolveDir as the immutable adapter. It executes no catalog or source test.
 const result=await esbuild.build({stdin:{contents:'export {openDB} from "idb";',resolveDir:currentRoot,loader:'ts'},bundle:true,platform:'node',format:'esm',write:false,metafile:true,logLevel:'silent'});
 const inputs=Object.keys(result.metafile.inputs).filter(path=>path!=='<stdin>').map(path=>realpathSync(resolve(path)));
 if(inputs.length!==1||inputs[0]!==join(found.idb.directory,'build/index.js'))fail('BUNDLER_RESOLUTION');
 return {producerVitestVersion:found.vitest.version,producerEsbuildVersion:found.esbuild.version,consumerIdbVersion:found.idb.version,consumerIdbIntegrity:found.idb.integrity,consumerIdbEsmSha256:DEPENDENCIES.idb.files['build/index.js'],consumerIdbCjsSha256:DEPENDENCIES.idb.files['build/index.cjs'],actualBundlerResolutionVerified:true};
}
export function parseArgs(args){
 const flags={'--current-root':'currentRoot','--old-root':'oldRoot','--output':'output','--receipt':'receipt','--result':'result'},out={};
 for(let i=0;i<args.length;i+=2){const key=flags[args[i]],value=args[i+1];if(!key||!value||value.startsWith('-')||out[key])fail('ARGUMENT');out[key]=value;}
 if(Object.keys(out).length!==5)fail('ARGUMENT');return out;
}
export function validatePaths(options,root=ROOT){
 const out=Object.fromEntries(Object.entries(options).map(([k,v])=>[k,resolve(root,v)]));
 const expected={currentRoot:'.cache/item-atwill-web-current',oldRoot:'.cache/item-atwill-web-old',output:'.cache/item-atwill-six',receipt:'item-atwill-source-evidence/six-inputs.json',result:'item-atwill-source-evidence/gate.json'};
 for(const [key,value] of Object.entries(expected))if(out[key]!==resolve(root,value))fail('PATH');
 // Existing symlinks must never redirect writes or source verification outside
 // these exact isolated checkout/cache/evidence paths.
 for(const path of Object.values(out)){
  let cursor=path;while(cursor!==root){if(existsSync(cursor)&&lstatSync(cursor).isSymbolicLink())fail('PATH_SYMLINK');const next=dirname(cursor);if(next===cursor)fail('PATH');cursor=next;}
 }
 return out;
}
export function verifyCheckouts(options,{root=ROOT,git=(directory,args)=>execFileSync('git',['--no-replace-objects','--no-optional-locks','-C',directory,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim(),dependencies=true}={}){
 const p=validatePaths(options,root);
 for(const [directory,revision,tree] of [[p.currentRoot,CURRENT,CURRENT_TREE],[p.oldRoot,OLD,OLD_TREE]]){
  if(git(directory,['rev-parse','HEAD'])!==revision||git(directory,['rev-parse','HEAD:src'])!==tree)fail('CONSUMER_REVISION');
  git(directory,['diff','--quiet','HEAD','--','src','package.json','package-lock.json','tools/fetchReviewedAlertCorpus.mjs','tools/reviewedAlertCorpusSources.json']);
 }
 for(const [path,hash] of Object.entries(SOURCE_FILES))hashFile(root,path,hash);
 hashFile(root,'package.json','cbe1b37d3c088094a7bb6dad69ab14555a6338029f54409f5c965d60879383b2');
 hashFile(root,'package-lock.json','a92f3cb812676b4c7be27ec589fd0c7489402578b5c524873f38c10e9f1c587a');
 for(const [path,hash] of Object.entries(CURRENT_FILES))hashFile(p.currentRoot,path,hash);
 hashFile(p.oldRoot,'package-lock.json',CURRENT_FILES['package-lock.json']);
 for(const path of UNCHANGED)if(!readFileSync(join(p.currentRoot,path)).equals(readFileSync(join(p.oldRoot,path))))fail('OLD_MODULE');
 if(existsSync(join(p.oldRoot,'src/core/automation/itemAtWill.ts')))fail('OLD_CAPABILITY');
 if(dependencies)verifyLockedDependencies(p.currentRoot,p.oldRoot,root);
 return p;
}
export function selectPins(rows){
 if(!Array.isArray(rows)||rows.length!==229)fail('MAPPING_COUNT');
 const selected=Object.entries(PINS).map(([path,hash])=>{const url='https://5e.kiwee.top/data/'+path,matches=rows.filter(row=>row?.url===url);if(matches.length!==1||matches[0].sha256!==hash)fail('ORIGINAL_PIN');return matches[0];});
 if(new Set(selected.map(r=>r.url)).size!==6)fail('ORIGINAL_PIN');return selected;
}
export async function loadMetadata(currentRoot,root=ROOT){
 const bytes=readFileSync(join(root,'reports/progress/runtime-coverage.json'));if(sha(bytes)!==REPORT_SHA)fail('REPORT_HASH');
 const report=JSON.parse(bytes);if(report.consumer?.revision!==ORIGINAL_REPORT_CONSUMER)fail('ORIGINAL_REPORT_CONSUMER');
 const api=await import(pathToFileURL(join(currentRoot,'tools/fetchReviewedAlertCorpus.mjs')).href);
 const inputs=api.validateInputs(report.inputs),rows=api.validateMapping(api.readMapping(),inputs);
 return {api,rows:selectPins(rows)};
}
export function verifySixIndex(output){
 if(lstatSync(output).isSymbolicLink()||lstatSync(join(output,'files')).isSymbolicLink()||lstatSync(join(output,'index.json')).isSymbolicLink())fail('INDEX');
 const index=JSON.parse(readFileSync(join(output,'index.json'),'utf8'));
 if(!index||Object.keys(index).length!==1||!Array.isArray(index.rows)||index.rows.length!==6)fail('INDEX');
 const expected=Object.entries(PINS).map(([path,sha256])=>({url:'https://5e.kiwee.top/data/'+path,sha256,path:`files/${sha256}.json`}));
 if(!equal(index.rows,expected))fail('INDEX');
 for(const row of index.rows){const file=join(output,row.path);if(lstatSync(file).isSymbolicLink()||sha(Buffer.from(JSON.stringify(JSON.parse(readFileSync(file,'utf8')))))!==row.sha256)fail('BODY_HASH');}
 return index.rows;
}
export function sixReceipt(rows,stats){
 if(!Array.isArray(rows)||rows.length!==6||!Object.entries(PINS).every(([path,hash],i)=>rows[i]?.url==='https://5e.kiwee.top/data/'+path&&rows[i]?.sha256===hash))fail('RECEIPT_PIN');
 if(rows.length!==6||!Number.isSafeInteger(stats.reusedInputs)||!Number.isSafeInteger(stats.downloadedInputs)||stats.reusedInputs<0||stats.downloadedInputs<0||stats.reusedInputs+stats.downloadedInputs!==6)fail('RECEIPT');
 return {schemaVersion:1,kind:'item-atwill-six-input-technical-receipt',verified:true,validatedMetadataInputs:229,materializedInputs:6,currentConsumer:CURRENT,currentSourceTree:CURRENT_TREE,oldConsumer:OLD,oldSourceTree:OLD_TREE,originalReportConsumer:ORIGINAL_REPORT_CONSUMER,reportSha256:REPORT_SHA,mappingSha256:CURRENT_FILES['tools/reviewedAlertCorpusSources.json'],inputs:rows.map(({url,sha256,repository,revision,path,gitBlobSha1,sourceBytes,retrievalUrl})=>({url,sha256,repository,revision,path,gitBlobSha1,sourceBytes,retrievalUrl})),reusedInputs:stats.reusedInputs,downloadedInputs:stats.downloadedInputs,sourceBodiesPublished:false};
}
export function expectedTests(currentRoot){
 const prefix='actual source at-will bridge, not a metadata tag ',rules=JSON.parse(readFileSync(join(currentRoot,'src/core/automation/itemAtWillEvidence.json'),'utf8')).rules;
 if(rules.length!==13||rules.reduce((n,r)=>n+r.grants.length,0)!==20)fail('RULE_METADATA');
 const source=[
 'real Helm actor already confirms, delivers and records a free cast, so missing producer observation is meaningful',
 // Locked Vitest4 renders $object string properties with literal quotes;
 // %s modes elsewhere remain unquoted. Inputs here are immutable metadata.
 ...rules.map(r=>{if(!/^[A-Za-z ]+$/.test(r.source)||!/^[A-Za-z ]+$/.test(r.english))fail('RULE_METADATA');return `actual '${r.source}' '${r.english}' per-file and final source receives every declared observed branch`;}),
 'all13 source versions use the actual Data alias codec and existing denominator identities, never colon guesses',
 'genuine406 has no new capability/free-cast witness, and existing generic/charge witness priority is retained',
 ...['pack','header','canonical'].map(m=>`forged ${m} never earns a source at-will observation or mutates original entry`),
 'coherent aliases work but both alias and canonical source disable remain authoritative',
 ...['confirm-noop','delivery-noop','cast-noop','native-write','manual-write','wrong-scope','wrong-time'].map(m=>`does not award an optimistic ${m} transaction`),
 'opaque future intent survives old/current native readers but never enables the new route',
 ...['itemAtWillRule','itemAtWillOffers','itemAtWillOffer','setItemAtWillIntent','itemAtWillObservedIntent','newCharacter','newAutomationState','selectionAllowed','syncSourceSpells','planSourceSpells','spellPayments','spellActionRequest','performSpellAction','removeSelection','exportCharacter','readCharacter'].map(m=>`present capability with omitted/wrong ${m} is a hard runtime failure`),
 'type-only erasure cannot silently create a usable new runtime capability'
 ].map(name=>({file:'test/runtimeItemAtWill.vitest.ts',name:prefix+name}));
 const closed=[
 'accepts only a closed observed source free-cast transaction while preserving the18789 denominator and one-mechanism definition',
 ...['wrong-entry','already-confirmed','preexisting-grant','no-confirmation','empty-branches','wrong-count','no-cast','wrong-sequence','charge-debit','boolean-debit','effect','duplicate','native','withdraw','marks','source','authority','manual','unknown-scope','unknown-time','not-free','wrong-level','branch-no-cast','branch-debit','raw-prose','extra-field','missing-field'].map(m=>`rejects ${m} without accepting tags or weakening old contracts`),
 'preserves exact prior source bindings and includes new proof/intent/UI modules without test or private files'
 ].map(name=>({file:'test/runtimeItemAtWillWitnessContract.vitest.ts',name}));
 if(source.length!==45||closed.length!==29||new Set([...source,...closed].map(x=>x.name)).size!==74)fail('TEST_IDENTITIES');return [...source,...closed];
}
export function runnerPlan(options,privateRoot,root=ROOT){
 const guard=join(root,'scripts/item_atwill_network_guard.cjs');
 return {command:process.execPath,args:[join(root,'node_modules/vitest/vitest.mjs'),'run','test/runtimeItemAtWill.vitest.ts','test/runtimeItemAtWillWitnessContract.vitest.ts','--maxWorkers=1','--no-file-parallelism','--retry=0','--reporter=json','--outputFile='+join(privateRoot,'results.json')],options:{cwd:root,encoding:'utf8',timeout:360000,maxBuffer:16*1024*1024,env:{...process.env,NODE_OPTIONS:`--require ${guard}`,RUNTIME_ITEM_ATWILL_SOURCE_TESTS:'1',RUNTIME_ITEM_ATWILL_CONSUMER_ROOT:options.currentRoot,RUNTIME_ITEM_ATWILL_OLD_CONSUMER_ROOT:options.oldRoot,ITEM_ATWILL_FROZEN_DIR:options.output}}};
}
export function sanitizeResults(json,expected,exit){
 const outcomes=[],seen=new Set(),statuses=new Set(['passed','failed','pending','skipped','todo','disabled']);
 if(!json||!Array.isArray(json.testResults))fail('RESULT_SCHEMA');
 for(const suite of json.testResults){
  if(!Array.isArray(suite.assertionResults))fail('RESULT_SCHEMA');
  for(const item of suite.assertionResults){
   const match=expected.find(e=>e.name===item.fullName&&suite.name.replaceAll('\\','/').endsWith('/'+e.file));
   if(!match||seen.has(match.name)||!statuses.has(item.status)||item.duration!==undefined&&item.duration!==null&&(!Number.isFinite(item.duration)||item.duration<0))fail('RESULT_IDENTITY');
   seen.add(match.name);outcomes.push({file:match.file,name:match.name,status:item.status,durationMs:item.duration??null});
  }
 }
 if(outcomes.length!==74)fail('RESULT_COUNT');
 const counts={total:outcomes.length,passed:outcomes.filter(x=>x.status==='passed').length,failed:outcomes.filter(x=>x.status==='failed').length,notPassed:outcomes.filter(x=>x.status!=='passed').length};
 return {outcomes,counts,passed:exit===0&&json.success===true&&counts.passed===74&&json.numTotalTests===74&&json.numPassedTests===74&&json.numFailedTests===0&&json.numPendingTests===0};
}
function writeJson(path,value){mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});}
export async function runGate(options,{root=ROOT,verify=verifyCheckouts,metadataLoader=loadMetadata,spawn=spawnSync}={}){
 const p=verify(options,{root}),metadata=await metadataLoader(p.currentRoot,root);
 await verifyBundlerResolution(p.currentRoot,p.oldRoot,root);
 if(existsSync(p.output)||existsSync(p.receipt)||existsSync(p.result))fail('OUTPUT_EXISTS');
 const stats=await metadata.api.materializeRows(metadata.rows,{output:p.output,caches:[]});
 verifySixIndex(p.output);writeJson(p.receipt,sixReceipt(metadata.rows,stats));
 const privateRoot=mkdtempSync(join(root,'.cache/item-atwill-private-')),plan=runnerPlan(p,privateRoot,root),start=Date.now(),run=spawn(plan.command,plan.args,plan.options);
 const stdout=Buffer.from(run.stdout??''),stderr=Buffer.from(run.stderr??'');writeFileSync(join(privateRoot,'stdout.log'),stdout);writeFileSync(join(privateRoot,'stderr.log'),stderr);
 const resultsPath=join(privateRoot,'results.json'),resultBytes=existsSync(resultsPath)?readFileSync(resultsPath):null;
 let safe,category='test-failure';
 try{safe=sanitizeResults(resultBytes?JSON.parse(resultBytes):null,expectedTests(p.currentRoot),run.status);category=safe.passed?'passed':/Hook timed out in 30000ms|Hook timed out after 30000ms/.test(resultBytes?.toString()??'')?'setup-timeout-30s':'test-failure';}catch{category='closed-result-contract-failure';}
 if(run.signal)category=run.signal==='SIGKILL'?'process-killed-cause-unproven':'process-signal';
 if(run.error)category=run.error.code==='ETIMEDOUT'?'process-timeout':'process-error';
 const receipt={schemaVersion:1,kind:'item-atwill-source-gate-technical-result',currentConsumer:CURRENT,currentSourceTree:CURRENT_TREE,oldConsumer:OLD,oldSourceTree:OLD_TREE,originalReportConsumer:ORIGINAL_REPORT_CONSUMER,expectedSourceTests:45,expectedClosedTests:29,workerCount:1,retries:0,setupBudgetMs:30000,networkDeniedFromStartup:true,durationMs:Date.now()-start,exitCode:run.status,signal:['SIGKILL','SIGTERM','SIGABRT'].includes(run.signal)?run.signal:run.signal?'other':null,category,accepted:safe?.passed===true&&!run.error&&!run.signal,counts:safe?.counts??null,outcomes:safe?.outcomes??[],stdoutSha256:sha(stdout),stderrSha256:sha(stderr),resultsSha256:resultBytes?sha(resultBytes):null,sourceBodiesPublished:false,rawOutputsPublished:false,wholeEntryOrReportCredit:false};
 writeJson(p.result,receipt);return receipt.accepted;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const verifyOnly=process.argv[2]==='verify',options=parseArgs(process.argv.slice(verifyOnly?3:2));
  if(verifyOnly){const p=verifyCheckouts(options,{dependencies:false});await loadMetadata(p.currentRoot);expectedTests(p.currentRoot);process.stdout.write('ITEM_ATWILL_GATE_IMMUTABLE_CONTRACT_VERIFIED\n');}
  else{const accepted=await runGate(options);process.stdout.write(accepted?'ITEM_ATWILL_GATE_PASSED\n':'ITEM_ATWILL_GATE_NOT_ACCEPTED\n');if(!accepted)process.exitCode=1;}
 }
 catch(error){const message=error instanceof Error&&/^ITEM_ATWILL_GATE_[A-Z_]+$/.test(error.message)?error.message:'ITEM_ATWILL_GATE_FAILED';process.stderr.write(message+'; private source bodies and errors are not logged.\n');process.exitCode=1;}
}
