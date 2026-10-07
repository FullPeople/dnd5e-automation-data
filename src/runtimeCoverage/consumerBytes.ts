import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {lstatSync,readFileSync,realpathSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {validateCoverage} from './report.ts';

const digest=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

/** Verify the files CI will execute as well as their declared Git blobs. No cache or ledger writes. */
export function verifyConsumerBytes(value:unknown,webRoot:string){
 const report=validateCoverage(value),root=realpathSync(resolve(webRoot));
 const git=(args:string[])=>execFileSync('git',['--no-replace-objects',...args],{cwd:root,maxBuffer:16*1024*1024});
 if(realpathSync(git(['rev-parse','--show-toplevel']).toString().trim())!==root)throw Error('Consumer must be the checkout root');
 const revision=git(['rev-parse','HEAD']).toString().trim();
 if(revision!==report.consumer.revision)throw Error('Consumer revision does not match the coverage ledger');
 for(const module of report.consumer.modules){
  const parts=module.path.split('/');
  if(parts.some(part=>!part||part==='.'||part==='..'))throw Error('Unsafe consumer module path: '+module.path);
  // Refuse symlinks before reading, including links to files outside this checkout.
  let path=root;
  for(const part of parts){path=join(path,part);if(lstatSync(path).isSymbolicLink())throw Error('Symlink consumer module: '+module.path);}
  if(!lstatSync(path).isFile())throw Error('Consumer module is not a file: '+module.path);
  if(digest(readFileSync(path))!==module.sha256)throw Error('Consumer working bytes differ from coverage: '+module.path);
  if(digest(git(['cat-file','blob','HEAD:'+module.path]))!==module.sha256)throw Error('Consumer committed bytes differ from coverage: '+module.path);
 }
 return {repository:report.consumer.repository,revision,modules:report.consumer.modules.length};
}
