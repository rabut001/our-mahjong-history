import {
  communities,
  communityInviteCodes,
  communityMemberships,
  communityRules,
  currentUserId,
  matchResults,
  matches,
  profiles,
  tournamentParticipants,
  tournamentPointAdjustments,
  tournamentRules,
  tournaments,
} from "./data";
import type {
  Community,
  CommunityRule,
  Match,
  Profile,
  Rule,
  Seat,
  Tournament,
  TournamentParticipant,
  TournamentRule,
} from "./types";

export type {
  Community,
  Rule,
  Tournament,
  TournamentRule,
  Seat,
} from "./types";

export const SEAT_LABEL: Record<Seat, string> = {
  east: "東家",
  south: "南家",
  west: "西家",
  north: "北家",
};

export type AdjustmentLine = {
  title: string;
  amount: number;
};

export type RankingRow = {
  participantId: string;
  userId: string | null;
  name: string;
  avatarUrl: string | null;
  rank: number;
  matchPoints: number;
  adjustments: AdjustmentLine[];
  adjustmentTotal: number;
  finalPoints: number;
};

export type UnplayedRow = {
  participantId: string;
  userId: string | null;
  name: string;
  avatarUrl: string | null;
  adjustments: AdjustmentLine[];
  adjustmentTotal: number;
};

export type MatchResultRow = {
  participantId: string;
  name: string;
  rank: number;
  points: number;
};

export type MatchListItem = {
  id: string;
  number: number;
  results: MatchResultRow[];
};

export function listCommunities(): Community[] {
  return communities;
}

export function getCommunity(communityId: string): Community | undefined {
  return communities.find((community) => community.id === communityId);
}

export function countMembers(communityId: string): number {
  return communityMemberships.filter((row) => row.communityId === communityId)
    .length;
}

export function getCurrentProfile(): Profile | undefined {
  return profiles.find((profile) => profile.id === currentUserId);
}

export function getProfile(userId: string): Profile | undefined {
  return profiles.find((profile) => profile.id === userId);
}

export function listCommunityMembers(communityId: string): {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  isCurrentUser: boolean;
}[] {
  return communityMemberships
    .filter((row) => row.communityId === communityId)
    .map((row) => {
      const profile = profiles.find((item) => item.id === row.userId);
      return {
        userId: row.userId,
        displayName: profile?.displayName ?? row.userId,
        avatarUrl: profile?.avatarUrl ?? null,
        isCurrentUser: row.userId === currentUserId,
      };
    })
    .sort((a, b) => Number(b.isCurrentUser) - Number(a.isCurrentUser));
}

export const INVITE_DEFAULT_DAYS = 7;

export function getCommunityInviteCode(communityId: string):
  | {
      code: string;
      expiresAt: string;
    }
  | undefined {
  return communityInviteCodes.find((row) => row.communityId === communityId);
}

export function listCommunityRules(communityId: string): CommunityRule[] {
  return communityRules.filter((rule) => rule.communityId === communityId);
}

export function getCommunityRule(ruleId: string): CommunityRule | undefined {
  return communityRules.find((rule) => rule.id === ruleId);
}

export function getTournamentRule(ruleId: string): TournamentRule | undefined {
  return tournamentRules.find((rule) => rule.id === ruleId);
}

export function isTournamentRuleInUse(ruleId: string): boolean {
  return matches.some((match) => match.tournamentRuleId === ruleId);
}

export type RuleFormData = Omit<Rule, "id">;

export function toRuleFormData(rule: Rule): RuleFormData {
  return {
    name: rule.name,
    playerCount: rule.playerCount,
    startingScore: rule.startingScore,
    returnScore: rule.returnScore,
    okaTieHandling: rule.okaTieHandling,
    umaEnabled: rule.umaEnabled,
    umaTieHandling: rule.umaTieHandling,
    umaPoints1: rule.umaPoints1,
    umaPoints2: rule.umaPoints2,
    tobiEnabled: rule.tobiEnabled,
    yakitoriEnabled: rule.yakitoriEnabled,
    otherPoints1Name: rule.otherPoints1Name,
    otherPoints2Name: rule.otherPoints2Name,
    otherPoints3Name: rule.otherPoints3Name,
    otherPoints4Name: rule.otherPoints4Name,
    otherPoints5Name: rule.otherPoints5Name,
    rate: rule.rate,
    notes: rule.notes,
  };
}

