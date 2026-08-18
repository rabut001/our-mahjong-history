import { isUuid } from "@/lib/data/helpers";

export type TournamentCreateDraft = {
  heldOn: string;
  name: string;
  memo: string;
  userIds: string[];
  guestNames: string[];
};

export type TournamentCreateDraftParams = {
  d?: string | string[];
  n?: string | string[];
  m?: string | string[];
  u?: string | string[];
  g?: string | string[];
  from?: string | string[];
};

function asList(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function first(value: string | string[] | undefined): string {
  if (!value) {
    return "";
  }
  return Array.isArray(value) ? (value[0] ?? "") : value;
}

export function parseTournamentCreateDraft(
  searchParams: TournamentCreateDraftParams,
): TournamentCreateDraft {
  const userIds = [
    ...new Set(asList(searchParams.u).filter((id) => isUuid(id))),
  ];
  const guestNames = asList(searchParams.g)
    .map((name) => name.trim())
    .filter((name) => name !== "");
  return {
    heldOn: first(searchParams.d),
    name: first(searchParams.n),
    memo: first(searchParams.m),
    userIds,
    guestNames,
  };
}

export function tournamentCreateDraftQuery(
  draft: TournamentCreateDraft,
): string {
  const params = new URLSearchParams();
  if (draft.heldOn) {
    params.set("d", draft.heldOn);
  }
  if (draft.name) {
    params.set("n", draft.name);
  }
  if (draft.memo) {
    params.set("m", draft.memo);
  }
  for (const id of draft.userIds) {
    params.append("u", id);
  }
  for (const name of draft.guestNames) {
    params.append("g", name);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
