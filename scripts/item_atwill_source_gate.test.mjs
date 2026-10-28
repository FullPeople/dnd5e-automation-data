import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,mkdtempSync,rmSync,symlinkSync,existsSync,realpathSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync,spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {ROOT,CURRENT,CURRENT_TREE,OLD,OLD_TREE,PINS,SOURCE_FILES,parseArgs,validatePaths,verifyCheckouts,verifyLockedDependencies,verifyBundlerResolution,selectPins,loadMetadata,verifySixIndex,sixReceipt,expectedTests,runnerPlan,sanitizeResults,runGate,sha} from './item_atwill_source_gate.mjs';

const scratch=mkdtempSync(join(tmpdir(),'item-atwill-wrapper-')),web=process.env.ITEM_ATWILL_PREFLIGHT_WEB_ROOT;
after(()=>rmSync(scratch,{recursive:true,force:true}));
const standard={currentRoot:'.cache/item-atwill-web-current',oldRoot:'.cache/item-atwill-web-old',output:'.cache/item-atwill-six',receipt:'item-atwill-source-evidence/six-inputs.json',result:'item-atwill-source-evidence/gate.json'};
const args=Object.entries(standard).flatMap(([k,v])=>['--'+k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),v]);
function put(path,body){mkdirSync(dirname(path),{recursive:true});writeFileSync(path,body);}
function copy(root,path,target){put(join(target,path),readFileSync(join(root,path)));}
function fixture(){
 assert.ok(web,'Explicit immutable Web fixture root required for offline contract');
 const root=mkdtempSync(join(scratch,'checkout-')),p=validatePaths(standard,root);
 for(const path of [...Object.keys(SOURCE_FILES),'package.json','package-lock.json','reports/progress/runtime-coverage.json'])copy(ROOT,path,root);
 const currentPaths=['package.json','package-lock.json','tools/fetchReviewedAlertCorpus.mjs','tools/reviewedAlertCorpusSources.json','src/core/automation/itemAtWill.ts','src/core/automation/itemAtWillEvidence.json','src/core/automation/actions.ts','src/data/catalog.ts','src/data/catalogNormalizer.ts','src/data/adapt.ts','src/data/expand.ts','src/data/spellLookup.ts','src/core/sourceCorrections.ts','src/core/proficiencyText.ts'];
 for(const path of currentPaths)copy(web,path,p.currentRoot);
 for(const path of ['package-lock.json',...currentPaths.filter(x=>x.startsWith('src/')&&!x.startsWith('src/core/automation/'))]){
  // Read immutable old commit objects, never its worktree, index or cache.
  const bytes=execFileSync('git',['--no-replace-objects','--no-optional-locks','-C',web,'show',OLD+':'+path],{maxBuffer:1024*1024});put(join(p.oldRoot,path),bytes);
 }
 // Reuse the actual producer install. Model only the audited real consumer
 // dependency, never an invented esbuild or an unrelated shared Web install.
 symlinkSync(realpathSync(join(ROOT,'node_modules')),join(root,'node_modules'),'dir');
 mkdirSync(join(p.currentRoot,'node_modules'),{recursive:true});
 const require=createRequire(join(resolve(web),'package.json'));
 symlinkSync(dirname(require.resolve('idb/package.json')),join(p.currentRoot,'node_modules/idb'),'dir');
 symlinkSync(join(p.currentRoot,'node_modules'),join(p.oldRoot,'node_modules'),'dir');
 const calls=[],git=(directory,a)=>{calls.push([directory,a]);if(a[0]==='diff')return '';return directory===p.currentRoot?(a[1]==='HEAD'?CURRENT:CURRENT_TREE):(a[1]==='HEAD'?OLD:OLD_TREE);};
 return {root,p,calls,git};
}

