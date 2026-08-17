import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddParticipantsForm } from "@/components/AddParticipantsForm";
import { AppHeader } from "@/components/AppHeader";
import {
  getTournament,
  listCommunityMembers,
  listTournamentParticipants,
} from "@/mock";

type PageProps = {
  params: Promise<{ tournamentId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tournamentId } = await params;
  const tournament = getTournament(tournamentId);
  return {
    title: tournament ? `${tournament.name}の参加者を追加` : "参加者を追加",
  };
}

export default async function EditTournamentParticipantsPage({
  params,
}: PageProps) {
  const { tournamentId } = await params;
  const tournament = getTournament(tournamentId);
  if (!tournament) {
    notFound();
  }

  const backHref = `/tournaments/${tournament.id}/edit`;
  const selectedIds = new Set(
    listTournamentParticipants(tournament.id)
      .map((participant) => participant.userId)
      .filter((userId): userId is string => userId !== null),
  );
  const members = listCommunityMembers(tournament.communityId).filter(
    (member) => !selectedIds.has(member.userId),
  );

  return (
    <>
      <AppHeader title="参加者を追加" backHref={backHref} />
      <main className="px-4 py-4">
        <p className="mb-4 text-sm text-muted">
          追加したい人を選んで「追加する」を押してください。
        </p>
        <AddParticipantsForm members={members} backHref={backHref} />
      </main>
    </>
  );
}
