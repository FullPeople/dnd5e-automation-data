import table from './mapping-table.json' with { type: 'json' };
import { label } from '../../inventory/identity.ts';
import type { Raw } from '../catalogue.ts';
export interface Mapping { key: string; route: string; target?: string; family: string; reason: string }
export const mappings: Mapping[] = table;
const whitelist = new Map(mappings.map(row => [row.key, row]));
if (whitelist.size !== mappings.length) throw Error('Duplicate Foundry mapping keys');
export function mapping(key: string): Mapping { return whitelist.get(key) || { key: label(key), route: 'unsupported', family: 'foundryField', reason: 'unlisted-foundry-field' }; }
/** Accept both nested Foundry system objects and the upstream dotted-key form. */
export function systemLeaves(value: unknown, prefix = ''): [string, unknown][] {
  if (value && typeof value === 'object' && !Array.isArray(value)) return Object.entries(value).flatMap(([key, child]) => systemLeaves(child, prefix ? `${prefix}.${key}` : key));
  return [[prefix, value]];
}
export function observedKeys(raw: Raw): string[] {
  return [...(raw.activities || []).map((a: Raw) => `activity:${a.type || 'unspecified'}`), ...(raw.effects || []).flatMap((e: Raw) => (e.changes || []).map((c: Raw) => `effect.key:${c.key || 'unspecified'}`)), ...Object.keys(raw.entryData || {}).map(key => `entryData:${key}`), ...systemLeaves(raw.system || {}).filter(([key]) => key).map(([key]) => `system:${key}`), ...(raw.advancement || []).map((a: Raw) => `advancement:${a.type || 'unspecified'}`), ...['isIgnored','ignoreSrdEffects','ignoreSrdActivities'].filter(key => raw[key]).map(key => `flag:${key}`)];
}
