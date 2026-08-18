# DB / RLS テストケース

Phase 3-3。**断言するケースの正**。pgTAP（3-4〜3-6）は本ファイルの ID と 1 対 1 で実装する。不足があれば SQL を足す前に本ファイル（必要なら [er.md](er.md)）を直す。

SQL・policy・関数本体は書かない。属性・FK・判定経路の正は [er.md](er.md)。誰が何をできるかの正は [overview.md](overview.md#権限モデルphase-1-5)。

---

## この文書の読み方

| 列 | 意味 |
|----|------|
| ID | pgTAP が実行するキー。実装で変えない |
| 対象 | テーブルまたは関数 |
| 操作 | SELECT / INSERT / UPDATE / DELETE / RPC / 制約 |
| アクター | 下のフィクスチャ |
| 期待 | 成功・0 件・失敗（制約違反 / RLS で 0 件またはエラー） |
| 根拠 | [er.md](er.md) の節 |

成功判定は **authenticated 相当**（JWT の `auth.uid()` がアクター）で行う。スーパーユーザー（`postgres` / service role）で通ったことだけを成功と数えない。service role は seed と `activity_logs` の確認だけに使う。

---

## フィクスチャ（pgTAP 内。本番 seed と混ぜない）

| アクター | 内容 |
|----------|------|
| **A** | 麻雀グループ 1 のメンバー。利用中プロフィール |
| **C** | 麻雀グループ 1 の別メンバー。利用中。除名の対象・プロフィール共有の相手 |
| **B** | 麻雀グループ 2 のみ。グループ 1 は見えない |
| **未ログイン** | セッションなし。すべて不可 |
| **L** | グループ 1 を離脱済み。プロフィールは利用中。グループ 1 の大会参加者としては残っている |
| **T** | 墓石。ログインできない。グループ 1 の大会参加者としては残っている。表示名は「退会済みユーザ」 |

グループ 1 には大会・既定ルール・招待コード・試合がある（空削除や使用中ルールのケース用）。グループ 2 は B だけが所属。

---

## 決めた識別子（3-3）

### RPC（`authenticated` が呼ぶ SECURITY DEFINER）

| 関数 | 引数 | 戻り | 内容 |
|------|------|------|------|
| `create_community` | `name text`, `comment text` 省略可 | 麻雀グループの `id`（uuid） | `communities` INSERT + 自分の `community_memberships` INSERT |
| `join_community` | `code text` | 麻雀グループの `id` | 招待コードを検証し、自分のメンバーシップを INSERT。既所属なら何もしない |
| `leave_community` | `community_id uuid` | なし | 自分のメンバーシップを DELETE。最後の 1 人なら麻雀グループごと削除 |
| `withdraw_account` | なし | なし | 墓石（匿名化、`auth_user_id` NULL、`withdrawn_at`）。全グループから離脱（最後の 1 人ならグループ削除）。`auth.users` 削除は関数の外（Server Action + Auth Admin） |

呼び出し人のユーザー ID は引数に取らない。関数内の `auth.uid()` から利用中プロフィールを決める。

### 所属判定（policy 用。RPC に出さない）

| 関数 | 引数 | 戻り | 内容 |
|------|------|------|------|
| `private.is_community_member` | `community_id uuid` | boolean | 呼び出し人の **利用中** プロフィールが、その麻雀グループの `community_memberships` にあるか。本体で `auth.uid()` を使う。RLS policy から呼ぶため `authenticated` に EXECUTE を出す。`anon` には出さない。`private` は API に出さないので PostgREST の RPC にはならない |

各表の policy はこのヘルパーに寄せる。表ごとの「B が 0 件」は policy 付け忘れ用に残す。

### 操作ログ（trigger。RPC に出さない）

| 関数 | 内容 |
|------|------|
| `private.trg_append_activity_log` | 対象表の AFTER INSERT / UPDATE / DELETE。親キーへ寄せて `activity_logs` に 1 行。操作者は `auth.uid()`。取れないときは足さない。`pg_trigger_depth() > 1` では足さない |

対象表: `communities`, `community_memberships`, `community_rules`, `community_invite_codes`, `tournaments`, `tournament_rules`, `tournament_participants`, `tournament_point_adjustments`, `matches`, `match_results`。`profiles` と `activity_logs` には付けない。

アプリロールは `activity_logs` を SELECT / INSERT / UPDATE / DELETE できない。GRANT も出さない。

### 離脱と除名

| 操作 | 入口 |
|------|------|
| 離脱（自分） | `leave_community` |
| 除名（他人） | `community_memberships` の直接 DELETE |
| アプリ退会 | `withdraw_account` |

RLS 上、所属メンバーは自分のメンバーシップも直接 DELETE できる（er.md）。最後の 1 行が消えたら trigger で麻雀グループごと消す（`leave_community` / 直接 DELETE / `withdraw_account` のどれでも孤児を残さない）。

除名は自分以外。グループに自分しかいないときは除名対象がいない。

### 招待コード

| 項目 | 値 |
|------|-----|
| 長さ | 10 |
| 字母 | Crockford Base32（`0123456789ABCDEFGHJKMNPQRSTVWXYZ`。**I / L / O / U を含まない**） |
| 保存形 | 大文字ちょうど 10 文字。CHECK `^[0-9A-HJKMNP-TV-Z]{10}$` |
| 発行 | 所属メンバーの直接 INSERT。保存前に大文字化してよい。I / L / O / U は発行時に受け付けない |
| 参加 | `join_community` が大小を無視し、Crockford の別名（`I`/`L` → `1`、`O` → `0`）を正規化してから照合する |
| 一意 | 麻雀グループ横断で `code` UNIQUE。麻雀グループあたり最大 1 行（`community_id` UNIQUE） |
| 期限 | 期限当日まで使える（`expires_at` ちょうどを含む）。その日を過ぎたら不可。判定は `Asia/Tokyo` の日付 |

### Auth 登録（3-7 で実装。ケースはここに置く）

| 関数 | 内容 |
|------|------|
| `private.handle_new_user`（`auth.users` INSERT の trigger） | 利用中の `profiles` を 1 行付ける。`auth_user_id` は Auth の ID。`profiles.id` は新規 UUID。表示名は `user_metadata.display_name` → `full_name` / `name` → メールの `@` より前（どれも無ければ失敗）。`avatar_url` は provider が `email` 以外のとき `avatar_url` / `picture`。直接の `profiles` INSERT は認証ロールでは不可 |

---

## メタテスト

| ID | 対象 | 操作 | アクター | 期待 | 根拠 |
|----|------|------|----------|------|------|
| M-01 | `public` の業務テーブルすべて | 定義 | — | `ENABLE ROW LEVEL SECURITY` | [er.md RLS](er.md#rls-方針) |
| M-02 | 業務テーブル（`activity_logs` 以外） | 定義 | — | 各表に policy が 1 本以上 | 同上 |
| M-02b | `activity_logs` | 定義 | — | RLS 有効。アプリ向け policy は 0 本（デフォルト拒否） | trigger のみが書く |
| M-03 | `activity_logs` | GRANT | `anon` / `authenticated` | SELECT / INSERT / UPDATE / DELETE がない | アプリロールはすべて不可 |
| M-04 | `private.trg_append_activity_log` | GRANT EXECUTE | `anon` / `authenticated` | 不可 | trigger は API に出さない |
| M-05 | 業務テーブル | GRANT | `anon` | 実効的にすべて不可（GRANT を出しても RLS で 0 件・失敗。RPC は M-07） | 未ログインはすべて不可 |
| M-06 | `private.is_community_member`、RPC 4 本、`private.trg_append_activity_log` | 定義 | — | SECURITY DEFINER の `search_path` が固定 | 3-0 / 3-2 |
| M-07 | RPC 4 本 | GRANT EXECUTE | `anon` | 不可 | Advisor 0028。未ログインは参加できない |
| M-08 | RPC 4 本 | GRANT EXECUTE | `authenticated` | 可 | allowlist 0029 |
| M-09 | `private.is_community_member` | GRANT EXECUTE | `anon` | 不可 | 未ログインは所属判定を呼べない |
| M-09b | `private.is_community_member` | GRANT EXECUTE | `authenticated` | 可（policy のため）。PostgREST の `schemas` に `private` は出ない | allowlist 0029。API の RPC には出さない |
| M-10 | RPC 4 本と `private.is_community_member` | 定義 | — | 引数名に `user_id` / `auth_user_id` / `uid` および `p_` 付きを使わない。本体に `auth.uid()` がある | 3-2 |
| M-11 | 業務テーブル | 定義 | — | `community_id` を持たないのは `profiles` / `activity_logs` / `match_results` 等、er.md のとおり。`activity_logs` に `community_id` が無い | [操作ログ](er.md#操作ログ-activity_logs) |

業務テーブル: `profiles`, `communities`, `community_memberships`, `community_rules`, `community_invite_codes`, `tournaments`, `tournament_rules`, `tournament_participants`, `tournament_point_adjustments`, `matches`, `match_results`, `activity_logs`。

---

## 制約

Phase 3 の DB（CHECK / UNIQUE / FK / trigger）で落とすもの。アプリ制約のうち **結果件数 = `player_count`、三麻で `north`、メンバーのゲスト二重登録** は Phase 4（本節に ID を付けない）。点数合計 = 持ち点 × 人数は DB 制約にしない（C-match_results-06）。

### プロフィール `profiles`

| ID | 操作 | アクター | 期待 | 根拠 |
|----|------|----------|------|------|
| C-profiles-01 | INSERT 2 行で同じ非 NULL `auth_user_id` | seed | UNIQUE 違反 | Auth は UNIQUE |
| C-profiles-02 | 利用中なのに `auth_user_id` NULL、または `withdrawn_at` あり | seed | CHECK 違反 | 利用中: Auth ありかつ退会日時空 |
| C-profiles-03 | 墓石なのに `auth_user_id` あり、または `withdrawn_at` 空、または表示名が「退会済みユーザ」以外 | seed | CHECK 違反 | 墓石の形 |
| C-profiles-04 | 利用中の表示名を「退会済みユーザ」にする | seed | CHECK 違反 | 墓石専用の表示名 |
| C-profiles-05 | 墓石を 2 行（どちらも `auth_user_id` NULL） | seed | UNIQUE は通る | NULL は複数可 |

### 麻雀グループ `communities`

| ID | 操作 | アクター | 期待 | 根拠 |
|----|------|----------|------|------|
| C-communities-01 | 大会または既定ルールが残っている `communities` を DELETE | A または super | FK RESTRICT で失敗 | 明示削除は空のときだけ |
| C-communities-02 | 空（大会 0・既定ルール 0）の `communities` を DELETE | A | 成功。メンバーシップと招待コードは CASCADE | 同上 |
| C-communities-03 | 麻雀グループを消したあと | super | そのグループ ID を指す `activity_logs` は残る | ログは CASCADE しない |

### メンバーシップ `community_memberships`

| ID | 操作 | アクター | 期待 | 根拠 |
|----|------|----------|------|------|
| C-memberships-01 | 同じ `(community_id, user_id)` を 2 行 | seed | UNIQUE 違反 | UNIQUE (community_id, user_id) |
| C-memberships-02 | 最後の 1 行を DELETE（グループ 1 に大会・ルールあり） | A（直接または `leave_community`） | 麻雀グループごと消える（試合・参加者も含む）。孤児なし | 最後の 1 人はグループごと消す |
| C-memberships-03 | メンバーが 2 人以上のとき 1 行 DELETE | A が C を除名 | グループは残る。大会参加者の `user_id` は残る | 離脱・除名でメンバーシップだけ消す |

### ルール共通（`community_rules` / `tournament_rules`）

両表に同じ CHECK / UNIQUE を付ける。ID は表名を含む。

| ID | 操作 | 期待 | 根拠 |
|----|------|------|------|
| C-community_rules-01 / C-tournament_rules-01 | `player_count` が 3 でも 4 でもない | CHECK 違反 | 3 または 4 |
| C-community_rules-02 / C-tournament_rules-02 | 同一親で同じ `name` を 2 行 | UNIQUE 違反 | UNIQUE (親, name) |
| C-community_rules-03 / C-tournament_rules-03 | `uma_enabled = false` なのにウマ列のどれかが非 NULL | CHECK 違反 | ウマなしのときウマ列は NULL |
| C-community_rules-04 / C-tournament_rules-04 | `uma_enabled = true` なのに `uma_tie_handling` または `uma_points_1` が NULL | CHECK 違反 | ウマありのとき必須 |
| C-community_rules-05 / C-tournament_rules-05 | ウマあり四麻なのに `uma_points_2` が NULL | CHECK 違反 | 四麻の 2位⇔3位 |
| C-community_rules-06 / C-tournament_rules-06 | ウマあり三麻なのに `uma_points_2` が非 NULL | CHECK 違反 | 三麻は NULL |
| C-community_rules-07 / C-tournament_rules-07 | `rate < 0` | CHECK 違反 | レートは 0 以上 |
| C-community_rules-08 / C-tournament_rules-08 | `oka_tie_handling` が `kamicha` / `split` / `manual` 以外 | CHECK 違反 | 列挙 |
| C-community_rules-09 / C-tournament_rules-09 | ウマありで `uma_tie_handling` が列挙外 | CHECK 違反 | 列挙 |

`tournament_rules` のみ:

| ID | 操作 | アクター | 期待 | 根拠 |
|----|------|----------|------|------|
| C-tournament_rules-10 | 試合が 1 件でも紐づいた行を UPDATE | A | 失敗（trigger） | 使用中は修正不可 |
| C-tournament_rules-11 | 試合が紐づいた行を DELETE | A | FK RESTRICT | 使用中は削除不可 |
| C-tournament_rules-12 | 試合 0 件の行を UPDATE / DELETE | A | 成功 | 未使用は修正・削除可 |

`community_rules` はテンプレートなので、既存大会があっても UPDATE / DELETE 可（FK はコミュニティ削除時 RESTRICT）。

### 大会 `tournaments`

| ID | 操作 | 期待 | 根拠 |
|----|------|------|------|
| C-tournaments-01 | 同一 `community_id` で同じ `name` を 2 行 | 成功 | 大会名の重複は許す |
| C-tournaments-02 | 試合または参加者が残っている大会を DELETE | FK RESTRICT | 試合・参加者が残っている間は削除不可 |
| C-tournaments-03 | 子を消したあと大会を DELETE | 成功 | 空なら消せる |

### 大会参加者 `tournament_participants`

| ID | 操作 | 期待 | 根拠 |
|----|------|------|------|
| C-participants-01 | `user_id` と `guest_display_name` が両方あり、または両方 NULL | CHECK 違反 | XOR |
| C-participants-02 | 同一大会で同じ `user_id` を 2 行 | UNIQUE 違反 | UNIQUE (tournament_id, user_id) |
| C-participants-03 | 同一大会で同じ `guest_display_name` を 2 行 | UNIQUE 違反 | ゲスト同名不可 |
| C-participants-04 | `guest_display_name` が空文字または空白のみ | CHECK 違反 | 空文字不可 |
| C-participants-05 | `user_id` にグループ非メンバー（B や L）を付けて INSERT / UPDATE | 失敗（trigger） | 新たに載せるときは現メンバー |
| C-participants-06 | `user_id` に墓石 T を付けて INSERT | 失敗 | 墓石不可 |
| C-participants-07 | 既存行の `user_id`（離脱した L）は残ったまま UPDATE しない | 行は残ってよい | 既存行は離脱後も user_id を残す |
| C-participants-08 | 試合結果がある参加者を DELETE | FK RESTRICT | 試合結果がある間は RESTRICT |
| C-participants-09 | 試合結果がない参加者を DELETE | 成功。修正ポイント行は CASCADE | 修正ポイントは CASCADE |

### 大会修正ポイント `tournament_point_adjustments`

| ID | 操作 | 期待 | 根拠 |
|----|------|------|------|
| C-adjustments-01 | 同一 `tournament_participant_id` を 2 行 | UNIQUE 違反 | 参加者あたり最大 1 行 |
| C-adjustments-02 | `adjustment_points_1`〜`5` のどれかが NULL | 失敗（NOT NULL） | 未使用タイトルも値は 0 |

### 試合 `matches`

| ID | 操作 | 期待 | 根拠 |
|----|------|------|------|
| C-matches-01 | 試合の `tournament_id` と、`tournament_rule_id` が指すルールの `tournament_id` が違う INSERT | 失敗（複合 FK または trigger） | 使用ルールは同じ大会のものであること |
| C-matches-02 | 試合を DELETE | 試合結果は CASCADE | 試合を消す |
| C-matches-03 | ルール 0 件の大会へ試合 INSERT | 失敗（`tournament_rule_id` 必須） | 試合は大会ルールを 1 つ必須 |

### 試合結果 `match_results`

| ID | 操作 | 期待 | 根拠 |
|----|------|------|------|
| C-match_results-01 | 同一試合で同じ `tournament_participant_id` を 2 行 | UNIQUE 違反 | UNIQUE (match_id, participant) |
| C-match_results-02 | 同一試合で同じ `seat` を 2 行 | UNIQUE 違反 | UNIQUE (match_id, seat) |
| C-match_results-03 | 試合の大会と、`tournament_participant_id` が指す参加者の大会が違う INSERT | 失敗（複合 FK または trigger） | 参加者は同じ大会のものであること |
| C-match_results-04 | `seat` が `east` / `south` / `west` / `north` 以外 | 失敗 | 列挙 |
| C-match_results-05 | `rank < 1` | CHECK 違反 | 1 以上 |
| C-match_results-06 | 点数合計が持ち点 × 人数と一致しない | **成功** | DB 制約は持たない |

### 招待コード `community_invite_codes`

| ID | 操作 | 期待 | 根拠 |
|----|------|------|------|
| C-invite-01 | 同一 `community_id` を 2 行 | UNIQUE 違反 | 麻雀グループあたり最大 1 |
| C-invite-02 | 別グループでも同じ `code` | UNIQUE 違反 | 横断 UNIQUE |
| C-invite-03 | `code` が 9 文字または 11 文字 | CHECK 違反 | ちょうど 10 |
| C-invite-04 | `code` に I / L / O / U を含む | CHECK 違反 | Crockford 字母 |
| C-invite-05 | `code` が字母外（記号など） | CHECK 違反 | 同上 |
| C-invite-06 | 小文字の正当な 10 文字を INSERT | 大文字化して保存され、成功する | 保存形は大文字 |
| C-invite-07 | `expires_at` NULL | NOT NULL 違反 | 必須 |

### 操作ログ `activity_logs`

| ID | 操作 | 期待 | 根拠 |
|----|------|------|------|
| C-logs-02 | `action` が `insert` / `update` / `delete` 以外 | 失敗 | 列挙 |
| C-logs-03 | 対象の麻雀グループ / 大会 / 試合を消す | 既存のログ行は残る。`entity_id` は当時の PK | FK を張らない。CASCADE しない |
| C-logs-04 | A が大会を INSERT | service role で見たログに `entity_type = tournament` / `action = insert` / `actor_user_id` = A / その大会 ID が 1 行 | trigger |
| C-logs-05 | A が試合結果を UPDATE | ログは `match` / `update`（試合 ID）。試合結果 ID では残さない | 子は親キーへ寄せる |
| C-logs-06 | A が試合を DELETE（結果が CASCADE） | `match` / `delete` が 1 行。結果件数ぶんのログは増えない | `pg_trigger_depth() > 1` では足さない |
| C-logs-07 | 最後の 1 人離脱でグループごと削除 | 起点のログは残る。配下の試合・参加者件数ぶんは増えない | 同上 |
| C-logs-08 | super / seed が大会を INSERT（`auth.uid()` なし） | ログを足さない | 操作者が取れないときは足さない |

### 削除方針（FK のまとめ）

| ID | 操作 | 期待 | 根拠 |
|----|------|------|------|
| C-fk-01 | 試合結果があるのに大会参加者を消す | RESTRICT | [削除方針](er.md#削除方針phase-3-の-fk-用) |
| C-fk-02 | 試合があるのに大会ルールを消す | RESTRICT | 同上 |
| C-fk-03 | 試合または参加者が残っている大会を消す | RESTRICT | 同上 |
| C-fk-04 | 空でない麻雀グループを直接 DELETE | RESTRICT | 明示削除は空のときだけ |
| C-fk-05 | 最後のメンバーシップ削除 | グループ配下を CASCADE で全部消す。ログは残す | 最後の 1 人 |

C-fk-01〜04 は上表と重複してよい（実装は 1 本の pgTAP で複数 ID を満たしてよいが、ID は欠かさない）。C-fk-05 のログ残存は C-logs-03 と同一の削除で満たしてよい。

---

## RLS

未ログインは **すべての表・すべての操作で失敗**（0 件またはエラー）。表ごとに ID を付ける（policy 付け忘れ用）。

書き込みの「失敗」は、INSERT/UPDATE/DELETE が 0 件またはエラー。SELECT の「見えない」は 0 件（エラーでもよい）。

未ログインの実装の代表は **SELECT と INSERT**（GRANT 付け忘れは INSERT で出る）。anon の UPDATE / DELETE GRANT は M-05 で見る。

### 未ログイン（全表）

| ID | テーブル | 操作 | 期待 |
|----|----------|------|------|
| R-anon-profiles | `profiles` | SELECT / INSERT | 失敗 |
| R-anon-communities | `communities` | 同上 | 失敗 |
| R-anon-memberships | `community_memberships` | 同上 | 失敗 |
| R-anon-community_rules | `community_rules` | 同上 | 失敗 |
| R-anon-invite | `community_invite_codes` | 同上 | 失敗 |
| R-anon-tournaments | `tournaments` | 同上 | 失敗 |
| R-anon-tournament_rules | `tournament_rules` | 同上 | 失敗 |
| R-anon-participants | `tournament_participants` | 同上 | 失敗 |
| R-anon-adjustments | `tournament_point_adjustments` | 同上 | 失敗 |
| R-anon-matches | `matches` | 同上 | 失敗 |
| R-anon-match_results | `match_results` | 同上 | 失敗 |
| R-anon-logs | `activity_logs` | 同上 | 失敗 |

### プロフィール `profiles`

| ID | 操作 | アクター | 期待 | 根拠 |
|----|------|----------|------|------|
| R-profiles-01 | SELECT 自分 | A | 読める | SELECT (1) |
| R-profiles-02 | SELECT 同じグループの C | A | 読める | SELECT (2) |
| R-profiles-03 | SELECT B | A | 0 件 | 所属を共有しない |
| R-profiles-04 | SELECT L | A | 読める（グループ 1 の大会参加者） | SELECT (3) |
| R-profiles-05 | SELECT T | A | 読める。表示名は「退会済みユーザ」 | SELECT (3)・墓石 |
| R-profiles-06 | SELECT A | B | 0 件 | B はグループ 1 にいない |
| R-profiles-07 | UPDATE 自分の表示名・コメント | A | 成功 | UPDATE は (1) のみ |
| R-profiles-08 | UPDATE C の表示名 | A | 失敗 | 本人だけ |
| R-profiles-09 | UPDATE 自分の `withdrawn_at` を入れる | A | 失敗 | 墓石化は退会関数 |
| R-profiles-10 | UPDATE 自分の `auth_user_id` を NULL | A | 失敗 | 同上 |
| R-profiles-11 | UPDATE 自分の表示名だけ「退会済みユーザ」 | A | 失敗 | 同上 / C-profiles-04 |
| R-profiles-12 | INSERT | A | 失敗 | trigger のみ |
| R-profiles-13 | DELETE 自分 | A | 失敗 | 行は残す |
| R-profiles-14 | SELECT / UPDATE | L | 自分のプロフィールは読める・直せる。グループ 1 の C や T は読めない（メンバーシップが無いため SELECT (2)(3) を満たさない） | 抜けた本人は配下が不可。自分のプロフィールは従来どおり |

R-profiles-14 の「C は読めない」: L はグループ 1 のメンバーシップが無い。SELECT (3) は「呼び出し人がその大会のコミュニティのメンバー」なので、L からは T や他参加者のプロフィールは読めない。A からは L が読める。

### 麻雀グループ `communities`

| ID | 操作 | アクター | 期待 | 根拠 |
|----|------|----------|------|------|
| R-communities-01 | SELECT | A | グループ 1 だけ | 所属している麻雀グループだけ |
| R-communities-02 | SELECT グループ 1 | B | 0 件 | 他グループ不可 |
| R-communities-03 | INSERT 直接 | A | 失敗 | 作成関数のみ |
| R-communities-04 | UPDATE グループ 1 の名称 | A | 成功 | 所属なら可 |
| R-communities-05 | UPDATE グループ 1 | B | 失敗 | B は書けない |
| R-communities-06 | DELETE 空のグループ 1 | A | 成功 | 空のときだけ |
| R-communities-07 | DELETE 空でないグループ 1 | A | 失敗 | 直接 DELETE は空のみ。最後の 1 人は関数 |
| R-communities-08 | SELECT / UPDATE / DELETE グループ 1 | L | 失敗 | 離脱済みは配下不可 |

### メンバーシップ `community_memberships`

| ID | 操作 | アクター | 期待 | 根拠 |
|----|------|----------|------|------|
| R-memberships-01 | SELECT | A | グループ 1 の A と C が見える。L の行は無い | 抜けた人の行は無い |
| R-memberships-02 | SELECT グループ 1 | B | 0 件 | 他グループ |
| R-memberships-03 | INSERT 直接（自分をグループ 1 へ） | B | 失敗 | 参加・作成関数のみ |
| R-memberships-04 | INSERT 直接 | A | 失敗 | 直接 INSERT 不可 |
| R-memberships-05 | UPDATE | A | 失敗 | UPDATE なし |
| R-memberships-06 | DELETE C の行（除名） | A | 成功。C のプロフィールと大会参加者は残る | 他人の除名 |
| R-memberships-07 | DELETE グループ 1 の行 | B | 失敗 | B は書けない |
| R-memberships-08 | DELETE 自分の行 | A（メンバーが C もいる） | 成功（RLS）。グループは残る | 自分の離脱も DELETE 可 |
| R-memberships-09 | SELECT / DELETE グループ 1 | L | 失敗 | 離脱済み |

### 麻雀グループ配下（所属すれば CRUD）

次の表は判定経路が「その行の麻雀グループのメンバー」。A はグループ 1 だけ読め・書ける。B はグループ 1 を読めない・書けない。L はグループ 1 不可。

対象: `community_rules`, `community_invite_codes`, `tournaments`, `tournament_rules`, `tournament_participants`, `tournament_point_adjustments`, `matches`, `match_results`。

各表・各アクターに ID を付ける。拒否側（B / L）の代表は SELECT 1 本 + 書き込み 1 本（INSERT または UPDATE）。表の操作列もこの代表に合わせる。付け忘れ防止のため表ごとに B の SELECT 0 件を必須とする。成功側（A）で INSERT / UPDATE / DELETE を併記した ID は、3 操作とも行が変わることを見る（1 本の `lives_ok` にまとめない。0 行成功を見逃す）。L の「SELECT / 書き込み」は SELECT 0 件 + INSERT 1 本（`R-invite-06` は仕様どおり SELECT のみ）。

| ID | テーブル | 操作 | アクター | 期待 |
|----|----------|------|----------|------|
| R-community_rules-01 | `community_rules` | SELECT | A | グループ 1 の既定が読める |
| R-community_rules-02 | `community_rules` | SELECT | B | グループ 1 は 0 件 |
| R-community_rules-03 | `community_rules` | INSERT / UPDATE / DELETE グループ 1 | A | 成功 |
| R-community_rules-04 | `community_rules` | INSERT グループ 1 | B | 失敗 |
| R-community_rules-05 | `community_rules` | SELECT / INSERT グループ 1 | L | 失敗 |
| R-invite-01 | `community_invite_codes` | SELECT | A | グループ 1 のコードが読める |
| R-invite-02 | `community_invite_codes` | SELECT | B | 0 件 |
| R-invite-03 | `community_invite_codes` | SELECT | 未所属の利用中（コード文字列は知っている B） | 0 件。参加は関数 | 
| R-invite-04 | `community_invite_codes` | INSERT / DELETE グループ 1（再発行の差し替え） | A | 成功 |
| R-invite-05 | `community_invite_codes` | INSERT グループ 1 | B | 失敗 |
| R-invite-06 | `community_invite_codes` | SELECT | L | 0 件 |
| R-tournaments-01 | `tournaments` | SELECT | A | グループ 1 の大会が読める |
| R-tournaments-02 | `tournaments` | SELECT | B | 0 件 |
| R-tournaments-03 | `tournaments` | INSERT / UPDATE / DELETE グループ 1 | A | 成功（DELETE は子が空のとき） |
| R-tournaments-04 | `tournaments` | INSERT グループ 1 | B | 失敗 |
| R-tournaments-05 | `tournaments` | SELECT / INSERT | L | 失敗 |
| R-tournament_rules-01 | `tournament_rules` | SELECT | A | 読める |
| R-tournament_rules-02 | `tournament_rules` | SELECT | B | 0 件 |
| R-tournament_rules-03 | `tournament_rules` | INSERT / 未使用行の UPDATE・DELETE | A | 成功 |
| R-tournament_rules-04 | `tournament_rules` | INSERT | B | 失敗 |
| R-tournament_rules-05 | `tournament_rules` | SELECT / INSERT | L | 失敗 |
| R-participants-01 | `tournament_participants` | SELECT | A | 読める（L と T の参加者行も含む） |
| R-participants-02 | `tournament_participants` | SELECT | B | 0 件 |
| R-participants-03 | `tournament_participants` | INSERT ゲスト / 現メンバー | A | 成功 |
| R-participants-04 | `tournament_participants` | INSERT | B | 失敗 |
| R-participants-05 | `tournament_participants` | SELECT / INSERT | L | 失敗 |
| R-adjustments-01 | `tournament_point_adjustments` | SELECT | A | 読める |
| R-adjustments-02 | `tournament_point_adjustments` | SELECT | B | 0 件 |
| R-adjustments-03 | `tournament_point_adjustments` | INSERT / UPDATE / DELETE | A | 成功 |
| R-adjustments-04 | `tournament_point_adjustments` | INSERT | B | 失敗 |
| R-adjustments-05 | `tournament_point_adjustments` | SELECT / INSERT | L | 失敗 |
| R-matches-01 | `matches` | SELECT | A | 読める |
| R-matches-02 | `matches` | SELECT | B | 0 件 |
| R-matches-03 | `matches` | INSERT / UPDATE / DELETE | A | 成功 |
| R-matches-04 | `matches` | INSERT | B | 失敗 |
| R-matches-05 | `matches` | SELECT / INSERT | L | 失敗 |
| R-match_results-01 | `match_results` | SELECT | A | 読める |
| R-match_results-02 | `match_results` | SELECT | B | 0 件 |
| R-match_results-03 | `match_results` | INSERT / UPDATE / DELETE | A | 成功 |
| R-match_results-04 | `match_results` | UPDATE | B | 失敗 |
| R-match_results-05 | `match_results` | SELECT / INSERT | L | 失敗 |

`tournament_participants` の INSERT で `user_id` を付ける追加条件は C-participants-05 / 06（制約）と次:

| ID | 操作 | アクター | 期待 | 根拠 |
|----|------|----------|------|------|
| R-participants-06 | INSERT で `user_id` = B | A | 失敗 | 現メンバーであること |
| R-participants-07 | 使用中大会ルールを UPDATE | A | 失敗 | C-tournament_rules-10 と同じ現象。RLS ではなく trigger |

### 操作ログ `activity_logs`

| ID | 操作 | アクター | 期待 | 根拠 |
|----|------|----------|------|------|
| R-logs-01 | SELECT | A | 失敗 | アプリロールはすべて不可 |
| R-logs-02 | SELECT | B | 失敗 | 同上 |
| R-logs-03 | INSERT（`actor_user_id` = 自分のプロフィール） | A | 失敗 | 直 INSERT しない。trigger のみ |
| R-logs-04 | INSERT（`actor_user_id` = C） | A | 失敗 | 同上 |
| R-logs-05 | UPDATE / DELETE | A | 失敗 | 改ざん防止 |
| R-logs-06 | SELECT | service role | 読める | 開発者確認 |

---

## 関数

実行ロールは authenticated。`auth.uid()` がその人の Auth ID。未ログインの RPC は失敗（M-07 と重複してよい）。

### `create_community`

| ID | 操作 | アクター | 期待 | 根拠 |
|----|------|----------|------|------|
| F-create-01 | RPC `name` 必須 | A | 麻雀グループが 1 件でき、A が唯一のメンバー。戻りがその `id` | 作成と同時に自分をメンバーに |
| F-create-02 | RPC | 未ログイン | 失敗 | ログイン済みなら誰でも |
| F-create-03 | RPC のあと直接 `communities` INSERT | A | 失敗 | R-communities-03 |
| F-create-04 | 関数内で `auth.uid()` 以外のユーザーをメンバーにしない | A | メンバーは A だけ | 呼び出し人のみ |

### `join_community`

| ID | 操作 | アクター | 期待 | 根拠 |
|----|------|----------|------|------|
| F-join-01 | 有効期限内のグループ 1 のコード | B | B がグループ 1 のメンバーになる。戻りがグループ 1 の `id` | 期限内のコード |
| F-join-02 | 同じコードをもう一度 | B | 成功。行は増えない（何もしない） | 既所属なら何もしない |
| F-join-03 | 期限当日（`expires_at` ちょうどを含む） | B | 成功 | その日までは使える |
| F-join-04 | 存在しないコード | B | 失敗 | 検証 |
| F-join-05 | CHECK を満たさない文字列 | B | 失敗 | 形式 |
| F-join-06 | 小文字・Crockford 別名（`I`/`L`/`O`）を含む入力 | B | 正規化後に一致すれば F-join-01 と同じく成功 | 参加時の正規化 |
| F-join-07 | RPC | 未ログイン | 失敗 | コードだけでは参加できない |
| F-join-08 | コードを知っていても `community_memberships` 直接 INSERT | B | 失敗 | R-memberships-03 |
| F-join-09 | 期限日の翌日以降 | B | 失敗 | その日を過ぎたら使えない |

### `leave_community`

| ID | 操作 | アクター | 期待 | 根拠 |
|----|------|----------|------|------|
| F-leave-01 | グループ 1（C も残る） | A | A のメンバーシップだけ消える。グループ・大会は残る。A は配下を読めない | 他にメンバーがいるとき |
| F-leave-02 | グループ 1 の最後の 1 人 | A（C を除名済み） | グループ 1 ごと消える（大会・ルール・試合も含む）。ログは残る | 最後の 1 人 |
| F-leave-03 | 所属していない `community_id` | B がグループ 1 | 失敗 | メンバーだけ |
| F-leave-04 | RPC | 未ログイン | 失敗 | 認証 |
| F-leave-05 | 他人のグループを引数にしても、自分の `auth.uid()` 以外を外さない | A | B のメンバーシップは消えない | 自分の離脱 |

### `withdraw_account`

| ID | 操作 | アクター | 期待 | 根拠 |
|----|------|----------|------|------|
| F-withdraw-01 | RPC | A（グループ 1 に C が残る。大会参加者でもある） | 表示名「退会済みユーザ」、コメントと `avatar_url` 空、`withdrawn_at` あり、`auth_user_id` NULL。グループ 1 のメンバーシップは無い。大会参加者の `user_id` は墓石を指す。C からそのプロフィールが読める | 墓石 + 全離脱 |
| F-withdraw-02 | 最後の 1 人のグループだけ所属 | A | そのグループごと消える | 最後の 1 人ならグループ削除 |
| F-withdraw-03 | 複数グループに所属 | A（1 と 2） | すべてのメンバーシップが消える。最後の 1 人だったグループだけ削除 | 全グループから離脱 |
| F-withdraw-04 | RPC | 未ログイン | 失敗 | 本人 |
| F-withdraw-05 | 直接 UPDATE で F-withdraw-01 と同じ列変更 | A | 失敗 | R-profiles-09〜11 |
| F-withdraw-06 | 関数のあと `auth.users` が残っていても Postgres 上は墓石 | A | プロフィールはログイン不可の形。Auth 削除は Server Action 側 | Auth は関数の外 |

### ヘルパー `private.is_community_member`

| ID | 操作 | アクター | 期待 | 根拠 |
|----|------|----------|------|------|
| F-helper-01 | グループ 1 | A | true | 利用中 + メンバーシップ |
| F-helper-02 | グループ 1 | B | false | 未所属 |
| F-helper-03 | グループ 1 | L | false | 離脱済みは利用中でも false |
| F-helper-04 | PostgREST `/rpc/is_community_member` | A | 失敗（`private` は API に出ない） | M-09b |

### Auth 登録 `handle_new_user`（3-7）

| ID | 操作 | アクター | 期待 | 根拠 |
|----|------|----------|------|------|
| F-signup-01 | `auth.users` INSERT | — | 対応する利用中 `profiles` が 1 行。`auth_user_id` がその Auth ID | 登録時に profiles が付く |
| F-signup-02 | 認証ロールで `profiles` INSERT | A | 失敗 | R-profiles-12 |

---

## PostgREST（副。3-6 で実装）

JWT + anon キー。画面テストにはしない。GRANT と RPC 公開の通し。

| ID | 操作 | アクター | 期待 |
|----|------|----------|------|
| P-01 | `POST /rpc/create_community` | A の JWT | 201/200。麻雀グループ ID が返る |
| P-02 | `POST /rpc/join_community` | B の JWT + 有効コード | 成功 |
| P-03 | `POST /rpc/leave_community` | A の JWT | 成功 |
| P-04 | `POST /rpc/withdraw_account` | （専用フィクスチャ）JWT | 成功 |
| P-05 | 上の 4 RPC | anon キーのみ | 失敗 |
| P-06 | `GET /communities` | A の JWT | グループ 1 のみ |
| P-07 | `GET /community_invite_codes` | B の JWT | グループ 1 のコードは 0 件 |
| P-08 | `GET /activity_logs` | A の JWT | 失敗（GRANT または RLS） |
| P-09 | `POST /community_memberships` | B の JWT | 失敗 |
| P-10 | `POST /activity_logs` | A の JWT | 失敗 |

---

## Phase 4 に送る（本ファイルに ID を付けない）

- 1 試合の結果件数が `player_count` と一致すること
- 三麻で `seat = north` を使わないこと
- 麻雀グループ所属者を同じ大会のゲストとして二重登録しないこと
- 点数合計が持ち点 × 人数と違うときの画面警告
- `auth.users` 削除（Server Action + Auth Admin）
- 画面 E2E

---

## pgTAP との対応

| 本ファイル | 実装セッション |
|------------|----------------|
| 制約 `C-*`、`C-fk-*`（操作ログ trigger の `C-logs-04`〜`08` を含む） | 3-4 |
| RLS `R-*`、メタ `M-01`〜`M-05` `M-11` | 3-5 |
| 関数 `F-*`、メタ `M-06`〜`M-10`（`M-09b` を含む）、PostgREST `P-*` | 3-6 |
| `F-signup-*` | 3-7（ケース追加はしない。実装のみ） |
