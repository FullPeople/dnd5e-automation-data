import { createHash } from 'node:crypto';
import { createIdentity } from '../../identity.ts';
import type { Material } from '../catalogue.ts';
import { canonical, resource, unsupported, type DerivationContext, type Result } from './common.ts';

const identity = createIdentity({kind:'feat',source:'HumblewoodTales',engName:'Flamewoken',packId:'kiwee-homebrew'});
const digest = '488bfa8c5e260fadf5d4eca75d059c966e81f1d694e86168fa996db5d0829531';
const presentation = new Set(['soundClip','hasFluff','hasFluffImages','translator']);
const names = new Set(['flamewoken','焰醒者']);
const named = (row: Material) => [row.raw.name,row.raw.ENG_name,row.identity.engName].map(canonical).some(name => names.has(name));

function sortedJSON(value: unknown): string {
  if (Array.isArray(value)) return '['+value.map(sortedJSON).join(',')+']';
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).sort(([a],[b]) => a<b ? -1 : a>b ? 1 : 0);
    return '{'+entries.map(([k,v]) => JSON.stringify(k)+':'+sortedJSON(v)).join(',')+'}';
  }
  const json = JSON.stringify(value);
  if (json === undefined) throw new Error('Expected JSON source.');
  return json;
}

/** Emits only the confirmed counter. Exact source changes and ambiguous copies fail closed. */
export function reviewedFlamewokenResource(row: Material, ctx: DerivationContext, out: Result): void {
  if (!named(row) || ![row.raw.source,row.identity.source].some(s => canonical(s)==='humblewoodtales')) return;
  const family='reviewedFlamewokenResource';
  const reject=()=>unsupported(out,family,'unreviewed-flamewoken-fire-empowerment','entries');
  try {
    if (row.identityConflict || row.namespace!=='kiwee-homebrew' || row.edition!=='2014' || row.expansion!=='source' ||
        sortedJSON(row.identity)!==sortedJSON(identity) || !ctx.rows.includes(row) ||
        ctx.rows.filter(candidate => candidate.identity.key===identity.key ||
          (candidate.identity.kind==='feat'&&canonical(candidate.identity.source)==='humblewoodtales'&&named(candidate))).length!==1) return reject();
    const mechanics = Object.fromEntries(Object.entries(row.raw).filter(([key]) => !presentation.has(key)));
    if (createHash('sha256').update(sortedJSON(mechanics)).digest('hex')!==digest) return reject();
  } catch {
    return reject();
  }
  resource(out,{key:'flamewoken-fire-empowerment',max:{value:1},recovery:[{period:'short',amount:'all'},{period:'long',amount:'all'}]});
  unsupported(out,family,'feat-acquisition-ownership-deferred','entries');
  unsupported(out,family,'flamewoken-fire-effect-and-spending-deferred','entries/1/items/2');
  unsupported(out,family,'flamewoken-mundane-flame-manipulation-deferred','entries/1/items/3');
}
