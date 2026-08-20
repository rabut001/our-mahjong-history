import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "パスワードの再設定",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
