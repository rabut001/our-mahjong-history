"use client";

import { useActionState, useState } from "react";
import { NavButton } from "@/components/NavButton";
import { ParticipantPicker } from "@/components/ParticipantPicker";
import {
  blockButtonClass,
  compactButtonClass,
  Field,
  fieldClass,
  RowLink,
  rowTitleClass,
  SectionCard,
  textareaClass,
  TEXTAREA_ROWS,
} from "@/components/ui";
import type { FormState } from "@/lib/data/types";
import { tournamentCreateDraftQuery } from "@/lib/tournament-create-query";

export type TournamentFormRule = {
  id: string;
  name: string;
  detailHref?: string;
  inUse: boolean;
};

export type TournamentFormValues = {
  heldOn: string;
  name: string;
  memo: string;
  members: {
    userId: string;
    displayName: string;
    selected: boolean;
    participantId?: string;
  }[];
  guests: { displayName: string; participantId?: string }[];
  rules: TournamentFormRule[];
  addRuleHref?: string;
  addParticipantHref?: string;
  addGuestHref?: string;
  draftReturnPath?: string;
};

type TournamentFormProps = {
  mode: "create" | "edit";
  values: TournamentFormValues;
  action?: (prev: FormState, formData: FormData) => Promise<FormState>;
  hiddenFields?: Record<string, string>;
  removeParticipantAction?: (
    prev: FormState,
    formData: FormData,
  ) => Promise<FormState>;
  tournamentId?: string;
};

function toDisplayDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) {
    return iso;
  }
  return `${year}/${month}/${day}`;
}

function HeldOnInput({
  value,
  onChange,
}: {
  value: string;
  onChange?: (value: string) => void;
}) {
  const [iso, setIso] = useState(value);
  const current = onChange ? value : iso;
  return (
    <div className="relative mt-1">
      <input
        type="text"
        readOnly
        tabIndex={-1}
        value={toDisplayDate(current)}
        className={`${fieldClass} pointer-events-none mt-0`}
      />
      <input
        type="date"
        name="heldOn"
        value={current}
        lang="ja"
        aria-label="開催日"
        onChange={(event) => {
          if (onChange) {
            onChange(event.target.value);
          } else {
            setIso(event.target.value);
          }
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </div>
  );
}

export function TournamentForm({
  mode,
  values,
  action,
  hiddenFields,
  removeParticipantAction,
  tournamentId,
}: TournamentFormProps) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action ?? (async () => ({})),
    {},
  );
  const [heldOn, setHeldOn] = useState(values.heldOn);
  const [name, setName] = useState(values.name);
  const [memo, setMemo] = useState(values.memo);
  const [draftPeople, setDraftPeople] = useState({
    userIds: values.members
      .filter((member) => member.selected)
      .map((member) => member.userId),
    guestNames: values.guests.map((guest) => guest.displayName).filter(Boolean),
  });
  const keepDraft = Boolean(values.draftReturnPath);
  const addRuleHref = values.draftReturnPath
    ? `${values.draftReturnPath}/rules${tournamentCreateDraftQuery({
        heldOn,
        name,
        memo,
        userIds: draftPeople.userIds,
        guestNames: draftPeople.guestNames,
      })}`
    : values.addRuleHref;

  return (
    <form action={action ? formAction : undefined} className="space-y-6">
      {hiddenFields
        ? Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))
        : null}
      <Field label="開催日" error={state.fieldErrors?.heldOn}>
        <HeldOnInput
          value={keepDraft ? heldOn : values.heldOn}
          onChange={keepDraft ? setHeldOn : undefined}
        />
      </Field>
      <Field label="大会名" error={state.fieldErrors?.name}>
        {keepDraft ? (
          <input
            type="text"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="例: 第13回金曜麻雀"
            className={fieldClass}
          />
        ) : (
          <input
            type="text"
            name="name"
            defaultValue={values.name}
            placeholder="例: 第13回金曜麻雀"
            className={fieldClass}
          />
        )}
      </Field>
      <Field label="メモ">
        {keepDraft ? (
          <textarea
            name="memo"
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            rows={TEXTAREA_ROWS}
            className={textareaClass}
          />
        ) : (
          <textarea
            name="memo"
            defaultValue={values.memo}
            rows={TEXTAREA_ROWS}
            className={textareaClass}
          />
        )}
      </Field>
      <ParticipantPicker
        members={values.members}
        initialSelectedUserIds={values.members
          .filter((member) => member.selected)
          .map((member) => member.userId)}
        initialGuests={values.guests}
        addParticipantHref={values.addParticipantHref}
        addGuestHref={values.addGuestHref}
        draftReturnPath={values.draftReturnPath}
        draftFields={keepDraft ? { heldOn, name, memo } : undefined}
        onDraftPeopleChange={keepDraft ? setDraftPeople : undefined}
        removeAction={removeParticipantAction}
        tournamentId={tournamentId}
      />
      <div>
        <SectionCard
          title="ルール"
          action={
            addRuleHref ? (
              <NavButton href={addRuleHref}>追加</NavButton>
            ) : (
              <button type="button" disabled className={compactButtonClass}>
                追加
              </button>
            )
          }
        >
          <ul className="divide-y divide-line border-t border-line">
            {values.rules.map((rule) => (
              <li key={rule.id}>
                {rule.detailHref ? (
                  <RowLink href={rule.detailHref} label={`${rule.name}の詳細`}>
                    <span className={`block truncate ${rowTitleClass}`}>
                      {rule.name}
                      {rule.inUse ? (
                        <span className="ml-2 text-sm font-normal text-muted">
                          使用中
                        </span>
                      ) : null}
                    </span>
                  </RowLink>
                ) : (
                  <span className={`block truncate py-3 ${rowTitleClass}`}>
                    {rule.name}
                    {rule.inUse ? (
                      <span className="ml-2 text-sm font-normal text-muted">
                        使用中
                      </span>
                    ) : null}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </SectionCard>
        <p className="mt-3 px-1 text-sm text-muted">
          大会のルールを追加します。使用中は修正できません。
        </p>
      </div>
      {state.formError ? (
        <p className="text-sm text-muted">{state.formError}</p>
      ) : null}
      <button
        type={action ? "submit" : "button"}
        disabled={pending}
        className={`${blockButtonClass} disabled:opacity-60`}
      >
        {mode === "create" ? "作成する" : "保存する"}
      </button>
    </form>
  );
}
