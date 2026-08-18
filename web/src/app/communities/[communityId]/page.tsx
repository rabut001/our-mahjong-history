import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { MemberIconRow } from "@/components/MemberIconRow";
import { NavButton } from "@/components/NavButton";
import { RowLink, rowTitleClass, SectionCard } from "@/components/ui";
import { formatHeldOn } from "@/lib/domain";
import { getCommunityDetail } from "@/lib/data";

type CommunityPageProps = {
  params: Promise<{ communityId: string }>;
};

export async function generateMetadata({
  params,
}: CommunityPageProps): Promise<Metadata> {
  const { communityId } = await params;
  const community = await getCommunityDetail(communityId);
  return {
    title: community?.name ?? "麻雀グループ",
  };
}

export const dynamic = "force-dynamic";

export default async function CommunityDetailPage({
  params,
}: CommunityPageProps) {
  const { communityId } = await params;
  const community = await getCommunityDetail(communityId);
  if (!community) {
    notFound();
  }

  const from = `/communities/${community.id}`;

  return (
    <>
      <AppHeader
        title={community.name}
        backHref="/communities"
        action={
          <NavButton href={`/communities/${community.id}/edit`}>編集</NavButton>
        }
      />
      <main className="space-y-3 px-3 py-3">
        {community.comment ? (
          <p className="px-1 text-sm leading-5 text-muted line-clamp-3 min-h-15 whitespace-pre-wrap">
            {community.comment}
          </p>
        ) : null}
        <SectionCard
          title="メンバー"
          action={
            <NavButton href={`/communities/${community.id}/invite`}>
              招待
            </NavButton>
          }
        >
          <MemberIconRow members={community.members} from={from} />
        </SectionCard>
        <SectionCard
          title="大会"
          action={
            <NavButton href={`/communities/${community.id}/tournaments/new`}>
              追加
            </NavButton>
          }
        >
          {community.tournaments.length > 0 ? (
            <ul className="divide-y divide-line border-t border-line">
              {community.tournaments.map((tournament) => (
                <li key={tournament.id}>
                  <RowLink
                    href={`/tournaments/${tournament.id}`}
                    label={`${tournament.name}の詳細`}
                  >
                    <span className="block text-sm text-muted">
                      {formatHeldOn(tournament.heldOn)}
                    </span>
                    <span className={`mt-0.5 block ${rowTitleClass}`}>
                      {tournament.name}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">
                      {tournament.ruleLabel}
                      {tournament.ruleLabel ? "、" : ""}
                      {tournament.matchCount}試合
                    </span>
                  </RowLink>
                </li>
              ))}
            </ul>
          ) : null}
        </SectionCard>
        <SectionCard
          title="ルール"
          action={
            <NavButton href={`/communities/${community.id}/rules/new`}>
              追加
            </NavButton>
          }
        >
          {community.rules.length > 0 ? (
            <ul className="divide-y divide-line border-t border-line">
              {community.rules.map((rule) => (
                <li key={rule.id}>
                  <RowLink
                    href={`/communities/${community.id}/rules/${rule.id}`}
                    label={`${rule.name}の詳細`}
                  >
                    <span className={`block ${rowTitleClass}`}>
                      {rule.name}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">
                      {rule.playerCount === 4 ? "四麻" : "三麻"}
                    </span>
                  </RowLink>
                </li>
              ))}
            </ul>
          ) : null}
        </SectionCard>
      </main>
    </>
  );
}
