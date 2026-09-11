import {readFileSync} from 'node:fs';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

/** Read direct local stylesheet links only. Never fetch remote resources or execute code.
 * Findings in these blocks point to the importing link in the HTML scorecard. */
export function localStylesheets(raw,file){
 const html=raw.replace(/<!--[\s\S]*?-->/g,m=>' '.repeat(m.length));
 const styles=[];
 for(const match of html.matchAll(/<link\b[^>]*>/gi)){
  const attrs=Object.fromEntries([...match[0].matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map(m=>[m[1].toLowerCase(),m[2]??m[3]??m[4]]));
  if(!attrs.rel?.toLowerCase().split(/\s+/).includes('stylesheet')||!attrs.href||attrs.disabled!==undefined)continue;
  // Root-relative URLs depend on the serving root; do not interpret them as OS paths.
  if(/^(?:[a-z][\w+.-]*:|\/)/i.test(attrs.href))continue;
  const url=new URL(attrs.href.replaceAll('&amp;','&'),pathToFileURL(resolve(file)));
  url.search='';url.hash='';
  styles.push({content:readFileSync(fileURLToPath(url),'utf8'),start:match.index,external:true});
 }
 return styles;
}