test('real locked-layout regression accepts producer esbuild/Vitest and consumer idb without inventing consumer esbuild',()=>{
 const f=fixture(),producer=JSON.parse(readFileSync(join(f.root,'package-lock.json'))),consumer=JSON.parse(readFileSync(join(f.p.currentRoot,'package-lock.json')));
 assert.equal(producer.packages['node_modules/esbuild'].version,'0.28.2');assert.equal(producer.packages['node_modules/vitest'].version,'4.0.18');assert.equal(consumer.packages['node_modules/idb'].version,'8.0.3');assert.equal(consumer.packages['node_modules/esbuild'],undefined);assert.ok(!existsSync(join(f.p.currentRoot,'node_modules/esbuild/package.json')));
 assert.deepEqual(verifyCheckouts(standard,{root:f.root,git:f.git}),f.p);
});
test('critical dependencies use exact lock integrity/version, real resolution and fixed entry hashes; wrong lock/version/body fail closed',async()=>{
 const f=fixture(),found=verifyLockedDependencies(f.p.currentRoot,f.p.oldRoot,f.root);
 assert.equal(found.vitest.version,'4.0.18');assert.equal(found.esbuild.version,'0.28.2');assert.equal(found.idb.version,'8.0.3');
 assert.equal(found.idb.entry,join(realpathSync(join(f.p.currentRoot,'node_modules/idb')),'build/index.cjs'));
 assert.equal((await verifyBundlerResolution(f.p.currentRoot,f.p.oldRoot,f.root)).actualBundlerResolutionVerified,true);
 const lock=JSON.parse(readFileSync(join(f.p.currentRoot,'package-lock.json')));lock.packages['node_modules/idb'].integrity='sha512-'+Buffer.alloc(64).toString('base64');put(join(f.p.currentRoot,'package-lock.json'),JSON.stringify(lock));assert.throws(()=>verifyLockedDependencies(f.p.currentRoot,f.p.oldRoot,f.root),/DEPENDENCY_LOCK/);
 const g=fixture(),idb=join(g.p.currentRoot,'node_modules/idb'),original=realpathSync(idb);rmSync(idb);
 for(const path of ['package.json','build/index.js','build/index.cjs'])copy(original,path,idb);
 const pkg=JSON.parse(readFileSync(join(idb,'package.json')));pkg.version='8.0.2';put(join(idb,'package.json'),JSON.stringify(pkg));assert.throws(()=>verifyLockedDependencies(g.p.currentRoot,g.p.oldRoot,g.root),/DEPENDENCY_VERSION/);
 copy(original,'package.json',idb);put(join(idb,'build/index.js'),'// Authored invalid module bytes');assert.throws(()=>verifyLockedDependencies(g.p.currentRoot,g.p.oldRoot,g.root),/FILE_HASH/);
});

