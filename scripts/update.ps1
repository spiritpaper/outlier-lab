# Updates an unpacked Outlier Lab install to the latest GitHub release (Windows).
#   Double-click scripts\update.cmd inside the extension folder, or:
#   powershell -ExecutionPolicy Bypass -File scripts\update.ps1 C:\path\to\outlier-lab
# Downloads the release zip only when it's newer than the folder's version,
# then replaces the folder's files. Your data lives in Chrome, not in the
# folder, so it stays. The extension reloads itself within a few minutes,
# once no Outlier Lab page is open (or click reload in chrome://extensions).
# Works in Windows PowerShell 5.1 and PowerShell 7 (also on macOS/Linux).
param([string]$Folder = (Join-Path $PSScriptRoot '..'))
$ErrorActionPreference = 'Stop'
$Folder = (Resolve-Path $Folder).Path
$manifestPath = Join-Path $Folder 'manifest.json'
if (-not (Test-Path $manifestPath)) { throw "No manifest.json in $Folder. Is that the extension folder?" }
if ((Get-Content -Raw $manifestPath) -notmatch '"name":\s*"(Outlier Lab|YT Toolkit)"') { throw "$Folder doesn't hold Outlier Lab; nothing changed." }
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

$current = (Get-Content -Raw $manifestPath | ConvertFrom-Json).version
$release = Invoke-RestMethod -Uri 'https://api.github.com/repos/spiritpaper/outlier-lab/releases/latest' -Headers @{ 'User-Agent' = 'outlier-lab-updater' }
$latest = $release.tag_name -replace '^v', ''
# The extension zip (outlier-lab-v…, or youtube-toolkit-v… before the rename), not a companion archive.
$asset = $release.assets | Where-Object { $_.name -match '^(outlier-lab|youtube-toolkit)-v.*\.zip$' } | Select-Object -First 1
if (-not $latest -or -not $asset) { throw "Couldn't read the latest release from GitHub." }

if ([version]$latest -le [version]$current) {
  Write-Host "Up to date ($current)."
  exit 0
}

$tmp = Join-Path ([IO.Path]::GetTempPath()) ("yt-toolkit-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path $tmp | Out-Null
try {
  $zip = Join-Path $tmp 'release.zip'
  Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zip -UseBasicParsing -Headers @{ 'User-Agent' = 'outlier-lab-updater' }
  $new = Join-Path $tmp 'new'
  Expand-Archive -Path $zip -DestinationPath $new
  $new = (Resolve-Path $new).Path # the real path, so it prefixes every file's FullName (e.g. /var vs /private/var on macOS)
  if (-not (Test-Path (Join-Path $new 'manifest.json')) -or -not (Test-Path (Join-Path $new 'src/background/index.js'))) { throw "The download doesn't look like the extension; nothing changed." }
  # Copy the new files over the old ones, never emptying the folder, and the
  # manifest last: the extension reloads itself when the manifest changes, so
  # it must only see it once every other file is in place.
  $newManifest = Join-Path $tmp 'manifest.json'
  Move-Item -Path (Join-Path $new 'manifest.json') -Destination $newManifest
  foreach ($f in Get-ChildItem -Path $new -Recurse -File -Force) {
    $rel = $f.FullName.Substring($new.Length).TrimStart('\', '/')
    $dest = Join-Path $Folder $rel
    New-Item -ItemType Directory -Path (Split-Path $dest) -Force | Out-Null
    Copy-Item -LiteralPath $f.FullName -Destination $dest -Force
  }
  # Then remove the files the new version no longer has.
  foreach ($f in Get-ChildItem -Path $Folder -Recurse -File -Force) {
    $rel = $f.FullName.Substring($Folder.Length).TrimStart('\', '/')
    if ($rel -eq 'manifest.json' -or $rel -match '^\.git[\\/]') { continue }
    if (-not (Test-Path -LiteralPath (Join-Path $new $rel))) { Remove-Item -LiteralPath $f.FullName -Force }
  }
  Get-ChildItem -Path $Folder -Recurse -Directory -Force | Where-Object { $_.FullName.Substring($Folder.Length).TrimStart('\', '/') -notmatch '^\.git' } |
    Sort-Object { $_.FullName.Length } -Descending | Where-Object { -not (Get-ChildItem -LiteralPath $_.FullName -Force) } | Remove-Item -Force
  # Written next to it and swapped in, so Chrome never finds a half-written
  # manifest: one it can't read at startup leaves the extension out of the list.
  $staged = "$manifestPath.new"
  Copy-Item -LiteralPath $newManifest -Destination $staged -Force
  [IO.File]::Replace($staged, $manifestPath, [NullString]::Value)
  Write-Host "Updated $current -> $latest. The extension reloads itself shortly."
} finally {
  Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
}
