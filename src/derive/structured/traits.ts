import { fields, integer, modifier, plain, unsupported, type DerivationContext, type Result } from './common.ts';
import type { Raw } from '../catalogue.ts';
const modes = ['walk','fly','swim','climb','burrow','hover'];
export function traits(raw: Raw, ctx: DerivationContext, out: Result): void {
  fields(raw, out, ['resist','immune','vulnerable','conditionImmune'], (field, value) => {
    if (!Array.isArray(value)) { unsupported(out, 'defenses', 'defense-shape', field); return; }
    for (const part of value) {
      if (typeof part !== 'string') { unsupported(out, 'defenses', 'conditional-defense', field); continue; }
      const token = ctx.token(part, field === 'conditionImmune' ? 'condition' : 'damage');
      if (!token || !/^[a-z-]+$/.test(token)) unsupported(out, 'defenses', 'defense-token', field); else modifier(out, { target: `${field}:${token}`, op: 'set', value: true });
    }
  });
  fields(raw, out, ['speed'], (field, value) => {
    if (integer(value, 0, 1000)) { modifier(out, { target: 'speed.walk', op: 'set', value }); return; }
    if (!plain(value)) { unsupported(out, 'movement', 'speed-shape', field); return; }
    for (const [key, speed] of Object.entries(value)) {
      const number = plain(speed) ? speed.number : speed;
      if (!modes.includes(key) || !integer(number, 0, 1000)) { unsupported(out, 'movement', 'conditional-speed', `speed/${key}`); continue; }
      if (plain(speed) && Object.keys(speed).some(key => key !== 'number')) { unsupported(out, 'movement', 'conditional-speed', `speed/${key}`); continue; }
      modifier(out, { target: `speed.${key}`, op: 'set', value: number });
    }
  });
  fields(raw, out, ['darkvision'], (field, value) => { if (integer(value, 0, 10000)) modifier(out, { target: 'sense:darkvision', op: 'max', value }); else unsupported(out, 'senses', 'sense-shape', field); });
  fields(raw, out, ['senses'], (field, value) => {
    if (!Array.isArray(value)) { unsupported(out, 'senses', 'sense-shape', field); return; }
    for (const part of value) if (plain(part)) for (const [sense, range] of Object.entries(part)) { if (/^[a-z]+$/.test(sense) && integer(range)) modifier(out, { target: `sense:${sense}`, op: 'max', value: range }); else unsupported(out, 'senses', 'conditional-sense', field); } else unsupported(out, 'senses', 'sense-shape', field);
  });
  fields(raw, out, ['size'], (field, value) => { if (Array.isArray(value) && value.length === 1 && ['T','S','M','L','H','G'].includes(value[0])) modifier(out, { target: 'size', op: 'set', value: value[0] }); else unsupported(out, 'size', 'size-choice', field); });
  fields(raw, out, ['modifySpeed'], field => unsupported(out, 'movement', 'relative-speed', field));
}
