param([ValidateSet('protect','unprotect')][string]$Mode, [ValidateSet('upload','netease-playback')][string]$Purpose = 'upload')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$inputBytes = [Convert]::FromBase64String([Console]::In.ReadToEnd().Trim())
$purposeTag = if ($Purpose -eq 'netease-playback') { 'LSSH-NetEase-playback-v1' } else { 'LSSH-Echoes-upload-v1' }
$entropy = [Text.Encoding]::UTF8.GetBytes($purposeTag)
try {
    if ($Mode -eq 'protect') {
        $result = [Security.Cryptography.ProtectedData]::Protect($inputBytes, $entropy, [Security.Cryptography.DataProtectionScope]::CurrentUser)
    } else {
        $result = [Security.Cryptography.ProtectedData]::Unprotect($inputBytes, $entropy, [Security.Cryptography.DataProtectionScope]::CurrentUser)
    }
    [Console]::Out.Write([Convert]::ToBase64String($result))
} finally {
    [Array]::Clear($inputBytes, 0, $inputBytes.Length)
}
