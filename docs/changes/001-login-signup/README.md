# 001 ログイン・アカウント作成

状態: **完了**

## 目的

ログイン（`/login`）とアカウント作成（`/signup`）を、確認済みモックどおりにする。パスワード再設定を足す。

確認用モック（`/mock`）は実装後に削除済み。

## 対象画面

| 画面 | ルート |
|------|--------|
| ログイン | `/login` |
| アカウント作成 | `/signup` |
| パスワードを忘れた | `/forgot-password` |
| 再設定メール送信後 | `/forgot-password/sent` |
| パスワードの再設定 | `/reset-password`（メールのリンク先。callback 経由） |

関連: `/auth/callback`（OAuth と recovery の戻り先）

## 正（現行仕様）

| 種類 | ファイル |
|------|----------|
| 画面 | [ui-spec.md の認証](../../ui-spec.md#認証) |
| 認証の実装 | [tech-stack.md の認証](../../tech-stack.md#認証) |
| 画面 E2E | [e2e-cases.md](../../e2e-cases.md)（E-01〜E-06） |
| CLI / ローカル Auth | [auth-tests.md](auth-tests.md)（CI に載せない） |

## 作業文書

- [kickoff.md](kickoff.md) — 範囲の固定
- [tasks.md](tasks.md) — セッション分割
- [auth-tests.md](auth-tests.md) — CLI / ローカル Auth で断言する範囲（CI 外）

## 完了条件

- 本番の `/login` / `/signup` がモックと同じ導線
- パスワード再設定が既定メールで一通りできる
- ui-spec / e2e-cases / tech-stack がそれに合う
- CI の `e2e` が緑
- `/mock` を削除済み

## やらないこと

- Phase 6（写真・統計・PC 最適化）
- 新しい OAuth プロバイダの追加
- 自前 SMTP
- 独自 REST、金額・賭けに関する表現
