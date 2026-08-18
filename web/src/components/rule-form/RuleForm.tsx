"use client";

import { useState } from "react";
import { NavButton } from "@/components/NavButton";
import { blockButtonClass } from "@/components/ui";
import { BasicFields } from "./BasicFields";
import { OTHER_MAX, type RuleFormData, type TieHandling } from "./data";
import { ExtraRuleFields } from "./ExtraRuleFields";
import { OkaUmaFields } from "./OkaUmaFields";
import { RateNotesFields } from "./RateNotesFields";

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
        <p className="text-sm text-muted">
          試合で使っているため修正できません。内容を変えるときはルールを新規登録してください。
        </p>
      ) : null}

      <BasicFields
        readOnly={readOnly}
        name={name}
        onNameChange={setName}
        playerCount={playerCount}
        onPlayerCountChange={setCount}
        startingScore={startingScore}
        onStartingScoreChange={setStartingScore}
        returnScore={returnScore}
        onReturnScoreChange={setReturnScore}
      />
      <OkaUmaFields
        readOnly={readOnly}
        playerCount={playerCount}
        okaTieHandling={okaTieHandling}
        onOkaTieHandlingChange={setOkaTieHandling}
        umaEnabled={umaEnabled}
        onUmaEnabledChange={setUma}
        umaTieHandling={umaTieHandling}
        onUmaTieHandlingChange={setUmaTieHandling}
        umaPoints1={umaPoints1}
        onUmaPoints1Change={setUmaPoints1}
        umaPoints2={umaPoints2}
        onUmaPoints2Change={setUmaPoints2}
      />
      <ExtraRuleFields
        readOnly={readOnly}
        tobiEnabled={tobiEnabled}
        onTobiEnabledChange={setTobiEnabled}
        yakitoriEnabled={yakitoriEnabled}
        onYakitoriEnabledChange={setYakitoriEnabled}
        otherNames={otherNames}
        onOtherNameChange={updateOtherName}
        onAddOtherName={addOtherName}
      />
      <RateNotesFields
        readOnly={readOnly}
        rate={rate}
        onRateChange={updateRate}
        onRateBlur={commitRate}
        notes={notes}
        onNotesChange={setNotes}
      />

      {readOnly ? (
        addRuleHref ? (
          <NavButton href={addRuleHref} variant="block">
            ルールを追加
          </NavButton>
        ) : null
      ) : (
        <button type="button" className={blockButtonClass}>
          {mode === "create" ? "追加する" : "保存する"}
        </button>
      )}
    </form>
  );
}
