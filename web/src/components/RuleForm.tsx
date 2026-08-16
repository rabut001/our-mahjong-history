"use client";

import { useState, type ReactNode } from "react";
import { NavButton } from "@/components/NavButton";
import type { RuleFormData } from "@/mock";

const fieldClass =
  "mt-1 w-full border border-neutral-400 bg-white px-3 py-2 text-base disabled:bg-neutral-100";
const labelClass = "block text-sm";
const OTHER_MAX = 5;

const TIE_OPTIONS = [
  { value: "kamicha", label: "上家取り" },
  { value: "split", label: "折半" },
  { value: "manual", label: "手動" },
] as const;

type TieHandling = (typeof TIE_OPTIONS)[number]["value"];

type RuleFormProps = {
  mode: "create" | "edit" | "view";
  data: RuleFormData;
  addRuleHref?: string;
};

function otherNamesFromData(data: RuleFormData): string[] {
  const names = [
    data.otherPoints1Name,
    data.otherPoints2Name,
    data.otherPoints3Name,
    data.otherPoints4Name,
    data.otherPoints5Name,
  ].filter((name) => name.trim() !== "");
  return names.length > 0 ? names : [""];
}

function RadioRow({
  legend,
  disabled,
  children,
}: {
  legend: string;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset disabled={disabled}>
      <legend className="text-sm">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">{children}</div>
    </fieldset>
  );
}

function RadioOption({
  name,
  checked,
  onChange,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  children: string;
}) {
  return (
    <label className="flex items-center gap-2 text-base">
      <input type="radio" name={name} checked={checked} onChange={onChange} />
      {children}
    </label>
  );
}

