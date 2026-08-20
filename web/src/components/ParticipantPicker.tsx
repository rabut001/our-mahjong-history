"use client";

import { startTransition, useActionState, useState } from "react";
import { NavButton } from "@/components/NavButton";
import {
  compactButtonClass,
  rowTitleClass,
  SectionCard,
} from "@/components/ui";
import type { FormState } from "@/lib/data/types";
import { tournamentCreateDraftQuery } from "@/lib/tournament-create-query";

export type CommunityMember = {
  userId: string;
  displayName: string;
  participantId?: string;
};

type GuestRow = {
  displayName: string;
  participantId?: string;
};

type ParticipantPickerProps = {
  members: CommunityMember[];
  initialSelectedUserIds: string[];
  initialGuests: GuestRow[];
  addParticipantHref?: string;
  addGuestHref?: string;
  draftReturnPath?: string;
  removeAction?: (prev: FormState, formData: FormData) => Promise<FormState>;
  tournamentId?: string;
  draftFields?: {
    heldOn: string;
    name: string;
    memo: string;
  };
  onDraftPeopleChange?: (people: {
    userIds: string[];
    guestNames: string[];
  }) => void;
};

export function ParticipantPicker({
  members,
  initialSelectedUserIds,
  initialGuests,
  addParticipantHref,
  addGuestHref,
  draftReturnPath,
  draftFields,
  removeAction,
  tournamentId,
  onDraftPeopleChange,
}: ParticipantPickerProps) {
  const [selectedIds, setSelectedIds] = useState(initialSelectedUserIds);
  const [guests, setGuests] = useState(initialGuests);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    removeAction ?? (async () => ({})),
    {},
  );

  function notify(nextIds: string[], nextGuests: GuestRow[]) {
    onDraftPeopleChange?.({
      userIds: nextIds,
      guestNames: nextGuests.map((guest) => guest.displayName).filter(Boolean),
    });
  }

  const selectedMembers = members.filter((member) =>
    selectedIds.includes(member.userId),
  );
  const availableCount = members.length - selectedIds.length;
  const draftQuery = draftReturnPath
    ? tournamentCreateDraftQuery({
        heldOn: draftFields?.heldOn ?? "",
        name: draftFields?.name ?? "",
        memo: draftFields?.memo ?? "",
        userIds: selectedIds,
        guestNames: guests.map((guest) => guest.displayName).filter(Boolean),
      })
    : "";
  const participantAddHref = draftReturnPath
    ? `${draftReturnPath}/participants${draftQuery}`
    : addParticipantHref;
  const guestAddHref = draftReturnPath
    ? `${draftReturnPath}/guests${draftQuery}`
    : addGuestHref;

  function removeMember(userId: string) {
    const next = selectedIds.filter((id) => id !== userId);
    setSelectedIds(next);
    notify(next, guests);
  }

  function removeGuest(participantId: string | undefined, index: number) {
    const next = participantId
      ? guests.filter((guest) => guest.participantId !== participantId)
      : guests.filter((_, guestIndex) => guestIndex !== index);
    setGuests(next);
    notify(selectedIds, next);
  }

  function persistRemove(participantId: string | undefined) {
    if (!removeAction || !tournamentId || !participantId) {
      return;
    }
    startTransition(() => {
      const formData = new FormData();
      formData.set("tournamentId", tournamentId);
      formData.set("participantId", participantId);
      formAction(formData);
    });
  }

  return (
    <>
      <div>
        <SectionCard
          title="参加者"
          action={
            participantAddHref && availableCount > 0 ? (
              <NavButton href={participantAddHref}>追加</NavButton>
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
                  {draftReturnPath ? (
                    <input type="hidden" name="userId" value={member.userId} />
                  ) : null}
                  <span className={`min-w-0 truncate ${rowTitleClass}`}>
                    {member.displayName}
                  </span>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      removeMember(member.userId);
                      persistRemove(member.participantId);
                    }}
                    className="shrink-0 text-sm text-muted disabled:text-line"
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
            guestAddHref ? (
              <NavButton href={guestAddHref}>追加</NavButton>
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
                  key={guest.participantId ?? `guest-${index}`}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  {draftReturnPath && guest.displayName ? (
                    <input
                      type="hidden"
                      name="guestName"
                      value={guest.displayName}
                    />
                  ) : null}
                  <span className={`min-w-0 truncate ${rowTitleClass}`}>
                    {guest.displayName || "（未入力）"}
                  </span>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      removeGuest(guest.participantId, index);
                      persistRemove(guest.participantId);
                    }}
                    className="shrink-0 text-sm text-muted disabled:text-line"
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
      {state.formError ? (
        <p className="text-sm text-muted">{state.formError}</p>
      ) : null}
    </>
  );
}
