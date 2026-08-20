# 004 タスク

進捗の正は [status.md](../../status.md)。作業の正は本ファイル。画面の正は [ui-spec.md](../../ui-spec.md)。

`e2e-cases.md` は増やさない。

## キックオフ

- [x] 編集の「外す」は `TournamentForm` 内の入れ子 form が無効で、`removeParticipantAction` に届かない
- [x] 作成の「外す」は `type="button"` + ローカル state。入れ子 form は使っていない
- [x] 方針は入れ子 form をやめて、ボタンの click で `FormData` を渡す（ポイント補正と同じ）
- [x] 試合に出ている人も外せる（離脱と同じく「記録があるから止めない」）。その大会のその人の試合結果は CASCADE。試合の行は残る
- [x] 全画面リロードの原因は成功後の `redirect`。やめて一覧をその場で更新する

## 1 画面

- [x] `RemoveButton`: 内側の `<form>` をやめる。`type="button"` + `formAction(formData)`
- [x] 成功時は `redirect` しない。クリックと同時に行を外し、保存は背後で行う
- [x] 失敗時の `formError` を出す
- [x] ui-spec: 試合に出ている人も外せる。試合結果も消える。画面全体はリロードしない

## 2 DB

- [x] `match_results.tournament_participant_id` を ON DELETE CASCADE
- [x] er.md / overview.md / test-cases.md（C-participants-08 / C-fk-01）

## 3 確認

- [x] `npm run lint` / `typecheck` / `format:check`（コンテナ内）
- [x] `supabase test db`（C-participants-08 / C-fk-01）
