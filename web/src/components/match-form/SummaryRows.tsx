import { CellRead, GridRow } from "@/components/ui";
import { formatPoints, type CalculatedRow } from "@/lib/domain";
import type { MatchFormPlayer } from "./types";

type SummaryRowsProps = {
  seats: (MatchFormPlayer | null)[];
  calculatedById: Map<string, CalculatedRow>;
  rate: number;
};

export function SummaryRows({ seats, calculatedById, rate }: SummaryRowsProps) {
  return (
    <>
      <div className="border-t border-line" style={{ gridColumn: "1 / -1" }} />

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
          <CellRead key={`rate-${index}`}>{rate.toFixed(1)}</CellRead>
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
    </>
  );
}
