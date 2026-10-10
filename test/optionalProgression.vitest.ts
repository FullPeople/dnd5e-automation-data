import { expect, test } from 'vitest';
import { createIdentity } from '../src/identity.ts';
import { deriveStructured } from '../src/derive/structured/index.ts';
import { makeContext } from '../src/derive/structured/common.ts';
import { deriveCorpus } from '../src/derive/index.ts';
import { validateAutomation } from '../src/validate/index.ts';
import type { Material, Raw } from '../src/derive/catalogue.ts';
import type { InputManifest } from '../src/fetch/manifest.ts';

// Original synthetic quotas, not copied source tables. Production never pads arrays.
const full = (prefix: number[]) => [...prefix, ...Array(20 - prefix.length).fill(prefix.at(-1) ?? 0)];
const material = (raw: Raw, kind = 'class'): Material => ({
  identity: createIdentity({ kind, source: raw.source ?? 'PHB', engName: raw.ENG_name ?? 'Synthetic Class' }),
  raw, namespace: 'kiwee', files: ['data/synthetic.json'], expansion: 'source',
});
const run = (groups: unknown[]) => {
  const row = material({ optionalfeatureProgression: groups });
  return deriveStructured(row, makeContext([row]));
};
const gap = { family: 'featureProgression', code: 'optional-progression-shape', ref: 'optionalfeatureProgression' };

test.each([
  { label: 'AI with a level-2 start', type: 'AI', counts: full([0, 3, 3, 5]), firstLevel: 2, firstCount: 3 },
  { label: 'legacy EI with a level-2 start', type: 'EI', counts: full([0, 1, 1, 2]), firstLevel: 2, firstCount: 1 },
  { label: 'updated EI with a level-1 start', type: 'EI', counts: full([2, 2, 4]), firstLevel: 1, firstCount: 2 },
])('$label declares one cumulative quota across all 20 levels', ({ type, counts, firstLevel, firstCount }) => {
  const out = run([{ featureType: [type], progression: counts }]);
  expect(out.unsupported).toEqual([]);
  expect(out.mechanics.grants).toEqual([{
    type: 'feature', key: 'optionalfeature:0', atLevel: firstLevel,
    choose: { count: firstCount, filter: { kind: 'optionalfeature', featureType: [type] } },
    choiceProgression: counts.map((count, index) => ({ level: index + 1, count })),
  }]);
  // Repeated levels retain their declared total; zero remains an explicit zero.
  expect(out.mechanics.grants![0].choiceProgression![19].count).toBe(counts[19]);
  expect(Object.keys(out.mechanics)).toEqual(['grants']);
});

test.each([
  ['empty', []], ['short positive', [0, 3, 3]], ['19 levels', Array(19).fill(1)],
  ['21 levels', Array(21).fill(1)], ['hole', Array(20)],
  ...[null, undefined, '2', 1.5, -1, 101, NaN, Infinity, {}].map(value => [String(value), [...Array(19).fill(1), value]]),
])('rejects the entire %s array instead of retaining a partial quota', (_label, progression) => {
  const out = run([{ featureType: ['AI'], progression }]);
  expect(out.mechanics.grants).toBeUndefined();
  expect(out.unsupported).toContainEqual(gap);
});

test('a hole among valid values cannot become an implicit missing level', () => {
  const progression = full([0, 2, 2]);
  delete progression[10];
  const out = run([{ featureType: ['EI'], progression }]);
  expect(out.mechanics.grants).toBeUndefined();
  expect(out.unsupported).toContainEqual(gap);
});

test('all-zero arrays have no grant and a late first positive retains its level', () => {
  expect(run([{ featureType: ['AI'], progression: Array(20).fill(0) }]).mechanics).toEqual({});
  const out = run([{ featureType: ['AI'], progression: [...Array(19).fill(0), 100] }]);
  expect(out.mechanics.grants).toHaveLength(1);
  expect(out.mechanics.grants![0]).toMatchObject({ atLevel: 20, choose: { count: 100 } });
});

