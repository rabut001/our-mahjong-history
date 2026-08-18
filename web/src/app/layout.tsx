import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { MockShell } from "@/components/MockShell";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-noto-sans-jp",
});

export const metadata: Metadata = {
  title: {
    default: "俺たちの雀歴",
    template: "%s | 俺たちの雀歴",
  },
  description: "麻雀仲間のグループで、大会と試合（半荘）の記録を残すアプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={notoSansJp.variable}>
      <body className="bg-page font-sans text-ink antialiased">
        <MockShell>{children}</MockShell>
      </body>
    </html>
  );
}
