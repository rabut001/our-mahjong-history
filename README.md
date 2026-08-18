# 俺たちの雀歴

**Our Mahjong History**（`our-mahjong-history`）

麻雀仲間の **麻雀グループ** 単位で、麻雀大会と試合（半荘）の結果を記録・共有する Web アプリです。

対局記録専用です。アガリ役の点数計算や局ごとの入力には未対応です。

## 構成

| パス | 内容 |
|------|------|
| `web/` | Next.js（App Router） |
| `supabase/` | PostgreSQL・RLS・Auth の migration とテスト |
| `docs/` | 要件・ER・開発の進め方 |

認証はメールと Google / LINE。データ API は Supabase（独自 REST は作りません）。本番は Vercel（コンテナ化しません）。

## ローカル開発

ホストに Node.js は置きません。Cursor で **Reopen in Container** するか、`.devcontainer/docker-compose.yml` の `app` サービスに入ります。

```bash
supabase start
cd web
cp .env.example .env.local   # supabase status の URL / anon キー / service_role を入れる
npm run dev
```

http://localhost:3000

手順の正は [docs/development.md](docs/development.md) です。

## ドキュメント

- [docs/overview.md](docs/overview.md) — ドメイン
- [docs/status.md](docs/status.md) — 進捗
- [AGENTS.md](AGENTS.md) — 開発時の入口
