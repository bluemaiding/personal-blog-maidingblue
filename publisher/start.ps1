$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
try {
    $blogRoot = Split-Path -Parent $PSScriptRoot
    $statePath = Join-Path $blogRoot '.publisher-state'
    New-Item -ItemType Directory -Path $statePath -Force | Out-Null
    $serverPort = 3210
    $alreadyRunning = $false
    try {
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:$serverPort/health" -TimeoutSec 2
        if ($health.app -eq 'bluemaiding-publisher' -and $health.root -eq $blogRoot) { $alreadyRunning = $true }
        else { throw 'Port is used by another application.' }
    } catch {
        $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $serverPort)
        try { $listener.Start() } catch { throw 'Port 3210 is already in use. Close the other application and retry.' }
        finally { $listener.Stop() }
    }
    if (-not $alreadyRunning) {
        $nodeCmd = Get-Command node.exe -ErrorAction SilentlyContinue
        $nodeExe = if ($nodeCmd) { $nodeCmd.Source } else { Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' }
        if (-not (Test-Path -LiteralPath $nodeExe)) { throw 'Node.js is missing. Install Node.js 24 or newer.' }
        $serverFile = Join-Path $PSScriptRoot 'server.cjs'
        Start-Process -FilePath $nodeExe -ArgumentList @('"' + $serverFile + '"') -WorkingDirectory $blogRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $statePath 'server.log') -RedirectStandardError (Join-Path $statePath 'server-error.log') | Out-Null
        $ready = $false
        for ($i = 0; $i -lt 30; $i++) {
            Start-Sleep -Milliseconds 300
            try { $health = Invoke-RestMethod -Uri "http://127.0.0.1:$serverPort/health" -TimeoutSec 1; if ($health.app -eq 'bluemaiding-publisher' -and $health.root -eq $blogRoot) { $ready = $true; break } } catch {}
        }
        if (-not $ready) { throw "Publisher could not start. See $statePath\server-error.log" }
    }
    Start-Process -FilePath "http://127.0.0.1:$serverPort/publisher" -WindowStyle Hidden
} catch {
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'Blog publisher', 'OK', 'Error') | Out-Null
}
