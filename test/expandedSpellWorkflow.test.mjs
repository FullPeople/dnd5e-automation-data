import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join,resolve} from 'node:path';

// Workflow infrastructure only. No runner/collector import, original body,
// Web test discovery/execution, dependency installation or network request.
const root=fileURLToPath(new URL('../',import.meta.url)),path=join(root,'.github/workflows/expanded-spell-source.yml');
const yaml=existsSync(path)?readFileSync(path,'utf8'):'';
const current='b416732093ad17d3f5ef269379fbaab1b4499021',old='4069886e1bfcab2fb7e2958eca8919601a13dd62';
const branch='codex/cloud-rules-eighteen-family-source-gate-20261028';
const args=['--web-root','.cache/expanded-spell-web','--output','.cache/expanded-spell-inputs','--receipt','expanded-spell-source-evidence/inputs.json','--result','expanded-spell-source-evidence/gate.json'];
const artifacts=['inputs.json','side-sources.json','collection.json','gate.json'].map(name=>'expanded-spell-source-evidence/'+name);
const blocks=()=>yaml.split(/(?=^      - )/m).slice(1);
function field(block,name,depth){const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),prefix=depth===undefined?'[ \\t]*(?:-[ \\t]*)?':' {'+depth+'}',matches=[...block.matchAll(new RegExp('^'+prefix+escaped+':[ \\t]*([^\\n]*)$','gm'))];assert.ok(matches.length<=1,'duplicate workflow field');return matches[0]?.[1].trim();}
function script(block){const match=block.match(/^        run: \|\n([\s\S]*)$/m);return match?match[1].split('\n').map(line=>line.startsWith('          ')?line.slice(10):line).join('\n').trim():field(block,'run');}
function gateCommand(block){const body=script(block);assert.ok(body,'missing gate script');assert.match(body,/^set -euo pipefail\n/);const lines=body.replace(/\\\n\s*/g,' ').split('\n').map(line=>line.trim()).filter(Boolean);assert.equal(lines.length,2,'gate script must not contain hidden extra commands');const tokens=lines[1].split(/\s+/);assert.deepEqual(tokens.slice(0,2),['node','scripts/expanded_spell_source_gate.mjs']);const mode=['verify','artifacts'].includes(tokens[2])?tokens[2]:undefined;assert.deepEqual(tokens.slice(mode?3:2),args);return {mode,body};}
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

test('separate eighteen-family workflow has only the approved branch/manual triggers and read-only job authority',()=>{
 assert.ok(yaml,'expanded workflow is not yet authored');assert.match(yaml,/^name: Pinned eighteen-family Web source and mounted gate$/m);assert.match(yaml,new RegExp("^    branches: \\['"+branch+"'\\]$",'m'));assert.match(yaml,/^  workflow_dispatch:\s*$/m);
 const permission=yaml.match(/^permissions:\n((?:  [^\n]+\n)+)/m);assert.ok(permission);assert.deepEqual(permission[1].trim().split('\n').map(line=>line.trim()),['contents: read']);assert.match(yaml,/^    timeout-minutes: 30$/m);assert.match(yaml,/^    runs-on: ubuntu-latest$/m);
 assert.ok(!/pull_request_target|repository_dispatch|workflow_call|schedule:|secrets\.|continue-on-error|\b(?:contents|actions|checks|deployments|id-token|packages|pull-requests|security-events|statuses):\s*write\b/.test(yaml));
});

