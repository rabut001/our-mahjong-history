# 開発の進め方

## 基本方針

- **小さく区切って確認しながら進める**（1 機能 ≒ 1 セッション）
- Cursor のコード生成を活用し、スコープを狭く保つ
- 各フェーズ完了時に動作確認またはドキュメントレビューを行う
- フェーズを飛ばさず、依存関係に従って順に進める

---

## 開発フェーズ一覧

```
Phase 0: プロジェクト土台
    ↓
Phase 1: ドメイン設計
    ↓
Phase 2: モック作成 ★
    ↓
Phase 3: Supabase スキーマ + 認証
    ↓
Phase 4: MVP 実装
    ↓
Phase 5: デプロイ
    ↓
Phase 6: 拡張（MVP 後）
```

### Phase 0: プロジェクト土台

**目的**: Cursor が一貫したコードを生成できる環境を整える

ホストに Node.js は置かない。実行は Docker（Dev Container または `docker compose`）上で行う。フェーズ番号は 0〜6 のまま、作業だけ 0-1 / 0-2 に分ける。

| 作業 | 内容 |
|------|------|
| 0-1 開発環境 | `.devcontainer/` の Compose + Dev Container（ひな形: ci-cd-study）。Node 24。supabase CLI + Docker CLI + `docker.sock`。`supabase init` |
| 0-2 初期化 | コンテナ内の `web/` に Next.js（App Router）+ TypeScript + Tailwind CSS |
| 設定 | ESLint / Prettier、環境変数テンプレート |
| プロジェクト名 | `web/package.json` の `name` は `our-mahjong-history`。UI 表示名は「俺たちの雀歴」 |
| Cursor Rules | `.cursor/rules/` にコーディング規約を配置 |
| ドキュメント | 本ドキュメント群のメンテナンス |

**成果物**:

- Dev Container（Reopen in Container）で開発できること
- `supabase/` が init 済みであること（`start` は Phase 3）
- コンテナ内の `web/` で `npm run dev` し、空アプリのタイトル等に「俺たちの雀歴」を表示

---

### Phase 1: ドメイン設計

**目的**: モックと DB 設計の前提を固める（UI はまだ作らない）

| 作業 | 内容 |
|------|------|
| ER 図 | コミュニティ / 大会 / 試合 / ルール設定 |
| 集計方針 | 大会の最終順位・ポイントを自動集計 vs 手入力 |
| ルールスコープ | コミュニティ既定 + 大会上書き等 |
| RLS 方針 | メンバーシップに基づくアクセス制御 |

**成果物**: [docs/er.md](er.md)、`docs/overview.md` の更新（必要に応じて）

**検討事項（未決）**:

- [x] 大会サマリー：試合ポイント合計が正。大会修正ポイントを別途保存。最終順位・最終ポイントは都度集計（同ポイントは 1, 2, 2, 4。対象は 1 試合以上出場）
- [x] ルール設定：コミュニティ既定（複数）を大会にコピー。大会は複数ルール併用可。使用中は修正不可（新規登録で替える）

---

### Phase 2: モック作成 ★

**目的**: スマホ UI の認識合わせ。デザイン・UX を詳細に決める

**タイミング**: Phase 1（ドメイン設計）の直後。実装前に UI を確定する。

#### モック対象画面（案）

| # | 画面 | 主な内容 |
|---|------|----------|
| 1 | ログイン / サインアップ | メール + OAuth |
| 2 | コミュニティ一覧 | 所属コミュニティ、新規作成 |
| 3 | コミュニティ詳細 | 大会一覧、メンバー、ルール設定 |
| 4 | ルール設定 | 三麻/四麻、持ち点/返し、オカ・ウマ同着、トビ、焼き鳥、その他ポイント |
| 5 | 大会一覧 | 日付順、大会名 |
| 6 | 大会詳細 | 試合一覧、参加者サマリー、最終順位/ポイント |
| 7 | 大会作成 / 編集 | 日付、大会名、メモ、大会修正ポイントのタイトル |
| 8 | 試合作成 / 編集 | プレイヤー選択、持ち点入力 → ポイント自動計算、試合個別ポイント |
| 9 | 試合詳細 | 順位、点数、ポイント、コメント |

#### モックで決める論点

- [ ] ナビゲーション（タブ / ハンバーガー / 戻るボタン）
- [ ] 試合入力：1 画面 vs ステップ形式
- [ ] ポイント自動計算の UI フィードバック
- [ ] 大会サマリーの見せ方（試合合計と大会修正ポイントの表示・入力。データ方針は Phase 1-3）
- [ ] ルール設定のスコープ
- [ ] 色・ typography・コンポーネントのトーン

**成果物**:

- モバイル幅（375px 想定）のモック（静的 HTML または Next.js ページ）
- `docs/ui-spec.md`（画面遷移・コンポーネント・デザイントークン）

---

### Phase 3: Supabase スキーマ + 認証

**目的**: モックとドメイン設計を反映した DB・認証基盤

| 作業 | 内容 |
|------|------|
| ローカル実行 | Dev Container 内で `supabase start`（公式ローカルスタック。ホスト Docker を `docker.sock` 経由で使用） |
| Migration | Phase 1 の ER を SQL 化 |
| RLS | コミュニティメンバーのみアクセス |
| Auth | Supabase Auth（メール + OAuth） |
| 型生成 | `supabase gen types` → TypeScript 型 |

