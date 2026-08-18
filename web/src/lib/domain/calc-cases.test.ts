import { describe, expect, it } from "vitest";
import {
  calculateMatchPoints,
  formatHeldOn,
  formatPoints,
  isScoreTotalMismatched,
  summarizeTournament,
} from "@/lib/domain";
import type { MatchRule, ScoreRow, Seat } from "@/lib/domain";

const SEATS_4: Seat[] = ["east", "south", "west", "north"];
const SEATS_3: Seat[] = ["east", "south", "west"];

const R4: MatchRule = {
  playerCount: 4,
  startingScore: 25000,
  returnScore: 30000,
  okaTieHandling: "kamicha",
  umaEnabled: true,
  umaTieHandling: "kamicha",
  umaPoints1: 30,
  umaPoints2: 10,
  rate: 1,
};

const R3: MatchRule = {
  playerCount: 3,
  startingScore: 35000,
  returnScore: 40000,
  okaTieHandling: "kamicha",
  umaEnabled: true,
  umaTieHandling: "kamicha",
  umaPoints1: 10,
  umaPoints2: null,
  rate: 1,
};

function tenths(values: number[]): number[] {
  return values.map((value) => Math.round(value * 10) / 10);
}

function rowsFor(
  scores: number[],
  extras: Partial<ScoreRow>[] = [],
): ScoreRow[] {
  const seats = scores.length === 3 ? SEATS_3 : SEATS_4;
  return scores.map((score, index) => ({
    participantId: seats[index] ?? `p${index}`,
    seat: seats[index] ?? "east",
    score,
    tobiPoints: 0,
    yakitoriPoints: 0,
    otherPoints: [0, 0, 0, 0, 0],
    manualPoints: [0, 0, 0],
    ...extras[index],
  }));
}

function calc(
  scores: number[],
  rule: MatchRule = R4,
  extras?: Partial<ScoreRow>[],
) {
  return calculateMatchPoints(rowsFor(scores, extras), rule);
}

describe("P-rank-01", () => {
  it("素点順で 1, 2, 3, 4", () => {
    const rows = calc([40000, 30000, 20000, 10000]);
    expect(rows.map((row) => row.rank)).toEqual([1, 2, 3, 4]);
  });
});

describe("P-rank-02", () => {
  it("2 位同着は 1, 2, 2, 4", () => {
    const rows = calc([40000, 25000, 25000, 10000]);
    expect(rows.map((row) => row.rank)).toEqual([1, 2, 2, 4]);
  });
});

describe("P-rank-03", () => {
  it("1 位同着は 1, 1, 3, 4", () => {
    const rows = calc([30000, 30000, 25000, 15000]);
    expect(rows.map((row) => row.rank)).toEqual([1, 1, 3, 4]);
  });
});

describe("P-rank-04", () => {
  it("全員同点は 1, 1, 1, 1", () => {
    const rows = calc([25000, 25000, 25000, 25000]);
    expect(rows.map((row) => row.rank)).toEqual([1, 1, 1, 1]);
  });
});

describe("P-rank-05", () => {
  it("三麻の 2 位同着は 1, 2, 2", () => {
    const rows = calc([50000, 27500, 27500], R3);
    expect(rows.map((row) => row.rank)).toEqual([1, 2, 2]);
  });
});

describe("P-rank-06", () => {
  it("オカ上家取りで基本 pt が分かれても順位は素点", () => {
    const rows = calc([30000, 30000, 25000, 15000]);
    expect(rows.map((row) => row.rank)).toEqual([1, 1, 3, 4]);
    expect(tenths(rows.map((row) => row.basePoints))).toEqual([20, 0, -5, -15]);
  });
});

describe("P-oka-01", () => {
  it("1 位が 1 人ならオカ 20 を東へ", () => {
    const rows = calc([40000, 30000, 20000, 10000]);
    expect(tenths(rows.map((row) => row.basePoints))).toEqual([
      30, 0, -10, -20,
    ]);
  });
});

describe("P-oka-02", () => {
  it("1 位同着の上家がオカ全部", () => {
    const rows = calc([30000, 30000, 25000, 15000]);
    expect(tenths(rows.map((row) => row.basePoints))).toEqual([20, 0, -5, -15]);
  });
});

