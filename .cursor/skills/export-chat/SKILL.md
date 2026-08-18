---
name: export-chat
description: >-
  Exports the current Cursor agent transcript to chat-exports/ as Markdown
  (personal archive, not project docs). Use when the user asks to export the
  conversation, 会話を出力, 会話をエクスポート, chat-exports, chart-exports,
  transcript, or セッションをアーカイブ.
---

# 会話を chat-exports に出す

個人保管用の生ログ。プロジェクトの正（overview / ui-spec 等）ではない。過去の `chat-exports/` は書き換えない。

出力先は **`chat-exports/`**（`chart-exports` ではない）。形式の正は既存の `chat-exports/*/transcript.md`。

変換は手で Markdown を書かず、スクリプトに任せる。

## 手順

1. スラッグを決める。英語 kebab-case。会話の主題が分かる短い語（例: `phase-2-8`、`mahjong-group-naming`）。ユーザー指定があればそれを使う。
2. ソース JSONL を特定する。
   - 今のセッションなら、会話の最初のユーザー文が先頭にあるファイル。
   - 分からなければ `--latest`（更新時刻が一番新しい JSONL）。
3. Dev Container 内（または `docker compose -f .devcontainer/docker-compose.yml exec app`）でスクリプトを実行する。ホストで `node` を呼ばない。
4. 標準出力のパスをユーザーに伝える。
5. コミットはユーザーが依頼したときだけ。

## スクリプト

```bash
node .cursor/skills/export-chat/scripts/export-chat.mjs --slug <kebab-slug>
```

| 引数 | 意味 |
|------|------|
| `--slug` | 必須。フォルダ名の末尾 |
| `--jsonl <path>` | ソース JSONL。省略時は transcripts 配下の最新 |
| `--latest` | `--jsonl` 省略と同じ |
| `--repo <dir>` | リポジトリルート。省略時は `AGENTS.md` があるディレクトリ |
| `--force` | 既存フォルダを上書き |

出力:

```
chat-exports/YYYY-MM-DD_HH-MM-<slug>-session/transcript.md
```

`YYYY-MM-DD_HH-MM` は最初のユーザー発言の時刻（UTC+9）。ソースは `agent-transcripts` の JSONL。

例:

```bash
node .cursor/skills/export-chat/scripts/export-chat.mjs --slug mahjong-group-naming
node .cursor/skills/export-chat/scripts/export-chat.mjs --slug phase-2-8 --jsonl /root/.cursor/projects/workspace/agent-transcripts/aa694c53-dfa6-4809-b026-29efa74da3a5/aa694c53-dfa6-4809-b026-29efa74da3a5.jsonl
```

コンテナ外から:

```bash
docker compose -f .devcontainer/docker-compose.yml exec app node .cursor/skills/export-chat/scripts/export-chat.mjs --slug <kebab-slug>
```

## 注意

- 依存パッケージは使わない（Node の標準ライブラリのみ）
- ツール結果は JSONL に無いので出さない。ツール呼び出しの引数だけ出す
- 既存ディレクトリがあるときは `--force` なしで失敗する。過去ログを消さない
