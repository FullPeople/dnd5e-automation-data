import { grant, integer, plain, unsupported, type DerivationContext, type Result } from './common.ts';
import type { Material } from '../catalogue.ts';
/** Read typed option nodes; plain prose never determines quotas or grants. */
export function choices(row:Material,ctx:DerivationContext,out:Result):void {
  const walk=(value:unknown,path:string,depth=0)=>{
    if(depth>12){unsupported(out,'inlineChoice','choice-depth-limit',path);return;}
    if(!Array.isArray(value))return;
    value.forEach((node,index)=>{
      if(!plain(node))return;const here=`${path}:${index}`;
      if(node.type==='options') {
        const count=node.count===undefined?1:node.count;
        if(!integer(count,1,100)||!Array.isArray(node.entries)){unsupported(out,'inlineChoice','inline-choice-shape',here);return;}
        const targets=node.entries.map((part:any)=>{const ref=part?.classFeature||part?.subclassFeature||part?.optionalfeature,target=typeof ref==='string'?ctx.resolve(ref,'feature',ref.includes('|')?undefined:row.identity.source):undefined;return target&&(!row.edition||!target.edition||row.edition===target.edition)?target.identity.key:undefined;});
        if(targets.length<count||targets.some((target:any)=>!target)||new Set(targets).size!==targets.length){unsupported(out,'inlineChoice','unresolved-inline-choice',here);return;}
        grant(out,{type:'feature',choose:{count,from:targets as string[]},key:`text-option:${here}`});return;
      }
      if(node.entries)walk(node.entries,here,depth+1);if(node.items)walk(node.items,`${here}:items`,depth+1);
    });
  };
  walk(row.raw.entries,'entries');
}
