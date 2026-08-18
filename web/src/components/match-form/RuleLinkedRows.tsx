import { GridRow, cellTitleClass } from "@/components/ui";
import { AmountCell } from "./AmountCell";
import type { MatchFormPlayer } from "./types";

type OtherName = {
  name: string;
  index: number;
};

type RuleLinkedRowsProps = {
  seats: (MatchFormPlayer | null)[];
  showTobi: boolean;
  yakitoriEnabled: boolean;
  otherNames: OtherName[];
  manualCount: number;
  manualTitles: [string, string, string];
  onManualTitlesChange: (titles: [string, string, string]) => void;
  onAddManualRow: () => void;
  onUpdateSeat: (index: number, patch: Partial<MatchFormPlayer>) => void;
};

export function RuleLinkedRows({
  seats,
  showTobi,
  yakitoriEnabled,
  otherNames,
  manualCount,
  manualTitles,
  onManualTitlesChange,
  onAddManualRow,
  onUpdateSeat,
}: RuleLinkedRowsProps) {
  const showInputRows =
    yakitoriEnabled || otherNames.length > 0 || showTobi || manualCount > 0;

  return (
    <>
      {showInputRows ? (
        <div
          className="border-t border-line"
          style={{ gridColumn: "1 / -1" }}
        />
      ) : null}

      {showTobi ? (
        <GridRow label="トビ">
          {seats.map((seat, index) => (
            <AmountCell
              key={`tobi-${index}`}
              amount={seat?.tobiPoints ?? 0}
              disabled={!seat}
              aria-label={seat ? `${seat.name}のトビ` : `席${index + 1}のトビ`}
              onAmountChange={(amount) =>
                onUpdateSeat(index, { tobiPoints: amount })
              }
            />
          ))}
        </GridRow>
      ) : null}

      {yakitoriEnabled ? (
        <GridRow label="焼き鳥">
          {seats.map((seat, index) => (
            <AmountCell
              key={`yakitori-${index}`}
              amount={seat?.yakitoriPoints ?? 0}
              disabled={!seat}
              aria-label={
                seat ? `${seat.name}の焼き鳥` : `席${index + 1}の焼き鳥`
              }
              onAmountChange={(amount) =>
                onUpdateSeat(index, { yakitoriPoints: amount })
              }
            />
          ))}
        </GridRow>
      ) : null}

      {otherNames.map((item) => (
        <GridRow key={item.index} label={item.name}>
          {seats.map((seat, index) => (
            <AmountCell
              key={`other-${item.index}-${index}`}
              amount={seat?.otherPoints[item.index] ?? 0}
              disabled={!seat}
              aria-label={
                seat
                  ? `${seat.name}の${item.name}`
                  : `席${index + 1}の${item.name}`
              }
              onAmountChange={(amount) => {
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
                next[item.index] = amount;
                onUpdateSeat(index, { otherPoints: next });
              }}
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
                onManualTitlesChange(next);
              }}
              className={cellTitleClass}
            />
          }
        >
          {seats.map((seat, index) => (
            <AmountCell
              key={`manual-${titleIndex}-${index}`}
              amount={seat?.manualPoints[titleIndex] ?? 0}
              disabled={!seat}
              aria-label={
                seat
                  ? `${seat.name}の${manualTitles[titleIndex] || `試合個別${titleIndex + 1}`}`
                  : `席${index + 1}の試合個別${titleIndex + 1}`
              }
              onAmountChange={(amount) => {
                if (!seat) {
                  return;
                }
                const next = [...seat.manualPoints] as [number, number, number];
                next[titleIndex] = amount;
                onUpdateSeat(index, { manualPoints: next });
              }}
            />
          ))}
        </GridRow>
      ))}

      {manualCount < 3 ? (
        <button
          type="button"
          onClick={onAddManualRow}
          className="py-1 text-left text-sm text-muted"
          style={{ gridColumn: "1 / -1" }}
        >
          行を追加
        </button>
      ) : null}
    </>
  );
}
