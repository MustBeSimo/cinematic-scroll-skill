#!/usr/bin/env node
/** Inline a Mode A page's local JS/CSS module graph. Does not execute page code. */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

export async function exportStandalone(input, output, {check=false}={}) {
  input=resolve(input);output=resolve(output);
  if(input===output) throw new Error('Output must differ from source HTML');
  let html=await readFile(input,'utf8');
  const bundle=async (url,kind,module=false) => {
    const result=await build({entryPoints:[resolve(dirname(input),decodeURIComponent(url.split(/[?#]/)[0]))],bundle:true,write:false,
      format:kind==='js'?(module?'esm':'iife'):undefined,target:'es2022',platform:'browser',minify:true,
      external:['https:*','http:*'],loader:{'.png':'dataurl','.jpg':'dataurl','.jpeg':'dataurl','.webp':'dataurl','.svg':'dataurl','.woff2':'dataurl'}});
    return result.outputFiles[0].text;
  };
  const local=url=>!/^([a-z]+:|\/\/|#)/i.test(url);
  for(const match of [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/gi)]) {
    if(!local(match[1])) continue;
    const module=/\btype=["']module["']/i.test(match[0]);
    const js=await bundle(match[1],'js',module);
    html=html.replace(match[0],'<script'+(module?' type="module"':'')+'>'+js.replace(/<\/script/gi,'<\\/script')+'</script>');
  }
  for(const match of [...html.matchAll(/<link\b[^>]*>/gi)]) {
    if(!/\brel=["']stylesheet["']/i.test(match[0])) continue;
    const href=match[0].match(/\bhref=["']([^"']+)["']/i)?.[1];
    if(!href||!local(href)) continue;
    html=html.replace(match[0],'<style>'+await bundle(href,'css')+'</style>');
  }
  if(check) {
    if(await readFile(output,'utf8')!==html)throw new Error('Standalone export drift: '+output);
  } else await writeFile(output,html);
  return {input,output,bytes:Buffer.byteLength(html)};
}
if(import.meta.url===pathToFileURL(process.argv[1]||'').href) {
  const [input,flag,output,check]=process.argv.slice(2);
  if(!input||flag!=='--out'||!output){console.error('Usage: export-standalone.mjs page.html --out standalone.html');process.exitCode=2;}
  else try{console.log(JSON.stringify(await exportStandalone(input,output,{check:check==='--check'})));}catch(error){console.error(error.message);process.exitCode=1;}
}
