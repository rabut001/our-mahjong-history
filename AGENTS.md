# AI エージェント向けガイド

**俺たちの雀歴**の開発支援時の入口ドキュメント。新規セッションではまず本ファイルを読み、必要に応じてリンク先を参照すること。

## プロジェクト名称

| 用途 | 名称 | 例 |
|------|------|-----|
| 日本語（UI・ドキュメント） | **俺たちの雀歴** | 画面タイトル、`<title>`、説明文 |
| 英語（開発用識別子） | **Our Mahjong History** | リポジトリ名、`package.json` の `name`、コード内定数 |

英語名の kebab-case: `our-mahjong-history`。詳細は [docs/tech-stack.md](docs/tech-stack.md#プロジェクト名称) を参照。

## プロジェクト概要（要約）

麻雀仲間の **コミュニティ** 単位で、**麻雀大会** と **試合（半荘）** の記録を管理する Web アプリ「俺たちの雀歴」。複数ユーザーが参加するコミュニティ型。MVP は対局記録の登録・一覧・編集。

```
コミュニティ → 麻雀大会（複数） → 試合 / 半荘（複数）
```

## 読む順序

1. 本ファイル（AGENTS.md）— 全体像と最重要ルール
2. [docs/status.md](docs/status.md) — **現在のフェーズ・次のアクション**
3. [docs/overview.md](docs/overview.md) — アプリ要件・ドメインモデル・用語定義
4. [docs/development.md](docs/development.md) — 開発フェーズの定義・進め方
5. [docs/tech-stack.md](docs/tech-stack.md) — 言語・プラットフォーム・技術選定
6. 作業内容に応じて [.cursor/rules/](.cursor/rules/) のルールを参照

## ドキュメント一覧

| 用途 | ファイル |
|------|----------|
| **進捗・現在フェーズ** | [docs/status.md](docs/status.md) |
| アプリ概要・ドメイン・MVP 範囲 | [docs/overview.md](docs/overview.md) |
| 開発フェーズの定義・進め方 | [docs/development.md](docs/development.md) |
| 技術スタック・言語・プラットフォーム | [docs/tech-stack.md](docs/tech-stack.md) |
| 具体タスク（Phase 0 以降） | [docs/tasks.md](docs/tasks.md) |
| UI 仕様（モックフェーズ後） | `docs/ui-spec.md`（未作成） |
| コア方針（Cursor 常時適用） | [.cursor/rules/00-core.mdc](.cursor/rules/00-core.mdc) |

## 進捗

→ [docs/status.md](docs/status.md)（セッション開始時に確認）

## 最重要ルール（要約）

1. **UI 言語**: 日本語のみ。アプリ名は **俺たちの雀歴**
2. **名称の使い分け**: UI 表記は「俺たちの雀歴」、コード識別子は `our-mahjong-history` / Our Mahjong History
3. **モバイルファースト**: スマホ利用を主とする。PC 表示は妥協可
4. **ドメイン用語**: 「点数」= 半荘終了時の持ち点、「ポイント」= ウマ・オカ等を加味した値（混同しない）
5. **記録単位**: 局単位は不要。試合（半荘）単位のみ
6. **セキュリティ**: Supabase RLS を必ず使用。コミュニティメンバーのみデータにアクセス可能
7. **開発スタイル**: 小さく区切って確認しながら進める（1 機能 = 1 セッション推奨）
8. **スコープ管理**: MVP 外（写真、統計、PC 最適化等）は明示的に依頼されるまで着手しない
9. **開発実行環境**: ホストに Node は置かない。Dev Container 内、または `docker compose exec app`
10. **データアクセス**: 独自 REST は作らない。読み取りは RSC→Supabase、更新は Server Action 内の Supabase 呼び出し

## エージェント向け作業指針

- 実装前に [docs/overview.md](docs/overview.md) でドメインを確認する
- フェーズを飛ばさず、[docs/development.md](docs/development.md) の順序に従う
- DB 変更は migration SQL として管理する
- フェーズや作業が進んだら [docs/status.md](docs/status.md) を更新する
- ドメイン用語に変更があれば [docs/overview.md](docs/overview.md) を更新する
- コミット・PR はユーザーが明示的に依頼した場合のみ作成する
- Node / npm はホストで実行しない。Dev Container 内、または `docker compose exec app`
