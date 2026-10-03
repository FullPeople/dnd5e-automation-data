import { amount, fields, integer, plain, resource, unsupported, type Result } from './common.ts';
import type { Raw } from '../catalogue.ts';
import type { Recovery } from '../../protocol.ts';
export function recovery(value: unknown): Recovery[] | undefined {
  if (value === undefined || value === 'manual') return [];
  if (['sr','short','restShort'].includes(String(value))) return [{ period:'short', amount:'all' },{ period:'long', amount:'all' }];
  if (['lr','long','restLong'].includes(String(value))) return [{ period:'long', amount:'all' }];
  if (value === 'dawn' || value === '\u62c2\u6653') return [{ period:'dawn', amount:'all' }];
  if (plain(value)) { const rows: Recovery[] = []; for (const [period, n] of Object.entries(value)) { if (!['short','long','dawn','manual'].includes(period) || n !== 'all' && !integer(n)) return; rows.push({ period: period as Recovery['period'], amount: n }); } return rows; }
  if (Array.isArray(value)) {
    const rows: Recovery[] = []; for (const rule of value) {
      const period = ({ sr:'short',lr:'long',dawn:'dawn','\u62c2\u6653':'dawn',short:'short',long:'long',manual:'manual' } as Record<string,Recovery['period']>)[rule?.period];
      const n = rule?.type === 'recoverAll' ? 'all' : amount(rule?.formula ?? rule?.amount);
      if (!period || !n) return; rows.push({ period, amount: n === 'all' ? 'all' : 'value' in n ? n.value : n.formula });
    } return rows;
  }
}
export function resources(raw: Raw, out: Result): void {
  const fieldsPresent = ['resources','resource','uses','system'].filter(key => Object.hasOwn(raw,key));
  fieldsPresent.forEach(key => out.handled.add(key));
  const value = Array.isArray(raw.resources) ? raw.resources : plain(raw.resource) ? [raw.resource] : plain(raw.uses) ? [{...raw.uses,recovery:raw.uses.recovery??raw.uses.per}] : plain(raw.system?.uses) ? [raw.system.uses] : [];
  if (!value.length && fieldsPresent.some(key => key !== 'system')) unsupported(out, 'resources', 'resource-shape');
  for (const [index, spec] of value.entries()) {
    const maximum = spec?.max ?? spec?.value ?? (spec?.type === 'dicePool' ? spec.count : undefined);
    const normalized = typeof maximum === 'string' ? maximum.replace(/<\$level\$>/g,'@class.level') : maximum;
    const max = amount(normalized), periods = recovery(spec?.recovery ?? spec?.recharge);
    if (!max || !periods) { unsupported(out, 'resources', 'resource-definition', `resources/${index}`); continue; }
    const formula = typeof spec.formula === 'string' ? amount(spec.formula) : undefined;
    if (spec.formula !== undefined && !formula) unsupported(out, 'resources', 'resource-formula', `resources/${index}`);
    if (spec.type === 'dicePool') unsupported(out, 'dicePool', 'dice-pool-roll-expression', `resources/${index}`);
    resource(out, { key: `resource:${index}`, max, recovery: periods, ...(formula && 'formula' in formula ? { formula: formula.formula } : {}) });
  }
  fields(raw, out, ['consumes'], field => unsupported(out, 'resources', 'external-consumption', field));
}
