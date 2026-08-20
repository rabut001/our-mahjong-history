# 005 タスク

進捗の正は [status.md](../../status.md)。作業の正は本ファイル。画面の正は [ui-spec.md](../../ui-spec.md)。

ログアウトは押さない。E-10 は見出しとボタンが見えることまで。

## 1 仕様

- [x] 置き場はプロフィール編集。トップ・ヘッダーには出さない
- [x] 「保存する」の下、「アプリを退会する」の上
- [x] `muted` の文字ボタン「ログアウト」。確認ダイアログは出さない
- [x] 既存の `signOutToLoginAction` でログインへ
- [x] ui-spec / e2e-cases（E-10）を正へ

## 2 実装

- [x] `ProfileForm` にログアウト
- [x] `npm run lint` / `typecheck` / `format:check`（コンテナ内）
