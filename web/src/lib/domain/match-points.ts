import { ranksFromValues } from "./ranks";
import { splitByKamicha } from "./split";
import type { CalculatedRow, MatchRule, ScoreRow, Seat } from "./types";
import { SEAT_ORDER } from "./types";

export function okaPool(rule: MatchRule): number {
  return ((rule.returnScore - rule.startingScore) * rule.playerCount) / 1000;
}

function seatIndex(seat: Seat): number {
  const index = SEAT_ORDER.indexOf(seat);
  return index >= 0 ? index : SEAT_ORDER.length;
}

function sortByKamicha(indices: number[], rows: ScoreRow[]): number[] {
  return indices.slice().sort((a, b) => {
    const left = rows[a];
    const right = rows[b];
    if (!left || !right) {
      return a - b;
    }
    return seatIndex(left.seat) - seatIndex(right.seat);
  });
}

function umaForPlace(place: number, rule: MatchRule): number {
  if (!rule.umaEnabled || rule.umaPoints1 === null) {
    return 0;
  }
  const uma1 = rule.umaPoints1;
  const uma2 = rule.umaPoints2 ?? 0;
  if (rule.playerCount === 4) {
    if (place === 1) return uma1;
    if (place === 2) return uma2;
    if (place === 3) return -uma2;
    if (place === 4) return -uma1;
    return 0;
  }
  if (place === 1) return uma1;
  if (place === 3) return -uma1;
  return 0;
}

function extrasOf(row: ScoreRow): number {
  return (
    row.tobiPoints +
    row.yakitoriPoints +
    row.otherPoints.reduce((sum, value) => sum + value, 0) +
    row.manualPoints.reduce((sum, value) => sum + value, 0)
  );
}

function okaPoints(rows: ScoreRow[], rule: MatchRule): number[] {
  const scores = rows.map((row) => row.score);
  const scoreRanks = ranksFromValues(scores);
  const firsts = sortByKamicha(
    scoreRanks.flatMap((rank, index) => (rank === 1 ? [index] : [])),
    rows,
  );
  const points = Array.from({ length: rows.length }, () => 0);
  const pool = okaPool(rule);
  if (firsts.length === 0) {
    return points;
  }
  if (firsts.length === 1) {
    const only = firsts[0];
    if (only !== undefined) {
      points[only] = pool;
    }
    return points;
  }
  if (rule.okaTieHandling === "kamicha") {
    const winner = firsts[0];
    if (winner !== undefined) {
      points[winner] = pool;
    }
    return points;
  }
  if (rule.okaTieHandling === "split") {
    const shares = splitByKamicha(pool, firsts.length);
    firsts.forEach((index, position) => {
      points[index] = shares[position] ?? 0;
    });
  }
  return points;
}

function umaPointsForRows(
  rows: ScoreRow[],
  ranks: number[],
  rule: MatchRule,
): number[] {
  const points = Array.from({ length: rows.length }, () => 0);
  if (!rule.umaEnabled) {
    return points;
  }

  const groups = new Map<number, number[]>();
  ranks.forEach((rank, index) => {
    const members = groups.get(rank) ?? [];
    members.push(index);
    groups.set(rank, members);
  });

  for (const [rank, members] of groups) {
    const ordered = sortByKamicha(members, rows);
    const size = ordered.length;
    const slotValues = Array.from({ length: size }, (_, offset) =>
      umaForPlace(rank + offset, rule),
    );
    const tied = size > 1;
    const handling = rule.umaTieHandling;

    if (!tied || handling === null) {
      ordered.forEach((index, position) => {
        points[index] = slotValues[position] ?? 0;
      });
      continue;
    }

    if (handling === "manual") {
      ordered.forEach((index) => {
        points[index] = rows[index]?.umaOverride ?? 0;
      });
      continue;
    }

    if (handling === "kamicha") {
      ordered.forEach((index, position) => {
        points[index] = slotValues[position] ?? 0;
      });
      continue;
    }

    const shares = splitByKamicha(
      slotValues.reduce((sum, value) => sum + value, 0),
      size,
    );
    ordered.forEach((index, position) => {
      points[index] = shares[position] ?? 0;
    });
  }

  return points;
}

export function calculateMatchPoints(
  rows: ScoreRow[],
  rule: MatchRule,
): CalculatedRow[] {
  const ranks = ranksFromValues(rows.map((row) => row.score));
  const firstTied = ranks.filter((rank) => rank === 1).length > 1;
  const useManualBase = rule.okaTieHandling === "manual" && firstTied;
  const oka = useManualBase
    ? Array.from({ length: rows.length }, () => 0)
    : okaPoints(rows, rule);

  const basePointsList = rows.map((row, index) => {
    if (useManualBase) {
      return row.baseOverride ?? 0;
    }
    const raw = (row.score - rule.returnScore) / 1000;
    return raw + (oka[index] ?? 0);
  });

  const umaPointsList = umaPointsForRows(rows, ranks, rule);

  return rows.map((row, index) => {
    const basePoints = basePointsList[index] ?? 0;
    const umaPoints = umaPointsList[index] ?? 0;
    const totalPoints = basePoints + umaPoints + extrasOf(row);
    const points = totalPoints * rule.rate;
    return {
      participantId: row.participantId,
      seat: row.seat,
      score: row.score,
      tobiPoints: row.tobiPoints,
      yakitoriPoints: row.yakitoriPoints,
      otherPoints: row.otherPoints,
      manualPoints: row.manualPoints,
      rank: ranks[index] ?? index + 1,
      umaPoints,
      basePoints,
      totalPoints,
      points: points === 0 ? 0 : points,
    };
  });
}
