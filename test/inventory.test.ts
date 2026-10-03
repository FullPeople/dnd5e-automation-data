import test from 'node:test';
import assert from 'node:assert/strict';
import { inventory, assertNoProse, markdown, type CorpusBody } from '../src/report/inventory.ts';
import { context, identity } from '../src/inventory/identity.ts';
import { safePath } from '../src/fetch/index.ts';
import type { InputManifest } from '../src/fetch/manifest.ts';

const manifest: InputManifest = { toolVersion: 'test', inputs: [] };
const file = (body: Record<string, any>, path = 'data/sample.json', role: 'catalog' | 'foundry' | 'version' = 'catalog', namespace = 'kiwee'): CorpusBody => ({ body, input: { namespace, path, role, sha256: 'test' } });
const clazz = { name: '战士', ENG_name: 'Fighter', source: 'PHB', hd: { number: 1, faces: 10 } };
const feature = { name: '测试特性', ENG_name: 'Synthetic Feature', source: 'PHB', className: '战士', classSource: 'PHB', level: 1, entries: ['原创中文测试描述'] };

test('English identity survives translated class names and keeps editions separate', () => {
  const a = identity('classFeature', feature, context([{ class: [clazz] }]), 'kiwee');
  const b = identity('classFeature', { ...feature, className: '斗士' }, context([{ class: [{ ...clazz, name: '斗士' }] }]), 'kiwee');
  assert.equal(a.key, b.key);
  assert.equal(a.classEngName, 'Fighter');
  assert.notEqual(a.key, identity('classFeature', { ...feature, source: 'XPHB', classSource: 'XPHB' }, context([{ class: [{ ...clazz, source: 'XPHB' }] }]), 'kiwee').key);
});

test('Foundry joins require class identity, level and source, never just a feature name', () => {
  const otherClass = { name: '牧师', ENG_name: 'Cleric', source: 'PHB' };
  const sidecar = { ...feature, activities: [{ type: 'utility' }] }; delete (sidecar as any).entries;
  const report = inventory([
    file({ class: [clazz, otherClass], classFeature: [feature, { ...feature, className: '牧师' }, { ...feature, level: 2 }] }),
    file({ classFeature: [sidecar] }, 'data/class/foundry.json', 'foundry'),
  ], manifest);
  const rows = report.entries.filter(row => row.identity.kind === 'classFeature');
  assert.equal(rows.filter(row => row.foundryMatches).length, 1);
  assert.equal(report.summary.foundryMatchedRows, 1);
  assert.equal(rows.find(row => row.foundryMatches)?.verdict, 'foundryCandidate');
});

test('ignored and marker-only Foundry rows do not count as payload candidates', () => {
  const report = inventory([
    file({ class: [clazz], classFeature: [feature] }),
    file({ classFeature: [{ ...feature, isIgnored: true, activities: [{ type: 'utility' }] }] }, 'data/class/foundry.json', 'foundry'),
  ], manifest);
  const row = report.entries.find(row => row.identity.kind === 'classFeature')!;
  assert.equal(row.foundryMatches, 1);
  assert.equal(row.foundryPayload, false);
  assert.equal(row.verdict, 'proseOnly');
});

test('translated subclass short names resolve to the English parent context', () => {
  const body = { class: [clazz], subclass: [{ name: '测试子职', ENG_name: 'Synthetic Path', shortName: '测试', ENG_shortName: 'Synthetic', source: 'PHB', className: '战士', classSource: 'PHB' }] };
  const id = identity('subclassFeature', { ...feature, subclassSource: 'PHB', subclassShortName: '测试' }, context([body]), 'kiwee');
  assert.equal(id.subclassEngShortName, 'Synthetic');
  assert.deepEqual(id.unresolved, []);
});

test('copies, versions and concrete magic variants change the denominator without mutating inputs', () => {
  const body = { race: [{ name: 'Test Race', ENG_name: 'Test Race', source: 'PHB', speed: 30, _versions: [{ name: 'Alternate Race', ENG_name: 'Alternate Race', source: 'PHB' }] }],
    baseitem: [{ name: 'Test Blade', ENG_name: 'Test Blade', source: 'PHB', type: 'M', weaponCategory: 'martial', dmg1: '1d6' }],
    item: [{ name: 'Copied Blade', ENG_name: 'Copied Blade', source: 'PHB', _copy: { name: 'Test Blade', source: 'PHB' } }],
    magicvariant: [{ name: 'Synthetic +1', ENG_name: 'Synthetic +1', source: 'DMG', requires: [{ type: 'M' }], inherits: { source: 'DMG', nameSuffix: ' +1', bonusWeapon: '+1' } }] };
  const before = structuredClone(body), report = inventory([file(body)], manifest);
  assert.deepEqual(body, before);
  assert.equal(report.entries.filter(row => row.expansion === 'version').length, 1);
  assert.equal(report.entries.filter(row => row.expansion === 'specificMagicItem').length, 1);
  assert.equal(report.entries.find(row => row.identity.engName === 'Copied Blade')?.unresolvedCopy, false);
});

test('subrace inheritance has a distinct kind and records unresolved parents', () => {
  const report = inventory([file({ race: [{ name: 'Parent', ENG_name: 'Parent', source: 'PHB', speed: 25 }], subrace: [{ name: 'Child', ENG_name: 'Child', source: 'PHB', raceName: 'Parent', raceSource: 'PHB' }, { name: 'Orphan', ENG_name: 'Orphan', source: 'PHB', raceName: 'Missing' }] })], manifest);
  assert.equal(report.summary.byKind.subrace, 2);
  assert.equal(report.summary.unresolvedParentsOrVariants, 1);
  assert.ok(report.entries.find(row => row.identity.engName === 'Parent (Child)')?.structuredFields.includes('speed'));
});

