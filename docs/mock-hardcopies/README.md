# モック画面のハードコピー（2026-08-18）

Phase 4 実装前の、現行モックの見た目記録。正は [ui-spec.md](../ui-spec.md) と `web/` のモック。本フォルダはスナップショットであり、以後の画面変更はここへ追記しない。

- 幅: 375px（高さ 812px 相当。長い画面はフルページ）
- 倍率: 2x
- フォント: Noto Sans JP（`next/font`。400 / 500）
- データ: `web/src/mock/data.ts` のダミー（金曜麻雀 / 第12回金曜麻雀 など）
- Next.js の開発バッジは非表示

## 画面一覧

| ファイル | 画面 | ルート |
|----------|------|--------|
| [01-login.png](01-login.png) | ログイン | `/login` |
| [01b-login-password.png](01b-login-password.png) | ログイン（パスワード） | `/login` の次画面 |
| [02-signup.png](02-signup.png) | アカウント作成 | `/signup` |
| [02b-signup-password.png](02b-signup-password.png) | アカウント作成（表示名・パスワード） | `/signup` の次画面 |
| [03-communities.png](03-communities.png) | トップ | `/communities` |
| [04-profile.png](04-profile.png) | プロフィール編集 | `/profile` |
| [04b-profile-withdraw-dialog.png](04b-profile-withdraw-dialog.png) | アプリ退会の確認 | `/profile` |
| [05-user-detail.png](05-user-detail.png) | ユーザ詳細 | `/profiles/suzuki` |
| [06-community-new.png](06-community-new.png) | 麻雀グループ作成 | `/communities/new` |
| [07-join.png](07-join.png) | 招待コードで参加 | `/join` |
| [08-help-community.png](08-help-community.png) | 麻雀グループとは | `/help/community` |
| [09-community-detail.png](09-community-detail.png) | 麻雀グループ詳細 | `/communities/friday` |
| [10-community-edit.png](10-community-edit.png) | 麻雀グループ編集 | `/communities/friday/edit` |
| [10b-community-leave-dialog.png](10b-community-leave-dialog.png) | 麻雀グループを抜ける確認 | `/communities/friday/edit` |
| [11-invite.png](11-invite.png) | 招待 | `/communities/friday/invite` |
| [12-community-rule-new.png](12-community-rule-new.png) | 既定ルール追加 | `/communities/friday/rules/new` |
| [13-community-rule-edit.png](13-community-rule-edit.png) | 既定ルール編集 | `/communities/friday/rules/friday-yonma` |
| [13b-community-rule-delete-dialog.png](13b-community-rule-delete-dialog.png) | 既定ルール削除の確認 | 同上 |
| [14-tournament-new.png](14-tournament-new.png) | 大会作成 | `/communities/friday/tournaments/new` |
| [15-tournament-new-participants.png](15-tournament-new-participants.png) | 大会作成・参加者を追加 | `.../tournaments/new/participants` |
| [16-tournament-new-guests.png](16-tournament-new-guests.png) | 大会作成・ゲスト参加者を追加 | `.../tournaments/new/guests` |
| [17-tournament-new-rules.png](17-tournament-new-rules.png) | 大会作成・ルール追加（選択） | `.../tournaments/new/rules` |
| [18-tournament-new-rules-form.png](18-tournament-new-rules-form.png) | 大会作成・ルール追加（フォーム） | `.../tournaments/new/rules/form` |
| [19-tournament-new-rule-from-template.png](19-tournament-new-rule-from-template.png) | 大会作成・既定ルールから編集 | `.../tournaments/new/rules/friday-yonma` |
| [20-tournament-detail.png](20-tournament-detail.png) | 大会詳細 | `/tournaments/t-20260808` |
| [21-tournament-edit.png](21-tournament-edit.png) | 大会編集 | `/tournaments/t-20260808/edit` |
| [21b-tournament-delete-dialog.png](21b-tournament-delete-dialog.png) | 大会削除の確認 | 同上 |
| [22-adjustments.png](22-adjustments.png) | ポイントの補正 | `/tournaments/t-20260808/adjustments` |
| [23-participants-new-all-joined.png](23-participants-new-all-joined.png) | 参加者を追加（全員参加済み） | `/tournaments/t-20260808/participants/new` |
| [24-participants-new-can-add.png](24-participants-new-can-add.png) | 参加者を追加（未参加あり） | `/tournaments/t-20260801/participants/new` |
| [25-guests-new.png](25-guests-new.png) | ゲスト参加者を追加 | `/tournaments/t-20260808/guests/new` |
| [26-tournament-rule-pick.png](26-tournament-rule-pick.png) | 大会ルール追加（選択） | `/tournaments/t-20260808/rules/new` |
| [27-tournament-rule-form.png](27-tournament-rule-form.png) | 大会ルール追加（フォーム） | `/tournaments/t-20260808/rules/new/form` |
| [28-tournament-rule-in-use.png](28-tournament-rule-in-use.png) | 大会ルール詳細（使用中・閲覧） | `/tournaments/t-20260808/rules/tr-20260808-yonma` |
| [29-tournament-rule-edit.png](29-tournament-rule-edit.png) | 大会ルール編集（未使用） | `/tournaments/t-20260808/rules/tr-20260808-no-tobi` |
| [29b-tournament-rule-delete-dialog.png](29b-tournament-rule-delete-dialog.png) | 大会ルール削除の確認 | 同上 |
| [30-match-new.png](30-match-new.png) | 試合作成 | `/tournaments/t-20260808/matches/new` |
| [31-match-detail.png](31-match-detail.png) | 試合詳細 | `/matches/m-0808-3` |
| [32-match-edit.png](32-match-edit.png) | 試合編集 | `/matches/m-0808-3/edit` |
| [32b-match-delete-dialog.png](32b-match-delete-dialog.png) | 試合削除の確認 | 同上 |
| [33-not-found.png](33-not-found.png) | 見つかりません | `not-found` |
