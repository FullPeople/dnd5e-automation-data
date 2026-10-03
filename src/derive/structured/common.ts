import { containsCjk } from '../../identity.ts';
import { parseFormula } from '../../validate/formula.ts';
import type { Amount, Grant, Mechanics, Modifier, Resource, Unsupported } from '../../protocol.ts';
import type { Material, Raw } from '../catalogue.ts';
export const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
export const SKILLS = ['athletics','acrobatics','sleightofhand','stealth','arcana','history','investigation','nature','religion','animalhandling','insight','medicine','perception','survival','deception','intimidation','performance','persuasion'];
export const plain = (value: unknown): value is Raw => !!value && typeof value === 'object' && !Array.isArray(value);
export const canonical = (value: unknown) => String(value ?? '').normalize('NFKC').trim().toLowerCase();
export const integer = (value: unknown, low = 0, high = 10000): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= low && value <= high;
export const numeric = (value: unknown): number | undefined => typeof value === 'number' && Number.isFinite(value) ? value : typeof value === 'string' && /^[+-]?\d+(?:\.\d+)?$/.test(value.trim()) ? Number(value) : undefined;
export function amount(value: unknown): Amount | undefined { const number = numeric(value); if (number !== undefined && integer(number)) return { value: number }; if (typeof value === 'string') try { parseFormula(value); return { formula: value }; } catch {} return undefined; }
export interface DerivationContext { rows: Material[]; resolve: (reference: string, kind: string, source?: string) => Material | undefined; token: (value: string, family: string) => string | undefined; className: (name: string, source: string) => string | undefined }
export interface Result { mechanics: Mechanics; unsupported: Unsupported[]; handled: Set<string> }
export const result = (): Result => ({ mechanics: {}, unsupported: [], handled: new Set() });
export function unsupported(out: Result, family: string, code: string, ref?: string): void { if (!out.unsupported.some(row => row.family === family && row.code === code && row.ref === ref)) out.unsupported.push({ family, code, ...(ref && !containsCjk(ref) ? { ref } : {}) }); }
export function modifier(out: Result, value: Modifier): void { (out.mechanics.modifiers ||= []).push(value); }
export function grant(out: Result, value: Grant): void { (out.mechanics.grants ||= []).push(value); }
export function resource(out: Result, value: Resource): void { if (out.mechanics.resources?.some(row => row.key === value.key)) unsupported(out, 'resources', 'duplicate-resource', value.key); else (out.mechanics.resources ||= []).push(value); }
export function fields(raw: Raw, out: Result, names: string[], derive: (name: string, value: any) => void): void { for (const name of names) if (Object.hasOwn(raw, name)) { out.handled.add(name); derive(name, raw[name]); } }
export function makeContext(rows: Material[]): DerivationContext {
  const byName = new Map<string, Material[]>();
  for (const row of rows) for (const name of new Set([row.raw.name, row.raw.ENG_name, row.identity.engName].filter(Boolean))) { const key = canonical(name); byName.set(key, [...(byName.get(key) || []), row]); }
  const matching = (reference: string, kind: string, source?: string) => { const [name, book] = reference.replace(/^\{@\w+ ([^}]+)\}$/, '$1').split('|'); return (byName.get(canonical(name)) || []).filter(row => (row.identity.kind === kind || kind === 'item' && ['baseitem', 'magicvariant'].includes(row.identity.kind) || kind === 'feature' && ['classFeature', 'subclassFeature', 'optionalfeature'].includes(row.identity.kind)) && (!book && !source || canonical(row.identity.source) === canonical(book || source))); };
  const damage: Record<string,string> = { b:'bludgeoning',p:'piercing',s:'slashing',a:'acid',c:'cold',f:'fire',o:'force',l:'lightning',n:'necrotic',i:'poison',y:'psychic',r:'radiant',t:'thunder','\u5f3a\u9178':'acid','\u5bd2\u51b7':'cold','\u706b\u7130':'fire','\u529b\u573a':'force','\u95ea\u7535':'lightning','\u6697\u8680':'necrotic','\u6bd2\u7d20':'poison','\u5fc3\u7075':'psychic','\u5149\u8000':'radiant','\u96f7\u9e23':'thunder','\u949d\u51fb':'bludgeoning','\u7a7f\u523a':'piercing','\u6325\u780d':'slashing' };
  const tokens: Record<string, Record<string,string>> = { damage, condition: { '\u76ee\u76f2':'blinded','\u9b45\u60d1':'charmed','\u8033\u804b':'deafened','\u6050\u614c':'frightened','\u64d2\u62b1':'grappled','\u5931\u80fd':'incapacitated','\u9690\u5f62':'invisible','\u9ebb\u75f9':'paralyzed','\u77f3\u5316':'petrified','\u4e2d\u6bd2':'poisoned','\u5012\u5730':'prone','\u675f\u7f1a':'restrained','\u9707\u6151':'stunned','\u660f\u8ff7':'unconscious','\u529b\u7aed':'exhaustion' }, armor: { '\u8f7b\u7532':'light','\u4e2d\u7532':'medium','\u91cd\u7532':'heavy','\u76fe\u724c':'shield','light armor':'light','medium armor':'medium','heavy armor':'heavy','shields':'shield' }, weapon: { '\u7b80\u6613\u6b66\u5668':'simple','\u519b\u7528\u6b66\u5668':'martial','simple weapons':'simple','martial weapons':'martial' } };
  const resolve = (reference: string, kind: string, source?: string) => {
    const p=reference.split('|');
    if(['feature','classFeature','subclassFeature'].includes(kind)&&p.length>=4) {
      const sub=p.length>=6,book=sub?p[6]||p[4]||'PHB':p[4]||p[2]||'PHB';
      const candidates=rows.filter(row=>row.identity.kind===(sub?'subclassFeature':'classFeature')&&canonical(row.identity.source)===canonical(book)&&row.identity.level===Number(p[sub?5:3])&&[row.raw.name,row.raw.ENG_name,row.identity.engName].some(name=>canonical(name)===canonical(p[0]))&&[row.raw.className,row.identity.classEngName].some(name=>canonical(name)===canonical(p[1]))&&canonical(row.identity.classSource)===canonical(p[2]||'PHB')&&(!sub||canonical(row.identity.subclassSource)===canonical(p[4]||'PHB')&&[row.raw.subclassShortName,row.identity.subclassEngShortName].some(name=>canonical(name)===canonical(p[3]))));
      return candidates.length===1?candidates[0]:undefined;
    }
    const matches = matching(reference, kind, source); const preferred = kind === 'item' ? matches.filter(row => row.identity.kind === 'baseitem') : matches; return preferred.length === 1 ? preferred[0] : matches.length === 1 ? matches[0] : undefined;
  };
  return { rows, resolve, className: (name, source) => resolve(`${name}|${source}`, 'class')?.identity.engName,
    token: (value, family) => {
      const key = canonical(value); if (tokens[family]?.[key]) return tokens[family][key];
      if (family === 'weapon' && key === '\u7b80\u6613') return 'simple';
      if (family === 'weapon' && key === '\u519b\u7528') return 'martial';
      if (family === 'skill' && SKILLS.includes(key.replace(/[^a-z]/g,''))) return key.replace(/[^a-z]/g,'');
      if (family === 'damage' && new Set(Object.values(damage)).has(key)) return key;
      if (family === 'condition' && ['blinded','charmed','deafened','frightened','grappled','incapacitated','invisible','paralyzed','petrified','poisoned','prone','restrained','stunned','unconscious','exhaustion'].includes(key)) return key;
      if (family === 'armor' && ['light','medium','heavy','shield'].includes(key)) return key;
      if (family === 'weapon' && ['simple','martial','simple-melee','simple-ranged','martial-melee','martial-ranged','firearms'].includes(key)) return key;
      const category = family === 'skill' ? 'skill' : family === 'language' ? 'language' : family === 'condition' ? 'condition' : family === 'tool' || family === 'weapon' ? 'item' : undefined;
      const matches = category ? matching(value, category) : [];
      const identities = new Set(matches.map(row => row.identity.engName));
      const row = identities.size === 1 ? matches[0] : undefined;
      if (row) return family === 'skill' ? canonical(row.identity.engName).replace(/[^a-z]/g, '') : ['weapon','tool'].includes(family)&&value.includes('|') ? `${row.identity.engName}|${row.identity.source}` : row.identity.engName;
      return undefined;
    } };
}
