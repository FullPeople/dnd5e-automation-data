import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {buildSourceDiscovery,validateSourceDiscovery,compareDiscoveryEpochs,sourceInputMatchesGitPath} from '../scripts/source_discovery.ts';
const hash='a'.repeat(64),pin=(body:any,role:'legacy'|'extra'='extra')=>({url:'https://homebrew.kiwee.top/book/authored.json',sha256:hash,rawSha256:hash,role,body});
const setup=()=>({producerRevision:'b'.repeat(40),generatedAt:'2026-11-06T00:00:00Z',legacySnapshotSha256:hash,legacySources:[{id:'PHB',name:'旧版基础书'}],legacyIdentities:['original:phb'],candidateIdentities:[{id:'authored:xphb',source:'XPHB'}],inputs:[pin({_meta:{sources:[{json:'XPHB',full:'同名书'}]},class:[{name:'private authored rule sentinel'}]})],index:{url:'https://homebrew.kiwee.top/_generated/index-sources.json',sha256:hash,body:{PHB:'book/old.json',XPHB:'book/new.json',EMPTY:'book/empty.json'}},diagnostics:[]});
it('keeps all source-directory IDs including empty inventories and distinct editions',()=>{
 const report=buildSourceDiscovery(setup());expect(report.sources.map(row=>row.id)).toEqual(['EMPTY','PHB','XPHB']);expect(report.sources.find(row=>row.id==='EMPTY')?.inventory).toBe('pending');expect(report.counts.legacyRegisteredIdentities).toBe(1);expect(report.counts.newCandidateIdentities).toBe(1);expect(report.creditAdded).toEqual({sourceReviewed:0,modeled:0,executed:0,accepted:0});
});
it('never exports rule bodies, extra private fields or mutates the source inputs',()=>{const input=setup();Object.assign(input.inputs[0],{privateExtra:'private extra-field sentinel'});const before=JSON.stringify(input),report=buildSourceDiscovery(input);expect(JSON.stringify(input)).toBe(before);expect(JSON.stringify(report)).not.toContain('private authored rule sentinel');expect(JSON.stringify(report)).not.toContain('private extra-field sentinel');expect(report.inputs[0]).not.toHaveProperty('body');});
it('retains unknown directory IDs and invalid index paths with an explicit issue',()=>{const input=setup();input.index.body={...input.index.body,'未知来源':'https://example.invalid/unverified.json'} as any;const report=buildSourceDiscovery(input);expect(report.sources.find(row=>row.id==='未知来源')?.inventory).toBe('pending');expect(report.indexIssues).toHaveLength(1);expect(report.creditAdded.accepted).toBe(0);});
it('preserves old public names and exposes conflicting new metadata names',()=>{const input=setup();input.inputs.push({...pin({_meta:{sources:[{json:'PHB',full:'新下载标题'},{json:'XPHB',full:'另一个标题'}]}}),url:'https://homebrew.kiwee.top/book/other.json'});const report=buildSourceDiscovery(input);expect(report.sources.find(row=>row.id==='PHB')?.name).toBe('旧版基础书');expect(report.sources.find(row=>row.id==='XPHB')?.nameStatus).toBe('needs-review');expect(report.sources.find(row=>row.id==='XPHB')?.name).toBe('XPHB');});
it('rejects duplicate or overlapping candidate identities rather than shrinking their denominator',()=>{const input=setup();input.candidateIdentities.push({...input.candidateIdentities[0]});expect(()=>buildSourceDiscovery(input)).toThrow('identity');const other=setup();other.candidateIdentities[0].id=other.legacyIdentities[0];expect(()=>buildSourceDiscovery(other)).toThrow('identity');});
it('rejects invented credit, changed counts, duplicate sources, missing provenance and undeclared payloads',()=>{for(const change of [(r:any)=>r.creditAdded.executed++,(r:any)=>r.counts.sources++,(r:any)=>r.sources.push(r.sources[0]),(r:any)=>r.inputs[0].sha256='invalid',(r:any)=>r.sources[0].rawBody='unreviewed body',(r:any)=>r.extraSourceText='unreviewed text']){const report=buildSourceDiscovery(setup());change(report);expect(()=>validateSourceDiscovery(report)).toThrow();}});
it('keeps chapter-only files and diagnostics visible without calling them inapplicable',()=>{const input=setup();input.inputs.push({...pin({book:[{id:'authored chapter'}]}),url:'https://homebrew.kiwee.top/book/chapters.json'});input.diagnostics=[{key:'unresolved',code:'identity-unresolved',files:['book/chapters.json']}] as any;const report=buildSourceDiscovery(input);expect(report.unclassifiedExtraFiles).toHaveLength(1);expect(report.diagnostics.counts['identity-unresolved']).toBe(1);expect(report.unclassifiedExtraFiles[0].reason).toBe('needs-category-review');});
it('validates the real discovery artifact while preserving the old registered inventory and all zero credits',()=>{const report=validateSourceDiscovery(JSON.parse(readFileSync('reports/progress/catalog-source-discovery.json','utf8'))),snapshot=JSON.parse(readFileSync('reports/progress/automation-rule-status.json','utf8'));expect(report.counts.legacyRegisteredIdentities).toBe(snapshot.records.length);expect(report.counts.newCandidateIdentities).toBe(28880);expect(report.counts.provisionalCombinedIdentities).toBe(47669);expect(report.sources).toHaveLength(425);expect(report.inputs).toHaveLength(463);expect(report.index.sourceIds).toBe(322);for(const row of snapshot.sources)expect(report.sources.some(source=>source.id===row.id)).toBe(true);expect(Object.values(report.creditAdded)).toEqual([0,0,0,0]);});

