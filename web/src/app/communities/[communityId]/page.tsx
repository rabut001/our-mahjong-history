import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { MemberIconRow } from "@/components/MemberIconRow";
import { NavButton } from "@/components/NavButton";
import {
  countMatches,
  describeTournamentRules,
  formatHeldOn,
  getCommunity,
  listCommunityMembers,
  listCommunityRules,
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
  const members = listCommunityMembers(community.id);
  const rules = listCommunityRules(community.id);

  return (
    <>
      <AppHeader
        title={community.name}
        backHref="/communities"
        action={
          <NavButton href={`/communities/${community.id}/edit`}>編集</NavButton>
        }
      />
      <main className="px-4 py-4">
        {community.comment ? (
          <p className="mb-6 line-clamp-3 min-h-[3.75rem] whitespace-pre-wrap text-sm leading-5 text-neutral-600">
            {community.comment}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-neutral-600">メンバー</h2>
          <NavButton href={`/communities/${community.id}/invite`}>
            招待
          </NavButton>
        </div>
        <div className="mt-2">
          <MemberIconRow
            members={members}
            from={`/communities/${community.id}`}
          />
        </div>
        <div className="mt-6 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-neutral-600">大会</h2>
          <NavButton href={`/communities/${community.id}/tournaments/new`}>
            追加
          </NavButton>
        </div>
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

        <div className="mt-8 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-neutral-600">ルール</h2>
          <NavButton href={`/communities/${community.id}/rules/new`}>
            追加
          </NavButton>
        </div>
        <ul className="mt-2 divide-y divide-neutral-200 border-y border-neutral-200">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <span className="min-w-0">
                <span className="block font-medium">{rule.name}</span>
                <span className="mt-0.5 block text-sm text-neutral-600">
                  {rule.playerCount === 4 ? "四麻" : "三麻"}
                </span>
              </span>
              <NavButton href={`/communities/${community.id}/rules/${rule.id}`}>
                詳細
              </NavButton>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
