import {readFileSync} from 'node:fs';
import {expect,test} from 'vitest';
import {createIdentity} from '../src/identity.ts';
const fixture=JSON.parse(readFileSync('fixtures/shared/identity.json','utf8'));
test('shared browser/data identity cases preserve normalization, parent/edition/pack separation and invalid input',()=>{
 for(const [a,b]of fixture.same)expect(createIdentity(a).key).toBe(createIdentity(b).key);
 for(const [a,b]of fixture.different)expect(createIdentity(a).key).not.toBe(createIdentity(b).key);
 for(const input of fixture.invalid)expect(()=>createIdentity(input)).toThrow();
});
