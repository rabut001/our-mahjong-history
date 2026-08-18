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
| フロントエンド | Next.js 16 + React 19 | App Router。`web/src/` |
| 言語 | TypeScript | フロント・サーバー共通 |
| スタイリング | Tailwind CSS 4 | モバイルファースト |
| BaaS / DB | Supabase | PostgreSQL + Auth + RLS |
| デプロイ | Vercel | フロントエンドホスティング（本番はコンテナ化しない） |
| ローカル開発 | Docker | Dev Container + docker compose。Node 24。ホストに Node は置かない |
| UI 言語 | 日本語 | 日本語のみ |

---

## フロントエンド

### Next.js（App Router）

- **React Server Components** を基本とし、インタラクティブな部分のみ Client Component
- 配置: リポジトリの `web/`（コンテナ内は `/workspace/web`）
- ルーティング: `web/src/app/` ディレクトリ配下（`src/` あり）
- データ更新: Server Actions を優先。中身は Supabase クライアント呼び出し（薄いラッパー）。RLS で循環する操作は `supabase.rpc`
- 独自 REST / Route Handler の CRUD は作らない。データ API は Supabase（PostgREST + RLS。関数は RPC）

### TypeScript

- 厳格モード（`strict: true`）を推奨
- Supabase 生成型（`supabase gen types`）を活用

### Tailwind CSS

- モバイルファースト（`sm:` 以下はスマホ、`md:` 以上は PC 妥協表示）
- デザイントークンは [docs/ui-spec.md](ui-spec.md) と `web/src/app/globals.css`

---

## バックエンド / データ

### Supabase

| 機能 | 用途 |
|------|------|
| PostgreSQL | 麻雀グループ・大会・試合データ |
| Auth | メール / OAuth 認証 |
| RLS | 麻雀グループのメンバー限定アクセス |
| Storage | 将来の写真機能用（MVP 外） |

### マイグレーション

- SQL ファイルとして `supabase/migrations/` に管理（Phase 3 で作成）
- スキーマ変更は必ず migration 経由。Dashboard からの直接変更は避ける

---

## 認証

- Supabase Auth
- 方式: メール + OAuth（Google / LINE。メールを正。OAuth はローカル必須にしない）
- ほぼ全ページで認証必須（未認証はログインへリダイレクト）。画面接続は Phase 4-0
- 登録時: `auth.users` INSERT の trigger `private.handle_new_user` が利用中 `profiles` を 1 行付ける（`profiles.id` は Auth ID と別）
- 表示名の初期値: `user_metadata.display_name` → `full_name` / `name` → メールの `@` より前。どれも無ければ登録失敗
- アイコン: Google / LINE のみ `avatar_url` または `picture` をコピー。メール登録は空

### OAuth（画面導線の前提。Phase 4-0 が呼ぶ）

ローカルでは有効化しない。クレデンシャルはコミットしない。本番は Phase 5 の Supabase Cloud。

| 項目 | Google | LINE |
|------|--------|------|
| 種別 | 標準プロバイダ | 標準に無い。Custom OIDC |
| クライアント | `signInWithOAuth({ provider: 'google' })` | `signInWithOAuth({ provider: 'custom:line' })` |
| 設定場所 | `config.toml` の `[auth.external.google]`（`enabled = false`）。本番 Dashboard | 本番 Dashboard の Custom Identity Providers。identifier は `custom:line`。CLI 2.114.0 の `config.toml` には書けない |
| シークレット | `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`（本番）。`client_id` は Google のクライアント ID | LINE チャネル ID / チャネルシークレット（Dashboard。リポジトリに置かない） |
| メールなし | 不可（既定） | あり得る。Dashboard で email optional。表示名は `name` 必須 |

LINE の Custom OIDC（マニュアルエンドポイント。本番 Dashboard）:

| 項目 | 値 |
|------|-----|
| Identifier | `custom:line` |
| Issuer | `https://access.line.me` |
| Authorization | `https://access.line.me/oauth2/v2.1/authorize` |
| Token | `https://api.line.me/oauth2/v2.1/token` |
| Userinfo | `https://api.line.me/oauth2/v2.1/userinfo` |

メール登録: `signUp({ email, password, options: { data: { display_name } } })`。ログインは `signInWithPassword`。

リダイレクト（許可リストは `config.toml` の `additional_redirect_urls`）:

- コールバックパス: `/auth/callback`（ページは Phase 4-0）
- ローカル: `http://127.0.0.1:3000/auth/callback`、`http://localhost:3000/auth/callback`
- 本番: Phase 5 で Vercel URL を Dashboard に足す

生成型: `supabase gen types typescript --local > web/src/lib/supabase/database.types.ts`。既存の `client.ts` / `server.ts` が `Database` を使う。

