# Builds the Bahasa Melayu pages (ms/*.html) from the English pages.
#
# Usage (from the project folder):
#   powershell -ExecutionPolicy Bypass -File tools\build-ms.ps1
#
# How it works: each English page is copied to ms/, asset paths get "../",
# the EN | MS switch is flipped, and every text that exactly matches a line in
# tools\i18n-ms.txt is replaced with its Malay version. Run it again whenever
# the English pages or the translation file change.

$ErrorActionPreference = 'Stop'
$root   = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root 'ms'
$enc    = New-Object System.Text.UTF8Encoding $false
$pages  = 'index', 'services', 'about', 'contact'

# ---- Load dictionary ----
$dict = New-Object System.Collections.Hashtable ([StringComparer]::Ordinal)  # case-sensitive ("Contact Us" vs "Contact us")
$dictFile = Join-Path $PSScriptRoot 'i18n-ms.txt'
foreach ($line in [IO.File]::ReadAllLines($dictFile, $enc)) {
  if (-not $line.Trim() -or $line.TrimStart().StartsWith('#')) { continue }
  $parts = $line -split '\|\|\|', 2
  if ($parts.Count -ne 2) { Write-Warning "Bad line: $line"; continue }
  $dict[(($parts[0] -replace '\s+', ' ').Trim())] = $parts[1].Trim()
}
$script:used = New-Object System.Collections.Hashtable ([StringComparer]::Ordinal)
$script:missing = New-Object System.Collections.Generic.List[string]

# Text that is the same in both languages (brand names, places, codes)
$keep = @('AWS','Google Cloud','Alibaba Cloud','Tencent Cloud','Huawei Cloud','BytePlus','WhatsApp','Telegram',
  'WhatsApp / Telegram','Lunex','lunex','Lu','na','nex','us','Luna','nexus','EN','BM','China','Video','CDN','AI / ML',
  'Malaysia','Indonesia','Thailand','Vietnam','Kuala Lumpur, Malaysia','&copy;','support@lunexsb.com',
  'SSM 202601023276 (1685373-X)','5, Lorong Peel, Maluri,','55100 Cheras, Wilayah Persekutuan Kuala Lumpur',
  '5, Lorong Peel, Maluri, 55100 Cheras, Wilayah Persekutuan Kuala Lumpur','WhatsApp / Telegram +60 11-1879 1260',
  '+60 11-1879 1260','--:--','2026','assets/img/lunex-icon-512.png')

function Translate([string]$raw, [string]$where) {
  $key = ($raw -replace '\s+', ' ').Trim()
  if (-not $key -or $key -notmatch '[A-Za-z]') { return $raw }
  if ($key -match '^(@@SCRIPT\d+@@|width=|#[0-9a-f]{3,6}$)') { return $raw }  # technical values
  if ($dict.ContainsKey($key)) {
    $script:used[$key] = $true
    $lead  = [regex]::Match($raw, '^\s*').Value
    $trail = [regex]::Match($raw, '\s*$').Value
    return $lead + $dict[$key] + $trail
  }
  if ($keep -notcontains $key) { $script:missing.Add("$where : $key") }
  return $raw
}

if (-not (Test-Path $outDir)) { New-Item -ItemType Directory $outDir | Out-Null }

foreach ($p in $pages) {
  $html = [IO.File]::ReadAllText((Join-Path $root "$p.html"), $enc)

  # Protect <script> blocks from translation
  $scripts = New-Object System.Collections.Generic.List[string]
  $html = [regex]::Replace($html, '(?s)<script\b.*?</script>', {
    param($m) $scripts.Add($m.Value); "@@SCRIPT$($scripts.Count - 1)@@" })

  # 1) Translate text between tags
  $html = [regex]::Replace($html, '>([^<>]+)<', {
    param($m) '>' + (Translate $m.Groups[1].Value "$p text") + '<' })

  # 2) Translate selected attributes
  $html = [regex]::Replace($html, '\b(alt|aria-label|placeholder|content|data-label|title)="([^"]*)"', {
    param($m) $m.Groups[1].Value + '="' + (Translate $m.Groups[2].Value "$p @$($m.Groups[1].Value)") + '"' })

  # Restore scripts
  $html = [regex]::Replace($html, '@@SCRIPT(\d+)@@', { param($m) $scripts[[int]$m.Groups[1].Value] })

  # 3) Language + paths for the ms/ folder
  $html = $html.Replace('<html lang="en">', '<html lang="ms" data-root="../">')
  foreach ($a in 'href="css/', 'src="js/', 'href="assets/', 'src="assets/', 'content="assets/') {
    $html = $html.Replace($a, $a.Substring(0, $a.Length - 0).Replace('="', '="../'))
  }
  $html = $html.Replace('<link rel="alternate" hreflang="en" href="', '<link rel="alternate" hreflang="en" href="../')
  $html = $html.Replace('<link rel="alternate" hreflang="ms" href="ms/', '<link rel="alternate" hreflang="ms" href="')

  # 4) Flip the EN | MS switch
  $html = [regex]::Replace($html,
    '<a class="lang__opt is-on" data-lang="en" href="([^"]+)" hreflang="en" aria-current="true">EN</a><a class="lang__opt" data-lang="ms" href="ms/([^"]+)" hreflang="ms">BM</a>',
    '<a class="lang__opt" data-lang="en" href="../$1" hreflang="en">EN</a><a class="lang__opt is-on" data-lang="ms" href="$2" hreflang="ms" aria-current="true">BM</a>')

  [IO.File]::WriteAllText((Join-Path $outDir "$p.html"), $html, $enc)
  Write-Host "Built ms/$p.html"
}

# ---- Report ----
$unused = $dict.Keys | Where-Object { -not $script:used.ContainsKey($_) } | Sort-Object
Write-Host ""
Write-Host ("Translations used: {0} of {1}" -f $script:used.Count, $dict.Count)
if ($unused) { Write-Host "Unused translations (English text no longer on the site?):"; $unused | ForEach-Object { Write-Host "  - $_" } }
$miss = $script:missing | Select-Object -Unique
if ($miss) { Write-Host "Untranslated English text (add these to tools\i18n-ms.txt):"; $miss | ForEach-Object { Write-Host "  - $_" } }
else { Write-Host "No untranslated text found." }
