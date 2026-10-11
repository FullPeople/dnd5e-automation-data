import { expect, test } from 'vitest';
import { createIdentity } from '../src/identity.ts';
import { deriveStructured } from '../src/derive/structured/index.ts';
import { makeContext } from '../src/derive/structured/common.ts';
import { deriveCorpus } from '../src/derive/index.ts';
import { inventory } from '../src/report/inventory.ts';
import { validateAutomation } from '../src/validate/index.ts';
import type { Material, Raw } from '../src/derive/catalogue.ts';
import type { InputManifest } from '../src/fetch/manifest.ts';

const material = (raw: Raw, kind = 'class'): Material => {
  const source = raw.source ?? 'XPHB';
  return { identity: createIdentity({ kind, source, engName: raw.ENG_name ?? 'Synthetic Class' }),
    raw, namespace: 'kiwee', files: ['data/synthetic.json'], expansion: 'source',
    edition: source === 'XPHB' ? '2024' : source === 'PHB' ? '2014' : raw.edition };
};
const pool = ['SYNTHETIC', 'SYNTHETIC', 'OTHER', 'EB', 'G', 'G'].map((category, index) => material({ ENG_name: `Synthetic Feat ${index}`, source: 'XPHB', category }, 'feat'));
const options = (categories: string[]) => pool.filter(row => categories.includes(row.raw.category)).map(row => row.identity.key).sort();
const run = (featProgression: unknown, catalogue = pool) => {
  const row = material({ featProgression });
  return deriveStructured(row, makeContext([row, ...catalogue]));
};
const shape = { family: 'featGrant', code: 'feat-progression-shape', ref: 'featProgression' };
const eligibility = { family: 'featGrant', code: 'feat-progression-eligibility', ref: 'featProgression' };

test('source-declared feat quotas are independent level grants, not a cumulative optional quota', () => {
  const out = run([{ name: 'Original synthetic title', category: ['SYNTHETIC', 'OTHER'], progression: { 17: 3, 4: 1, 9: 2 } }]);
  expect(out.handled.has('featProgression')).toBe(true);
  expect(out.mechanics.grants).toEqual([4, 9, 17].map((level, index) => ({
    type: 'feat', key: `featProgression:0:${level}`, atLevel: level,
    choose: { count: index + 1, from: options(['SYNTHETIC', 'OTHER']) },
  })));
  expect(out.unsupported).toEqual([eligibility]);
  expect(Object.keys(out.mechanics)).toEqual(['grants']);
});

test.each([
  { category: ['EB'], progression: { 19: 1 } },
  { category: ['G'], progression: { 6: 2 } },
])('declares $category quotas without granting abilities or proving feat eligibility', group => {
  const out = run([group]);
  expect(out.mechanics.grants).toHaveLength(1);
  expect(out.mechanics.grants![0].choose?.from).toEqual(options(group.category));
  expect(out.unsupported).toEqual([eligibility]);
  expect(out.mechanics.modifiers).toBeUndefined();
  expect(out.mechanics.grants![0].fixed).toBeUndefined();
});

test.each([
  ['non-array outer field', {}], ['null group', [null]], ['hole group', Array(1)],
  ['missing categories', [{ progression: { 4: 1 } }]],
  ['empty categories', [{ category: [], progression: { 4: 1 } }]],
  ['mixed categories', [{ category: ['EB', 1], progression: { 4: 1 } }]],
  ['hole category', [{ category: Array(1), progression: { 4: 1 } }]],
  ['prose category', [{ category: ['Unknown synthetic prose'], progression: { 4: 1 } }]],
  ['missing progression', [{ category: ['EB'] }]],
  ['empty progression', [{ category: ['EB'], progression: {} }]],
  ['array progression', [{ category: ['EB'], progression: [0, 1] }]],
  ['unknown condition', [{ category: ['EB'], progression: { 4: 1 }, required: { ability: 13 } }]],
  ...['*', '0', '21', '4.5', '04', '4e0'].map(level => [`invalid level ${level}`, [{ category: ['EB'], progression: { [level]: 1 } }]]),
  ...[null, '1', 1.5, -1, 101].map(count => [`invalid count ${count}`, [{ category: ['EB'], progression: { 4: 1, 9: count } }]]),
])('retains a visible gap for %s and emits no partial feat grant', (_label, field) => {
  const out = run(field);
  expect(out.handled.has('featProgression')).toBe(true);
  expect(out.unsupported).toEqual([shape]);
  expect(out.mechanics.grants).toBeUndefined();
});

test('invalid groups stay local, and zero quotas never fabricate a grant', () => {
  const out = run([
    { category: ['EB'], progression: { 4: 1, 9: 'bad' } },
    { category: ['G'], progression: { 2: 0, 7: 2 } },
    { category: ['EB'], progression: { 19: 0 } },
  ]);
  expect(out.mechanics.grants).toEqual([{ type: 'feat', key: 'featProgression:1:7', atLevel: 7, choose: { count: 2, from: options(['G']) } }]);
  expect(out.unsupported).toEqual([shape, eligibility]);
  expect(run([{ category: ['EB'], progression: { 19: 0 } }]).mechanics).toEqual({});
  expect(run([]).mechanics).toEqual({});
});