---

## ローカル開発（Docker）

ホストに Node.js / npm は置かない。起動方法は [development.md](development.md#ローカル開発環境) を参照。

| ファイル | 役割 |
|----------|------|
| `.devcontainer/Dockerfile` | Node 24 開発イメージ。git / Docker CLI / supabase CLI **2.114.0** |
| `.devcontainer/docker-compose.yml` | Dev Container とホスト CLI で共有。`docker.sock`、`network_mode: host` |
| `.devcontainer/devcontainer.json` | Cursor 用。上記 compose の `app` サービスを参照 |
| `.github/workflows/ci.yml` | `supabase start` → lint / Advisors / `auth.uid()` 検査 → `test db`（CLI 2.114.0） |

Phase 0 で `supabase init` まで行う。`supabase start` は Phase 3-1。本番は Vercel + Supabase Cloud。ローカルでは Storage / Realtime / Vector / Edge Runtime を切る（写真は MVP 外）。

---

## デプロイ / インフラ

| サービス | 役割 |
|----------|------|
| Vercel | Next.js アプリのホスティング（本番。コンテナ化しない） |
| Supabase Cloud | 本番の DB・Auth・RLS |
| GitHub | ソースコード管理 |
| Docker | ローカル開発のみ |

### 環境変数（予定）

ローカル: `.env.local`（git 管理外）

| 変数 | 用途 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL（ローカルは `http://127.0.0.1:54321`） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 公開 anon キー（`supabase start` の値を `web/.env.local` へ。画面接続は Phase 4-0） |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` | Google OAuth の client secret（本番。ローカルは未設定のまま） |

---

## 開発ツール

| ツール | 用途 |
|--------|------|
| ESLint | 静的解析 |
| Prettier | コードフォーマット |
| npm | パッケージ管理 |
| pgTAP | DB / RLS の主テスト（`supabase test db`） |

### テスト

アクセス制御の正は RLS。検証は本物の Postgres（RLS 有効）に対して行う。Supabase クライアントのモックでは権限を担保しない。ケースの正は [test-cases.md](test-cases.md)（3-3 で作成）。層とタイミングは [tasks.md のテスト方針](tasks.md#テスト方針)。

| 層 | ツール | 用途 | 時期 |
|----|--------|------|------|
| DB / RLS（主） | pgTAP（`supabase test db`） | 権限行列、制約、SECURITY DEFINER 関数 | Phase 3 |
| DB 静的検査 | `supabase db lint` / `db advisors` / grants 補完 / `auth.uid()` 検査 | 型、RLS 付け忘れ、`search_path`、DEFINER の EXECUTE、本人取得 | Phase 3（方針は 3-2） |
| PostgREST（副） | ローカル Auth の JWT + anon キー | GRANT・RPC 公開 | Phase 3（関数後） |
| 画面 | Playwright 等 | 煙。権限行列の代替にしない | Phase 4 以降 |
| アプリ単体 | Vitest 等 | ポイント計算・バリデーション。権限には使わない | Phase 4 |

CI（Phase 3）: `.github/workflows/ci.yml` が手元と同じ入口（`supabase start` のあと lint / Advisors / grants 補完 / `auth.uid()` 静的検査 → `supabase test db`）。GitHub リモートは未設定。

---

## ディレクトリ構成（予定）

Phase 0 の前提として確定。`supabase/tests/` は Phase 3。

```
our-mahjong-history/            # リポジトリ名（Our Mahjong History）
├── AGENTS.md
├── docs/
├── .cursor/rules/
├── .devcontainer/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── devcontainer.json
│   ├── supabase-alias.sh     # alias supabase=ラッパー
│   └── supabase-workdir.sh   # --workdir を付けて公式 CLI を呼ぶ
├── .github/workflows/ci.yml  # start → lint / advisors / auth.uid → test db
├── web/                      # Next.js アプリ
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/              # supabase クライアントと生成型 `database.types.ts`
│   └── package.json
└── supabase/
    ├── config.toml
    ├── ci/                   # Advisors 除外ラッパー、auth.uid() 静的検査
    ├── migrations/           # Phase 3-4
    └── tests/                # pgTAP。ファイル名は *_test.sql
```

---

## 対応プラットフォーム

| プラットフォーム | 優先度 | 備考 |
|------------------|--------|------|
| スマートフォン（モバイルブラウザ） | **主** | 375px 幅を基準に設計 |
| タブレット | 低 | スマホ UI の拡張で対応 |
| PC（デスクトップブラウザ） | 妥協可 | レスポンシブで最低限表示 |

ネイティブアプリ（iOS / Android）は MVP 外。
