# expose-lan.ps1 が入れた portproxy とファイアウォール規則を外す。
# 手順の正: docs/development.md 「同一 LAN のスマホから見る」
# Windows PowerShell を管理者で開き、このファイルを実行する。
# localhost の転送は触らない。

$ErrorActionPreference = "Stop"

$listenPort = 3000
$ruleName = "Our Mahjong History dev 3000"

function Get-PortProxyListenAddresses {
    $output = netsh interface portproxy show v4tov4
    $addresses = @()
    foreach ($line in $output) {
        if ($line -match "^\s*(\d+\.\d+\.\d+\.\d+)\s+$listenPort\s+") {
            $addresses += $Matches[1]
        }
    }
    return $addresses | Select-Object -Unique
}

$listenAddresses = @(Get-PortProxyListenAddresses)
foreach ($listenAddress in $listenAddresses) {
    netsh interface portproxy delete v4tov4 listenport=$listenPort listenaddress=$listenAddress | Out-Null
    Write-Host "portproxy を削除: ${listenAddress}:${listenPort}"
}

if ($listenAddresses.Count -eq 0) {
    Write-Host "portproxy (${listenPort}) はありませんでした。"
}

netsh advfirewall firewall delete rule name=$ruleName 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "ファイアウォール規則を削除: $ruleName"
} else {
    Write-Host "ファイアウォール規則はありませんでした: $ruleName"
}

Write-Host "LAN 公開を元に戻しました。PC のブラウザは http://localhost:${listenPort} のまま使えます。"