export function emptyRuleFormData(): RuleFormData {
  return {
    name: "",
    playerCount: 4,
    startingScore: 25000,
    returnScore: 30000,
    okaTieHandling: "kamicha",
    umaEnabled: true,
    umaTieHandling: "kamicha",
    umaPoints1: 30,
    umaPoints2: 10,
    tobiEnabled: true,
    yakitoriEnabled: false,
    otherPoints1Name: "",
    otherPoints2Name: "",
    otherPoints3Name: "",
    otherPoints4Name: "",
    otherPoints5Name: "",
    rate: 1,
    notes: "",
  };
}

export function listTournaments(communityId: string): Tournament[] {
  return tournaments
    .filter((tournament) => tournament.communityId === communityId)
    .slice()
    .sort((a, b) => {
      if (a.heldOn !== b.heldOn) {
        return a.heldOn < b.heldOn ? 1 : -1;
      }
      return a.id < b.id ? 1 : -1;
    });
}

export function getTournament(tournamentId: string): Tournament | undefined {
  return tournaments.find((tournament) => tournament.id === tournamentId);
}

export function listTournamentRules(tournamentId: string): TournamentRule[] {
  return tournamentRules.filter((rule) => rule.tournamentId === tournamentId);
}

export function describeTournamentRules(tournamentId: string): string {
  const playerCounts = new Set(
    listTournamentRules(tournamentId).map((rule) => rule.playerCount),
  );
  const labels: string[] = [];
  if (playerCounts.has(4)) {
    labels.push("四麻");
  }
  if (playerCounts.has(3)) {
    labels.push("三麻");
  }
  return labels.join("・");
}

export function countMatches(tournamentId: string): number {
  return matches.filter((match) => match.tournamentId === tournamentId).length;
}

export function listTournamentParticipants(
  tournamentId: string,
): TournamentParticipant[] {
  return tournamentParticipants.filter(
    (participant) => participant.tournamentId === tournamentId,
  );
}

export function participantDisplayName(
  participant: TournamentParticipant,
): string {
  if (participant.guestDisplayName) {
    return participant.guestDisplayName;
  }
  const profile = profiles.find((item) => item.id === participant.userId);
  return profile?.displayName ?? "不明";
}

export function participantAvatarUrl(
  participant: TournamentParticipant,
): string | null {
  if (participant.guestDisplayName || !participant.userId) {
    return null;
  }
  const profile = profiles.find((item) => item.id === participant.userId);
  return profile?.avatarUrl ?? null;
}

export function formatHeldOn(heldOn: string): string {
  const [year, month, day] = heldOn.split("-");
  return `${Number(year)}年${Number(month)}月${Number(day)}日`;
}

