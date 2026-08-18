import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { PointCorrectionForm } from "@/components/PointCorrectionForm";
import { saveAdjustmentsAction } from "@/lib/data/adjustment-actions";
import { getPointCorrectionData } from "@/lib/data/tournaments";

type AdjustmentsPageProps = {
  params: Promise<{ tournamentId: string }>;
};

export async function generateMetadata({
  params,
}: AdjustmentsPageProps): Promise<Metadata> {
  const { tournamentId } = await params;
  const data = await getPointCorrectionData(tournamentId);
  return {
    title: data ? `${data.tournamentName}のポイントの補正` : "ポイントの補正",
  };
}

export const dynamic = "force-dynamic";

export default async function TournamentAdjustmentsPage({
  params,
}: AdjustmentsPageProps) {
  const { tournamentId } = await params;
  const data = await getPointCorrectionData(tournamentId);
  if (!data) {
    notFound();
  }

  return (
    <>
      <AppHeader
        title="ポイントの補正"
        backHref={`/tournaments/${tournamentId}`}
      />
      <main className="px-4 py-4">
        <PointCorrectionForm
          tournamentId={tournamentId}
          participants={data.participants}
          initialRows={data.initialRows}
          action={saveAdjustmentsAction}
        />
      </main>
    </>
  );
}
