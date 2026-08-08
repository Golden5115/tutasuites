$cert = Get-ChildItem -Path Cert:\CurrentUser\My | Where-Object { $_.Subject -match 'Tutasuites' } | Select-Object -First 1
$rsa = [System.Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($cert)
$bytes = $rsa.ExportPkcs8PrivateKey()
$base64 = [System.Convert]::ToBase64String($bytes, [System.Base64FormattingOptions]::InsertLineBreaks)
$pem = "-----BEGIN PRIVATE KEY-----`n" + $base64 + "`n-----END PRIVATE KEY-----"
[System.IO.File]::WriteAllText("c:\Users\DELL PRECISION 5540\.gemini\antigravity-ide\scratch\tutasuites\tutasuites-private.pem", $pem)
