#!/usr/bin/env bash
# DEFINER の EXECUTE を anon / authenticated について見る（0028/0029 相当）。
# CLI の Advisors は pgrst.db_schemas が空だとこの指摘を出さない。
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
allowlist="$root/supabase/ci/allowlist.json"
sql="$root/supabase/ci/check-definer-grants.sql"

project_id="$(sed -n 's/^project_id = "\(.*\)"/\1/p' "$root/supabase/config.toml" | head -1)"
container="supabase_db_${project_id}"
if ! docker inspect "$container" >/dev/null 2>&1; then
  echo "check-definer-grants: コンテナ $container がありません。先に supabase start してください" >&2
  exit 2
fi

preamble="$(node --input-type=module - "$allowlist" <<'EOF'
import fs from "node:fs";
const a = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const allow = (a.advisor0029Functions ?? []).join(",");
const q = (s) => `'${s.replaceAll("'", "''")}'`;
process.stdout.write(
  `do $$ begin\n` +
    `  perform set_config('omh.advisor_0029_allow', ${q(allow)}, false);\n` +
    `end $$;\n`,
);
EOF
)"

{
  printf '%s\n' "$preamble"
  cat "$sql"
} | docker exec -i "$container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f -
