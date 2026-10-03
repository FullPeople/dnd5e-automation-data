import { resolve } from 'node:path';
import { fetchCorpus } from './fetch/index.ts';
import { reportCorpus } from './report/inventory.ts';
import { readFile } from 'node:fs/promises';
import { validateAutomation, validateOverlay } from './validate/index.ts';
import { deriveFiles } from './derive/index.ts';

const args = process.argv.slice(2), command = args.shift();
function flag(name: string, fallback: string): string { const at = args.indexOf(name); if (at === -1) return fallback; if (!args[at + 1] || args[at + 1].startsWith('--')) throw Error(`Missing ${name} value`); return args[at + 1]; }
const cache = resolve(flag('--cache', command === 'fetch' ? flag('--out', '.cache/upstream') : '.cache/upstream'));
const out = resolve(command === 'fetch' ? 'reports/g1' : flag('--out', 'reports/g1'));
try {
  if (command === 'validate') {
    const path = resolve(flag('--file', 'artifacts/automation.json'));
    const value = JSON.parse(await readFile(path, 'utf8'));
    if (args.includes('--overlay')) validateOverlay(value); else validateAutomation(value);
    console.log(JSON.stringify({ valid: true, file: path }));
    process.exit(0);
  }
  if (!['fetch', 'report', 'inventory','derive'].includes(command || '')) throw Error('Use fetch, report, inventory, derive or validate; --cache DIR --out DIR --offline --no-homebrew');
  const manifest = await fetchCorpus(cache, { offline: command === 'report' || args.includes('--offline'), homebrew: !args.includes('--no-homebrew') });
  if(command==='derive') {const result=await deriveFiles(cache,out,manifest);console.log(JSON.stringify({phase:'G3-structured-draft',records:result.envelope.records.length,identityDiagnostics:result.diagnostics.length,completeAutomationClaim:false}));}
  else if (command === 'fetch') console.log(JSON.stringify({ inputs: manifest.inputs.length, manifest: `${cache}/inputs-sha256.json` }));
  else { const report = await reportCorpus(cache, out, manifest); console.log(JSON.stringify(report.summary, null, 2)); }
} catch (error: any) { console.error(error.message); process.exitCode = 1; }
