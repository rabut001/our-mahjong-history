import { CellSelect } from "@/components/ui";
import { SEAT_LABEL, type SeatKey } from "./helpers";
import type { MatchFormParticipant, MatchFormPlayer } from "./types";

type SeatColumnsProps = {
  winds: readonly SeatKey[];
  seats: (MatchFormPlayer | null)[];
  participants: MatchFormParticipant[];
  selectedIds: Set<string>;
  onAssign: (index: number, participantId: string) => void;
};

export function SeatColumns({
  winds,
  seats,
  participants,
  selectedIds,
  onAssign,
}: SeatColumnsProps) {
  return (
    <>
      <div />
      {winds.map((wind) => (
        <p key={wind} className="text-center text-xs">
          {SEAT_LABEL[wind]}
        </p>
      ))}
      <div />
      {seats.map((seat, index) => {
        const options = participants.filter(
          (participant) =>
            participant.id === seat?.participantId ||
            !selectedIds.has(participant.id),
        );
        const wind = winds[index] ?? "east";
        return (
          <CellSelect
            key={`name-${index}`}
            value={seat?.participantId ?? ""}
            aria-label={`${SEAT_LABEL[wind]}の参加者`}
            onChange={(event) => onAssign(index, event.target.value)}
          >
            <option value="">選ぶ</option>
            {options.map((participant) => (
              <option key={participant.id} value={participant.id}>
                {participant.name}
              </option>
            ))}
          </CellSelect>
        );
      })}
    </>
  );
}
