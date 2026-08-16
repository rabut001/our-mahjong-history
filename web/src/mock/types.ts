export type Profile = {
  id: string;
  displayName: string;
};

export type Community = {
  id: string;
  name: string;
};

export type CommunityMembership = {
  communityId: string;
  userId: string;
};

export type Rule = {
  id: string;
  name: string;
  playerCount: 3 | 4;
  startingScore: number;
  returnScore: number;
  okaTieHandling: "kamicha" | "split" | "manual";
  umaEnabled: boolean;
  umaTieHandling: "kamicha" | "split" | "manual" | null;
  umaPoints1: number | null;
  umaPoints2: number | null;
  tobiEnabled: boolean;
  yakitoriEnabled: boolean;
  otherPoints1Name: string;
  otherPoints2Name: string;
  otherPoints3Name: string;
  otherPoints4Name: string;
  otherPoints5Name: string;
  rate: number;
  notes: string;
};

export type CommunityRule = Rule & {
  communityId: string;
};

export type TournamentRule = Rule & {
  tournamentId: string;
};

export type Tournament = {
  id: string;
  communityId: string;
  heldOn: string;
  name: string;
  memo: string;
  adjustmentPoints1Title: string;
  adjustmentPoints2Title: string;
  adjustmentPoints3Title: string;
  adjustmentPoints4Title: string;
  adjustmentPoints5Title: string;
};

export type TournamentParticipant = {
  id: string;
  tournamentId: string;
  userId: string | null;
  guestDisplayName: string | null;
};

export type Match = {
  id: string;
  tournamentId: string;
  tournamentRuleId: string;
  createdAt: string;
};

export type Seat = "east" | "south" | "west" | "north";

export type MatchResult = {
  id: string;
  matchId: string;
  tournamentParticipantId: string;
  seat: Seat;
  score: number;
  basePoints: number;
  umaPoints: number;
  tobiPoints: number;
  yakitoriPoints: number;
  otherPoints1: number;
  otherPoints2: number;
  otherPoints3: number;
  otherPoints4: number;
  otherPoints5: number;
  manualPoints1: number;
  manualPoints2: number;
  manualPoints3: number;
  points: number;
  rank: number;
};

export type TournamentPointAdjustment = {
  id: string;
  tournamentParticipantId: string;
  adjustmentPoints1: number;
  adjustmentPoints2: number;
  adjustmentPoints3: number;
  adjustmentPoints4: number;
  adjustmentPoints5: number;
};
