"use client";

import { useState } from "react";
import { NavButton } from "@/components/NavButton";
import { ParticipantPicker } from "@/components/ParticipantPicker";

const fieldClass =
  "mt-1 w-full border border-neutral-400 bg-white px-3 py-2 text-base";
const labelClass = "block text-sm";

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
  const [rules, setRules] = useState(values.rules);

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
          rows={3}
          className={fieldClass}
        />
      </label>
      <ParticipantPicker
        members={values.members}
        initialSelectedUserIds={values.members
          .filter((member) => member.selected)
          .map((member) => member.userId)}
        initialGuests={values.guests}
        startWithAdderOpen={mode === "create"}
      />
      <section>
        <h2 className="text-sm">ルール</h2>
        <p className="mt-1 text-sm text-neutral-600">
          {mode === "create"
            ? "作成時にコミュニティの既定ルールをコピーします。"
            : "この大会のルールです。試合で使っているものは修正できません。"}
        </p>
        <ul className="mt-2 divide-y divide-neutral-200 border-y border-neutral-200">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className="flex items-center justify-between gap-3 py-2"
            >
              <span className="min-w-0 truncate">
                {rule.name}
                {rule.inUse ? (
                  <span className="ml-2 text-sm text-neutral-600">使用中</span>
                ) : null}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {rule.detailHref ? (
                  <NavButton href={rule.detailHref}>詳細</NavButton>
                ) : null}
                <button
                  type="button"
                  disabled={rule.inUse}
                  onClick={() => {
                    setRules((current) =>
                      current.filter((item) => item.id !== rule.id),
                    );
                  }}
                  className="inline-flex shrink-0 items-center justify-center border border-neutral-400 px-3 py-1 text-sm disabled:border-neutral-200 disabled:text-neutral-400"
                >
                  削除
                </button>
              </span>
            </li>
          ))}
        </ul>
        {values.addRuleHref ? (
          <div className="mt-3">
            <NavButton href={values.addRuleHref} variant="block">
              ルールを追加
            </NavButton>
          </div>
        ) : (
          <button
            type="button"
            className="mt-3 w-full border border-neutral-400 px-4 py-2 text-sm"
          >
            ルールを追加
          </button>
        )}
      </section>
      <button
        type="button"
        className="w-full border border-neutral-400 px-4 py-3 text-sm"
      >
        {mode === "create" ? "作成する" : "保存する"}
      </button>
    </form>
  );
}
