import {readFileSync,writeFileSync,mkdirSync,existsSync,lstatSync,realpathSync,mkdtempSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,join,dirname,relative,isAbsolute} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';

export const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const CONTRACT=JSON.parse(readFileSync(new URL('./five_family_source_contract.json',import.meta.url)));
export const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=code=>{throw Error('FIVE_FAMILY_GATE_'+code);};
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const plain=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const keys=(value,expected)=>plain(value)&&equal(Object.keys(value).sort(),[...expected].sort());
const hashFile=(root,path,expected)=>{const file=join(root,path);if(lstatSync(file).isSymbolicLink()||sha(readFileSync(file))!==expected)fail('FILE_HASH');};
const gitAt=(directory,args)=>execFileSync('git',['--no-replace-objects','--no-optional-locks','-C',directory,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const paths={webRoot:'.cache/five-family-web',output:'.cache/five-family-inputs',receipt:'five-family-source-evidence/inputs.json',result:'five-family-source-evidence/gate.json',book:'.cache/five-family-side-source/book-tce.json',sideReceipt:'five-family-source-evidence/side-source.json'};
export const ARTIFACTS=Object.freeze([paths.receipt,paths.sideReceipt,paths.result]);

export function parseArgs(args){
 const flags={'--web-root':'webRoot','--output':'output','--receipt':'receipt','--result':'result'},out={};
 if(!Array.isArray(args)||args.length!==8)fail('ARGUMENT');
 for(let i=0;i<args.length;i+=2){const key=flags[args[i]],value=args[i+1];if(!key||typeof value!=='string'||!value||value.startsWith('-')||value.includes('\0')||Object.hasOwn(out,key))fail('ARGUMENT');out[key]=value;}
 return out;
}
function noSymlink(path,root){for(let at=path;at!==root;at=dirname(at)){if(at===dirname(at))fail('PATH');if(existsSync(at)&&lstatSync(at).isSymbolicLink())fail('PATH_SYMLINK');}}
export function validatePaths(options,root=ROOT){
 if(!keys(options,['webRoot','output','receipt','result']))fail('ARGUMENT');
 const out={};for(const [key,path]of Object.entries(paths)){out[key]=resolve(root,options[key]??path);if(out[key]!==resolve(root,path))fail('PATH');noSymlink(out[key],root);}return out;
}
export function verifyCheckouts(options,{root=ROOT,git=gitAt,dependencies=false}={}){
 const p=validatePaths(options,root),producer=CONTRACT.producer;
 if(git(root,['rev-parse',producer.baseline+':src'])!==producer.sourceTree||git(root,['rev-parse','HEAD:src'])!==producer.sourceTree)fail('PRODUCER_SOURCE');
 git(root,['merge-base','--is-ancestor',producer.baseline,'HEAD']);
 git(root,['diff','--quiet','HEAD','--','src','package.json','package-lock.json','reports/progress/runtime-coverage.json','scripts/five_family_source_gate.mjs','scripts/five_family_network_guard.cjs','scripts/five_family_source_contract.json','.github/workflows/five-family-source.yml','test/fiveFamilySourceGate.test.mjs']);
 for(const [file,hash]of Object.entries(producer.files))hashFile(root,file,hash);
 if(git(p.webRoot,['rev-parse','HEAD'])!==CONTRACT.web.revision)fail('WEB_REVISION');
 for(const [scope,tree]of Object.entries(CONTRACT.web.trees))if(git(p.webRoot,['rev-parse','HEAD:'+scope])!==tree)fail('WEB_TREE');
 const scopes=[...Object.keys(CONTRACT.web.trees),'package.json','package-lock.json','vitest.config.ts'];
 git(p.webRoot,['diff','--quiet','HEAD','--',...scopes]);
 for(const ignored of [false,true])if(git(p.webRoot,['ls-files','--others',...(ignored?['--ignored']:[]),'--exclude-standard','--',...scopes]))fail('WEB_UNTRACKED');
 for(const [file,row]of Object.entries(CONTRACT.web.files))hashFile(p.webRoot,file,row.sha256);
 if(dependencies)verifyLockedLayout(p.webRoot);
 return {...p,producerRevision:git(root,['rev-parse','HEAD'])};
}
export function verifyLockedLayout(webRoot,{resolveEntry}={}){
 const lock=JSON.parse(readFileSync(join(webRoot,'package-lock.json'))),modules=join(webRoot,'node_modules');
 if(lstatSync(modules).isSymbolicLink()||realpathSync(modules)!==modules)fail('DEPENDENCY_LAYOUT');
 const require=createRequire(join(webRoot,'package.json')),found={};
 for(const [name,expected]of Object.entries(CONTRACT.web.dependencies)){
  const row=lock.packages?.['node_modules/'+name];if(!row||!['version','integrity','resolved'].every(key=>row[key]===expected[key]))fail('DEPENDENCY_LOCK');
  const directory=join(modules,name);if(lstatSync(directory).isSymbolicLink()||realpathSync(directory)!==directory)fail('DEPENDENCY_LAYOUT');
  const pkg=JSON.parse(readFileSync(join(directory,'package.json')));if(pkg.name!==name||pkg.version!==row.version)fail('DEPENDENCY_VERSION');
  const entry=realpathSync(resolveEntry?resolveEntry(name,directory):require.resolve(name)),within=relative(directory,entry);if(within.startsWith('..')||isAbsolute(within))fail('DEPENDENCY_RESOLUTION');
  for(const [path,hash]of Object.entries(expected.files||{}))hashFile(directory,path,hash);
  found[name]={version:row.version,integrity:row.integrity};
 }
 return found;
}
export function selectPins(rows,evidences){
 if(!Array.isArray(rows)||rows.length!==229||new Set(rows.map(row=>row.url)).size!==229)fail('MAPPING_COUNT');
 const required=new Map();if(!Array.isArray(evidences)||evidences.length!==5)fail('EVIDENCE_COUNT');
 for(const evidence of evidences){if(!Array.isArray(evidence.inputs))fail('EVIDENCE_INPUT');for(const row of evidence.inputs){if(required.has(row.url)&&required.get(row.url)!==row.sha256)fail('EVIDENCE_CONFLICT');required.set(row.url,row.sha256);}}
 if(required.size!==21||!CONTRACT.inputs.every(row=>required.get(row.url)===row.sha256))fail('UNION');
 return CONTRACT.inputs.map(expected=>{const found=rows.filter(row=>row.url===expected.url);if(found.length!==1||!equal(found[0],expected))fail('ORIGINAL_PIN');return found[0];});
}
export async function loadMetadata(webRoot,root=ROOT){
 const bytes=readFileSync(join(root,'reports/progress/runtime-coverage.json'));if(sha(bytes)!==CONTRACT.producer.files['reports/progress/runtime-coverage.json'])fail('REPORT_HASH');
 const report=JSON.parse(bytes);if(report.consumer?.revision!==CONTRACT.producer.originalReportConsumer)fail('REPORT_IDENTITY');
 const api=await import(pathToFileURL(join(webRoot,'tools/fetchReviewedAlertCorpus.mjs')).href),inputs=api.validateInputs(report.inputs),rows=api.validateMapping(api.readMapping(),inputs);
 const evidences=CONTRACT.evidenceFiles.map(file=>JSON.parse(readFileSync(join(webRoot,file))));
 const side=await import(pathToFileURL(join(webRoot,'tools/fetchOptionalClassSpellListSource.mjs')).href);if(!equal(side.SOURCE,CONTRACT.sideSource))fail('SIDE_SOURCE_IDENTITY');
 return {api,side,rows:selectPins(rows,evidences)};
}
export function verifyInputIndex(output,rows=CONTRACT.inputs){
 for(const file of [output,join(output,'files'),join(output,'index.json')])if(lstatSync(file).isSymbolicLink())fail('INDEX');
 const index=JSON.parse(readFileSync(join(output,'index.json'))),expected=rows.map(({url,sha256})=>({url,sha256,path:`files/${sha256}.json`}));
 if(!keys(index,['rows'])||!equal(index.rows,expected))fail('INDEX');
 for(const row of expected){const file=join(output,row.path);if(lstatSync(file).isSymbolicLink()||sha(Buffer.from(JSON.stringify(JSON.parse(readFileSync(file)))))!==row.sha256)fail('BODY_HASH');}return expected;
}
export function inputReceipt(rows,stats){
 if(!equal(rows,CONTRACT.inputs)||!keys(stats,['reusedInputs','downloadedInputs'])||![stats.reusedInputs,stats.downloadedInputs].every(n=>Number.isSafeInteger(n)&&n>=0)||stats.reusedInputs+stats.downloadedInputs!==21)fail('INPUT_RECEIPT');
 return {schemaVersion:1,kind:'five-family-selected-input-technical-receipt',verified:true,validatedMetadataInputs:229,materializedInputs:21,inputSetSha256:CONTRACT.inputSetSha256,reportSha256:CONTRACT.producer.files['reports/progress/runtime-coverage.json'],originalReportConsumer:CONTRACT.producer.originalReportConsumer,webRevision:CONTRACT.web.revision,webSourceTree:CONTRACT.web.trees.src,inputs:rows,...stats,sourceBodiesPublished:false,currentRuntimePairClaimed:false};
}
export function verifySideReceipt(receipt){
 const expected={schemaVersion:1,kind:'optional-class-list-semantic-side-source',verified:true,repository:CONTRACT.sideSource.repository,revision:CONTRACT.sideSource.revision,path:CONTRACT.sideSource.path,retrievalUrl:CONTRACT.sideSource.retrievalUrl,rawBytes:CONTRACT.sideSource.rawBytes,rawSha256:CONTRACT.sideSource.rawSha256,gitBlobSha1:CONTRACT.sideSource.gitBlobSha1,semanticSideSourceOnly:true,runtimeInputExtension:false,sourceBodiesPublished:false};
 if(!equal(receipt,expected))fail('SIDE_RECEIPT');return receipt;
}
// Diagnostic execution is a closed four-case subset, never a full-gate fallback.
export const OPTIONAL_MOUNTED_STAGES=Object.freeze(['start','confirmed','owner-routes','workspace-open','cantrip-navigation','learned-navigation','catalog-candidate','drop-target','pointerdown','pointermove','pointerup','learned-row','correct-owner','other-owner-preserved','manual-preserved']);
export const OPTIONAL_MOUNTED_IDENTITY='e7b01ba66a5adc2fbe5952426cf344fbb11a4aa9cda8ce3d59e1ad6bc27b0ae3';
export function gateScope(scope='full'){
 if(scope==='full')return {kind:'five-family-web-source-and-mounted-technical-result',families:CONTRACT.families,expectedFiles:27,expectedCases:678,expectedMountedFiles:3,expectedMountedCases:8};
 if(scope!=='optional-mounted-diagnostic')fail('SCOPE');
 const family=CONTRACT.families.find(row=>row.id==='optional-class-list'),files=family.files.filter(row=>row.path==='tests/optional-class-list-interactions.test.ts'&&row.category==='mounted');
 if(files.length!==1||files[0].cases!==4||files[0].identityMultiset[OPTIONAL_MOUNTED_IDENTITY]!==1)fail('DIAGNOSTIC_ROSTER');
 return {kind:'five-family-optional-mounted-diagnostic',families:[{...family,files,cases:4,suites:1}],expectedFiles:1,expectedCases:4,expectedMountedFiles:1,expectedMountedCases:4};
}
export function stageValues(values){
 const stages=[];let previous=-1;
 const reject=(value,issue)=>{const error=Error('FIVE_FAMILY_GATE_DIAGNOSTIC_STAGE');error.diagnostic={caseIdentitySha256:OPTIONAL_MOUNTED_IDENTITY,stages:[...stages],issue,rejectedLineSha256:sha(JSON.stringify(value)??'undefined')};throw error;};
 if(!Array.isArray(values)||values.length>15)reject(values,'unknown-stage');
 for(const value of values){const index=OPTIONAL_MOUNTED_STAGES.indexOf(value);if(index!==previous+1)reject(value,index<0?'unknown-stage':index<=previous?'duplicate-stage':'out-of-order-stage');previous=index;stages.push(value);}
 return {caseIdentitySha256:OPTIONAL_MOUNTED_IDENTITY,stages};
}
export function diagnosticStages(stdout){return stageValues(stdout.split(/\r?\n/).filter(line=>line.startsWith('OPTIONAL_LIST_STAGE:')).map(line=>line.slice('OPTIONAL_LIST_STAGE:'.length)));}
export function jsonDiagnosticStages(json,identity=OPTIONAL_MOUNTED_IDENTITY){
 const rows=(json?.testResults||[]).flatMap(suite=>suite.assertionResults||[]).filter(row=>typeof row.fullName==='string'&&sha(row.fullName)===identity);
 if(rows.length!==1)fail('DIAGNOSTIC_ROSTER');
 return stageValues(rows[0].meta?.optionalListStages??[]);
}
export function runnerPlan(p,family,privateRoot,root=ROOT,scope='full'){
 const guard=join(root,'scripts/five_family_network_guard.cjs'),preload=pathToFileURL(join(p.webRoot,'tests/helpers/offlineCatalogFetchPreload.mjs')).href;
 const env=Object.fromEntries(['PATH','HOME','TMPDIR','TMP','TEMP','SystemRoot'].filter(key=>typeof process.env[key]==='string').map(key=>[key,process.env[key]]));
 Object.assign(env,{CI:'true',TZ:'UTC',FORCE_COLOR:'0',NODE_OPTIONS:`--max-old-space-size=512 --require=${guard} --import=${preload}`,ITEM_CHARGE_FROZEN_DIR:p.output,RACIAL_DARKVISION_FROZEN_DIR:p.output,ITEM_ABILITY_FLOOR_FROZEN_DIR:p.output,RACIAL_MOVEMENT_FROZEN_DIR:p.output,OPTIONAL_CLASS_LIST_FROZEN_DIR:p.output,OPTIONAL_CLASS_LIST_SIDE_SOURCE_FILE:p.book});
 return {command:process.execPath,args:[join(p.webRoot,'node_modules/vitest/vitest.mjs'),'run',...family.files.map(file=>file.path),'--maxWorkers=1','--no-file-parallelism','--retry=0','--reporter=json',...(scope==='optional-mounted-diagnostic'?['--reporter=default']:[]),'--outputFile='+join(privateRoot,'results.json')],options:{cwd:p.webRoot,encoding:'utf8',timeout:CONTRACT.budgets.processTimeoutMs,maxBuffer:CONTRACT.budgets.maxBufferBytes,env}};
}
const nameCounts=values=>{const counts={};for(const value of values)counts[value]=(counts[value]||0)+1;return Object.fromEntries(Object.entries(counts).sort(([a],[b])=>a.localeCompare(b)));};
export function sanitizeResults(json,family,webRoot,exit){
 if(!plain(json)||!Array.isArray(json.testResults)||json.testResults.length!==family.files.length)fail('RESULT_SCHEMA');
 const files=[],seen=new Set(),statuses=new Set(['passed','failed','pending','skipped','todo','disabled']);
 for(const suite of json.testResults){
  const expected=family.files.find(file=>suite.name===join(webRoot,file.path));if(!expected||seen.has(expected.path)||!Array.isArray(suite.assertionResults)||suite.assertionResults.length!==expected.cases)fail('RESULT_FILE');seen.add(expected.path);
  const outcomes=[];for(const item of suite.assertionResults){
   if(!statuses.has(item.status)||typeof item.title!=='string'||!Array.isArray(item.ancestorTitles)||item.ancestorTitles.some(value=>typeof value!=='string')||typeof item.fullName!=='string'||item.fullName!==(item.title?[...item.ancestorTitles,item.title].join(' '):item.ancestorTitles.join(' '))||item.fullName.length>4000||item.duration!==undefined&&item.duration!==null&&(!Number.isFinite(item.duration)||item.duration<0))fail('RESULT_IDENTITY');
   outcomes.push({identitySha256:sha(item.fullName),status:item.status,durationMs:item.duration??null});
  }
  if(!expected.identityMultiset||!equal(nameCounts(outcomes.map(row=>row.identitySha256)),expected.identityMultiset))fail('RESULT_IDENTITY');
  files.push({file:expected.path,category:expected.category,expected:expected.cases,passed:outcomes.filter(row=>row.status==='passed').length,failed:outcomes.filter(row=>row.status==='failed').length,skipped:outcomes.filter(row=>!['passed','failed'].includes(row.status)).length,outcomes});
 }
 const counts={total:files.reduce((n,row)=>n+row.expected,0),passed:files.reduce((n,row)=>n+row.passed,0),failed:files.reduce((n,row)=>n+row.failed,0),skipped:files.reduce((n,row)=>n+row.skipped,0)};
 const passed=exit===0&&json.success===true&&counts.passed===family.cases&&json.numTotalTests===family.cases&&json.numPassedTests===family.cases&&json.numFailedTests===0&&json.numPendingTests===0&&json.numTodoTests===0&&json.numTotalTestSuites===family.suites&&json.numPassedTestSuites===family.suites&&json.numFailedTestSuites===0&&json.numPendingTestSuites===0;
 return {files,counts,passed};
}
function writeJson(path,value){mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});}
export async function runGate(options,{root=ROOT,verify=verifyCheckouts,metadataLoader=loadMetadata,indexVerifier=verifyInputIndex,sanitize=sanitizeResults,spawn=spawnSync,clock=Date.now,makePrivate=()=>mkdtempSync(join(root,'.cache/five-family-private-'))}={},scope='full'){
 const selected=gateScope(scope),p=verify(options,{root,dependencies:true}),metadata=await metadataLoader(p.webRoot,root);
 for(const key of ['output','receipt','result','book','sideReceipt'])if(existsSync(p[key]))fail('OUTPUT_EXISTS');
 const stats=await metadata.api.materializeRows(metadata.rows,{output:p.output,caches:[]});indexVerifier(p.output,metadata.rows);writeJson(p.receipt,inputReceipt(metadata.rows,stats));
 const sideReceipt=await metadata.side.run(['--output',p.book,'--receipt',p.sideReceipt]);verifySideReceipt(sideReceipt);metadata.side.validateRawBook(readFileSync(p.book));if(!equal(JSON.parse(readFileSync(p.sideReceipt)),sideReceipt))fail('SIDE_RECEIPT');
 const families=[];let stopped=false,diagnostic;
 for(const family of selected.families){
  if(stopped){families.push({id:family.id,category:'not-run-after-process-failure',accepted:false,counts:null,files:[]});continue;}
  const privateRoot=makePrivate(),plan=runnerPlan(p,family,privateRoot,root,scope),start=clock(),run=spawn(plan.command,plan.args,plan.options),stdout=Buffer.from(run.stdout??''),stderr=Buffer.from(run.stderr??'');
  writeFileSync(join(privateRoot,'stdout.log'),stdout);writeFileSync(join(privateRoot,'stderr.log'),stderr);
  const resultPath=join(privateRoot,'results.json'),bytes=existsSync(resultPath)?readFileSync(resultPath):null;let safe,category=bytes?'closed-result-contract-failure':'child-no-results';
  try{safe=sanitize(bytes?JSON.parse(bytes):null,family,p.webRoot,run.status);category=safe.passed?'passed':safe.counts.failed?'test-failure':'closed-result-contract-failure';}catch{}
  if(scope==='optional-mounted-diagnostic'){diagnostic=jsonDiagnosticStages(bytes?JSON.parse(bytes):null);if(safe?.passed&&!equal(diagnostic.stages,OPTIONAL_MOUNTED_STAGES))category='closed-result-contract-failure';}
  if(/^FIVE_FAMILY_NETWORK_GUARD_VIOLATION$/m.test(stderr.toString()))category='network-guard-violation';
  if(run.signal){category=run.signal==='SIGKILL'?'process-killed-cause-unproven':'process-signal';stopped=true;}if(run.error){category=run.error.code==='ETIMEDOUT'?'process-timeout':'process-error';stopped=true;}
  families.push({id:family.id,category,accepted:category==='passed'&&!!safe?.passed&&!run.signal&&!run.error,durationMs:clock()-start,exitCode:Number.isInteger(run.status)?run.status:null,signal:['SIGKILL','SIGTERM','SIGABRT'].includes(run.signal)?run.signal:run.signal?'other':null,counts:safe?.counts??null,files:safe?.files??[],stdoutSha256:sha(stdout),stderrSha256:sha(stderr),resultsSha256:bytes?sha(bytes):null});
 }
 const accepted=families.every(row=>row.accepted),result={schemaVersion:1,kind:selected.kind,producerBaseline:CONTRACT.producer.baseline,producerSourceTree:CONTRACT.producer.sourceTree,producerRevision:p.producerRevision,webRevision:CONTRACT.web.revision,webSourceTree:CONTRACT.web.trees.src,contractSha256:sha(readFileSync(join(root,'scripts/five_family_source_contract.json'))),expectedFiles:selected.expectedFiles,expectedCases:selected.expectedCases,expectedMountedFiles:selected.expectedMountedFiles,expectedMountedCases:selected.expectedMountedCases,workerCount:1,retries:0,memoryMb:512,processTimeoutMs:360000,networkDeniedFromStartup:true,accepted,families,sourceBodiesPublished:false,rawOutputsPublished:false,currentRuntimePairClaimed:false,wholeEntryOrReportCredit:false};
 if(scope==='optional-mounted-diagnostic')result.mountedDiagnostic=diagnostic;
 writeJson(p.result,result);return accepted;
}
export function validateArtifacts(options,root=ROOT){
 const p=validatePaths(options,root),input=JSON.parse(readFileSync(p.receipt)),side=JSON.parse(readFileSync(p.sideReceipt)),result=JSON.parse(readFileSync(p.result));
 if(!equal(input,inputReceipt(CONTRACT.inputs,{reusedInputs:input.reusedInputs,downloadedInputs:input.downloadedInputs})))fail('ARTIFACT_INPUT');verifySideReceipt(side);
 validateGateResult(result,root);return ARTIFACTS;
}
export function validateGateResult(result,root=ROOT){
 const selected=gateScope(result.kind==='five-family-optional-mounted-diagnostic'?'optional-mounted-diagnostic':'full');
 const resultKeys=['schemaVersion','kind','producerBaseline','producerSourceTree','producerRevision','webRevision','webSourceTree','contractSha256','expectedFiles','expectedCases','expectedMountedFiles','expectedMountedCases','workerCount','retries','memoryMb','processTimeoutMs','networkDeniedFromStartup','accepted','families','sourceBodiesPublished','rawOutputsPublished','currentRuntimePairClaimed','wholeEntryOrReportCredit'];
 if(selected.expectedCases===4)resultKeys.push('mountedDiagnostic');
 if(!keys(result,resultKeys)||result.schemaVersion!==1||result.kind!==selected.kind||result.producerBaseline!==CONTRACT.producer.baseline||result.producerSourceTree!==CONTRACT.producer.sourceTree||!/^[a-f0-9]{40}$/.test(result.producerRevision)||result.webRevision!==CONTRACT.web.revision||result.webSourceTree!==CONTRACT.web.trees.src||result.contractSha256!==sha(readFileSync(join(root,'scripts/five_family_source_contract.json')))||result.expectedFiles!==selected.expectedFiles||result.expectedCases!==selected.expectedCases||result.expectedMountedFiles!==selected.expectedMountedFiles||result.expectedMountedCases!==selected.expectedMountedCases||result.workerCount!==1||result.retries!==0||result.memoryMb!==512||result.processTimeoutMs!==360000||result.networkDeniedFromStartup!==true||typeof result.accepted!=='boolean'||!Array.isArray(result.families)||result.families.length!==selected.families.length||result.sourceBodiesPublished!==false||result.rawOutputsPublished!==false||result.currentRuntimePairClaimed!==false||result.wholeEntryOrReportCredit!==false)fail('ARTIFACT_RESULT');
 const hashes=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
 if(selected.expectedCases===4){const diagnostic=result.mountedDiagnostic;if(!keys(diagnostic,['caseIdentitySha256','stages'])||diagnostic.caseIdentitySha256!==OPTIONAL_MOUNTED_IDENTITY||!Array.isArray(diagnostic.stages)||!equal(diagnostic.stages,OPTIONAL_MOUNTED_STAGES.slice(0,diagnostic.stages.length))||diagnostic.stages.length>OPTIONAL_MOUNTED_STAGES.length||result.accepted&&!equal(diagnostic.stages,OPTIONAL_MOUNTED_STAGES))fail('ARTIFACT_DIAGNOSTIC');}
 for(let i=0;i<selected.families.length;i++){
  const row=result.families[i],family=selected.families[i];if(row.id!==family.id)fail('ARTIFACT_FAMILY');
  if(row.category==='not-run-after-process-failure'){if(!keys(row,['id','category','accepted','counts','files'])||row.accepted!==false||row.counts!==null||!equal(row.files,[]))fail('ARTIFACT_FAMILY');continue;}
  if(!keys(row,['id','category','accepted','durationMs','exitCode','signal','counts','files','stdoutSha256','stderrSha256','resultsSha256'])||!['passed','test-failure','child-no-results','network-guard-violation','closed-result-contract-failure','process-killed-cause-unproven','process-signal','process-timeout','process-error'].includes(row.category)||typeof row.accepted!=='boolean'||!Number.isFinite(row.durationMs)||row.durationMs<0||row.exitCode!==null&&!Number.isInteger(row.exitCode)||![null,'SIGKILL','SIGTERM','SIGABRT','other'].includes(row.signal)||!hashes(row.stdoutSha256)||!hashes(row.stderrSha256)||row.resultsSha256!==null&&!hashes(row.resultsSha256)||!Array.isArray(row.files))fail('ARTIFACT_FAMILY');
  if(row.counts!==null&&(!keys(row.counts,['total','passed','failed','skipped'])||!Object.values(row.counts).every(n=>Number.isSafeInteger(n)&&n>=0)||row.counts.total!==family.cases||row.counts.total!==row.counts.passed+row.counts.failed+row.counts.skipped))fail('ARTIFACT_COUNTS');
  const seen=new Set();for(const file of row.files){const expected=family.files.find(expected=>expected.path===file.file);if(!expected||seen.has(file.file)||!keys(file,['file','category','expected','passed','failed','skipped','outcomes'])||file.category!==expected.category||file.expected!==expected.cases||![file.passed,file.failed,file.skipped].every(n=>Number.isSafeInteger(n)&&n>=0)||file.passed+file.failed+file.skipped!==file.expected||!Array.isArray(file.outcomes)||file.outcomes.length!==expected.cases)fail('ARTIFACT_FILE');seen.add(file.file);for(const outcome of file.outcomes)if(!keys(outcome,['identitySha256','status','durationMs'])||!hashes(outcome.identitySha256)||!['passed','failed','pending','skipped','todo','disabled'].includes(outcome.status)||outcome.durationMs!==null&&(!Number.isFinite(outcome.durationMs)||outcome.durationMs<0))fail('ARTIFACT_OUTCOME');if(!equal(nameCounts(file.outcomes.map(value=>value.identitySha256)),expected.identityMultiset))fail('ARTIFACT_IDENTITY');}
  if(row.counts!==null&&(row.files.length!==family.files.length||!['passed','failed','skipped'].every(key=>row.counts[key]===row.files.reduce((n,file)=>n+file[key],0))))fail('ARTIFACT_COUNTS');
  for(const file of row.files)if(!['passed','failed','skipped'].every(key=>file[key]===file.outcomes.filter(outcome=>key==='skipped'?!['passed','failed'].includes(outcome.status):outcome.status===key).length))fail('ARTIFACT_COUNTS');
  if(row.accepted&&(row.category!=='passed'||row.exitCode!==0||row.signal!==null||row.counts?.passed!==family.cases||row.files.length!==family.files.length))fail('ARTIFACT_ACCEPTANCE');
 }
 if(result.accepted!==result.families.every(row=>row.accepted))fail('ARTIFACT_ACCEPTANCE');return true;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const mode=['verify','artifacts','diagnose-optional-mounted'].includes(process.argv[2])?process.argv[2]:'run',options=parseArgs(process.argv.slice(mode==='run'?2:3));
  if(mode==='verify'){const p=verifyCheckouts(options);await loadMetadata(p.webRoot);process.stdout.write('FIVE_FAMILY_GATE_IMMUTABLE_CONTRACT_VERIFIED\n');}
  else if(mode==='artifacts'){validateArtifacts(options);process.stdout.write('FIVE_FAMILY_GATE_METADATA_ARTIFACTS_VERIFIED\n');}
  else{const accepted=await runGate(options,{},mode==='diagnose-optional-mounted'?'optional-mounted-diagnostic':'full');process.stdout.write(accepted?'FIVE_FAMILY_GATE_PASSED\n':'FIVE_FAMILY_GATE_NOT_ACCEPTED\n');if(!accepted)process.exitCode=1;}
 }catch{process.stderr.write('FIVE_FAMILY_GATE_FAILED; private source bodies and errors are not logged.\n');process.exitCode=1;}
}
