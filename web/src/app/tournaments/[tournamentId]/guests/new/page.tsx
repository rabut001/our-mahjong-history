import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddGuestForm } from "@/components/AddGuestForm";
import { AppHeader } from "@/components/AppHeader";
import { getTournament } from "@/mock";

type PageProps = {
  params: Promise<{ tournamentId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tournamentId } = await params;
  const tournament = getTournament(tournamentId);
  return {
    title: tournament
      ? `${tournament.name}のゲスト参加者を追加`
      : "ゲスト参加者を追加",
  };
}

export default async function EditTournamentGuestPage({ params }: PageProps) {
  const { tournamentId } = await params;
  const tournament = getTournament(tournamentId);
  if (!tournament) {
    notFound();
  }

  const backHref = `/tournaments/${tournament.id}/edit`;

  return (
    <>
      <AppHeader title="ゲスト参加者を追加" backHref={backHref} />
      <main className="px-4 py-4">
        <AddGuestForm backHref={backHref} />
      </main>
    </>
  );
}
