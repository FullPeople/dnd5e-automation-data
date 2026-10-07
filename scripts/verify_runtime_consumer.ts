import {readFileSync} from 'node:fs';
import {verifyConsumerBytes} from '../src/runtimeCoverage/consumerBytes.ts';
const [webRoot,reportPath='reports/progress/runtime-coverage.json']=process.argv.slice(2);
if(!webRoot)throw Error('Usage: verify_runtime_consumer.ts WEB_CHECKOUT [COVERAGE_REPORT]');
console.log(JSON.stringify({verified:verifyConsumerBytes(JSON.parse(readFileSync(reportPath,'utf8')),webRoot)}));
