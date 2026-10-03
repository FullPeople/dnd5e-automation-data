import type { AutomationEnvelope } from '../protocol.ts';
import type { Diagnostic } from '../derive/catalogue.ts';
const verdicts=['automated','noMechanics','needsAnnotation','unsupported'] as const;
export function coverage(envelope:AutomationEnvelope,diagnostics:Diagnostic[]=[],phase='draft') {
  const matrix:Record<string,Record<string,Record<string,number>>>={},families:Record<string,number>={};
  const records=envelope.records.map(record=>{
    const source=`${record.identity.packId}/${record.identity.source}`,cell=(matrix[source]||={})[record.identity.kind]||={total:0,automated:0,noMechanics:0,needsAnnotation:0,unsupported:0};cell.total++;cell[record.verdict]++;
    const mechanismFamilies=Object.entries(record.mechanics||{}).filter(([,value])=>Array.isArray(value)?value.length>0:!!value&&Object.keys(value).length>0).map(([key])=>key).sort();
    for(const family of new Set(record.unsupported.map(reason=>reason.family)))families[family]=(families[family]||0)+1;
    return {identity:record.identity,verdict:record.verdict,provenanceLayers:[...new Set(record.provenance.map(row=>row.layer))].sort(),mechanismFamilies,unsupported:record.unsupported,...(record.reasonCode?{reasonCode:record.reasonCode}:{})};
  });
  return {phase,completeAutomationClaim:false,versionLock:envelope.versionLock,summary:{records:records.length,identityGaps:diagnostics.filter(row=>row.code==='identity-unresolved').length,duplicateConflicts:diagnostics.filter(row=>row.code==='duplicate-conflict').length,byVerdict:Object.fromEntries(verdicts.map(verdict=>[verdict,records.filter(row=>row.verdict===verdict).length]))},matrix,unsupportedByFamily:families,diagnostics,records};
}
export function coverageMarkdown(report:ReturnType<typeof coverage>):string {
  const lines=['# Automation coverage draft','',`Phase: ${report.phase}. This is a derivation/review draft, not a complete automation claim.`,'',`Tool: ${report.versionLock.toolVersion}. Records: ${report.summary.records}; identity gaps: ${report.summary.identityGaps}; duplicate conflicts: ${report.summary.duplicateConflicts}.`,''];
  for(const source of Object.keys(report.matrix).sort()) {
    lines.push(`## ${source}`,'','| kind | total | automated | noMechanics | needsAnnotation | unsupported |','| --- | ---: | ---: | ---: | ---: | ---: |');
    for(const [kind,cell]of Object.entries(report.matrix[source]).sort(([a],[b])=>a.localeCompare(b)))lines.push(`| ${kind} | ${cell.total} | ${verdicts.map(verdict=>cell[verdict]).join(' | ')} |`);lines.push('');
  }
  lines.push('## Identified unsupported families','','| family | records |','| --- | ---: |');
  for(const [family,count]of Object.entries(report.unsupportedByFamily).sort(([a,x],[b,y])=>y-x||a.localeCompare(b)).slice(0,50))lines.push(`| ${family} | ${count} |`);
  return lines.join('\n')+'\n';
}
