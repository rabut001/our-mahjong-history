import type { Metadata } from "next";
import { AuthContinue } from "@/components/AuthContinue";

export const metadata: Metadata = {
  title: "ログイン",
};

export default function AuthContinuePage() {
  return <AuthContinue />;
}
