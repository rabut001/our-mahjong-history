import { CellInput, CellRead, GridRow } from "@/components/ui";
import { formatPoints, type CalculatedRow } from "@/lib/domain";
import { AmountCell } from "./AmountCell";
import type { MatchFormPlayer } from "./types";

type ResultRowsProps = {
  seats: (MatchFormPlayer | null)[];
  calculatedById: Map<string, CalculatedRow>;
  umaEnabled: boolean;
  editBasePt: boolean;
  showUmaManual: boolean;
  umaTiedIds: Set<string>;
  onUpdateSeat: (index: number, patch: Partial<MatchFormPlayer>) => void;
};

export function ResultRows({
  seats,
  calculatedById,
  umaEnabled,
  editBasePt,
  showUmaManual,
  umaTiedIds,
  onUpdateSeat,
}: ResultRowsProps) {
  return (
    <>
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

      <GridRow label="基本pt">
        {seats.map((seat, index) => {
          const calc = seat
            ? calculatedById.get(seat.participantId)
            : undefined;
          const editable = Boolean(editBasePt && seat);
          if (!editable) {
            return (
              <CellRead key={`base-${index}`}>
                {calc ? formatPoints(calc.basePoints) : "—"}
              </CellRead>
            );
          }
          return (
            <CellInput
              key={`base-${index}`}
              type="number"
              step="0.1"
              value={seat?.baseOverride ?? calc?.basePoints ?? ""}
              aria-label={`${seat?.name}の基本pt`}
              onChange={(event) => {
                const raw = event.target.value;
                onUpdateSeat(index, {
                  baseOverride: raw === "" ? null : Number(raw),
                });
              }}
            />
          );
        })}
      </GridRow>

      {umaEnabled ? (
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
              <AmountCell
                key={`uma-${index}`}
                amount={seat?.umaPoints ?? 0}
                aria-label={`${seat?.name}のウマ`}
                onAmountChange={(amount) =>
                  onUpdateSeat(index, { umaPoints: amount })
                }
              />
            );
          })}
        </GridRow>
      ) : null}
    </>
  );
}
