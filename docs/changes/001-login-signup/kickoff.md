# 001 キックオフ

出典は [ui-spec.md の認証](../../ui-spec.md#認証) / [tech-stack.md の認証](../../tech-stack.md#認証) / [e2e-cases.md](../../e2e-cases.md)。見た目の正は確認済みモック（`/mock`）。実装前に正へ移す。

## 決まっていること（再確認しない）

| 項目 | 内容 |
|------|------|
| ルート | `/login` と `/signup` は分ける。同一ページのタブにはしない |
| ログイン | メールが上（枠線の「ログイン」）。または。緑の Google / LINE。下部「アカウントを持っていない方は アカウントを作成」（`text-base`） |
| アカウント作成 | 初画面は緑の Google / LINE のみ。「メールアドレスで登録」（`text-base`）の先に表示名・メール・パスワード・パスワード（確認） |
| パスワード再設定 | `/forgot-password` → `/forgot-password/sent` → メールのリンク → `/reset-password`。Supabase Auth の recovery。自前 SMTP は不要 |
| メール確認 | 本番あり（Supabase 既定メール）。ローカルはなし |
| OAuth | 既存の `startOAuthRedirect`。新しいプロバイダは足さない |
| E2E | OAuth は押さない。メール送信の完了は CI でやらない。新画面は表示だけ |

## この変更で決めたこと

| # | 項目 | 結論 |
|---|------|------|
| A | ログインと作成の骨格 | 上表。モック確認済み |
| B | パスワード再設定の画面 | 3 画面（入力 / 送信済み / 新しいパスワード） |
| C | セッション分割 | [tasks.md](tasks.md) |

## 触らない

- Phase 6（写真、統計、PC 最適化）
- 新しい認証プロバイダ
- 本番 Playwright、Preview 用の別 Supabase
- 自前 SMTP
- DB / RLS / `handle_new_user` の意味
- シークレットをリポジトリやチャットに置くこと
- LAN 公開用の `hostname` / `allowedDevOrigins`（コミットしない）
