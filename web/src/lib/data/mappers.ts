import type { HomeProfile } from "@/lib/data/types";

export function toProfile(row: {
  id: string;
  display_name: string;
  comment: string | null;
  avatar_url: string | null;
}): HomeProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    comment: row.comment ?? "",
    avatarUrl: row.avatar_url,
  };
}
