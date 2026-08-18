import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";
import { safeNextPath } from "@/lib/supabase/paths";

export const metadata: Metadata = {
  title: "ログイン",
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  return <LoginForm next={safeNextPath(next)} />;
}
