import {it,expect} from 'vitest';
import {ordinarySlotLedgerAfterDebit} from '../src/runtimeCoverage/ordinarySlotLedger.ts';
function state(){return {version:1,seen:['spell-slot:1','spell-slot:2'],previous:{'spell-slot:1':4,'spell-slot:2':2},pending:{},balances:{'spell-slot:1':{spent:2,max:4,current:2},'spell-slot:2':{spent:2,max:2,current:0}},lastConfirmation:{id:'authored-prior-confirmation'}};}
it('expects the exact one-unit ledger transition, preserving every other field and the original before-state',()=>{
 const value=state(),before=structuredClone(value),next=ordinarySlotLedgerAfterDebit(value,'spell-slot:1',{max:4,current:2},{max:4,current:1});expect(value).toEqual(before);expect(next).toEqual({...before,balances:{...before.balances,'spell-slot:1':{spent:3,max:4,current:1}}});
});
it.each(['future','unknown-member','pending','missing','bad-spent','bad-current','extra-projection','two-debits','capacity-change','exhausted'] as const)('rejects %s rather than relaxing the accounting contract',mode=>{
 const value:any=state(),before={max:4,current:2},after={max:4,current:1};
 if(mode==='future')value.version=2;if(mode==='unknown-member')value.authoredFuture=true;if(mode==='pending')value.pending['spell-slot:1']={max:4};if(mode==='missing')delete value.balances['spell-slot:1'];if(mode==='bad-spent')value.balances['spell-slot:1'].spent=0;if(mode==='bad-current')value.balances['spell-slot:1'].current=3;if(mode==='extra-projection')value.balances['spell-slot:1'].extra=true;if(mode==='two-debits')after.current=0;if(mode==='capacity-change')after.max=5;if(mode==='exhausted'){before.current=0;after.current=-1;}
 const untouched=structuredClone(value);expect(()=>ordinarySlotLedgerAfterDebit(value,'spell-slot:1',before,after)).toThrow();expect(value).toEqual(untouched);
});
