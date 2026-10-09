import {it,expect} from 'vitest';
import {candidateWitnessChoices} from '../src/runtimeCoverage/probe.ts';
const ref='Authored Grant|Authored Class|XPHB|19';
function setup(){return {selections:[{id:'parent',level:19,entry:{kind:'class',name:'Authored Class',english:'Authored Class',source:'XPHB',raw:{classFeatures:[ref]}}},{id:'candidate',parentId:'parent',grantKey:'ref:'+ref,entry:{kind:'feature',source:'XPHB',raw:{_category:'classFeature',className:'Authored Class',classSource:'XPHB',level:19}}}]};}
const own={id:'direct',ownerId:'candidate'},canonical={id:'canonical',ownerId:'parent',sourceProgression:'feat',duplicateChoiceIds:['candidate:filter:0']},unrelated={id:'unrelated',ownerId:'parent',sourceProgression:'feat',duplicateChoiceIds:['another:filter:0']};
it('attributes only the declared candidate-filter alias moved to its canonical class choice',()=>{expect(candidateWitnessChoices(setup(),[own,canonical,unrelated])).toEqual([own,canonical]);});
it.each(['no parent','manual grant','wrong source','wrong class','wrong level','future grant','undeclared reference','other category','other alias'])('does not infer a parent-owned witness for %s',mode=>{
 const card=setup(),candidate:any=card.selections[1],parent:any=card.selections[0],choice:any=structuredClone(canonical);
 if(mode==='no parent')delete candidate.parentId;if(mode==='manual grant')delete candidate.grantKey;if(mode==='wrong source')candidate.entry.source='PHB';if(mode==='wrong class')candidate.entry.raw.className='Different';if(mode==='wrong level')candidate.entry.raw.level=18;if(mode==='future grant')parent.level=18;if(mode==='undeclared reference')parent.entry.raw.classFeatures=[];if(mode==='other category')choice.sourceProgression='optional';if(mode==='other alias')choice.duplicateChoiceIds=['another:filter:0'];
 expect(candidateWitnessChoices(card,[own,choice])).toEqual([own]);
});
it('uses an explicit object classFeature reference without broadening attribution',()=>{const card=setup();(card.selections[0].entry.raw as any).classFeatures=[{classFeature:ref}];expect(candidateWitnessChoices(card,[canonical,unrelated])).toEqual([canonical]);});
