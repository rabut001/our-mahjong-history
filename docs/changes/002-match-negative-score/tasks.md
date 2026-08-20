# 002 タスク

進捗の正は [status.md](../../status.md)。作業の正は本ファイル。計算の正は [calc-cases.md](../../calc-cases.md)。画面の正は [ui-spec.md](../../ui-spec.md)。

`e2e-cases.md` は増やさない。画面の確認は既存 E-17 の Playwright で、素点を 1 文字ずつ打って負が残ることを見る。

## キックオフ

- [x] 原因は `ScoreRow` の `type="number"` + `inputMode="numeric"` + 制御コンポーネントが `-` を消すこと
- [x] DB / 計算は負の素点を拒否していない
- [x] e2e-cases は増やさない。calc-cases と Vitest に負の素点を足す

## 1 計算ケース

実装より前に正へ書く。既存の式のまま、負の素点を通す。

- [x] P-rank-07 / P-oka-09 / P-sum-05 / P-warn-04（同じ点数）
- [x] Vitest が ID と 1 対 1
- [x] ID 一覧の件数

## 2 画面

- [x] `ScoreRow`: 入力中の `-` を残す。整数のみ。`inputMode="numeric"` を外す
- [x] ui-spec: 素点は整数で、0 や負も入力できる

## 3 確認

- [x] `npm test`（Vitest）
- [x] Playwright: 素点を 1 文字ずつ打って `-5000` が残る。保存値は E-17 のまま。e2e-cases は変えない
