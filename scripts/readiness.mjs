import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const checks=[];
for(const command of ['lint','test','build','package:mt5']){
 const result=spawnSync(process.platform==='win32'?'npm.cmd':'npm',['run',command],{stdio:'inherit',shell:process.platform==='win32'});
 checks.push({command,status:result.status===0?'PASS':'FAIL'});
 if(result.status!==0) break;
}
const passed=checks.length===4&&checks.every(c=>c.status==='PASS');
const report={generatedAt:new Date().toISOString(),sourceChecks:passed?'PASS':'FAIL',liveTradingReady:false,checks,pending:['MetaEditor compile: zero errors and warnings','Strategy Tester: both target symbols, separate unseen periods','Demo forward tests: broker history vs journal, restarts, loss limits, rejected orders, disconnections','Browser interaction and deployed environment acceptance']};
mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/readiness.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
process.exit(passed&&!process.argv.includes('--release')?0:1);
