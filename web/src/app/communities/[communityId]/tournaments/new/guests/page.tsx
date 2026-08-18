import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddGuestForm } from "@/components/AddGuestForm";
import { AppHeader } from "@/components/AppHeader";
import { getCommunityDetail } from "@/lib/data";
import {
  parseTournamentCreateDraft,
  tournamentCreateDraftQuery,
} from "@/lib/tournament-create-query";

export const metadata: Metadata = {
  title: "ゲスト参加者を追加",
};

type PageProps = {
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

export default async function NewTournamentGuestPage({
  params,
  searchParams,
}: PageProps) {
  const { communityId } = await params;
  const draft = parseTournamentCreateDraft(await searchParams);
  const community = await getCommunityDetail(communityId);
  if (!community) {
    notFound();
  }

  const returnPath = `/communities/${community.id}/tournaments/new`;

  return (
    <>
      <AppHeader
        title="ゲスト参加者を追加"
        backHref={`${returnPath}${tournamentCreateDraftQuery(draft)}`}
      />
      <main className="px-4 py-4">
        <AddGuestForm
          draft={{
            returnPath,
            heldOn: draft.heldOn,
            name: draft.name,
            memo: draft.memo,
            userIds: draft.userIds,
            guestNames: draft.guestNames,
          }}
        />
      </main>
    </>
  );
}
