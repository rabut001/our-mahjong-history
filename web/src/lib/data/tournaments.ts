import { describePlayerCounts, summarizeTournament } from "@/lib/domain";
import { requireActiveProfile } from "@/lib/data/auth";
import { isUuid } from "@/lib/data/helpers";
import { toProfile } from "@/lib/data/mappers";

export type TournamentParticipantView = {
  id: string;
  userId: string | null;
  displayName: string;
  avatarUrl: string | null;
  guestDisplayName: string | null;
};

export type TournamentRuleView = {
  id: string;
  name: string;
  playerCount: 3 | 4;
  inUse: boolean;
};

export type TournamentMatchListItem = {
  id: string;
  createdAt: string;
  results: {
    participantId: string;
    name: string;
    rank: number;
    points: number;
  }[];
};

export type TournamentStandingView = {
  participantId: string;
  userId: string | null;
  name: string;
  avatarUrl: string | null;
  rank: number;
  finalPoints: number;
  matchPoints: number;
  adjustmentTotal: number;
};

export type TournamentDetail = {
  id: string;
  communityId: string;
  communityName: string;
  name: string;
  heldOn: string;
  memo: string;
  ruleLabel: string;
  ruleCount: number;
  participants: TournamentParticipantView[];
  rules: TournamentRuleView[];
  matches: TournamentMatchListItem[];
  ranked: TournamentStandingView[];
  unplayed: TournamentStandingView[];
  adjustmentTitles: string[];
};

function participantName(row: {
  guest_display_name: string | null;
  profiles:
    | { display_name: string; avatar_url: string | null }
    | { display_name: string; avatar_url: string | null }[]
    | null;
}) {
  if (row.guest_display_name) {
    return { name: row.guest_display_name, avatarUrl: null as string | null };
  }
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    name: profile?.display_name ?? "退会済みユーザ",
    avatarUrl: profile?.avatar_url ?? null,
  };
}

export async function getTournamentDetail(
  tournamentId: string,
): Promise<TournamentDetail | null> {
  if (!isUuid(tournamentId)) {
    return null;
  }
  const { supabase } = await requireActiveProfile();
  const { data: tournament, error } = await supabase
    .from("tournaments")
    .select(
      "id, community_id, name, held_on, memo, adjustment_points_1_title, adjustment_points_2_title, adjustment_points_3_title, adjustment_points_4_title, adjustment_points_5_title, communities(name)",
    )
    .eq("id", tournamentId)
    .maybeSingle();
  if (error) {
    throw new Error("大会を取得できませんでした。");
  }
  if (!tournament) {
    return null;
  }

  const communityName = Array.isArray(tournament.communities)
    ? (tournament.communities[0]?.name ?? "")
    : (tournament.communities?.name ?? "");

  const { data: ruleRows, error: ruleError } = await supabase
    .from("tournament_rules")
    .select("id, name, player_count")
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: true });
  if (ruleError) {
    throw new Error("ルールを取得できませんでした。");
  }

  const { data: usedRules, error: usedError } = await supabase
    .from("matches")
    .select("tournament_rule_id")
    .eq("tournament_id", tournamentId);
  if (usedError) {
    throw new Error("試合を取得できませんでした。");
  }
  const usedIds = new Set(
    (usedRules ?? []).map((row) => row.tournament_rule_id),
  );

  const rules: TournamentRuleView[] = (ruleRows ?? []).flatMap((row) => {
    if (row.player_count !== 3 && row.player_count !== 4) {
      return [];
    }
    return [
      {
        id: row.id,
        name: row.name,
        playerCount: row.player_count,
        inUse: usedIds.has(row.id),
      },
    ];
  });

  const { data: participantRows, error: participantError } = await supabase
    .from("tournament_participants")
    .select(
      "id, user_id, guest_display_name, profiles(display_name, avatar_url), tournament_point_adjustments(adjustment_points_1, adjustment_points_2, adjustment_points_3, adjustment_points_4, adjustment_points_5)",
    )
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: true });
  if (participantError) {
    throw new Error("参加者を取得できませんでした。");
  }

  const participants: TournamentParticipantView[] = (participantRows ?? []).map(
    (row) => {
      const identity = participantName(row);
      return {
        id: row.id,
        userId: row.user_id,
        displayName: identity.name,
        avatarUrl: identity.avatarUrl,
        guestDisplayName: row.guest_display_name,
      };
    },
  );

  const { data: matchRows, error: matchError } = await supabase
    .from("matches")
    .select(
      "id, created_at, match_results(rank, points, tournament_participant_id)",
    )
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: false });
  if (matchError) {
    throw new Error("試合を取得できませんでした。");
  }

  const nameByParticipant = new Map(
    participants.map((item) => [item.id, item.displayName]),
  );
  const matches: TournamentMatchListItem[] = (matchRows ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    results: (row.match_results ?? [])
      .slice()
      .sort((a, b) => a.rank - b.rank)
      .map((result) => ({
        participantId: result.tournament_participant_id,
        name: nameByParticipant.get(result.tournament_participant_id) ?? "",
        rank: result.rank,
        points: Number(result.points),
      })),
  }));

  const matchPointsByParticipant = new Map<string, number[]>();
  for (const match of matches) {
    for (const result of match.results) {
      const current = matchPointsByParticipant.get(result.participantId) ?? [];
      current.push(result.points);
      matchPointsByParticipant.set(result.participantId, current);
    }
  }

  const titles = [
    tournament.adjustment_points_1_title,
    tournament.adjustment_points_2_title,
    tournament.adjustment_points_3_title,
    tournament.adjustment_points_4_title,
    tournament.adjustment_points_5_title,
  ];
  const adjustmentTitles = titles.filter((title): title is string =>
    Boolean(title && title.trim()),
  );

  const summaryInput = participants.map((participant, index) => {
    const row = participantRows?.[index];
    const adj = Array.isArray(row?.tournament_point_adjustments)
      ? row.tournament_point_adjustments[0]
      : row?.tournament_point_adjustments;
    const amounts = adj
      ? [
          Number(adj.adjustment_points_1),
          Number(adj.adjustment_points_2),
          Number(adj.adjustment_points_3),
          Number(adj.adjustment_points_4),
          Number(adj.adjustment_points_5),
        ]
      : [0, 0, 0, 0, 0];
    const used = amounts.slice(0, Math.max(adjustmentTitles.length, 0));
    return {
      id: participant.id,
      matchPoints: matchPointsByParticipant.get(participant.id) ?? [],
      adjustments: used,
    };
  });
  const summary = summarizeTournament(summaryInput);
  const participantById = new Map(participants.map((item) => [item.id, item]));

  function toStanding(
    id: string,
    rank: number,
    matchPoints: number,
    adjustmentTotal: number,
    finalPoints: number,
  ): TournamentStandingView {
    const participant = participantById.get(id);
    return {
      participantId: id,
      userId: participant?.userId ?? null,
      name: participant?.displayName ?? "",
      avatarUrl: participant?.avatarUrl ?? null,
      rank,
      matchPoints,
      adjustmentTotal,
      finalPoints,
    };
  }

  return {
    id: tournament.id,
    communityId: tournament.community_id,
    communityName,
    name: tournament.name,
    heldOn: tournament.held_on,
    memo: tournament.memo ?? "",
    ruleLabel: describePlayerCounts(rules.map((rule) => rule.playerCount)),
    ruleCount: rules.length,
    participants,
    rules,
    matches,
    ranked: summary.ranked.map((row) =>
      toStanding(
        row.id,
        row.rank,
        row.matchPointTotal,
        row.adjustmentTotal,
        row.finalPoints,
      ),
    ),
    unplayed: summary.unplayed.map((row) =>
      toStanding(row.id, 0, 0, row.adjustmentTotal, row.adjustmentTotal),
    ),
    adjustmentTitles,
  };
}

