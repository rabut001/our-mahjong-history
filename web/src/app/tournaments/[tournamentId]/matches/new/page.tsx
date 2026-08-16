import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { MatchForm } from "@/components/MatchForm";
import { getNewMatchFormData, getTournament } from "@/mock";

type NewMatchPageProps = {
  params: Promise<{ tournamentId: string }>;
};

export async function generateMetadata({
  params,
}: NewMatchPageProps): Promise<Metadata> {
  const { tournamentId } = await params;
  const tournament = getTournament(tournamentId);
  return {
    title: tournament ? `${tournament.name}の試合結果` : "試合結果を追加",
  };
}

export default async function NewMatchPage({ params }: NewMatchPageProps) {
  const { tournamentId } = await params;
  const data = getNewMatchFormData(tournamentId);
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
        <MatchForm mode="create" data={data} />
      </main>
    </>
  );
}
