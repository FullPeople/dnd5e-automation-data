import { canonical, integer, numeric, plain, unsupported, type Result } from '../structured/common.ts';
import { parseFormula } from '../../validate/formula.ts';
import type { Raw } from '../catalogue.ts';
import type { Scale } from '../../protocol.ts';
export const scaleIdentifier = (id: unknown): string | undefined => typeof id === 'string' && /^[a-z][a-z0-9_-]*$/i.test(id) ? canonical(id).replaceAll('-', '_') : undefined;
export function scales(raw: Raw, out: Result): Map<string,string> {
  const aliases = new Map<string,string>();
  for (const [index, a] of (raw.advancement || []).entries()) {
    const c = a.configuration, key = scaleIdentifier(c?.identifier), ref = `advancement/${index}`;
    if (a.type !== 'ScaleValue') { unsupported(out, 'advancement', 'advancement-type-deferred', ref); continue; }
    if (!key || !plain(c.scale) || !['number','dice'].includes(c.type)) { unsupported(out, 'scale', 'scale-definition', ref); continue; }
    const values: Scale['values'] = []; let valid = true;
    for (const [level, value] of Object.entries(c.scale)) {
      const n = Number(level), row = value as Raw;
      if (!integer(n,0,20) || !plain(row)) { valid = false; break; }
      if (c.type === 'number') { const v = numeric(row.value); if (v === undefined || Math.abs(v) > 10000) { valid = false; break; } values.push({level:n,value:v}); }
      else { const count=row.number??row.n,faces=row.faces??row.die;if (!integer(count,1,100) || !integer(faces,2,1000)) { valid = false; break; } values.push({level:n,dice:{count,faces}}); }
    }
    if (!valid || !values.length || out.mechanics.scales?.some(s => s.key === key)) { unsupported(out, 'scale', 'scale-definition', ref); continue; }
    values.sort((a,b)=>a.level-b.level); (out.mechanics.scales ||= []).push({key,values}); aliases.set(c.identifier,key);
    if (c.type === 'dice') unsupported(out, 'diceScale', 'dice-scale-roll-deferred', ref);
  }
  return aliases;
}
export function formula(value: unknown, aliases = new Map<string,string>()): string | undefined {
  if (typeof value !== 'string') return;
  let normalized = value.trim().replace(/^\+\s+/, '+');
  // Only known identifiers are rewritten; subtraction in @prof-1 stays subtraction.
  for (const [from,to] of [...aliases].sort((a,b)=>b[0].length-a[0].length)) normalized = normalized.replace(new RegExp(`(@scale\\.(?:[a-zA-Z0-9_]+\\.)?)${from.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?=$|[^a-zA-Z0-9_])`,'g'), `$1${to}`);
  try { parseFormula(normalized); return normalized; } catch { return; }
}
