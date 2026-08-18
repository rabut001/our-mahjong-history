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
