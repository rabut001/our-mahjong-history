import { createClient } from "@supabase/supabase-js";
import {
  e2eCommunityName,
  e2eDisplayName,
  e2eEmail,
  e2ePassword,
  loadE2eEnv,
} from "./env";

export default async function globalSetup() {
  loadE2eEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Playwright: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です。",
    );
  }

  const supabase = createClient(url, anonKey);
  const email = e2eEmail();
  const password = e2ePassword();
  const displayName = e2eDisplayName();
  const communityName = e2eCommunityName();

  const signedIn = await supabase.auth.signInWithPassword({ email, password });
  if (signedIn.error) {
    const signedUp = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (signedUp.error) {
      throw new Error(
        `Playwright: ユーザーを用意できませんでした。${signedUp.error.message}`,
      );
    }
    if (!signedUp.data.session) {
      const again = await supabase.auth.signInWithPassword({ email, password });
      if (again.error) {
        throw new Error(
          `Playwright: ログインできませんでした。${again.error.message}`,
        );
      }
    }
  }

  const { data: communities, error: listError } = await supabase
    .from("communities")
    .select("name");
  if (listError) {
    throw new Error(
      `Playwright: 麻雀グループを取得できませんでした。${listError.message}`,
    );
  }
  if (!communities?.some((row) => row.name === communityName)) {
    const { error } = await supabase.rpc("create_community", {
      name: communityName,
    });
    if (error) {
      throw new Error(
        `Playwright: 麻雀グループを作成できませんでした。${error.message}`,
      );
    }
  }
}
