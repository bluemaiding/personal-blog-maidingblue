# Blog Auto-Sync to GitHub
# Right-click → "Run with PowerShell" to start
# Press Ctrl+C to stop

$repo = "C:\Users\bluem\Desktop\claude\blog"
$remote = "origin"
$branch = "main"
$intervalSeconds = 30

function Write-Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Output "[$ts] $msg"
}

function Sync-Blog {
    Set-Location $repo
    $status = git -c safe.directory="C:/Users/bluem/Desktop/claude/blog" status --porcelain 2>$null
    if ($status) {
        Write-Log "Changes detected:"
        $status | ForEach-Object { Write-Log ("  " + $_) }
        git -c safe.directory="C:/Users/bluem/Desktop/claude/blog" add -A
        $msg = "auto-sync (" + (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + ")"
        git -c safe.directory="C:/Users/bluem/Desktop/claude/blog" commit -m $msg
        if ($LASTEXITCODE -eq 0) {
            Write-Log ("Committed: " + $msg)
            git -c safe.directory="C:/Users/bluem/Desktop/claude/blog" push $remote $branch 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Log ("Pushed to " + $remote + "/" + $branch + " OK")
            } else {
                Write-Log "Push failed (check network/credentials)"
            }
        }
    }
}

Write-Log "=== Blog Auto-Sync Started ==="
Write-Log ("Repo: " + $repo)
Write-Log ("Remote: " + $remote + "/" + $branch)
Write-Log ("Interval: " + $intervalSeconds + "s")
Write-Log "Press Ctrl+C to stop."

$timer = 0
while ($true) {
    $timer++
    if ($timer -ge $intervalSeconds) {
        $timer = 0
        Sync-Blog
    }
    Start-Sleep -Seconds 1
}