describe("P-oka-03", () => {
  it("オカ折半は 1 位同着で 10 ずつ", () => {
    const rows = calc([30000, 30000, 25000, 15000], {
      ...R4,
      okaTieHandling: "split",
    });
    expect(tenths(rows.map((row) => row.basePoints))).toEqual([
      10, 10, -5, -15,
    ]);
  });
});

describe("P-oka-04", () => {
  it("オカ 20 を 3 人折半すると 6.7, 6.7, 6.6", () => {
    const rows = calc([30000, 30000, 30000, 10000], {
      ...R4,
      okaTieHandling: "split",
    });
    expect(tenths(rows.map((row) => row.basePoints))).toEqual([
      6.7, 6.7, 6.6, -20,
    ]);
  });
});

describe("P-oka-05", () => {
  it("同着 1 位が南・西・北なら東は対象外", () => {
    const rows = calc([10000, 30000, 30000, 30000], {
      ...R4,
      okaTieHandling: "split",
    });
    expect(tenths(rows.map((row) => row.basePoints))).toEqual([
      -20, 6.7, 6.7, 6.6,
    ]);
  });
});

describe("P-oka-06", () => {
  it("三麻オカ 15 を 2 人折半", () => {
    const rows = calc([40000, 40000, 25000], {
      ...R3,
      okaTieHandling: "split",
    });
    expect(tenths(rows.map((row) => row.basePoints))).toEqual([7.5, 7.5, -15]);
  });
});

describe("P-oka-07", () => {
  it("オカ手動でも 1 位が 1 人なら自動", () => {
    const rows = calc([40000, 30000, 20000, 10000], {
      ...R4,
      okaTieHandling: "manual",
    });
    expect(tenths(rows.map((row) => row.basePoints))).toEqual([
      30, 0, -10, -20,
    ]);
  });
});

describe("P-oka-08", () => {
  it("1 位同着の手動は全員の基本 pt 手入力", () => {
    const rows = calc(
      [30000, 30000, 25000, 15000],
      { ...R4, okaTieHandling: "manual" },
      [
        { baseOverride: 12 },
        { baseOverride: 8 },
        { baseOverride: -5 },
        { baseOverride: -15 },
      ],
    );
    expect(tenths(rows.map((row) => row.basePoints))).toEqual([12, 8, -5, -15]);
  });
});

describe("P-uma-01", () => {
  it("四麻のウマは 30 / 10 / -10 / -30", () => {
    const rows = calc([40000, 30000, 20000, 10000]);
    expect(tenths(rows.map((row) => row.umaPoints))).toEqual([
      30, 10, -10, -30,
    ]);
  });
});

describe("P-uma-02", () => {
  it("ウマなしは 0", () => {
    const rows = calc([40000, 30000, 20000, 10000], {
      ...R4,
      umaEnabled: false,
      umaTieHandling: null,
      umaPoints1: null,
      umaPoints2: null,
    });
    expect(tenths(rows.map((row) => row.umaPoints))).toEqual([0, 0, 0, 0]);
  });
});

describe("P-uma-03", () => {
  it("三麻のウマは 10 / 0 / -10", () => {
    const rows = calc([50000, 40000, 15000], R3);
    expect(tenths(rows.map((row) => row.umaPoints))).toEqual([10, 0, -10]);
  });
});

describe("P-uma-04", () => {
  it("2 位同着の上家取りは順位を分けずウマだけ分ける", () => {
    const rows = calc([40000, 25000, 25000, 10000]);
    expect(rows.map((row) => row.rank)).toEqual([1, 2, 2, 4]);
    expect(tenths(rows.map((row) => row.umaPoints))).toEqual([
      30, 10, -10, -30,
    ]);
  });
});

describe("P-uma-05", () => {
  it("2 位同着の折半は +10 と -10 を分ける", () => {
    const rows = calc([40000, 25000, 25000, 10000], {
      ...R4,
      umaTieHandling: "split",
    });
    expect(rows.map((row) => row.rank)).toEqual([1, 2, 2, 4]);
    expect(tenths(rows.map((row) => row.umaPoints))).toEqual([30, 0, 0, -30]);
  });
});

