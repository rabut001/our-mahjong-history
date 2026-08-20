# 001 タスク

進捗の正は [status.md](../../status.md)。作業の正は本ファイル。画面の正はキックオフ後に [ui-spec.md](../../ui-spec.md) を更新する。

`loginAsE2eUser`（`web/e2e/helpers.ts`）が全画面 E2E の入口。ログイン UI を先に変えて helper を後回しにすると **e2e job が全部落ちる**。仕様 → ログイン＋helper → 作成 → 再設定、の順。

CLI / ローカル Auth でできる範囲は [auth-tests.md](auth-tests.md)。`supabase test db` に 001 用の新規 SQL は足さない。A-* は CI に載せない。

## キックオフ

- [x] ルートは `/login` と `/signup` のまま（タブにしない）
- [x] パスワード再設定を範囲に入れる（自前 SMTP は不要）
- [x] 確認用モックを `/mock` に置く
- [x] モックを見て項目・文言・遷移を固定
- [x] セッション分割を本ファイルに書く
- [x] [README.md](README.md) の完了条件を更新（本セッション）
- [x] [status.md](../../status.md) を次セッションへ更新

## 1 仕様を正へ

実装より前。モックの見た目を [ui-spec.md](../../ui-spec.md) / [e2e-cases.md](../../e2e-cases.md) / [tech-stack.md](../../tech-stack.md) に移す。コードは触らない。

- [x] 認証の画面仕様（ログイン 1 画面、作成の 2 ビュー、再設定 3 画面）
- [x] 画面一覧と遷移図（`/forgot-password` / `/forgot-password/sent` / `/reset-password`）
- [x] E-01 / E-02 / E-03 を 1 画面前提に直す。ラベルは「メールアドレス」
- [x] 新画面の表示ケースを足す（送信や変更の完了は断言しない）
- [x] recovery の戻り先（`/auth/callback?next=/reset-password`）を tech-stack に書く

## 2 ログイン

- [x] `LoginForm` をモックどおり（メール＋パスワード、枠線のログイン、または、緑の Google / LINE）
- [x] `loginAsE2eUser` と E-01 / E-03 を新しいラベル・1 画面に合わせる
- [x] `signInWithEmailAction` は今の引数のまま（email+password 同時。UI だけが 2 ステップだった）
- [x] Playwright の `e2e` job が緑

## 3 アカウント作成

- [x] `SignupForm` をモックどおり（初画面 OAuth。「メールアドレスで登録」の先に確認欄）
- [x] 確認欄の不一致はクライアントで止める。`signUp` に `passwordConfirm` は送らない
- [x] E-02: 「メールアドレスで登録」を押してから表示名・メール・パスワードが見える。「登録する」は押さない
- [x] `handle_new_user` / 表示名の渡し方は変えない

## 4 パスワード再設定

- [x] 公開パスに `/forgot-password` / `/forgot-password/sent` / `/reset-password` を足す
- [x] `resetPasswordForEmail`（戻り先は既存の `/auth/callback?next=/reset-password`）
- [x] callback 成功時に `next` へ。recovery をホームへ落とさない
- [x] 再設定中のセッションで `/login` に戻ると、現行どおりホームへ飛ばされる。戻る／完了前の導線を決めて実装する（signOut してからログインへ、など）
- [x] `updateUser({ password })` の画面。E2E は画面表示のみ
- [x] [auth-tests.md](auth-tests.md) の A-10〜13 を手元で通す（CI に入れない）
- [ ] 本番 Dashboard の Redirect URLs は既存 callback で足りるかユーザー確認（パス追加が要るときだけ足す）

## 5 モック削除

- [x] `/mock` を削除。`isPublicPath` から外す
- [x] [status.md](../../status.md) を 001 完了へ
- [x] LAN 公開が残っていれば unexpose（hostname はコミットしない）
