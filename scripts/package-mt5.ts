import { mkdir,writeFile } from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {ALL_MQL5_FILES,generateMQL5Zip} from '../src/mql5';
await mkdir('artifacts',{recursive:true});
const sources=[];
for(const f of ALL_MQL5_FILES){
 const dest=path.join('artifacts/MQL5',f.path);await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,f.code);
 sources.push({path:f.path,sha256:createHash('sha256').update(f.code).digest('hex')});
}
await writeFile('artifacts/SyntheticLiquidityScalper_MT5_Package.zip',Buffer.from(await (await generateMQL5Zip()).arrayBuffer()));
await writeFile('artifacts/source-manifest.json',JSON.stringify(sources,null,2));
console.log('Exported 17 source files, ZIP and SHA-256 manifest to artifacts/');
