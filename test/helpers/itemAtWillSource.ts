import {readFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {buildConsumerAdapter} from '../../src/runtimeCoverage/adapter.ts';
export {streamingJsonSha256 as digest} from './streamingJsonHash.ts';
import {streamingJsonSha256 as digest} from './streamingJsonHash.ts';
export const pins={
 'items-base.json':'8933a3e70e47aa4fd6196bd7f1f2e3a57d6d8dbe7e781d37bb6a0519d7c4ffff',
 'items.json':'883f7bb4df2eb35fb37e7caa3a8765e0209014caa360d1c0358daa6f4b2da488',
 'magicvariants.json':'4a4b0f3c8b268d8b134386f16e705df9b14d60419b2f2fa160da45b78bd4967d',
 'spells/spells-phb.json':'e1f2221020cfb5d31995c99b78dc09435c9962476ef1cef81b52399e6df0263d',
 'spells/spells-xphb.json':'87e4b76595ea895e01641de2cba3d75bff590957f08a9210530c28ffa296770d',
 'generated/gendata-spell-source-lookup.json':'8b78d1ce68d080a760b41bc65e846755c98fa1a3916b70d3d5d0dc8f5af1b9a9'
};
let cachedInputs:{url:string;sha256:string;body:any}[]|undefined;
export function inputs(){if(cachedInputs)return cachedInputs;const root=process.env.ITEM_ATWILL_FROZEN_DIR;if(!root)throw Error('ITEM_ATWILL_FROZEN_DIR required');const index=JSON.parse(readFileSync(join(root,'index.json'),'utf8'));return cachedInputs=Object.entries(pins).map(([path,sha256])=>{const url='https://5e.kiwee.top/data/'+path,rows=index.rows.filter((r:any)=>r.url===url);if(rows.length!==1||rows[0].sha256!==sha256||!/^files\/[a-f0-9]{64}\.json$/.test(rows[0].path))throw Error('Exact original at-will input required');const body=JSON.parse(readFileSync(join(root,rows[0].path),'utf8'));if(digest(body)!==sha256)throw Error('Original at-will input hash mismatch');return {url,sha256,body};});}
export function catalog(api:any){const files=inputs(),perFile=files.flatMap(f=>api.normalizeCatalogData(structuredClone(f.body),f.sha256,'kiwee')),merged=new Map(perFile.map((e:any)=>[e.id,e])),equipment=Object.assign({},...files.filter(f=>/\/data\/(items-base|items|magicvariants)\.json$/.test(f.url)).map(f=>structuredClone(f.body))),lookup=files.find(f=>f.url.endsWith('gendata-spell-source-lookup.json'))!;for(const operation of ['normalize','magicItems'])for(const e of api.normalizeCatalogData(equipment,'actual-combined-input-cache','kiwee',operation))merged.set(e.id,e);return {perFile,entries:[...merged.values()].map((e:any)=>api.hydrateSpellLookup(e,lookup.body,lookup.sha256))};}
export const unique=(entries:any[],english='Helm of Comprehending Languages',source='DMG')=>{const matches=entries.filter(e=>e.kind==='item'&&e.english===english&&e.source===source);if(matches.length!==1)throw Error('Unique exact source item required');return matches[0];};
export async function load(root:string,output:string){await buildConsumerAdapter(root,output);return import(pathToFileURL(output).href);}
export const scratchDirectory=()=>mkdtempSync(join(tmpdir(),'item-atwill-data-'));
