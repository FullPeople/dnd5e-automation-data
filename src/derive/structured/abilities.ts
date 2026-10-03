import { ABILITIES, fields, grant, integer, modifier, plain, unsupported, type Result } from './common.ts';
import type { Raw } from '../catalogue.ts';
/** Each ability alternative is explicit; backgrounds remain saved allocations. */
export function abilities(raw: Raw, out: Result): void {
  fields(raw, out, ['ability'], (_, value) => {
    if (!Array.isArray(value)) { unsupported(out, 'ability', 'ability-shape'); return; }
    for (const [index, block] of value.entries()) {
      if (!plain(block) || Object.keys(block).some(key => key !== 'choose' && !ABILITIES.includes(key))) { unsupported(out, 'ability', 'ability-block', `ability/${index}`); continue; }
      const alternatives = value.length > 1, set = alternatives ? { setKey: 'ability', setOption: index } : {};
      for (const [key, n] of Object.entries(block)) if (ABILITIES.includes(key)) {
        if (!integer(n, -10, 10)) { unsupported(out, 'ability', 'ability-value', `ability/${index}/${key}`); continue; }
        if (alternatives) grant(out, { type: 'abilityScore', fixed: [key], amount: n, ...set }); else modifier(out, { target: key, op: 'add', value: n });
      }
      if (block.choose) {
        const choose = block.choose, weighted = choose.weighted;
        const from = weighted?.from ?? choose.from, weights = weighted?.weights ?? Array.from({ length: Math.min(6, choose.count ?? 1) }, () => choose.amount ?? 1);
        if (!plain(choose) || Object.keys(choose).some(key => !['weighted', 'from', 'count', 'amount'].includes(key)) || !Array.isArray(from) || !from.length || from.some(key => !ABILITIES.includes(key)) || new Set(from).size !== from.length || !Array.isArray(weights) || !weights.length || weights.length > from.length || weights.some(n => !integer(n, 1, 10)) || choose.count !== undefined && !integer(choose.count, 1, 6)) { unsupported(out, 'ability', 'ability-choice', `ability/${index}/choose`); continue; }
        grant(out, { type: 'abilityScore', choose: { count: weights.length, from, weights }, key: `ability:${index}`, ...set });
      }
    }
  });
}
