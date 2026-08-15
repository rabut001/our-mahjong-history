# 詳細タスク

進捗の正は [status.md](status.md)。本ファイルは現フェーズの具体タスク。

## Phase 0: プロジェクト土台

前提は [development.md](development.md) / [tech-stack.md](tech-stack.md) に記録済み。コンテナ作成は未着手。

### 0-1 開発コンテナ

- [ ] `Dockerfile`（Node 24、git、Docker CLI、supabase CLI）
- [ ] `docker-compose.yml`（`/workspace` bind mount、ポート 3000、`docker.sock`、polling）
- [ ] `.devcontainer/devcontainer.json`（Dockerfile 直指定）
- [ ] `supabase init`（`start` はしない）
- [ ] Cursor で Reopen in Container
- [ ] コンテナ内で `node` / `npm` / `supabase` / `docker` が使えること

### 0-2 Next.js 雛形（`web/`）

- [ ] コンテナ内で `web/` に Next.js（App Router）+ TypeScript + Tailwind を初期化
- [ ] ESLint / Prettier
- [ ] `web/.env.example`（`NEXT_PUBLIC_SUPABASE_*`）
- [ ] Supabase クライアント雛形（`@supabase/ssr`。実プロジェクトの start は Phase 3）
- [ ] metadata に「俺たちの雀歴」
- [ ] コンテナ内 `npm run dev` で空アプリ起動
