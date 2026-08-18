"use client";

import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { formatPoints } from "@/lib/domain";
import { rowTitleClass } from "@/components/ui";

export type TournamentResultsRow = {
  participantId: string;
  userId: string | null;
  name: string;
  avatarUrl: string | null;
  rank: number | null;
  finalPoints: number;
};

type TournamentResultsProps = {
  rows: TournamentResultsRow[];
  from: string;
};

export function TournamentResults({ rows, from }: TournamentResultsProps) {
  return (
    <>
      {rows.length > 0 ? (
        <ul className="divide-y divide-line border-t border-line">
          {rows.map((row) => {
            const identity = (
              <>
                <Avatar
                  url={row.avatarUrl}
                  name={row.name}
                  sizeClass="h-8 w-8 text-xs"
                />
                <span className={`min-w-0 truncate ${rowTitleClass}`}>
                  {row.name}
                </span>
              </>
            );

            return (
              <li
                key={row.participantId}
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
      ) : null}
      <p className="mt-2 text-right text-sm text-muted">
        大会への参加は右上の編集ボタンから
      </p>
    </>
  );
}