it('registers primary book metadata by declared source identity rather than a document alias, without exporting publisher bodies',()=>{
 const input=setup();input.inputs.push({...pin({book:[{id:'PS-A',source:'PSA',name:'Authored plane source',entries:['PRIVATE_PUBLISHER_SENTINEL']},{id:'PL',source:'PL',name:'Authored current source'}]}),url:'https://5e.kiwee.top/data/books.json'});
 const report=buildSourceDiscovery(input);expect(report.sources.some(row=>row.id==='PS-A')).toBe(false);
 expect(report.sources.find(row=>row.id==='PSA')).toMatchObject({name:'Authored plane source',nameStatus:'unique-metadata',inventory:'pending'});
 expect(report.sources.find(row=>row.id==='PL')).toMatchObject({name:'Authored current source',inventory:'pending'});expect(JSON.stringify(report)).not.toContain('PRIVATE_PUBLISHER_SENTINEL');expect(report.creditAdded).toEqual({sourceReviewed:0,modeled:0,executed:0,accepted:0});
});
it('retains adventure sources with no modeled player entries and never turns their absence into inapplicability',()=>{
 const input=setup();input.inputs.push({...pin({adventure:[{id:'DOC-ONLY',source:'NEW-ADVENTURE',name:'Authored source with no modeled entries'}]}),url:'https://5e.kiwee.top/data/adventures.json'});
 const report=buildSourceDiscovery(input);expect(report.sources.find(row=>row.id==='NEW-ADVENTURE')).toMatchObject({inventory:'pending'});expect(report.sources.some(row=>row.id==='DOC-ONLY')).toBe(false);expect(report.unclassifiedExtraFiles).toContainEqual({url:'https://5e.kiwee.top/data/adventures.json',sha256:hash,reason:'needs-category-review'});
});
it('does not reinterpret arbitrary chapter arrays or missing metadata source IDs as new book identities',()=>{
 const input=setup();input.inputs.push({...pin({book:[{id:'DO-NOT-GUESS',name:'PRIVATE_CHAPTER_SENTINEL'},{source:'CHAPTER-NOT-BOOK',name:'PRIVATE_CHAPTER_SENTINEL'}]}),url:'https://homebrew.kiwee.top/book/chapters.json'});
 input.inputs.push({...pin({book:[{id:'PRIMARY-DOC-ONLY',name:'PRIVATE_UNMAPPED_TITLE'}]}),url:'https://5e.kiwee.top/data/books.json'});
 const report=buildSourceDiscovery(input);expect(report.sources.some(row=>['DO-NOT-GUESS','CHAPTER-NOT-BOOK','PRIMARY-DOC-ONLY'].includes(row.id))).toBe(false);expect(JSON.stringify(report)).not.toContain('PRIVATE_CHAPTER_SENTINEL');expect(JSON.stringify(report)).not.toContain('PRIVATE_UNMAPPED_TITLE');
});