test('CLI requires every exact flag once and rejects malformed, duplicate, absent or extra arguments',()=>{
 assert.deepEqual(parseArgs(args),standard);
 for(const bad of [[],args.slice(0,-1),args.slice(0,-2),[...args,'--cache','anything'],[...args,'--result','other'],['--current-root','--old-root',...args.slice(2)],['--current-root','',...args.slice(2)]])assert.throws(()=>parseArgs(bad),/ARGUMENT/);
});
test('checkout, fixture and artifact paths are exact and non-overlapping; symlink output parents fail closed',()=>{
 const root=join(scratch,'paths');mkdirSync(root);assert.equal(validatePaths(standard,root).currentRoot,join(root,standard.currentRoot));
 for(const key of Object.keys(standard))assert.throws(()=>validatePaths({...standard,[key]:'../outside'},root),/PATH/);
 symlinkSync(scratch,join(root,'.cache'),'dir');assert.throws(()=>validatePaths(standard,root),/PATH_SYMLINK/);
});
test('immutable current revision/source tree match and old source commit/tree are available read-only',()=>{
 assert.equal(execFileSync('git',['--no-replace-objects','--no-optional-locks','-C',web,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),CURRENT);
 assert.equal(execFileSync('git',['--no-replace-objects','--no-optional-locks','-C',web,'rev-parse','HEAD:src'],{encoding:'utf8'}).trim(),CURRENT_TREE);
 assert.equal(execFileSync('git',['--no-replace-objects','--no-optional-locks','-C',web,'rev-parse',OLD+':src'],{encoding:'utf8'}).trim(),OLD_TREE);
});
test('whole checkout contract verifies ten original files, runtime modules, unchanged old modules and locked dependency paths',()=>{
 const f=fixture();assert.deepEqual(verifyCheckouts(standard,{root:f.root,git:f.git}),f.p);
 assert.equal(f.calls.length,6);assert.deepEqual(f.calls.filter(x=>x[1][0]==='diff').map(x=>x[1]),Array(2).fill(['diff','--quiet','HEAD','--','src','package.json','package-lock.json','tools/fetchReviewedAlertCorpus.mjs','tools/reviewedAlertCorpusSources.json']));
 assert.throws(()=>verifyCheckouts(standard,{root:f.root,git:()=>OLD}),/CONSUMER_REVISION/);
 put(join(f.p.currentRoot,'src/core/automation/actions.ts'),'authored wrong bytes');assert.throws(()=>verifyCheckouts(standard,{root:f.root,git:f.git}),/FILE_HASH/);
});
test('wrong source helper pin and wrong old dependency link fail closed before transport',()=>{
 const f=fixture();put(join(f.root,'test/helpers/itemAtWillSource.ts'),'authored wrong pin');assert.throws(()=>verifyCheckouts(standard,{root:f.root,git:f.git}),/FILE_HASH/);
 const g=fixture();rmSync(join(g.p.oldRoot,'node_modules'));symlinkSync(join(g.root,'node_modules'),join(g.p.oldRoot,'node_modules'),'dir');assert.throws(()=>verifyCheckouts(standard,{root:g.root,git:g.git}),/OLD_DEPENDENCY_LINK/);
});
test('all229 immutable input and mapping metadata validate, then exactly the six original pins are selected',async()=>{
 const f=fixture(),{rows,api}=await loadMetadata(f.p.currentRoot,f.root);assert.equal(rows.length,6);assert.deepEqual(rows.map(r=>r.sha256),Object.values(PINS));
 const report=JSON.parse(readFileSync(join(f.root,'reports/progress/runtime-coverage.json'))),mapping=api.readMapping();
 assert.equal(api.validateInputs(report.inputs).length,229);assert.equal(api.validateMapping(mapping,report.inputs).length,229);
 assert.throws(()=>api.validateInputs(report.inputs.slice(1)));
 const bad=structuredClone(mapping);bad.rows.find(r=>!rows.some(s=>s.url===r.url)).revision='0'.repeat(40);assert.throws(()=>api.validateMapping(bad,report.inputs));
 const missing=mapping.rows.filter(r=>r.url!==rows[0].url);missing.push({...mapping.rows.find(r=>!rows.some(s=>s.url===r.url)),url:'https://5e.kiwee.top/data/authored.json'});assert.throws(()=>selectPins(missing),/ORIGINAL_PIN/);
 const wrong=structuredClone(mapping.rows);wrong.find(r=>r.url===rows[0].url).sha256='0'.repeat(64);assert.throws(()=>selectPins(wrong),/ORIGINAL_PIN/);
 const unpinned=structuredClone(mapping);unpinned.rows[0].retrievalUrl='https://raw.githubusercontent.com/tjliqy/5etools-cn/main/data/authored.json';assert.throws(()=>api.validateMapping(unpinned,report.inputs));
});
test('materialization contract reuses only six verified cached bodies; six-index and closed receipt reject corruption',async()=>{
 const cache=process.env.ITEM_ATWILL_PREFLIGHT_CACHE;assert.ok(cache,'Explicit original six-body cache required; no transport fallback');
 const f=fixture(),{api,rows}=await loadMetadata(f.p.currentRoot,f.root),output=join(scratch,'six-only');let fetches=0;
 const stats=await api.materializeRows(rows,{output,caches:[cache],fetcher:()=>{fetches++;throw Error('ITEM_ATWILL_NETWORK_DENIED');}});
 assert.equal(fetches,0);assert.deepEqual(stats,{reusedInputs:6,downloadedInputs:0});assert.equal(verifySixIndex(output).length,6);
 const receipt=sixReceipt(rows,{...stats,private:'must not escape'});assert.equal(receipt.materializedInputs,6);assert.equal(receipt.validatedMetadataInputs,229);assert.ok(!Object.hasOwn(receipt,'private'));
 assert.throws(()=>sixReceipt(rows,{reusedInputs:229,downloadedInputs:0}),/RECEIPT/);
 const index=JSON.parse(readFileSync(join(output,'index.json')));index.rows[0].path='../outside.json';put(join(output,'index.json'),JSON.stringify(index));assert.throws(()=>verifySixIndex(output),/INDEX/);
});
test('immutable transport validates exact retrieval URL, byte size, git blob and canonical SHA without any network',async()=>{
 const f=fixture(),{api}=await loadMetadata(f.p.currentRoot,f.root),raw=Buffer.from('{"authored":true}\n'),canonical=Buffer.from(JSON.stringify(JSON.parse(raw))),url='https://5e.kiwee.top/data/authored.json';
 const row={url,sha256:sha(canonical),repository:'tjliqy/5etools-cn',revision:'5cc0bbe2c2b241a334e731af4448bdba2168e8bd',path:'data/authored.json',gitBlobSha1:createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${raw.length}\0`),raw])).digest('hex'),sourceBytes:raw.length,retrievalUrl:'https://raw.githubusercontent.com/tjliqy/5etools-cn/5cc0bbe2c2b241a334e731af4448bdba2168e8bd/data/authored.json'};
 const fetcher=async(request,options)=>{assert.equal(request,row.retrievalUrl);assert.equal(options.redirect,'error');return {ok:true,redirected:false,url:request,headers:new Headers({'content-length':String(raw.length)}),body:new ReadableStream({start(controller){controller.enqueue(raw);controller.close();}})};};
 assert.deepEqual(await api.fetchVerifiedBody(row,fetcher),canonical);
 for(const change of [{sourceBytes:raw.length+1},{gitBlobSha1:'0'.repeat(40)},{sha256:'0'.repeat(64)},{revision:'0'.repeat(40)},{retrievalUrl:row.retrievalUrl.replace(row.revision,'main')}])await assert.rejects(api.fetchVerifiedBody({...row,...change},fetcher),/REVIEWED_CORPUS_/);
});
test('unchanged source45 + closed29 command is single-worker, zero-retry, startup-denied and hard-pinned to actual roots',()=>{
 const f=fixture(),plan=runnerPlan(f.p,join(scratch,'private'),f.root),expected=expectedTests(f.p.currentRoot);
 assert.equal(expected.filter(x=>x.file==='test/runtimeItemAtWill.vitest.ts').length,45);assert.equal(expected.length,74);
 assert.deepEqual(plan.args.slice(1,4),['run','test/runtimeItemAtWill.vitest.ts','test/runtimeItemAtWillWitnessContract.vitest.ts']);
 for(const flag of ['--maxWorkers=1','--no-file-parallelism','--retry=0','--reporter=json'])assert.ok(plan.args.includes(flag));
 assert.equal(plan.options.env.RUNTIME_ITEM_ATWILL_SOURCE_TESTS,'1');assert.equal(plan.options.env.RUNTIME_ITEM_ATWILL_CONSUMER_ROOT,f.p.currentRoot);assert.equal(plan.options.env.RUNTIME_ITEM_ATWILL_OLD_CONSUMER_ROOT,f.p.oldRoot);assert.equal(plan.options.env.ITEM_ATWILL_FROZEN_DIR,f.p.output);
 assert.equal(plan.options.env.NODE_OPTIONS,'--require '+join(f.root,'scripts/item_atwill_network_guard.cjs'));assert.ok(plan.options.timeout<=360000);
 assert.match(readFileSync(join(ROOT,'test/runtimeItemAtWill.vitest.ts'),'utf8'),/\},30000\);/);
});
test('sanitizer emits only allowlisted exact names/statuses/durations, never arbitrary errors, paths, bodies or diffs',()=>{
 const f=fixture(),expected=expectedTests(f.p.currentRoot),make=()=>({success:true,numTotalTests:74,numPassedTests:74,numFailedTests:0,numPendingTests:0,testResults:['test/runtimeItemAtWill.vitest.ts','test/runtimeItemAtWillWitnessContract.vitest.ts'].map(file=>({name:join(f.root,file),message:'SECRET arbitrary upstream body',assertionResults:expected.filter(e=>e.file===file).map(e=>({fullName:e.name,status:'passed',duration:1,failureMessages:['SECRET rule/card diff'],ancestorTitles:['SECRET'],meta:{raw:'SECRET'}}))}))});
 const json=make(),safe=sanitizeResults(json,expected,0);assert.equal(safe.passed,true);assert.equal(safe.counts.passed,74);assert.ok(!JSON.stringify(safe).includes('SECRET'));assert.ok(!JSON.stringify(safe).includes(f.root));
 assert.equal(sanitizeResults(json,expected,1).passed,false);
 for(const mutate of [j=>j.testResults[0].assertionResults[0].fullName+=' SECRET',j=>j.testResults[0].assertionResults[0].status='SECRET',j=>j.testResults[0].assertionResults[0].duration=-1,j=>j.testResults[0].assertionResults.pop(),j=>j.testResults[0].assertionResults.push(j.testResults[0].assertionResults[0])]){const bad=make();mutate(bad);assert.throws(()=>sanitizeResults(bad,expected,0),/RESULT_/);}
 const red=make();red.testResults[0].assertionResults[0].status='failed';red.success=false;assert.equal(sanitizeResults(red,expected,0).passed,false);
});
test('source transport is denied from process startup, including inherited Node subprocesses, and never restored',()=>{
 const guard=join(ROOT,'scripts/item_atwill_network_guard.cjs');
 const script=`import {spawnSync} from 'node:child_process';import {request} from 'node:https';import {connect} from 'node:net';for(const f of [()=>fetch('https://example.invalid'),()=>request('https://example.invalid'),()=>connect(443,'example.invalid')]){try{f();process.exit(9);}catch(e){if(e.message!=='ITEM_ATWILL_NETWORK_DENIED')process.exit(8);}}const child=spawnSync(process.execPath,['-e',\"try{fetch('https://example.invalid');process.exit(7)}catch(e){if(e.message!=='ITEM_ATWILL_NETWORK_DENIED')process.exit(6)}\"],{env:process.env});if(child.status!==0)process.exit(5);if(Object.getOwnPropertyDescriptor(globalThis,'fetch').writable!==false)process.exit(4);`;
 const r=spawnSync(process.execPath,['--input-type=module','-e',script],{env:{...process.env,NODE_OPTIONS:'--require '+guard},encoding:'utf8',timeout:5000});assert.equal(r.status,0);assert.equal(r.stdout,'');
});
test('actual verify CLI and complete adapter dependency bundles use real isolated current/old checkouts without installation or source execution',async()=>{
 const f=fixture();rmSync(f.p.currentRoot,{recursive:true,force:true});rmSync(f.p.oldRoot,{recursive:true,force:true});
 for(const [destination,revision] of [[f.p.currentRoot,CURRENT],[f.p.oldRoot,OLD]]){
  execFileSync('git',['clone','--shared','--no-checkout','--single-branch',web,destination],{stdio:['ignore','pipe','pipe'],timeout:15000});
  execFileSync('git',['--no-optional-locks','-C',destination,'checkout','--detach',revision],{stdio:['ignore','pipe','pipe'],timeout:15000});
 }
 copy(ROOT,'scripts/item_atwill_source_gate.mjs',f.root);
 const result=spawnSync(process.execPath,[join(f.root,'scripts/item_atwill_source_gate.mjs'),'verify',...args],{encoding:'utf8',timeout:15000,env:{...process.env,NODE_OPTIONS:'--max-old-space-size=512 --require '+join(ROOT,'scripts/item_atwill_network_guard.cjs')}});
 assert.equal(result.status,0);assert.equal(result.stdout,'ITEM_ATWILL_GATE_IMMUTABLE_CONTRACT_VERIFIED\n');assert.equal(result.stderr,'');assert.ok(!existsSync(f.p.output));assert.ok(!existsSync(f.p.receipt));assert.ok(!existsSync(f.p.result));
 // Audit the complete immutable adapter dependency graph, compile only. The
 // consumer has exactly the one real idb package, not the shared Web tree.
 mkdirSync(join(f.p.currentRoot,'node_modules'));const require=createRequire(join(resolve(web),'package.json')),idb=dirname(require.resolve('idb/package.json'));
 symlinkSync(idb,join(f.p.currentRoot,'node_modules/idb'),'dir');symlinkSync(join(f.p.currentRoot,'node_modules'),join(f.p.oldRoot,'node_modules'),'dir');
 const found=verifyLockedDependencies(f.p.currentRoot,f.p.oldRoot,f.root),esbuild=await import(pathToFileURL(found.esbuild.entry).href),adapterPath=join(f.root,'adapter-audit.mjs');
 await esbuild.build({entryPoints:[join(f.root,'src/runtimeCoverage/adapter.ts')],bundle:true,platform:'node',format:'esm',packages:'external',outfile:adapterPath,logLevel:'silent'});
 const adapter=await import(pathToFileURL(adapterPath).href);
 for(const [consumer,name] of [[f.p.currentRoot,'current'],[f.p.oldRoot,'old']]){
  const bundle=await adapter.buildConsumerAdapter(consumer,join(f.root,name+'-adapter.mjs')),dependencies=Object.keys(bundle.metafile.inputs).filter(path=>path.replaceAll('\\','/').includes('/node_modules/')).map(path=>realpathSync(resolve(path)));
  assert.deepEqual(dependencies,[join(realpathSync(idb),'build/index.js')]);
 }
});
test('installed Vitest CLI accepts the planned bounded flags and yields the exact allowlisted JSON name/schema on authored data only',()=>{
 const root=mkdtempSync(join(scratch,'authored-vitest-'));symlinkSync(resolve(ROOT,'node_modules'),join(root,'node_modules'),'dir');
 put(join(root,'package.json'),'{"type":"module"}');put(join(root,'vitest.config.mjs'),'export default {test:{include:["sample.test.ts"]}};');
 put(join(root,'sample.test.ts'),"import {describe,it,expect} from 'vitest';describe('authored suite',()=>{it.each([{source:'AUTHORED',english:'Safe'}])('actual $source $english branch',()=>expect(true).toBe(true));it.each(['pack'])('mode %s branch',()=>expect(true).toBe(true));});\n");
 const output=join(root,'result.json'),plan=runnerPlan(validatePaths(standard),root),planned=[...plan.args];planned.splice(2,2,'sample.test.ts');planned[planned.findIndex(x=>x.startsWith('--outputFile='))]='--outputFile='+output;planned.push('--root',root,'--config',join(root,'vitest.config.mjs'));
 const result=spawnSync(plan.command,planned,{...plan.options,cwd:root,timeout:15000,env:{...plan.options.env,NODE_OPTIONS:'--max-old-space-size=512 --require '+join(ROOT,'scripts/item_atwill_network_guard.cjs')}});
 assert.equal(result.status,0,result.stderr+'\n'+result.stdout);const json=JSON.parse(readFileSync(output));assert.equal(json.success,true);assert.equal(json.numTotalTests,2);assert.equal(json.numPendingTests,0);assert.equal(json.testResults[0].assertionResults[0].fullName,"authored suite actual 'AUTHORED' 'Safe' branch");assert.equal(json.testResults[0].assertionResults[1].fullName,'authored suite mode pack branch');assert.equal(json.testResults[0].name,join(root,'sample.test.ts'));
});
test('full wrapper orchestration materializes six cached pins and writes only closed receipts for authored pass and first failure',async()=>{
 for(const red of [false,true]){
  const f=fixture(),expected=expectedTests(f.p.currentRoot);let spawned=0;
  const accepted=await runGate(standard,{root:f.root,verify:(options,config)=>verifyCheckouts(options,{...config,git:f.git}),metadataLoader:async(current,root)=>{const metadata=await loadMetadata(current,root);return {...metadata,api:{materializeRows:(rows,options)=>metadata.api.materializeRows(rows,{...options,caches:[process.env.ITEM_ATWILL_PREFLIGHT_CACHE],fetcher:()=>{throw Error('ITEM_ATWILL_NETWORK_DENIED');}})}};},spawn:(command,argv,options)=>{
   spawned++;assert.equal(options.env.RUNTIME_ITEM_ATWILL_CONSUMER_ROOT,f.p.currentRoot);assert.ok(argv.includes('--maxWorkers=1'));assert.ok(argv.includes('--retry=0'));
   const json={success:!red,numTotalTests:74,numPassedTests:red?73:74,numFailedTests:red?1:0,numPendingTests:0,testResults:['test/runtimeItemAtWill.vitest.ts','test/runtimeItemAtWillWitnessContract.vitest.ts'].map(file=>({name:join(f.root,file),message:'SECRET upstream body',assertionResults:expected.filter(e=>e.file===file).map((e,i)=>({fullName:e.name,status:red&&file==='test/runtimeItemAtWill.vitest.ts'&&i===0?'failed':'passed',duration:1,failureMessages:['SECRET card/rule diff']}))}))};
   put(argv.find(x=>x.startsWith('--outputFile=')).slice('--outputFile='.length),JSON.stringify(json));return {status:red?1:0,signal:null,stdout:'SECRET stdout body',stderr:'SECRET stderr body'};
  }});
  assert.equal(spawned,1);assert.equal(accepted,!red);const receipt=JSON.parse(readFileSync(f.p.result));assert.equal(receipt.accepted,!red);assert.equal(receipt.category,red?'test-failure':'passed');assert.equal(receipt.counts.failed,red?1:0);assert.equal(receipt.outcomes.length,74);assert.equal(receipt.stdoutSha256,sha('SECRET stdout body'));assert.ok(!JSON.stringify(receipt).includes('SECRET'));assert.ok(!JSON.stringify(receipt).includes(f.root));assert.equal(JSON.parse(readFileSync(f.p.receipt)).materializedInputs,6);
 }
});
test('workflow exact branch/read-only grants/checkout roots/locked install and two-file artifact allowlist match helper arguments',()=>{
 const workflow=readFileSync(join(ROOT,'.github/workflows/item-atwill-source.yml'),'utf8');
 assert.match(workflow,/branches: \['codex\/cloud-rules-rebuild-item-atwill-20261027'\]/);assert.match(workflow,/permissions:\n  contents: read\n/);
 for(const revision of [CURRENT,OLD])assert.match(workflow,new RegExp('ref: '+revision));
 for(const [key,value] of Object.entries(standard))assert.match(workflow,new RegExp('--'+key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())+' '+value.replaceAll('.','\\.')));
 const invocations=[...workflow.matchAll(/node scripts\/item_atwill_source_gate\.mjs( verify)? \\\n((?:            --[^\n]+\n){5})/g)];assert.equal(invocations.length,2);
 assert.equal(invocations[0][1],' verify');assert.equal(invocations[1][1],undefined);
 for(const invocation of invocations)assert.deepEqual(parseArgs(invocation[2].replaceAll('\\\n',' ').trim().split(/\s+/)),standard);
 assert.equal((workflow.match(/persist-credentials: false/g)||[]).length,3);assert.equal((workflow.match(/^          npm ci(?: --prefix .cache\/item-atwill-web-current)?$/gm)||[]).length,2);
 assert.ok(!/secrets\.|workflow_dispatch|schedule:|pull_request:|retry:|continue-on-error|fetch .*main|npm install/.test(workflow));
 const artifacts=workflow.split('          path: |\n').at(-1).split('\n          if-no-files-found')[0].trim().split('\n').map(x=>x.trim());assert.deepEqual(artifacts,['item-atwill-source-evidence/six-inputs.json','item-atwill-source-evidence/gate.json']);
 const baseline=execFileSync('git',['--no-optional-locks','show','HEAD:.github/workflows/build.yml'],{cwd:ROOT});assert.equal(sha(readFileSync(join(ROOT,'.github/workflows/build.yml'))),sha(baseline));assert.match(baseline.toString(),/if: github.event_name == 'workflow_dispatch' \|\| github.event_name == 'schedule'/);
});
