#!/usr/bin/env bash
# PostgREST 通し（JWT + GRANT + RPC）。画面テストにはしない。
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck source=supabase-cli.sh
source "$root/supabase/ci/supabase-cli.sh"

project_id="$(sed -n 's/^project_id = "\(.*\)"/\1/p' "$root/supabase/config.toml" | head -1)"
container="supabase_db_${project_id}"
if ! docker inspect "$container" >/dev/null 2>&1; then
  echo "postgrest-smoke: コンテナ $container がありません。先に supabase start してください" >&2
  exit 2
fi

eval "$(supabase_cli status -o env)"
: "${ANON_KEY:?}"
: "${JWT_SECRET:?}"
: "${REST_URL:?}"

auth_a="a0000000-0000-4000-8000-000000000001"
auth_b="a0000000-0000-4000-8000-000000000002"
auth_w="a0000000-0000-4000-8000-00000000000a"

{
  cat "$root/supabase/tests/helpers.inc"
  cat <<'SQL'
SELECT omh_test.seed_standard();
DELETE FROM public.profiles WHERE id = 'b0000000-0000-4000-8000-00000000000a';
DELETE FROM auth.users WHERE id = 'a0000000-0000-4000-8000-00000000000a';
SELECT omh_test.insert_auth_user('a0000000-0000-4000-8000-00000000000a', 'w@example.com');
SELECT omh_test.insert_active_profile(
  'b0000000-0000-4000-8000-00000000000a',
  'a0000000-0000-4000-8000-00000000000a',
  'W'
);
SQL
} | docker exec -i "$container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 >/dev/null

jwt_for() {
  JWT_SECRET="$JWT_SECRET" SUB="$1" node --input-type=module <<'EOF'
import crypto from "node:crypto";
const secret = process.env.JWT_SECRET;
const sub = process.env.SUB;
const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const payload = Buffer.from(
  JSON.stringify({
    iss: "supabase-demo",
    role: "authenticated",
    aud: "authenticated",
    sub,
    iat: now,
    exp: now + 3600,
  }),
).toString("base64url");
const sig = crypto.createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
process.stdout.write(`${header}.${payload}.${sig}`);
EOF
}

token_a="$(jwt_for "$auth_a")"
token_b="$(jwt_for "$auth_b")"
token_w="$(jwt_for "$auth_w")"

req() {
  local method="$1"
  local path="$2"
  local token="${3:-}"
  local body="${4:-}"
  local args=(-sS -o /tmp/omh-pgrst-body -w "%{http_code}" -X "$method" "${REST_URL}${path}"
    -H "apikey: ${ANON_KEY}"
    -H "Content-Type: application/json")
  if [[ -n "$token" ]]; then
    args+=(-H "Authorization: Bearer ${token}")
  fi
  if [[ -n "$body" ]]; then
    args+=(-d "$body")
  fi
  curl "${args[@]}"
}

fail() {
  echo "postgrest-smoke: $*" >&2
  echo "body: $(cat /tmp/omh-pgrst-body 2>/dev/null || true)" >&2
  exit 1
}

code="$(req GET "/communities?select=id" "$token_a")"
[[ "$code" == "200" ]] || fail "P-06 expected 200 got $code"
node --input-type=module - <<'EOF' || fail "P-06 group 1 only"
import fs from "node:fs";
const rows = JSON.parse(fs.readFileSync("/tmp/omh-pgrst-body", "utf8"));
const ids = new Set(rows.map((r) => r.id));
if (!ids.has("c0000000-0000-4000-8000-000000000001")) process.exit(1);
if (ids.has("c0000000-0000-4000-8000-000000000002")) process.exit(2);
EOF

code="$(req GET "/community_invite_codes?select=code" "$token_b")"
[[ "$code" == "200" ]] || fail "P-07 expected 200 got $code"
node --input-type=module - <<'EOF' || fail "P-07 group 1 code hidden"
import fs from "node:fs";
const rows = JSON.parse(fs.readFileSync("/tmp/omh-pgrst-body", "utf8"));
if (rows.some((r) => r.code === "ABCDEFGHJK")) process.exit(1);
EOF

code="$(req GET /activity_logs "$token_a")"
[[ "$code" != "200" ]] || fail "P-08 activity_logs should fail"

code="$(req POST /community_memberships "$token_b" '{"community_id":"c0000000-0000-4000-8000-000000000001","user_id":"b0000000-0000-4000-8000-000000000002"}')"
[[ "$code" != "201" && "$code" != "200" ]] || fail "P-09 direct membership insert should fail"

code="$(req POST /activity_logs "$token_a" '{"entity_type":"community","entity_id":"c0000000-0000-4000-8000-000000000001","action":"insert","actor_user_id":"b0000000-0000-4000-8000-000000000001"}')"
[[ "$code" != "201" && "$code" != "200" ]] || fail "P-10 activity_logs insert should fail"

code="$(req POST /rpc/create_community "" '{"name":"anon"}')"
[[ "$code" != "200" && "$code" != "201" ]] || fail "P-05 anon create should fail"

code="$(req POST /rpc/join_community "" '{"code":"ABCDEFGHJK"}')"
[[ "$code" != "200" && "$code" != "201" ]] || fail "P-05 anon join should fail"

code="$(req POST /rpc/leave_community "" '{"community_id":"c0000000-0000-4000-8000-000000000001"}')"
[[ "$code" != "200" && "$code" != "201" && "$code" != "204" ]] || fail "P-05 anon leave should fail"

code="$(req POST /rpc/withdraw_account "" '{}')"
[[ "$code" != "200" && "$code" != "201" && "$code" != "204" ]] || fail "P-05 anon withdraw should fail"

code="$(req POST /rpc/is_community_member "$token_a" '{"community_id":"c0000000-0000-4000-8000-000000000001"}')"
[[ "$code" == "404" || "$code" == "400" || "$code" == "405" ]] || fail "F-helper-04 expected hidden RPC got $code"

code="$(req POST /rpc/create_community "$token_a" '{"name":"APIグループ"}')"
[[ "$code" == "200" ]] || fail "P-01 expected 200 got $code"
grep -qE '[0-9a-f-]{36}' /tmp/omh-pgrst-body || fail "P-01 uuid"

code="$(req POST /rpc/join_community "$token_b" '{"code":"ABCDEFGHJK"}')"
[[ "$code" == "200" ]] || fail "P-02 expected 200 got $code"

code="$(req POST /rpc/leave_community "$token_a" '{"community_id":"c0000000-0000-4000-8000-000000000001"}')"
[[ "$code" == "204" || "$code" == "200" ]] || fail "P-03 expected 200/204 got $code"

code="$(req POST /rpc/withdraw_account "$token_w" '{}')"
[[ "$code" == "204" || "$code" == "200" ]] || fail "P-04 expected 200/204 got $code"

echo "postgrest-smoke: P-01..P-10 / F-helper-04 OK"

docker exec -i "$container" psql -U postgres -d postgres -v ON_ERROR_STOP=1 >/dev/null <<'SQL'
SELECT omh_test.cleanup_standard();
-- 以前の通しでメンバーだけ消えた空グループが残ることがある
DELETE FROM public.communities WHERE name = 'APIグループ';
DROP SCHEMA IF EXISTS omh_test CASCADE;
SQL
