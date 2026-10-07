import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {verifyConsumerBytes} from '../src/runtimeCoverage/consumerBytes.ts';
import type {CoverageReport} from '../src/runtimeCoverage/report.ts';
const sha=(text:string)=>createHash('sha256').update(text).digest('hex');
describe('CI verifies the actual pinned consumer bytes',()=>{
 let root:string,web:string,report:CoverageReport;
 beforeEach(()=>{
  root=mkdtempSync(join(tmpdir(),'consumer-bytes-'));web=join(root,'web');mkdirSync(join(web,'src'),{recursive:true});
  writeFileSync(join(web,'src/probe.ts'),'export const probe = 1;\n');
  const git=(args:string[])=>execFileSync('git',args,{cwd:web,stdio:'pipe'}).toString().trim();
  git(['init','-q']);git(['add','src/probe.ts']);
  git(['-c','user.name=Consumer verification fixture','-c','user.email=fixture@example.invalid','commit','-qm','Synthetic consumer fixture']);
  report={schemaVersion:1,definition:'at least one current calculation or usable choice; remaining effects are manual',updatedAt:'2026-10-07T00:00:00Z',consumer:{repository:'FullPeople/DND-card-web',revision:git(['rev-parse','HEAD']),modules:[{path:'src/probe.ts',sha256:sha(readFileSync(join(web,'src/probe.ts'),'utf8'))}]},snapshotSha256:'0'.repeat(64),inputs:[{url:'https://5e.kiwee.top/data/fixture.json',sha256:'0'.repeat(64)}],total:0,reviewed:0,implemented:0,unresolved:0,unavailable:0,sources:[],records:[]};
 });
 afterEach(()=>rmSync(root,{recursive:true,force:true}));
 it('accepts matching working and committed bytes without modifying the ledger',()=>{const before=JSON.stringify(report);expect(verifyConsumerBytes(report,web)).toEqual({repository:report.consumer.repository,revision:report.consumer.revision,modules:1});expect(JSON.stringify(report)).toBe(before);});
 it('rejects a different checked-out revision',()=>{report.consumer.revision='0'.repeat(40);expect(()=>verifyConsumerBytes(report,web)).toThrow('revision');});
 it('rejects modified working bytes at the correct revision',()=>{writeFileSync(join(web,'src/probe.ts'),'export const probe = 2;\n');expect(()=>verifyConsumerBytes(report,web)).toThrow('working bytes');});
 it('also rejects a forged hash matching only modified working bytes',()=>{const changed='export const probe = 2;\n';writeFileSync(join(web,'src/probe.ts'),changed);report.consumer.modules[0].sha256=sha(changed);expect(()=>verifyConsumerBytes(report,web)).toThrow('committed bytes');});
 it('rejects a missing module',()=>{rmSync(join(web,'src/probe.ts'));expect(()=>verifyConsumerBytes(report,web)).toThrow('ENOENT');});
 it('rejects symlink reads even when the external bytes match',()=>{
  const bytes=readFileSync(join(web,'src/probe.ts'));
  if(process.platform==='win32'){
   const target=join(root,'external');mkdirSync(target);writeFileSync(join(target,'probe.ts'),bytes);
   rmSync(join(web,'src'),{recursive:true});symlinkSync(target,join(web,'src'),'junction');
  }else{
   const target=join(root,'external.ts');writeFileSync(target,bytes);rmSync(join(web,'src/probe.ts'));symlinkSync(target,join(web,'src/probe.ts'),'file');
  }
  expect(()=>verifyConsumerBytes(report,web)).toThrow('Symlink');
 });
 it('rejects duplicate and unsafe module paths before executing a probe',()=>{report.consumer.modules.push({...report.consumer.modules[0]});expect(()=>verifyConsumerBytes(report,web)).toThrow('consumer modules');report.consumer.modules.pop();report.consumer.modules[0].path='src/../external.ts';expect(()=>verifyConsumerBytes(report,web)).toThrow('consumer modules');report.consumer.modules[0].path='src/./probe.ts';expect(()=>verifyConsumerBytes(report,web)).toThrow('Unsafe');});
 it('rejects a directory nested inside another checkout as the root',()=>{expect(()=>verifyConsumerBytes(report,join(web,'src'))).toThrow('checkout root');});
});
