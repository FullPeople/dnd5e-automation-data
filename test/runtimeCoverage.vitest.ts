import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import {validateCoverage} from '../src/runtimeCoverage/report.ts';
const original=()=>JSON.parse(readFileSync('reports/progress/runtime-coverage.json','utf8'));
describe('current consumer coverage ledger',()=>{
 it('covers every locked identity once, without promoting historical complete flags',()=>{const r=validateCoverage(original()),s=JSON.parse(readFileSync('reports/progress/automation-rule-status.json','utf8'));expect(r.snapshotSha256).toBe(createHash('sha256').update(readFileSync('reports/progress/automation-rule-status.json')).digest('hex'));expect(r.records.map(x=>x.id)).toEqual(s.records.map((x:any)=>x.id));expect(r.total).toBe(18789);expect(r.reviewed).toBe(4561);expect(r.implemented).toBe(r.records.filter(x=>x.witness).length);});
 it('rejects a count changed without item-level observations',()=>{const r=original();r.implemented++;expect(()=>validateCoverage(r)).toThrow('derived counts');});
 it('rejects duplicate identities, preserving namespace and parent distinctions',()=>{const r=original();r.records[1]=r.records[0];expect(()=>validateCoverage(r)).toThrow('one record');});
 it('rejects an empty observation or a payload-only historical completion',()=>{const r=original(),row=r.records.find((x:any)=>x.status==='implemented');row.witness.after=row.witness.before;expect(()=>validateCoverage(r)).toThrow('observed');});
 it('rejects unsafe inputs and runtime module paths',()=>{const r=original();r.consumer.modules[0].path='src/../../player-data.json';expect(()=>validateCoverage(r)).toThrow('modules');});
 it('recomputes expansion percentages from item counts',()=>{const r=original();r.sources[0].implemented++;expect(()=>validateCoverage(r)).toThrow('source totals');});
});
