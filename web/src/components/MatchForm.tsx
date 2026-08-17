"use client";

import { useState, type ReactNode } from "react";
import { calculateMatchPoints, okaPool } from "@/lib/match-points";
import { formatPoints } from "@/mock";
import type { MatchFormData, MatchFormPlayer } from "@/mock";
import type { TournamentRule } from "@/mock";
import {
  blockButtonClass,
  textareaClass,
  TEXTAREA_ROWS,
} from "@/components/ui";

const cellInputClass =
  "w-full min-w-0 rounded-ui border border-line bg-field px-0.5 py-1 text-center text-sm tabular-nums disabled:border-transparent disabled:bg-transparent disabled:text-muted";
const labelClass = "flex items-center text-xs leading-tight text-muted";

type MatchFormProps = {
  mode: "create" | "edit";
  data: MatchFormData;
};

const SEATS_4 = ["east", "south", "west", "north"] as const;
const SEATS_3 = ["east", "south", "west"] as const;
const SEAT_LABEL: Record<(typeof SEATS_4)[number], string> = {
  east: "東家",
  south: "南家",
  west: "西家",
  north: "北家",
};

function emptyPlayer(
  participant: {
    id: string;
    name: string;
  },
  seat: (typeof SEATS_4)[number],
): MatchFormPlayer {
  return {
    participantId: participant.id,
    name: participant.name,
    seat,
    score: null,
    tobiPoints: 0,
    yakitoriPoints: 0,
    otherPoints: [0, 0, 0, 0, 0],
    manualPoints: [0, 0, 0],
    umaPoints: 0,
    baseOverride: null,
    points: 0,
    rank: null,
  };
}

function seatsFromPlayers(
  players: MatchFormPlayer[],
  playerCount: 3 | 4,
): (MatchFormPlayer | null)[] {
  const seats: (MatchFormPlayer | null)[] = Array.from(
    { length: playerCount },
    () => null,
  );
  players.forEach((player) => {
    const index = SEATS_4.indexOf(player.seat);
    if (index >= 0 && index < playerCount) {
      seats[index] = player;
    }
  });
  return seats;
}

