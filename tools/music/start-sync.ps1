$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
Start-Process -FilePath $nodePath -ArgumentList @('"' + (Join-Path $PSScriptRoot 'sync-service.mjs') + '"') -WorkingDirectory $projectRoot -WindowStyle Hidden
