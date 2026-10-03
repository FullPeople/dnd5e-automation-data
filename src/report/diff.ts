import type { AutomationEnvelope } from '../protocol.ts';
export function diffReport(current:AutomationEnvelope,previous:AutomationEnvelope|undefined,reversals:{key:string;batch:string;layers:string[];reason:string}[],stale:{key:string;batch:string;reason:string}[]):string {
 const old=new Map((previous?.records||[]).map(row=>[row.identity.key,row])),now=new Map(current.records.map(row=>[row.identity.key,row]));
 const added=[...now.keys()].filter(key=>!old.has(key)),removed=[...old.keys()].filter(key=>!now.has(key)),changed=current.records.filter(row=>old.has(row.identity.key)&&old.get(row.identity.key)!.verdict!==row.verdict);
 const lines=['# Automation diff','',`Baseline: ${previous?'previous locked artifact':'initial generation'}. Added: ${added.length}; removed: ${removed.length}; verdict changes: ${changed.length}.`,'',`Foundry migration versions: ${JSON.stringify(previous?.versionLock.foundryMigrationVersion||[])} -> ${JSON.stringify(current.versionLock.foundryMigrationVersion)}.`,'','## Version lock','','```json',JSON.stringify(current.versionLock,null,2),'```',''];
 for(const [title,keys]of [['Added',added],['Removed',removed]] as const){lines.push('## '+title,'');for(const key of keys)lines.push('- '+key);lines.push('');}
 lines.push('## Verdict changes','','| identity | before | after |','| --- | --- | --- |');for(const row of changed)lines.push(`| ${row.identity.key} | ${old.get(row.identity.key)!.verdict} | ${row.verdict} |`);
 lines.push('','## Overlay reversals','','| identity | batch | layers | reason |','| --- | --- | --- | --- |');for(const row of reversals)lines.push(`| ${row.key} | ${row.batch} | ${row.layers.join(',')} | ${row.reason.replaceAll('|','/')} |`);
 lines.push('','## Stale reviews','','| identity | batch | reason |','| --- | --- | --- |');for(const row of stale)lines.push(`| ${row.key} | ${row.batch} | ${row.reason} |`);
 return lines.join('\n')+'\n';
}
