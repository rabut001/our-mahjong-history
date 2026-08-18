import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { NavButton } from "@/components/NavButton";
import { RowLink } from "@/components/RowLink";
import { SectionCard } from "@/components/SectionCard";
import { TournamentResults } from "@/components/TournamentResults";
import { rowTitleClass } from "@/components/ui";
import { formatHeldOn, formatPoints } from "@/lib/domain";
import {
  describeTournamentRules,
  getTournament,
  getTournamentSummary,
  listMatches,
} from "@/mock";

type TournamentPageProps = {
  params: Promise<{ tournamentId: string }>;
};

export async function generateMetadata({
  params,
}: TournamentPageProps): Promise<Metadata> {
  const { tournamentId } = await params;
  const tournament = getTournament(tournamentId);
  return {
    title: tournament?.name ?? "大会",
  };
}

export default async function TournamentDetailPage({
  params,
}: TournamentPageProps) {
  const { tournamentId } = await params;
  const tournament = getTournament(tournamentId);
  if (!tournament) {
    notFound();
  }

  const ruleLabel = describeTournamentRules(tournament.id);
  const matches = listMatches(tournament.id);
  const summary = getTournamentSummary(tournament.id);

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
            {ruleLabel ? `　${ruleLabel}` : ""}
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
            ranked={summary.ranked}
            unplayed={summary.unplayed}
            from={`/tournaments/${tournament.id}`}
          />
        </SectionCard>

        <SectionCard
          title="試合一覧"
          action={
            <NavButton href={`/tournaments/${tournament.id}/matches/new`}>
              追加
            </NavButton>
          }
        >
          <ul className="divide-y divide-line border-t border-line">
            {matches.map((match) => (
              <li key={match.id}>
                <RowLink
                  href={`/matches/${match.id}`}
                  label={`#${match.number}の詳細`}
                >
                  <span className={`block tabular-nums ${rowTitleClass}`}>
                    #{match.number}
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
            ))}
          </ul>
        </SectionCard>
      </main>
    </>
  );
}
