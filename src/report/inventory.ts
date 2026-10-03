import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { prepareBody, specificMagicItems, expandVersions } from '../inventory/expand.ts';
import { inheritSubrace } from '../inventory/subrace.ts';
import { identity, context, digest, hasCjk, label, type InventoryIdentity } from '../inventory/identity.ts';
import { KINDS, CORE_KINDS, STRUCTURED_FIELDS, type InputManifest, type InputFile } from '../fetch/manifest.ts';

type Raw = Record<string, any>;
type Candidate = 'structuredCandidate' | 'foundryCandidate' | 'proseOnly';
interface EntryRow { identity: InventoryIdentity; namespace: string; verdict: Candidate; structuredFields: string[]; foundryMatches: number; foundryPayload: boolean; foundryPayloadKinds: string[]; originFiles: string[]; expansion: string; unresolvedCopy: boolean; unresolvedParent: boolean }
interface FoundryRow { identity: InventoryIdentity; payloadKinds: string[]; file: string; migrationVersion?: number; flags: string[] }
export interface CorpusBody { input: Pick<InputFile, 'namespace' | 'path' | 'role' | 'sha256'>; body: Raw }
function payloads(raw: Raw): string[] {
  const rows = ['activities', 'effects', 'entryData', 'system', 'advancement', 'subEntities'].filter(key => raw[key] && Object.keys(raw[key]).length);
  return rows.sort();
}
function foundryFields(body: Raw): Record<string, number> {
  const result: Record<string, number> = {};
  const add = (key: string) => { key = label(key); result[key] = (result[key] || 0) + 1; };
  for (const raws of Object.values(body)) if (Array.isArray(raws)) for (const raw of raws) {
    for (const activity of raw.activities || []) add(`activity:${activity.type || 'unspecified'}`);
    for (const effect of raw.effects || []) for (const change of effect.changes || []) add(`effect.key:${change.key || 'unspecified'}`);
    for (const key of Object.keys(raw.entryData || {})) add(`entryData:${key}`);
    const system = (value: any, path: string) => { if (value && typeof value === 'object' && !Array.isArray(value)) for (const [key, child] of Object.entries(value)) system(child, path ? `${path}.${key}` : key); else add(`system:${path}`); };
    if (raw.system) system(raw.system, '');
    for (const advancement of raw.advancement || []) add(`advancement:${advancement.type || 'unspecified'}`);
    for (const flag of ['ignoreSrdEffects', 'ignoreSrdActivities', 'isIgnored']) if (raw[flag]) add(`flag:${flag}`);
  }
  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
}
const counts = <T>(rows: T[], fn: (row: T) => string) => {
  const result: Record<string, number> = {};
  for (const row of rows) { const key = fn(row); result[key] = (result[key] || 0) + 1; }
  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
};
export function inventory(files: CorpusBody[], manifest: InputManifest) {
  const catalog = files.filter(file => file.input.role === 'catalog');
  const ctx = context(catalog.map(file => file.body));
  const foundry: FoundryRow[] = [];
  for (const file of files.filter(file => file.input.role === 'foundry')) for (const [kind, raws] of Object.entries(file.body)) {
    if (!Array.isArray(raws)) continue;
    for (const raw of raws) if (raw && typeof raw === 'object') foundry.push({ identity: identity(kind, raw, ctx, file.input.namespace), payloadKinds: payloads(raw), file: file.input.path, migrationVersion: raw.migrationVersion, flags: ['ignoreSrdEffects', 'ignoreSrdActivities', 'isIgnored'].filter(key => raw[key]) });
  }
  const foundryMap = new Map<string, FoundryRow[]>();
  for (const row of foundry) foundryMap.set(row.identity.key, [...(foundryMap.get(row.identity.key) || []), row]);
  const entries = new Map<string, EntryRow>();
  const occurrences: Record<string, number> = {};
  const duplicateConflicts: { key: string; files: string[] }[] = [];
  const fingerprints = new Map<string, string>();
  let duplicateOccurrences = 0;
  for (const namespace of [...new Set(catalog.map(file => file.input.namespace))].sort()) {
    const merged: Raw = {}, origins = new Map<Raw, string>();
    for (const file of catalog.filter(file => file.input.namespace === namespace)) for (const [kind, raws] of Object.entries(file.body)) {
      if (!Array.isArray(raws)) continue;
      merged[kind] ||= [];
      for (const row of raws) if (row && typeof row === 'object') {
        const adapted = namespace === 'kiwee-homebrew' ? { ...row, edition: row.edition || file.body._meta?.edition, _homebrew: true } : row;
        merged[kind].push(adapted); origins.set(adapted, file.input.path);
        if (KINDS.includes(kind as any)) occurrences[`${namespace}:${kind}`] = (occurrences[`${namespace}:${kind}`] || 0) + 1;
      }
    }
    const prepared = prepareBody(merged);
    const candidates: { kind: string; raw: Raw; file: string; expansion: string }[] = [];
    for (const kind of KINDS) for (const [index, raw] of (prepared[kind] || []).entries()) {
      const file = origins.get(merged[kind][index]) || '';
      const inherited = kind === 'subrace' ? inheritSubrace(raw, prepared.race || []) : raw;
      candidates.push({ kind, raw: inherited, file, expansion: 'source' });
      for (const version of expandVersions(inherited)) candidates.push({ kind, raw: version, file, expansion: 'version' });
    }
    for (const raw of specificMagicItems(prepared)) candidates.push({ kind: 'item', raw, file: 'derived/magicvariant', expansion: 'specificMagicItem' });
    for (const candidate of candidates) {
      const id = identity(candidate.kind, candidate.raw, ctx, namespace);
      const matches = id.unresolved.length ? [] : foundryMap.get(id.key) || [];
      const structuredFields: string[] = STRUCTURED_FIELDS.filter(field => field !== 'level' && Object.hasOwn(candidate.raw, field));
      if (candidate.kind === 'spell' && Object.hasOwn(candidate.raw, 'level')) structuredFields.push('level');
      for (const field of ['classFeatures', 'subclassFeatures']) if (candidate.raw[field]?.length) structuredFields.push(field);
      if (candidate.raw.system?.uses) structuredFields.push('system.uses');
      const foundryPayload = matches.some(row => row.payloadKinds.length && !row.flags.includes('isIgnored'));
      const row: EntryRow = { identity: id, namespace, verdict: foundryPayload ? 'foundryCandidate' : structuredFields.length ? 'structuredCandidate' : 'proseOnly', structuredFields: structuredFields.sort(), foundryMatches: matches.length, foundryPayload, foundryPayloadKinds: [...new Set(matches.flatMap(row => row.payloadKinds))].sort(), originFiles: [label(candidate.file)], expansion: candidate.expansion, unresolvedCopy: Boolean(candidate.raw._copy), unresolvedParent: Boolean(candidate.raw._unresolvedParent || candidate.raw._unresolvedVariant) };
      // Only fingerprints are public; publisher descriptions stay in the raw cache.
      const fingerprint = digest(candidate.raw);
      const previous = entries.get(id.key);
      if (previous) {
        duplicateOccurrences++;
        if (fingerprints.get(id.key) !== fingerprint) duplicateConflicts.push({ key: id.key, files: [...previous.originFiles, label(candidate.file)].sort() });
        previous.originFiles = [...new Set([...previous.originFiles, label(candidate.file)])].sort();
      } else { entries.set(id.key, row); fingerprints.set(id.key, fingerprint); }
    }
  }
  const rows = [...entries.values()].sort((a, b) => a.identity.key.localeCompare(b.identity.key));
  const matchedFoundry = new Set(rows.filter(row => row.foundryMatches).map(row => row.identity.key));
  const orphans = foundry.filter(row => !matchedFoundry.has(row.identity.key));
  const matrix: Record<string, Record<string, { total: number; structuredCandidate: number; foundryCandidate: number; proseOnly: number; withStructured: number; withFoundryMatch: number; withFoundryPayload: number }>> = {};
  for (const row of rows) {
    const source = `${row.namespace}/${row.identity.source}`;
    const cell = (matrix[source] ||= {})[row.identity.kind] ||= { total: 0, structuredCandidate: 0, foundryCandidate: 0, proseOnly: 0, withStructured: 0, withFoundryMatch: 0, withFoundryPayload: 0 };
    cell.total++; cell[row.verdict]++; if (row.structuredFields.length) cell.withStructured++; if (row.foundryMatches) cell.withFoundryMatch++; if (row.foundryPayload) cell.withFoundryPayload++;
  }
  const changelog = files.find(file => file.input.role === 'version')?.body;
  const versions = Array.isArray(changelog) ? changelog : changelog?.changelog || [];
  const latest = [...versions].sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.ver).localeCompare(String(a.ver), undefined, { numeric: true }))[0];
  const migrationVersions = [...new Set(foundry.map(row => row.migrationVersion).filter((version): version is number => version !== undefined))].sort((a, b) => a - b);
  const versionLock = { kiweeChangelogVersion: label(latest?.ver || 'unknown'), kiweeChangelogDate: label(latest?.date || 'unknown'), fetchedAt: [...manifest.inputs.map(input => input.fetchedAt)].sort().at(-1), foundryMigrationVersion: migrationVersions, toolVersion: manifest.toolVersion, inputs: manifest.inputs.map(({ url, path, namespace, role, sha256, bytes }) => ({ url, path: label(path), namespace, role, sha256, bytes })) };
  return {
    phase: 'G1-inventory', completeAutomationClaim: false, identityStatus: 'provisional-inventory-key-pending-G2', versionLock,
    scope: { coreKinds: [...CORE_KINDS], otherKinds: KINDS.filter(kind => !CORE_KINDS.includes(kind as any)), excludes: ['monster', 'combatResolution', 'effectExecution', 'inlineProseMechanics'], normalization: 'DND-card-web expand.ts at 80c94e0, global copies per namespace, homebrew meta edition, subrace inheritance, versions, concrete magic items; runtime source corrections not applied' },
    summary: { inputs: manifest.inputs.length, uniqueEntries: rows.length, rawOccurrences: Object.values(occurrences).reduce((a, b) => a + b, 0), duplicateOccurrences, duplicateConflicts: duplicateConflicts.length, byCandidate: counts(rows, row => row.verdict), byKind: counts(rows, row => row.identity.kind), unresolvedIdentities: rows.filter(row => row.identity.unresolved.length).length, unresolvedCopies: rows.filter(row => row.unresolvedCopy).length, unresolvedParentsOrVariants: rows.filter(row => row.unresolvedParent).length, foundryRows: foundry.length, foundryMatchedRows: foundry.length - orphans.length, foundryOrphans: orphans.length, foundryMigrationVersions: migrationVersions },
    matrix, rawOccurrences: occurrences, entries: rows, duplicateConflicts, foundryOrphans: orphans,
    foundryPayloadCounts: counts(foundry.flatMap(row => row.payloadKinds), kind => kind),
    foundryFieldsByFile: Object.fromEntries(files.filter(file => file.input.role === 'foundry').map(file => [file.input.path, foundryFields(file.body)])),
  };
}
export function assertNoProse(value: unknown): void {
  const walk = (current: any, path: string) => {
    if (typeof current === 'string' && hasCjk(current)) throw Error(`CJK string in artifact at ${path}`);
    if (Array.isArray(current)) current.forEach((child, index) => walk(child, `${path}[${index}]`));
    else if (current && typeof current === 'object') for (const [key, child] of Object.entries(current)) {
      const reportRows = key === 'entries' && path === '$' && current.phase === 'G1-inventory' && current.completeAutomationClaim === false && Array.isArray(child) && child.every(row => row?.identity && Array.isArray(row.structuredFields) && ['structuredCandidate', 'foundryCandidate', 'proseOnly'].includes(row.verdict));
      if (['entries', 'additionalEntries', 'entriesHigherLevel', 'description', 'quote'].includes(key) && !reportRows) throw Error(`Publisher prose field in artifact at ${path}.${key}`);
      if (hasCjk(key)) throw Error(`CJK field at ${path}`);
      walk(child, `${path}.${key}`);
    }
  };
  walk(value, '$');
}
export function markdown(report: ReturnType<typeof inventory>): string {
  const s = report.summary;
  const lines = ['# G1 corpus inventory', '', 'This is a denominator and candidate inventory, not semantic automation coverage.', '', `- Data lock: kiwee ${report.versionLock.kiweeChangelogVersion} (${report.versionLock.kiweeChangelogDate}); tool ${report.versionLock.toolVersion}.`, `- ${s.inputs} inputs; ${s.uniqueEntries} unique expanded entries; ${s.rawOccurrences} raw occurrences.`, `- Foundry: ${s.foundryRows} rows; ${s.foundryMatchedRows} matched; ${s.foundryOrphans} orphans.`, `- Identity gaps: ${s.unresolvedIdentities}; unresolved copies: ${s.unresolvedCopies}; unresolved parents/variants: ${s.unresolvedParentsOrVariants}.`, `- Duplicate occurrences: ${s.duplicateOccurrences}; conflicting duplicates: ${s.duplicateConflicts}.`, '', 'Temporary verdict priority: payload-bearing Foundry match, otherwise structured field presence, otherwise proseOnly. Neither field presence nor Foundry presence proves complete mechanics.', '', 'rawOccurrences counts source rows before inheritance and variants. item includes expanded concrete magic items; baseitem and magicvariant remain separately identifiable. Extra kinds are listed separately from the core DoD kinds.', ''];
  for (const source of Object.keys(report.matrix).sort()) {
    lines.push(`## ${source}`, '', '| kind | total | structuredCandidate | foundryCandidate | proseOnly | withStructured | Foundry match | Foundry payload |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
    for (const [kind, cell] of Object.entries(report.matrix[source]).sort(([a], [b]) => a.localeCompare(b))) lines.push(`| ${kind} | ${cell.total} | ${cell.structuredCandidate} | ${cell.foundryCandidate} | ${cell.proseOnly} | ${cell.withStructured} | ${cell.withFoundryMatch} | ${cell.withFoundryPayload} |`);
    lines.push('');
  }
  lines.push('## Unresolved boundaries', '', 'Foundry raceFeature/subEntities may describe inline features that have no standalone catalog entry. They remain orphans rather than matching a race by name. Identity gaps and duplicate conflicts must be resolved before G2 identity approval and G3 equivalence. No verdict automated/noMechanics/unsupported is claimed at G1.', '');
  return lines.join('\n');
}
export async function reportCorpus(cache: string, out: string, manifest: InputManifest) {
  const files: CorpusBody[] = [];
  for (const input of manifest.inputs) files.push({ input, body: JSON.parse((await readFile(join(cache, input.namespace, input.path), 'utf8')).replace(/^\uFEFF/, '')) });
  const report = inventory(files, manifest);
  assertNoProse(report);
  await mkdir(out, { recursive: true });
  await writeFile(join(out, 'coverage-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(join(out, 'coverage-report.md'), markdown(report));
  const inputs = { toolVersion: manifest.toolVersion, inputs: report.versionLock.inputs };
  assertNoProse(inputs);
  await writeFile(join(out, 'inputs-sha256.json'), `${JSON.stringify(inputs, null, 2)}\n`);
  const gaps = { phase: 'G1-inventory', foundryOrphans: report.foundryOrphans, unresolvedIdentities: report.entries.filter(row => row.identity.unresolved.length).map(row => row.identity), duplicateConflicts: report.duplicateConflicts };
  assertNoProse(gaps);
  await writeFile(join(out, 'inventory-gaps.json'), `${JSON.stringify(gaps, null, 2)}\n`);
  return report;
}