function parseAmount(value: string): number {
  if (value === "" || value === "-") {
    return 0;
  }
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function GridRow({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <div className={labelClass}>{label}</div>
      {children}
    </>
  );
}

function CellRead({ children }: { children: string }) {
  return (
    <p className="px-0.5 py-1 text-center text-sm tabular-nums text-muted">
      {children}
    </p>
  );
}

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
  const showInputRows =
    Boolean(rule?.yakitoriEnabled) ||
    otherNames.length > 0 ||
    showTobi ||
    manualCount > 0;

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
      {data.rules.length > 1 ? (
        <fieldset>
          <legend className="text-sm">ルール</legend>
          <ul className="mt-2 space-y-2">
            {data.rules.map((item) => (
              <li key={item.id}>
                <label className="flex items-center gap-2 text-base">
                  <input
                    type="radio"
                    name="rule"
                    checked={item.id === ruleId}
                    onChange={() => applyRule(item)}
                  />
                  {item.name}
                  <span className="text-sm text-muted">
                    {item.playerCount === 4 ? "四麻" : "三麻"}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : (
        <p className="text-sm text-muted">
          ルール {rule.name}
          <span className="ml-2">
            {rule.playerCount === 4 ? "四麻" : "三麻"}
          </span>
        </p>
      )}

      <div className="grid gap-x-1 gap-y-2" style={gridStyle}>
        <div />
        {winds.map((wind) => (
          <p key={wind} className="text-center text-xs">
            {SEAT_LABEL[wind]}
          </p>
        ))}
        <div />
        {seats.map((seat, index) => {
          const options = data.participants.filter(
            (participant) =>
              participant.id === seat?.participantId ||
              !selectedIds.has(participant.id),
          );
          const wind = winds[index] ?? "east";
          return (
            <select
              key={`name-${index}`}
              value={seat?.participantId ?? ""}
              aria-label={`${SEAT_LABEL[wind]}の参加者`}
              onChange={(event) => assignUser(index, event.target.value)}
              className="w-full min-w-0 rounded-ui border border-line bg-field px-0 py-1 text-center text-xs"
            >
              <option value="">選ぶ</option>
              {options.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.name}
                </option>
              ))}
            </select>
          );
        })}

        <GridRow label="素点">
          {seats.map((seat, index) => (
            <input
              key={`score-${index}`}
              type="number"
              inputMode="numeric"
              disabled={!seat}
              placeholder={seat ? String(rule.startingScore) : undefined}
              value={seat?.score ?? ""}
              aria-label={seat ? `${seat.name}の素点` : `席${index + 1}の素点`}
              onChange={(event) => {
                const raw = event.target.value;
                updateSeat(index, {
                  score: raw === "" ? null : Number(raw),
                });
              }}
              className={cellInputClass}
            />
          ))}
        </GridRow>

        <GridRow label="基本pt">
          {seats.map((seat, index) => {
            const calc = seat
              ? calculatedById.get(seat.participantId)
              : undefined;
            const editable = Boolean(
              editBasePt && seat && seat.score === maxScore,
            );
            if (!editable) {
              return (
                <CellRead key={`base-${index}`}>
                  {calc ? formatPoints(calc.basePoints) : "—"}
                </CellRead>
              );
            }
            return (
              <input
                key={`base-${index}`}
                type="number"
                step="0.1"
                value={seat?.baseOverride ?? calc?.basePoints ?? ""}
                aria-label={`${seat?.name}の基本pt`}
                onChange={(event) => {
                  const raw = event.target.value;
                  updateSeat(index, {
                    baseOverride: raw === "" ? null : Number(raw),
                  });
                }}
                className={cellInputClass}
              />
            );
          })}
        </GridRow>

        <GridRow label="順位">
          {seats.map((seat, index) => {
            const calc = seat
              ? calculatedById.get(seat.participantId)
              : undefined;
            return (
              <CellRead key={`rank-${index}`}>
                {calc ? `${calc.rank}位` : "—"}
              </CellRead>
            );
          })}
        </GridRow>

        {rule.umaEnabled ? (
          <GridRow label="ウマ">
            {seats.map((seat, index) => {
              const calc = seat
                ? calculatedById.get(seat.participantId)
                : undefined;
              const editable = Boolean(
                showUmaManual && seat && umaTiedIds.has(seat.participantId),
              );
              if (!editable) {
                return (
                  <CellRead key={`uma-${index}`}>
                    {calc ? formatPoints(calc.umaPoints) : "—"}
                  </CellRead>
                );
              }
              return (
                <input
                  key={`uma-${index}`}
                  type="number"
                  step="0.1"
                  value={seat?.umaPoints ?? 0}
                  aria-label={`${seat?.name}のウマ`}
                  onChange={(event) =>
                    updateSeat(index, {
                      umaPoints: parseAmount(event.target.value),
                    })
                  }
                  className={cellInputClass}
                />
              );
            })}
          </GridRow>
        ) : null}

        {showInputRows ? (
          <div
            className="border-t border-line"
            style={{ gridColumn: "1 / -1" }}
          />
        ) : null}

        {showTobi ? (
          <GridRow label="トビ">
            {seats.map((seat, index) => (
              <input
                key={`tobi-${index}`}
                type="number"
                step="0.1"
                disabled={!seat}
                value={seat?.tobiPoints ?? ""}
                aria-label={
                  seat ? `${seat.name}のトビ` : `席${index + 1}のトビ`
                }
                onChange={(event) =>
                  updateSeat(index, {
                    tobiPoints: parseAmount(event.target.value),
                  })
                }
                className={cellInputClass}
              />
            ))}
          </GridRow>
        ) : null}

        {rule.yakitoriEnabled ? (
          <GridRow label="焼き鳥">
            {seats.map((seat, index) => (
              <input
                key={`yakitori-${index}`}
                type="number"
                step="0.1"
                disabled={!seat}
                value={seat?.yakitoriPoints ?? ""}
                aria-label={
                  seat ? `${seat.name}の焼き鳥` : `席${index + 1}の焼き鳥`
                }
                onChange={(event) =>
                  updateSeat(index, {
                    yakitoriPoints: parseAmount(event.target.value),
                  })
                }
                className={cellInputClass}
              />
            ))}
          </GridRow>
        ) : null}

        {otherNames.map((item) => (
          <GridRow key={item.index} label={item.name}>
            {seats.map((seat, index) => (
              <input
                key={`other-${item.index}-${index}`}
                type="number"
                step="0.1"
                disabled={!seat}
                value={seat?.otherPoints[item.index] ?? ""}
                aria-label={
                  seat
                    ? `${seat.name}の${item.name}`
                    : `席${index + 1}の${item.name}`
                }
                onChange={(event) => {
                  if (!seat) {
                    return;
                  }
                  const next = [...seat.otherPoints] as [
                    number,
                    number,
                    number,
                    number,
                    number,
                  ];
                  next[item.index] = parseAmount(event.target.value);
                  updateSeat(index, { otherPoints: next });
                }}
                className={cellInputClass}
              />
            ))}
          </GridRow>
        ))}

        {Array.from({ length: manualCount }, (_, titleIndex) => (
          <GridRow
            key={`manual-${titleIndex}`}
            label={
              <input
                type="text"
                value={manualTitles[titleIndex] ?? ""}
                placeholder="タイトル"
                aria-label={`試合個別pt${titleIndex + 1}のタイトル`}
                onChange={(event) => {
                  const next = [...manualTitles] as [string, string, string];
                  next[titleIndex] = event.target.value;
                  setManualTitles(next);
                }}
                className="w-full min-w-0 rounded-ui border border-line bg-field px-0.5 py-1 text-xs"
              />
            }
          >
            {seats.map((seat, index) => (
              <input
                key={`manual-${titleIndex}-${index}`}
                type="number"
                step="0.1"
                disabled={!seat}
                value={seat?.manualPoints[titleIndex] ?? ""}
                aria-label={
                  seat
                    ? `${seat.name}の${manualTitles[titleIndex] || `試合個別${titleIndex + 1}`}`
                    : `席${index + 1}の試合個別${titleIndex + 1}`
                }
                onChange={(event) => {
                  if (!seat) {
                    return;
                  }
                  const next = [...seat.manualPoints] as [
                    number,
                    number,
                    number,
                  ];
                  next[titleIndex] = parseAmount(event.target.value);
                  updateSeat(index, { manualPoints: next });
                }}
                className={cellInputClass}
              />
            ))}
          </GridRow>
        ))}

        {manualCount < 3 ? (
          <button
            type="button"
            onClick={addManualRow}
            className="py-1 text-left text-sm text-muted"
            style={{ gridColumn: "1 / -1" }}
          >
            行を追加
          </button>
        ) : null}

        <div
          className="border-t border-line"
          style={{ gridColumn: "1 / -1" }}
        />

        <GridRow label="合計pt">
          {seats.map((seat, index) => {
            const calc = seat
              ? calculatedById.get(seat.participantId)
              : undefined;
            return (
              <CellRead key={`total-${index}`}>
                {calc ? formatPoints(calc.totalPoints) : "—"}
              </CellRead>
            );
          })}
        </GridRow>

        <GridRow label="レート">
          {seats.map((_, index) => (
            <CellRead key={`rate-${index}`}>{rule.rate.toFixed(1)}</CellRead>
          ))}
        </GridRow>

        <GridRow label="反映pt">
          {seats.map((seat, index) => {
            const calc = seat
              ? calculatedById.get(seat.participantId)
              : undefined;
            return (
              <CellRead key={`rated-${index}`}>
                {calc ? formatPoints(calc.points) : "—"}
              </CellRead>
            );
          })}
        </GridRow>
      </div>

      <p className="text-sm text-muted">
        0 のままでよい行は触らなくて大丈夫です。
        {showTobi ? " トビは素点が 0 以下のときに使います。" : null}
        {editBasePt
          ? ` 素点同点のため、オカ込みの基本ptを入力してください（オカ合計 ${formatPoints(okaPool(rule))}）。`
          : null}
      </p>

      <label className="block text-sm">
        コメント
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={TEXTAREA_ROWS}
          className={textareaClass}
        />
      </label>

      <button type="button" className={blockButtonClass}>
        {mode === "create" ? "追加する" : "保存する"}
      </button>
    </form>
  );
}
