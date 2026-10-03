import { prepareBody, expandVersions, specificMagicItems } from '../inventory/expand.ts';
import { inheritSubrace } from '../inventory/subrace.ts';
import { context, identity as provisional, digest, label } from '../inventory/identity.ts';
import { createIdentity, type Identity } from '../identity.ts';
import { KINDS } from '../fetch/manifest.ts';
import type { CorpusBody } from '../report/inventory.ts';
import type { Edition } from '../protocol.ts';
export type Raw = Record<string, any>;
export interface IdentityAlias { inventoryKey: string; engName: string; ref: string; reviewer: string; reviewedAt: string }
export interface Material { identity: Identity; raw: Raw; namespace: string; files: string[]; edition?: Edition; expansion: string }
export interface Diagnostic { key: string; code: string; files: string[] }
/** Expansion matches the G1 denominator; raw snapshots remain private inputs. */
export function materialize(files: CorpusBody[], aliases: IdentityAlias[] = []) {
  const catalog = files.filter(file => file.input.role === 'catalog'), ctx = context(catalog.map(file => file.body));
  const aliasMap = new Map(aliases.map(row => [row.inventoryKey, row]));
  if (aliasMap.size !== aliases.length) throw Error('Duplicate identity aliases');
  const rows = new Map<string, Material>(), fingerprints = new Map<string, string>(), diagnostics: Diagnostic[] = [];
  let occurrences = 0;
  const put = (kind: string, raw: Raw, namespace: string, file: string, expansion: string) => {
    occurrences++;
    const pending = provisional(kind, raw, ctx, namespace), alias = aliasMap.get(pending.key);
    if (alias) pending.engName = alias.engName;
    const unresolved = pending.unresolved.filter(field => !(field === 'engName' && alias));
    if (unresolved.length) { diagnostics.push({ key: pending.key, code: 'identity-unresolved', files: [label(file)] }); return; }
    const { key: _key, unresolved: _unresolved, ...fields } = pending;
    const id = createIdentity({ ...fields, packId: namespace });
    const edition: Edition | undefined = ['PHB', 'DMG', 'MM'].includes(id.source) || ['classic', '经典'].includes(raw.edition) ? '2014' : ['XPHB', 'XDMG', 'XMM'].includes(id.source) || ['one', '一'].includes(raw.edition) ? '2024' : undefined;
    const old = rows.get(id.key), fingerprint = digest(raw);
    if (old) {
      old.files = [...new Set([...old.files, label(file)])].sort();
      if (fingerprints.get(id.key) !== fingerprint) diagnostics.push({ key: id.key, code: 'duplicate-conflict', files: old.files });
    } else { rows.set(id.key, { identity: id, raw, namespace, files: [label(file)], edition, expansion }); fingerprints.set(id.key, fingerprint); }
  };
  for (const namespace of [...new Set(catalog.map(file => file.input.namespace))].sort()) {
    const merged: Raw = {}, origins = new Map<Raw, string>();
    for (const file of catalog.filter(file => file.input.namespace === namespace)) for (const [kind, raws] of Object.entries(file.body)) if (Array.isArray(raws)) {
      merged[kind] ||= [];
      for (const row of raws) if (row && typeof row === 'object') { const adapted = namespace === 'kiwee-homebrew' ? { ...row, edition: row.edition || file.body._meta?.edition, _homebrew: true } : row; merged[kind].push(adapted); origins.set(adapted, file.input.path); }
    }
    const prepared = prepareBody(merged);
    for (const kind of KINDS) for (const [at, raw] of (prepared[kind] || []).entries()) {
      const file = origins.get(merged[kind][at]) || '', inherited = kind === 'subrace' ? inheritSubrace(raw, prepared.race || []) : raw;
      if(kind==='subrace') {
        const parent=(prepared.race||[]).find((r:Raw)=>[r.name,r.ENG_name].includes(raw.raceName)&&r.source===(raw.raceSource||'PHB'));
        if(parent)for(const field of ['skillProficiencies','toolProficiencies','languageProficiencies','weaponProficiencies','armorProficiencies'])if(!raw.overwrite?.[field]&&parent[field]?.length&&raw[field]?.length){
          // Parent and child grants are cumulative. Alternatives inside each
          // source stay independent rather than turning inheritance into OR.
          (inherited._proficiencyGroups||={})[field]=[{origin:'parent',value:parent[field]},{origin:'child',value:raw[field]}];
        }
      }
      put(kind, inherited, namespace, file, 'source'); for (const version of expandVersions(inherited)) put(kind, version, namespace, file, 'version');
    }
    for (const raw of specificMagicItems(prepared)) put('item', raw, namespace, 'derived/magicvariant', 'specificMagicItem');
  }
  return { rows: [...rows.values()].sort((a, b) => a.identity.key.localeCompare(b.identity.key)), diagnostics, occurrences, context: ctx };
}
