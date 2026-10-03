import { createHash } from 'node:crypto';
type Raw = Record<string, any>;
const canonical = (value: unknown) => String(value ?? '').trim().toLowerCase();
export const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const hasCjk = (value: string) => /[\u3400-\u9fff\uf900-\ufaff\u{20000}-\u{323af}]/u.test(value);
export const label = (value: unknown) => { const text = String(value ?? ''); return hasCjk(text) ? `unresolved-${digest(text).slice(0, 20)}` : text; };
export interface IdentityContext { classes: Map<string, string>; subclasses: Map<string, string>; races: Map<string, string> }
export interface InventoryIdentity { kind: string; source: string; engName: string; classSource?: string; classEngName?: string; subclassSource?: string; subclassEngShortName?: string; raceSource?: string; raceEngName?: string; level?: number; extra?: string; key: string; unresolved: string[] }
export function context(bodies: Raw[]): IdentityContext {
  const result: IdentityContext = { classes: new Map(), subclasses: new Map(), races: new Map() };
  for (const body of bodies) {
    for (const raw of body.class || []) for (const name of [raw.name, raw.ENG_name]) if (name && raw.ENG_name) result.classes.set(`${canonical(raw.source)}:${canonical(name)}`, raw.ENG_name);
    for (const raw of body.race || []) for (const name of [raw.name, raw.ENG_name]) if (name && raw.ENG_name) result.races.set(`${canonical(raw.source)}:${canonical(name)}`, raw.ENG_name);
  }
  for (const body of bodies) for (const raw of body.subclass || []) {
    const parent = result.classes.get(`${canonical(raw.classSource || 'PHB')}:${canonical(raw.className)}`) || raw.className;
    for (const name of [raw.shortName, raw.name, raw.ENG_shortName, raw.ENG_name]) if (name && (raw.ENG_shortName || raw.ENG_name)) result.subclasses.set(`${canonical(raw.source)}:${canonical(raw.classSource || 'PHB')}:${canonical(parent)}:${canonical(name)}`, raw.ENG_shortName || raw.ENG_name);
  }
  return result;
}
/** Provisional G1 inventory key; it is not the approved automation-ir identity. */
export function identity(kind: string, raw: Raw, ctx: IdentityContext, namespace: string): InventoryIdentity {
  const unresolved: string[] = [];
  const english = (value: unknown, field: string): string => {
    if (!value || hasCjk(String(value))) { unresolved.push(field); return `unresolved-${digest({ field, value }).slice(0, 20)}`; }
    return String(value);
  };
  const source = label(String(raw.source || raw.inherits?.source || raw.classSource || 'CUSTOM').toUpperCase());
  const engName = english(raw.ENG_name || raw.name || raw.abbreviation || (kind === 'subrace' ? raw.raceName : undefined), 'engName');
  const result: InventoryIdentity = { kind, source, engName, key: '', unresolved };
  if (raw.className) {
    result.classSource = label(raw.classSource || 'PHB');
    result.classEngName = english(raw.classENG_name || raw.classEnglish || ctx.classes.get(`${canonical(raw.classSource || 'PHB')}:${canonical(raw.className)}`) || raw.className, 'classEngName');
  }
  const subclassShort = kind === 'subclass' ? raw.shortName : raw.subclassShortName;
  if (subclassShort) {
    result.subclassSource = label(raw.subclassSource || raw.source || 'PHB');
    const resolved = ctx.subclasses.get(`${canonical(result.subclassSource)}:${canonical(raw.classSource || 'PHB')}:${canonical(result.classEngName)}:${canonical(subclassShort)}`);
    result.subclassEngShortName = english(raw.ENG_shortName || resolved || subclassShort, 'subclassEngShortName');
  }
  if (kind === 'subrace' || raw.raceName) {
    result.raceSource = label(raw.raceSource || 'PHB');
    result.raceEngName = english(ctx.races.get(`${canonical(raw.raceSource || 'PHB')}:${canonical(raw.raceName)}`) || raw.raceName, 'raceEngName');
  }
  if (['classFeature', 'subclassFeature'].includes(kind)) result.level = Number(raw.level) || 0;
  if (raw._variantIdentity) result.extra = label(raw._variantIdentity);
  result.key = [namespace, kind, source, engName, result.classSource, result.classEngName, result.subclassSource, result.subclassEngShortName, result.level, result.raceSource, result.raceEngName, result.extra].map(canonical).map(encodeURIComponent).join(':');
  return result;
}
