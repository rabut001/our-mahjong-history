---
name: expose-lan
description: >-
  Exposes the Next.js dev server on port 3000 to the same Wi-Fi so a phone can
  open http://<PC-IPv4>:3000, and reverts that exposure. Takes an option:
  `expose` publishes, `unexpose` reverts. Use when the user asks for スマホ確認,
  実機確認, 同一 LAN, ローカルネット, bind 0.0.0.0, expose-lan, unexpose-lan, or
  to undo LAN preview. Source of truth is docs/development.md
  「同一 LAN のスマホから見る」.
---

# 同一 LAN のスマホ確認

WSL2 は NAT のため、`localhost:3000` だけでは同一 Wi-Fi のスマホに届かない。公開は一時的。確認が終わったら必ず戻す。

正本: `docs/development.md` の「同一 LAN のスマホから見る」。スクリプトは `.devcontainer/expose-lan.ps1` / `unexpose-lan.ps1`。

ホストで `npm` / `node` を呼ばない。開発サーバは Dev Container 内の `web/`。

## オプション

| 指定 | 動作 |
|------|------|
| `expose` | [公開する](#公開する-expose) |
| `unexpose` | [元に戻す](#元に戻す-unexpose) |
| 省略 | `web/package.json` の `dev` の hostname で判断する。`127.0.0.1` なら expose、`0.0.0.0` なら unexpose。ユーザーの意図と食い違いそうなら確認する |

例: `expose-lan expose`、`expose-lan unexpose`。

## 役割分担

| 誰 | できること |
|----|------------|
| エージェント | `web/package.json` の hostname、`web/next.config.ts` の `allowedDevOrigins`、コンテナ内 `npm run dev` の再起動 |
| ユーザー | Windows **管理者** PowerShell で expose / unexpose スクリプト |

エージェントは `.ps1` を WSL / コンテナから実行しない（管理者権限と Windows の portproxy / ファイアウォールが必要）。

## 公開する（expose）

1. `web/package.json` の `dev` を `next dev --hostname 0.0.0.0` にする。
2. `web/next.config.ts` に次を入れる（既存キーは残す）:

```ts
allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
```

3. コンテナ内 `web/` で開発サーバを（再）起動する。既に `127.0.0.1` で動いていれば止めてから `npm run dev`。PC は `http://localhost:3000` のまま使える。
4. ユーザーに、Windows の **管理者 PowerShell**（リポジトリルート）で次を実行するよう頼む:

```powershell
powershell -ExecutionPolicy Bypass -File .devcontainer/expose-lan.ps1
```

5. スクリプトが出す `http://<PCのIPv4>:3000` をスマホで開いてもらう。URL を推測して渡さない。

## 元に戻す（unexpose）

1. ユーザーに管理者 PowerShell で次を実行するよう頼む:

```powershell
powershell -ExecutionPolicy Bypass -File .devcontainer/unexpose-lan.ps1
```

2. `web/package.json` の `dev` を `next dev --hostname 127.0.0.1` に戻す。
3. `web/next.config.ts` から `allowedDevOrigins` を外す。
4. コンテナ内 `web/` で `npm run dev` を再起動する。

`unexpose-lan.ps1` は 3000 番の portproxy と、名前が `Our Mahjong History dev 3000` のファイアウォール規則だけを外す。localhost の転送は触らない。

## 注意

- コミットしない。hostname と `allowedDevOrigins` は作業用の一時変更。
- 公開したままセッションを終えない。戻す手順をユーザーに残す。
- スマホ確認の対象 URL は、そのとき見ている画面（例: `/communities`）を添える。
