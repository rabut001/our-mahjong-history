export type Seat = "east" | "south" | "west" | "north";

export const SEAT_ORDER: Seat[] = ["east", "south", "west", "north"];

export type TieHandling = "kamicha" | "split" | "manual";

export type MatchRule = {
  playerCount: 3 | 4;
  startingScore: number;
  returnScore: number;
  okaTieHandling: TieHandling;
  umaEnabled: boolean;
  umaTieHandling: TieHandling | null;
  umaPoints1: number | null;
  umaPoints2: number | null;
  rate: number;
};

export type ScoreRow = {
  participantId: string;
  seat: Seat;
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
  seat: Seat;
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

export type TournamentStandingInput = {
  id: string;
  matchPoints: number[];
  adjustments: number[];
};

export type RankedStanding = {
  id: string;
  matchPointTotal: number;
  adjustmentTotal: number;
  finalPoints: number;
  rank: number;
};

export type UnplayedStanding = {
  id: string;
  adjustmentTotal: number;
};
