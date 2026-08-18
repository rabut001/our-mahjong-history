import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { DangerAction } from "@/components/DangerAction";
import { TournamentForm } from "@/components/TournamentForm";
import {
  getCommunityMembersForTournament,
  getTournamentDetail,
} from "@/lib/data/tournaments";
import {
  deleteTournamentAction,
  removeParticipantAction,
  updateTournamentAction,
} from "@/lib/data/tournament-actions";

type EditPageProps = {
  params: Promise<{ tournamentId: string }>;
};

export async function generateMetadata({
  params,
}: EditPageProps): Promise<Metadata> {
  const { tournamentId } = await params;
  const tournament = await getTournamentDetail(tournamentId);
  return {
    title: tournament ? `${tournament.name}を編集` : "大会を編集",
  };
}

export const dynamic = "force-dynamic";

export default async function TournamentEditPage({ params }: EditPageProps) {
  const { tournamentId } = await params;
  const tournament = await getTournamentDetail(tournamentId);
  if (!tournament) {
    notFound();
  }

  const members = await getCommunityMembersForTournament(
    tournament.communityId,
  );
  const selectedByUserId = new Map(
    tournament.participants
      .filter((item) => item.userId)
      .map((item) => [item.userId as string, item.id]),
  );

  return (
    <>
      <AppHeader
        title="大会を編集"
        backHref={`/tournaments/${tournament.id}`}
      />
      <main className="px-4 py-4">
        <TournamentForm
          mode="edit"
          action={updateTournamentAction}
          hiddenFields={{ tournamentId: tournament.id }}
          removeParticipantAction={removeParticipantAction}
          tournamentId={tournament.id}
          values={{
            heldOn: tournament.heldOn,
            name: tournament.name,
            memo: tournament.memo,
            members: members.map((member) => ({
              userId: member.userId,
              displayName: member.displayName,
              selected: selectedByUserId.has(member.userId),
              participantId: selectedByUserId.get(member.userId),
            })),
            guests: tournament.participants
              .filter((item) => item.guestDisplayName)
              .map((item) => ({
                displayName: item.guestDisplayName ?? "",
                participantId: item.id,
              })),
            rules: tournament.rules.map((rule) => ({
              id: rule.id,
              name: rule.name,
              detailHref: `/tournaments/${tournament.id}/rules/${rule.id}`,
              inUse: rule.inUse,
            })),
            addRuleHref: `/tournaments/${tournament.id}/rules/new`,
            addParticipantHref: `/tournaments/${tournament.id}/participants/new`,
            addGuestHref: `/tournaments/${tournament.id}/guests/new`,
          }}
        />
        <DangerAction
          label="この大会を削除する"
          dialogTitle="この大会を削除しますか？"
          dialogBody="大会に登録した試合の記録も消えます。元に戻せません。"
          confirmLabel="削除する"
          doneHref={`/communities/${tournament.communityId}`}
          action={deleteTournamentAction}
          hiddenFields={{ tournamentId: tournament.id }}
        />
      </main>
    </>
  );
}
