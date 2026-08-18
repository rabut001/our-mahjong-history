# 開発ステータス

進捗の正（Single Source of Truth）。セッション開始時に確認し、フェーズや作業が進んだら更新する。

**最終更新**: 2026-08-18

---

## 現在

| 項目 | 状態 |
|------|------|
| フェーズ | **Phase 4 着手**。4-0 完了。次は 4-1 |
| コード | `web/` に Next.js 16。モックはダミーデータ。画面は未接続。Phase 4 は **基盤先行**（4-1 ドメイン + Vitest + CI の `web` job → 4-2 共通 UI → 4-3 から実データ接続）。見た目の正はモック + [ui-spec.md](ui-spec.md)。構造と現行 `match-points.ts` は正にしない。計算の意図は [overview.md](overview.md)。ローカル Supabase 起動済み（Studio `http://127.0.0.1:54323`）。`web/.env.local` は接続情報のみ。スキーマ / RLS / RPC / `handle_new_user` の migration あり。生成型は `web/src/lib/supabase/database.types.ts`。`supabase test db` が緑。CI の `db` job は既存（リモート未設定のため Actions は未実行）。ケースの正は [test-cases.md](test-cases.md)。ドメインの日本語は **麻雀グループ**（表・パス・カラムは `community` のまま）。OAuth は [tech-stack.md](tech-stack.md#認証) |
| Git | 初期化済み（`main`）。リモートなし |
| 次のアクション | 4-1: `docs/calc-cases.md` → `lib/domain/` + Vitest + CI の `web` job（見た目は変えない） |

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
| Phase 4: MVP 実装 | 着手 | 4-0 完了。基盤先行。次は 4-1 |
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
