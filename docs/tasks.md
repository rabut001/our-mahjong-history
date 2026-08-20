# 詳細タスク

進捗の正は [status.md](status.md)。本ファイルは **Phase 0〜5** の具体タスク（完了記録）。以降は [changes/](changes/) に書く。

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

## Phase 1: ドメイン設計

**目的**: モック（Phase 2）と DB（Phase 3）の前提を固める。UI と SQL は作らない。

**完了条件**: Phase 2 のモックと Phase 3 の migration が、このフェーズの文書だけ見て着手できる。

進め方: 骨格 → 未決（ルールスコープ・集計方針）→ ER 詳細 → RLS → `docs/overview.md` 更新。

---

### キックオフ仕分け（2026-08-15）

出典は [overview.md](overview.md) / [development.md](development.md) / [tech-stack.md](tech-stack.md)。分類の誤りがあれば次セッション前に直す。

#### 決まっていること（再確認しない）

| 項目 | 内容 |
|------|------|
| アプリ種別 | 複数ユーザーがログインし、所属する麻雀グループのデータを共有する |
| 階層 | 麻雀グループ → 麻雀大会（複数） → 試合 / 半荘（複数） |
| 記録単位 | 試合（半荘）のみ。局単位は不要 |
| 用語 | **点数** = 半荘終了時の持ち点。**基本ポイント** = 点数＋オカ。**ポイント** = ウマ・レート等を加味した合計。金額・賭け麻雀は扱わない |
| 麻雀グループ | 名称、メンバー、ルール設定の単位 |
| 大会 | 日付、大会名、メモ、参加者。最終順位・最終ポイントは都度集計（1-3 で確定） |
| 試合 | プレイヤー、点数、ポイント、順位、コメント |
| 試合のポイント | 点数から出せるものは自動計算、出せないものは手入力（1-1 で明確化） |
| ルール項目の候補 | 三麻/四麻、持ち点・返し点、ウマ、トビ、焼き鳥、その他（フリー入力） |
| 権限の大方針 | 麻雀グループのメンバーのみ閲覧・編集。Supabase RLS。招待制（公開ルームは MVP 外） |
| 認証 | メール + OAuth。ほぼ全ページで認証必須（方式の具体化は Phase 3） |
| データアクセス | 読み取りは RSC→Supabase、更新は Server Action。独自 REST は作らない |

#### Phase 1 で決めること

| # | 項目 | なぜ今決めるか | セッション |
|---|------|----------------|------------|
| A | エンティティ関係と多重度 | ER の地図。ここが無いと後工程が壊れる | 1-1 |
| B | 保存するもの vs 都度計算するもの | ポイント・順位・大会サマリーの持ち方が ER を左右する | 1-1 |
| C | プレイヤーの指し方 | 「個人の詳細管理は MVP 外」との境界。メンバー限定か、アカウントなし参加者を許すか | 1-1 |
| D | 大会参加者と試合プレイヤーの関係 | 大会の参加者集合と、各試合のメンバーが一致するか / 部分集合か | 1-1 |
| E | ルールスコープ | 麻雀グループの既定のみか、大会ごとの上書きか。ルールのぶら下がり先が決まる | 1-2 |
| F | 大会サマリーのデータの持ち方 | 試合から算出するか、手入力を残すか、両方か。UX ではなく保存方針 | 1-3 |
| G | ER 詳細（属性・必須・制約） | Phase 3 の migration の前提 | 1-4 |
| H | ルール項目の確定（第一級 vs フリー） | 第一級は 1-2。メモ（フリー）は 1-4 で持つ。計算式の細部は Phase 2〜4 | 1-2 / 1-4 |
| I | メンバーの役割 | 全員同等か、作成者・管理者を区別するか。RLS の粒度 | 1-5 |
| J | 招待のデータの持ち方 | Phase 4-1 で招待する前提。トークン等を ER に含めるか | 1-5 |
| K | RLS 方針 | 誰が何を読める / 書けるか。麻雀グループ配下への伝播 | 1-5 |

Phase 1 と Phase 2 の切り分け:

- **Phase 1**: データの置き場所・計算か保存か・誰が触れるか
- **Phase 2**: どの画面でどう操作するか、見た目、入力手順

同じ論点（ルールスコープ、大会サマリー）が両フェーズに載っているのはこのため。Phase 1 ではデータ方針だけ決める。

#### Phase 2 に送るもの

| 項目 | 理由 |
|------|------|
| 画面一覧・遷移・ナビゲーション | UI。モックの本題 |
| 試合入力が 1 画面かステップか | UX |
| ポイント自動計算の画面上のフィードバック | UX |
| 大会サマリーの操作感（確認・修正の流れ） | データ方針は 1-3。見せ方はモック |
| ルール設定画面のレイアウト | 置き場所は 1-2。画面はモック |
| 三麻と四麻の UI 差分 | 人数はドメイン。画面差分はモック |
| 色・typography・コンポーネント | デザイントークン |
| ポイント計算式の細部 | 入力項目と方針は Phase 1。式の具体化はモック〜実装 |
| `docs/ui-spec.md` の作成 | Phase 2 の成果物 |

