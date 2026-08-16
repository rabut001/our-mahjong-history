"use client";

import { useMemo, useState } from "react";

const SEARCH_THRESHOLD = 8;

const fieldClass =
  "w-full border border-neutral-400 bg-white px-3 py-2 text-base";

export type CommunityMember = {
  userId: string;
  displayName: string;
};

type ParticipantPickerProps = {
  members: CommunityMember[];
  initialSelectedUserIds: string[];
  initialGuests: string[];
  startWithAdderOpen?: boolean;
};

export function ParticipantPicker({
  members,
  initialSelectedUserIds,
  initialGuests,
  startWithAdderOpen = false,
}: ParticipantPickerProps) {
  const [selectedIds, setSelectedIds] = useState(initialSelectedUserIds);
  const [guests, setGuests] = useState(initialGuests);
  const [addingMembers, setAddingMembers] = useState(startWithAdderOpen);
  const [query, setQuery] = useState("");

  const selectedMembers = members.filter((member) =>
    selectedIds.includes(member.userId),
  );
  const availableMembers = members.filter(
    (member) => !selectedIds.includes(member.userId),
  );
  const filteredAvailable = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return availableMembers;
    }
    return availableMembers.filter((member) =>
      member.displayName.includes(trimmed),
    );
  }, [availableMembers, query]);

  const showSearch = availableMembers.length >= SEARCH_THRESHOLD;

  function addMember(userId: string) {
    setSelectedIds((current) => [...current, userId]);
    setQuery("");
  }

  function removeMember(userId: string) {
    setSelectedIds((current) => current.filter((id) => id !== userId));
  }

  return (
    <fieldset>
      <legend className="text-sm">参加者</legend>
      <p className="mt-1 text-sm text-neutral-600">
        この大会に出る人だけを追加します。
      </p>
      <ul className="mt-2 divide-y divide-neutral-200 border-y border-neutral-200">
        {selectedMembers.map((member) => (
          <li
            key={member.userId}
            className="flex items-center justify-between gap-3 py-2"
          >
            <span>{member.displayName}</span>
            <button
              type="button"
              onClick={() => removeMember(member.userId)}
              className="shrink-0 text-sm text-neutral-600"
            >
              外す
            </button>
          </li>
        ))}
        {guests.map((guest, index) => (
          <li key={`guest-${index}`} className="flex items-center gap-2 py-2">
            <input
              type="text"
              name="guests"
              value={guest}
              placeholder="ゲスト名"
              onChange={(event) => {
                const next = guests.slice();
                next[index] = event.target.value;
                setGuests(next);
              }}
              className={fieldClass}
            />
            <button
              type="button"
              onClick={() =>
                setGuests((current) =>
                  current.filter((_, guestIndex) => guestIndex !== index),
                )
              }
              className="shrink-0 text-sm text-neutral-600"
            >
              外す
            </button>
          </li>
        ))}
      </ul>
      {selectedMembers.length === 0 && guests.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-600">まだ追加していません。</p>
      ) : null}

      {addingMembers && availableMembers.length > 0 ? (
        <div className="mt-3 border border-neutral-300 p-3">
          <p className="text-sm">メンバーを追加</p>
          {showSearch ? (
            <input
              type="search"
              value={query}
              placeholder="名前で探す"
              onChange={(event) => setQuery(event.target.value)}
              className={`mt-2 ${fieldClass}`}
            />
          ) : null}
          <ul className="mt-2 max-h-48 overflow-y-auto">
            {filteredAvailable.map((member) => (
              <li key={member.userId}>
                <button
                  type="button"
                  onClick={() => addMember(member.userId)}
                  className="flex w-full items-center justify-between py-2 text-left text-base"
                >
                  <span>{member.displayName}</span>
                  <span className="text-sm text-neutral-600">追加</span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              setAddingMembers(false);
              setQuery("");
            }}
            className="mt-2 text-sm text-neutral-600"
          >
            閉じる
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={availableMembers.length === 0}
          onClick={() => setAddingMembers(true)}
          className="mt-3 w-full border border-neutral-400 px-4 py-2 text-sm disabled:text-neutral-400"
        >
          メンバーを追加
        </button>
      )}
      <button
        type="button"
        onClick={() => setGuests((current) => [...current, ""])}
        className="mt-2 w-full border border-neutral-400 px-4 py-2 text-sm"
      >
        ゲストを追加
      </button>
    </fieldset>
  );
}
