const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const jwk = JSON.parse(fs.readFileSync(path.join(__dirname, 'rsa-jwk.json'), 'utf8'));
const keyObj = crypto.createPrivateKey({ key: jwk, format: 'jwk' });
const pem = keyObj.export({ type: 'pkcs8', format: 'pem' });

console.log('---TUTASUITES PRIVATE KEY PEM---');
console.log(pem);
