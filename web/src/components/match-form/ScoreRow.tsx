import { CellInput, GridRow } from "@/components/ui";
import type { MatchFormPlayer } from "./types";

type ScoreRowProps = {
  seats: (MatchFormPlayer | null)[];
  startingScore: number;
  onUpdateSeat: (index: number, patch: Partial<MatchFormPlayer>) => void;
};

export function ScoreRow({
  seats,
  startingScore,
  onUpdateSeat,
}: ScoreRowProps) {
  return (
    <GridRow label="素点">
      {seats.map((seat, index) => (
        <CellInput
          key={`score-${index}`}
          type="number"
          inputMode="numeric"
          disabled={!seat}
          placeholder={seat ? String(startingScore) : undefined}
          value={seat?.score ?? ""}
          aria-label={seat ? `${seat.name}の素点` : `席${index + 1}の素点`}
          onChange={(event) => {
            const raw = event.target.value;
            onUpdateSeat(index, {
              score: raw === "" ? null : Number(raw),
            });
          }}
        />
      ))}
    </GridRow>
  );
}
