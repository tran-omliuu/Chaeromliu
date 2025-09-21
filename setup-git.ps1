function Abort($msg) {
    Write-Host "ERROR: $msg" -ForegroundColor Red
    exit 1
}

# Check for git
$git = Get-Command git -ErrorAction SilentlyContinue
if (-not $git) {
    Write-Host "Git does not appear to be installed or not in PATH." -ForegroundColor Yellow
    Write-Host "Please install Git for Windows: https://git-scm.com/download/win" -ForegroundColor Cyan
    Write-Host "Or use GitHub Desktop: https://desktop.github.com/" -ForegroundColor Cyan
    exit 2
}

# Ensure we're in the project directory
$cwd = Get-Location
Write-Host "Working in: $cwd"

# Initialize repo if needed
if (-not (Test-Path .git)) {
    & git init
    if ($LASTEXITCODE -ne 0) { Abort "git init failed" }
    Write-Host "Initialized empty git repository." -ForegroundColor Green
} else {
    Write-Host "Existing git repository detected." -ForegroundColor Cyan
}

# Ensure user identity is set (local-only if missing)
$userName = (& git config user.name) -join ''
$userEmail = (& git config user.email) -join ''
if (-not $userName) {
    $userName = Read-Host 'Enter your Git user.name (for commits)'
    if ($userName) { git config user.name "$userName" }
}
if (-not $userEmail) {
    $userEmail = Read-Host 'Enter your Git user.email (for commits)'
    if ($userEmail) { git config user.email "$userEmail" }
}

# Add & commit
& git add .
if ($LASTEXITCODE -ne 0) { Abort "git add failed" }
$message = Read-Host 'Commit message (default: "chore: initial site snapshot")'
if (-not $message) { $message = 'chore: initial site snapshot' }
# If repo already has commits warn and skip commit
$hasCommits = (& git rev-parse --verify HEAD 2>$null) -ne $null
if ($hasCommits) {
    Write-Host "Repository already has commits — creating a new commit anyway." -ForegroundColor Yellow
}

& git commit -m "$message"
if ($LASTEXITCODE -ne 0) { Write-Host "No changes to commit or commit failed." -ForegroundColor Yellow }

# Ensure main branch
try {
    git branch -M main
} catch {
    # ignore
}

# Optionally set remote and push
$remote = Read-Host 'Remote URL to push to (leave empty to skip)'
if ($remote) {
    # If origin exists, confirm overwrite
    $originExists = (& git remote get-url origin 2>$null) -ne $null
    if ($originExists) {
        $ok = Read-Host 'Origin already exists — overwrite it? (y/N)'
        if ($ok -match '^[Yy]') {
            & git remote remove origin
            if ($LASTEXITCODE -ne 0) { Abort "Failed to remove existing origin" }
        } else {
            Write-Host 'Skipping remote update.' -ForegroundColor Cyan
            exit 0
        }
    }
    & git remote add origin $remote
    if ($LASTEXITCODE -ne 0) { Abort 'Failed to add remote origin' }
    Write-Host 'Pushing to origin main...' -ForegroundColor Cyan
    & git push -u origin main
    if ($LASTEXITCODE -ne 0) { Abort 'git push failed — check your auth or remote URL' }
    Write-Host 'Push complete.' -ForegroundColor Green
} else {
    Write-Host 'No remote provided — local repo created.' -ForegroundColor Cyan
}

Write-Host 'Done.' -ForegroundColor Green
