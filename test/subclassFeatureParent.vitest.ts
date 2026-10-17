import { expect, test } from 'vitest';
import { createIdentity } from '../src/identity.ts';
import { deriveStructured } from '../src/derive/structured/index.ts';
import { makeContext } from '../src/derive/structured/common.ts';
import { validateAutomation } from '../src/validate/index.ts';
import type { Material } from '../src/derive/catalogue.ts';
import type { AutomationEnvelope } from '../src/protocol.ts';

const uid = (subclassSource = 'TCE', source = 'XGE') => `Synthetic Feature|Synthetic Class|PHB|Synthetic Subclass|${subclassSource}|3|${source}`;
const feature = (subclassSource = 'TCE', source = 'XGE'): Material => ({
  identity: createIdentity({ kind: 'subclassFeature', source, engName: 'Synthetic Feature', classSource: 'PHB', classEngName: 'Synthetic Class', subclassSource, subclassEngShortName: 'Synthetic Subclass', level: 3 }),
  raw: { name: 'Synthetic Feature', ENG_name: 'Synthetic Feature', source, className: 'Synthetic Class', classSource: 'PHB', subclassShortName: 'Synthetic Subclass', subclassSource, level: 3 },
  edition: '2014', namespace: 'kiwee', files: ['data/synthetic.json'], expansion: 'source',
});
const owner = (references: unknown[] = [uid()]): Material => ({
  identity: createIdentity({ kind: 'subclass', source: 'TCE', engName: 'Synthetic Subclass', classSource: 'PHB', classEngName: 'Synthetic Class' }),
  raw: { subclassFeatures: references }, edition: '2014', namespace: 'kiwee', files: ['data/synthetic.json'], expansion: 'source',
});
const derive = (row: Material, targets: Material[]) => deriveStructured(row, makeContext([row, ...targets]));
const unresolved = (out: ReturnType<typeof derive>) => {
  expect(out.mechanics.classModel?.subclassFeatures).toBeUndefined();
  expect(out.mechanics.classModel?.referenceAliases).toBeUndefined();
  expect(out.mechanics.grants).toBeUndefined();
  expect(out.unsupported).toEqual([{ family: 'featureProgression', code: 'unresolved-feature-ref', ref: 'subclassFeatures' }]);
};

test('a sole same-name candidate from another subclass source stays unresolved', () => {
  const row = owner(), wrongParent = feature('SCAG');
  expect(makeContext([wrongParent]).resolve(uid(), 'subclassFeature')).toBeUndefined();
  unresolved(derive(row, [wrongParent]));
});

test('the exact subclass source disambiguates candidates sharing a feature source', () => {
  const exact = feature(), other = feature('SCAG'), out = derive(owner(), [other, exact]);
  expect(out.unsupported).toEqual([]);
  expect(out.mechanics.classModel).toEqual({ subclassFeatures: [exact.identity.key], referenceAliases: { [exact.identity.key]: encodeURIComponent(uid()) } });
  expect(out.mechanics.grants).toBeUndefined();
});

test('an omitted subclass source means PHB even when feature source is explicit', () => {
  unresolved(derive(owner([uid('')]), [feature('TCE')]));
  const exact = feature('PHB'), out = derive(owner([uid('')]), [exact]);
  expect(out.unsupported).toEqual([]);
  expect(out.mechanics.classModel?.subclassFeatures).toEqual([exact.identity.key]);
});

test.each([
  { reference: uid(), target: feature() },
  { reference: uid('tce', 'xge'), target: feature() },
  { reference: 'Synthetic Feature|Synthetic Class||Synthetic Subclass|TCE|3', target: feature('TCE', 'TCE') },
  { reference: 'Synthetic Feature|Synthetic Class||Synthetic Subclass||3', target: feature('PHB', 'PHB') },
])('existing explicit and default source forms stay resolvable: $reference', ({ reference, target }) => {
  const out = derive(owner([{ subclassFeature: reference }]), [target]);
  expect(out.unsupported).toEqual([]);
  expect(out.mechanics.classModel).toEqual({ subclassFeatures: [target.identity.key], referenceAliases: { [target.identity.key]: encodeURIComponent(reference) } });
});

