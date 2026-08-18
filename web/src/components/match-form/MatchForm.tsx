"use client";

import {
  useActionState,
  useCallback,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  blockButtonClass,
  Field,
  outlineBlockButtonClass,
  textareaClass,
  TEXTAREA_ROWS,
} from "@/components/ui";
import {
  calculateMatchPoints,
  formatPoints,
  isScoreTotalMismatched,
  okaPool,
} from "@/lib/domain";
import type { FormState } from "@/lib/data/types";
import { emptyPlayer, SEATS_3, SEATS_4, seatsFromPlayers } from "./helpers";
import { ResultRows } from "./ResultRows";
import { RuleLinkedRows } from "./RuleLinkedRows";
import { RulePicker } from "./RulePicker";
import { ScoreRow } from "./ScoreRow";
import { SeatColumns } from "./SeatColumns";
import { SummaryRows } from "./SummaryRows";
import type { MatchFormData, MatchFormPlayer, MatchFormRule } from "./types";

type MatchFormProps = {
  mode: "create" | "edit";
  data: MatchFormData;
  action?: (prev: FormState, formData: FormData) => Promise<FormState>;
  hiddenFields?: Record<string, string>;
};

export function MatchForm({
  mode,
  data,
  action,
  hiddenFields,
}: MatchFormProps) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action ?? (async () => ({})),
    {},
  );
  const [ruleId, setRuleId] = useState(data.selectedRuleId);
  const initialRule =
    data.rules.find((item) => item.id === data.selectedRuleId) ?? data.rules[0];
  const [seats, setSeats] = useState<(MatchFormPlayer | null)[]>(() =>
    seatsFromPlayers(data.players, initialRule?.playerCount ?? 4),
  );
  const [manualTitles, setManualTitles] = useState(data.manualTitles);
  const [manualCount, setManualCount] = useState(
    data.manualTitles.filter((title) => title.trim() !== "").length,
  );
  const [comment, setComment] = useState(data.comment);
  const [confirmMismatch, setConfirmMismatch] = useState(false);
  const submitRef = useRef<HTMLButtonElement>(null);
  const closeMismatch = useCallback(() => setConfirmMismatch(false), []);

  const rule = data.rules.find((item) => item.id === ruleId) ?? data.rules[0];
  const winds = rule?.playerCount === 3 ? SEATS_3 : SEATS_4;
  const otherNames = (
    rule
      ? [
          rule.otherPoints1Name,
          rule.otherPoints2Name,
          rule.otherPoints3Name,
          rule.otherPoints4Name,
          rule.otherPoints5Name,
        ]
      : []
  )
    .map((name, index) => ({ name, index }))
    .filter((item) => item.name.trim() !== "");

  const filled = seats.filter((seat): seat is MatchFormPlayer => seat !== null);
  const selectedIds = new Set(filled.map((player) => player.participantId));
  const allSeated =
    Boolean(rule) &&
    seats.length === (rule?.playerCount ?? 0) &&
    seats.every((seat) => seat !== null);
  const startingScore = rule?.startingScore ?? 0;
  const scoreOf = (player: MatchFormPlayer) => player.score ?? startingScore;

  const calculatedById = (() => {
    if (!rule || !allSeated) {
      return new Map<string, ReturnType<typeof calculateMatchPoints>[number]>();
    }
    const players = seats.filter(
      (seat): seat is MatchFormPlayer => seat !== null,
    );
    const rows = calculateMatchPoints(
      players.map((player) => ({
        participantId: player.participantId,
        seat: player.seat,
        score: scoreOf(player),
        tobiPoints: player.tobiPoints,
        yakitoriPoints: player.yakitoriPoints,
        otherPoints: [...player.otherPoints],
        manualPoints: [...player.manualPoints],
        baseOverride: player.baseOverride,
        umaOverride: player.umaPoints,
      })),
      rule,
    );
    return new Map(rows.map((row) => [row.participantId, row]));
  })();

  const calculatedRows = seats.map((seat) =>
    seat ? calculatedById.get(seat.participantId) : undefined,
  );
  const maxScore = allSeated
    ? Math.max(...filled.map((player) => scoreOf(player)))
    : null;
  const firstPlaceTied =
    allSeated &&
    filled.filter((player) => scoreOf(player) === maxScore).length > 1;
  const umaTiedIds = (() => {
    if (!allSeated) {
      return new Set<string>();
    }
    const counts = new Map<number, number>();
    for (const row of calculatedRows) {
      if (!row) {
        continue;
      }
      counts.set(row.rank, (counts.get(row.rank) ?? 0) + 1);
    }
    const ids = new Set<string>();
    seats.forEach((seat, index) => {
      const row = calculatedRows[index];
      if (seat && row && (counts.get(row.rank) ?? 0) > 1) {
        ids.add(seat.participantId);
      }
    });
    return ids;
  })();

  const showTobi =
    Boolean(rule?.tobiEnabled) && filled.some((player) => scoreOf(player) <= 0);
  const editBasePt = rule?.okaTieHandling === "manual" && firstPlaceTied;
  const showUmaManual =
    Boolean(rule?.umaEnabled) &&
    rule?.umaTieHandling === "manual" &&
    umaTiedIds.size > 0;

  function applyRule(nextRule: MatchFormRule) {
    setRuleId(nextRule.id);
    setSeats((current) => {
      const next = current.slice(0, nextRule.playerCount);
      while (next.length < nextRule.playerCount) {
        next.push(null);
      }
      return next;
    });
  }

  function setSeat(index: number, player: MatchFormPlayer | null) {
    setSeats((current) =>
      current.map((seat, seatIndex) => (seatIndex === index ? player : seat)),
    );
  }

  function updateSeat(index: number, patch: Partial<MatchFormPlayer>) {
    setSeats((current) =>
      current.map((seat, seatIndex) =>
        seatIndex === index && seat ? { ...seat, ...patch } : seat,
      ),
    );
  }

  function assignUser(index: number, participantId: string) {
    if (participantId === "") {
      setSeat(index, null);
      return;
    }
    const participant = data.participants.find(
      (item) => item.id === participantId,
    );
    if (!participant) {
      return;
    }
    const existing = seats[index];
    const wind = winds[index] ?? "east";
    setSeat(
      index,
      existing && existing.participantId === participantId
        ? { ...existing, seat: wind }
        : emptyPlayer(participant, wind),
    );
  }

  function addManualRow() {
    if (manualCount >= 3) {
      return;
    }
    setManualCount(manualCount + 1);
  }

  const scoreWarning =
    allSeated && rule
      ? isScoreTotalMismatched(
          filled.map((player) => scoreOf(player)),
          rule.startingScore,
          rule.playerCount,
        )
      : false;

  function submitForm() {
    if (!action || !allSeated || !rule) {
      return;
    }
    const players = seats.filter(
      (seat): seat is MatchFormPlayer => seat !== null,
    );
    const formData = new FormData();
    if (hiddenFields) {
      for (const [key, value] of Object.entries(hiddenFields)) {
        formData.set(key, value);
      }
    }
    formData.set("ruleId", rule.id);
    formData.set("comment", comment);
    formData.set("manualTitles", JSON.stringify(manualTitles));
    formData.set(
      "players",
      JSON.stringify(
        players.map((player) => ({
          participantId: player.participantId,
          seat: player.seat,
          score: scoreOf(player),
          tobiPoints: player.tobiPoints,
          yakitoriPoints: player.yakitoriPoints,
          otherPoints: player.otherPoints,
          manualPoints: player.manualPoints,
          baseOverride: player.baseOverride,
          umaOverride: player.umaPoints,
        })),
      ),
    );
    formAction(formData);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action || !allSeated || !rule) {
      return;
    }
    if (scoreWarning) {
      setConfirmMismatch(true);
      return;
    }
    submitForm();
  }

  if (!rule) {
    return <p className="text-sm">この大会にはルールがありません。</p>;
  }

  const gridStyle = {
    gridTemplateColumns: `4rem repeat(${seats.length}, minmax(0, 1fr))`,
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <RulePicker
        rules={data.rules}
        selectedRuleId={ruleId}
        onSelect={applyRule}
      />

      <div className="grid gap-x-1 gap-y-2" style={gridStyle}>
        <SeatColumns
          winds={winds}
          seats={seats}
          participants={data.participants}
          selectedIds={selectedIds}
          onAssign={assignUser}
        />
        <ScoreRow
          seats={seats}
          startingScore={rule.startingScore}
          onUpdateSeat={updateSeat}
        />
        <ResultRows
          seats={seats}
          calculatedById={calculatedById}
          umaEnabled={rule.umaEnabled}
          editBasePt={Boolean(editBasePt)}
          showUmaManual={showUmaManual}
          umaTiedIds={umaTiedIds}
          onUpdateSeat={updateSeat}
        />
        <RuleLinkedRows
          seats={seats}
          showTobi={showTobi}
          yakitoriEnabled={rule.yakitoriEnabled}
          otherNames={otherNames}
          manualCount={manualCount}
          manualTitles={manualTitles}
          onManualTitlesChange={setManualTitles}
          onAddManualRow={addManualRow}
          onUpdateSeat={updateSeat}
        />
        <SummaryRows
          seats={seats}
          calculatedById={calculatedById}
          rate={rule.rate}
        />
      </div>

      <p className="text-sm text-muted">
        0 のままでよい行は触らなくて大丈夫です。
        {showTobi ? " トビは素点が 0 以下のときに使います。" : null}
        {editBasePt
          ? ` 素点の1位が同点のため、オカ込みの基本ptを全員入力してください（オカ合計 ${formatPoints(okaPool(rule))}）。`
          : null}
      </p>

      {data.participants.length < (rule.playerCount ?? 4) ? (
        <p className="text-sm text-muted">
          試合を追加するには、先に参加者を追加してください。
        </p>
      ) : null}

      {scoreWarning ? (
        <p className="text-sm text-muted">
          点数の合計が持ち点×人数と違います。
        </p>
      ) : null}

      <Field label="コメント">
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={TEXTAREA_ROWS}
          className={textareaClass}
        />
      </Field>

      {state.formError ? (
        <p className="text-sm text-muted">{state.formError}</p>
      ) : null}

      <button
        ref={submitRef}
        type="submit"
        disabled={pending || !allSeated}
        className={`${blockButtonClass} disabled:opacity-60`}
      >
        {mode === "create" ? "追加する" : "保存する"}
      </button>

      <ConfirmDialog
        open={confirmMismatch}
        title="点数の合計が持ち点×人数と違います。"
        body="入力を直す場合はキャンセルしてください。"
        onCancel={closeMismatch}
        triggerRef={submitRef}
      >
        {state.formError ? (
          <p className="text-sm text-muted">{state.formError}</p>
        ) : null}
        <button
          type="button"
          disabled={pending}
          onClick={submitForm}
          className={`${blockButtonClass} disabled:opacity-60`}
        >
          {mode === "create" ? "このまま追加する" : "このまま保存する"}
        </button>
        <button
          type="button"
          onClick={closeMismatch}
          className={outlineBlockButtonClass}
        >
          キャンセル
        </button>
      </ConfirmDialog>
    </form>
  );
}
