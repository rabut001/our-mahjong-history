# 001 Auth テスト（CLI / ローカルスタック）

001 のログイン・登録・再設定について、**Supabase CLI が起動するローカルスタックで断言できる範囲**。CI には載せない（載せる正は [test-cases.md](../../test-cases.md) と [e2e-cases.md](../../e2e-cases.md)）。

前提: `supabase start` 済み。Auth API は `http://127.0.0.1:54321`。メールの受け皿は [local_smtp](../../../supabase/config.toml)（Web `http://127.0.0.1:54324`）。anon キーは `supabase status`。

---

## CLI でできること / できないこと

`supabase test db` は **Postgres（pgTAP）だけ**。GoTrue（登録・ログイン・再設定メール）は実行しない。

| 対象 | CLI の役割 | 001 で新規 SQL が要るか |
|------|------------|-------------------------|
| `handle_new_user` → `profiles` | `supabase test db`（既存 F-signup-01 / 02） | **不要**。UI 変更は trigger に出ない |
| メール登録・ログイン・パスワード再設定 | `supabase start` の Auth に HTTP する | 本ファイルの A-*。pgTAP にはしない |
| 再設定メールの本文・リンク | 同上 + 54324 でメールを見る | A-recover-* |
| Google / LINE | ローカルは無効（[tech-stack.md](../../tech-stack.md#認証)） | **不可** |
| 本番の確認メール | ローカルは `enable_confirmations = false` のまま | **不可**（本番の手動） |
| 画面の文言・2 ステップ廃止・確認欄 | Next.js | **不可**（e2e-cases / 目視） |
| パスワード不一致のクライアント止め | ブラウザ | **不可** |

「CLI でテスト」＝ (1) `supabase test db` が既存どおり緑、(2) start した Auth / メール受け皿に対する A-*。

---

## 既存（pgTAP。触らない）

正は [test-cases.md](../../test-cases.md)。001 で増やさない。

| ID | 内容 |
|----|------|
| F-signup-01 | `auth.users` INSERT で利用中 `profiles` が 1 行 |
| F-signup-02 | 認証ロールの直接 `profiles` INSERT は失敗 |

確認: セッション 2 以降のあとでも `supabase test db` が緑。

---

## ローカル Auth（A-*。CI 外）

入口は GoTrue（`/auth/v1`）。Next の Server Action は通さなくてよい。画面は見ない。

ローカルは確認メールなし。`signUp` 直後にセッションが付く（本番と違う）。再設定メールは確認オフでも Inbucket に届く。

### 登録・ログイン

| ID | 操作 | 期待 |
|----|------|------|
| A-01 | メール＋パスワードで `signUp`（`user_metadata.display_name` あり） | ユーザーができる。`profiles` にその表示名 |
| A-02 | 同じメールで再度 `signUp` | 失敗（既存） |
| A-03 | パスワード 5 文字で `signUp` | 失敗（`minimum_password_length = 6`） |
| A-04 | A-01 のメール＋パスワードで `signInWithPassword` | セッションが付く |
| A-05 | 正しいメール＋違うパスワード | 失敗 |
| A-06 | 存在しないメール＋パスワード | 失敗 |

### パスワード再設定

| ID | 操作 | 期待 |
|----|------|------|
| A-10 | 登録済みメールで recover（`resetPasswordForEmail` 相当） | 54324 に再設定メールが 1 通。本文にアプリの callback（`redirectTo` どおり） |
| A-11 | 未登録メールで recover | Auth は成功扱いにしてよい（存在漏洩しない）。メールは無い or 送らない |
| A-12 | A-10 のリンクでセッションを交換し、新パスワードに `updateUser` | 成功 |
| A-13 | 新パスワードで `signInWithPassword` | 成功。旧パスワードは失敗 |
| A-14 | リンク無し（通常セッションだけ）でパスワード変更 | 001 の画面ではやらない。secure_password_change はローカル false |

`redirectTo` は実装どおり `http://127.0.0.1:3000/auth/callback?next=/reset-password`（許可リストは既存の callback）。

### やらない（A に載せない）

- OAuth の token 交換
- 本番 SMTP / 確認メール必須の signIn
- 画面の「次へ」廃止、枠線ボタン、`text-base`
- パスワード（確認）欄の不一致（クライアント）

---

## 本番だけ（手動。CLI 外）

| ID | 内容 |
|----|------|
| M-01 | メール登録 → 確認メールが届く → 確認後にログインできる |
| M-02 | パスワード再設定メールが届く → リンクが `/reset-password` に着く → 新しいパスワードでログインできる |
| M-03 | Google でログイン / 登録 |
| M-04 | LINE でログイン / 登録（iPhone 含む） |

---

## 実行の目安

| いつ | 何 |
|------|-----|
| セッション 2〜4 のあと | `supabase test db`（既存） |
| セッション 4 のあと | A-01〜06、A-10〜13（手元。スクリプト化してよいが CI に入れない） |
| 001 完了の本番確認 | M-01〜04 |
