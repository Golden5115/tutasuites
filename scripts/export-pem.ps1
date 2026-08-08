$code = @"
using System;
using System.IO;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;

public class KeyExporter {
    public static void ExportPrivateKey(string certSubject, string outputPath) {
        X509Store store = new X509Store(StoreName.My, StoreLocation.CurrentUser);
        store.Open(OpenFlags.ReadOnly);
        foreach (X509Certificate2 cert in store.Certificates) {
            if (cert.Subject.Contains(certSubject) && cert.HasPrivateKey) {
                RSA rsa = cert.GetRSAPrivateKey();
                if (rsa != null) {
                    byte[] pkcs8 = rsa.ExportPkcs8PrivateKey();
                    string base64 = Convert.ToBase64String(pkcs8, Base64FormattingOptions.InsertLineBreaks);
                    string pem = "-----BEGIN PRIVATE KEY-----\n" + base64 + "\n-----END PRIVATE KEY-----";
                    File.WriteAllText(outputPath, pem);
                    return;
                }
            }
        }
    }
}
"@

Add-Type -TypeDefinition $code -Language CSharp
[KeyExporter]::ExportPrivateKey("Tutasuites", "c:\Users\DELL PRECISION 5540\.gemini\antigravity-ide\scratch\tutasuites\tutasuites-private.pem")
