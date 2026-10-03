import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { createIdentity, identityKey } from '../src/identity.ts';
import { automationErrors, overlayErrors, publicArtifact, schemaErrors, validateAutomation } from '../src/validate/index.ts';
import { evaluateFormula, parseFormula } from '../src/validate/formula.ts';
import { automationSchema, overlaySchema } from '../src/validate/schemas.ts';
import type { AutomationEnvelope, AutomationRecord, OverlayRecord } from '../src/protocol.ts';

const id = (name = 'Synthetic Resource', source = 'PHB', kind = 'feat') => createIdentity({ kind, source, engName: name });
const resource = () => ({ key: 'sample', max: { formula: 'max(1, @prof-1)' }, recovery: [{ period: 'long' as const, amount: 'all' as const }] });
const record = (): AutomationRecord => ({ identity: id(), verdict: 'automated', provenance: [{ layer: 'structured', ref: 'fixtures/synthetic.json#feat' }], unsupported: [], mechanics: { resources: [resource()], actions: [{ type: 'utility', activation: 'bonus', target: 'self', consumes: { resource: 'sample', amount: 1 } }] } });
const envelope = (...records: AutomationRecord[]): AutomationEnvelope => ({ schemaVersion: 1, protocol: 3, versionLock: { kiweeChangelogVersion: 'synthetic-1', kiweeChangelogDate: '2026-10-03', fetchedAt: '2026-10-03T00:00:00Z', foundryMigrationVersion: [3], toolVersion: 'test', inputs: [{ url: 'https://example.org/data.json', path: 'data.json', namespace: 'synthetic', role: 'catalog', sha256: 'a'.repeat(64), bytes: 10 }] }, records: records.length ? records : [record()] });
const overlay = (): OverlayRecord => { const { provenance: _, ...row } = record(); return { ...row, reviewer: 'model:synthetic', reviewedAt: '2026-10-03', evidence: { page: 1, quote: 'Original synthetic example' }, batch: 'synthetic-001' }; };
const codes = (value: unknown) => automationErrors(value).map(row => row.code);
const spell = (source = 'PHB'): AutomationRecord => ({ identity: id('Synthetic Spell', source, 'spell'), verdict: 'unsupported', provenance: [{ layer: 'structured', ref: 'fixtures/synthetic.json#spell' }], mechanics: { spellModel: { level: 1, classes: [{ engName: 'Cleric', source }] } }, unsupported: [{ code: 'settlement-deferred', family: 'spellExecution', deferred: true }] });