describe("P-uma-06", () => {
  it("1 位同着の折半は +30 と +10 を分ける", () => {
    const rows = calc([30000, 30000, 25000, 15000], {
      ...R4,
      umaTieHandling: "split",
    });
    expect(tenths(rows.map((row) => row.umaPoints))).toEqual([
      20, 20, -10, -30,
    ]);
  });
});

describe("P-uma-07", () => {
  it("1〜3 位スロット合計 30 を 3 人で分ける", () => {
    const rows = calc([30000, 30000, 30000, 10000], {
      ...R4,
      umaTieHandling: "split",
    });
    expect(tenths(rows.map((row) => row.umaPoints))).toEqual([10, 10, 10, -30]);
  });
});

describe("P-uma-08", () => {
  it("ウマ 20 を 3 人折半すると 6.7, 6.7, 6.6", () => {
    const rows = calc([30000, 30000, 30000, 10000], {
      ...R4,
      umaTieHandling: "split",
      umaPoints1: 20,
      umaPoints2: 10,
    });
    expect(tenths(rows.map((row) => row.umaPoints))).toEqual([
      6.7, 6.7, 6.6, -20,
    ]);
  });
});

describe("P-uma-09", () => {
  it("負の折半は上家が大きくなる", () => {
    const rows = calc([40000, 20000, 20000, 20000], {
      ...R4,
      umaTieHandling: "split",
      umaPoints1: 20,
      umaPoints2: 10,
    });
    expect(tenths(rows.map((row) => row.umaPoints))).toEqual([
      20, -6.6, -6.7, -6.7,
    ]);
  });
});

describe("P-uma-10", () => {
  it("ウマ手動は同着席だけ手入力", () => {
    const rows = calc(
      [40000, 25000, 25000, 10000],
      { ...R4, umaTieHandling: "manual" },
      [{}, { umaOverride: 4 }, { umaOverride: -4 }, {}],
    );
    expect(tenths(rows.map((row) => row.umaPoints))).toEqual([30, 4, -4, -30]);
  });
});

describe("P-sum-01", () => {
  it("基本+ウマが合計・反映 pt", () => {
    const rows = calc([40000, 30000, 20000, 10000]);
    expect(tenths(rows.map((row) => row.totalPoints))).toEqual([
      60, 10, -20, -50,
    ]);
    expect(tenths(rows.map((row) => row.points))).toEqual([60, 10, -20, -50]);
  });
});

describe("P-sum-02", () => {
  it("反映 pt は合計 × レート", () => {
    const rows = calc([40000, 30000, 20000, 10000], { ...R4, rate: 0.5 });
    expect(tenths(rows.map((row) => row.points))).toEqual([30, 5, -10, -25]);
  });
});

describe("P-sum-03", () => {
  it("レート 0 なら反映 pt は 0", () => {
    const rows = calc([40000, 30000, 20000, 10000], { ...R4, rate: 0 });
    expect(tenths(rows.map((row) => row.points))).toEqual([0, 0, 0, 0]);
  });
});

describe("P-sum-04", () => {
  it("手入力内訳を加算してからレート", () => {
    const rows = calc([40000, 30000, 20000, 10000], R4, [
      { tobiPoints: 5 },
      { yakitoriPoints: -2 },
      { otherPoints: [1, 0, 0, 0, 0] },
      { manualPoints: [3, 0, 0] },
    ]);
    expect(tenths(rows.map((row) => row.totalPoints))).toEqual([
      65, 8, -19, -47,
    ]);
  });
});

describe("P-int-01", () => {
  it("オカとウマを分けて折半すると順位点按分と一致", () => {
    const rows = calc([30000, 30000, 30000, 10000], {
      ...R4,
      okaTieHandling: "split",
      umaTieHandling: "split",
    });
    expect(tenths(rows.map((row) => row.basePoints))).toEqual([
      6.7, 6.7, 6.6, -20,
    ]);
    expect(tenths(rows.map((row) => row.umaPoints))).toEqual([10, 10, 10, -30]);
    expect(tenths(rows.map((row) => row.totalPoints))).toEqual([
      16.7, 16.7, 16.6, -50,
    ]);
  });
});

