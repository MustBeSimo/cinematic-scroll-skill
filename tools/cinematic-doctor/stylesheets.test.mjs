import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {localStylesheets} from './lib/stylesheets.mjs';
import {buildDoc} from './lib/doc.mjs';
import {analyze as a11y} from './checks/a11y.mjs';
test('linked local CSS contributes accessibility evidence and points to its HTML link',t=>{
 const dir=mkdtempSync(join(tmpdir(),'doctor-css-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 writeFileSync(join(dir,'brand style.css'),'@media(prefers-reduced-motion:reduce){a{transition:none}}\n:focus-visible{outline:2px solid red}');
 const raw='<html>\n<link rel="stylesheet" href="brand%20style.css?v=2#brand">\n<main><nav></nav></main></html>';
 const doc=buildDoc(raw,join(dir,'index.html'),localStylesheets(raw,join(dir,'index.html')));
 assert.equal(a11y(doc).findings.some(f=>f.level==='error'),false);
 assert.equal(doc.lineOf(/:focus-visible/,'css'),2);
});
test('remote, root-relative and commented stylesheet links are never read; missing local files fail',()=>{
 const raw='<!-- <link rel="stylesheet" href="missing.css"> --><link rel="stylesheet" href="https://example.com/a.css"><link rel="stylesheet" href="/a.css"><link rel="preload" href="missing.css">';
 assert.deepEqual(localStylesheets(raw,'index.html'),[]);
 assert.throws(()=>localStylesheets('<link href="missing.css" rel="stylesheet">','index.html'),/ENOENT/);
});
