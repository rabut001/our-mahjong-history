import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { PointCorrectionForm } from "@/components/PointCorrectionForm";
import { getPointCorrectionData, getTournament } from "@/mock";

type AdjustmentsPageProps = {
  params: Promise<{ tournamentId: string }>;
};

export async function generateMetadata({
  params,
}: AdjustmentsPageProps): Promise<Metadata> {
  const { tournamentId } = await params;
  const tournament = getTournament(tournamentId);
  return {
    title: tournament ? `${tournament.name}のポイントの補正` : "ポイントの補正",
  };
}

export default async function TournamentAdjustmentsPage({
  params,
}: AdjustmentsPageProps) {
  const { tournamentId } = await params;
  const tournament = getTournament(tournamentId);
  if (!tournament) {
    notFound();
  }

  const data = getPointCorrectionData(tournament.id);

  return (
    <>
      <AppHeader
        title="ポイントの補正"
        backHref={`/tournaments/${tournament.id}`}
      />
      <main className="px-4 py-4">
        <PointCorrectionForm
          participants={data.participants}
          initialRows={data.initialRows}
        />
      </main>
    </>
  );
}
