# 同一 LAN のスマホから Next.js (3000) へ届ける。
# 手順の正: docs/development.md 「同一 LAN のスマホから見る」
# Windows PowerShell を管理者で開き、このファイルを実行する。
# localhost はそのまま残し、PC の LAN IPv4 だけを WSL へ転送する。

$ErrorActionPreference = "Stop"

function Get-WslDevIp {
    $addresses = (wsl hostname -I 2>$null)
    if (-not $addresses) {
        throw "WSL の IP が取れませんでした。"
    }
    $candidates = $addresses.Trim().Split(" ", [System.StringSplitOptions]::RemoveEmptyEntries) |
        Where-Object { $_ -notlike "127.*" -and $_ -ne "10.255.255.254" }
    $preferred = $candidates | Where-Object { $_ -like "172.*" } | Select-Object -First 1
    if ($preferred) {
        return $preferred
    }
    return $candidates | Select-Object -First 1
}

function Get-LanIps {
    Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object {
            $_.PrefixOrigin -ne "WellKnown" -and
            $_.IPAddress -notlike "127.*" -and
            $_.IPAddress -ne "10.255.255.254" -and
            $_.InterfaceAlias -notlike "*WSL*" -and
            $_.InterfaceAlias -notlike "*vEthernet*" -and
            $_.InterfaceAlias -notlike "*Loopback*" -and
            $_.InterfaceAlias -notlike "*Docker*"
        } |
        Select-Object -ExpandProperty IPAddress -Unique
}

$wslIp = Get-WslDevIp
if (-not $wslIp) {
    throw "転送先の WSL IP がありません。"
}

$lanIps = @(Get-LanIps)
if ($lanIps.Count -eq 0) {
    throw "PC の LAN IPv4 が見つかりません。Wi-Fi / 有線が有効か確認してください。"
}

foreach ($lanIp in $lanIps) {
    netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=$lanIp | Out-Null
    netsh interface portproxy add v4tov4 listenport=3000 listenaddress=$lanIp connectport=3000 connectaddress=$wslIp
}

$ruleName = "Our Mahjong History dev 3000"
netsh advfirewall firewall delete rule name=$ruleName | Out-Null
netsh advfirewall firewall add rule name=$ruleName dir=in action=allow protocol=TCP localport=3000 | Out-Null

Write-Host "WSL (Next.js): ${wslIp}:3000"
Write-Host "スマホでは次を開いてください:"
foreach ($lanIp in $lanIps) {
    Write-Host "  http://${lanIp}:3000"
}
