# 公式 CLI。Dev Container では --workdir ラッパー、CI では PATH の supabase。
# shellcheck 用。source して supabase_cli を使う。
supabase_cli() {
  if [[ -x /usr/local/libexec/omh-supabase.sh ]]; then
    /usr/local/libexec/omh-supabase.sh "$@"
  else
    supabase "$@"
  fi
}