export async function getCommunityMembersForTournament(communityId: string) {
  const { supabase, profile } = await requireActiveProfile();
  const { data, error } = await supabase
    .from("community_memberships")
    .select("user_id, profiles(id, display_name, avatar_url)")
    .eq("community_id", communityId);
  if (error) {
    throw new Error("メンバーを取得できませんでした。");
  }
  return (data ?? []).map((row) => {
    const memberProfile = Array.isArray(row.profiles)
      ? row.profiles[0]
      : row.profiles;
    return {
      userId: row.user_id,
      displayName: memberProfile
        ? toProfile({
            id: memberProfile.id,
            display_name: memberProfile.display_name,
            comment: null,
            avatar_url: memberProfile.avatar_url,
          }).displayName
        : row.user_id,
      isCurrentUser: row.user_id === profile.id,
    };
  });
}

export async function getPointCorrectionData(tournamentId: string): Promise<{
  tournamentName: string;
  participants: { id: string; name: string; matchPoints: number }[];
  initialRows: { title: string; amounts: number[] }[];
} | null> {
  const tournament = await getTournamentDetail(tournamentId);
  if (!tournament) {
    return null;
  }

  const { supabase } = await requireActiveProfile();
  const { data, error } = await supabase
    .from("tournaments")
    .select(
      "name, adjustment_points_1_title, adjustment_points_2_title, adjustment_points_3_title, adjustment_points_4_title, adjustment_points_5_title",
    )
    .eq("id", tournamentId)
    .maybeSingle();
  if (error || !data) {
    return null;
  }

  const { data: participantRows, error: participantError } = await supabase
    .from("tournament_participants")
    .select(
      "id, guest_display_name, profiles(display_name, avatar_url), tournament_point_adjustments(adjustment_points_1, adjustment_points_2, adjustment_points_3, adjustment_points_4, adjustment_points_5)",
    )
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: true });
  if (participantError) {
    throw new Error("参加者を取得できませんでした。");
  }

  const matchPointsById = new Map<string, number>();
  for (const row of [...tournament.ranked, ...tournament.unplayed]) {
    matchPointsById.set(row.participantId, row.matchPoints);
  }

  const participants = (participantRows ?? []).map((row) => {
    const identity = participantName(row);
    return {
      id: row.id,
      name: identity.name,
      matchPoints: matchPointsById.get(row.id) ?? 0,
    };
  });

  const titles = [
    data.adjustment_points_1_title ?? "",
    data.adjustment_points_2_title ?? "",
    data.adjustment_points_3_title ?? "",
    data.adjustment_points_4_title ?? "",
    data.adjustment_points_5_title ?? "",
  ];

  const initialRows = titles.map((title, columnIndex) => ({
    title,
    amounts: (participantRows ?? []).map((row) => {
      const adj = Array.isArray(row.tournament_point_adjustments)
        ? row.tournament_point_adjustments[0]
        : row.tournament_point_adjustments;
      if (!adj) {
        return 0;
      }
      const values = [
        Number(adj.adjustment_points_1),
        Number(adj.adjustment_points_2),
        Number(adj.adjustment_points_3),
        Number(adj.adjustment_points_4),
        Number(adj.adjustment_points_5),
      ];
      return values[columnIndex] ?? 0;
    }),
  }));

  return {
    tournamentName: data.name,
    participants,
    initialRows,
  };
}
