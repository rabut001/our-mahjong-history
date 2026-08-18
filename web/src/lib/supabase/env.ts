function missingEnvMessage(
  name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY",
) {
  return `${name} が未設定です。web/.env.local を確認してください。`;
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) {
    throw new Error(missingEnvMessage("NEXT_PUBLIC_SUPABASE_URL"));
  }
  if (!anonKey) {
    throw new Error(missingEnvMessage("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
  }
  return { url, anonKey };
}
