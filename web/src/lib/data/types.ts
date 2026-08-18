export type HomeProfile = {
  id: string;
  displayName: string;
  comment: string;
  avatarUrl: string | null;
};

export type HomeCommunity = {
  id: string;
  name: string;
  memberCount: number;
};

export type HomePageData = {
  profile: HomeProfile | null;
  communities: HomeCommunity[];
};

export type CommunityMember = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  isCurrentUser: boolean;
};

export type CommunityRuleListItem = {
  id: string;
  name: string;
  playerCount: 3 | 4;
};

export type CommunityTournamentListItem = {
  id: string;
  name: string;
  heldOn: string;
  ruleLabel: string;
  matchCount: number;
};

export type CommunityDetail = {
  id: string;
  name: string;
  comment: string;
  memberCount: number;
  members: CommunityMember[];
  rules: CommunityRuleListItem[];
  tournaments: CommunityTournamentListItem[];
};

export type CommunityInvite = {
  code: string;
  expiresAt: string;
};

export type ProfileDetail = HomeProfile & {
  isCurrentUser: boolean;
};

export type FormState = {
  fieldErrors?: {
    name?: string;
    displayName?: string;
    comment?: string;
    code?: string;
    heldOn?: string;
    startingScore?: string;
    returnScore?: string;
    umaPoints1?: string;
    umaPoints2?: string;
    rate?: string;
  };
  formError?: string;
};
