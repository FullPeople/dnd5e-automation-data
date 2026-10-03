import {Ajv2020} from 'ajv/dist/2020.js';
import standalone from 'ajv/dist/standalone/index.js';
import {build} from 'esbuild';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(new URL('..',import.meta.url).pathname),out=resolve(process.argv[2]||'artifacts/browser');
await mkdir(out,{recursive:true});
const schema=JSON.parse(await readFile(join(root,'schema/automation-ir.schema.json'),'utf8'));
const overlay=JSON.parse(await readFile(join(root,'schema/overlay.schema.json'),'utf8'));
const record={$schema:schema.$schema,$id:schema.$id.replace('automation-ir','record'),$ref:'#/$defs/record',$defs:schema.$defs};
const ajv=new Ajv2020({allErrors:true,strict:true,strictRequired:false,code:{source:true,esm:true}});
ajv.addSchema(schema);ajv.addSchema(overlay);ajv.addSchema(record);
const source=standalone(ajv,{envelopeSchema:schema.$id,overlaysSchema:overlay.$id,recordSchema:record.$id});
const bundled=await build({stdin:{contents:source,resolveDir:root,sourcefile:'schema-validation.generated.js'},bundle:true,write:false,metafile:true,format:'esm',platform:'browser',target:'es2022',legalComments:'inline'});
const imports=Object.values(bundled.metafile.outputs).flatMap(output=>output.imports);if(imports.length)throw Error('Browser schema bundle contains an external import');
// Ajv's compiler helper metadata is not used by its precompiled validators.
// Remove the compiler-only require string; keep the bundled runtime function.
const compilerMetadata='    ucs2length.code = \'require("ajv/dist/runtime/ucs2length").default\';\n';
const browserCode=bundled.outputFiles[0].text;if(!browserCode.includes(compilerMetadata))throw Error('Ajv runtime helper changed; review its browser adapter');
await writeFile(join(out,'schema-validation.js'),browserCode.replace(compilerMetadata,''));
const recordBundle=await build({stdin:{contents:standalone(ajv,{recordSchema:record.$id}),resolveDir:root,sourcefile:'record-validation.generated.js'},bundle:true,write:false,metafile:true,format:'esm',platform:'browser',target:'es2022',legalComments:'inline'});
if(Object.values(recordBundle.metafile.outputs).some(output=>output.imports.length))throw Error('Record validator contains an external import');
await writeFile(join(out,'record-schema.js'),recordBundle.outputFiles[0].text.replace(compilerMetadata,''));
await writeFile(join(out,'record-schema.d.ts'),`import type {SchemaValidator} from './schema-validation.js';
export const recordSchema:SchemaValidator;
`);
await writeFile(join(out,'schema-validation.d.ts'),`export interface SchemaError {instancePath:string;message?:string}
export interface SchemaValidator {(value:unknown):boolean;errors:SchemaError[]|null}
export const envelopeSchema:SchemaValidator,overlaysSchema:SchemaValidator,recordSchema:SchemaValidator;
`);
let validate=await readFile(join(root,'src/validate/index.ts'),'utf8');
const start=validate.indexOf('// Conditional required checks'),end=validate.indexOf('const bodyFields');
if(start<0||end<start)throw Error('Semantic validator adapter anchor changed; review required');
validate=validate.slice(0,start)+validate.slice(end);
validate=validate.replace("import { Ajv2020 } from 'ajv/dist/2020.js';\n",'').replace("import { automationSchema, overlaySchema } from './schemas.ts';","import { envelopeSchema, overlaysSchema, recordSchema } from './schema-validation.js';");
validate=validate.replace("from '../identity.ts'","from './identity.ts'").replace("from '../protocol.ts'","from './protocol.ts'");
await writeFile(join(out,'validate.ts'),'// Generated semantic adapter; no runtime dependencies.\n'+validate);
const recordOnly=validate.slice(0,validate.indexOf('export function schemaErrors')).replace("import { envelopeSchema, overlaysSchema, recordSchema } from './schema-validation.js';","import {recordSchema} from './record-schema.js';")+validate.slice(validate.indexOf('export function recordErrors'));
await writeFile(join(out,'record-validation.ts'),'// Generated partial-snapshot semantic adapter; full dataset references are checked by the loader.\n'+recordOnly);

const files=['identity.ts','protocol.ts'];for(const file of files)await writeFile(join(out,file),await readFile(join(root,'src',file)));
await writeFile(join(out,'formula.ts'),await readFile(join(root,'src/validate/formula.ts')));
await writeFile(join(out,'identity.fixture.json'),await readFile(join(root,'fixtures/shared/identity.json')));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const shared={sourceRepository:'FullPeople/dnd5e-automation-data',sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),files:{}};
for(const file of ['identity.ts','protocol.ts','formula.ts','validate.ts','schema-validation.js','schema-validation.d.ts','identity.fixture.json','record-schema.js','record-schema.d.ts','record-validation.ts'])shared.files[file]=digest(await readFile(join(out,file)));
await writeFile(join(out,'shared-files.json'),JSON.stringify(shared,null,2)+'\n');
console.log(JSON.stringify({out,standaloneSchemaBytes:bundled.outputFiles[0].contents.length,files:Object.keys(shared.files)}));
