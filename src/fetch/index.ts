import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { request } from './http.ts';
import { STATIC_PATHS, FOUNDRY_PATHS, type InputFile, type InputManifest } from './manifest.ts';

export const hash = (body: Buffer | string) => createHash('sha256').update(body).digest('hex');
export function safePath(path: string): boolean { return typeof path === 'string' && path.endsWith('.json') && !/^[a-z]+:|^[\\/]|[?#\\]/i.test(path) && !path.split('/').some(part => !part || part === '.' || part === '..'); }
const parse = (body: Buffer) => JSON.parse(body.toString('utf8').replace(/^\uFEFF/, ''));
const BASE = 'https://5e.kiwee.top';
const BREW = 'https://homebrew.kiwee.top';

export async function fetchCorpus(cache: string, options: { offline?: boolean; homebrew?: boolean } = {}): Promise<InputManifest> {
  let prior: InputManifest = { toolVersion: '0.0.1', inputs: [] };
  try { prior = JSON.parse(await readFile(join(cache, 'inputs-sha256.json'), 'utf8')); } catch (error: any) { if (error.code !== 'ENOENT') throw error; }
  if (options.offline) {
    if (!prior.inputs.length) throw Error('No locked input manifest for offline replay');
    for (const input of prior.inputs) if (hash(await readFile(join(cache, input.namespace, input.path))) !== input.sha256) throw Error(`Cached input hash mismatch: ${input.namespace}/${input.path}`);
    return prior;
  }
  const inputs = new Map<string, InputFile>();
  let stopped: Error | undefined;
  async function load(base: string, namespace: string, path: string, role: InputFile['role']): Promise<any> {
    if (stopped) throw stopped;
    if (!safePath(path)) throw Error('Unsafe upstream input path');
    const url = `${base}/${path.split('/').map(encodeURIComponent).join('/')}`;
    const file = join(cache, namespace, path);
    const previous = prior.inputs.find(input => input.url === url);
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await request(url, previous?.etag);
        const body = response.status === 304 ? await readFile(file) : response.body;
        if (response.status !== 200 && response.status !== 304) throw Error(`HTTP ${response.status}: ${url}`);
        const data = parse(body), sha256 = hash(body);
        if (response.status === 304 && sha256 !== previous?.sha256) throw Error('Cached input differs from locked hash');
        await mkdir(dirname(file), { recursive: true });
        if (response.status !== 304) await writeFile(file, body);
        inputs.set(url, { url, namespace, path, role, sha256, bytes: body.length, fetchedAt: previous && previous.sha256 === sha256 ? previous.fetchedAt : new Date().toISOString(), etag: response.etag || previous?.etag });
        console.log(`${response.status} ${namespace}/${path} ${body.length}B`);
        return data;
      } catch (error: any) {
        if (attempt === 2) { stopped = Error(`Stopped after two failures: ${namespace}/${path}: ${error.message}`); throw stopped; }
        console.error(`First fetch failure: ${namespace}/${path}: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  await load(BASE, 'kiwee', 'data/changelog.json', 'version');
  const paths = [...STATIC_PATHS];
  for (const category of ['class', 'spells']) {
    const index = await load(BASE, 'kiwee', `data/${category}/index.json`, 'index');
    const values = [...new Set(Object.values(index).filter((value): value is string => typeof value === 'string' && /^[\w.-]+\.json$/.test(value)))];
    if (!values.length) throw Error(`Empty ${category} index`);
    paths.push(...values.map(path => `data/${category}/${path}`));
  }
  const tasks = [...new Set(paths)].map(path => ({ base: BASE, namespace: 'kiwee', path, role: 'catalog' as InputFile['role'] }));
  tasks.push(...FOUNDRY_PATHS.map(path => ({ base: BASE, namespace: 'kiwee', path, role: 'foundry' as InputFile['role'] })));
  if (options.homebrew !== false) {
    const index = await load(BREW, 'kiwee-homebrew', '_generated/index-sources.json', 'index');
    const paths = [...new Set(Object.values(index).filter((value): value is string => typeof value === 'string' && safePath(value)))];
    if (!paths.length) throw Error('Empty homebrew source index');
    tasks.push(...paths.map(path => ({ base: BREW, namespace: 'kiwee-homebrew', path, role: 'catalog' as InputFile['role'] })));
  }
  let cursor = 0;
  const outcomes = await Promise.allSettled(Array.from({ length: 4 }, async () => {
    while (cursor < tasks.length && !stopped) {
      const task = tasks[cursor++];
      await load(task.base, task.namespace, task.path, task.role);
    }
  }));
  for (const outcome of outcomes) if (outcome.status === 'rejected') throw outcome.reason;
  const manifest: InputManifest = { toolVersion: '0.0.1', inputs: [...inputs.values()].sort((a, b) => a.url.localeCompare(b.url)) };
  await mkdir(cache, { recursive: true });
  await writeFile(join(cache, 'inputs-sha256.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}
