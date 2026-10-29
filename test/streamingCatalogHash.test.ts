import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {streamingJsonSha256} from './helpers/streamingJsonHash.ts';
const direct=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
test('ordered plain-JSON catalog streaming hashes exactly the original JSON.stringify bytes',()=>{
 const samples:unknown[]=[[],[null,true,false,0,-0,1.25],['authored 中文','💡','quote"','line\n'],[{raw:{z:2,a:1},entries:[{type:'authored',items:['a','b']}]}],[{10:'ten',2:'two',a:undefined,b:null},undefined],[[],[1,[2,null]],{}],{item:[{name:'authored',entries:['sentinel']}]}];
 const holes:any[]=[];holes.length=3;holes[1]={source:'AUTHORED'};samples.push(holes);
 for(const value of samples)assert.equal(streamingJsonSha256(value),direct(value));
 assert.notEqual(streamingJsonSha256([{a:1},{a:2}]),streamingJsonSha256([{a:2},{a:1}]));
});
