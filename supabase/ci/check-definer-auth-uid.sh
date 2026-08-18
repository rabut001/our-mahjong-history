#!/usr/bin/env bash
# public/private の SECURITY DEFINER がユーザー ID 引数を持たず、本体で auth.uid() を使うこと。
# 新規関数は自動で対象。例外だけ allowlist.json の authUidExclude。
# 対象が 0 件ならスキップ（緑）。trigger 関数は対象外。
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
allowlist="$root/supabase/ci/allowlist.json"
sql="$root/supabase/ci/check-definer-auth-uid.sql"

project_id="$(sed -n 's/^project_id = "\(.*\)"/\1/p' "$root/supabase/config.toml" | head -1)"
container="supabase_db_${project_id}"
if ! docker inspect "$container" >/dev/null 2>&1; then
  echo "check-definer-auth-uid: コンテナ $container がありません。先に supabase start してください" >&2
  exit 2
fi

preamble="$(node --input-type=module - "$allowlist" <<'EOF'
import fs from "node:fs";
const a = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const excluded = (a.authUidExclude ?? []).join(",");
const forbidden = "user_id,auth_user_id,uid,p_user_id,p_auth_user_id,p_uid";
const q = (s) => `'${s.replaceAll("'", "''")}'`;
process.stdout.write(
  `do $$ begin\n` +
    `  perform set_config('omh.auth_uid_exclude', ${q(excluded)}, false);\n` +
    `  perform set_config('omh.forbidden_arg_names', ${q(forbidden)}, false);\n` +
    `end $$;\n`,
);
EOF
)"

{
  printf '%s\n' "$preamble"
  cat "$sql"
} | docker exec -i "$container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f -