it('keeps current and provisional union counts distinct and preserves absent legacy identities without mutating either epoch',()=>{
 const old=['old:retained','old:absent'],current=[{id:'old:retained',source:'PHB'},{id:'new:entry',source:'PL'}],before=JSON.stringify([old,current]);
 expect(compareDiscoveryEpochs(old,current)).toEqual({candidateIdentities:[{id:'new:entry',source:'PL'}],absentLegacyIdentities:['old:absent'],currentIdentityCount:2,retainedIdentityCount:1,provisionalUnionIdentityCount:3});expect(JSON.stringify([old,current])).toBe(before);
});
it('preserves source-qualified edition identities even when their display names would be identical',()=>{
 const result=compareDiscoveryEpochs(['2014:PHB:same-name'],[{id:'2024:XPHB:same-name',source:'XPHB'}]);expect(result.currentIdentityCount).toBe(1);expect(result.provisionalUnionIdentityCount).toBe(2);expect(result.retainedIdentityCount).toBe(0);expect(result.absentLegacyIdentities).toEqual(['2014:PHB:same-name']);
});
it('rejects duplicate epoch identities instead of silently reducing the candidate denominator',()=>{
 expect(()=>compareDiscoveryEpochs(['same','same'],[])).toThrow('duplicate legacy');expect(()=>compareDiscoveryEpochs([],[{id:'same',source:'PHB'},{id:'same',source:'XPHB'}])).toThrow('duplicate current');
});

it('matches encoded transport paths to exact Git names once while keeping literal filesystem spellings distinct',()=>{
 expect(sourceInputMatchesGitPath('https://homebrew.kiwee.top/action/Sample%20-%20Giddy%3B%20%E7%86%84%E7%81%AD.json','action/Sample%20-%20Giddy%3B%20%E7%86%84%E7%81%AD.json','action/Sample - Giddy; 熄灭.json')).toBe(true);
 expect(sourceInputMatchesGitPath('https://homebrew.kiwee.top/action/Literal%2520.json','action/Literal%2520.json','action/Literal%20.json')).toBe(true);
 expect(sourceInputMatchesGitPath('https://homebrew.kiwee.top/action/Literal%2520.json','action/Literal%2520.json','action/Literal .json')).toBe(false);
 expect(sourceInputMatchesGitPath('https://homebrew.kiwee.top/action/Name%20One.json','action/Name One.json','action/Name One.json')).toBe(false);
});
it('rejects redirected, ambiguous or malformed source-path associations instead of relaxing their identity check',()=>{
 for(const url of ['https://homebrew.kiwee.top/action/a.json?override=1','https://homebrew.kiwee.top/action/a.json#other','https://private@homebrew.kiwee.top/action/a.json','http://homebrew.kiwee.top/action/a.json','https://example.invalid/action/a.json','https://homebrew.kiwee.top/action/%ZZ.json'])expect(sourceInputMatchesGitPath(url,'action/a.json','action/a.json')).toBe(false);
 expect(sourceInputMatchesGitPath('https://homebrew.kiwee.top/action/a.json','action/a.json','action/b.json')).toBe(false);
});