describe("P-warn-01", () => {
  it("合計が持ち点×人数なら警告しない", () => {
    expect(isScoreTotalMismatched([40000, 30000, 20000, 10000], 25000, 4)).toBe(
      false,
    );
  });
});

describe("P-warn-02", () => {
  it("合計が違うとき警告する", () => {
    expect(isScoreTotalMismatched([40000, 30000, 20000, 11000], 25000, 4)).toBe(
      true,
    );
  });
});

describe("P-warn-03", () => {
  it("三麻で合計が一致なら警告しない", () => {
    expect(isScoreTotalMismatched([50000, 40000, 15000], 35000, 3)).toBe(false);
  });
});

describe("P-fmt-01", () => {
  it("正のポイントは符号付き", () => {
    expect(formatPoints(12.3)).toBe("+12.3");
  });
});

describe("P-fmt-02", () => {
  it("0 は符号なし", () => {
    expect(formatPoints(0)).toBe("0.0");
  });
});

describe("P-fmt-03", () => {
  it("負のポイント", () => {
    expect(formatPoints(-4)).toBe("-4.0");
  });
});

describe("P-fmt-04", () => {
  it("開催日は月日の先頭ゼロなし", () => {
    expect(formatHeldOn("2026-08-18")).toBe("2026年8月18日");
  });
});

describe("P-tny-01", () => {
  it("試合 pt を足す", () => {
    const { ranked } = summarizeTournament([
      { id: "A", matchPoints: [10, 5], adjustments: [] },
      { id: "B", matchPoints: [-8], adjustments: [] },
    ]);
    expect(ranked.map((row) => [row.id, row.matchPointTotal])).toEqual([
      ["A", 15],
      ["B", -8],
    ]);
  });
});

describe("P-tny-02", () => {
  it("最終 pt は試合合計+修正", () => {
    const { ranked } = summarizeTournament([
      { id: "A", matchPoints: [15], adjustments: [3, -1] },
      { id: "B", matchPoints: [-8], adjustments: [] },
    ]);
    expect(ranked.map((row) => [row.id, row.finalPoints])).toEqual([
      ["A", 17],
      ["B", -8],
    ]);
  });
});

describe("P-tny-03", () => {
  it("最終順位は最終 pt 順", () => {
    const { ranked } = summarizeTournament([
      { id: "A", matchPoints: [20], adjustments: [] },
      { id: "B", matchPoints: [10], adjustments: [] },
      { id: "C", matchPoints: [-5], adjustments: [] },
      { id: "D", matchPoints: [-25], adjustments: [] },
    ]);
    expect(ranked.map((row) => [row.id, row.rank])).toEqual([
      ["A", 1],
      ["B", 2],
      ["C", 3],
      ["D", 4],
    ]);
  });
});

describe("P-tny-04", () => {
  it("最終 pt 同着は 1, 1, 3, 4", () => {
    const { ranked } = summarizeTournament([
      { id: "A", matchPoints: [10], adjustments: [] },
      { id: "B", matchPoints: [10], adjustments: [] },
      { id: "C", matchPoints: [5], adjustments: [] },
      { id: "D", matchPoints: [-25], adjustments: [] },
    ]);
    expect(ranked.map((row) => [row.id, row.rank])).toEqual([
      ["A", 1],
      ["B", 1],
      ["C", 3],
      ["D", 4],
    ]);
  });
});

describe("P-tny-05", () => {
  it("未出場は修正があっても順位対象外", () => {
    const { ranked, unplayed } = summarizeTournament([
      { id: "A", matchPoints: [10], adjustments: [] },
      { id: "B", matchPoints: [5], adjustments: [] },
      { id: "C", matchPoints: [], adjustments: [50] },
    ]);
    expect(ranked.map((row) => [row.id, row.rank])).toEqual([
      ["A", 1],
      ["B", 2],
    ]);
    expect(unplayed.map((row) => [row.id, row.adjustmentTotal])).toEqual([
      ["C", 50],
    ]);
  });
});

describe("P-tny-06", () => {
  it("保存済みの試合 pt をそのまま足す", () => {
    const { ranked } = summarizeTournament([
      { id: "A", matchPoints: [30, 4.5], adjustments: [] },
    ]);
    expect(ranked[0]?.matchPointTotal).toBe(34.5);
  });
});
