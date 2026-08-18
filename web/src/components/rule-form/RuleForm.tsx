"use client";

import {
  useActionState,
  useCallback,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { NavButton } from "@/components/NavButton";
import { blockButtonClass } from "@/components/ui";
import {
  DUPLICATE_RULE_NAME_MESSAGE,
  MISSING_RULE_NAME_MESSAGE,
} from "@/lib/domain";
import type { FormState } from "@/lib/data/types";
import { BasicFields } from "./BasicFields";
import { OTHER_MAX, type RuleFormData, type TieHandling } from "./data";
import { ExtraRuleFields } from "./ExtraRuleFields";
import { OkaUmaFields } from "./OkaUmaFields";
import { RateNotesFields } from "./RateNotesFields";

type RuleFormProps = {
  mode: "create" | "edit" | "view";
  data: RuleFormData;
  addRuleHref?: string;
  action?: (prev: FormState, formData: FormData) => Promise<FormState>;
  hiddenFields?: Record<string, string>;
  existingRuleNames?: string[];
};

function nameDialogFromAction(formState: FormState): string | null {
  const message = formState.fieldErrors?.name;
  if (
    message === DUPLICATE_RULE_NAME_MESSAGE ||
    message === MISSING_RULE_NAME_MESSAGE
  ) {
    return message;
  }
  return null;
}

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

export function RuleForm({
  mode,
  data,
  addRuleHref,
  action,
  hiddenFields,
  existingRuleNames = [],
}: RuleFormProps) {
  const readOnly = mode === "view";
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action ?? (async () => ({})),
    {},
  );
  const [nameDialog, setNameDialog] = useState<string | null>(null);
  const [dismissedActionState, setDismissedActionState] =
    useState<FormState | null>(null);
  const closeNameDialog = useCallback(() => {
    setNameDialog(null);
    setDismissedActionState(state);
  }, [state]);
  const submitRef = useRef<HTMLButtonElement>(null);
  const [nameIssue, setNameIssue] = useState<string | null>(null);
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

  function isDuplicateName(value: string) {
    const trimmed = value.trim();
    if (trimmed === "") {
      return false;
    }
    return existingRuleNames.some((item) => item.trim() === trimmed);
  }

  function showNameIssue(message: string) {
    setNameIssue(message);
    setNameDialog(message);
  }

  const actionDialog =
    state === dismissedActionState ? null : nameDialogFromAction(state);
  const dialogTitle = nameDialog ?? actionDialog;

  function submitForm() {
    if (!action) {
      return;
    }
    const formData = new FormData();
    if (hiddenFields) {
      for (const [key, value] of Object.entries(hiddenFields)) {
        formData.set(key, value);
      }
    }
    formData.set("name", name);
    formData.set("playerCount", String(playerCount));
    formData.set("startingScore", startingScore);
    formData.set("returnScore", returnScore);
    formData.set("okaTieHandling", okaTieHandling);
    formData.set("umaEnabled", String(umaEnabled));
    formData.set("umaTieHandling", umaTieHandling);
    formData.set("umaPoints1", umaPoints1);
    formData.set("umaPoints2", umaPoints2);
    formData.set("tobiEnabled", String(tobiEnabled));
    formData.set("yakitoriEnabled", String(yakitoriEnabled));
    for (let index = 0; index < 5; index += 1) {
      formData.set(`otherPoints${index + 1}Name`, otherNames[index] ?? "");
    }
    formData.set("rate", rate);
    formData.set("notes", notes);
    formAction(formData);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action) {
      return;
    }
    if (name.trim() === "") {
      showNameIssue(MISSING_RULE_NAME_MESSAGE);
      return;
    }
    if (isDuplicateName(name)) {
      showNameIssue(DUPLICATE_RULE_NAME_MESSAGE);
      return;
    }
    setNameIssue(null);
    submitForm();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {readOnly ? (
        <p className="text-sm text-muted">
          試合で使っているため修正できません。内容を変えるときはルールを新規登録してください。
        </p>
      ) : null}

      <BasicFields
        readOnly={readOnly}
        name={name}
        onNameChange={(value) => {
          setNameIssue(null);
          setName(value);
        }}
        playerCount={playerCount}
        onPlayerCountChange={setCount}
        startingScore={startingScore}
        onStartingScoreChange={setStartingScore}
        returnScore={returnScore}
        onReturnScoreChange={setReturnScore}
        nameError={nameIssue ?? state.fieldErrors?.name}
        startingScoreError={state.fieldErrors?.startingScore}
        returnScoreError={state.fieldErrors?.returnScore}
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
        umaPoints1Error={state.fieldErrors?.umaPoints1}
        umaPoints2Error={state.fieldErrors?.umaPoints2}
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
        rateError={state.fieldErrors?.rate}
      />

      {state.formError ? (
        <p className="text-sm text-muted">{state.formError}</p>
      ) : null}

      {readOnly ? (
        addRuleHref ? (
          <NavButton href={addRuleHref} variant="block">
            ルールを追加
          </NavButton>
        ) : null
      ) : (
        <button
          ref={submitRef}
          type="submit"
          disabled={pending}
          className={`${blockButtonClass} disabled:opacity-60`}
        >
          {mode === "create" ? "追加する" : "保存する"}
        </button>
      )}

      <ConfirmDialog
        open={Boolean(dialogTitle)}
        title={dialogTitle ?? ""}
        onCancel={closeNameDialog}
        triggerRef={submitRef}
      >
        <button
          type="button"
          onClick={closeNameDialog}
          className={blockButtonClass}
        >
          OK
        </button>
      </ConfirmDialog>
    </form>
  );
}
