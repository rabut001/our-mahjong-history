"use client";

import { useMemo, useState } from "react";
import { NavButton } from "@/components/NavButton";
import { blockButtonClass, searchFieldClass } from "@/components/ui";

const SEARCH_THRESHOLD = 8;

type Member = {
  userId: string;
  displayName: string;
};

type AddParticipantsFormProps = {
  members: Member[];
  backHref: string;
};

export function AddParticipantsForm({
  members,
  backHref,
}: AddParticipantsFormProps) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
    <div>
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
      <div className="mt-6">
        {canSubmit ? (
          <NavButton href={backHref} variant="block">
            追加する
          </NavButton>
        ) : (
          <button type="button" disabled className={blockButtonClass}>
            追加する
          </button>
        )}
      </div>
    </div>
  );
}
