"use client";

import Link from "next/link";
import { formatPoints } from "@/mock";
import type { RankingRow, UnplayedRow } from "@/mock";

type TournamentResultsProps = {
  ranked: RankingRow[];
  unplayed: UnplayedRow[];
  correctionHref: string;
};

export function TournamentResults({
  ranked,
  unplayed,
  correctionHref,
}: TournamentResultsProps) {
  const standings = [
    ...ranked.map((row) => ({
      id: row.participantId,
      name: row.name,
      rank: row.rank as number | null,
      finalPoints: row.finalPoints,
    })),
    ...unplayed.map((row) => ({
      id: row.participantId,
      name: row.name,
      rank: null as number | null,
      finalPoints: row.adjustmentTotal,
    })),
  ];

  return (
    <>
      <div className="mt-6 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-neutral-600">総合順位</h2>
        <Link
          href={correctionHref}
          className="shrink-0 text-sm text-neutral-600"
        >
          ポイントの補正
        </Link>
      </div>
      <ul className="mt-2 divide-y divide-neutral-200 border-y border-neutral-200">
        {standings.map((row) => (
          <li
            key={row.id}
            className="flex items-baseline justify-between gap-3 py-3"
          >
            <p className="min-w-0 truncate">
              <span className="inline-block w-6 tabular-nums">
                {row.rank ?? "-"}
              </span>
              <span className="font-medium">{row.name}</span>
            </p>
            <p className="shrink-0 tabular-nums">
              {formatPoints(row.finalPoints)}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
