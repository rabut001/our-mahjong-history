import type { Rule } from "@/mock/types";

export type ScoreRow = {
  participantId: string;
  score: number;
  tobiPoints: number;
  yakitoriPoints: number;
  otherPoints: number[];
  manualPoints: number[];
  baseOverride?: number | null;
  umaOverride?: number;
};

export type CalculatedRow = {
  participantId: string;
  score: number;
  tobiPoints: number;
  yakitoriPoints: number;
  otherPoints: number[];
  manualPoints: number[];
  rank: number;
  umaPoints: number;
  basePoints: number;
  totalPoints: number;
  points: number;
};

export function okaPool(rule: Rule): number {
  return ((rule.returnScore - rule.startingScore) * rule.playerCount) / 1000;
}

function ranksFromValues(values: number[]): number[] {
  const order = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value);
  const ranks = Array.from({ length: values.length }, () => 0);
  for (let position = 0; position < order.length; position += 1) {
    const current = order[position];
    if (!current) {
      continue;
    }
    if (position > 0 && current.value === order[position - 1]?.value) {
      ranks[current.index] = ranks[order[position - 1]?.index ?? 0] ?? position;
    } else {
      ranks[current.index] = position + 1;
    }
  }
  return ranks;
}

function rankCounts(ranks: number[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const rank of ranks) {
    counts.set(rank, (counts.get(rank) ?? 0) + 1);
  }
  return counts;
}

function umaForKamicha(values: number[], rule: Rule): number[] {
  const order = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value || a.index - b.index);
  const uma = Array.from({ length: values.length }, () => 0);
  order.forEach((item, place) => {
    uma[item.index] = umaForRank(place + 1, rule);
  });
  return uma;
}

function umaForRank(rank: number, rule: Rule): number {
  if (!rule.umaEnabled || rule.umaPoints1 === null) {
    return 0;
  }
  const uma1 = rule.umaPoints1;
  const uma2 = rule.umaPoints2 ?? 0;
  if (rule.playerCount === 4) {
    if (rank === 1) return uma1;
    if (rank === 2) return uma2;
    if (rank === 3) return -uma2;
    if (rank === 4) return -uma1;
    return 0;
  }
  if (rank === 1) return uma1;
  if (rank === 3) return -uma1;
  return 0;
}

function okaForIndex(index: number, scoreRanks: number[], rule: Rule): number {
  const pool = okaPool(rule);
  const firsts = scoreRanks
    .map((rank, playerIndex) => (rank === 1 ? playerIndex : -1))
    .filter((playerIndex) => playerIndex >= 0);
  if (firsts.length === 0) {
    return 0;
  }
  if (firsts.length === 1) {
    return firsts[0] === index ? pool : 0;
  }
  if (rule.okaTieHandling === "split") {
    return firsts.includes(index) ? pool / firsts.length : 0;
  }
  const kamicha = Math.min(...firsts);
  return index === kamicha ? pool : 0;
}

export function calculateMatchPoints(
  rows: ScoreRow[],
  rule: Rule,
): CalculatedRow[] {
  const scores = rows.map((row) => row.score);
  const scoreRanks = ranksFromValues(scores);
  const scoreFirstTied = (rankCounts(scoreRanks).get(1) ?? 0) > 1;

  const basePointsList = rows.map((row, index) => {
    const raw = (row.score - rule.returnScore) / 1000;
    const scoreRank = scoreRanks[index] ?? index + 1;
    const baseOverride = row.baseOverride;
    const manualBase =
      rule.okaTieHandling === "manual" &&
      scoreFirstTied &&
      scoreRank === 1 &&
      baseOverride != null;
    if (manualBase) {
      return baseOverride;
    }
    if (rule.okaTieHandling === "manual" && scoreFirstTied) {
      return raw;
    }
    return raw + okaForIndex(index, scoreRanks, rule);
  });

  const ranks = ranksFromValues(basePointsList);
  const counts = rankCounts(ranks);
  const umaByKamicha = umaForKamicha(basePointsList, rule);

  return rows.map((row, index) => {
    const rank = ranks[index] ?? index + 1;
    const basePoints = basePointsList[index] ?? 0;
    const umaTied = (counts.get(rank) ?? 0) > 1;
    const umaPoints = !rule.umaEnabled
      ? 0
      : rule.umaTieHandling === "manual" && umaTied
        ? (row.umaOverride ?? 0)
        : rule.umaTieHandling === "kamicha"
          ? (umaByKamicha[index] ?? 0)
          : umaForRank(rank, rule);
    const extras =
      row.tobiPoints +
      row.yakitoriPoints +
      row.otherPoints.reduce((sum, value) => sum + value, 0) +
      row.manualPoints.reduce((sum, value) => sum + value, 0);
    const totalPoints = basePoints + umaPoints + extras;
    const points = totalPoints * rule.rate;
    return {
      participantId: row.participantId,
      score: row.score,
      tobiPoints: row.tobiPoints,
      yakitoriPoints: row.yakitoriPoints,
      otherPoints: row.otherPoints,
      manualPoints: row.manualPoints,
      rank,
      umaPoints,
      basePoints,
      totalPoints,
      points,
    };
  });
}
