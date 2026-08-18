import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { MatchForm } from "@/components/MatchForm";
import { getMatchFormData } from "@/lib/data/matches";
import { createMatchAction } from "@/lib/data/match-actions";
import { getTournamentDetail } from "@/lib/data/tournaments";

type NewMatchPageProps = {
  params: Promise<{ tournamentId: string }>;
};

export async function generateMetadata({
  params,
}: NewMatchPageProps): Promise<Metadata> {
  const { tournamentId } = await params;
  const tournament = await getTournamentDetail(tournamentId);
  return {
    title: tournament ? `${tournament.name}の試合結果` : "試合結果を追加",
  };
}

export const dynamic = "force-dynamic";

export default async function NewMatchPage({ params }: NewMatchPageProps) {
  const { tournamentId } = await params;
  const data = await getMatchFormData(tournamentId);
  if (!data) {
    notFound();
  }

  return (
    <>
      <AppHeader
        title="試合結果を追加"
        backHref={`/tournaments/${tournamentId}`}
      />
      <main className="px-4 py-4">
        <MatchForm
          mode="create"
          data={data}
          action={createMatchAction}
          hiddenFields={{ tournamentId }}
        />
      </main>
    </>
  );
}
