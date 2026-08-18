import type { Seat } from "@/lib/domain";
import type { RuleFormData } from "@/lib/domain";

export type MatchFormRule = RuleFormData & { id: string };

export type MatchFormPlayer = {
  participantId: string;
  name: string;
  seat: Seat;
  score: number | null;
  tobiPoints: number;
  yakitoriPoints: number;
  otherPoints: [number, number, number, number, number];
  manualPoints: [number, number, number];
  umaPoints: number;
  baseOverride: number | null;
  points: number;
  rank: number | null;
};

export type MatchFormParticipant = {
  id: string;
  name: string;
};

export type MatchFormData = {
  matchId: string | null;
  tournamentId: string;
  tournamentName: string;
  rules: MatchFormRule[];
  selectedRuleId: string;
  participants: MatchFormParticipant[];
  players: MatchFormPlayer[];
  manualTitles: [string, string, string];
  comment: string;
};
