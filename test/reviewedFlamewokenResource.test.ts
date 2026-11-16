import { test } from 'node:test';
import assert from 'node:assert/strict';
import { materialize } from '../src/derive/catalogue.ts';
import { deriveStructured } from '../src/derive/structured/index.ts';
import { makeContext } from '../src/derive/structured/common.ts';

function derive(source:string,name='Flamewoken',namespace='kiwee-homebrew') {
  const body={feat:[{source,name,ENG_name:name,entries:['Unrelated fixture.']}]};
  const {rows}=materialize([{input:{namespace,path:'fixtures/feat.json',role:'catalog'},body}]);
  assert.equal(rows.length,1);
  return deriveStructured(rows[0],makeContext(rows));
}

test('invented text with the exact source and identity cannot grant the reviewed counter',()=>{
  const result=derive('HumblewoodTales');
  assert.equal(result.mechanics.resources,undefined);
  assert.ok(result.unsupported.some(gap=>gap.code==='unreviewed-flamewoken-fire-empowerment'));
});

test('same-name entries from another book are not accepted or marked as reviewed',()=>{
  const result=derive('HumblewoodCampaignSetting');
  assert.equal(result.mechanics.resources,undefined);
  assert.ok(!result.unsupported.some(gap=>gap.family==='reviewedFlamewokenResource'));
});

test('an unrelated name in the same book is unaffected',()=>{
  const result=derive('HumblewoodTales','Not a reviewed feat');
  assert.equal(result.mechanics.resources,undefined);
  assert.ok(!result.unsupported.some(gap=>gap.family==='reviewedFlamewokenResource'));
});

test('materialized identities distinguish identical from conflicting copies',()=>{
  const a={source:'HumblewoodTales',name:'Flamewoken',ENG_name:'Flamewoken',entries:['Fixture A.']};
  const b={...a,entries:['Fixture B.']};
  const rows=(feat:typeof a[])=>materialize([{input:{namespace:'kiwee-homebrew',path:'fixtures/feat.json',role:'catalog'},body:{feat}}]);
  const exact=rows([a,structuredClone(a)]);
  assert.equal(exact.rows.length,1);
  assert.equal(exact.rows[0].identityConflict,undefined);
  for(const inputs of [[a,b],[b,a]]) {
    const conflict=rows(inputs);
    assert.equal(conflict.rows.length,1);
    assert.equal(conflict.rows[0].identityConflict,true);
    assert.equal(conflict.diagnostics.filter(row=>row.code==='duplicate-conflict').length,1);
  }
});
