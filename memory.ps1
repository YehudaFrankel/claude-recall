param([string]$action = 'pull')

# === CONFIGURATION ===
# Set during setup — the private GitHub repo that stores memory + .claude/ across machines
$repo = '__MEMORY_REPO_URL__'

if ($repo -eq '__MEMORY_REPO_URL__') {
    Write-Host 'ERROR: memory.ps1 not configured. Set $repo on line 4 to your GitHub memory repo URL.'
    Write-Host 'Create one: gh repo create my-project-memory --private --clone'
    exit 1
}

# Auto-detect paths from script location
$projectFolder = $PSScriptRoot -replace '\\','-' -replace ':','-' -replace '\.','-'
$system  = "$env:USERPROFILE\.claude\projects\$projectFolder\memory"
$claude  = "$PSScriptRoot\.claude"
$dashRoot = "$PSScriptRoot\_tools\dashboard"

# Resolve the real git.exe — on some machines a broken 0-byte
# "git" App Execution Alias in System32 shadows the real Git for Windows
$gitExe = 'git'
foreach ($candidate in @("$env:ProgramFiles\Git\cmd\git.exe", "${env:ProgramFiles(x86)}\Git\cmd\git.exe")) {
    if (Test-Path $candidate) { $gitExe = $candidate; break }
}

function Invoke-Git {
    $output = & $gitExe @args 2>&1
    $output | Where-Object { $_ -notmatch 'Failed to write item to store|Not enough memory resources' } | ForEach-Object { Write-Host $_ }
}

