# 変更（MVP 後の作業）

Phase 0〜5 の記録は [tasks.md](../tasks.md)。以降の修正・改善はここ。Phase 6（写真・統計・PC 最適化）とは混ぜない。

正は既存の `docs/*.md`（[ui-spec.md](../ui-spec.md) 等）。このフォルダは作業文書。残す決定は完了時に正へ移す。フォルダは消さない。

## 使い方

- 1 変更 = 1 フォルダ。名前は `NNN-kebab-slug`（3 桁ゼロ埋め）
- 必須: `README.md`（概要）、`tasks.md`（セッションのチェックリスト）
- 論点があるとき: `kickoff.md`。調査が要るときだけ `notes.md`
- 画面・E2E・認証方針は正を直接直す。ここへ全文をコピーしない
- 着手したら [status.md](../status.md) の「次のアクション」をこのフォルダへ
- フォルダを足したら下の一覧に 1 行足す

## 一覧

| 番号 | フォルダ | 状態 | 概要 |
|------|----------|------|------|
| 001 | [001-login-signup](001-login-signup/) | 完了 | ログイン・アカウント作成の修正・改善 |
| 002 | [002-match-negative-score](002-match-negative-score/) | 完了 | 試合の素点にマイナスを入力できない |
| 003 | [003-point-placeholder](003-point-placeholder/) | 完了 | ポイント入力のプレースホルダに 0 を出す |
| 004 | [004-tournament-remove-participant](004-tournament-remove-participant/) | 完了 | 大会の参加者とゲストの「外す」が動かない |
