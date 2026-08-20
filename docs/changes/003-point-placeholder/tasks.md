# 003 タスク

進捗の正は [status.md](../../status.md)。作業の正は本ファイル。画面の正は [ui-spec.md](../../ui-spec.md)。

## 1 仕様

- [x] トビ・焼き鳥・その他・試合個別・手動ウマは 0 のとき空欄のまま。プレースホルダ `0`
- [x] 大会補正の数値欄も同じ
- [x] 空は 0 として計算（既存）

## 2 実装

- [x] `AmountCell` に `placeholder="0"`（空席の disabled には出さない）
- [x] `PointCorrectionForm` の数値欄に `placeholder="0"`
- [x] ui-spec を正へ
