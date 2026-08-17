import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddParticipantsForm } from "@/components/AddParticipantsForm";
import { AppHeader } from "@/components/AppHeader";
import { getCommunity, listCommunityMembers } from "@/mock";

type PageProps = {
  params: Promise<{ communityId: string }>;
};

export const metadata: Metadata = {
  title: "参加者を追加",
};

export default async function NewTournamentParticipantsPage({
  params,
}: PageProps) {
  const { communityId } = await params;
  const community = getCommunity(communityId);
  if (!community) {
    notFound();
  }

  const backHref = `/communities/${community.id}/tournaments/new`;
  const members = listCommunityMembers(community.id);

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