describe('all eleven required invariants have positive and negative evidence', () => {
  test('1 schema accepts valid data and refuses missing protocol and extra publisher fields', () => {
    expect(schemaErrors(envelope())).toEqual([]);
    const missing: any = envelope(); delete missing.protocol; expect(schemaErrors(missing).length).toBeGreaterThan(0);
    const prose: any = envelope(); prose.records[0].entries = ['Synthetic prose']; expect(codes(prose)).toContain('schema');
  });
  test('2 unique canonical keys pass; duplicate and forged keys fail', () => {
    expect(automationErrors(envelope(record(), { ...record(), identity: id('Distinct') }))).toEqual([]);
    expect(codes(envelope(record(), record()))).toContain('duplicate-identity');
    const forged = record(); forged.identity.key = 'forged'; expect(codes(envelope(forged))).toContain('identity-key');
  });
  test('3 public fields reject CJK while private notes are removed from public artifacts', () => {
    const valid = envelope(); valid.records[0].notes = '原创私有笔记'; expect(automationErrors(valid)).toEqual([]);
    expect(publicArtifact(valid).records[0]).not.toHaveProperty('notes');
    const invalid = envelope(); invalid.records[0].evidence = { page: 1, quote: '原创中文测试' }; expect(codes(invalid)).toContain('cjk');
    const englishProse: any = envelope(); englishProse.records[0].description = 'Synthetic publisher body'; expect(codes(englishProse)).toContain('prose');
  });
  test('4 automated requires nonempty mechanisms with no unsupported or deferred settlement', () => {
    expect(automationErrors(envelope())).toEqual([]);
    const empty = record(); empty.mechanics = { modifiers: [], classModel: {} }; expect(codes(envelope(empty))).toContain('empty-mechanics');
    const partial = record(); partial.unsupported.push({ code: 'unknown', family: 'synthetic' }); expect(codes(envelope(partial))).toContain('schema');
    const deferred = record(); deferred.mechanics!.actions![0].type = 'heal'; expect(codes(envelope(deferred))).toContain('deferred');
  });
  test('5 whitelist arithmetic and dice pass, actor variables and scripts fail', () => {
    expect(automationErrors(envelope())).toEqual([]);
    expect(parseFormula('1d10 + @class.level').dice).toBe(true);
    for (const formula of ['@actor.hp', 'globalThis.process', 'Math.max(1,2)', '1;throw(1)', '1d1000000']) { const row = record(); row.mechanics!.resources![0].max = { formula }; expect(codes(envelope(row))).toContain('formula'); }
    expect(evaluateFormula('max(1, @prof-1) + floor(@class.level / 2)', { '@prof': 3, '@class.level': 5 })).toBe(4);
    expect(evaluateFormula('@classes.blood-hunter.levels+@scale.rage-1', { '@classes.blood-hunter.levels': 3, '@scale.rage': 2 })).toBe(4);
    expect(() => evaluateFormula('1d6', {})).toThrow('explicit roll'); expect(() => evaluateFormula('1/0', {})).toThrow('division by zero');
  });
  test('6 recovery enum, all, integer and legal formula pass; weekly and invalid amount fail', () => {
    const row = record(); row.mechanics!.resources![0].recovery = [{ period: 'long', amount: 'all' }, { period: 'short', amount: 2 }, { period: 'dawn', amount: '@prof' }]; expect(automationErrors(envelope(row))).toEqual([]);
    for (const recovery of [{ period: 'weekly', amount: 'all' }, { period: 'long', amount: -1 }, { period: 'long', amount: 1.5 }, { period: 'long', amount: '@actor.hp' }]) { const invalid: any = record(); invalid.mechanics.resources[0].recovery = [recovery]; expect(automationErrors(envelope(invalid)).length).toBeGreaterThan(0); }
  });
  test('7 one resource per normalized key; same key in distinct entries is permitted', () => {
    expect(automationErrors(envelope(record(), { ...record(), identity: id('Distinct') }))).toEqual([]);
    const row = record(); row.mechanics!.resources!.push({ ...resource(), key: 'SAMPLE' }); expect(codes(envelope(row))).toContain('duplicate-resource');
  });
  test('8 spell grants and cast refer to the versioned spell catalogue', () => {
    const target = spell(), row = record(); row.mechanics!.grants = [{ type: 'spell', fixed: [target.identity.key], usage: 'free' }]; row.mechanics!.actions!.push({ type: 'cast', activation: 'action', target: 'other', spell: target.identity.key }); expect(automationErrors(envelope(row, target))).toEqual([]);
    expect(codes(envelope(row))).toContain('reference');
    const filter = record(); filter.mechanics!.grants = [{ type: 'spell', choose: { count: 1, filter: { level: 1, class: 'Cleric', classSource: 'PHB' } } }]; expect(automationErrors(envelope(filter, target))).toEqual([]); expect(codes(envelope(filter))).toContain('spell-filter');
  });
  test('9 2014 and 2024 remain separate and cannot cross-reference, including filters', () => {
    const target = spell(), row = record(); row.mechanics!.grants = [{ type: 'spell', fixed: [target.identity.key] }]; expect(automationErrors(envelope(row, target))).toEqual([]);
    row.identity = id('Synthetic Resource', 'XPHB'); expect(codes(envelope(row, target))).toContain('edition-reference');
    row.mechanics!.grants = [{ type: 'spell', choose: { count: 1, filter: { class: 'Cleric', classSource: 'PHB' } } }]; expect(codes(envelope(row, target))).toContain('edition-reference');
    row.edition = '2014'; expect(codes(envelope(row))).toContain('edition-source');
  });
  test('10 every overlay has a reviewer, real date and evidence page', () => {
    expect(overlayErrors([overlay()])).toEqual([]);
    for (const field of ['reviewer', 'reviewedAt', 'evidence'] as const) { const row: any = overlay(); delete row[field]; expect(overlayErrors([row]).length).toBeGreaterThan(0); }
    const missing: any = overlay(); delete missing.evidence.page; expect(overlayErrors([missing]).length).toBeGreaterThan(0);
    const date = overlay(); date.reviewedAt = '2026-02-30'; expect(overlayErrors([date]).map(row => row.code)).toContain('review');
    expect(overlayErrors([overlay(), overlay()]).map(row => row.code)).toContain('duplicate-identity');
  });
  test('11 complete version lock passes; every absent field and missing SHA fails', () => {
    expect(automationErrors(envelope())).toEqual([]);
    for (const field of Object.keys(envelope().versionLock)) { const invalid: any = envelope(); delete invalid.versionLock[field]; expect(codes(invalid)).toContain('schema'); }
    const invalid: any = envelope(); delete invalid.versionLock.inputs[0].sha256; expect(codes(invalid)).toContain('schema');
  });
});

