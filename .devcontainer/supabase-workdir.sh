#!/bin/bash
# 公式 CLI（/usr/local/bin/supabase）はそのまま。alias からここへ来る。
# Docker-from-Docker: bind 元をホスト実パスにするため --workdir を付ける。
set -euo pipefail

host_ws="${LOCAL_WORKSPACE_FOLDER:-}"
if [[ -z "$host_ws" ]]; then
  host_ws="$(awk '$5=="/workspace"{print $4; exit}' /proc/self/mountinfo 2>/dev/null || true)"
fi

if [[ -n "$host_ws" && -d "$host_ws/supabase" ]]; then
  exec /usr/local/bin/supabase --workdir "$host_ws" "$@"
fi
exec /usr/local/bin/supabase "$@"
