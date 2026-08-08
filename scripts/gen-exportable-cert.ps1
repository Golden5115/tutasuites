$cert = New-SelfSignedCertificate -Subject "CN=Tutasuites.com, O=Tutasuites, C=NG" -CertStoreLocation "Cert:\CurrentUser\My" -KeyExportPolicy Exportable -KeyLength 2048

# Export Certificate PEM
$certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
$certBase64 = [System.Convert]::ToBase64String($certBytes, [System.Base64FormattingOptions]::InsertLineBreaks)
$certPem = "-----BEGIN CERTIFICATE-----`n" + $certBase64 + "`n-----END CERTIFICATE-----"
[System.IO.File]::WriteAllText("c:\Users\DELL PRECISION 5540\.gemini\antigravity-ide\scratch\tutasuites\tutasuites-cert.pem", $certPem)

# Export RSAParameters to JWK JSON
$rsa = [System.Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($cert)
$params = $rsa.ExportParameters($true)

function To-B64Url($bytes) {
    return [System.Convert]::ToBase64String($bytes).Replace('+', '-').Replace('/', '_').TrimEnd('=')
}

$jwk = @{
    kty = "RSA"
    n   = To-B64Url $params.Modulus
    e   = To-B64Url $params.Exponent
    d   = To-B64Url $params.D
    p   = To-B64Url $params.P
    q   = To-B64Url $params.Q
    dp  = To-B64Url $params.DP
    dq  = To-B64Url $params.DQ
    qi  = To-B64Url $params.InverseQ
}

$json = $jwk | ConvertTo-Json
[System.IO.File]::WriteAllText("c:\Users\DELL PRECISION 5540\.gemini\antigravity-ide\scratch\tutasuites\scripts\rsa-jwk.json", $json)
