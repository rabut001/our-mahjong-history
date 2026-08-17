import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";

export const metadata: Metadata = {
  title: "麻雀グループとは",
};

export default function CommunityHelpPage() {
  return (
    <>
      <AppHeader title="麻雀グループとは" backHref="/communities" />
      <main className="space-y-4 px-4 py-4 text-sm leading-6">
        <p>
          麻雀グループは、定期的に麻雀をする仲間の集まりです。例は「○○株式会社
          麻雀仲間」「○○高校 麻雀クラブ」などです。
        </p>
        <p>
          グループに対して複数の麻雀大会を作成し、半荘ごとに点数を記録できます。
        </p>
        <p>グループでは次を共有します。</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>メンバー</li>
          <li>いつものルール（既定ルール）</li>
          <li>大会と試合の記録</li>
        </ul>
        <p>
          1人で複数のグループに入れます。参加は招待コードです。自分で作ることもできます。
        </p>
      </main>
    </>
  );
}
