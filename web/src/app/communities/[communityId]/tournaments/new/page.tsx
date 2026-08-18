import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { TournamentForm } from "@/components/TournamentForm";
import { getCommunityDetail } from "@/lib/data";
import { createTournamentAction } from "@/lib/data/tournament-actions";
import { tokyoYmd } from "@/lib/domain";
import {
  parseTournamentCreateDraft,
  tournamentCreateDraftQuery,
} from "@/lib/tournament-create-query";

export const metadata: Metadata = {
  title: "大会を作成",
};

type NewTournamentPageProps = {
  params: Promise<{ communityId: string }>;
  searchParams: Promise<{
    d?: string | string[];
    n?: string | string[];
    m?: string | string[];
    u?: string | string[];
    g?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export default async function NewTournamentPage({
  params,
  searchParams,
}: NewTournamentPageProps) {
  const { communityId } = await params;
  const draft = parseTournamentCreateDraft(await searchParams);
  const community = await getCommunityDetail(communityId);
  if (!community) {
    notFound();
  }

  const selected = new Set(draft.userIds);
  const draftReturnPath = `/communities/${community.id}/tournaments/new`;

  return (
    <>
      <AppHeader title="大会を作成" backHref={`/communities/${community.id}`} />
      <main className="px-4 py-4">
        <TournamentForm
          key={tournamentCreateDraftQuery(draft) || "new"}
          mode="create"
          action={createTournamentAction}
          hiddenFields={{ communityId: community.id }}
          values={{
            heldOn: draft.heldOn || tokyoYmd(),
            name: draft.name,
            memo: draft.memo,
            members: community.members.map((member) => ({
              userId: member.userId,
              displayName: member.displayName,
              selected: selected.has(member.userId),
            })),
            guests: draft.guestNames.map((displayName) => ({ displayName })),
            rules: community.rules.map((rule) => ({
              id: rule.id,
              name: rule.name,
              inUse: false,
            })),
            draftReturnPath,
          }}
        />
      </main>
    </>
  );
}
