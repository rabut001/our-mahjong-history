import type { Metadata } from "next";
import { SignupForm } from "@/components/SignupForm";

export const metadata: Metadata = {
  title: "アカウント作成",
};

export default function SignupPage() {
  return <SignupForm />;
}
