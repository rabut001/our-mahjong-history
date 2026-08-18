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
Phase 2: モック作成
    ↓
Phase 3: Supabase スキーマ + 認証 ★
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
| ER 図 | 麻雀グループ / 大会 / 試合 / ルール設定 |
| 集計方針 | 大会の最終順位・ポイントは都度集計。試合ポイント合計が正 |
| ルールスコープ | 麻雀グループの既定を大会に値コピー。大会は複数併用可 |
| RLS 方針 | メンバーシップに基づくアクセス制御 |

**成果物**: [docs/overview.md](overview.md)（ドメインの正）、[docs/er.md](er.md)（属性・制約・RLS 判定）

**決定済み（Phase 1）**:

- [x] エンティティと多重度：麻雀グループ → 大会 → 試合。参加者はメンバーまたはゲスト。試合プレイヤー ⊆ 大会参加者
- [x] 保存 vs 計算：試合の点数・基本ポイント・ポイント内訳・合計・順位は保存。大会の最終ポイント・最終順位は都度集計
- [x] ルール：麻雀グループの既定（複数）を大会作成時に値コピー。大会は複数ルール併用可。使用中は修正不可（新規登録で替える）
- [x] 大会サマリー：試合ポイント合計が正。大会修正ポイントを別途保存。最終順位・最終ポイントは都度集計（同ポイントは 1, 2, 2, 4。対象は 1 試合以上出場）
- [x] 役割：全員同等。役割カラムなし
- [x] 招待：招待コード、有効期限、麻雀グループあたり最大 1
- [x] RLS：所属メンバーなら配下を閲覧・編集。参加・作成・退会は関数経由
- [x] 退会・削除：墓石（`profiles` は残す）。明示削除は空のときだけ。最後の 1 人の離脱は麻雀グループごと消す

---

### Phase 2: モック作成

**目的**: スマホ UI の認識合わせ。デザイン・UX を詳細に決める

**タイミング**: Phase 1（ドメイン設計）の直後。実装前に UI を確定する。データ方針は変えない。モックで決める UX は [tasks.md](tasks.md) の 1-6 引き渡しを参照。

#### モック対象画面（案）

| # | 画面 | 主な内容 |
|---|------|----------|
| 1 | ログイン / サインアップ | メール + OAuth |
| 2 | トップ（俺たちの雀歴） | 自分のプロフィール、所属麻雀グループ一覧 |
| 3 | 麻雀グループ詳細 | 大会一覧、メンバー、ルール設定 |
| 4 | ルール設定 | 三麻/四麻、持ち点/返し、オカ・ウマ同着、トビ、焼き鳥、その他ポイント |
| 5 | 大会一覧 | 日付順、大会名 |
| 6 | 大会詳細 | 試合一覧、参加者サマリー、最終順位/ポイント |
| 7 | 大会作成 / 編集 | 日付、大会名、メモ、大会修正ポイントのタイトル |
| 8 | 試合作成 / 編集 | プレイヤー選択、持ち点入力 → ポイント自動計算、試合個別ポイント |
| 9 | 試合詳細 | 順位、点数、ポイント、コメント |

#### モックで決める論点

決定の正は [ui-spec.md](ui-spec.md)。

- [x] ナビゲーション: 戻る＋タイトル（タブ / ハンバーガーは採らない）
- [x] 試合入力: 1 画面の表（家が列。ステップ形式は採らない）
- [x] ポイント自動計算: 入力のたびに再計算。計算ボタンなし
- [x] 大会サマリー: 総合順位は最終 pt。補正は別画面
- [x] ルール設定: 1 画面フォーム。三麻/四麻で項目を切り替え
- [x] 色・typography・コンポーネント: 雀卓、カード枠、ごく薄い影

**成果物**:

- モバイル幅（375px 想定）のモック（静的 HTML または Next.js ページ）
- `docs/ui-spec.md`（画面遷移・コンポーネント・デザイントークン）

---

### Phase 3: Supabase スキーマ + 認証 ★

**目的**: モックとドメイン設計を反映した DB・認証基盤。アクセス制御（RLS）を自動テストで固定する。