test.each([
  'Synthetic Feature|Synthetic Class|XPHB|Synthetic Subclass|TCE|3|XGE',
  'Synthetic Feature|Other Class|PHB|Synthetic Subclass|TCE|3|XGE',
  'Synthetic Feature|Synthetic Class|PHB|Other Subclass|TCE|3|XGE',
  'Synthetic Feature|Synthetic Class|PHB|Synthetic Subclass|TCE|4|XGE',
  'Synthetic Feature|Synthetic Class|PHB|Synthetic Subclass|TCE|3|SCAG',
])('other full identity mismatches remain unresolved: %s', reference => {
  unresolved(derive(owner([reference]), [feature()]));
});

test('a missing canonical subclass parent is not inferred from raw display metadata', () => {
  const target = feature();
  target.identity = createIdentity({ kind: 'subclassFeature', source: 'XGE', engName: 'Synthetic Feature', classSource: 'PHB', classEngName: 'Synthetic Class', level: 3 });
  unresolved(derive(owner(), [target]));
});

test('a truly ambiguous exact-parent reference remains unresolved', () => {
  const duplicate = feature();
  duplicate.identity = createIdentity({ ...duplicate.identity, packId: 'otherpack' });
  unresolved(derive(owner(), [feature(), duplicate]));
});

test('a matching subclass parent still cannot cross explicit editions', () => {
  const target = feature();
  target.edition = '2024';
  const out = derive(owner(), [target]);
  expect(out.mechanics.classModel?.subclassFeatures).toBeUndefined();
  expect(out.unsupported).toEqual([{ family: 'featureProgression', code: 'cross-edition-feature-ref', ref: 'subclassFeatures' }]);
});

test('ordinary class feature references keep their existing source defaults and aliases', () => {
  const reference = 'Synthetic Feature|Synthetic Class||3|TCE';
  const target: Material = { ...feature(), identity: createIdentity({ kind: 'classFeature', source: 'TCE', engName: 'Synthetic Feature', classSource: 'PHB', classEngName: 'Synthetic Class', level: 3 }) };
  const row: Material = { ...owner(), identity: createIdentity({ kind: 'class', source: 'PHB', engName: 'Synthetic Class' }), raw: { classFeatures: [reference] } };
  const out = derive(row, [target]);
  expect(out.unsupported).toEqual([]);
  expect(out.mechanics.classModel).toEqual({ classFeatures: [target.identity.key], referenceAliases: { [target.identity.key]: encodeURIComponent(reference) } });
});

test('resolved output remains a pending immutable declaration with its original alias', () => {
  const row = owner(), target = feature(), before = structuredClone([row, target]);
  const freeze = (value: any): void => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } };
  freeze(row); freeze(target);
  const out = derive(row, [target]);
  const envelope: AutomationEnvelope = { schemaVersion: 1, protocol: 3,
    versionLock: { kiweeChangelogVersion: 'synthetic', kiweeChangelogDate: '2026-10-15', fetchedAt: '2026-10-15T00:00:00Z', foundryMigrationVersion: [3], toolVersion: 'synthetic', inputs: [{ url: 'https://example.org/synthetic.json', path: 'synthetic.json', namespace: 'kiwee', role: 'catalog', sha256: 'a'.repeat(64), bytes: 1 }] },
    records: [{ identity: row.identity, edition: row.edition, verdict: 'needsAnnotation', autoGenerated: true, provenance: [{ layer: 'structured', ref: 'data/synthetic.json' }], mechanics: out.mechanics, unsupported: out.unsupported },
      { identity: target.identity, edition: target.edition, verdict: 'needsAnnotation', autoGenerated: true, provenance: [{ layer: 'structured', ref: 'data/synthetic.json' }], unsupported: [] }] };
  expect(out.unsupported).toEqual([]);
  expect(() => validateAutomation(envelope)).not.toThrow();
  expect(out.mechanics.grants).toBeUndefined();
  expect([row, target]).toEqual(before);
});
