$cert = Get-ChildItem -Path Cert:\CurrentUser\My | Where-Object { $_.Subject -match 'Tutasuites' } | Select-Object -First 1
$bytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Pkcs12, 'password')
[System.IO.File]::WriteAllBytes("c:\Users\DELL PRECISION 5540\.gemini\antigravity-ide\scratch\tutasuites\tutasuites.pfx", $bytes)
