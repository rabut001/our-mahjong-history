"use client";

import { useState } from "react";
import {
  blockButtonClass,
  Field,
  textareaClass,
  TEXTAREA_ROWS,
} from "@/components/ui";
import { calculateMatchPoints, formatPoints, okaPool } from "@/lib/domain";
import type { TournamentRule } from "@/mock";
import { emptyPlayer, SEATS_3, SEATS_4, seatsFromPlayers } from "./helpers";
import { ResultRows } from "./ResultRows";
import { RuleLinkedRows } from "./RuleLinkedRows";
import { RulePicker } from "./RulePicker";
import { ScoreRow } from "./ScoreRow";
import { SeatColumns } from "./SeatColumns";
import { SummaryRows } from "./SummaryRows";
import type { MatchFormData, MatchFormPlayer } from "./types";

type MatchFormProps = {
  mode: "create" | "edit";
  data: MatchFormData;
};

export function MatchForm({ mode, data }: MatchFormProps) {
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
  const allReady =
    Boolean(rule) &&
    seats.length === (rule?.playerCount ?? 0) &&
    seats.every((seat) => seat !== null && seat.score !== null);

  const calculatedById = (() => {
    if (!rule || !allReady) {
      return new Map<string, ReturnType<typeof calculateMatchPoints>[number]>();
    }
    const players = seats.filter(
      (seat): seat is MatchFormPlayer => seat !== null,
    );
    const rows = calculateMatchPoints(
      players.map((player) => ({
        participantId: player.participantId,
        seat: player.seat,
        score: player.score ?? 0,
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
  const maxScore = allReady
    ? Math.max(...filled.map((player) => player.score ?? 0))
    : null;
  const firstPlaceTied =
    allReady && filled.filter((player) => player.score === maxScore).length > 1;
  const umaTiedIds = (() => {
    if (!allReady) {
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
    Boolean(rule?.tobiEnabled) &&
    filled.some((player) => player.score !== null && player.score <= 0);
  const editBasePt = rule?.okaTieHandling === "manual" && firstPlaceTied;
  const showUmaManual =
    Boolean(rule?.umaEnabled) &&
    rule?.umaTieHandling === "manual" &&
    umaTiedIds.size > 0;

  function applyRule(nextRule: TournamentRule) {
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

  if (!rule) {
    return <p className="text-sm">この大会にはルールがありません。</p>;
  }

  const gridStyle = {
    gridTemplateColumns: `4rem repeat(${seats.length}, minmax(0, 1fr))`,
  };

  return (
    <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
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

      <Field label="コメント">
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={TEXTAREA_ROWS}
          className={textareaClass}
        />
      </Field>

      <button type="button" className={blockButtonClass}>
        {mode === "create" ? "追加する" : "保存する"}
      </button>
    </form>
  );
}