export function RuleForm({ mode, data, addRuleHref }: RuleFormProps) {
  const readOnly = mode === "view";
  const [name, setName] = useState(data.name);
  const [playerCount, setPlayerCount] = useState<3 | 4>(data.playerCount);
  const [startingScore, setStartingScore] = useState(
    String(data.startingScore),
  );
  const [returnScore, setReturnScore] = useState(String(data.returnScore));
  const [okaTieHandling, setOkaTieHandling] = useState<TieHandling>(
    data.okaTieHandling,
  );
  const [umaEnabled, setUmaEnabled] = useState(data.umaEnabled);
  const [umaTieHandling, setUmaTieHandling] = useState<TieHandling>(
    data.umaTieHandling ?? "kamicha",
  );
  const [umaPoints1, setUmaPoints1] = useState(
    data.umaPoints1 == null ? "" : String(data.umaPoints1),
  );
  const [umaPoints2, setUmaPoints2] = useState(
    data.umaPoints2 == null ? "" : String(data.umaPoints2),
  );
  const [tobiEnabled, setTobiEnabled] = useState(data.tobiEnabled);
  const [yakitoriEnabled, setYakitoriEnabled] = useState(data.yakitoriEnabled);
  const [otherNames, setOtherNames] = useState(() => otherNamesFromData(data));
  const [rate, setRate] = useState(data.rate.toFixed(1));
  const [notes, setNotes] = useState(data.notes);

  function setCount(next: 3 | 4) {
    setPlayerCount(next);
    if (next === 3) {
      setUmaPoints2("");
    } else if (umaEnabled && umaPoints2 === "") {
      setUmaPoints2("10");
    }
  }

  function setUma(next: boolean) {
    setUmaEnabled(next);
    if (next && umaPoints1 === "") {
      setUmaPoints1(next && playerCount === 3 ? "20" : "30");
    }
    if (next && playerCount === 4 && umaPoints2 === "") {
      setUmaPoints2("10");
    }
  }

  function updateRate(raw: string) {
    if (raw === "" || /^\d*(\.\d?)?$/.test(raw)) {
      setRate(raw);
    }
  }

  function commitRate() {
    const amount = Number(rate);
    if (rate.trim() === "" || !Number.isFinite(amount) || amount < 0) {
      setRate("0.0");
      return;
    }
    setRate(amount.toFixed(1));
  }

  function updateOtherName(index: number, value: string) {
    setOtherNames((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  }

  function addOtherName() {
    if (otherNames.length >= OTHER_MAX) {
      return;
    }
    setOtherNames((current) => [...current, ""]);
  }

  return (
    <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
      {readOnly ? (
        <p className="text-sm text-neutral-600">
          試合で使っているため修正できません。内容を変えるときはルールを新規登録してください。
        </p>
      ) : null}

      <label className={labelClass}>
        表示名
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={readOnly}
          placeholder="例: 四麻標準"
          className={fieldClass}
        />
      </label>

      <RadioRow legend="人数" disabled={readOnly}>
        <RadioOption
          name="playerCount"
          checked={playerCount === 4}
          onChange={() => setCount(4)}
        >
          四麻
        </RadioOption>
        <RadioOption
          name="playerCount"
          checked={playerCount === 3}
          onChange={() => setCount(3)}
        >
          三麻
        </RadioOption>
      </RadioRow>

      <label className={labelClass}>
        持ち点
        <input
          type="number"
          inputMode="numeric"
          value={startingScore}
          onChange={(event) => setStartingScore(event.target.value)}
          disabled={readOnly}
          className={fieldClass}
        />
      </label>

      <label className={labelClass}>
        返し点
        <input
          type="number"
          inputMode="numeric"
          value={returnScore}
          onChange={(event) => setReturnScore(event.target.value)}
          disabled={readOnly}
          className={fieldClass}
        />
      </label>

      <RadioRow legend="オカの同着時" disabled={readOnly}>
        {TIE_OPTIONS.map((option) => (
          <RadioOption
            key={option.value}
            name="okaTie"
            checked={okaTieHandling === option.value}
            onChange={() => setOkaTieHandling(option.value)}
          >
            {option.label}
          </RadioOption>
        ))}
      </RadioRow>

      <RadioRow legend="ウマ" disabled={readOnly}>
        <RadioOption
          name="uma"
          checked={umaEnabled}
          onChange={() => setUma(true)}
        >
          あり
        </RadioOption>
        <RadioOption
          name="uma"
          checked={!umaEnabled}
          onChange={() => setUma(false)}
        >
          なし
        </RadioOption>
      </RadioRow>

      {umaEnabled ? (
        <>
          <RadioRow legend="ウマの同着時" disabled={readOnly}>
            {TIE_OPTIONS.map((option) => (
              <RadioOption
                key={option.value}
                name="umaTie"
                checked={umaTieHandling === option.value}
                onChange={() => setUmaTieHandling(option.value)}
              >
                {option.label}
              </RadioOption>
            ))}
          </RadioRow>
          <label className={labelClass}>
            ウマ（最上位 ⇔ 最下位）
            <input
              type="number"
              inputMode="numeric"
              value={umaPoints1}
              onChange={(event) => setUmaPoints1(event.target.value)}
              disabled={readOnly}
              className={fieldClass}
            />
          </label>
          {playerCount === 4 ? (
            <label className={labelClass}>
              ウマ（2位 ⇔ 3位）
              <input
                type="number"
                inputMode="numeric"
                value={umaPoints2}
                onChange={(event) => setUmaPoints2(event.target.value)}
                disabled={readOnly}
                className={fieldClass}
              />
            </label>
          ) : null}
        </>
      ) : null}

      <RadioRow legend="トビ" disabled={readOnly}>
        <RadioOption
          name="tobi"
          checked={tobiEnabled}
          onChange={() => setTobiEnabled(true)}
        >
          あり
        </RadioOption>
        <RadioOption
          name="tobi"
          checked={!tobiEnabled}
          onChange={() => setTobiEnabled(false)}
        >
          なし
        </RadioOption>
      </RadioRow>

      <RadioRow legend="焼き鳥" disabled={readOnly}>
        <RadioOption
          name="yakitori"
          checked={yakitoriEnabled}
          onChange={() => setYakitoriEnabled(true)}
        >
          あり
        </RadioOption>
        <RadioOption
          name="yakitori"
          checked={!yakitoriEnabled}
          onChange={() => setYakitoriEnabled(false)}
        >
          なし
        </RadioOption>
      </RadioRow>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm">その他ポイント</h2>
          {!readOnly && otherNames.length < OTHER_MAX ? (
            <button
              type="button"
              onClick={addOtherName}
              className="inline-flex shrink-0 items-center justify-center border border-neutral-400 px-3 py-1 text-sm"
            >
              追加
            </button>
          ) : null}
        </div>
        <ul className="mt-2 space-y-2">
          {otherNames.map((item, index) => (
            <li key={index}>
              <input
                type="text"
                value={item}
                onChange={(event) => updateOtherName(index, event.target.value)}
                disabled={readOnly}
                aria-label={`その他ポイント${index + 1}`}
                placeholder="例：役満ご祝儀"
                className="w-full border border-neutral-400 bg-white px-3 py-2 text-base disabled:bg-neutral-100"
              />
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-neutral-600">
          試合で手入力する枠です。未使用なら空のままで大丈夫です。
        </p>
      </section>

      <label className={labelClass}>
        レート
        <input
          type="text"
          inputMode="decimal"
          value={rate}
          onChange={(event) => updateRate(event.target.value)}
          onBlur={commitRate}
          disabled={readOnly}
          className={fieldClass}
        />
      </label>

      <label className={labelClass}>
        メモ
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={readOnly}
          rows={2}
          className={fieldClass}
        />
      </label>

      {readOnly ? (
        addRuleHref ? (
          <NavButton href={addRuleHref} variant="block">
            ルールを追加
          </NavButton>
        ) : null
      ) : (
        <button
          type="button"
          className="w-full border border-neutral-400 px-4 py-3 text-sm"
        >
          {mode === "create" ? "追加する" : "保存する"}
        </button>
      )}
    </form>
  );
}
