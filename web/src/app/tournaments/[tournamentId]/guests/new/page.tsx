import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddGuestForm } from "@/components/AddGuestForm";
import { AppHeader } from "@/components/AppHeader";
import { getTournamentDetail } from "@/lib/data/tournaments";
import { addGuestAction } from "@/lib/data/tournament-actions";

type PageProps = {
  params: Promise<{ tournamentId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { tournamentId } = await params;
  const tournament = await getTournamentDetail(tournamentId);
  return {
    title: tournament
      ? `${tournament.name}のゲスト参加者を追加`
      : "ゲスト参加者を追加",
  };
}

export const dynamic = "force-dynamic";

export default async function EditTournamentGuestPage({ params }: PageProps) {
  const { tournamentId } = await params;
  const tournament = await getTournamentDetail(tournamentId);
  if (!tournament) {
    notFound();
  }

  return (
    <>
      <AppHeader
        title="ゲスト参加者を追加"
        backHref={`/tournaments/${tournament.id}/edit`}
      />
      <main className="px-4 py-4">
        <AddGuestForm tournamentId={tournament.id} action={addGuestAction} />
      </main>
    </>
  );
}
