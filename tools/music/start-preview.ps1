$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
$previewPort = if ($env:LSSH_MUSIC_PREVIEW_PORT) { [int]$env:LSSH_MUSIC_PREVIEW_PORT } else { 61173 }
if ($previewPort -lt 1024 -or $previewPort -gt 65535) { throw '音乐预览端口无效。' }
$previewOrigin = "http://127.0.0.1:$previewPort"

function Test-MusicPreview {
  try {
    $state = Invoke-RestMethod -Uri "$previewOrigin/personal-homepage/api/music/playback/account" -TimeoutSec 2
    return ($state.PSObject.Properties.Name -contains 'authorized')
  } catch { return $false }
}

if (Test-MusicPreview) {
  Write-Output "音乐后台已运行：$previewOrigin/personal-homepage/music/"
  exit 0
}

# A detached, hidden process survives the launching terminal or agent turn.
$previewProcess = Start-Process -FilePath $nodePath -ArgumentList @('"' + (Join-Path $PSScriptRoot 'preview-service.mjs') + '"') -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru
for ($attempt = 0; $attempt -lt 30; $attempt++) {
  if ($previewProcess.HasExited) { throw '音乐后台启动失败，请检查端口是否被占用。' }
  if (Test-MusicPreview) {
    Write-Output "音乐后台已启动（PID $($previewProcess.Id)）：$previewOrigin/personal-homepage/music/"
    exit 0
  }
  Start-Sleep -Milliseconds 500
}
throw '音乐后台尚未就绪，请稍后重试。'