最新の一覧は [1-6 の引き渡し](#16-クローズ)。

#### 触らない（MVP 外 / 後のフェーズ）

- 写真、成績・統計、結果のエクスポート・共有、PC レイアウト最適化
- 局単位の記録、アガリ役・和了情報
- 公開ルーム、ネイティブアプリ
- UI 実装、migration SQL、`supabase start`（Phase 3）、OAuth プロバイダの確定（Phase 3）

---

### 1-0 キックオフ

- [x] 決まっていること / Phase 1 で決めること / Phase 2 送り / MVP 外 を仕分け
- [x] 本ファイルに Phase 1 タスクを記載
- [x] [status.md](status.md) を Phase 1 着手に更新

### 1-1 ドメイン骨格

- [x] エンティティ一覧と親子関係・多重度
- [x] 保存 vs 計算（ポイントは自動計算＋手入力を保存。試合順位は基本ポイントから保存時計算。大会サマリーは 1-3）
- [x] プレイヤーの指し方（メンバー + ゲスト表示名。名寄せしない）
- [x] 大会参加者と試合プレイヤーの関係（試合プレイヤー ⊆ 大会参加者）
- [x] 上記を [overview.md](overview.md) に残す（詳細属性は 1-4）

### 1-2 ルールスコープ

- [x] 麻雀グループの既定（複数・テンプレート）を大会作成時にコピー。大会は複数ルール併用可
- [x] 第一級項目（人数、持ち点・返し、オカ同着、ウマ一式、トビ有無、焼き鳥有無、その他ポイント1〜5、レート）
- [x] 使用中の大会ルールは修正不可。変更は新規登録。決定を [overview.md](overview.md) に残す

### 1-3 大会サマリーの集計方針

- [x] 試合ポイント合計が正。大会修正ポイントはタイトル 1〜5 を大会、値 1〜5 を参加者へ。最終値は都度集計
- [x] 対象は 1 試合以上出場者。同ポイントは同位で次を飛ばす（1, 2, 2, 4）。UX は Phase 2
- [x] 決定を [overview.md](overview.md) に残す

### 1-4 ER 詳細

- [x] 属性、必須、制約、点数とポイントの持ち方
- [x] ER 図（Mermaid 想定。SQL は書かない）
- [x] Phase 3 が migration に落とせる粒度にする
- [x] [er.md](er.md) に独立して残す（概要は [overview.md](overview.md)）

### 1-5 RLS 方針

- [x] メンバーシップと役割（全員同等。役割カラムなし）
- [x] 招待のデータの持ち方（招待コード、有効期限、麻雀グループあたり最大 1）
- [x] 麻雀グループ配下（大会・試合・ルール）へのアクセス伝播（所属メンバーなら閲覧・編集）
- [x] 麻雀グループ削除（明示削除は空のときだけ。最後の 1 人の離脱は麻雀グループごと消す）
- [x] 操作ログ（監査テーブル。UI 非表示。**trigger で INSERT**。アプリロールはすべて不可。community_id なし）
- [x] 退会は墓石（`profiles` は残す。匿名化 + 全離脱 + Auth 削除。ゲスト載せ替えなし）
- [x] 方針をドキュメントに残す（policy SQL は Phase 3）。[overview.md](overview.md) / [er.md](er.md)（SELECT / INSERT / UPDATE / DELETE の判定経路）

### 1-6 クローズ

- [x] [overview.md](overview.md) をドメインの正として更新
- [x] [development.md](development.md) の検討事項チェックを更新
- [x] Phase 2 への引き渡しメモ（決めたデータ方針 / モックで決める UX）
- [x] [status.md](status.md) を Phase 1 完了・次は Phase 2 に更新（ユーザーレビュー後）

#### Phase 2 への引き渡し

ドメインの正は [overview.md](overview.md)。属性・制約・RLS 判定は [er.md](er.md)。モックでデータ方針は変えない。

**決めたデータ方針（モックで変えない）**

| 項目 | 内容 |
|------|------|
| 階層 | 麻雀グループ → 大会 → 試合。局単位は持たない |
| プレイヤー | メンバー（`profiles`）またはゲスト（大会ごとの表示名）。名寄せしない。試合プレイヤー ⊆ 大会参加者 |
| ルール | 麻雀グループの既定を大会作成時に値コピー。大会は複数併用可。試合は大会ルールを 1 つ必須。使用中の大会ルールは修正不可 |
| 保存 | 点数、家、基本ポイント、ポイント内訳、試合のポイント、試合順位は保存。大会の最終ポイント・最終順位と、参加者の試合ポイント合計は都度集計 |
| 大会サマリー | 試合ポイント合計 + 大会修正ポイント。対象は 1 試合以上出場。同ポイントは 1, 2, 2, 4 |
| 権限 | 全員同等。所属メンバーなら配下を閲覧・編集。公開ルームなし |
| 招待 | 招待コード（有効期限、麻雀グループあたり最大 1）。参加は関数経由 |
| 退会・削除 | 墓石。明示削除は空のときだけ。最後の 1 人の離脱は麻雀グループごと消す |

**モックで決める UX**

キックオフ時の「Phase 2 に送るもの」に、クローズで明示した画面上の論点を足す。

| 項目 | 理由 |
|------|------|
| 画面一覧・遷移・ナビゲーション | UI。モックの本題 |
| 試合入力が 1 画面かステップか | UX |
| ポイント自動計算の画面上のフィードバック | UX |
| 大会サマリーの操作感（確認・修正の流れ） | データ方針は Phase 1。見せ方はモック |
| ルール設定画面のレイアウト | 置き場所は Phase 1。画面はモック |
| 三麻と四麻の UI 差分 | 人数はドメイン。画面差分はモック |
| 色・typography・コンポーネント | デザイントークン |
| ポイント計算式の細部 | 入力項目と方針は Phase 1。式の具体化はモック〜実装。トビは有無のみなので、計算に追加フィールドが要るかもここで見る |
| 招待の画面手順、期限の既定日数 | 方式は招待コード。日数と入力フローはモック〜実装 |
| 除名・最後の 1 人離脱・麻雀グループ削除の確認 | 全員同等のため誤操作防止が必要。データ方針は変えない |
| ゲスト同名 | 同一大会のゲスト表示名は UNIQUE。区別の付け方はモック |
| ルール 0 件の大会 | 試合が作れない。作成導線の案内はモック |
| 点数合計が持ち点 × 人数と違うとき | DB 制約は持たない。画面の警告はモック |
| 試合一覧の並び | `created_at` 順。通し番号は持たない。並べ替え UI が要るかはモック |
| `docs/ui-spec.md` の作成 | Phase 2 の成果物 |

**Phase 3 へ送るもの（モックでは触らない）**

- migration SQL、RLS policy、`supabase start`
- 招待コードの文字種・長さ（3-3 で 10 文字 Crockford Base32）、OAuth プロバイダの確定
- 関数名（3-3: `create_community` / `join_community` / `leave_community` / `withdraw_account`）

## Phase 2: モック作成

**目的**: スマホ UI の認識合わせ。配置・遷移・入力順を決める。データ方針は変えない。

**完了条件**: 中核 6 画面が 375px で遷移できる。後回し画面（ルール、ログイン、招待）もワイヤーがある。`docs/ui-spec.md` があり、Phase 4 がモックとこの文書だけ見て実装に入れる。

進め方: 中核流れ（麻雀グループ一覧 → 大会 → 試合入力）を先に出し、ナビ本決め・見た目・ログインは後。2-0 は仕分けだけで終わらせず、同じセッションで一覧まで出す。

---

### キックオフ仕分け（2026-08-16）

出典は [1-6 の引き渡し](#phase-2-への引き渡し) / [development.md](development.md)。データ方針は [overview.md](overview.md)。

#### 決まっていること（再確認しない）

| 項目 | 内容 |
|------|------|
| 媒体 | `web/` の Next.js ページ。ダミーデータのみ（DB なし）。Phase 4 の骨格にする |
| 見た目 | まずワイヤー（配置・遷移・入力順）。色・トーンは後（2-7） |
| 操作 | 画面間リンクは動く。入力は見せるだけで保存しない |
| 範囲 | ログイン済み前提。麻雀グループ一覧 → 大会 → 試合入力まで一通り |
| 状態 | 基本フローのみ（空状態・エラー一式はモックしない） |
| ダミー | 麻雀グループは 1 つ。大会は複数、三麻/四麻混在 |
| 仕様書 | 作業中はメモ止め。2-8 で `docs/ui-spec.md` をまとめる |
| 確認 | 普段はブラウザのスマホ幅（375px）。要所（2-3 / 2-7）で LAN から実機 |
| 大会一覧 | 独立画面は作らない。麻雀グループ詳細内の一覧として扱う |
| データ方針 | Phase 1 のまま。モックで変えない |

#### Phase 2 で決めること（画面を作りながら）

1-6 の「モックで決める UX」をセッションに割り当てる。空状態・警告は基本フローの外なので、画面上の論点としては残すがモック本体では扱わない。

| # | 項目 | セッション |
|---|------|------------|
| A | 画面一覧・遷移。ナビは当面「戻る＋タイトル」 | 2-0 〜 2-4。本決めは 2-7 |
| B | 大会サマリーの見せ方（試合合計と大会修正ポイント） | 2-2 / 2-4 |
| C | 試合入力が 1 画面かステップか | 2-3 |
| D | ポイント自動計算の UI フィードバック。計算式の細部。トビ追加フィールドの要否 | 2-3 |
| E | 試合詳細と大会詳細の行き来。試合一覧の並び（並べ替え UI の要否） | 2-4 |
| F | ルール設定のレイアウト。三麻と四麻の UI 差分 | 2-5 |
| G | ログイン、招待の画面手順、期限の既定日数 | 2-6 |
| H | 色・typography・コンポーネント | 2-7 |
| I | `docs/ui-spec.md` | 2-8 |

次は触るが、基本フローのモックには出さない（必要なら 2-8 で ui-spec に方針だけ書く）:

- 除名・最後の 1 人離脱・麻雀グループ削除の確認
- ゲスト同名の区別
- ルール 0 件の大会の案内
- 点数合計が持ち点 × 人数と違うときの警告

#### 触らない（MVP 外 / 後のフェーズ）

- 写真、成績・統計、結果のエクスポート・共有、PC レイアウト最適化
- 局単位の記録、アガリ役・和了情報
- 公開ルーム、ネイティブアプリ
- 保存処理、migration SQL、`supabase start`（Phase 3）、OAuth プロバイダの確定（Phase 3）
- 空状態・エラー・確認ダイアログ一式（モックでは作らない。例外は削除の確認ダイアログ。2-7 で本採用）

#### 画面の優先

**先に作る（中核）**

1. 麻雀グループ一覧
2. 麻雀グループ詳細（大会一覧を含む）
3. 大会作成 / 編集
4. 大会詳細（試合一覧、参加者サマリー、最終順位/ポイント）
5. 試合作成 / 編集（ポイント計算の見せ方）
6. 試合詳細

**後に回す**

- ルール設定（試合はダミー上ですでにルールを選べる状態にする）
- ログイン / サインアップ
- 招待・メンバー操作
- ナビの本決め、色・コンポーネント

ルートは本番想定のまま置く（例: `/communities`、`/communities/[id]`、`/tournaments/[id]`、`/matches/new`）。Phase 4 で中身を差し替える。ダミーは `web/src/mock/` など一箇所。

---

### 2-0 キックオフ + 麻雀グループ一覧

- [x] 本ファイルに Phase 2 タスクを記載
- [x] [status.md](status.md) を Phase 2 着手に更新
- [x] ダミーデータ（1 つの麻雀グループ、大会複数、三麻/四麻混在）
- [x] 共通ヘッダー（戻る＋タイトル）。ブランド色は入れない
- [x] 麻雀グループ一覧のワイヤー（375px）
- [x] ルート骨格（一覧から入れること）

### 2-1 麻雀グループ詳細

- [x] 麻雀グループ詳細（大会が複数並ぶ）
- [x] 一覧 ↔ 詳細の遷移

### 2-2 大会

- [x] 大会作成 / 編集のワイヤー
- [x] 大会詳細（参加者サマリー、試合一覧、最終順位/ポイント）
- [x] 大会サマリーの見せ方を見る（データ方針は変えない）

見せ方（仮。2-4 で再確認可）: 1 画面スクロール。日付・ルールの下にメモ（麻雀グループ詳細と同じく最大3行、空なら出さない）。見出しは「総合順位」（途中経過でも見るため）。総合順位は最終ptのみ。未出場は同じリストで順位を「-」。補正は総合順位タイトル行右の「ポイント補正」から別画面。その画面は縦＝利用者、横＝試合pt＋補正（初期1列、＋で追加、最大5）＋右端に差し引きの合計pt。保存は見せるだけ。試合一覧は `#n`（新しい試合が上）と順位・ポイント。追加は試合一覧タイトル行右の「追加」。各試合は右の「詳細」。大会作成・編集の参加者は **参加者** と **ゲスト参加者** を別カード（見出し右が追加。空のときは「まだ追加していません」を出さない）。説明はカードの外・一覧の下。参加者「麻雀グループのメンバーから、参加者を追加します。」ゲスト「アカウントを持っていない人を、名前だけで追加します。」ルール「大会のルールを追加します。」／改行／「試合で使用中のものは修正できません。」（本採用）。ルールは行タップでルール画面へ（削除はその画面の最下部。2-7 の削除 UI 方針に従う）。保存しない。

### 2-3 試合作成 / 編集

- [x] 試合作成 / 編集（プレイヤー、点数、ポイント計算の見せ方、試合個別ポイント）
- [x] 1 画面 vs ステップ、計算フィードバックを決める
- [x] 入力フローを一緒に踏む。要所で実機確認（同一 LAN の手順は [development.md](development.md#同一-lan-のスマホから見る)）

見せ方（仮）: **1 画面の表（四麻）**。列＝**家**（東家・南家・西家・北家）＋参加者。行＝素点 → 基本pt → 順位 → ウマ（ルールでありのとき）→ ルールに応じた入力（トビは素点 0 以下、焼き鳥・名称付きその他、試合個別は「行を追加」最大3）→ 合計pt → レート → 反映pt。ポイントは **pt** と略す。順位は基本ptの高い順。上家取りは家の順（東→南→西→北）。素点同点かつオカ手動のときはオカ行は出さず、1位の基本ptを手入力。計算ボタン・画面遷移なし。保存しない。実機確認はユーザー。

### 2-4 試合詳細 + 中核の通し

- [x] 試合詳細（順位、点数、ポイント、コメント）
- [x] 大会詳細との行き来
- [x] 中核 6 画面が一通り踏めること

見せ方（仮）: 独立画面 `/matches/[id]`。試合一覧の右は「詳細」。詳細ヘッダーは `#n`、右上「修正」。中身はルール名、順位・家・名前・反映pt、点数、コメント（空なら出さない）。内訳の表は修正画面。並べ替え UI は作らない（新しい試合が上の `#n` のまま）。大会サマリーは 2-2 のまま。保存しない。

### 2-5 ルール設定

- [x] 麻雀グループの既定 / 大会ルールのレイアウト
- [x] 三麻と四麻の画面差

見せ方（仮）: 麻雀グループ詳細の下部に既定ルール一覧（追加 / 詳細）。大会は編集画面から詳細・追加。大会への追加は、麻雀グループの既定からのコピー選択 → フォーム（値は複製。コピー後に大会用へ直せる）。いちから作成も可。既定が 0 件ならいちから作成のみ。フォームは 1 画面。人数で三麻/四麻を切り替え、ウマありのときだけ同着とウマpt、四麻のときだけウマ（2位⇔3位）。その他ポイントは見出し右の「追加」（最大5、未入力時は枠1つ、プレースホルダ「例：役満ご祝儀」）。大会ルールは試合で使っていれば閲覧のみ（新規登録へ案内。削除も無効表示）。未使用は編集・削除可（削除は画面最下部）。作成中の大会もルール画面へ遷移し、コピー・編集・削除の見た目を確認できる。保存しない。

### 2-6 ログイン・招待・メンバー

- [x] ログイン / サインアップ（形式だけ。認証はしない）
- [x] 招待の画面手順、期限の既定日数
- [x] メンバー操作の画面手順（確認ダイアログ一式は作らない）

見せ方（仮）: ログイン初画面はメール＋次へ / Googleでログイン / LINEでログインの三択。パスワードは次へのあと。Supabase でも可（パスワードは 2 画面目で `signInWithPassword`、Google/LINE は初画面から OAuth。LINE 有効化は Phase 3）。サインアップは表示名を足す。認証しない。ログイン中は佐藤。ログイン後のトップは **俺たちの雀歴**（`/communities`）。上部が自分のプロフィール（アイコンは他人のプロフィールと同じ 80px。表示名はヘッダーと同じ text-heading。麻雀グループカードとの間は一段広く）。下部に麻雀グループ一覧（カード枠。見出し右が追加。招待コードで参加はカード内・一覧の下、追加と同じ小さなボタンで右寄せ。「麻雀グループってなに？」はカードの外・参加ボタンの下）。プロフィール編集は表示名の修正と、最下部の「アプリを退会する」（文字リンク。確認は出さない）。招待コードは麻雀グループあたり1つ、既定期限は **7日**、期限切れまで何度でも。メンバーは麻雀グループ詳細にアイコン横スクロール。Google / LINE はプロフィール画像、メール登録は頭文字。アップロードはしない。アイコンタップで読み取り専用のユーザ詳細（アイコン・表示名・コメント。編集不可。ゲストは対象外）。自分の編集はトップのプロフィール「編集」。招待は見出し右。離脱は詳細に出さず、ヘッダー「編集」→麻雀グループ編集の最下部に文字リンクとして置く（普段使わないため）。除名の確認は出さない（操作はモックでは詳細に置かない）。保存しない。

### 2-7 ナビ・見た目

- [x] ナビゲーションの本決め（タブ / ハンバーガー / 戻る）
- [x] 色・typography・コンポーネントのトーン
- [x] 要所で実機確認（ユーザー確認済み）

見せ方（仮）: **ナビは戻る＋タイトルを本採用**。色の土台は案2 **雀卓**。構成は案A **カード枠**。一覧は行タップ＋シェブロン。カード内は案F **明細を一段下げる**。入力欄は白背景。ラジオは墨。ボタンは案H **ごく薄い影**（タップで 1px 沈む）。トップはタイトル「俺たちの雀歴」。上部が自分のプロフィール（アイコン 80px、表示名はヘッダーと同じ大きさ。カードとの間を一段空ける）、下部が麻雀グループ一覧（他の一覧と同じカード枠。招待コードで参加はカード内・一覧の下、追加と同じ小さなボタンで右寄せ。「麻雀グループってなに？」はカードの外・参加ボタンの下）。大会作成・編集は **参加者** / **ゲスト参加者** / **ルール** を別カード（見出し右が追加。空メッセージなし。説明はカードの外）。参加者追加・ゲスト追加は別画面（保存しない。戻ると一覧は元のまま）。ルール説明は本採用（2文・改行）。保存しない。

削除 UI の方針（本採用）: **詳細・編集画面を持つ明細は、一覧の行はナビゲーション専用（行タップ＋シェブロン）にし、削除はその画面の最下部**に置く。文字ボタン（`text-sm text-muted`、離脱・退会と同じ位置）＋確認ダイアログ（実行／「キャンセル」）。スワイプ削除・一覧の編集モードは採らない。まとめて削除が要る一覧が出たらそのときに編集モードを検討する。対象は大会（大会編集）、試合（試合編集）、ルール（麻雀グループの既定 / 大会 / 作成中の大会）。削除できないもの（試合で使用中のルール）はボタンを無効表示し、理由を一文添える。麻雀グループ自体の削除は基本フロー外のまま（編集画面の「この麻雀グループを抜ける」のみ。方針は 2-8 の ui-spec に残す）。一方、フォーム内の参加者・ゲストは削除ではなく選択解除なので、行の右端の「外す」を維持する。モックでは消さずに戻り先へ遷移するだけ。共通部品は `DangerAction`（`label` / `dialogTitle` / `dialogBody` / `confirmLabel` / `doneHref` / `disabled` / `disabledNote`）。

**アプリを退会する**（プロフィール）と **この麻雀グループを抜ける**（麻雀グループ編集）も同じ `DangerAction` に寄せ、確認ダイアログを出す（2-6 の「確認は出さない」を上書き）。削除より影響が大きいため、破壊的操作は一律で確認する。

カード内の一覧の枠線: 一覧がカードの最後の要素なら `border-t`（最下行の下は引かない。カード枠との二重線を避ける）。下に別の要素が続くときだけ `border-y`（例: トップの麻雀グループ一覧は下に「招待コードで参加」が続く）。大会作成・編集の 3 カードは `border-t` に統一済み。

4 案の比較用ページ `/preview` と `src/theme/` の案データ・プレビュー部品は、トーン確定に伴い削除した。

2-8 の ui-spec に残す細かい方針: 危険色のトークンは持たない（確認ダイアログの実行ボタンもアクセント色）。無効時の文字ボタンは `disabled:text-line`。カード内の小さいボタンはヘッダー（`spacing-header-btn` = 2.1rem）より小さいが実機確認で問題なし。確認ダイアログはフォーカストラップ・背景スクロール固定を持たない（Phase 4 で見る）。

### 2-8 クローズ

- [x] `docs/ui-spec.md` を作成（画面遷移・コンポーネント・デザイントークン）
- [x] 基本フローの外の論点（空状態・警告・誤操作防止）は方針だけ ui-spec に残す
- [x] [status.md](status.md) を Phase 2 完了・次は Phase 3 に更新（ユーザーレビュー後）

UI の正は [ui-spec.md](ui-spec.md)。見た目の正は `web/` のモック。ドメインは [overview.md](overview.md)。

#### Phase 3 / 4 への引き渡し

**決めた UX（実装で変えない）** は ui-spec の同名節。要約:

| 項目 | 内容 |
|------|------|
| ナビ | 戻る＋タイトル |
| トーン | 雀卓。カード枠。行タップ＋シェブロン |
| 試合入力 | 1 画面の表。家が列。入力のたびに再計算 |
| 大会サマリー | 総合順位は最終 pt。補正は別画面 |
| 招待 | コード。既定 7 日 |
| 破壊的操作 | 詳細・編集の最下部。確認ダイアログ |
| 空状態・除名・警告 | ui-spec の「基本フロー外の方針」 |

**Phase 3 で触る（モックでは触らない）**

- `supabase start`、migration SQL、RLS policy、関数
- 招待コードの文字種・長さ（3-3 で 10 文字 Crockford Base32）
- 関数名（3-3: `create_community` / `join_community` / `leave_community` / `withdraw_account`）
- pgTAP（主）と薄い PostgREST。CI で lint / Advisors / `auth.uid()` 検査と `supabase test db`
- Auth はメールを正。OAuth プロバイダの確定は 3-7（ローカル必須にしない）
- テストケースの正は [test-cases.md](test-cases.md)（3-3 で作成。実装の pgTAP より先）
- DB 静的検査は `supabase db lint` と `supabase db advisors`（方針は 3-2）

**Phase 4 で触る**

- 詳細は [Phase 4](#phase-4-mvp-実装)
- 基盤（4-1 ドメイン・4-2 共通 UI）のあと、**4-3** で本番ログイン + トップを接続
- 4-4 以降でモックを保存・読取に差し替える
- 基本フロー外の方針とバリデーションは、接続する機能のセッション（残りは 4-9）

## Phase 3: Supabase スキーマ + 認証

**目的**: ER を migration にし、RLS と関数を自動テストで固定する。Auth（メール）と生成型まで。`web/` の画面は触らない。

**完了条件**: `supabase test db`（pgTAP）が緑。薄い PostgREST 通しがある。業務テーブルは RLS 有効。生成型がある。画面の実データ接続はまだしない。

進め方: ランナー（3-1）→ **Advisor / Lint 方針（3-2）** → **全テストケースを `docs/test-cases.md` に固定（3-3）** → スキーマ → RLS → 関数 → Auth。ケースは実装セッションの冒頭に分けて書かない。

---

### キックオフ仕分け（2026-08-18）

出典は [2-8 の引き渡し](#phase-3--4-への引き渡し) / [development.md](development.md) / [er.md](er.md)。権限の正は [overview.md の権限モデル](overview.md#権限モデルphase-1-5) と [er.md の RLS 方針](er.md#rls-方針)。

#### 決まっていること（再確認しない）

| 項目 | 内容 |
|------|------|
| 範囲 | DB・RLS・関数・Auth・型・自動テスト。`web/` のページ・コンポーネントは触らない |
| 中間物 | Phase 3 と Phase 4 の間に、双方の成果を受ける画面は置かない。テスト専用アプリも作らない |
| ログイン〜一覧 | Phase 4-3。本番の `LoginForm` と `/communities` を実セッションに接続する（その前に 4-1 / 4-2） |
| 権限の正 | RLS 一点。所属メンバーなら配下を閲覧・編集。作成・参加・退会は関数 |
| テストの正 | 本物の Postgres（RLS 有効）。クライアントのモックでは権限を担保しない |
| ケースの正 | [test-cases.md](test-cases.md)（3-3 で一括作成。制約・RLS・関数） |
| 主テスト | pgTAP。`supabase/tests/`。`supabase test db`。ケース ID と 1 対 1 |
| 副テスト | JWT + anon キーで PostgREST を薄く叩く（GRANT・RPC 公開） |
| 画面 E2E | Phase 3 ではやらない。権限行列の再実装にも使わない |
| service role | seed と操作ログ確認のみ。業務操作の成功判定には使わない |
| 役割 | 全員同等。役割カラムなし |

#### Phase 3 で決める / 作ること

| # | 項目 | セッション |
|---|------|------------|
| A | テストの層・置き方・CI の入口 | 3-0 |
| B | `supabase start`。空でも `supabase test db`。CI で同じ入口 | 3-1 |
| C | Advisor / Lint の役割・CI・除外。自前の `auth.uid()` 静的チェックの要否 | 3-2 |
| D | **全テストケース**を `docs/test-cases.md` に書く。関数名。SQL は書かない | 3-3 |
| E | テーブル・制約・FK・trigger。制約ケースの pgTAP | 3-4 |
| F | 所属判定ヘルパー + 全表 RLS。RLS ケースの pgTAP | 3-5 |
| G | 作成・参加・離脱・退会の関数。関数ケースの pgTAP。薄い PostgREST | 3-6 |
| H | メール Auth、`profiles` trigger、型生成。OAuth は設定まで | 3-7 |

#### 触らない（Phase 4 / MVP 外）

- `web/` の画面・ナビ・モックデータの差し替え
- テスト専用の画面や別アプリ
- 大会・試合・ルールの Server Action
- Playwright 等の画面 E2E で権限行列を踏むこと
- 写真、統計、PC 最適化、公開ルーム

#### Phase 4 に送るもの

- 生成型、RLS、関数、ローカル Auth
- 4-1: ドメイン切り出し + Vitest（画面接続の前）
- 4-3: 本番ログイン + トップの SELECT（cookie → RSC → クライアント → RLS）
- 4-4 以降: モックを保存・読取に差し替え

---

### 3-0 キックオフ

- [x] Phase 3 の範囲（画面を触らない。専用テスト画面なし。ログイン骨格は当時 4-0 と書いた。番号は 4-3）
- [x] テスト層（pgTAP 主、PostgREST 副、画面 E2E は後）
- [x] テストケースは `docs/test-cases.md` に独立。実装より前（3-3）に一括作成
- [x] 本ファイルに Phase 3 タスクを記載
- [x] [development.md](development.md) / [tech-stack.md](tech-stack.md) / [ui-spec.md](ui-spec.md) の引き渡しを更新
- [x] [status.md](status.md) を Phase 3 着手に更新

#### テスト方針

権限仕様の正は [er.md の RLS 方針](er.md#rls-方針)。断言するケースの正は [test-cases.md](test-cases.md)（3-3 で作成）。pgTAP はケース ID を実行するだけ。成功より **他グループ・未ログイン・墓石・未所属が失敗すること** を厚くする。

**関連資料の作成タイミング**

ケースは 3-5 / 3-6 の冒頭に分割しない。スキーマ・RLS・関数の実装（3-4 以降）より前に、一ファイルへ全部書く。

| 資料 | いつ | 中身 | やらないこと |
|------|------|------|----------------|
| 本節（層・アクター・入口） | 3-0 済み | 方針 | ケース ID の列挙 |
| ランナー | 3-1 | 空の pgTAP が緑。CI | 業務ケースの SQL |
| Advisor / Lint 方針 | **3-2** | `db lint` / `db advisors` の役割、CI、除外、自前静的チェック | 業務関数の SQL |
| [test-cases.md](test-cases.md) | **3-3** | 制約・RLS・関数・メタテストの全ケース。関数名。日本語の表 | migration / policy / 関数の SQL |
| 制約の pgTAP | 3-4 | `test-cases.md` の制約 ID を実装 | ケースの新規発明 |
| RLS の pgTAP | 3-5 | 同・RLS ID | ケースの新規発明 |
| 関数の pgTAP + PostgREST | 3-6 | 同・関数 ID | ケースの新規発明 |
| Auth・型 | 3-7 | 生成型。`profiles` trigger | 原則ケース追加。要れば `test-cases.md` を先に直す |

3-2（Lint 方針）と 3-3（ケース一覧）はどちらもスキーマ実装より前。Lint 方針を先に固定してからケースを書く。

実装中にケースが足りなければ、SQL を足す前に `test-cases.md`（必要なら `er.md`）を更新する。

**層**

| 層 | 何を担保するか | 置き場所 | コマンド |
|----|----------------|----------|----------|
| A. pgTAP（主） | `test-cases.md` の ID | `supabase/tests/*_test.sql` | `supabase test db` |
| B. PostgREST（副） | JWT・`GRANT`・RPC が API に出ていること | 3-6 で置く。`web/` の画面テストにはしない | ローカル Auth の JWT + anon キー |
| C. 画面 E2E | 煙 | Phase 4-3 以降 | 権限行列は再実装しない |
| D. 静的検査 | 定義の形（RLS 有無、`search_path`、`EXECUTE`、型） | CI。方針は 3-2 | `supabase db lint` / `supabase db advisors` |

**メタテスト（改修事故）** — 3-3 の `test-cases.md` に ID を付ける

- `public` の業務テーブルはすべて `ENABLE ROW LEVEL SECURITY`
- それぞれに policy が 1 本以上ある
- `anon` / `authenticated` の `GRANT` が意図どおり（`activity_logs` をアプリロールに出さない等）

**フィクスチャ（pgTAP 内に閉じる。本番 seed と混ぜない）**

| アクター | 役割 |
|----------|------|
| メンバー A | 麻雀グループ 1 に所属 |
| メンバー B | 麻雀グループ 2 のみ（1 は見えない） |
| 未ログイン | すべて不可 |
| 離脱済み（プロフィールは利用中） | グループ 1 配下は不可。大会参加者として載っていれば A から表示名は読める |
| 墓石 | ログインできない。参加者行は残り、A から名前だけ読める |

3-3 のケースは、各テーブルで少なくとも次を ID にする: A は自分のグループだけ読める。B はグループ 1 に書けない。未所属は招待コードを SELECT できない。`community_memberships` への直接 INSERT は不可。`activity_logs` はアプリロールで SELECT / INSERT / UPDATE / DELETE 不可（記録は trigger）。`profiles` の UPDATE は本人だけ。

所属判定はヘルパー 1 つに寄せ、各表の policy は薄くする。表ごとの「B が 0 件」は残す（policy 付け忘れ用）。

`SECURITY DEFINER` は関数ケースに書く: `search_path` 固定、`auth.uid()` を関数内で検証。期限切れ参加・最後の 1 人離脱・墓石。スーパーユーザーで通ったことを成功と数えない。

CI は手元と同じ入口（`supabase start` のあと、静的検査 → `supabase test db`）。3-1 で pgTAP、3-2 で Lint / Advisors / grants 補完 / `auth.uid()` 静的検査を足した。

### 3-1 ローカルスタック

- [x] Dev Container 内で `supabase start`
- [x] Studio / 接続確認。`web/.env.local` は接続情報まで（画面は繋がない）
- [x] `supabase test db` が空でも緑
- [x] CI で同じコマンドが走る（`.github/workflows/ci.yml`。リモート未設定のため Actions は未実行）

### 3-2 Advisor / Lint 方針

権限の正は pgTAP。静的検査は **定義の形**（付け忘れ・公開範囲）を早く落とす。`auth.uid()` の正しい使用は標準ルールに無いので、自前チェックと pgTAP に分ける。

**道具**

| コマンド | 実体 | 見ること | 見ないこと |
|----------|------|----------|------------|
| `supabase db lint` | plpgsql_check | 型、未使用変数、`EXECUTE` の連結（インジェクション） | RLS、`auth.uid()`、引数名、GRANT |
| `supabase db advisors --type security` | splinter | RLS 未設定、`search_path` 未固定 等 | CLI では `pgrst.db_schemas` が空のため **0028/0029 は出ない** |
| `check-definer-grants.sh` | 自前（0028/0029 相当） | anon / authenticated が DEFINER を `EXECUTE` できること。0029 は許可リスト外だけ落とす | `auth.uid()`、引数名 |
| `check-definer-auth-uid.sh` | 自前 | ユーザー ID 引数禁止、本体に `auth.uid()` がある | 呼んだあと無視する誤用 |
| pgTAP | 実行 | 未ログイン失敗、他人のグループを触れない | — |

**ベースライン（2026-08-18、業務テーブルなし）**

- `db lint --local --schema public` → 指摘なし
- `db advisors --local --type security --level warn` → 指摘なし
- `db advisors --type all --level info` → `_realtime` の未使用インデックス 1 件（INFO。対象外）

**方針（2026-08-18 確定）**

1. CI（`supabase start` のあと、`test db` の前）
   - `supabase db lint --local --schema public --fail-on warning`
   - `bash supabase/ci/run-security-advisors.sh`（Advisors JSON の 0029 除外 ＋ `check-definer-grants.sh`）
   - `bash supabase/ci/check-definer-auth-uid.sh`（対象関数が 0 件ならスキップ）
2. 0029 の許可リスト: `create_community` / `join_community` / `leave_community` / `withdraw_account` / `is_community_member`（`allowlist.json` の `advisor0029Functions`）。authenticated が DEFINER を呼んでよい明示オプトイン。ヘルパーは RLS policy から呼ぶため GRANT が必要（PostgREST の RPC には出さない）。**新しい DEFINER の authenticated EXECUTE は 0029 で落ちる**（意図した公開だけ足す）。**0028**（anon が呼べる）は落とす。CLI の `db advisors` は `pgrst.db_schemas` が空のため 0028/0029 を出さないので、同じ判定を `check-definer-grants.sh` で補う
3. `auth.uid()` 検査は `public` / `private` の **SECURITY DEFINER**（sql / plpgsql。trigger 以外）をすべて見る。新規追加はリスト更新なしで対象。例外だけ `allowlist.json` の `authUidExclude`（`schema.function` または関数名）。引数名 `user_id` / `auth_user_id` / `uid` および `p_` 付きは禁止。本体に `auth.uid()` が無いと失敗
4. 標準検査は pgTAP の代わりにしない

- [x] 公式コマンドの役割を切り分けた
- [x] 空スキーマのベースラインを取った
- [x] CI の fail-on・許可リストを確定した
- [x] 自前 `auth.uid()` チェックを 3-2 の CI に入れた（関数 0 件はスキップ）
- [x] CI に lint / Advisors 除外ラッパー / grants 補完 / `auth.uid()` 検査を足した

### 3-3 テストケース一覧

実装（スキーマ / RLS / 関数）より前に、断言するケースを全部書く。3-5 や 3-6 の冒頭には分割しない。

- [x] [test-cases.md](test-cases.md) を新規作成（制約・RLS・関数・メタテストを一ファイル）
- [x] 形式は ID・テーブルまたは関数・操作・アクター・期待・er.md の根拠
- [x] 関数名をここで決める（ケースが参照する）: `create_community` / `join_community` / `leave_community` / `withdraw_account`。ヘルパー `private.is_community_member`。除名はメンバーシップ直接 DELETE
- [x] 招待コードの文字種・長さをケースが書ける粒度まで決める（10 文字 Crockford Base32、CHECK）
- [x] er.md と食い違う点があれば、先に er.md を直す
- [x] migration / policy / 関数の SQL は書かない

### 3-4 スキーマ

- [x] [er.md](er.md) を migration SQL にする（テーブル、制約、FK、trigger。操作ログは `private.trg_append_activity_log`）
- [x] [test-cases.md](test-cases.md) の制約 ID を pgTAP にする（空のときだけ削除、招待 UNIQUE、試合中ルールの修正不可、操作ログ trigger など）
- [x] このセッションでケースを増やさない。不足は `test-cases.md` を先に直す

### 3-5 RLS

- [x] 所属判定ヘルパー（利用中プロフィール + `community_memberships`）
- [x] 全業務テーブルの RLS policy（判定経路は er.md）
- [x] [test-cases.md](test-cases.md) の RLS ID とメタテストを pgTAP にする
- [x] ポリシーと pgTAP を同じセッションで。落ちるテストから書いてよい
- [x] このセッションでケースを増やさない。不足は `test-cases.md` を先に直す（ヘルパー GRANT は M-09 / M-09b に直した）

### 3-6 関数

- [x] 麻雀グループ作成・参加・離脱・退会（`create_community` / `join_community` / `leave_community` / `withdraw_account`）。除名は `community_memberships` 直接 DELETE
- [x] `community_memberships` への直接 INSERT は認証ロールでは不可
- [x] [test-cases.md](test-cases.md) の関数 ID を pgTAP にする
- [x] 薄い PostgREST 通し（JWT + GRANT + RPC。`supabase/ci/postgrest-smoke.sh`）
- [x] このセッションでケースを増やさない。不足は `test-cases.md` を先に直す

### 3-7 Auth と型

ログイン〜一覧の画面接続ではない（それは Phase 4-3）。

- [x] メール Auth。登録時に `profiles` が付く trigger
- [x] OAuth（Google / LINE）は設定と画面導線の前提まで。ローカル必須にしない
- [x] `supabase gen types` → `web/` の型ファイルのみ（ページは触らない）
- [x] [status.md](status.md) を Phase 3 完了・次は Phase 4-0 に更新（ユーザーレビュー後）

## Phase 4: MVP 実装

**目的**: モックの見た目を正として残し、コンポーネント構成と計算は整理したうえで、Phase 3 の DB / RLS / 型を画面が消費する。

**完了条件**: ログインから試合記録まで実データで一通りできる。ドメイン計算の Vitest が緑。CI に `web` job（lint / `tsc` / format / vitest）と既存の `db` job、4-3 以降に Playwright 煙がある。テスト専用画面は無い。

進め方: キックオフ → ドメイン + Vitest + CI → 共通 UI → ログイン接続 → 機能ごと接続。モックのファイル分割は正にしない。

---

### キックオフ仕分け（2026-08-18）

出典は [3-7](#37-auth-と型) / [2-8 の引き渡し](#phase-3--4-への引き渡し) / 本セッションの方針確定。見た目の正は [ui-spec.md](ui-spec.md) と `web/` のモック。計算の意図は [overview.md](overview.md)。権限の正は [test-cases.md](test-cases.md)。

#### 決まっていること（再確認しない）

| 項目 | 内容 |
|------|------|
| 見た目 | 配置・文言・遷移・トーンはモック + ui-spec。ピクセル完全再現はしない |
| 構造 | コンポーネント分割とクラスの寄せは 4-1 / 4-2 済み。`mock/` は接続が進んだ画面から消す |
| 計算の意図 | overview の同着（上家取り / 折半 / 手動）など。現行 `match-points.ts` は正にしない。違えば 4-1 で直す |
| スタイリング基盤 | Tailwind と既存トークン（`globals.css` / `components/ui/classes.ts`）を維持する。CSS Modules 化やトークンの作り直しはしない |
| 権限 | RLS 一点。画面 E2E で権限行列を再実装しない。クライアントのモックでは権限を担保しない |
| データアクセス | 読み取りは RSC→Supabase、更新は Server Action。循環する操作は `supabase.rpc`。独自 REST は作らない |
| テスト専用画面 | 作らない。4-3 は本番の `LoginForm` と `/communities` |
| 媒体 | 375px を基準。PC 最適化は MVP 外 |

#### Phase 4 で決める / 作ること

| # | 項目 | セッション |
|---|------|------------|
| A | 層・ディレクトリ・テスト・CI・セッション分割 | 4-0（本節） |
| B | 計算ケースを `docs/calc-cases.md` に書く。`lib/domain/` + Vitest + CI の `web` job | 4-1 |
| C | 共通部品を `components/ui/` へ。`MatchForm` / `RuleForm` を視覚ブロックで分割 | 4-2 |
| D | ログイン + トップの SELECT。`/auth/callback`。Playwright 煙 | 4-3 |
| E | 麻雀グループ CRUD + 招待 | 4-4 |
| F | ルール設定 | 4-5 |
| G | 大会 CRUD | 4-6 |
| H | 試合 CRUD（計算は 4-1 の純関数） | 4-7 |
| I | 大会サマリー | 4-8 |
| J | 横断の空状態・ローディング・フォーカストラップの残り | 4-9 |

接続セッション（4-3 以降）の型: 読み取り（RSC）→ 更新（Server Action / RPC）→ その機能の空状態・エラー・バリデーション → 使わなくなった mock を削除 → 新しい純ロジックがあれば Vitest。

#### 触らない（MVP 外 / 後のフェーズ）

- Tailwind やトークンの作り直し、CSS Modules 化
- 全ページの作り直し、全画面の Testing Library、スクリーンショット回帰
- Playwright で全画面・権限行列を踏むこと
- 接続前の repository パターン一式
- 写真、統計、PC 最適化、公開ルーム

#### Phase 5 に送るもの

- Vercel デプロイ、Supabase Cloud、Redirect URL、本番 smoke

---

### 4-0 キックオフ

- [x] 見た目はモック + ui-spec、構造は再整理、計算の意図は overview（実装が違えば 4-1 で直す）
- [x] セッション分割（4-0〜4-9）。ログイン接続は 4-3
- [x] 4-2 の厚さは共通部品 + `MatchForm` / `RuleForm` の分割まで（全ページ再分割はしない）
- [x] テスト層と CI（`db` と `web` を分ける。Playwright 煙は 4-3）
- [x] ディレクトリ契約（`lib/domain/` / `lib/data/` / `components/` / `mock/`）
- [x] 本ファイルに Phase 4 タスクを記載
- [x] [development.md](development.md) / [tech-stack.md](tech-stack.md) / [ui-spec.md](ui-spec.md) / [overview.md](overview.md) を更新
- [x] [status.md](status.md) を Phase 4 着手・次は 4-1 に更新

#### コードの層

| 置き場 | 役割 | 依存してよいもの |
|--------|------|------------------|
| `app/` | ルート。読む・並べる | `lib/data/`（4-3 以降）、`components/`、接続前は `mock/` |
| `components/` | 見た目 | ドメイン型と表示用 props。計算も fetch もしない |
| `lib/domain/` | 純関数（ポイント、順位、整形、バリデーション） | なし（React / Supabase / mock 禁止） |
| `lib/data/` | RSC / Server Action と DB 型の変換 | `lib/supabase/`、`lib/domain/` |
| `lib/supabase/` | クライアントと生成型 | Supabase SDK |
| `mock/` | フィクスチャと薄い list/get | `lib/domain/`。接続が進んだら消す |

UI は camelCase のドメイン型だけを見る。`database.types.ts` は `lib/data/` と `lib/supabase/` の外に出さない。

#### テスト方針（Phase 4）

権限の正は引き続き pgTAP。[test-cases.md](test-cases.md) は触らない（アプリ制約は「Phase 4 に送る」のまま）。計算は Phase 3 と同じく **ケースを先に書く**（4-1 の `docs/calc-cases.md`）。Vitest はケース ID を実行するだけ。

| 層 | 何を担保するか | 置き場所 | コマンド | CI |
|----|----------------|----------|----------|-----|
| A. pgTAP | `test-cases.md` の ID | `supabase/tests/*_test.sql` | `supabase test db` | 既存 `db` job |
| B. PostgREST | GRANT・RPC | `supabase/ci/postgrest-smoke.sh` | 同スクリプト | 既存 `db` job |
| C. Vitest | ポイント・順位・整形・バリデーション | `web/src/lib/domain/` | `npm test` | `web` job |
| D. 静的検査（アプリ） | lint / 型 / フォーマット。死んだ `type="button"` | `web/` | `npm run lint` / `tsc` / `format:check` | `web` job |
| E. Playwright | [e2e-cases.md](e2e-cases.md)（通常画面の到達、各表に 1 行） | `web/e2e/` | `npm run test:e2e` | 別 job `e2e`（Supabase が要る） |
| 人 | 375px の見た目 | — | ブラウザ | CI にしない |

`web` job は Docker の Supabase を起動しない。権限行列は画面テストにしない。画面 E2E の正は [e2e-cases.md](e2e-cases.md)。

#### 計算ケース（4-1 で書く）

正は [calc-cases.md](calc-cases.md)。意図は overview。特にウマ・オカの同着（上家取り / 折半 / 手動）と大会の 1, 2, 2, 4。試合順位は **素点**。現行実装が違えばケースに合わせて直す。SQL や画面テストは書かない。

### 4-1 ドメイン切り出し + Vitest + CI

見た目は変えない。例外: 試合入力の行順を 素点 → 順位 → 基本 pt にする。ブラウザ確認は不要。

決めたこと（2026-08-18）:

- ウマ折半は順位スロットの合計を同着者で分配。端数 0.1 は上家（東→南→西→北）が多く取る。オカ折半も同じ（M リーグ第6章第2条6）
- 試合順位は素点。大会の最終順位・試合ポイント合計も `lib/domain/` に置く
- オカ手動は 1 位同着のとき出場者全員の基本 pt を手入力

- [x] [calc-cases.md](calc-cases.md) を新規作成（試合ポイント、同位、大会最終ポイント・最終順位、点数合計の警告判定）。overview と食い違う点があれば先に overview を直す
- [x] `web/src/lib/domain/` に純関数を移す（型、`match-points`、順位、大会サマリーの式、整形）。React / Supabase / mock に依存しない
- [x] `mock/` はドメインを呼ぶアダプタに縮める。フォーム DTO は mock 神モジュールから外す
- [x] Vitest。ケース ID と 1 対 1。このセッションでケースを増やさない。不足は `calc-cases.md` を先に直す
- [x] CI に `web` job（`web/` で lint / `tsc --noEmit` / `format:check` / vitest）。`db` job は触らない
- [x] [tech-stack.md](tech-stack.md) / [status.md](status.md) を更新

### 4-2 共通 UI の整理

ダミーデータのまま。配置・文言・色は変えない。Tailwind / トークンは作り直さない。

- [x] 共通部品を `components/ui/` に寄せる（Field、Radio、表セル、既存の SectionCard / RowLink / ボタンクラス）
- [x] `MatchForm` / `RuleForm` を視覚上のブロックで分割する（家の列、素点行、ルール連動行など）
- [x] 重複クラスを `ui/classes.ts` に戻す（試合入力の行ラベルは `gridLabelClass`。共通 `labelClass` には混ぜない）
- [x] 全ページの再分割はしない。大会作成と編集のルートは仕様どおり分ける
- [x] 375px で試合入力とルールを踏む（ユーザー確認。LAN スマホ含む）
- [x] [ui-spec.md](ui-spec.md) の部品一覧が実ファイルと食い違う点を直す
- [x] [status.md](status.md) を更新

### 4-3 Auth 接続 + Playwright 煙

旧「4-0」。テスト専用画面は作らない。

- [x] 未ログインはログインへ。メール `signInWithPassword`。Google / LINE の呼び出しは [tech-stack.md の認証](tech-stack.md#認証)
- [x] `/auth/callback`。cookie セッション（`@supabase/ssr`）
- [x] `/communities` を実セッション / 実 RLS の SELECT に繋ぐ（上部が自分、下部が所属麻雀グループ）
- [x] トップとログインに使っていた mock を削除（または未接続画面だけ残す）
- [x] Playwright 煙: ログインできる、自分の麻雀グループが見える。権限行列は踏まない
- [x] CI に e2e job（ローカルスタックが要る）。`web` / `db` とは分ける
- [x] [status.md](status.md) を更新

### 4-4 麻雀グループ CRUD + 招待

- [x] 作成（`create_community`）、一覧・詳細の SELECT、編集、招待コード（既定 7 日）、参加（`join_community`）、離脱（`leave_community`）
- [x] 除名・最後の 1 人の文面（ui-spec の基本フロー外）
- [x] プロフィール編集と退会（`withdraw_account` + Auth Admin）
- [x] その画面の空状態・エラー・バリデーション
- [x] 使わなくなった mock を削除
- [x] [status.md](status.md) を更新

### 4-5 ルール設定

- [x] 麻雀グループの既定と大会ルールの CRUD。使用中は修正不可（新規登録へ）
- [x] 大会へのコピー選択。三麻 / 四麻の項目切り替え
- [x] その画面の空状態・エラー・バリデーション
- [x] 使わなくなった mock を削除
- [x] [status.md](status.md) を更新

### 4-6 大会 CRUD

- [x] 作成・編集・詳細・削除。参加者 / ゲスト / ルールのカード
- [x] ゲスト同名の警告。ルール 0 件の大会は試合追加を無効化
- [x] その画面の空状態・エラー・バリデーション
- [x] 使わなくなった mock を削除
- [x] [status.md](status.md) を更新

### 4-7 試合 CRUD

計算は再実装しない。4-1 の純関数に入力を渡して保存する。

- [x] 作成・編集・詳細・削除。入力のたびに再計算
- [x] 点数合計の警告（保存は止めない。保存時に確認ダイアログ）
- [x] 1 試合の結果件数が `player_count`、三麻で `north` を使わない（test-cases.md が Phase 4 に送ったアプリ制約）
- [x] その画面の空状態・エラー・バリデーション
- [x] 使わなくなった mock を削除
- [x] 必要なら試合入力の Playwright 煙を足す
- [x] [status.md](status.md) を更新

### 4-8 大会サマリー

- [x] 総合順位（最終 pt の都度集計）。ポイント補正画面の保存・読取
- [x] 対象は 1 試合以上出場。同位は 1, 2, 2, 4（4-1 の関数）
- [x] その画面の空状態・エラー・バリデーション
- [x] 使わなくなった mock を削除
- [x] [status.md](status.md) を更新

### 4-9 仕上げ

接続時に入れたものの残りだけ。新しい機能は足さない。

- [x] 横断のローディング、未入力エラーの穴
- [x] 確認ダイアログのフォーカストラップ・背景スクロール固定（ui-spec）
- [x] mock が残っていれば削除
- [x] [status.md](status.md) を Phase 4 完了・次は Phase 5 に更新（ユーザーレビュー後）

### e2e 強化

観点は通常画面を一度表示する、各アプリ表に 1 行入る成功経路を通す。権限行列は踏まない。

- [x] ケースの正は [e2e-cases.md](e2e-cases.md)
- [x] Playwright をケース ID と 1 対 1 に差し替える
- [x] global-setup の既定ルール seed を外す（画面経路が隠れないようにする）
- [x] 有効な `type="button"` に `onClick` が無いものを lint で落とす

## Phase 5: デプロイ

**目的**: 本番 URL でログインから対局記録できること。コンテナ化しない。

**完了条件**: 公開 GitHub に `main` がある。Vercel の既定 URL でアプリが動く。Supabase Cloud に schema / RLS / Auth（メール確認 + Google + LINE）がある。ユーザーが本番を動かして OK。

進め方: GitHub → Supabase Cloud → Vercel（Redirect URL は Vercel URL が分かってから）。確認ケースの文書は作らない。

---

### キックオフ仕分け（2026-08-19）

出典は [4-0 の引き渡し](#phase-5-に送るもの) / [development.md](development.md) / [tech-stack.md](tech-stack.md)。アカウント・方式は本セッションで確定。

#### 決まっていること（再確認しない）

| 項目 | 内容 |
|------|------|
| ホスティング | Vercel。本番はコンテナ化しない。Docker はローカル専用 |
| 本番 DB / Auth | Supabase Cloud。独自 REST は作らない |
| GitHub | 個人 `rabut001`。公開。名前 `our-mahjong-history` |
| アカウント | GitHub / Vercel / Supabase Cloud はログイン済み |
| ログイン | メール + Google + LINE。クライアントは既存 |
| メール確認 | 本番はあり（Supabase 既定メール。自前 SMTP なし）。ローカルは確認なしのまま |
| URL | Vercel 既定（`*.vercel.app`）。独自ドメインなし |
| 確認 | ユーザーが本番を適当に動かして OK なら完了。ケース一覧は作らない |
| 画面 | 新規機能は足さない。確認メール後の文言は既存（「確認メールを送信しました。」） |

#### Phase 5 でやること

| # | 項目 | セッション |
|---|------|------------|
| A | 範囲・順番・Dashboard と CLI の分担 | 5-0（本節） |
| B | 公開リポジトリ作成、`main` を push、Actions | 5-1 |
| C | Supabase プロジェクト、migration、メール確認、Google / LINE | 5-2 |
| D | Vercel（`web/`）、環境変数、Redirect URL | 5-3 |
| E | 本番を動かして OK | 5-4（ユーザー） |

順番の依存: Vercel は GitHub と Supabase のキーが要る。Site URL / `/auth/callback` は Vercel URL が分かってから足す。OAuth のコールバックは Supabase 側（`https://<project-ref>.supabase.co/auth/v1/callback`）なので 5-2 で足せる。

#### 触らない（Phase 6 / MVP 外）

- 独自ドメイン、自前 SMTP、本番のコンテナ化
- Preview デプロイ用の別 Supabase、本番 Playwright
- 写真、統計、PC 最適化、公開ルーム
- ローカルの `enable_confirmations`（false のまま）
- シークレットをリポジトリやチャットに置くこと

#### 誰が何をするか

シークレット（service role、OAuth の client secret）はチャットに貼らない。Dashboard に直接入れる。

| 作業 | 担当 |
|------|------|
| リポジトリ作成・`git push` | エージェント（Dev Container の `gh` 2.97.0。push には `workflow` スコープが要る） |
| Actions の結果 | GitHub の UI で確認 |
| Supabase プロジェクト作成 | ユーザー（Dashboard。リージョンは Northeast Asia (Tokyo)。名前は `our-mahjong-history`） |
| `supabase link` / `db push` | エージェント（ログインまたは access token） |
| メール確認 ON、Google / LINE の有効化 | ユーザー（Dashboard。手順は 5-2） |
| 既存 Google / LINE クライアントに callback を足す | ユーザー |
| Vercel プロジェクト | ユーザー（GitHub 連携。Root Directory は `web`。名前は `our-mahjong-history`） |
| Vercel の環境変数 | ユーザー（Production のみ。値は Dashboard からコピー） |
| Site URL / Redirect URLs | ユーザー（5-3。Vercel URL が分かってから） |
| 本番を動かす | ユーザー |

---

### 5-0 キックオフ

- [x] 公開 GitHub、Google + LINE、メール確認あり、Vercel 既定 URL、確認はユーザー判断、を固定
- [x] セッション分割（5-0〜5-4）
- [x] 本ファイルに Phase 5 タスクを記載
- [x] [development.md](development.md) / [tech-stack.md](tech-stack.md) を更新
- [x] [status.md](status.md) を Phase 5 着手・次は 5-1 に更新

### 5-1 GitHub

- [x] 公開リポジトリ `rabut001/our-mahjong-history` を作成
- [x] `main` を push（`git` の設定は変えない）
- [x] Actions（`db` / `web` / `e2e`）が緑
- [x] [status.md](status.md) / [tech-stack.md](tech-stack.md) を更新

### 5-2 Supabase Cloud

プロジェクトはユーザーが Dashboard で作る。クレデンシャルはチャットに貼らない。

- [x] プロジェクト作成（Tokyo、`our-mahjong-history`、ref `hmkyrdkqqjmomggekxbj`）
- [x] `supabase link` と migration 適用（`db push`。schema / RLS / functions / auth の 4 本）
- [x] メール確認を ON（既定メール）
- [x] Google（標準）と LINE（Custom OAuth2 / Manual、`custom:line`。エンドポイントは [tech-stack.md](tech-stack.md#認証)）
- [x] 既存クライアントのリダイレクトに `https://hmkyrdkqqjmomggekxbj.supabase.co/auth/v1/callback`
- [x] [status.md](status.md) を更新

Site URL とアプリの `/auth/callback` は 5-3。

### 5-3 Vercel

- [x] GitHub から Import。Root Directory は `web`。Framework Preset は Next.js。Output Directory は既定（`public` にしない）
- [x] 環境変数は Production のみ（`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`）。Preview には入れない（公開リポジトリのため）
- [x] デプロイが通ること（https://our-mahjong-history.vercel.app ）
- [x] Supabase の Site URL を `https://our-mahjong-history.vercel.app` にする。Redirect URLs に `https://our-mahjong-history.vercel.app/auth/callback` を足す
- [x] [status.md](status.md) / [tech-stack.md](tech-stack.md) を更新

OAuth シークレットは Vercel に置かない（Supabase Dashboard）。

### 5-4 本番確認

ケース一覧は作らない。新しい機能も足さない。

- [x] ユーザーが本番 URL を動かして OK
- [x] [status.md](status.md) を Phase 5 完了・次は Phase 6 に更新（ユーザー確認後）

---

Phase 5 まで完了。以降の修正は [changes/](changes/)。本ファイルには追記しない。

