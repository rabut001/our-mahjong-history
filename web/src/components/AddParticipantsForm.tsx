"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { blockButtonClass, searchFieldClass } from "@/components/ui";
import type { FormState } from "@/lib/data/types";
import { tournamentCreateDraftQuery } from "@/lib/tournament-create-query";

const SEARCH_THRESHOLD = 8;

type Member = {
  userId: string;
  displayName: string;
};

type AddParticipantsFormProps = {
  members: Member[];
  tournamentId?: string;
  action?: (prev: FormState, formData: FormData) => Promise<FormState>;
  draft?: {
    returnPath: string;
    heldOn: string;
    name: string;
    memo: string;
    userIds: string[];
    guestNames: string[];
  };
};

export function AddParticipantsForm({
  members,
  tournamentId,
  action,
  draft,
}: AddParticipantsFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action ?? (async () => ({})),
    {},
  );
  const showSearch = members.length >= SEARCH_THRESHOLD;
  const filtered = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return members;
    }
    return members.filter((member) => member.displayName.includes(trimmed));
  }, [members, query]);
  const selectedSet = new Set(selectedIds);
  const canSubmit = selectedIds.length > 0;

  function toggle(userId: string) {
    setSelectedIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  }

  if (members.length === 0) {
    return <p className="text-sm text-muted">全員すでに参加しています。</p>;
  }

  return (
    <form
      action={action ? formAction : undefined}
      onSubmit={
        draft
          ? (event) => {
              event.preventDefault();
              if (selectedIds.length === 0) {
                return;
              }
              router.push(
                `${draft.returnPath}${tournamentCreateDraftQuery({
                  heldOn: draft.heldOn,
                  name: draft.name,
                  memo: draft.memo,
                  userIds: [...draft.userIds, ...selectedIds],
                  guestNames: draft.guestNames,
                })}`,
              );
            }
          : undefined
      }
    >
      {tournamentId ? (
        <input type="hidden" name="tournamentId" value={tournamentId} />
      ) : null}
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="userId" value={id} />
      ))}
      {showSearch ? (
        <input
          type="search"
          value={query}
          placeholder="名前で探す"
          onChange={(event) => setQuery(event.target.value)}
          className={searchFieldClass}
        />
      ) : null}
      {filtered.length > 0 ? (
        <ul
          className={`divide-y divide-line border-y border-line${showSearch ? " mt-4" : ""}`}
        >
          {filtered.map((member) => (
            <li key={member.userId}>
              <label className="flex items-center gap-3 py-3">
                <input
                  type="checkbox"
                  checked={selectedSet.has(member.userId)}
                  onChange={() => toggle(member.userId)}
                />
                <span className="min-w-0 truncate font-medium">
                  {member.displayName}
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted">該当する人がいません。</p>
      )}
      {state.formError ? (
        <p className="mt-4 text-sm text-muted">{state.formError}</p>
      ) : null}
      <div className="mt-6">
        <button
          type="submit"
          disabled={!canSubmit || pending}
          className={`${blockButtonClass} disabled:opacity-60`}
        >
          追加する
        </button>
      </div>
    </form>
  );
}