本番の DB / Auth は Phase 5 で Supabase Cloud を使う。

**成果物**: マイグレーション SQL、ログイン〜コミュニティ一覧までの骨格

---

### Phase 4: MVP 実装

モック（`docs/ui-spec.md`）に沿って **1 機能 = 1 セッション** で実装。

| 順番 | 機能 | 依存 |
|------|------|------|
| 4-1 | コミュニティ CRUD + 招待 | Auth |
| 4-2 | ルール設定 | コミュニティ |
| 4-3 | 大会 CRUD | コミュニティ |
| 4-4 | 試合 CRUD + ポイント計算 | 大会 + ルール |
| 4-5 | 大会サマリー（順位・ポイント集計） | 試合 |
| 4-6 | 仕上げ | バリデーション、エラー表示、ローディング |

各ステップでスマホ実機または DevTools のモバイル表示で確認する。

---

### Phase 5: デプロイ

- GitHub リポジトリ連携
- Vercel デプロイ（環境変数設定）
- Supabase Redirect URL を本番 URL に追加
- 本番 smoke test

本番はコンテナ化しない。Docker はローカル開発専用。

---

### Phase 6: 拡張（MVP 後）

- 写真アップロード（Supabase Storage）
- 成績・統計
- PC レイアウト改善
- 通知、エクスポート等

---

## セッション例

| # | フェーズ | 内容 | 確認方法 |
|---|----------|------|----------|
| 1 | Phase 0-1 | Docker + Dev Container + `supabase init` | Reopen in Container。`node` / `npm` / `supabase` / `docker` が使える |
| 2 | Phase 0-2 | `web/` に Next.js 初期化 | コンテナ内 `npm run dev` |
| 3 | Phase 1 | ドメイン設計・ER 図 | ドキュメントレビュー |
| 4 | Phase 2 | モック（主要画面） | スマホ幅でスクロール確認 |
| 5 | Phase 2 | モック（試合入力・ルール） | 入力フロー walkthrough |
| 6 | Phase 3 | DB + 認証（`supabase start`） | ログイン動作 |
| 7 | Phase 4 | 大会・試合 CRUD | 実データで記録 |
| 8 | Phase 5 | デプロイ | 本番 URL で確認 |

---

## Cursor 活用のコツ

1. **1 タスク = 1 会話**: 「対局一覧ページだけ」「RLS だけ」などスコープを狭くする
2. **要件を先に文章化**: チャット冒頭に「技術スタック」「やること」「やらないこと」を書く
3. **ドキュメントを参照させる**: `@docs/overview.md` 等を明示的に指定する
4. **生成後は必ず動作確認**: エラーが出たら同セッション内で修正を依頼する
5. **DB 変更は migration で**: テーブル追加時は SQL ファイル化を明示する
6. **npm はコンテナ内で**: ホストに Node はない。Dev Container 内、または `docker compose -f .devcontainer/docker-compose.yml exec app`

---

## ドキュメント更新ルール

| タイミング | 更新対象 |
|------------|----------|
| フェーズ開始・完了時 | [docs/status.md](status.md) |
| 具体タスクの追加・完了時 | `docs/tasks.md`（Phase 0 以降） |
| ドメイン変更時 | [docs/overview.md](overview.md) |
| ER 変更時 | [docs/er.md](er.md) |
| モック確定時 | `docs/ui-spec.md`（新規作成） |
| 技術選定変更時 | [docs/tech-stack.md](tech-stack.md) |
| コーディング規約追加時 | `.cursor/rules/` |

進捗の正は [docs/status.md](status.md)。本ファイルはフェーズの定義（静的）のみを記載する。

---

## ローカル開発環境

ホストに Node.js / npm は不要。実行は Docker 上で行う。

| 方法 | 使い方 |
|------|--------|
| **Dev Container（主）** | Cursor で「Reopen in Container」。以降の `npm` / `supabase` はそのまま実行 |
| **docker compose（副）** | `docker compose -f .devcontainer/docker-compose.yml up -d` のあと `docker compose -f .devcontainer/docker-compose.yml exec app bash` |

Dev Container は `.devcontainer/docker-compose.yml` を参照する（[ci-cd-study](https://github.com/rabut001/ci-cd-study) のひな形に合わせる）。`network_mode: host` のため、Next.js はホストの `localhost:3000` で直接届く。

コンテナの作業ディレクトリは `/workspace`（リポジトリルートを bind mount）。Next.js は `/workspace/web`。ホットリロード用に polling を有効化する。`node_modules` 用の名前付き volume は作らない。コンテナユーザーは root。

`docker.sock` をマウントし、コンテナからホスト Docker を操作する（個人のローカル開発用）。`supabase start` は Phase 3。

---

## データアクセス方針

- 独自の REST / Route Handler による CRUD API は作らない
- データ API は Supabase（PostgREST + RLS）
- **読み取り**: React Server Components から Supabase クライアント
- **更新**: Server Action 内で Supabase クライアントを呼ぶ（薄いラッパー）
- 認証セッション: `@supabase/ssr`（cookie）
