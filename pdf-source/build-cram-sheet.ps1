# Builds /free-cram-sheet.pdf from pdf-source/free-cram-sheet.html.
# Usage (from anywhere):
#   powershell -ExecutionPolicy Bypass -File pdf-source/build-cram-sheet.ps1
#   powershell -ExecutionPolicy Bypass -File pdf-source/build-cram-sheet.ps1 -Browser "C:\path\to\chrome.exe"
# Needs any Chromium-based browser: Edge, Chrome, or a Playwright Chromium.
# Fails (and leaves the existing PDF untouched) if the output isn't exactly one page.
param([string]$Browser)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$src = Join-Path $here 'free-cram-sheet.html'
$out = Join-Path (Split-Path -Parent $here) 'free-cram-sheet.pdf'

if (-not $Browser) {
    $candidates = @(
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
    )
    $pw = Join-Path $env:LOCALAPPDATA 'ms-playwright'
    if (Test-Path $pw) {
        $candidates += Get-ChildItem $pw -Directory -Filter 'chromium-*' |
            Sort-Object Name -Descending |
            ForEach-Object { Get-ChildItem $_.FullName -Recurse -Filter 'chrome.exe' -ErrorAction SilentlyContinue } |
            Select-Object -ExpandProperty FullName
    }
    $Browser = $candidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
}
if (-not $Browser) { throw 'No Chromium-based browser found. Pass -Browser "C:\path\to\chrome.exe".' }

$tmp = Join-Path ([IO.Path]::GetTempPath()) ("cram-sheet-" + [guid]::NewGuid().ToString('N') + '.pdf')
$profileDir = Join-Path ([IO.Path]::GetTempPath()) ("cram-sheet-profile-" + [guid]::NewGuid().ToString('N'))
$url = ([Uri](Resolve-Path $src).Path).AbsoluteUri

$chromeArgs = @('--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
          "--user-data-dir=$profileDir", '--no-pdf-header-footer', "--print-to-pdf=$tmp", $url)
$p = Start-Process -FilePath $Browser -ArgumentList $chromeArgs -Wait -PassThru -WindowStyle Hidden
Remove-Item $profileDir -Recurse -Force -ErrorAction SilentlyContinue
if (-not (Test-Path $tmp)) { throw "Browser did not produce a PDF (exit code $($p.ExitCode))." }

$text = [Text.Encoding]::GetEncoding('ISO-8859-1').GetString([IO.File]::ReadAllBytes($tmp))
$pages = ([regex]::Matches($text, '/Type\s*/Page[^s]')).Count
if ($pages -ne 1) {
    Remove-Item $tmp -Force
    throw "Expected 1 page but got $pages. Tighten the layout in free-cram-sheet.html."
}
Move-Item $tmp $out -Force
Write-Host "Built $out (1 page, $((Get-Item $out).Length) bytes) using $Browser"
