import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { NavButton } from "@/components/NavButton";
import { TournamentResults } from "@/components/TournamentResults";
import {
  compactButtonClass,
  RowLink,
  rowTitleClass,
  SectionCard,
} from "@/components/ui";
import { formatHeldOn, formatPoints } from "@/lib/domain";
import { getTournamentDetail } from "@/lib/data/tournaments";

type TournamentPageProps = {
  params: Promise<{ tournamentId: string }>;
};

export async function generateMetadata({
  params,
}: TournamentPageProps): Promise<Metadata> {
  const { tournamentId } = await params;
  const tournament = await getTournamentDetail(tournamentId);
  return {
    title: tournament?.name ?? "大会",
  };
}

export const dynamic = "force-dynamic";

export default async function TournamentDetailPage({
  params,
}: TournamentPageProps) {
  const { tournamentId } = await params;
  const tournament = await getTournamentDetail(tournamentId);
  if (!tournament) {
    notFound();
  }

  const matchCount = tournament.matches.length;
  const canAddMatch = tournament.ruleCount > 0;

  return (
    <>
      <AppHeader
        title={tournament.name}
        backHref={`/communities/${tournament.communityId}`}
        action={
          <NavButton href={`/tournaments/${tournament.id}/edit`}>
            編集
          </NavButton>
        }
      />
      <main className="space-y-3 px-3 py-3">
        <div className="px-1">
          <p className="text-sm text-muted">
            {formatHeldOn(tournament.heldOn)}
            {tournament.ruleLabel ? `　${tournament.ruleLabel}` : ""}
          </p>
          {tournament.memo ? (
            <p className="mt-1 line-clamp-3 min-h-15 whitespace-pre-wrap text-sm leading-5 text-muted">
              {tournament.memo}
            </p>
          ) : null}
        </div>

        <SectionCard
          title="総合順位"
          action={
            <NavButton href={`/tournaments/${tournament.id}/adjustments`}>
              ポイント補正
            </NavButton>
          }
        >
          <TournamentResults
            rows={[
              ...tournament.ranked.map((row) => ({
                participantId: row.participantId,
                userId: row.userId,
                name: row.name,
                avatarUrl: row.avatarUrl,
                rank: row.rank,
                finalPoints: row.finalPoints,
              })),
              ...tournament.unplayed.map((row) => ({
                participantId: row.participantId,
                userId: row.userId,
                name: row.name,
                avatarUrl: row.avatarUrl,
                rank: null,
                finalPoints: row.finalPoints,
              })),
            ]}
            from={`/tournaments/${tournament.id}`}
          />
        </SectionCard>

        <SectionCard
          title="試合一覧"
          action={
            canAddMatch ? (
              <NavButton href={`/tournaments/${tournament.id}/matches/new`}>
                追加
              </NavButton>
            ) : (
              <button type="button" disabled className={compactButtonClass}>
                追加
              </button>
            )
          }
        >
          {!canAddMatch ? (
            <p className="border-t border-line px-0 py-3 text-sm text-muted">
              試合を追加するには、先にルールを追加してください。
            </p>
          ) : null}
          {tournament.matches.length > 0 ? (
            <ul className="divide-y divide-line border-t border-line">
              {tournament.matches.map((match, index) => {
                const number = matchCount - index;
                return (
                  <li key={match.id}>
                    <RowLink
                      href={`/matches/${match.id}`}
                      label={`#${number}の詳細`}
                    >
                      <span className={`block tabular-nums ${rowTitleClass}`}>
                        #{number}
                      </span>
                      <ul className="mt-2 space-y-1 text-sm">
                        {match.results.map((result) => (
                          <li
                            key={result.participantId}
                            className="flex items-baseline justify-between gap-3"
                          >
                            <p className="min-w-0 truncate">
                              <span className="inline-block w-6 tabular-nums">
                                {result.rank}
                              </span>
                              <span>{result.name}</span>
                            </p>
                            <p className="shrink-0 tabular-nums">
                              {formatPoints(result.points)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </RowLink>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </SectionCard>
      </main>
    </>
  );
}