export function formatPoints(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}`;
}

export function listMatches(tournamentId: string): MatchListItem[] {
  const nameById = new Map(
    listTournamentParticipants(tournamentId).map((participant) => [
      participant.id,
      participantDisplayName(participant),
    ]),
  );

  return matches
    .filter((match) => match.tournamentId === tournamentId)
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    .map((match, index) => ({
      id: match.id,
      number: index + 1,
      results: matchResults
        .filter((result) => result.matchId === match.id)
        .slice()
        .sort((a, b) => a.rank - b.rank)
        .map((result) => ({
          participantId: result.tournamentParticipantId,
          name: nameById.get(result.tournamentParticipantId) ?? "不明",
          rank: result.rank,
          points: result.points,
        })),
    }))
    .sort((a, b) => b.number - a.number);
}

function adjustmentAmounts(
  participantId: string,
): [number, number, number, number, number] {
  const row = tournamentPointAdjustments.find(
    (item) => item.tournamentParticipantId === participantId,
  );
  if (!row) {
    return [0, 0, 0, 0, 0];
  }
  return [
    row.adjustmentPoints1,
    row.adjustmentPoints2,
    row.adjustmentPoints3,
    row.adjustmentPoints4,
    row.adjustmentPoints5,
  ];
}

function adjustmentLines(
  tournament: Tournament,
  participantId: string,
): AdjustmentLine[] {
  const titles = [
    tournament.adjustmentPoints1Title,
    tournament.adjustmentPoints2Title,
    tournament.adjustmentPoints3Title,
    tournament.adjustmentPoints4Title,
    tournament.adjustmentPoints5Title,
  ];
  const amounts = adjustmentAmounts(participantId);
  return titles.flatMap((title, index) => {
    if (title.trim() === "") {
      return [];
    }
    return [{ title, amount: amounts[index] ?? 0 }];
  });
}

function assignRanks(finalPoints: number[]): number[] {
  const ranks: number[] = [];
  for (let index = 0; index < finalPoints.length; index += 1) {
    if (index > 0 && finalPoints[index] === finalPoints[index - 1]) {
      ranks.push(ranks[index - 1] ?? index);
    } else {
      ranks.push(index + 1);
    }
  }
  return ranks;
}

export function getTournamentSummary(tournamentId: string): {
  ranked: RankingRow[];
  unplayed: UnplayedRow[];
} {
  const tournament = getTournament(tournamentId);
  if (!tournament) {
    return { ranked: [], unplayed: [] };
  }

  const participants = listTournamentParticipants(tournamentId);
  const tournamentMatchIds = new Set(
    matches
      .filter((match) => match.tournamentId === tournamentId)
      .map((match) => match.id),
  );

  const played: RankingRow[] = [];
  const unplayed: UnplayedRow[] = [];

  for (const participant of participants) {
    const name = participantDisplayName(participant);
    const avatarUrl = participantAvatarUrl(participant);
    const adjustments = adjustmentLines(tournament, participant.id);
    const adjustmentTotal = adjustments.reduce(
      (sum, line) => sum + line.amount,
      0,
    );
    const matchPoints = matchResults
      .filter(
        (result) =>
          result.tournamentParticipantId === participant.id &&
          tournamentMatchIds.has(result.matchId),
      )
      .reduce((sum, result) => sum + result.points, 0);
    const playedCount = matchResults.filter(
      (result) =>
        result.tournamentParticipantId === participant.id &&
        tournamentMatchIds.has(result.matchId),
    ).length;

    if (playedCount === 0) {
      unplayed.push({
        participantId: participant.id,
        userId: participant.userId,
        name,
        avatarUrl,
        adjustments,
        adjustmentTotal,
      });
      continue;
    }

    played.push({
      participantId: participant.id,
      userId: participant.userId,
      name,
      avatarUrl,
      rank: 0,
      matchPoints,
      adjustments,
      adjustmentTotal,
      finalPoints: matchPoints + adjustmentTotal,
    });
  }

  played.sort((a, b) => b.finalPoints - a.finalPoints);
  const ranks = assignRanks(played.map((row) => row.finalPoints));
  const ranked = played.map((row, index) => ({
    ...row,
    rank: ranks[index] ?? index + 1,
  }));

  return { ranked, unplayed };
}

export type PointCorrectionParticipant = {
  id: string;
  name: string;
  matchPoints: number;
  played: boolean;
};

export type PointCorrectionRow = {
  title: string;
  amounts: number[];
};

export function getPointCorrectionData(tournamentId: string): {
  participants: PointCorrectionParticipant[];
  initialRows: PointCorrectionRow[];
} {
  const tournament = getTournament(tournamentId);
  if (!tournament) {
    return { participants: [], initialRows: [] };
  }

  const { ranked } = getTournamentSummary(tournamentId);
  const matchPointsById = new Map<string, number>();
  const playedIds = new Set<string>();
  for (const row of ranked) {
    matchPointsById.set(row.participantId, row.matchPoints);
    playedIds.add(row.participantId);
  }

  const participants = listTournamentParticipants(tournamentId).map(
    (participant) => ({
      id: participant.id,
      name: participantDisplayName(participant),
      matchPoints: matchPointsById.get(participant.id) ?? 0,
      played: playedIds.has(participant.id),
    }),
  );

  const titles = [
    tournament.adjustmentPoints1Title,
    tournament.adjustmentPoints2Title,
    tournament.adjustmentPoints3Title,
  ];

  return {
    participants,
    initialRows: titles.map((title, index) => ({
      title,
      amounts: participants.map(
        (participant) => adjustmentAmounts(participant.id)[index] ?? 0,
      ),
    })),
  };
}

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
  rules: TournamentRule[];
  selectedRuleId: string;
  participants: MatchFormParticipant[];
  players: MatchFormPlayer[];
  manualTitles: [string, string, string];
  comment: string;
};

function tournamentParticipantsForForm(
  tournamentId: string,
): MatchFormParticipant[] {
  return listTournamentParticipants(tournamentId).map((participant) => ({
    id: participant.id,
    name: participantDisplayName(participant),
  }));
}

export function getMatch(matchId: string): Match | undefined {
  return matches.find((match) => match.id === matchId);
}

const SEAT_ORDER: Seat[] = ["east", "south", "west", "north"];

export type MatchDetailResult = {
  participantId: string;
  name: string;
  seat: Seat;
  rank: number;
  score: number;
  points: number;
};

export type MatchDetailData = {
  id: string;
  number: number;
  tournamentId: string;
  tournamentName: string;
  ruleName: string;
  playerCount: 3 | 4;
  comment: string;
  results: MatchDetailResult[];
};

export function getMatchDetail(matchId: string): MatchDetailData | undefined {
  const match = getMatch(matchId);
  if (!match) {
    return undefined;
  }
  const tournament = getTournament(match.tournamentId);
  if (!tournament) {
    return undefined;
  }
  const rule = listTournamentRules(match.tournamentId).find(
    (item) => item.id === match.tournamentRuleId,
  );
  const listed = listMatches(match.tournamentId).find(
    (item) => item.id === matchId,
  );
  const nameById = new Map(
    listTournamentParticipants(match.tournamentId).map((participant) => [
      participant.id,
      participantDisplayName(participant),
    ]),
  );

  return {
    id: match.id,
    number: listed?.number ?? 0,
    tournamentId: match.tournamentId,
    tournamentName: tournament.name,
    ruleName: rule?.name ?? "",
    playerCount: rule?.playerCount ?? 4,
    comment: match.comment,
    results: matchResults
      .filter((result) => result.matchId === matchId)
      .slice()
      .sort((a, b) => {
        if (a.rank !== b.rank) {
          return a.rank - b.rank;
        }
        return SEAT_ORDER.indexOf(a.seat) - SEAT_ORDER.indexOf(b.seat);
      })
      .map((result) => ({
        participantId: result.tournamentParticipantId,
        name: nameById.get(result.tournamentParticipantId) ?? "不明",
        seat: result.seat,
        rank: result.rank,
        score: result.score,
        points: result.points,
      })),
  };
}

export function getNewMatchFormData(
  tournamentId: string,
): MatchFormData | undefined {
  const tournament = getTournament(tournamentId);
  const rules = listTournamentRules(tournamentId);
  if (!tournament || rules.length === 0) {
    return undefined;
  }
  const rule = rules[0];
  if (!rule) {
    return undefined;
  }
  const participants = tournamentParticipantsForForm(tournamentId);
  return {
    matchId: null,
    tournamentId,
    tournamentName: tournament.name,
    rules,
    selectedRuleId: rule.id,
    participants,
    players: [],
    manualTitles: ["", "", ""],
    comment: "",
  };
}

export function getMatchFormData(matchId: string): MatchFormData | undefined {
  const match = getMatch(matchId);
  if (!match) {
    return undefined;
  }
  const tournament = getTournament(match.tournamentId);
  const rules = listTournamentRules(match.tournamentId);
  if (!tournament) {
    return undefined;
  }
  const participants = tournamentParticipantsForForm(match.tournamentId);
  const nameById = new Map(
    participants.map((participant) => [participant.id, participant.name]),
  );
  const players = matchResults
    .filter((result) => result.matchId === matchId)
    .map((result) => ({
      participantId: result.tournamentParticipantId,
      name: nameById.get(result.tournamentParticipantId) ?? "不明",
      seat: result.seat,
      score: result.score,
      tobiPoints: result.tobiPoints,
      yakitoriPoints: result.yakitoriPoints,
      otherPoints: [
        result.otherPoints1,
        result.otherPoints2,
        result.otherPoints3,
        result.otherPoints4,
        result.otherPoints5,
      ] as [number, number, number, number, number],
      manualPoints: [
        result.manualPoints1,
        result.manualPoints2,
        result.manualPoints3,
      ] as [number, number, number],
      umaPoints: result.umaPoints,
      baseOverride: null,
      points: result.points,
      rank: result.rank,
    }));
  return {
    matchId,
    tournamentId: match.tournamentId,
    tournamentName: tournament.name,
    rules,
    selectedRuleId: match.tournamentRuleId,
    participants,
    players,
    manualTitles: ["", "", ""],
    comment: match.comment,
  };
}
