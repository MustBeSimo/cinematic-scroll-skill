#!/bin/bash
# usage: run.sh A|B|C  — one fresh isolated headless build; results in builds/<c>/
set -u
c=$1; here="$(cd "$(dirname "$0")" && pwd)"; d="$here/run2-hard/builds/$c"
cd "$d" || exit 1
start=$(date +%s)
claude -p "$(cat "$here/run2-hard/prompt-$c.txt")" \
  --model claude-sonnet-5 --output-format json \
  --setting-sources "" --strict-mcp-config --mcp-config '{"mcpServers":{}}' \
  --allowedTools "Read,Write,Edit,Bash,Glob,Grep" \
  --disallowedTools "WebFetch,WebSearch,Skill,Agent,Task,NotebookEdit" \
  --max-turns 40 --max-budget-usd 6 --permission-mode bypassPermissions \
  > "$d/result.json" 2> "$d/stderr.log"
echo "exit=$? wall_s=$(( $(date +%s) - start ))" > "$d/run.meta"
