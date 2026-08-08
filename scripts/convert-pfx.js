const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

try {
  const pfx = fs.readFileSync(path.join(__dirname, '../tutasuites.pfx'));
  const keyObj = crypto.createPrivateKey({
    key: pfx,
    passphrase: 'password',
    format: 'der',
    type: 'pkcs12'
  });

  const privateKeyPem = keyObj.export({ type: 'pkcs8', format: 'pem' });
  console.log('---PRIVATE KEY PEM---');
  console.log(privateKeyPem);
} catch (err) {
  console.error("Error converting PFX:", err);
}
