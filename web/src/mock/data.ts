import type {
  Community,
  CommunityMembership,
  CommunityInviteCode,
  CommunityRule,
  Match,
  MatchResult,
  Profile,
  Seat,
  Tournament,
  TournamentParticipant,
  TournamentPointAdjustment,
  TournamentRule,
} from "./types";

const yonmaBase = {
  playerCount: 4 as const,
  startingScore: 25000,
  returnScore: 30000,
  okaTieHandling: "kamicha" as const,
  umaEnabled: true,
  umaTieHandling: "kamicha" as const,
  umaPoints1: 30,
  umaPoints2: 10,
  tobiEnabled: true,
  yakitoriEnabled: false,
  otherPoints1Name: "祝儀",
  otherPoints2Name: "",
  otherPoints3Name: "",
  otherPoints4Name: "",
  otherPoints5Name: "",
  rate: 1,
  notes: "",
};

const sanmaBase = {
  playerCount: 3 as const,
  startingScore: 35000,
  returnScore: 40000,
  okaTieHandling: "kamicha" as const,
  umaEnabled: true,
  umaTieHandling: "kamicha" as const,
  umaPoints1: 20,
  umaPoints2: null,
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

export const profiles: Profile[] = [
  {
    id: "sato",
    displayName: "佐藤",
    comment:
      "金曜はだいたい参加します。\n東家が多いです。\nよろしくお願いします。",
    avatarUrl: "https://i.pravatar.cc/96?u=sato",
  },
  {
    id: "suzuki",
    displayName: "鈴木",
    comment: "",
    avatarUrl: "https://i.pravatar.cc/96?u=suzuki",
  },
  { id: "takahashi", displayName: "高橋", comment: "", avatarUrl: null },
  { id: "tanaka", displayName: "田中", comment: "", avatarUrl: null },
  { id: "ito", displayName: "伊藤", comment: "", avatarUrl: null },
];

export const communities: Community[] = [
  {
    id: "friday",
    name: "金曜麻雀",
    comment:
      "毎週金曜の夜に集まっています。\n場所はその都度決めます。\n初めての人も歓迎です。",
  },
];

export const communityMemberships: CommunityMembership[] = [
  { communityId: "friday", userId: "sato" },
  { communityId: "friday", userId: "suzuki" },
  { communityId: "friday", userId: "takahashi" },
  { communityId: "friday", userId: "tanaka" },
  { communityId: "friday", userId: "ito" },
];

export const currentUserId = "sato";

export const communityInviteCodes: CommunityInviteCode[] = [
  {
    communityId: "friday",
    code: "FRIDAY8X",
    expiresAt: "2026-08-23T23:59:59+09:00",
    createdBy: "sato",
  },
];

export const communityRules: CommunityRule[] = [
  {
    id: "friday-yonma",
    communityId: "friday",
    name: "四麻標準",
    ...yonmaBase,
  },
  {
    id: "friday-sanma",
    communityId: "friday",
    name: "三麻",
    ...sanmaBase,
  },
];

export const tournaments: Tournament[] = [
  {
    id: "t-20260808",
    communityId: "friday",
    heldOn: "2026-08-08",
    name: "第12回金曜麻雀",
    memo: "いつもの店。\n開始は19時ごろ。\n遅刻連絡はグループへ。",
    adjustmentPoints1Title: "チップ",
    adjustmentPoints2Title: "",
    adjustmentPoints3Title: "",
    adjustmentPoints4Title: "",
    adjustmentPoints5Title: "",
  },
  {
    id: "t-20260801",
    communityId: "friday",
    heldOn: "2026-08-01",
    name: "三麻も混ざる会",
    memo: "",
    adjustmentPoints1Title: "",
    adjustmentPoints2Title: "",
    adjustmentPoints3Title: "",
    adjustmentPoints4Title: "",
    adjustmentPoints5Title: "",
  },
  {
    id: "t-20260718",
    communityId: "friday",
    heldOn: "2026-07-18",
    name: "三麻ナイト",
    memo: "",
    adjustmentPoints1Title: "",
    adjustmentPoints2Title: "",
    adjustmentPoints3Title: "",
    adjustmentPoints4Title: "",
    adjustmentPoints5Title: "",
  },
];

export const tournamentRules: TournamentRule[] = [
  {
    id: "tr-20260808-yonma",
    tournamentId: "t-20260808",
    name: "四麻標準",
    ...yonmaBase,
  },
  {
    id: "tr-20260808-no-tobi",
    tournamentId: "t-20260808",
    name: "四麻・トビなし",
    ...yonmaBase,
    tobiEnabled: false,
  },
  {
    id: "tr-20260801-yonma",
    tournamentId: "t-20260801",
    name: "四麻標準",
    ...yonmaBase,
  },
  {
    id: "tr-20260801-sanma",
    tournamentId: "t-20260801",
    name: "三麻",
    ...sanmaBase,
  },
  {
    id: "tr-20260718-sanma",
    tournamentId: "t-20260718",
    name: "三麻",
    ...sanmaBase,
  },
];

export const tournamentParticipants: TournamentParticipant[] = [
  {
    id: "p-0808-sato",
    tournamentId: "t-20260808",
    userId: "sato",
    guestDisplayName: null,
  },
  {
    id: "p-0808-suzuki",
    tournamentId: "t-20260808",
    userId: "suzuki",
    guestDisplayName: null,
  },
  {
    id: "p-0808-takahashi",
    tournamentId: "t-20260808",
    userId: "takahashi",
    guestDisplayName: null,
  },
  {
    id: "p-0808-tanaka",
    tournamentId: "t-20260808",
    userId: "tanaka",
    guestDisplayName: null,
  },
  {
    id: "p-0808-ito",
    tournamentId: "t-20260808",
    userId: "ito",
    guestDisplayName: null,
  },
  {
    id: "p-0801-sato",
    tournamentId: "t-20260801",
    userId: "sato",
    guestDisplayName: null,
  },
  {
    id: "p-0801-suzuki",
    tournamentId: "t-20260801",
    userId: "suzuki",
    guestDisplayName: null,
  },
  {
    id: "p-0801-takahashi",
    tournamentId: "t-20260801",
    userId: "takahashi",
    guestDisplayName: null,
  },
  {
    id: "p-0801-ito",
    tournamentId: "t-20260801",
    userId: "ito",
    guestDisplayName: null,
  },
  {
    id: "p-0801-guest",
    tournamentId: "t-20260801",
    userId: null,
    guestDisplayName: "山本",
  },
  {
    id: "p-0718-sato",
    tournamentId: "t-20260718",
    userId: "sato",
    guestDisplayName: null,
  },
  {
    id: "p-0718-suzuki",
    tournamentId: "t-20260718",
    userId: "suzuki",
    guestDisplayName: null,
  },
  {
    id: "p-0718-tanaka",
    tournamentId: "t-20260718",
    userId: "tanaka",
    guestDisplayName: null,
  },
];

export const matches: Match[] = [
  {
    id: "m-0808-1",
    tournamentId: "t-20260808",
    tournamentRuleId: "tr-20260808-yonma",
    comment: "",
    createdAt: "2026-08-08T19:10:00+09:00",
  },
  {
    id: "m-0808-2",
    tournamentId: "t-20260808",
    tournamentRuleId: "tr-20260808-yonma",
    comment: "",
    createdAt: "2026-08-08T20:20:00+09:00",
  },
  {
    id: "m-0808-3",
    tournamentId: "t-20260808",
    tournamentRuleId: "tr-20260808-yonma",
    comment: "ラス親が飛んだ",
    createdAt: "2026-08-08T21:30:00+09:00",
  },
  {
    id: "m-0801-1",
    tournamentId: "t-20260801",
    tournamentRuleId: "tr-20260801-yonma",
    comment: "",
    createdAt: "2026-08-01T19:00:00+09:00",
  },
  {
    id: "m-0801-2",
    tournamentId: "t-20260801",
    tournamentRuleId: "tr-20260801-sanma",
    comment: "ゲストの山本さん初参加",
    createdAt: "2026-08-01T20:10:00+09:00",
  },
  {
    id: "m-0801-3",
    tournamentId: "t-20260801",
    tournamentRuleId: "tr-20260801-yonma",
    comment: "",
    createdAt: "2026-08-01T21:00:00+09:00",
  },
  {
    id: "m-0801-4",
    tournamentId: "t-20260801",
    tournamentRuleId: "tr-20260801-sanma",
    comment: "",
    createdAt: "2026-08-01T22:00:00+09:00",
  },
  {
    id: "m-0718-1",
    tournamentId: "t-20260718",
    tournamentRuleId: "tr-20260718-sanma",
    comment: "",
    createdAt: "2026-07-18T19:30:00+09:00",
  },
  {
    id: "m-0718-2",
    tournamentId: "t-20260718",
    tournamentRuleId: "tr-20260718-sanma",
    comment: "",
    createdAt: "2026-07-18T20:40:00+09:00",
  },
];

const emptyBreakdown = {
  basePoints: 0,
  umaPoints: 0,
  tobiPoints: 0,
  yakitoriPoints: 0,
  otherPoints1: 0,
  otherPoints2: 0,
  otherPoints3: 0,
  otherPoints4: 0,
  otherPoints5: 0,
  manualPoints1: 0,
  manualPoints2: 0,
  manualPoints3: 0,
};

function mr(
  id: string,
  matchId: string,
  tournamentParticipantId: string,
  seat: Seat,
  score: number,
  rank: number,
  points: number,
): MatchResult {
  return {
    id,
    matchId,
    tournamentParticipantId,
    seat,
    score,
    rank,
    points,
    ...emptyBreakdown,
  };
}

export const matchResults: MatchResult[] = [
  mr("mr-0808-1-sato", "m-0808-1", "p-0808-sato", "east", 38500, 1, 35.5),
  mr("mr-0808-1-suzuki", "m-0808-1", "p-0808-suzuki", "south", 30200, 2, 8.2),
  mr(
    "mr-0808-1-takahashi",
    "m-0808-1",
    "p-0808-takahashi",
    "west",
    22100,
    3,
    -15.9,
  ),
  mr("mr-0808-1-tanaka", "m-0808-1", "p-0808-tanaka", "north", 9200, 4, -27.8),
  mr("mr-0808-2-suzuki", "m-0808-2", "p-0808-suzuki", "east", 44800, 1, 48.0),
  mr("mr-0808-2-sato", "m-0808-2", "p-0808-sato", "south", 25100, 2, 12.0),
  mr(
    "mr-0808-2-takahashi",
    "m-0808-2",
    "p-0808-takahashi",
    "west",
    19000,
    3,
    -18.0,
  ),
  mr("mr-0808-2-tanaka", "m-0808-2", "p-0808-tanaka", "north", 11100, 4, -42.0),
  mr("mr-0808-3-sato", "m-0808-3", "p-0808-sato", "east", 41000, 1, 45.0),
  mr(
    "mr-0808-3-takahashi",
    "m-0808-3",
    "p-0808-takahashi",
    "south",
    28000,
    2,
    5.0,
  ),
  mr("mr-0808-3-suzuki", "m-0808-3", "p-0808-suzuki", "west", 24000, 3, -12.0),
  mr("mr-0808-3-tanaka", "m-0808-3", "p-0808-tanaka", "north", 7000, 4, -38.0),
  mr("mr-0801-1-sato", "m-0801-1", "p-0801-sato", "east", 42000, 1, 40.0),
  mr("mr-0801-1-suzuki", "m-0801-1", "p-0801-suzuki", "south", 31000, 2, 10.0),
  mr(
    "mr-0801-1-takahashi",
    "m-0801-1",
    "p-0801-takahashi",
    "west",
    18000,
    3,
    -15.0,
  ),
  mr("mr-0801-1-ito", "m-0801-1", "p-0801-ito", "north", 9000, 4, -35.0),
  mr("mr-0801-2-sato", "m-0801-2", "p-0801-sato", "east", 48000, 1, 25.0),
  mr("mr-0801-2-suzuki", "m-0801-2", "p-0801-suzuki", "south", 33000, 2, -5.0),
  mr("mr-0801-2-guest", "m-0801-2", "p-0801-guest", "west", 24000, 3, -20.0),
  mr("mr-0801-3-suzuki", "m-0801-3", "p-0801-suzuki", "east", 40000, 1, 30.0),
  mr(
    "mr-0801-3-takahashi",
    "m-0801-3",
    "p-0801-takahashi",
    "south",
    28000,
    2,
    5.0,
  ),
  mr("mr-0801-3-ito", "m-0801-3", "p-0801-ito", "west", 21000, 3, -10.0),
  mr("mr-0801-3-guest", "m-0801-3", "p-0801-guest", "north", 11000, 4, -25.0),
  mr("mr-0801-4-ito", "m-0801-4", "p-0801-ito", "east", 42000, 1, 12.0),
  mr("mr-0801-4-sato", "m-0801-4", "p-0801-sato", "south", 38000, 2, 8.0),
  mr(
    "mr-0801-4-takahashi",
    "m-0801-4",
    "p-0801-takahashi",
    "west",
    25000,
    3,
    -20.0,
  ),
  mr("mr-0718-1-sato", "m-0718-1", "p-0718-sato", "east", 48000, 1, 30.0),
  mr("mr-0718-1-suzuki", "m-0718-1", "p-0718-suzuki", "south", 32000, 2, -10.0),
  mr("mr-0718-1-tanaka", "m-0718-1", "p-0718-tanaka", "west", 25000, 3, -20.0),
  mr("mr-0718-2-sato", "m-0718-2", "p-0718-sato", "east", 41000, 1, 10.0),
  mr("mr-0718-2-tanaka", "m-0718-2", "p-0718-tanaka", "south", 36000, 2, 5.0),
  mr("mr-0718-2-suzuki", "m-0718-2", "p-0718-suzuki", "west", 28000, 3, -5.0),
];

export const tournamentPointAdjustments: TournamentPointAdjustment[] = [
  {
    id: "adj-0808-sato",
    tournamentParticipantId: "p-0808-sato",
    adjustmentPoints1: -10,
    adjustmentPoints2: 0,
    adjustmentPoints3: 0,
    adjustmentPoints4: 0,
    adjustmentPoints5: 0,
  },
  {
    id: "adj-0808-suzuki",
    tournamentParticipantId: "p-0808-suzuki",
    adjustmentPoints1: 0,
    adjustmentPoints2: 0,
    adjustmentPoints3: 0,
    adjustmentPoints4: 0,
    adjustmentPoints5: 0,
  },
  {
    id: "adj-0808-takahashi",
    tournamentParticipantId: "p-0808-takahashi",
    adjustmentPoints1: 4,
    adjustmentPoints2: 0,
    adjustmentPoints3: 0,
    adjustmentPoints4: 0,
    adjustmentPoints5: 0,
  },
  {
    id: "adj-0808-tanaka",
    tournamentParticipantId: "p-0808-tanaka",
    adjustmentPoints1: 3,
    adjustmentPoints2: 0,
    adjustmentPoints3: 0,
    adjustmentPoints4: 0,
    adjustmentPoints5: 0,
  },
  {
    id: "adj-0808-ito",
    tournamentParticipantId: "p-0808-ito",
    adjustmentPoints1: 3,
    adjustmentPoints2: 0,
    adjustmentPoints3: 0,
    adjustmentPoints4: 0,
    adjustmentPoints5: 0,
  },
];
