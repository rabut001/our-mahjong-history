"use client";

import { useState } from "react";
import { NavButton } from "@/components/NavButton";
import {
  compactButtonClass,
  rowTitleClass,
  SectionCard,
} from "@/components/ui";

export type CommunityMember = {
  userId: string;
  displayName: string;
};

type ParticipantPickerProps = {
  members: CommunityMember[];
  initialSelectedUserIds: string[];
  initialGuests: string[];
  addParticipantHref?: string;
  addGuestHref?: string;
};

export function ParticipantPicker({
  members,
  initialSelectedUserIds,
  initialGuests,
  addParticipantHref,
  addGuestHref,
}: ParticipantPickerProps) {
  const [selectedIds, setSelectedIds] = useState(initialSelectedUserIds);
  const [guests, setGuests] = useState(initialGuests);

  const selectedMembers = members.filter((member) =>
    selectedIds.includes(member.userId),
  );
  const availableCount = members.length - selectedIds.length;

  function removeMember(userId: string) {
    setSelectedIds((current) => current.filter((id) => id !== userId));
  }

  return (
    <>
      <div>
        <SectionCard
          title="参加者"
          action={
            addParticipantHref && availableCount > 0 ? (
              <NavButton href={addParticipantHref}>追加</NavButton>
            ) : (
              <button type="button" disabled className={compactButtonClass}>
                追加
              </button>
            )
          }
        >
          {selectedMembers.length > 0 ? (
            <ul className="divide-y divide-line border-t border-line">
              {selectedMembers.map((member) => (
                <li
                  key={member.userId}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <span className={`min-w-0 truncate ${rowTitleClass}`}>
                    {member.displayName}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMember(member.userId)}
                    className="shrink-0 text-sm text-muted"
                  >
                    外す
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </SectionCard>
        <p className="mt-3 px-1 text-sm text-muted">
          麻雀グループのメンバーから、参加者を追加します。
        </p>
      </div>

      <div>
        <SectionCard
          title="ゲスト参加者"
          action={
            addGuestHref ? (
              <NavButton href={addGuestHref}>追加</NavButton>
            ) : (
              <button type="button" disabled className={compactButtonClass}>
                追加
              </button>
            )
          }
        >
          {guests.length > 0 ? (
            <ul className="divide-y divide-line border-t border-line">
              {guests.map((guest, index) => (
                <li
                  key={`guest-${index}`}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <span className={`min-w-0 truncate ${rowTitleClass}`}>
                    {guest || "（未入力）"}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setGuests((current) =>
                        current.filter((_, guestIndex) => guestIndex !== index),
                      )
                    }
                    className="shrink-0 text-sm text-muted"
                  >
                    外す
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </SectionCard>
        <p className="mt-3 px-1 text-sm text-muted">
          アカウントを持っていない人を、名前だけで追加します。
        </p>
      </div>
    </>
  );
}
