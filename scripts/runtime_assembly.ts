/** Report assembly may recover a completed unchanged-source observation run;
 * it cannot adopt observations from a different probe, input recipe or source. */
export function assertSameObservationRecipe(oldScript:string,currentScript:string,oldSource:string,currentSource:string,oldAliases:string,currentAliases:string){
 const marker='const producerRevision=';
 if(!oldScript.includes(marker)||!currentScript.includes(marker)||oldScript.slice(0,oldScript.indexOf(marker))!==currentScript.slice(0,currentScript.indexOf(marker))||oldSource!==currentSource||oldAliases!==currentAliases)throw Error('Completed observation recipe/source changed; a fresh full replay is required');
}
export function splitConsumerSourcePaths(paths:string[]){
 const runtime:string[]=[],styles:string[]=[];
 for(const path of new Set(paths)){
  if(!/^src\/[\w./-]+\.(tsx?|json|css)$/.test(path)||path.split('/').some(part=>part==='.'||part==='..'))throw Error('Unclassified or unsafe consumer source');
  (path.endsWith('.css')?styles:runtime).push(path);
 }
 return {runtime,styles};
}
