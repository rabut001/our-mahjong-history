# 開発ステータス

進捗の正（Single Source of Truth）。セッション開始時に確認し、フェーズや作業が進んだら更新する。

**最終更新**: 2026-08-18

---

## 現在

| 項目 | 状態 |
|------|------|
| フェーズ | **Phase 3 完了**。次は 4-0 |
| コード | `web/` に Next.js 16。モックはダミーデータ。ローカル Supabase 起動済み（Studio `http://127.0.0.1:54323`）。`web/.env.local` は接続情報のみ（画面は未接続）。スキーマ / RLS / RPC / `handle_new_user` の migration あり。生成型は `web/src/lib/supabase/database.types.ts`（`client.ts` / `server.ts` が使用）。`supabase test db` が緑。PostgREST 通しは `supabase/ci/postgrest-smoke.sh`。CI は `start` → lint / Advisors（0029 除外）/ DEFINER の GRANT 補完 / `auth.uid()` 静的検査 → `test db` → PostgREST（リモート未設定のため Actions は未実行）。ケースの正は [test-cases.md](test-cases.md)（操作ログは trigger。アプリロールは直 INSERT 不可。登録は `handle_new_user`）。中核 6 画面とルール・ログイン・招待・メンバーのワイヤーあり。ナビは戻る＋タイトル。トーンは雀卓・カード枠。トップは「俺たちの雀歴」（`/communities`。上部が自分、下部が麻雀グループ一覧）。破壊的操作は `DangerAction`。UI の正は [ui-spec.md](ui-spec.md)。ドメインの日本語は **麻雀グループ**（表・パス・カラムは `community` のまま）。OAuth は Google が `config.toml` の disabled スタブ、LINE は Custom OIDC（`custom:line`）を [tech-stack.md](tech-stack.md#認証) に書いた。ローカルでは有効化していない |
| Git | 初期化済み（`main`）。リモートなし |
| 次のアクション | 4-0: 本番のログイン + トップの SELECT（実セッション / 実 RLS） |

## ブロッカー

（なし）

---

## フェーズ一覧（進捗）

| フェーズ | 状態 | 備考 |
|----------|------|------|
| Phase 0: プロジェクト土台 | 完了 | 0-1 / 0-2 完了。空アプリ確認済み |
| Phase 1: ドメイン設計 | 完了 | 1-0〜1-6 完了。ドメインの正は overview.md |
| Phase 2: モック作成 | 完了 | 2-0 〜 2-8 完了。UI の正は ui-spec.md |
| Phase 3: Supabase スキーマ + 認証 | 完了 | 3-0〜3-7。画面は未接続。完了条件（`supabase test db` 緑）を満たした |
| Phase 4: MVP 実装 | 未着手 | |
| Phase 5: デプロイ | 未着手 | 本番は Vercel（コンテナ化しない） |
| Phase 6: 拡張 | 未着手 | MVP 後 |

フェーズの定義・成果物は [development.md](development.md) を参照。

---

## 詳細タスク

→ [docs/tasks.md](tasks.md)

---

## 更新ルール

| タイミング | 更新する項目 |
|------------|--------------|
| フェーズ開始・完了時 | 「現在」「フェーズ一覧」 |
| 次のアクションが変わったとき | 「現在」 |
| 作業が止まったとき | 「ブロッカー」 |
| Phase 0 以降 | `docs/tasks.md` に具体タスクを記載 |
