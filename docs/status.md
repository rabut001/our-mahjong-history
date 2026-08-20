# 開発ステータス

進捗の正（Single Source of Truth）。セッション開始時に確認し、フェーズや作業が進んだら更新する。

**最終更新**: 2026-08-21

---

## 現在

| 項目 | 状態 |
|------|------|
| フェーズ | **Phase 5 完了**。Phase 6（拡張）は明示依頼まで着手しない |
| コード | `web/` に Next.js 16。ログインから麻雀グループ・ルール・大会・試合・ポイント補正まで実セッション / 実 RLS。計算は `web/src/lib/domain/`（Vitest が [calc-cases.md](calc-cases.md) と 1 対 1）。共通 UI は `web/src/components/ui/`。`MatchForm` / `RuleForm` は内部ブロック分割。CI に `web` job（lint / tsc / format / vitest）と `e2e` job（Playwright が [e2e-cases.md](e2e-cases.md) と 1 対 1）。`db` job は既存。GitHub Actions（`db` / `web` / `e2e`）は緑。見た目の正は [ui-spec.md](ui-spec.md)。試合入力の行順は 素点 → 順位 → 基本 pt。0 でよい行（トビ・祝儀等）は空欄表示（プレースホルダ 0）。計算の意図は [overview.md](overview.md)。ローカル Supabase 起動済み（Studio `http://127.0.0.1:54323`）。`web/.env.local` は接続情報と退会用の service role。スキーマ / RLS / RPC / `handle_new_user` の migration あり。生成型は `web/src/lib/supabase/database.types.ts`。`supabase test db` が緑。DB ケースの正は [test-cases.md](test-cases.md)。ドメインの日本語は **麻雀グループ**（表・パス・カラムは `community` のまま）。OAuth は [tech-stack.md](tech-stack.md#認証)。本番 Supabase Cloud は Tokyo の `our-mahjong-history`（`hmkyrdkqqjmomggekxbj`）。schema / RLS / RPC / `handle_new_user` を `db push` 済み。メール確認あり。Google / LINE 有効（LINE は Custom OAuth2 / Manual）。本番アプリは [our-mahjong-history.vercel.app](https://our-mahjong-history.vercel.app)。ユーザーが本番を動かして OK |
| Git | 公開 [rabut001/our-mahjong-history](https://github.com/rabut001/our-mahjong-history)（`main`） |
| 次のアクション | （なし。005 完了。Phase 6 は明示依頼まで着手しない） |

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
| Phase 4: MVP 実装 | 完了 | 4-0〜4-9。ログインから試合記録まで実データ。Vitest / CI `web`・`db`・e2e が緑 |
| Phase 5: デプロイ | 完了 | 5-0〜5-4。本番は [our-mahjong-history.vercel.app](https://our-mahjong-history.vercel.app) |
| Phase 6: 拡張 | 未着手 | MVP 後 |

フェーズの定義・成果物は [development.md](development.md) を参照。

---

## 詳細タスク

- Phase 0〜5 → [docs/tasks.md](tasks.md)（完了記録。追記しない）
- 以降 → [docs/changes/](changes/)

---

## 更新ルール

| タイミング | 更新する項目 |
|------------|--------------|
| フェーズ開始・完了時 | 「現在」「フェーズ一覧」 |
| 次のアクションが変わったとき | 「現在」 |
| 作業が止まったとき | 「ブロッカー」 |
| Phase 0〜5 | `docs/tasks.md`（完了記録。追記しない） |
| MVP 後の修正 | `docs/changes/<NNN-slug>/`。一覧は [changes/README.md](changes/README.md) |
