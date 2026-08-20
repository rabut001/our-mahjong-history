import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";
import { authQueryMessage } from "@/lib/supabase/auth-errors";
import { safeNextPath } from "@/lib/supabase/paths";

export const metadata: Metadata = {
  title: "ログイン",
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string; auth?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, auth } = await searchParams;
  return (
    <LoginForm
      next={safeNextPath(next)}
      callbackError={authQueryMessage(auth, "login")}
    />
  );
}
