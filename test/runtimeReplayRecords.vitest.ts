import {expect,it} from 'vitest';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {verifyReplayRecords} from '../src/runtimeCoverage/replayRecords.ts';
const original=()=>JSON.parse(readFileSync('reports/progress/runtime-coverage.json','utf8'));
const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function positive(){const previous=original(),report=structuredClone(previous),row=report.records.find((row:any)=>row.status==='manual');row.status='implemented';row.witness={kind:'source-spell-choice',level:1,edition:'2014',before:[],after:['authored:spell']};report.implemented++;report.sources.find((source:any)=>source.id===row.source).implemented++;return {previous,report};}
it('keeps unchanged-record replay as the default and rejects an unreviewed new observation',()=>{
 const {previous,report}=positive();expect(()=>verifyReplayRecords(previous,previous)).not.toThrow();expect(()=>verifyReplayRecords(report,previous)).toThrow('records differ');
});
it('accepts a complete validated record array only with its exact reviewed digest',()=>{
 const {previous,report}=positive();expect(()=>verifyReplayRecords(report,previous,digest(report.records))).not.toThrow();expect(()=>verifyReplayRecords(report,previous,'0'.repeat(64))).toThrow('digest');
});
it('rejects changed record identity, source or review state even when its digest matches',()=>{
 for(const field of ['id','source','reviewed']){const {previous,report}=positive();report.records[0][field]=field==='reviewed'?!report.records[0][field]:'authored:changed';expect(()=>verifyReplayRecords(report,previous,digest(report.records))).toThrow();}
});
it('rejects dropping previous execution evidence even with a matching digest and recalculated totals',()=>{
 const previous=original(),report=structuredClone(previous),row=report.records.find((row:any)=>row.status==='implemented');delete row.witness;row.status='manual';report.implemented--;report.sources.find((source:any)=>source.id===row.source).implemented--;expect(()=>verifyReplayRecords(report,previous,digest(report.records))).toThrow('previous positive');
});
it('rejects denominator changes and invalid witnesses even with a matching digest',()=>{
 const {previous,report}=positive();report.records.pop();expect(()=>verifyReplayRecords(report,previous,digest(report.records))).toThrow();const other=positive();const changed=other.report.records.find((row:any)=>row.witness?.after?.[0]==='authored:spell');changed.witness.after=[];expect(()=>verifyReplayRecords(other.report,other.previous,digest(other.report.records))).toThrow();
});
it('rejects changed input pins or snapshot bindings and malformed digest arguments',()=>{
 const {previous,report}=positive();report.inputs[0].sha256='0'.repeat(64);expect(()=>verifyReplayRecords(report,previous,digest(report.records))).toThrow('inputs');const other=positive();other.report.snapshotSha256='0'.repeat(64);expect(()=>verifyReplayRecords(other.report,other.previous,digest(other.report.records))).toThrow('snapshot');expect(()=>verifyReplayRecords(previous,previous,'invalid')).toThrow('digest');
});
