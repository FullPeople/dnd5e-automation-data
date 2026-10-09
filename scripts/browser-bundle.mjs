import {Ajv2020} from 'ajv/dist/2020.js';
import standalone from 'ajv/dist/standalone/index.js';
import {build} from 'esbuild';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url)),out=resolve(process.argv[2]||'artifacts/browser');
await mkdir(out,{recursive:true});
const schema=JSON.parse(await readFile(join(root,'schema/automation-ir.schema.json'),'utf8'));
const overlay=JSON.parse(await readFile(join(root,'schema/overlay.schema.json'),'utf8'));
const record={$schema:schema.$schema,$id:schema.$id.replace('automation-ir','record'),$ref:'#/$defs/record',$defs:schema.$defs};
const ajv=new Ajv2020({allErrors:true,strict:true,strictRequired:false,code:{source:true,esm:true}});
ajv.addSchema(schema);ajv.addSchema(overlay);ajv.addSchema(record);
async function compiled(exports){
 const generated=standalone(ajv,exports),result=await build({stdin:{contents:generated,resolveDir:root,sourcefile:'schema-validation.generated.js'},bundle:true,write:false,metafile:true,format:'esm',platform:'browser',target:'es2022',legalComments:'inline'});
 if(Object.values(result.metafile.outputs).some(output=>output.imports.length))throw Error('Browser validator contains an external import');
 const metadata='    ucs2length.code = \'require("ajv/dist/runtime/ucs2length").default\';\n';
 let code=result.outputFiles[0].text;if(!code.includes(metadata))throw Error('Ajv helper changed; review adapter');code=code.replace(metadata,'');
 const match=code.match(/\nexport \{\n([\s\S]*?)\n\};\s*$/);if(!match)throw Error('Compiled export adapter changed');
 const names=match[1].split(',').map(name=>name.trim());if(names.some(name=>!Object.hasOwn(exports,name)))throw Error('Unexpected compiled validator export');
 return code.slice(0,match.index)+`\nreturn {${names.join(',')}};\n`;
}
const withoutImports=text=>text.replace(/^import[^\r\n]*;\r?\n/gm,'');
const identity=await readFile(join(root,'src/identity.ts'),'utf8'),protocol=withoutImports(await readFile(join(root,'src/protocol.ts'),'utf8')),formula=await readFile(join(root,'src/validate/formula.ts'),'utf8');
let semantic=await readFile(join(root,'src/validate/index.ts'),'utf8');
const start=semantic.indexOf('// Conditional required checks'),end=semantic.indexOf('const bodyFields');if(start<0||end<start)throw Error('Semantic adapter anchor changed');
semantic=withoutImports(semantic.slice(0,start)+semantic.slice(end));
const types=`interface SchemaError {instancePath:string;message?:string}\ninterface SchemaValidator {(value:unknown):boolean;errors:SchemaError[]|null}\n`;
// Independent pure factories preserve tree shaking for foreground record checks.
const validators=`const recordSchema:SchemaValidator=/* @__PURE__ */ (()=>{\n${await compiled({recordSchema:record.$id})}})().recordSchema;\nconst fullSchemas:{envelopeSchema:SchemaValidator;overlaysSchema:SchemaValidator}=/* @__PURE__ */ (()=>{\n${await compiled({envelopeSchema:schema.$id,overlaysSchema:overlay.$id})}})();\n`;
semantic=semantic.replace(/\benvelopeSchema\b/g,'fullSchemas.envelopeSchema').replace(/\boverlaysSchema\b/g,'fullSchemas.overlaysSchema');
// Compiler-produced JS remains unchecked as in the former .js schema files.
// Handwritten producer sources are strictly checked; public TS signatures stay.
const module='// @ts-nocheck\n// Generated browser-safe identity, protocol, formula and validation module.\n// No runtime imports. Regenerate from strictly checked producer sources.\n'+types+identity+'\n'+protocol+'\n'+formula+'\n'+validators+'\n'+semantic;
if(/^import\b/m.test(module)||/require\(["']ajv/.test(module))throw Error('Single browser module is not self-contained');
await writeFile(join(out,'identity.ts'),module);
// Test-only fixture: deliberately excluded from the runtime shared manifest.
await writeFile(join(out,'identity.fixture.json'),await readFile(join(root,'fixtures/shared/identity.json')));
const bytes=await readFile(join(out,'identity.ts')),manifest={sourceRepository:'FullPeople/dnd5e-automation-data',sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),files:{'identity.ts':createHash('sha256').update(bytes).digest('hex')}};
await writeFile(join(out,'shared-files.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({out,bytes:bytes.length,files:Object.keys(manifest.files)}));
