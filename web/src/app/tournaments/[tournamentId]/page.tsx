import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { NavButton } from "@/components/NavButton";
import { TournamentResults } from "@/components/TournamentResults";
import {
  describeTournamentRules,
  formatHeldOn,
  formatPoints,
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
      <main className="px-4 py-4">
        <p className="text-sm text-neutral-600">
          {formatHeldOn(tournament.heldOn)}
          {ruleLabel ? `　${ruleLabel}` : ""}
        </p>
        {tournament.memo ? (
          <p className="mt-1 text-sm text-neutral-600">{tournament.memo}</p>
        ) : null}

        <TournamentResults
          ranked={summary.ranked}
          unplayed={summary.unplayed}
          correctionHref={`/tournaments/${tournament.id}/adjustments`}
        />

        <div className="mt-6 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-neutral-600">試合一覧</h2>
          <NavButton href={`/tournaments/${tournament.id}/matches/new`}>
            追加
          </NavButton>
        </div>
        <ul className="mt-2 divide-y divide-neutral-200 border-y border-neutral-200">
          {matches.map((match) => (
            <li key={match.id} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium tabular-nums">#{match.number}</p>
                <NavButton href={`/matches/${match.id}/edit`}>修正</NavButton>
              </div>
              <ul className="mt-2 space-y-1">
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
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
