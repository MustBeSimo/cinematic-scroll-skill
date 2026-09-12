#!/bin/bash
# usage: measure2.sh A|B|C PORT
set -u; c=$1; port=$2; here="$(cd "$(dirname "$0")" && pwd)"; repo="$(cd "$here/../../.." && pwd)"; d="$here/builds/$c"; out="$d/measure.txt"; : > "$out"
[ -f "$d/index.html" ] || { echo "NO index.html produced" | tee -a "$out"; exit 0; }
(cd "$d" && python3 -m http.server $port >/dev/null 2>&1) & srv=$!; sleep 1
url="http://127.0.0.1:$port/index.html"
{ echo "files: $(cd "$d" && ls -p | grep -v -E '^(kit|skill|brief.md|result.json|stderr.log|run.meta|measure.txt|probe)' | tr '\n' ' ')"; echo "bytes_index=$(wc -c < "$d/index.html")";
  node "$here/copy-check2.mjs" "$d/index.html"; echo "external_hosts=$(grep -ohE 'https?://[a-z0-9.-]+' "$d"/*.html "$d"/*.js "$d"/*.css 2>/dev/null | grep -v -E 'w3.org|example|127.0.0.1|localhost' | sort -u | tr '\n' ' ')";
  echo "== probe (asset present)"; node "$here/probe2.mjs" "$url" "$d/probe-present" 2>&1; python3 "$here/blank.py" "$d"/probe-present/*-hero.png;
  echo "== page-proof matrix (skill repo tool, generic checks) over HTTP, wait 6000"; rm -rf "$d/.page-proof"; node "$repo/tools/page-proof/matrix.mjs" "$url" --out "$d/.page-proof" --shots 0,0.5,1 --wait 6000 > "$d/page-proof.log" 2>&1; echo "page_proof_exit=$?";
  echo "== failure injection: kit/assets/vessel.glb removed"; mv "$d/kit/assets/vessel.glb" "$d/kit/assets/vessel.glb.hidden"; node "$here/probe2.mjs" "$url" "$d/probe-missing-glb" 2>&1 | grep -E "normal"; python3 "$here/blank.py" "$d"/probe-missing-glb/normal-*-hero.png; mv "$d/kit/assets/vessel.glb.hidden" "$d/kit/assets/vessel.glb";
  echo "doctor=$(node "$repo/tools/cinematic-doctor/cli.mjs" "$d/index.html" --json --quiet 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).total)}catch{console.log("parse-fail")}})')";
  node -e 'const r=JSON.parse(require("fs").readFileSync(process.argv[1]+"/result.json","utf8"));console.log(`turns=${r.num_turns} cost_usd=${(r.total_cost_usd||0).toFixed(3)} is_error=${r.is_error} stop=${r.stop_reason||r.terminal_reason}`)' "$d"; cat "$d/run.meta";
} 2>&1 | tee -a "$out"
kill $srv 2>/dev/null
