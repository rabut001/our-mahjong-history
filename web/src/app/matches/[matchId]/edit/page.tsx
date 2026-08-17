import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { DangerAction } from "@/components/DangerAction";
import { MatchForm } from "@/components/MatchForm";
import { getMatchFormData } from "@/mock";

type EditMatchPageProps = {
  params: Promise<{ matchId: string }>;
};

export async function generateMetadata({
  params,
}: EditMatchPageProps): Promise<Metadata> {
  const { matchId } = await params;
  const data = getMatchFormData(matchId);
  return {
    title: data ? `${data.tournamentName}の試合を編集` : "試合を編集",
  };
}

export default async function EditMatchPage({ params }: EditMatchPageProps) {
  const { matchId } = await params;
  const data = getMatchFormData(matchId);
  if (!data) {
    notFound();
  }

  return (
    <>
      <AppHeader title="試合を編集" backHref={`/matches/${matchId}`} />
      <main className="px-4 py-4">
        <MatchForm mode="edit" data={data} />
        <DangerAction
          label="この試合を削除する"
          dialogTitle="この試合を削除しますか？"
          dialogBody="点数とポイントの記録が消えます。元に戻せません。"
          confirmLabel="削除する"
          doneHref={`/tournaments/${data.tournamentId}`}
        />
      </main>
    </>
  );
}