| 作業 | 内容 |
|------|------|
| ローカル実行 | Dev Container 内で `supabase start`（公式ローカルスタック。ホスト Docker を `docker.sock` 経由で使用） |
| Migration | Phase 1 の ER を SQL 化 |
| RLS | 麻雀グループのメンバーのみアクセス。所属判定はヘルパー関数 |
| 関数 | 作成・参加・離脱・退会（`create_community` / `join_community` / `leave_community` / `withdraw_account`。SECURITY DEFINER）。アプリからは `supabase.rpc` |
| Auth | Supabase Auth。メールを正。OAuth は設定まで（ローカル必須にしない）。詳細は [tech-stack.md の認証](tech-stack.md#認証) |
| 型生成 | `supabase gen types` → TypeScript 型（`web/` の型ファイルのみ） |
| テスト | ケースの正は `docs/test-cases.md`（実装より前に一括）。pgTAP（主）。PostgREST の薄い通し（副）。静的検査は `db lint` / `db advisors` / grants 補完 / `auth.uid()` 検査（3-2）。CI で同じ入口 |

`web/` の画面は触らない。テスト専用画面も作らない。ログイン〜一覧の実データ接続は Phase 4-3（基盤の 4-1 / 4-2 のあと）。

本番の DB / Auth は Phase 5 で Supabase Cloud を使う。

**成果物**: `docs/test-cases.md`、マイグレーション SQL、RLS policy、関数、生成型、RLS の自動テストが緑

セッション分割とテスト方針の詳細は [tasks.md の Phase 3](tasks.md#phase-3-supabase-スキーマ--認証)。

---

### Phase 4: MVP 実装

**目的**: モックの見た目を正として残し、コンポーネント構成と計算は整理したうえで、Phase 3 の DB / RLS / 型を画面が消費する。

見た目の正は `docs/ui-spec.md` と `web/` のモック。構造（CSS の重複、コンポーネント分割、`mock/` の神モジュール）は正にしない。計算の意図は [overview.md](overview.md)。ケースの正は [calc-cases.md](calc-cases.md)。

基盤（ドメイン・テスト・共通 UI）を先に固定し、そのあと機能単位で接続する。

| 順番 | 機能 | 依存 |
|------|------|------|
| 4-0 | キックオフ（方針・層・CI・セッション分割） | Phase 3 完了 |
| 4-1 | ドメイン切り出し + Vitest + CI の `web` job | 4-0。見た目は変えない |
| 4-2 | 共通 UI の整理（`MatchForm` / `RuleForm` の分割） | 4-1。ダミーのまま |
| 4-3 | Auth 接続（ログイン + トップの SELECT）+ Playwright 煙 | 4-2 + Phase 3 の Auth / RLS / 型 |
| 4-4 | 麻雀グループ CRUD + 招待 | 4-3 |
| 4-5 | ルール設定 | 麻雀グループ |
| 4-6 | 大会 CRUD | 麻雀グループ |
| 4-7 | 試合 CRUD（ポイント計算は 4-1 の純関数） | 大会 + ルール |
| 4-8 | 大会サマリー（順位・ポイント集計） | 試合 |
| 4-9 | 仕上げ | 横断の空状態・エラー・ローディングの残り |

4-3 は本番のログイン画面と `/communities` を実セッションに繋ぐ。テスト専用の画面は作らない。バリデーションは接続する機能のセッションで入れ、4-9 は残りだけ。

接続した画面はスマホ実機または DevTools のモバイル表示で確認する。4-1 はブラウザ不要。4-2 は 375px で試合入力とルールを踏む。

詳細は [tasks.md の Phase 4](tasks.md#phase-4-mvp-実装)。

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
| 6 | Phase 3 | DB + RLS + 自動テスト（`supabase start`） | `supabase test db` が緑 |
| 7 | Phase 4 | 基盤（計算・CI・共通 UI）のあとログイン接続。大会・試合 CRUD | 実データで記録。計算は Vitest |
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
| DB / RLS のテストケース変更時 | [docs/test-cases.md](test-cases.md)（Phase 3-3 で作成） |
| ポイント計算ケース変更時 | `docs/calc-cases.md`（Phase 4-1 で作成） |
| 画面 E2E のテストケース変更時 | [docs/e2e-cases.md](e2e-cases.md) |
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

Dev Container は `.devcontainer/docker-compose.yml` を参照する（[ci-cd-study](https://github.com/rabut001/ci-cd-study) のひな形に合わせる）。`network_mode: host` のため、Next.js はホストのポートで直接届く。PC のブラウザは `http://localhost:3000`。同一 LAN のスマホから見る手順は [同一 LAN のスマホから見る](#同一-lan-のスマホから見る)。

コンテナの作業ディレクトリは `/workspace`（リポジトリルートを bind mount）。Next.js は `/workspace/web`。ホットリロード用に polling を有効化する。`node_modules` 用の名前付き volume は作らない。コンテナユーザーは root。

`docker.sock` をマウントし、コンテナからホスト Docker を操作する（個人のローカル開発用）。`supabase start` はホスト Docker 上で公式スタックを起動する。CLI の bind はホスト実パスと一致させる（`alias supabase=...` が `.devcontainer/supabase-workdir.sh` を呼び、本体 `/usr/local/bin/supabase --workdir "$LOCAL_WORKSPACE_FOLDER"` を実行する）。Cursor は Reopen 時に `.devcontainer/.env` を書く。

ローカル Supabase（3-1）:

| 項目 | 値 |
|------|-----|
| Studio | http://127.0.0.1:54323 |
| API | http://127.0.0.1:54321 |
| DB | postgresql://postgres:postgres@127.0.0.1:54322/postgres |
| CLI | 2.114.0（Dockerfile と CI でピン留め） |
| テスト | `supabase test db`（ファイル名は `*_test.sql`）。静的検査は `supabase db lint` / `supabase db advisors` / grants 補完 / `auth.uid()` 検査（方針は 3-2） |
| 未使用サービス | Storage / Realtime / Vector / Edge Runtime は切ってある |

`web/.env.local` は URL と anon キーのみ。ログインとトップは実セッションに接続済み。

### 同一 LAN のスマホから見る

WSL2 は NAT のため、PC の `localhost:3000` だけでは同一 Wi-Fi のスマホに届かない。公開は一時的にし、確認が終わったら戻す。

**公開する**

1. 開発サーバを LAN 向けに待ち受け、スマホからの HMR を許可する。
   - `web/package.json` の `dev` を `next dev --hostname 0.0.0.0` にする（戻すときは `next dev --hostname 127.0.0.1`）
   - `web/next.config.ts` に `allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"]` を入れる
2. コンテナ内 `web/` で `npm run dev`（`http://localhost:3000`）
3. Windows の **管理者 PowerShell**（リポジトリルート）:

```powershell
powershell -ExecutionPolicy Bypass -File .devcontainer/expose-lan.ps1
```

4. スクリプトが表示する `http://<PCのIPv4>:3000` をスマホで開く。PC の `localhost` はそのまま使える。メールのログイン／登録は Next.js 経由なので、この URL でも使える。Google / LINE は LAN IP では使わない。

**元に戻す**

1. Windows の **管理者 PowerShell**:

```powershell
powershell -ExecutionPolicy Bypass -File .devcontainer/unexpose-lan.ps1
```

   3000 番の portproxy と、名前が `Our Mahjong History dev 3000` のファイアウォール規則だけを外す。
2. 開発サーバを localhost だけにする。`web/package.json` の `dev` を `next dev --hostname 127.0.0.1` に戻し、`web/next.config.ts` の `allowedDevOrigins` を外す。

スクリプトは `.devcontainer/expose-lan.ps1`（公開）と `.devcontainer/unexpose-lan.ps1`（戻す）。

---

## データアクセス方針

- 独自の REST / Route Handler による CRUD API は作らない
- データ API は Supabase（PostgREST + RLS）
- **読み取り**: React Server Components から Supabase クライアント
- **更新**: Server Action 内で Supabase クライアントを呼ぶ（薄いラッパー）
- RLS だけでは循環する更新（麻雀グループ参加・作成、退会など）は、同じ経路で **`supabase.rpc`（Postgres 関数）** を呼ぶ。独自 REST ではない
- 認証セッション: `@supabase/ssr`（cookie）
- 利用者の Auth 削除だけは Supabase Auth Admin（Server Action から service role）

アクセス制御の検証は本物の Postgres（RLS 有効）に対して行う。Supabase クライアントのモックでは権限を担保しない。ケースの正は [test-cases.md](test-cases.md)（3-3 で作成）。層とタイミングは [tasks.md のテスト方針](tasks.md#テスト方針)。
