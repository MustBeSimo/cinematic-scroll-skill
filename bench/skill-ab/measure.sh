#!/bin/bash
# One lightweight technical pass per build. usage: measure.sh A|B|C
set -u
c=$1; here="$(cd "$(dirname "$0")" && pwd)"; repo="$(cd "$here/../.." && pwd)"; d="$here/builds/$c"
f="$d/index.html"; out="$d/measure.txt"; : > "$out"
if [ ! -f "$f" ]; then echo "NO index.html produced" | tee -a "$out"; exit 0; fi
echo "bytes=$(wc -c < "$f")" | tee -a "$out"
# copy fidelity: verbatim phrases from the brief, checked against tag-stripped text (quote/&-tolerant)
node -e '
const fs=require("fs");let h=fs.readFileSync(process.argv[1],"utf8");
let t=h.replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/&#39;|&rsquo;|\u2019/g,"\u0027").replace(/&nbsp;/g," ").replace(/\s+/g," ");
const ph=["Ferrymead Bakehouse","Bread on the tide","We bake slow sourdough in the old ferry hall, with flour from two farms upriver and a starter that is older than the building\u0027s new roof","Estuary Loaf","country sourdough, 900 g","Rye Tide","60% rye, caraway, 800 g","Saltmarsh","sea-salt crust, wholemeal, 900 g","Ferry Crumpets","six per pack, weekends only","Choose one or two loaves a week","We bake Thursday night, you collect Friday from the hall or one of three pickup points along the river","Pause or cancel any week before Wednesday noon","Built 1911","ferries stopped in 1974","ovens lit 2019","The waiting room is now the shop; the ticket office is where the starter lives","Open Friday to Sunday, 7am until we sell out","1 Ferry Lane, Ferrymead","Start a subscription","hello@ferrymead.example"];
const miss=ph.filter(p=>!t.includes(p));console.log(`copy_phrases_missing=${miss.length}/${ph.length}`);for(const m of miss)console.log("  missing: "+m);
' "$f" | tee -a "$out"
echo "external_urls=$(grep -oE '(src|href)=["'"'"']https?://[^"'"'"']+' "$f" | grep -v mailto | wc -l | tr -d ' ')" | tee -a "$out"
echo "ext_src_any=$(grep -oE 'https?://[^"'"'"' )]+' "$f" | grep -v -E 'w3.org|example' | wc -l | tr -d ' ')" | tee -a "$out"
echo "reduced_motion_query=$(grep -c 'prefers-reduced-motion' "$f")" | tee -a "$out"
# page-proof matrix (generic runtime/layout checks)
rm -rf "$d/.page-proof"; node "$repo/tools/page-proof/matrix.mjs" "$f" --out "$d/.page-proof" --shots 0,0.5,1 --wait 1500 > "$d/page-proof.log" 2>&1; echo "page_proof_exit=$?" | tee -a "$out"
node -e '
const m=JSON.parse(require("fs").readFileSync(process.argv[1]+"/.page-proof/matrix.json","utf8"));
const ps=m.profiles||m.results||m; for (const p of (Array.isArray(ps)?ps:Object.values(ps))) {
  const r=p.proof||p; const errs=(r.errors||r.consoleErrors||[]).length; const lay=(r.layout&&r.layout.issues||r.layoutIssues||[]).length;
  console.log(`  profile=${p.profile||p.name||r.profile} status=${p.status||r.status||(p.ok===false?"fail":"?")} errors=${errs} layout_issues=${lay}`);
}' "$d" 2>/dev/null | tee -a "$out" || echo "  (matrix.json parse: see page-proof.log)" | tee -a "$out"
# skill-native rubric (biased toward C; not used for verdict)
echo "doctor=$(node "$repo/tools/cinematic-doctor/cli.mjs" "$f" --json --quiet 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);console.log(j.total??j.score??JSON.stringify(j).slice(0,80))}catch{console.log("parse-fail")}})')" | tee -a "$out"
# run stats from the CLI result
node -e '
const r=JSON.parse(require("fs").readFileSync(process.argv[1]+"/result.json","utf8"));
console.log(`turns=${r.num_turns} cost_usd=${(r.total_cost_usd||0).toFixed(3)} is_error=${r.is_error} stop=${r.stop_reason||r.terminal_reason} in_tok=${r.usage?.input_tokens} cache_read=${r.usage?.cache_read_input_tokens} out_tok=${r.usage?.output_tokens}`);
' "$d" 2>/dev/null | tee -a "$out"; cat "$d/run.meta" 2>/dev/null | tee -a "$out"
echo "layout_probe (independent, heuristic):" | tee -a "$out"; node "$here/layout-check.mjs" "$f" 2>&1 | tee -a "$out"
