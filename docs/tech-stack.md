# 技術スタック・言語・プラットフォーム

## プロジェクト名称

| 用途 | 名称 | 具体例 |
|------|------|--------|
| 製品名（日本語） | **俺たちの雀歴** | `<title>`、ヘッダーロゴ横の表記、メタ description |
| 開発用英語名 | **Our Mahjong History** | コメント、README の英語表記、対外説明 |
| kebab-case 識別子 | `our-mahjong-history` | リポジトリ名、`package.json` の `name`、Vercel プロジェクト名 |

### 使い分けの指針

- **ユーザーが目にする UI テキスト** → 「俺たちの雀歴」
- **コード・設定・インフラの識別子** → `our-mahjong-history` または `Our Mahjong History`
- **HTML の `lang` 属性** → `ja`

## 概要

| レイヤ | 技術 | 備考 |
|--------|------|------|
| フロントエンド | Next.js + React | App Router |
| 言語 | TypeScript | フロント・サーバー共通 |
| スタイリング | Tailwind CSS | モバイルファースト |
| BaaS / DB | Supabase | PostgreSQL + Auth + RLS |
| デプロイ | Vercel | フロントエンドホスティング |
| UI 言語 | 日本語 | 日本語のみ |

---

## フロントエンド

### Next.js（App Router）

- **React Server Components** を基本とし、インタラクティブな部分のみ Client Component
- ルーティング: `app/` ディレクトリ配下
- データ更新: Server Actions を優先（方針は Phase 0 で確定）

### TypeScript

- 厳格モード（`strict: true`）を推奨
- Supabase 生成型（`supabase gen types`）を活用

### Tailwind CSS

- モバイルファースト（`sm:` 以下はスマホ、`md:` 以上は PC 妥協表示）
- デザイントークンは Phase 2 モック確定後に `docs/ui-spec.md` へ記録

---

## バックエンド / データ

### Supabase

| 機能 | 用途 |
|------|------|
| PostgreSQL | コミュニティ・大会・試合データ |
| Auth | メール / OAuth 認証 |
| RLS | コミュニティメンバー限定アクセス |
| Storage | 将来の写真機能用（MVP 外） |

### マイグレーション

- SQL ファイルとして `supabase/migrations/` に管理（Phase 3 で作成）
- スキーマ変更は必ず migration 経由。Dashboard からの直接変更は避ける

---

## 認証

- Supabase Auth
- 方式: メール + OAuth（Google 等、Phase 3 で具体化）
- ほぼ全ページで認証必須（未認証はログインへリダイレクト）

---

## デプロイ / インフラ

| サービス | 役割 |
|----------|------|
| Vercel | Next.js アプリのホスティング |
| Supabase Cloud | DB・Auth・RLS |
| GitHub | ソースコード管理 |

### 環境変数（予定）

ローカル: `.env.local`（git 管理外）

| 変数 | 用途 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 公開 anon キー |

`.env.example` は Phase 0 で作成する。

---

## 開発ツール（予定）

| ツール | 用途 |
|--------|------|
| ESLint | 静的解析 |
| Prettier | コードフォーマット |
| npm | パッケージ管理 |

テスト（Vitest / Playwright 等）は MVP 実装時に必要性を判断する。

---

## ディレクトリ構成（予定）

Phase 0 完了後に確定。想定:

```
our-mahjong-history/            # リポジトリ名（Our Mahjong History）
├── AGENTS.md                 # AI エージェント入口
├── docs/                     # プロジェクトドキュメント
│   ├── status.md             # 進捗（動的）
│   ├── overview.md
│   ├── development.md
│   ├── tech-stack.md
│   ├── tasks.md              # 具体タスク（Phase 0 以降）
│   └── ui-spec.md            # Phase 2 以降
├── .cursor/
│   └── rules/                # Cursor ルール
├── app/                      # Next.js App Router
├── components/               # 共通 UI コンポーネント
├── lib/                      # ユーティリティ・Supabase クライアント等
└── supabase/
    └── migrations/           # DB マイグレーション
```

---

## 対応プラットフォーム

| プラットフォーム | 優先度 | 備考 |
|------------------|--------|------|
| スマートフォン（モバイルブラウザ） | **主** | 375px 幅を基準に設計 |
| タブレット | 低 | スマホ UI の拡張で対応 |
| PC（デスクトップブラウザ） | 妥協可 | レスポンシブで最低限表示 |

ネイティブアプリ（iOS / Android）は MVP 外。