test('invalid groups stay local while object totals, wildcard and original group keys survive', () => {
  const out = run([
    { featureType: ['AI'], progression: full([0, 2]) },
    { featureType: ['EI'], progression: [...Array(19).fill(1), 'bad'] },
    { featureType: ['PB'], progression: { '*': 1, 3: 2, 20: 0 } },
    { featureType: ['EI', 5], progression: full([1]) },
    { featureType: [], progression: full([1]) },
    null,
    { featureType: ['EI'], progression: { 5: 3, 1: 0, 2: 1 } },
  ]);
  expect(out.unsupported).toContainEqual(gap);
  expect(out.mechanics.grants!.map(grant => [grant.key, grant.atLevel, grant.choose?.count])).toEqual([
    ['optionalfeature:0', 2, 2], ['optionalfeature:2', 0, 1], ['optionalfeature:6', 2, 1],
  ]);
  expect(out.mechanics.grants![1].choiceProgression).toEqual([{ level: 0, count: 1 }, { level: 3, count: 2 }, { level: 20, count: 0 }]);
  expect(out.mechanics.grants![2].choiceProgression).toEqual([{ level: 1, count: 0 }, { level: 2, count: 1 }, { level: 5, count: 3 }]);
});

test('array and object derivation leave input values, order and references unchanged', () => {
  const raw = { optionalfeatureProgression: [
    { featureType: ['AI'], progression: full([0, 2, 2, 4]) },
    { featureType: ['EI'], progression: { 5: 3, '*': 1 } },
  ] };
  const before = structuredClone(raw), row = material(raw);
  const freeze = (value: any): void => {
    if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  };
  freeze(raw);
  const out = deriveStructured(row, makeContext([row]));
  expect(out.mechanics.grants).toHaveLength(2);
  expect(raw).toEqual(before);
  out.mechanics.grants![0].choiceProgression![1].count = 99;
  expect(raw).toEqual(before);
});

test('an EFA class without a source progression gets no inferred AI quota', () => {
  const row = material({ ENG_name: 'Artificer', source: 'EFA', entries: ['Original synthetic learned plans need separate review'] });
  const out = deriveStructured(row, makeContext([row]));
  expect(out.mechanics).toEqual({});
  expect(out.handled.has('optionalfeatureProgression')).toBe(false);
});

test('corpus output remains an annotation draft and unknown EFA prose gains no mechanism', () => {
  const body = { class: [{ ENG_name: 'Synthetic Class', source: 'PHB', optionalfeatureProgression: [{ featureType: ['AI'], progression: full([0, 2]) }] }],
    optionalfeature: [{ ENG_name: 'Synthetic Unknown', source: 'EFA', featureType: ['SYNTHETIC'], entries: ['Original synthetic unresolved activation'], script: 'synthetic' }] };
  const input: InputManifest['inputs'][number] = { namespace: 'kiwee', path: 'data/synthetic.json', role: 'catalog', url: 'https://example.org/data/synthetic.json', sha256: 'a'.repeat(64), bytes: 100, fetchedAt: '2026-10-10T00:00:00Z' };
  const envelope = deriveCorpus([{ input, body }], { toolVersion: 'synthetic', inputs: [input] }).envelope;
  expect(envelope.records).toHaveLength(2);
  expect(envelope.records.every(record => record.verdict === 'needsAnnotation' && record.autoGenerated)).toBe(true);
  expect(envelope.records[0].mechanics?.grants).toHaveLength(1);
  expect(envelope.records[1].mechanics).toBeUndefined();
  expect(envelope.records[1].unsupported).toContainEqual({ family: 'scripts', code: 'script-execution-deferred', ref: 'script' });
  // Supply synthetic version metadata to exercise the public IR validator.
  envelope.versionLock.kiweeChangelogDate = '2026-10-10';
  envelope.versionLock.foundryMigrationVersion = [3];
  expect(() => validateAutomation(envelope)).not.toThrow();
});
