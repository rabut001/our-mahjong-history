import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { NavButton } from "@/components/NavButton";
import {
  countMatches,
  countMembers,
  describeTournamentRules,
  formatHeldOn,
  getCommunity,
  listTournaments,
} from "@/mock";

type CommunityPageProps = {
  params: Promise<{ communityId: string }>;
};

export async function generateMetadata({
  params,
}: CommunityPageProps): Promise<Metadata> {
  const { communityId } = await params;
  const community = getCommunity(communityId);
  return {
    title: community?.name ?? "コミュニティ",
  };
}

export default async function CommunityDetailPage({
  params,
}: CommunityPageProps) {
  const { communityId } = await params;
  const community = getCommunity(communityId);
  if (!community) {
    notFound();
  }

  const tournaments = listTournaments(community.id);
  const memberCount = countMembers(community.id);

  return (
    <>
      <AppHeader title={community.name} backHref="/communities" />
      <main className="px-4 py-4">
        <p className="text-sm text-neutral-600">メンバー {memberCount}人</p>
        <h2 className="mt-6 text-sm font-medium text-neutral-600">大会</h2>
        <ul className="mt-2 divide-y divide-neutral-200 border-y border-neutral-200">
          {tournaments.map((tournament) => {
            const ruleLabel = describeTournamentRules(tournament.id);
            const matchCount = countMatches(tournament.id);
            return (
              <li
                key={tournament.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <span className="min-w-0">
                  <span className="block text-sm text-neutral-600">
                    {formatHeldOn(tournament.heldOn)}
                  </span>
                  <span className="mt-0.5 block font-medium">
                    {tournament.name}
                  </span>
                  <span className="mt-0.5 block text-sm text-neutral-600">
                    {ruleLabel}
                    {ruleLabel ? "、" : ""}
                    {matchCount}試合
                  </span>
                </span>
                <NavButton href={`/tournaments/${tournament.id}`}>
                  詳細
                </NavButton>
              </li>
            );
          })}
        </ul>
        <div className="mt-6">
          <NavButton
            href={`/communities/${community.id}/tournaments/new`}
            variant="block"
          >
            大会を作成
          </NavButton>
        </div>
      </main>
    </>
  );
}