describe('additional protocol integrity', () => {
  test('appendix E real mechanism subsets pass schema with their stated semantic boundaries', () => {
    const examples = ['e1-second-wind-phb', 'e2-dwarf-phb', 'e3-magic-initiate-cleric-xphb'].map(name => JSON.parse(readFileSync(`fixtures/g2/${name}.json`, 'utf8')) as AutomationRecord);
    for (const row of examples) expect(schemaErrors(envelope(row))).toEqual([]);
    expect(codes(envelope(examples[0]))).toEqual(['deferred']);
    expect(automationErrors(envelope(examples[1]))).toEqual([]);
    const one = spell('XPHB'), zero = spell('XPHB'); zero.identity = id('Synthetic Cantrip', 'XPHB', 'spell'); zero.mechanics!.spellModel!.level = 0;
    expect(automationErrors(envelope(examples[2], one, zero))).toEqual([]);
    expect(codes(envelope(examples[2]))).toEqual(['spell-filter', 'spell-filter']);
  });
  test('schema sources remain identical to generated runtime definitions', () => {
    expect(JSON.parse(readFileSync('schema/automation-ir.schema.json', 'utf8'))).toEqual(automationSchema);
    expect(JSON.parse(readFileSync('schema/overlay.schema.json', 'utf8'))).toEqual(overlaySchema);
  });
  test('noMechanics requires an allowed reason and excludes operative mechanisms', () => {
    const row = record(); row.verdict = 'noMechanics'; row.reasonCode = 'placeholder'; delete row.mechanics; expect(automationErrors(envelope(row))).toEqual([]);
    delete row.reasonCode; expect(codes(envelope(row))).toContain('schema'); row.reasonCode = 'placeholder'; row.mechanics = { resources: [resource()] }; expect(codes(envelope(row))).toContain('no-mechanics-conflict');
  });
  test('needsAnnotation can only be automatically generated, never contributed as an overlay', () => {
    const row = record(); row.verdict = 'needsAnnotation'; row.autoGenerated = true; delete row.mechanics; expect(automationErrors(envelope(row))).toEqual([]);
    delete row.autoGenerated; expect(codes(envelope(row))).toContain('schema');
    const contributed = overlay(); contributed.verdict = 'needsAnnotation'; contributed.autoGenerated = true; expect(overlayErrors([contributed]).length).toBeGreaterThan(0);
  });
  test('overlay reversal needs a reason and evidence quotes stay short', () => {
    const row = overlay(); row.overrides = ['structured']; row.overrideReason = 'Synthetic correction'; expect(overlayErrors([row])).toEqual([]);
    delete row.overrideReason; expect(overlayErrors([row]).length).toBeGreaterThan(0);
    row.overrideReason = 'Synthetic correction'; row.evidence.quote = Array(16).fill('word').join(' '); expect(overlayErrors([row]).map(row => row.code)).toContain('quote-length');
  });
  test('shared identity normalizes Unicode, source and whitespace and preserves parents and edition', () => {
    const input = { kind: 'classFeature', source: 'phb', engName: '  Second   Wind ', classSource: 'phb', classEngName: 'Ｆｉｇｈｔｅｒ', level: 1 };
    expect(identityKey(createIdentity(input))).toBe(identityKey(createIdentity({ ...input, source: 'PHB', engName: 'Second Wind', classEngName: 'Fighter' })));
    expect(identityKey(input)).not.toBe(identityKey({ ...input, classSource: 'XPHB' }));
    expect(() => createIdentity({ ...input, classEngName: '战士' })).toThrow(); expect(() => createIdentity({ ...input, classSource: undefined })).toThrow();
  });
  test('invalid payload errors do not disclose the input prose', () => {
    const row = envelope(); row.records[0].evidence = { page: 1, quote: '原创保密正文' }; expect(() => validateAutomation(row)).toThrow(); expect(JSON.stringify(automationErrors(row))).not.toContain('原创');
  });
});