test('existing fixed feat grants and wildcard optional quotas keep distinct keys and semantics', () => {
  const row = material({ feats: [{ any: 1 }], optionalfeatureProgression: [{ featureType: ['EI'], progression: { '*': 1, 3: 2 } }], featProgression: [{ category: ['G'], progression: { 5: 1 } }] });
  const out = deriveStructured(row, makeContext([row, ...pool]));
  expect(out.mechanics.grants!.map(grant => grant.key)).toEqual(['optionalfeature:0', 'feats:0', 'featProgression:0:5']);
  expect(out.mechanics.grants![0].choiceProgression).toEqual([{ level: 0, count: 1 }, { level: 3, count: 2 }]);
  expect(out.mechanics.grants![1].choose).toEqual({ count: 1, filter: { kind: 'feat' } });
  expect(out.mechanics.grants![2].choiceProgression).toBeUndefined();
});

test('derivation leaves frozen source data and published option arrays independent', () => {
  const raw = { featProgression: [{ category: ['EB'], progression: { 19: 1 } }] }, before = structuredClone(raw);
  const freeze = (value: any): void => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } };
  freeze(raw);
  const row = material(raw), out = deriveStructured(row, makeContext([row, ...pool]));
  expect(out.mechanics.grants).toHaveLength(1);
  out.mechanics.grants![0].choose!.from!.push('synthetic-independent-output');
  expect(raw).toEqual(before);
});

test('candidate identities are deduplicated and limited by kind, namespace, category and edition', () => {
  const eligible = pool.find(row => row.raw.category === 'EB')!;
  const old = material({ ENG_name: 'Synthetic Old Feat', source: 'PHB', category: 'EB' }, 'feat');
  const unknown = material({ ENG_name: 'Synthetic Unversioned Feat', source: 'EXT', category: 'EB' }, 'feat');
  const external = { ...eligible, namespace: 'kiwee-homebrew', identity: createIdentity({ kind: 'feat', source: 'XPHB', engName: 'Synthetic External Feat', packId: 'kiwee-homebrew' }) };
  const feature = material({ ENG_name: 'Synthetic Wrong Kind', source: 'XPHB', category: 'EB' }, 'optionalfeature');
  const out = run([{ category: ['EB'], progression: { 19: 1 } }], [eligible, eligible, old, unknown, external, feature, ...pool.filter(row => row.raw.category !== 'EB')]);
  expect(out.mechanics.grants![0].choose?.from).toEqual([eligible.identity.key]);
});

test('missing or undersized candidate catalogues retain a gap without partial grants', () => {
  for (const groups of [[{ category: ['UNKNOWN'], progression: { 4: 1 } }], [{ category: ['EB'], progression: { 4: 1, 9: 2 } }]]) {
    const out = run(groups);
    expect(out.mechanics.grants).toBeUndefined();
    expect(out.unsupported).toEqual([{ family: 'featGrant', code: 'feat-progression-catalogue', ref: 'featProgression' }]);
  }
});

test('an extension class without a proven edition does not borrow a modern feat pool', () => {
  const row = material({ ENG_name: 'Synthetic Unknown Class', source: 'EFA', featProgression: [{ category: ['EB'], progression: { 19: 1 } }] });
  const out = deriveStructured(row, makeContext([row, ...pool]));
  expect(out.mechanics.grants).toBeUndefined();
  expect(out.unsupported).toEqual([{ family: 'featGrant', code: 'feat-progression-edition', ref: 'featProgression' }]);
});

test('a feat carrying a class-shaped field cannot fabricate another level grant', () => {
  const row = material({ ENG_name: 'Synthetic Wrong Owner', featProgression: [{ category: ['EB'], progression: { 19: 1 } }] }, 'feat');
  const out = deriveStructured(row, makeContext([row, ...pool]));
  expect(out.mechanics.grants).toBeUndefined();
  expect(out.unsupported).toEqual([shape]);
});

test('inventory recognizes the field and corpus output remains a validated annotation draft', () => {
  const body = { class: [{ ENG_name: 'Synthetic New Class', source: 'XPHB', featProgression: [{ category: ['EB'], progression: { 19: 1 } }] }], feat: pool.map(row => row.raw) };
  const input: InputManifest['inputs'][number] = { namespace: 'kiwee', path: 'data/synthetic.json', role: 'catalog', url: 'https://example.org/data/synthetic.json', sha256: 'a'.repeat(64), bytes: 100, fetchedAt: '2026-10-11T00:00:00Z' };
  const files = [{ input, body }], manifest = { toolVersion: 'synthetic', inputs: [input] };
  const observed = inventory(files, manifest);
  expect(observed.entries.find(row => row.identity.kind === 'class')).toMatchObject({ verdict: 'structuredCandidate', structuredFields: ['featProgression'] });
  const envelope = deriveCorpus(files, manifest).envelope;
  expect(envelope.records).toHaveLength(1 + pool.length);
  const owner = envelope.records.find(row => row.identity.kind === 'class')!;
  expect(owner).toMatchObject({ verdict: 'needsAnnotation', autoGenerated: true, edition: '2024', unsupported: [eligibility] });
  expect(owner.mechanics?.grants).toHaveLength(1);
  envelope.versionLock.kiweeChangelogDate = '2026-10-11';
  envelope.versionLock.foundryMigrationVersion = [3];
  expect(() => validateAutomation(envelope)).not.toThrow();
});
