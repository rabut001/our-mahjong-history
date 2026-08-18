#!/usr/bin/env bash
# Security Advisors を JSON で取り、業務 RPC に対する 0029 だけ除外して落とす。
# 0028（anon が DEFINER を呼べる）は除外しない。
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck source=supabase-cli.sh
source "$root/supabase/ci/supabase-cli.sh"

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

set +e
supabase_cli db advisors --local --type security --level warn --fail-on none --output-format json >"$tmp" 2>"$tmp.err"
status=$?
set -e
if [[ "$status" -ne 0 ]]; then
  cat "$tmp.err" >&2
  cat "$tmp" >&2
  exit "$status"
fi
cat "$tmp.err" >&2

set +e
node --input-type=module - "$root/supabase/ci/allowlist.json" "$tmp" <<'EOF'
import fs from "node:fs";

const allowlistPath = process.argv[2];
const stdoutPath = process.argv[3];
const allow = new Set(
  JSON.parse(fs.readFileSync(allowlistPath, "utf8")).advisor0029Functions,
);
const raw = fs.readFileSync(stdoutPath, "utf8");
const start = raw.lastIndexOf('{"results"');
if (start === -1) {
  console.error("advisors: JSON の results が見つかりません");
  console.error(raw);
  process.exit(2);
}
const payload = JSON.parse(raw.slice(start));
const results = Array.isArray(payload.results) ? payload.results : [];

function isAllowed0029(item) {
  if (item.name !== "authenticated_security_definer_function_executable") {
    return false;
  }
  const fn = item.metadata?.name;
  return typeof fn === "string" && allow.has(fn);
}

const kept = [];
const skipped = [];
for (const item of results) {
  if (isAllowed0029(item)) skipped.push(item);
  else kept.push(item);
}

if (skipped.length > 0) {
  console.error(
    `advisors: 0029 を許可リストで除外 (${skipped.map((i) => i.metadata?.name).join(", ")})`,
  );
}

if (kept.length === 0) {
  console.log("advisors: security WARN/ERROR なし");
  process.exit(0);
}

console.error("advisors: 次の指摘で失敗します");
for (const item of kept) {
  const where = item.metadata?.name
    ? `${item.metadata.schema ?? "?"}.${item.metadata.name}`
    : item.cacheKey ?? item.name;
  console.error(`- [${item.level}] ${item.name} ${where}`);
  if (item.detail) console.error(`  ${item.detail}`);
}
process.exit(1);
EOF
json_status=$?

bash "$root/supabase/ci/check-definer-grants.sh"
grants_status=$?
set -e

if [[ "$json_status" -ne 0 || "$grants_status" -ne 0 ]]; then
  exit 1
fi
