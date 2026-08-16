"use client";

import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { NavButton } from "@/components/NavButton";
import { formatPoints } from "@/mock";
import type { RankingRow, UnplayedRow } from "@/mock";

type TournamentResultsProps = {
  ranked: RankingRow[];
  unplayed: UnplayedRow[];
  correctionHref: string;
  from: string;
};

export function TournamentResults({
  ranked,
  unplayed,
  correctionHref,
  from,
}: TournamentResultsProps) {
  const standings = [
    ...ranked.map((row) => ({
      id: row.participantId,
      userId: row.userId,
      name: row.name,
      avatarUrl: row.avatarUrl,
      rank: row.rank as number | null,
      finalPoints: row.finalPoints,
    })),
    ...unplayed.map((row) => ({
      id: row.participantId,
      userId: row.userId,
      name: row.name,
      avatarUrl: row.avatarUrl,
      rank: null as number | null,
      finalPoints: row.adjustmentTotal,
    })),
  ];

  return (
    <>
      <div className="mt-6 flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-neutral-600">総合順位</h2>
        <NavButton href={correctionHref}>ポイント補正</NavButton>
      </div>
      <ul className="mt-2 divide-y divide-neutral-200 border-y border-neutral-200">
        {standings.map((row) => {
          const identity = (
            <>
              <Avatar
                url={row.avatarUrl}
                name={row.name}
                sizeClass="h-8 w-8 text-xs"
              />
              <span className="min-w-0 truncate font-medium">{row.name}</span>
            </>
          );

          return (
            <li
              key={row.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="inline-block w-6 shrink-0 tabular-nums">
                  {row.rank ?? "-"}
                </span>
                {row.userId ? (
                  <Link
                    href={`/profiles/${row.userId}?from=${encodeURIComponent(from)}`}
                    aria-label={`${row.name}の詳細`}
                    className="flex min-w-0 items-center gap-2"
                  >
                    {identity}
                  </Link>
                ) : (
                  identity
                )}
              </div>
              <p className="shrink-0 tabular-nums">
                {formatPoints(row.finalPoints)}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-right text-sm text-neutral-600">
        大会への参加は右上の編集ボタンから
      </p>
    </>
  );
}
