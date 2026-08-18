# AI エージェント向けガイド

**俺たちの雀歴**の開発支援時の入口ドキュメント。新規セッションではまず本ファイルを読み、必要に応じてリンク先を参照すること。

## プロジェクト名称

| 用途 | 名称 | 例 |
|------|------|-----|
| 日本語（UI・ドキュメント） | **俺たちの雀歴** | 画面タイトル、`<title>`、説明文 |
| 英語（開発用識別子） | **Our Mahjong History** | リポジトリ名、`package.json` の `name`、コード内定数 |

英語名の kebab-case: `our-mahjong-history`。詳細は [docs/tech-stack.md](docs/tech-stack.md#プロジェクト名称) を参照。

## プロジェクト概要（要約）

麻雀仲間の **麻雀グループ** 単位で、**麻雀大会** と **試合（半荘）** の記録を管理する Web アプリ「俺たちの雀歴」。複数ユーザーが所属する麻雀グループのデータを共有する。MVP は対局記録の登録・一覧・編集。

```
麻雀グループ → 麻雀大会（複数） → 試合 / 半荘（複数）
```

## 禁止事項（厳守）

本アプリは **対局記録専用** である。麻雀には賭け事のイメージがあるが、**賭け麻雀・金銭のやり取りは扱わない**。賭博は法律に違反する犯罪である。

- 扱う値は **点数**（持ち点）、**基本ポイント**、**ポイント**（ウマ・レート等を加味した得点）のみ
- **金額・通貨・精算・支払い・賭け金** は対象外。円換算もしない
- UI・コード・ドキュメント・説明・提案に「金額」という言葉を出さない
- 「レート」はポイント計算の係数であり、円単価・賭け金単価ではない

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
| ER（属性・制約・Mermaid） | [docs/er.md](docs/er.md) |
| 開発フェーズの定義・進め方 | [docs/development.md](docs/development.md) |
| 技術スタック・言語・プラットフォーム | [docs/tech-stack.md](docs/tech-stack.md) |
| 具体タスク（Phase 0 以降） | [docs/tasks.md](docs/tasks.md) |
| DB / RLS テストケース | [docs/test-cases.md](docs/test-cases.md)（Phase 3-3 で作成） |
| ポイント計算ケース | [docs/calc-cases.md](docs/calc-cases.md)（Phase 4-1 で作成） |
| UI 仕様（画面・部品・トークン） | [docs/ui-spec.md](docs/ui-spec.md) |
| コア方針（Cursor 常時適用） | [.cursor/rules/00-core.mdc](.cursor/rules/00-core.mdc) |

## 進捗

→ [docs/status.md](docs/status.md)（セッション開始時に確認）

## 最重要ルール（要約）

1. **賭け事・金額は扱わない**: 対局記録専用。賭け麻雀・金銭のやり取りは違法であり対象外。値は点数・基本ポイント・ポイントのみ。「金額」という語を使わない
2. **UI 言語**: 日本語のみ。アプリ名は **俺たちの雀歴**
3. **名称の使い分け**: UI 表記は「俺たちの雀歴」、コード識別子は `our-mahjong-history` / Our Mahjong History
4. **モバイルファースト**: スマホ利用を主とする。PC 表示は妥協可
5. **ドメイン用語**: 「点数」= 半荘終了時の持ち点、「基本ポイント」= 点数＋オカ、「ポイント」= ウマ・レート等を加味した合計（混同しない）
6. **記録単位**: 局単位は不要。試合（半荘）単位のみ
7. **セキュリティ**: Supabase RLS を必ず使用。麻雀グループのメンバーのみデータにアクセス可能。検証は本物の Postgres に対する自動テスト（pgTAP）。クライアントのモックでは権限を担保しない
8. **開発スタイル**: 小さく区切って確認しながら進める（1 機能 = 1 セッション推奨）
9. **スコープ管理**: MVP 外（写真、統計、PC 最適化等）は明示的に依頼されるまで着手しない
10. **開発実行環境**: ホストに Node は置かない。Dev Container 内、または `docker compose -f .devcontainer/docker-compose.yml exec app`。同一 LAN のスマホ確認は [docs/development.md](docs/development.md#同一-lan-のスマホから見る)
11. **データアクセス**: 独自 REST は作らない。読み取りは RSC→Supabase、更新は Server Action 内の Supabase 呼び出し

## エージェント向け作業指針

- 実装前に [docs/overview.md](docs/overview.md) でドメインを確認する。DB / migration は [docs/er.md](docs/er.md)
- 日本語のドメイン用語は [docs/overview.md](docs/overview.md)。麻雀グループの表名・パス・カラムは `community` のまま（`communities` / `community_id`）。英語識別子は変えない
- 「金額」「賭け」「精算」「支払い」「円」などの語を UI・コード・提案に使わない。値は点数・基本ポイント・ポイントで話す
- フェーズを飛ばさず、[docs/development.md](docs/development.md) の順序に従う
- DB 変更は migration SQL として管理する
- RLS の権限テストは `supabase test db`（pgTAP）。画面やモッククライアントでは代替しない
- テストケースの正は [docs/test-cases.md](docs/test-cases.md)（Phase 3-3 で作成。実装より前）
- ポイント計算ケースの正は [docs/calc-cases.md](docs/calc-cases.md)（Phase 4-1 で作成。実装より前）
- フェーズや作業が進んだら [docs/status.md](docs/status.md) を更新する
- ドメイン用語に変更があれば [docs/overview.md](docs/overview.md) を更新する
- ER の属性・制約に変更があれば [docs/er.md](docs/er.md) を更新する
- コミット・PR はユーザーが明示的に依頼した場合のみ作成する
- Node / npm はホストで実行しない。Dev Container 内、または `docker compose -f .devcontainer/docker-compose.yml exec app`
