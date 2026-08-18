import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddParticipantsForm } from "@/components/AddParticipantsForm";
import { AppHeader } from "@/components/AppHeader";
import {
  getCommunityMembersForTournament,
  getTournamentDetail,
} from "@/lib/data/tournaments";
import { addParticipantsAction } from "@/lib/data/tournament-actions";

type PageProps = {
  params: Promise<{ tournamentId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { tournamentId } = await params;
  const tournament = await getTournamentDetail(tournamentId);
  return {
    title: tournament ? `${tournament.name}の参加者を追加` : "参加者を追加",
  };
}

export const dynamic = "force-dynamic";

export default async function EditTournamentParticipantsPage({
  params,
}: PageProps) {
  const { tournamentId } = await params;
  const tournament = await getTournamentDetail(tournamentId);
  if (!tournament) {
    notFound();
  }

  const selectedIds = new Set(
    tournament.participants
      .map((item) => item.userId)
      .filter((id): id is string => id !== null),
  );
  const members = (
    await getCommunityMembersForTournament(tournament.communityId)
  ).filter((member) => !selectedIds.has(member.userId));

  return (
    <>
      <AppHeader
        title="参加者を追加"
        backHref={`/tournaments/${tournament.id}/edit`}
      />
      <main className="px-4 py-4">
        <p className="mb-4 text-sm text-muted">
          追加したい人を選んで「追加する」を押してください。
        </p>
        <AddParticipantsForm
          members={members}
          tournamentId={tournament.id}
          action={addParticipantsAction}
        />
      </main>
    </>
  );
}
