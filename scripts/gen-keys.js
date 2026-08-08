const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate RSA 2048 Key Pair
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
});

console.log("Private Key Generated Length:", privateKey.length);
console.log("Public Key Generated Length:", publicKey.length);
