import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { getCommunityDetail } from "@/lib/data";

type NewTournamentRuleEditPageProps = {
  params: Promise<{ communityId: string }>;
};

export const metadata: Metadata = {
  title: "ルールを編集",
};

export default async function NewTournamentRuleEditPage({
  params,
}: NewTournamentRuleEditPageProps) {
  const { communityId } = await params;
  const community = await getCommunityDetail(communityId);
  if (!community) {
    notFound();
  }

  return (
    <>
      <AppHeader
        title="ルールを編集"
        backHref={`/communities/${community.id}/tournaments/new`}
      />
      <main className="px-4 py-4">
        <p className="text-sm text-muted">
          大会を作成したあと、編集画面からルールを追加できます。
        </p>
      </main>
    </>
  );
}
