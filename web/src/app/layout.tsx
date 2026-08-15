import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "俺たちの雀歴",
  description: "麻雀仲間のコミュニティで、大会と試合（半荘）の記録を残すアプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
