import { resolve } from 'node:path';
import { fetchCorpus } from './fetch/index.ts';
import { reportCorpus } from './report/inventory.ts';

const args = process.argv.slice(2), command = args.shift();
function flag(name: string, fallback: string): string { const at = args.indexOf(name); if (at === -1) return fallback; if (!args[at + 1] || args[at + 1].startsWith('--')) throw Error(`Missing ${name} value`); return args[at + 1]; }
const cache = resolve(flag('--cache', command === 'fetch' ? flag('--out', '.cache/upstream') : '.cache/upstream'));
const out = resolve(command === 'fetch' ? 'reports/g1' : flag('--out', 'reports/g1'));
try {
  if (!['fetch', 'report', 'inventory'].includes(command || '')) throw Error('Use fetch, report or inventory; --cache DIR --out DIR --offline --no-homebrew');
  const manifest = await fetchCorpus(cache, { offline: command === 'report' || args.includes('--offline'), homebrew: !args.includes('--no-homebrew') });
  if (command === 'fetch') console.log(JSON.stringify({ inputs: manifest.inputs.length, manifest: `${cache}/inputs-sha256.json` }));
  else { const report = await reportCorpus(cache, out, manifest); console.log(JSON.stringify(report.summary, null, 2)); }
} catch (error: any) { console.error(error.message); process.exitCode = 1; }