if ($action -eq 'pull') {
    if (Test-Path "$system\.git") {
        Push-Location $system
        $null = (& $gitExe fetch origin 2>&1)
        $localHead  = & $gitExe rev-parse HEAD 2>&1
        $remoteHead = & $gitExe rev-parse origin/main 2>&1
        if ($localHead -eq $remoteHead) {
            Write-Host 'Memory already up to date.'
            Pop-Location
        } else {
            Write-Host 'Pulling from GitHub...'
            $stashOut = & $gitExe stash 2>&1
            if ($stashOut -notmatch 'No local changes') { $didStash = $true } else { $didStash = $false }
            Invoke-Git pull
            # Auto-resolve conflicts in append-only log files (always take remote)
            $logFiles = @('lessons.md','decisions.md','tasks/skill_scores.md','tasks/skill_usage.md','tasks/velocity.md','tasks/errors.md','tasks/regret.md')
            foreach ($f in $logFiles) {
                $s = & $gitExe status $f 2>&1
                if ($s -match 'both modified') {
                    & $gitExe checkout --theirs $f 2>&1 | Out-Null
                    & $gitExe add $f 2>&1 | Out-Null
                }
            }
            if (Test-Path '.git/MERGE_HEAD') {
                & $gitExe commit -m 'Auto-resolve append-only log conflicts' 2>&1 | Out-Null
            }
            if ($didStash) { Invoke-Git stash pop }
            Pop-Location
        }
    } else {
        Write-Host 'Cloning from GitHub...'
        if (Test-Path $system) { Remove-Item $system -Recurse -Force }
        Invoke-Git clone $repo $system
    }
    # Restore .claude/ folder from repo
    if (Test-Path "$system\claude") {
        robocopy "$system\claude" "$claude" /MIR /NFL /NDL /NJH /NJS /NC /NS | Out-Null
        # Auto-patch machine-specific paths — the repo stores a canonical drive letter (C:)
        # and pull rewrites to this machine's actual paths so skills/hooks work on any drive
        $webappsPath = $PSScriptRoot -replace '\\','/'
        $canonFolder = $projectFolder -replace '^[a-zA-Z]', 'C'
        $canonFwd    = $webappsPath -replace '^[a-zA-Z]:', 'C:'
        $canonBack   = $PSScriptRoot -replace '^[a-zA-Z]:', 'C:'
        Get-ChildItem -Path $claude -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
            $content = [System.IO.File]::ReadAllText($_.FullName, [System.Text.Encoding]::UTF8)
            $patched = $content -replace [regex]::Escape($canonFolder), $projectFolder
            $patched = $patched -replace [regex]::Escape($canonFwd), $webappsPath
            $patched = $patched -replace [regex]::Escape($canonBack), $PSScriptRoot
            if ($patched -cne $content) {
                [System.IO.File]::WriteAllText($_.FullName, $patched, [System.Text.Encoding]::UTF8)
            }
        }
    }
    # Restore dashboard from repo
    if (Test-Path "$system\dashboard") {
        New-Item -ItemType Directory -Path "$dashRoot\public" -Force | Out-Null
        Copy-Item "$system\dashboard\*" "$dashRoot\" -Force -ErrorAction SilentlyContinue
        if (Test-Path "$system\dashboard\public") {
            Copy-Item "$system\dashboard\public\*" "$dashRoot\public\" -Force -ErrorAction SilentlyContinue
        }
    }
    # Restore STATUS.md from repo if it exists there
    if (Test-Path "$system\STATUS.md") {
        Copy-Item "$system\STATUS.md" "$PSScriptRoot\STATUS.md" -Force
    }
    # Write machine-local path config (never committed to repo)
    [System.IO.File]::WriteAllText("$PSScriptRoot\_mem_path.txt", $system)
    [System.IO.File]::WriteAllText("$PSScriptRoot\_webapps_path.txt", ($PSScriptRoot -replace '\\','/'))
    Write-Host 'Done -- memory, settings and skills ready. Type Start Session.'
}
elseif ($action -eq 'push') {
    if (-not (Test-Path "$system\.git")) {
        Write-Host "ERROR: memory repo not found at $system -- run 'memory.ps1 pull' first."
        exit 1
    }
    # Mirror .claude/ into repo
    New-Item -ItemType Directory -Path "$system\claude" -Force | Out-Null
    robocopy "$claude" "$system\claude" /MIR /NFL /NDL /NJH /NJS /NC /NS | Out-Null
    # Canonicalize machine-specific paths before committing — pull re-patches them
    # to the local drive on the way out, so the repo stays neutral across machines
    $webappsPath = $PSScriptRoot -replace '\\','/'
    $canonFolder = $projectFolder -replace '^[a-zA-Z]', 'C'
    $canonFwd    = $webappsPath -replace '^[a-zA-Z]:', 'C:'
    $canonBack   = $PSScriptRoot -replace '^[a-zA-Z]:', 'C:'
    Get-ChildItem -Path "$system\claude" -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
        $content = [System.IO.File]::ReadAllText($_.FullName, [System.Text.Encoding]::UTF8)
        $canon = $content -replace [regex]::Escape($projectFolder), $canonFolder
        $canon = $canon -replace [regex]::Escape($webappsPath), $canonFwd
        $canon = $canon -replace [regex]::Escape($PSScriptRoot), $canonBack
        if ($canon -cne $content) {
            [System.IO.File]::WriteAllText($_.FullName, $canon, [System.Text.Encoding]::UTF8)
        }
    }
    # Mirror dashboard into repo
    if (Test-Path $dashRoot) {
        New-Item -ItemType Directory -Path "$system\dashboard\public" -Force | Out-Null
        Copy-Item "$dashRoot\server.js"         "$system\dashboard\server.js"         -Force -ErrorAction SilentlyContinue
        Copy-Item "$dashRoot\prompts.json"      "$system\dashboard\prompts.json"      -Force -ErrorAction SilentlyContinue
        if (Test-Path "$dashRoot\public") {
            Copy-Item "$dashRoot\public\*"      "$system\dashboard\public\"           -Force -ErrorAction SilentlyContinue
        }
    }
    # Sync STATUS.md into repo
    if (Test-Path "$PSScriptRoot\STATUS.md") {
        Copy-Item "$PSScriptRoot\STATUS.md" "$system\STATUS.md" -Force
    }
    # Copy self into repo so pull restores it
    Copy-Item "$PSScriptRoot\memory.ps1" "$system\memory.ps1" -Force
    Push-Location $system -ErrorAction Stop
    try {
        Invoke-Git add .
        $changes = & $gitExe status --short 2>&1
        if ($changes) {
            Invoke-Git commit -m "Memory update $(Get-Date -Format 'yyyy-MM-dd')"
            Invoke-Git pull --no-rebase origin main
            Invoke-Git push
        } else {
            Write-Host 'Nothing to commit -- memory already up to date.'
        }
    } finally {
        Pop-Location
    }
    Write-Host 'Done -- memory pushed to GitHub.'
}
else {
    Write-Host 'Usage: .\memory.ps1 pull   or   .\memory.ps1 push'
}
