import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { DangerAction } from "@/components/DangerAction";
import { TournamentForm } from "@/components/TournamentForm";
import {
  getTournament,
  isTournamentRuleInUse,
  listCommunityMembers,
  listTournamentParticipants,
  listTournamentRules,
  participantDisplayName,
} from "@/mock";

type EditPageProps = {
  params: Promise<{ tournamentId: string }>;
};

export async function generateMetadata({
  params,
}: EditPageProps): Promise<Metadata> {
  const { tournamentId } = await params;
  const tournament = getTournament(tournamentId);
  return {
    title: tournament ? `${tournament.name}を編集` : "大会を編集",
  };
}

export default async function TournamentEditPage({ params }: EditPageProps) {
  const { tournamentId } = await params;
  const tournament = getTournament(tournamentId);
  if (!tournament) {
    notFound();
  }

  const members = listCommunityMembers(tournament.communityId);
  const participants = listTournamentParticipants(tournament.id);
  const selectedUserIds = new Set(
    participants
      .map((participant) => participant.userId)
      .filter((userId): userId is string => userId !== null),
  );
  const guests = participants
    .filter((participant) => participant.guestDisplayName)
    .map((participant) => participantDisplayName(participant));

  return (
    <>
      <AppHeader
        title="大会を編集"
        backHref={`/tournaments/${tournament.id}`}
      />
      <main className="px-4 py-4">
        <TournamentForm
          mode="edit"
          values={{
            heldOn: tournament.heldOn,
            name: tournament.name,
            memo: tournament.memo,
            members: members.map((member) => ({
              ...member,
              selected: selectedUserIds.has(member.userId),
            })),
            guests,
            rules: listTournamentRules(tournament.id).map((rule) => ({
              id: rule.id,
              name: rule.name,
              detailHref: `/tournaments/${tournament.id}/rules/${rule.id}`,
              inUse: isTournamentRuleInUse(rule.id),
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
        />
      </main>
    </>
  );
}
