import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { materialize } from '../src/derive/catalogue.ts';
import { deriveStructured } from '../src/derive/structured/index.ts';
import { makeContext } from '../src/derive/structured/common.ts';

const sha = '58226d6315b3e17c0c9746dba4b248b1d620b11fa21b12cf9e6d3b151873de4d';
const path = process.argv[2];
assert.ok(path, 'Pass the unmodified, externally obtained reviewed input JSON.');
const buf = readFileSync(path);
assert.equal(createHash('sha256').update(buf).digest('hex'), sha, 'Source bytes must match the reviewed input.');
const body = JSON.parse(buf.toString());
const { rows } = materialize([{input:{namespace:'kiwee-homebrew',path:'feats.json',role:'catalog',sha256:sha},body}]);
const ctx = makeContext(rows);
const key = 'kiwee-homebrew:feat:humblewoodtales:flamewoken::::::::';
const source = rows.filter(row => row.identity.key === key);
assert.equal(source.length, 1);
const result = deriveStructured(source[0], ctx);
assert.deepEqual(result.mechanics.resources, [{
  key:'flamewoken-fire-empowerment', max:{value:1},
  recovery:[{period:'short',amount:'all'},{period:'long',amount:'all'}],
}]);
assert.deepEqual(Object.keys(result.mechanics), ['resources']);
const deferred = new Set(result.unsupported.map(row => row.code));
for (const code of ['unresolved-proficiency','unresolved-spell-choice','flamewoken-fire-effect-and-spending-deferred','flamewoken-mundane-flame-manipulation-deferred']) assert.ok(deferred.has(code), code);
for (const row of rows.filter(row => row.identity.key !== key)) assert.ok(!deriveStructured(row,ctx).mechanics.resources?.some(resource => resource.key==='flamewoken-fire-empowerment'));
const raw = body.feat.find((feat: {ENG_name?: string; source?: string}) => feat.ENG_name === 'Flamewoken' && feat.source?.toLowerCase() === 'humblewoodtales');
assert.ok(raw);
const altered = {...raw,entries:['Unrelated fixture.']};
for (const feat of [[raw, altered],[altered, raw]]) {
  const dup = materialize([{input:{namespace:'kiwee-homebrew',path:'feats.json',role:'catalog',sha256:sha},body:{_meta:body._meta,feat}}]);
  const featRow = dup.rows.find(row=>row.identity.key===key);
  assert.ok(featRow);
  assert.ok(dup.diagnostics.some(row=>row.key===key&&row.code==='duplicate-conflict'));
  assert.equal(deriveStructured(featRow,makeContext(dup.rows)).mechanics.resources,undefined,'conflicting duplicates must fail closed independent of order');
}
const copies = materialize([{input:{namespace:'kiwee-homebrew',path:'feats.json',role:'catalog',sha256:sha},body:{_meta:body._meta,feat:[raw,structuredClone(raw)]}}]);
assert.equal(copies.rows.length,1);
assert.deepEqual(deriveStructured(copies.rows[0],makeContext(copies.rows)).mechanics.resources,result.mechanics.resources);
console.log(JSON.stringify({ inputSha256:sha, identity:key, checkedRows:rows.length, quota:result.mechanics.resources, deferred:[...deferred].sort() }));
