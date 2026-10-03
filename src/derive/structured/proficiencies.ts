import { ABILITIES, SKILLS, fields, grant, integer, plain, unsupported, type DerivationContext, type Result } from './common.ts';
import type { Raw } from '../catalogue.ts';
import type { Grant } from '../../protocol.ts';
const families: Record<string, [string, string]> = { skillProficiencies: ['skillProficiency','skill'],toolProficiencies:['toolProficiency','tool'],languageProficiencies:['languageProficiency','language'],weaponProficiencies:['weaponProficiency','weapon'],armorProficiencies:['armorProficiency','armor'],savingThrowProficiencies:['savingThrow','ability'],expertise:['expertise','skill'] };
export function proficiencyBlocks(value: unknown, type: string, family: string, field: string, ctx: DerivationContext, out: Result, scope: Grant['scope'] = 'all'): void {
  const blocks = Array.isArray(value) ? value : typeof value === 'string' ? [value] : plain(value) ? [value] : undefined;
  if (!blocks) { unsupported(out, 'proficiency', 'proficiency-shape', field); return; }
  const token = (input: string) => family === 'ability' ? ABILITIES.includes(input) ? input : undefined : ctx.token(input, family);
  for (const [index, block] of blocks.entries()) {
    if (typeof block === 'string') { const fixed = token(block); if (fixed) grant(out, { type, fixed: [fixed], scope, key: `${field}:${index}` }); else unsupported(out, 'proficiency', 'unresolved-proficiency', `${field}/${index}`); continue; }
    if (!plain(block)) { unsupported(out, 'proficiency', 'proficiency-block', `${field}/${index}`); continue; }
    // 5etools proficiency object arrays are alternatives; members inside one
    // object are cumulative. Never grant every alternative (e.g. Scholar).
    const alternative = blocks.length > 1 && blocks.every(plain) ? { setKey: `${field}:set`, setOption: index } : {};
    const fixed = Object.entries(block).filter(([, v]) => v === true).flatMap(([key]) => { const result = token(key); if (!result) unsupported(out, 'proficiency', 'unresolved-proficiency', `${field}/${index}`); return result ? [result] : []; });
    if (fixed.length) grant(out, { type, fixed, scope, key: `${field}:${index}:fixed`, ...alternative });
    if (block.proficiency) {
      const fixed = typeof block.proficiency === 'string' ? token(block.proficiency) : undefined;
      if (fixed && !block.optional) grant(out, { type, fixed: [fixed], scope, key: `${field}:${index}`, ...alternative }); else unsupported(out, 'proficiency', 'optional-proficiency', `${field}/${index}`);
    }
    if (block.choose || block.any) {
      const choose = block.choose, count = choose ? choose.count ?? 1 : block.any;
      const from: unknown = choose?.from ?? (family === 'skill' ? SKILLS : ctx.rows.filter(row => family === 'language' ? row.identity.kind === 'language' : row.raw.tool).map(row => row.identity.engName));
      const normalized = Array.isArray(from) ? [...new Set(from.map(value => typeof value === 'string' ? token(value) : undefined))] : [];
      if (!integer(count, 1, 100) || !normalized.length || normalized.some(value => !value) || new Set(normalized).size !== normalized.length || count > normalized.length) { unsupported(out, 'proficiency', 'proficiency-choice', `${field}/${index}/choose`); continue; }
      grant(out, { type, choose: { count, from: normalized as string[] }, key: `${field}:${index}`, scope, ...alternative });
    }
    if (Object.entries(block).some(([key, value]) => !['choose','any','proficiency','optional'].includes(key) && value !== true)) unsupported(out, 'proficiency', 'proficiency-condition', `${field}/${index}`);
  }
}
export function proficiencies(raw: Raw, ctx: DerivationContext, out: Result): void {
  fields(raw, out, Object.keys(families), (field, value) => { const [type, family] = families[field];const groups=raw._proficiencyGroups?.[field];if(Array.isArray(groups))for(const group of groups)proficiencyBlocks(group.value,type,family,`${field}:${group.origin}`,ctx,out);else proficiencyBlocks(value, type, family, field, ctx, out); });
  fields(raw, out, ['skillToolLanguageProficiencies'], (field) => unsupported(out, 'proficiency', 'mixed-proficiency-choice', field));
}
