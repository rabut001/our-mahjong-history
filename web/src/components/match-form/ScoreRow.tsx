"use client";

import { useState } from "react";
import { CellInput, GridRow } from "@/components/ui";
import { parseScoreDraft, SCORE_DRAFT } from "./helpers";
import type { MatchFormPlayer } from "./types";

type ScoreRowProps = {
  seats: (MatchFormPlayer | null)[];
  startingScore: number;
  onUpdateSeat: (index: number, patch: Partial<MatchFormPlayer>) => void;
};

type ScoreCellProps = {
  seat: MatchFormPlayer | null;
  index: number;
  startingScore: number;
  onUpdateSeat: (index: number, patch: Partial<MatchFormPlayer>) => void;
};

function ScoreCell({
  seat,
  index,
  startingScore,
  onUpdateSeat,
}: ScoreCellProps) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <CellInput
      type="text"
      autoComplete="off"
      disabled={!seat}
      placeholder={seat ? String(startingScore) : undefined}
      value={draft ?? seat?.score ?? ""}
      aria-label={seat ? `${seat.name}の素点` : `席${index + 1}の素点`}
      onChange={(event) => {
        const raw = event.target.value;
        if (!SCORE_DRAFT.test(raw)) {
          return;
        }
        setDraft(raw);
        onUpdateSeat(index, { score: parseScoreDraft(raw) });
      }}
      onBlur={() => setDraft(null)}
    />
  );
}

export function ScoreRow({
  seats,
  startingScore,
  onUpdateSeat,
}: ScoreRowProps) {
  return (
    <GridRow label="素点">
      {seats.map((seat, index) => (
        <ScoreCell
          key={`score-${index}-${seat?.participantId ?? "empty"}`}
          seat={seat}
          index={index}
          startingScore={startingScore}
          onUpdateSeat={onUpdateSeat}
        />
      ))}
    </GridRow>
  );
}
