import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validateCoverage} from './report.ts';

/** An explicitly reviewed record digest permits new observations, never an
 * unbound delta, smaller inventory or loss of previous positive evidence. */
export function verifyReplayRecords(value:unknown,previousValue:unknown,expectedRecordsSha256?:string):void {
 const report=validateCoverage(value),previous=validateCoverage(previousValue);
 assert.equal(report.snapshotSha256,previous.snapshotSha256,'Replay snapshot changed');
 assert.deepEqual(report.inputs,previous.inputs,'Replay inputs changed');
 assert.deepEqual(report.records.map(({id,source,reviewed})=>({id,source,reviewed})),previous.records.map(({id,source,reviewed})=>({id,source,reviewed})),'Replay inventory identities or review state changed');
 for(let index=0;index<previous.records.length;index++)if(previous.records[index].status==='implemented')assert.equal(report.records[index].status,'implemented','Replay lost previous positive evidence');
 if(expectedRecordsSha256){
  assert.match(expectedRecordsSha256,/^[a-f0-9]{64}$/,'Invalid reviewed records digest');
  const actual=createHash('sha256').update(JSON.stringify(report.records)).digest('hex');
  assert.equal(actual,expectedRecordsSha256,'Replay differs from reviewed records digest');
 }else assert.deepEqual(report.records,previous.records,'Replay records differ without a reviewed digest');
}