test('three checkouts use current Data HEAD full history and exact current/406 Web commits with no persisted credentials',()=>{
 const checkouts=blocks().filter(block=>field(block,'uses')==='actions/checkout@v4');assert.equal(checkouts.length,3);const [data,web,legacy]=checkouts;assert.equal(field(data,'fetch-depth'),'0');assert.equal(field(data,'repository'),undefined);assert.equal(field(data,'ref'),undefined);assert.equal(field(data,'path'),undefined);
 for(const [block,revision,directory]of [[web,current,'.cache/expanded-spell-web'],[legacy,old,'.cache/expanded-spell-old-web']]){assert.equal(field(block,'repository'),'FullPeople/DND-card-web');assert.equal(field(block,'ref'),revision);assert.equal(field(block,'path'),directory);assert.equal(field(block,'sparse-checkout'),undefined);}
 for(const block of checkouts){assert.equal(field(block,'persist-credentials'),'false');assert.equal(field(block,'token'),undefined);assert.equal(field(block,'ssh-key'),undefined);}assert.ok(!/ref:\s*(?:main|master|latest|\$\{)/.test(yaml));
});

test('fixed Node and immutable verification precede the only normal locked current-Web npm ci',()=>{
 const steps=blocks();assert.equal(steps.length,9);const node=steps.findIndex(block=>field(block,'uses')==='actions/setup-node@v4');assert.ok(node>=0);assert.equal(field(steps[node],'node-version'),"'22.14.0'");
 const gates=steps.map((block,index)=>({block,index})).filter(({block})=>script(block)?.includes('scripts/expanded_spell_source_gate.mjs'));assert.equal(gates.length,3);assert.deepEqual(gates.map(({block})=>gateCommand(block).mode),['verify',undefined,'artifacts']);
 const installs=steps.map((block,index)=>({command:script(block),index})).filter(({command})=>command?.startsWith('npm '));assert.deepEqual(installs.map(({command})=>command),['npm ci --prefix .cache/expanded-spell-web']);assert.ok(node<gates[0].index&&gates[0].index<installs[0].index&&installs[0].index<gates[1].index&&gates[1].index<gates[2].index);
 assert.ok(!/npm install|npx\s|npm ci[^\n]*expanded-spell-old-web|--(?:testTimeout|hookTimeout|maxWorkers|retry)=/.test(yaml));
});

test('actual run shell propagates a failed gate exit without a fallback, success override or swallowed pipe status',()=>{
 const run=blocks().filter(block=>script(block)?.includes('scripts/expanded_spell_source_gate.mjs')).find(block=>gateCommand(block).mode===undefined);assert.ok(run);assert.equal(field(run,'if'),undefined);assert.equal(field(run,'continue-on-error'),undefined);const {body}=gateCommand(run);assert.ok(!/\|\||\|\s*tee|set \+e|exit 0|&&\s*true/.test(body));
 // Substitute only this one command with an authored failure. Never execute
 // the runner or collect/run any Web tests during this infrastructure check.
 const authored=body.replace(/\\\n\s*/g,' ').replace(/^node scripts\/expanded_spell_source_gate\.mjs[^\n]*$/m,'exit 23');assert.ok(!authored.includes('expanded_spell_source_gate.mjs'));const result=spawnSync('bash',['-c',authored],{encoding:'utf8',timeout:5000});assert.equal(result.status,23);assert.equal(result.signal,null);assert.equal(result.stdout,'');assert.equal(result.stderr,'');
});

test('always-on finalizer validates setup/unknown envelopes before uploading exactly four metadata receipts',()=>{
 const steps=blocks(),finalizer=steps.find(block=>field(block,'id')==='artifacts');assert.ok(finalizer);assert.equal(field(finalizer,'if'),'always()');assert.equal(gateCommand(finalizer).mode,'artifacts');assert.equal(field(finalizer,'continue-on-error'),undefined);
 const uploads=steps.filter(block=>field(block,'uses')==='actions/upload-artifact@v4');assert.equal(uploads.length,1);const upload=uploads[0];assert.equal(field(upload,'if'),"always() && steps.artifacts.outcome == 'success'");assert.ok(steps.indexOf(finalizer)<steps.indexOf(upload));assert.equal(field(upload,'name',10),'expanded-spell-source-${{ github.sha }}');assert.equal(field(upload,'if-no-files-found'),'error');assert.equal(field(upload,'retention-days'),'7');
 const list=upload.match(/^          path: \|\n((?:            [^\n]+\n)+)/m);assert.ok(list);assert.deepEqual(list[1].trim().split('\n').map(line=>line.trim()),artifacts);assert.equal(field(upload,'include-hidden-files'),undefined);assert.ok(!artifacts.some(path=>/\.log$|\.cache|\.zip$|\*|\.\./.test(path)));
});

test('workflow stays a technical source/mounted gate and preserves the old gate, build, producer report and locks byte-for-byte',()=>{
 assert.match(yaml,/# Technical source and mounted coverage only; no runtime-pair, full-App or whole-entry credit\./);
 const build=readFileSync(resolve(root,'.github/workflows/build.yml'),'utf8');assert.match(build,/^  pipeline:\n    if: github\.event_name == 'workflow_dispatch' \|\| github\.event_name == 'schedule'$/m);
 const protectedFiles={'.github/workflows/build.yml':'0439991a8f0c968955fa894206155f59f87dba71659c1a73c4ee3d009aec608e','.github/workflows/five-family-source.yml':'af193d8ab9b484b120642acc03e0e281c475c911dec853178fe8875103abfb71','scripts/five_family_source_gate.mjs':'a072eab222cc09f526924ef9a4d118172b3ba3cf5cf7bb11bec698117d7c893d','scripts/five_family_source_contract.json':'715f9061233bc8c7b6735bfa3d7d80fcec4345d56d8d2a299f600543d3729012','scripts/five_family_network_guard.cjs':'84f08bbd7aaa29a85028bc6a9f8724f8715eaccfdd02e8aa1e9f27d953182a2e','test/fiveFamilySourceGate.test.mjs':'5c850c61f3795979a554909e438931931a5db836045058a472d389aa3da1cb8a','package.json':'cbe1b37d3c088094a7bb6dad69ab14555a6338029f54409f5c965d60879383b2','package-lock.json':'a92f3cb812676b4c7be27ec589fd0c7489402578b5c524873f38c10e9f1c587a','reports/progress/runtime-coverage.json':'cc6694329697a250bbf95b71a491705d8588069ef44854bc6b5f016cfe4685c8'};
 for(const [file,expected]of Object.entries(protectedFiles))assert.equal(sha(readFileSync(resolve(root,file))),expected,file);assert.ok(!/five_family_source_gate\.mjs|build\.yml|deploy|git push|git commit|curl |wget |sourceBodies|\.local-evidence/.test(yaml));
});
