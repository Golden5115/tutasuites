$cert = New-SelfSignedCertificate -Subject "CN=Tutasuites.com, O=Tutasuites, C=NG" -CertStoreLocation "Cert:\CurrentUser\My" -KeyLength 2048
$certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
$base64 = [System.Convert]::ToBase64String($certBytes, [System.Base64FormattingOptions]::InsertLineBreaks)
$pem = "-----BEGIN CERTIFICATE-----`n" + $base64 + "`n-----END CERTIFICATE-----"
[System.IO.File]::WriteAllText("c:\Users\DELL PRECISION 5540\.gemini\antigravity-ide\scratch\tutasuites\tutasuites-cert.pem", $pem)
