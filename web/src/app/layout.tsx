import type { Metadata } from "next";
import { MockShell } from "@/components/MockShell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "俺たちの雀歴",
    template: "%s | 俺たちの雀歴",
  },
  description: "麻雀仲間のグループで、大会と試合（半荘）の記録を残すアプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body className="bg-page text-ink antialiased">
        <MockShell>{children}</MockShell>
      </body>
    </html>
  );
}
