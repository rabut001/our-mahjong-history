import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { NavButton } from "@/components/NavButton";
import { formatPoints, getMatchDetail, SEAT_LABEL } from "@/mock";

type MatchPageProps = {
  params: Promise<{ matchId: string }>;
};

export async function generateMetadata({
  params,
}: MatchPageProps): Promise<Metadata> {
  const { matchId } = await params;
  const match = getMatchDetail(matchId);
  return {
    title: match ? `#${match.number}` : "試合",
  };
}

export default async function MatchDetailPage({ params }: MatchPageProps) {
  const { matchId } = await params;
  const match = getMatchDetail(matchId);
  if (!match) {
    notFound();
  }

  return (
    <>
      <AppHeader
        title={`#${match.number}`}
        backHref={`/tournaments/${match.tournamentId}`}
        action={<NavButton href={`/matches/${match.id}/edit`}>修正</NavButton>}
      />
      <main className="px-4 py-4">
        <p className="text-sm text-neutral-600">
          {match.ruleName}
          {match.ruleName ? "　" : ""}
          {match.playerCount === 4 ? "四麻" : "三麻"}
        </p>

        <ul className="mt-4 divide-y divide-neutral-200 border-y border-neutral-200">
          {match.results.map((result) => (
            <li key={result.participantId} className="py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 truncate">
                  <span className="inline-block w-6 tabular-nums">
                    {result.rank}
                  </span>
                  <span className="text-sm text-neutral-600">
                    {SEAT_LABEL[result.seat]}
                  </span>
                  <span className="ml-2 font-medium">{result.name}</span>
                </p>
                <p className="shrink-0 tabular-nums">
                  {formatPoints(result.points)}
                </p>
              </div>
              <p className="mt-1 pl-6 text-sm text-neutral-600">
                点数 <span className="tabular-nums">{result.score}</span>
              </p>
            </li>
          ))}
        </ul>

        {match.comment ? (
          <>
            <h2 className="mt-6 text-sm font-medium text-neutral-600">
              コメント
            </h2>
            <p className="mt-2 whitespace-pre-wrap">{match.comment}</p>
          </>
        ) : null}
      </main>
    </>
  );
}
