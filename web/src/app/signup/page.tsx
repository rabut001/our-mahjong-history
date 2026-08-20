import type { Metadata } from "next";
import { SignupForm } from "@/components/SignupForm";
import { authQueryMessage } from "@/lib/supabase/auth-errors";

export const metadata: Metadata = {
  title: "アカウント作成",
};

type SignupPageProps = {
  searchParams: Promise<{ auth?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { auth } = await searchParams;
  return <SignupForm callbackError={authQueryMessage(auth, "signup")} />;
}