test('duplicate occurrences are deduplicated and conflicting snapshots are visible', () => {
  const row = { name: 'Spell', ENG_name: 'Spell', source: 'PHB', level: 1 };
  const report = inventory([file({ spell: [row] }, 'data/spells/a.json'), file({ spell: [structuredClone(row)] }, 'data/spells/b.json'), file({ spell: [{ ...row, level: 2 }] }, 'data/spells/c.json')], manifest);
  assert.equal(report.summary.uniqueEntries, 1);
  assert.equal(report.summary.duplicateOccurrences, 2);
  assert.equal(report.summary.duplicateConflicts, 1);
  assert.deepEqual(report.entries[0].originFiles, ['data/spells/a.json', 'data/spells/b.json', 'data/spells/c.json']);
});

test('temporary verdict totals partition each source/kind while presence columns can overlap', () => {
  const report = inventory([file({ class: [clazz], classFeature: [{ ...feature, uses: { max: 1 } }] }), file({ classFeature: [{ ...feature, activities: [{ type: 'utility' }] }] }, 'data/class/foundry.json', 'foundry')], manifest);
  const cell = report.matrix['kiwee/PHB'].classFeature;
  assert.equal(cell.total, cell.structuredCandidate + cell.foundryCandidate + cell.proseOnly);
  assert.equal(cell.withStructured, 1);
  assert.equal(cell.withFoundryPayload, 1);
  assert.equal(report.completeAutomationClaim, false);
});

test('inline raceFeature sidecars remain orphans rather than silently matching the race', () => {
  const report = inventory([file({ race: [{ name: 'Synthetic Race', ENG_name: 'Synthetic Race', source: 'PHB' }] }), file({ raceFeature: [{ name: 'Synthetic Race', ENG_name: 'Synthetic Race', source: 'PHB', activities: [{ type: 'utility' }] }] }, 'data/foundry-races.json', 'foundry')], manifest);
  assert.equal(report.summary.foundryOrphans, 1);
  assert.equal(report.entries[0].foundryMatches, 0);
});

test('mechanics-only reports contain no translated prose and expose identity gaps', () => {
  const report = inventory([file({ feat: [{ name: '原创未翻译标识', source: 'PHB', entries: ['原创中文测试描述'] }] })], manifest);
  assertNoProse(report);
  assert.equal(report.summary.unresolvedIdentities, 1);
  assert.ok(!JSON.stringify(report).includes('原创'));
  assert.ok(!markdown(report).includes('原创'));
  assert.throws(() => assertNoProse({ quote: 'short English text' }), /Publisher prose/);
  assert.throws(() => assertNoProse({ value: '正文' }), /CJK/);
});

test('identical locked inputs produce identical reports including orphan order', () => {
  const data = [file({ class: [clazz], classFeature: [feature] }), file([{ ver: '1.0', date: '2026-01-01' }, { ver: '2.0', date: '2026-02-01' }], 'data/changelog.json', 'version')];
  const a = inventory(data, manifest), b = inventory(structuredClone(data), manifest);
  assert.deepEqual(a, b);
  assert.equal(a.versionLock.kiweeChangelogVersion, '2.0');
});

test('source index paths reject traversal, external URLs and fragments', () => {
  for (const path of ['../private.json', '/data.json', 'https://elsewhere/file.json', 'data\\file.json', 'data/file.json?secret=1', 'data//file.json']) assert.equal(safePath(path), false);
  assert.equal(safePath('spells/Test Author; Example.json'), true);
});

test('homebrew meta edition prevents old magic templates expanding onto new base items', () => {
  const base = file({ _meta: { edition: 'one' }, baseitem: [{ name: 'New Blade', ENG_name: 'New Blade', source: 'NEWBOOK', type: 'M' }] }, 'new.json', 'catalog', 'kiwee-homebrew');
  const variant = file({ _meta: { edition: 'classic' }, magicvariant: [{ name: 'Old Template', ENG_name: 'Old Template', source: 'OLDBOOK', requires: [{ type: 'M' }], inherits: { source: 'OLDBOOK', bonusWeapon: '+1' } }] }, 'old.json', 'catalog', 'kiwee-homebrew');
  const before = structuredClone([base, variant]);
  const report = inventory([base, variant], manifest);
  assert.equal(report.entries.filter(row => row.expansion === 'specificMagicItem').length, 0);
  assert.deepEqual([base, variant], before);
});

test('Foundry shape counts expose mapping keys while omitting all payload text', () => {
  const report = inventory([file({ feat: [{ name: 'Synthetic', ENG_name: 'Synthetic', source: 'PHB', activities: [{ type: 'heal', description: '原创中文' }], effects: [{ changes: [{ key: 'system.traits.dr.value', value: 'poison' }] }], system: { uses: { max: 1, recovery: [] }, description: { value: '原创中文' } } }] }, 'data/foundry-feats.json', 'foundry')], manifest);
  assert.equal(report.foundryFieldsByFile['data/foundry-feats.json']['activity:heal'], 1);
  assert.equal(report.foundryFieldsByFile['data/foundry-feats.json']['effect.key:system.traits.dr.value'], 1);
  assert.equal(report.foundryFieldsByFile['data/foundry-feats.json']['system:uses.max'], 1);
  assertNoProse(report);
  assert.ok(!JSON.stringify(report).includes('poison'));
});
