"use client";

import { useActionState, useState, type FormEvent } from "react";
import { formatPoints } from "@/lib/domain";
import { blockButtonClass, pressableClass } from "@/components/ui";
import type { FormState } from "@/lib/data/types";

export type PointCorrectionParticipant = {
  id: string;
  name: string;
  matchPoints: number;
};

export type PointCorrectionRow = {
  title: string;
  amounts: number[];
};

type PointCorrectionFormProps = {
  participants: PointCorrectionParticipant[];
  initialRows: PointCorrectionRow[];
  tournamentId: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
};

const CORRECTION_MAX = 5;
const cellInputClass =
  "w-16 rounded-ui border border-line bg-field px-1 py-1 text-center text-sm tabular-nums";

type DraftRow = {
  title: string;
  amounts: string[];
};

function emptyAmounts(participantCount: number): string[] {
  return Array.from({ length: participantCount }, () => "");
}

function amountToText(amount: number): string {
  return amount === 0 ? "" : String(amount);
}

function parseAmountText(value: string): number {
  if (value === "" || value === "-" || value === "." || value === "-.") {
    return 0;
  }
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function initialDraft(
  rows: PointCorrectionRow[],
  participantCount: number,
): DraftRow[] {
  const visible = rows
    .filter(
      (row) =>
        row.title.trim() !== "" || row.amounts.some((amount) => amount !== 0),
    )
    .slice(0, CORRECTION_MAX)
    .map((row) => ({
      title: row.title,
      amounts: [
        ...row.amounts,
        ...Array.from({ length: participantCount }, () => 0),
      ]
        .slice(0, participantCount)
        .map(amountToText),
    }));
  if (visible.length === 0) {
    return [{ title: "", amounts: emptyAmounts(participantCount) }];
  }
  return visible;
}

export function PointCorrectionForm({
  participants,
  initialRows,
  tournamentId,
  action,
}: PointCorrectionFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [draft, setDraft] = useState(() =>
    initialDraft(initialRows, participants.length),
  );

  function updateTitle(rowIndex: number, title: string) {
    setDraft((current) =>
      current.map((row, index) =>
        index === rowIndex ? { ...row, title } : row,
      ),
    );
  }

  function updateAmount(
    rowIndex: number,
    participantIndex: number,
    value: string,
  ) {
    setDraft((current) =>
      current.map((row, index) => {
        if (index !== rowIndex) {
          return row;
        }
        const amounts = row.amounts.slice();
        amounts[participantIndex] = value;
        return { ...row, amounts };
      }),
    );
  }

  function addColumn() {
    if (draft.length >= CORRECTION_MAX) {
      return;
    }
    setDraft((current) => [
      ...current,
      { title: "", amounts: emptyAmounts(participants.length) },
    ]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const titles = Array.from(
      { length: CORRECTION_MAX },
      (_, index) => draft[index]?.title ?? "",
    );
    const amounts: Record<string, number[]> = {};
    for (const [participantIndex, participant] of participants.entries()) {
      amounts[participant.id] = Array.from(
        { length: CORRECTION_MAX },
        (_, index) =>
          parseAmountText(draft[index]?.amounts[participantIndex] ?? ""),
      );
    }
    const formData = new FormData();
    formData.set("tournamentId", tournamentId);
    formData.set("titles", JSON.stringify(titles));
    formData.set("amounts", JSON.stringify(amounts));
    formAction(formData);
  }

  const canAdd = draft.length < CORRECTION_MAX;

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="-mx-4 overflow-x-auto px-4">
        <table className="border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 min-w-16 bg-surface px-2 py-2 text-left font-medium" />
              <th className="min-w-16 px-1 py-2 text-center font-medium">
                試合pt
              </th>
              {draft.map((row, rowIndex) => (
                <th key={rowIndex} className="min-w-20 px-1 py-1 font-normal">
                  <input
                    type="text"
                    value={row.title}
                    placeholder="タイトル"
                    aria-label={`補正${rowIndex + 1}のタイトル`}
                    onChange={(event) =>
                      updateTitle(rowIndex, event.target.value)
                    }
                    className="w-20 rounded-ui border border-line bg-field px-1 py-1 text-center text-sm"
                  />
                </th>
              ))}
              {canAdd ? (
                <th className="w-10 px-1 py-1 font-normal">
                  <button
                    type="button"
                    onClick={addColumn}
                    aria-label="列を追加"
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-ui border border-ink text-base leading-none ${pressableClass}`}
                  >
                    +
                  </button>
                </th>
              ) : null}
              <th className="sticky right-0 z-10 min-w-16 bg-surface px-2 py-2 text-center font-medium">
                合計pt
              </th>
            </tr>
          </thead>
          <tbody>
            {participants.map((participant, participantIndex) => {
              const adjustmentTotal = draft.reduce(
                (sum, row) =>
                  sum + parseAmountText(row.amounts[participantIndex] ?? ""),
                0,
              );
              const netTotal = participant.matchPoints + adjustmentTotal;
              return (
                <tr key={participant.id}>
                  <th className="sticky left-0 z-10 bg-surface px-2 py-1 text-left font-medium">
                    {participant.name}
                  </th>
                  <td className="px-1 py-2 text-center tabular-nums text-muted">
                    {formatPoints(participant.matchPoints)}
                  </td>
                  {draft.map((row, rowIndex) => (
                    <td key={rowIndex} className="px-1 py-1 text-center">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="0"
                        value={row.amounts[participantIndex] ?? ""}
                        aria-label={`${participant.name}の${row.title || `補正${rowIndex + 1}`}`}
                        onChange={(event) =>
                          updateAmount(
                            rowIndex,
                            participantIndex,
                            event.target.value,
                          )
                        }
                        className={cellInputClass}
                      />
                    </td>
                  ))}
                  {canAdd ? <td className="px-1 py-1" /> : null}
                  <td className="sticky right-0 z-10 bg-surface px-2 py-2 text-center tabular-nums">
                    {formatPoints(netTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {state.formError ? (
        <p className="text-sm text-muted">{state.formError}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className={`${blockButtonClass} disabled:opacity-60`}
      >
        保存する
      </button>
    </form>
  );
}
