import { ranksFromValues } from "./ranks";
import type {
  RankedStanding,
  TournamentStandingInput,
  UnplayedStanding,
} from "./types";

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export function summarizeTournament(participants: TournamentStandingInput[]): {
  ranked: RankedStanding[];
  unplayed: UnplayedStanding[];
} {
  const ranked: RankedStanding[] = [];
  const unplayed: UnplayedStanding[] = [];

  for (const participant of participants) {
    const matchPointTotal = sum(participant.matchPoints);
    const adjustmentTotal = sum(participant.adjustments);
    if (participant.matchPoints.length === 0) {
      unplayed.push({
        id: participant.id,
        adjustmentTotal,
      });
      continue;
    }
    ranked.push({
      id: participant.id,
      matchPointTotal,
      adjustmentTotal,
      finalPoints: matchPointTotal + adjustmentTotal,
      rank: 0,
    });
  }

  ranked.sort((a, b) => b.finalPoints - a.finalPoints);
  const ranks = ranksFromValues(ranked.map((row) => row.finalPoints));
  return {
    ranked: ranked.map((row, index) => ({
      ...row,
      rank: ranks[index] ?? index + 1,
    })),
    unplayed,
  };
}
