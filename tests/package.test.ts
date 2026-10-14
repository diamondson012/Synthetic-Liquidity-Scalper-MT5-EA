import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import JSZip from 'jszip';
import { ALL_MQL5_FILES, generateMQL5Zip } from '../src/mql5';
test('download ZIP preserves all sources and resolves every project include',async()=>{
 const zip=await JSZip.loadAsync(await (await generateMQL5Zip()).arrayBuffer());
 for(const file of ALL_MQL5_FILES){
  assert.equal(await zip.file('MQL5/'+file.path)!.async('string'),file.code);
  if(file.path.endsWith('.mqh')) assert.match(file.code,/#ifndef SLS_/);
  assert.doesNotMatch(file.code,/m_\w+->|&g_\w+/);
  for(const inc of file.code.matchAll(/#include\s+([<"])([^>"]+)[>"]/g)){
   const name=inc[2].replaceAll('\\','/');
   if(name.startsWith('Trade/'))continue;
   const target=inc[1]==='<'?'Include/'+name:path.posix.join(path.posix.dirname(file.path),name);
   assert.ok(zip.file('MQL5/'+target),`${file.path}: missing ${target}`);
  }
 }
});
