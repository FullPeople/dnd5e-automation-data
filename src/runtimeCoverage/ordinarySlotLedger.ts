import assert from 'node:assert/strict';
const plain=(v:unknown):v is Record<string,any>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
const count=(v:unknown)=>Number.isSafeInteger(v)&&Number(v)>=0;
/** Independent expectation for exactly one paid ordinary slot. Every other
 * ledger member remains part of the original strict whole-character check. */
export function ordinarySlotLedgerAfterDebit(value:unknown,id:string,before:{max:number;current:number},after:{max:number;current:number}){
 assert(plain(value)&&value.version===1,'Unknown ordinary slot balance contract');
 assert(Object.keys(value).every(k=>['version','seen','previous','pending','balances','lastConfirmation'].includes(k)),'Unknown ordinary balance member');
 assert(/^spell-slot:[1-9]$/.test(id)&&Array.isArray(value.seen)&&value.seen.filter((x:unknown)=>x===id).length===1&&plain(value.previous)&&plain(value.pending)&&!Object.hasOwn(value.pending,id)&&plain(value.balances),'Unconfirmed ordinary slot ledger');
 assert([before.max,before.current,after.max,after.current].every(count)&&before.current>0&&before.current<=before.max&&after.max===before.max&&after.current===before.current-1,'Expected exactly one ordinary slot debit');
 const row=value.balances[id];assert(plain(row)&&Object.keys(row).length===3&&['spent','max','current'].every(k=>Object.hasOwn(row,k))&&[row.spent,row.max,row.current].every(count)&&row.max===before.max&&row.current===before.current&&row.spent===before.max-before.current,'Prior ordinary balance projection is inconsistent');
 const next=structuredClone(value);next.balances[id]={spent:row.spent+1,max:after.max,current:after.current};return next;
}
