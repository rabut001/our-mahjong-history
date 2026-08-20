import type { MatchFormPlayer } from "./types";

export const SEATS_4 = ["east", "south", "west", "north"] as const;
export const SEATS_3 = ["east", "south", "west"] as const;
export const SEAT_LABEL: Record<(typeof SEATS_4)[number], string> = {
  east: "東家",
  south: "南家",
  west: "西家",
  north: "北家",
};

export type SeatKey = (typeof SEATS_4)[number];

export function emptyPlayer(
  participant: {
    id: string;
    name: string;
  },
  seat: SeatKey,
): MatchFormPlayer {
  return {
    participantId: participant.id,
    name: participant.name,
    seat,
    score: null,
    tobiPoints: 0,
    yakitoriPoints: 0,
    otherPoints: [0, 0, 0, 0, 0],
    manualPoints: [0, 0, 0],
    umaPoints: 0,
    baseOverride: null,
    points: 0,
    rank: null,
  };
}

export function seatsFromPlayers(
  players: MatchFormPlayer[],
  playerCount: 3 | 4,
): (MatchFormPlayer | null)[] {
  const seats: (MatchFormPlayer | null)[] = Array.from(
    { length: playerCount },
    () => null,
  );
  players.forEach((player) => {
    const index = SEATS_4.indexOf(player.seat);
    if (index >= 0 && index < playerCount) {
      seats[index] = player;
    }
  });
  return seats;
}

export function parseAmount(value: string): number {
  if (value === "" || value === "-") {
    return 0;
  }
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

export const SCORE_DRAFT = /^-?\d*$/;

export function parseScoreDraft(value: string): number | null {
  if (value === "" || value === "-") {
    return null;
  }
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
}
