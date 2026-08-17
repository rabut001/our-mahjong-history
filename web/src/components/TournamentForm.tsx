"use client";

import { useState } from "react";
import { NavButton } from "@/components/NavButton";
import { ParticipantPicker } from "@/components/ParticipantPicker";
import { RowLink } from "@/components/RowLink";
import { SectionCard } from "@/components/SectionCard";
import {
  blockButtonClass,
  compactButtonClass,
  fieldClass,
  labelClass,
  rowTitleClass,
  textareaClass,
  TEXTAREA_ROWS,
} from "@/components/ui";

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
  members: { userId: string; displayName: string; selected: boolean }[];
  guests: string[];
  rules: TournamentFormRule[];
  addRuleHref?: string;
  addParticipantHref?: string;
  addGuestHref?: string;
};

type TournamentFormProps = {
  mode: "create" | "edit";
  values: TournamentFormValues;
};

function toDisplayDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) {
    return iso;
  }
  return `${year}/${month}/${day}`;
}

function HeldOnInput({ defaultValue }: { defaultValue: string }) {
  const [iso, setIso] = useState(defaultValue);
  return (
    <div className="relative mt-1">
      <input
        type="text"
        readOnly
        tabIndex={-1}
        value={toDisplayDate(iso)}
        className={`${fieldClass} pointer-events-none mt-0`}
      />
      <input
        type="date"
        name="heldOn"
        value={iso}
        lang="ja"
        aria-label="開催日"
        onChange={(event) => setIso(event.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </div>
  );
}

export function TournamentForm({ mode, values }: TournamentFormProps) {
  return (
    <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
      <label className={labelClass}>
        開催日
        <HeldOnInput defaultValue={values.heldOn} />
      </label>
      <label className={labelClass}>
        大会名
        <input
          type="text"
          name="name"
          defaultValue={values.name}
          placeholder="例: 第13回金曜麻雀"
          className={fieldClass}
        />
      </label>
      <label className={labelClass}>
        メモ
        <textarea
          name="memo"
          defaultValue={values.memo}
          rows={TEXTAREA_ROWS}
          className={textareaClass}
        />
      </label>
      <ParticipantPicker
        members={values.members}
        initialSelectedUserIds={values.members
          .filter((member) => member.selected)
          .map((member) => member.userId)}
        initialGuests={values.guests}
        addParticipantHref={values.addParticipantHref}
        addGuestHref={values.addGuestHref}
      />
      <div>
        <SectionCard
          title="ルール"
          action={
            values.addRuleHref ? (
              <NavButton href={values.addRuleHref}>追加</NavButton>
            ) : (
              <button type="button" className={compactButtonClass}>
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
        <p className="mt-3 px-1 text-sm leading-6 text-muted">
          大会のルールを追加します。
          <br />
          試合で使用中のものは修正できません。
        </p>
      </div>
      <button type="button" className={blockButtonClass}>
        {mode === "create" ? "作成する" : "保存する"}
      </button>
    </form>
  );
}
