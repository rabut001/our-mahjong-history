import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "パスワードを忘れた",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
