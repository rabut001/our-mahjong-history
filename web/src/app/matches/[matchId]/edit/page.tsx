import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { DangerAction } from "@/components/DangerAction";
import { MatchForm } from "@/components/MatchForm";
import { getMatchDetail, getMatchFormData } from "@/lib/data/matches";
import { deleteMatchAction, updateMatchAction } from "@/lib/data/match-actions";

type EditMatchPageProps = {
  params: Promise<{ matchId: string }>;
};

export async function generateMetadata({
  params,
}: EditMatchPageProps): Promise<Metadata> {
  const { matchId } = await params;
  const match = await getMatchDetail(matchId);
  return {
    title: match ? `${match.tournamentName}の試合を編集` : "試合を編集",
  };
}

export const dynamic = "force-dynamic";

export default async function EditMatchPage({ params }: EditMatchPageProps) {
  const { matchId } = await params;
  const match = await getMatchDetail(matchId);
  if (!match) {
    notFound();
  }
  const data = await getMatchFormData(match.tournamentId, matchId);
  if (!data) {
    notFound();
  }

  return (
    <>
      <AppHeader title="試合を編集" backHref={`/matches/${matchId}`} />
      <main className="px-4 py-4">
        <MatchForm
          mode="edit"
          data={data}
          action={updateMatchAction}
          hiddenFields={{ tournamentId: match.tournamentId, matchId }}
        />
        <DangerAction
          label="この試合を削除する"
          dialogTitle="この試合を削除しますか？"
          dialogBody="点数とポイントの記録が消えます。元に戻せません。"
          confirmLabel="削除する"
          doneHref={`/tournaments/${match.tournamentId}`}
          action={deleteMatchAction}
          hiddenFields={{
            matchId,
            tournamentId: match.tournamentId,
          }}
        />
      </main>
    </>
  );
}
