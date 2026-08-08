import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

const KEYS_DIR = path.join(process.cwd(), 'keys')
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'qz-private.pem')
const CERT_PATH = path.join(process.cwd(), 'tutasuites-cert.pem')

function ensureKeysExist() {
  if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true })
  }

  if (!fs.existsSync(PRIVATE_KEY_PATH) || !fs.existsSync(CERT_PATH)) {
    // Generate RSA 2048 key pair
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    })

    // Self-sign a simple X.509 certificate representation for QZ Tray
    // For standard RSA public cert, QZ Tray reads the PEM formatted certificate.
    fs.writeFileSync(PRIVATE_KEY_PATH, privateKey)
    fs.writeFileSync(CERT_PATH, publicKey)
  }
}

export function getQzCertificate(): string {
  ensureKeysExist()
  return fs.readFileSync(CERT_PATH, 'utf8')
}

export function signQzHash(toSign: string): string {
  ensureKeysExist()
  const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8')
  const sign = crypto.createSign('SHA512')
  sign.update(toSign)
  return sign.sign(privateKey, 'base64')
}
