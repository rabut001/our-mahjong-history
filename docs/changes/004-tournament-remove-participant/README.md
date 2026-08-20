# 004 大会の「外す」が動かない

状態: **完了**

## 目的

大会の作成・編集で、参加者とゲストの「外す」が実際に外れるようにする。確認ダイアログは出さない。試合に出ている人も外せる。画面全体はリロードしない。

## 正

| 種類 | ファイル |
|------|----------|
| 画面 | [ui-spec.md の削除 UI](../../ui-spec.md#削除-ui) / [大会](../../ui-spec.md#大会) |
| ER | [er.md の削除方針](../../er.md#削除方針phase-3-の-fk-用) |
| DB ケース | [test-cases.md](../../test-cases.md)（C-participants-08 / C-fk-01） |
| ドメイン | [overview.md](../../overview.md) |

## 作業文書

- [tasks.md](tasks.md)

## やらないこと

- `e2e-cases.md` へのケース追加
- Phase 6
