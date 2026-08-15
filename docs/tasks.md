# 詳細タスク

進捗の正は [status.md](status.md)。本ファイルは現フェーズの具体タスク。

## Phase 0: プロジェクト土台

### 0-1 開発コンテナ

- [x] `.devcontainer/Dockerfile`（Node 24、git、Docker CLI、supabase CLI）
- [x] `.devcontainer/docker-compose.yml`（`/workspace` bind mount、`docker.sock`、`network_mode: host`、polling）
- [x] `.devcontainer/devcontainer.json`（compose の `app` サービスを参照）
- [x] `supabase init`（`start` はしない）
- [x] Cursor で Reopen in Container（ユーザー確認）
- [x] コンテナ内で `node` / `npm` / `supabase` / `docker` が使えること

### 0-2 Next.js 雛形（`web/`）

- [x] コンテナ内で `web/` に Next.js（App Router）+ TypeScript + Tailwind を初期化（`src/` あり）
- [x] ESLint / Prettier
- [x] `web/.env.example`（`NEXT_PUBLIC_SUPABASE_*`）
- [x] Supabase クライアント雛形（`@supabase/ssr`。実プロジェクトの start は Phase 3）
- [x] metadata に「俺たちの雀歴」
- [x] コンテナ内 `npm run dev` で空アプリ起動（http://localhost:3000。ブラウザ確認済み）
