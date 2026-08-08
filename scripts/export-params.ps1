$cert = Get-ChildItem -Path Cert:\CurrentUser\My | Where-Object { $_.Subject -match 'Tutasuites' } | Select-Object -First 1
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
[System.IO.File]::WriteAllText("c:\Users\DELL PRECISION 5540\.gemini\antigravity-ide\scratch\tutasuites\scripts\rsa-key.json", $json)
