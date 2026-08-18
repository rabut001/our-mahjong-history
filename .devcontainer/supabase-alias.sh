# bash 専用。/etc/profile.d が dash から読まれても無視する。
if [ -n "${BASH_VERSION:-}" ]; then
  shopt -s expand_aliases
  alias supabase='/usr/local/libexec/omh-supabase.sh'
fi
