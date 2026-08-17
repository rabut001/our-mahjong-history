import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddGuestForm } from "@/components/AddGuestForm";
import { AppHeader } from "@/components/AppHeader";
import { getCommunity } from "@/mock";

type PageProps = {
  params: Promise<{ communityId: string }>;
};

export const metadata: Metadata = {
  title: "ゲスト参加者を追加",
};

export default async function NewTournamentGuestPage({ params }: PageProps) {
  const { communityId } = await params;
  const community = getCommunity(communityId);
  if (!community) {
    notFound();
  }

  const backHref = `/communities/${community.id}/tournaments/new`;

  return (
    <>
      <AppHeader title="ゲスト参加者を追加" backHref={backHref} />
      <main className="px-4 py-4">
        <AddGuestForm backHref={backHref} />
      </main>
    </>
  );
}
