function requiredEnv(
  name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY",
) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} が未設定です。web/.env.local を確認してください。`,
    );
  }
  return value;
}

export function getSupabaseEnv() {
  return {
    url: requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}
