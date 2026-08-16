import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { TournamentForm } from "@/components/TournamentForm";
import { getCommunity, listCommunityMembers, listCommunityRules } from "@/mock";

export const metadata: Metadata = {
  title: "大会を作成",
};

type NewTournamentPageProps = {
  params: Promise<{ communityId: string }>;
};

export default async function NewTournamentPage({
  params,
}: NewTournamentPageProps) {
  const { communityId } = await params;
  const community = getCommunity(communityId);
  if (!community) {
    notFound();
  }

  const members = listCommunityMembers(community.id);

  return (
    <>
      <AppHeader title="大会を作成" backHref={`/communities/${community.id}`} />
      <main className="px-4 py-4">
        <TournamentForm
          mode="create"
          values={{
            heldOn: "2026-08-16",
            name: "",
            memo: "",
            members: members.map((member) => ({
              ...member,
              selected: false,
            })),
            guests: [],
            ruleNames: listCommunityRules(community.id).map(
              (rule) => rule.name,
            ),
          }}
        />
      </main>
    </>
  );
}
