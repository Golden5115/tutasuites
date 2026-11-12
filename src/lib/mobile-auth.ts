import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { argon2id } from "@noble/hashes/argon2.js"

// ============================================================================
// 1. CONFIGURATION & SECURITY CONSTANTS
// ============================================================================

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60 // 15 minutes
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes
const OTP_MAX_ATTEMPTS = 5
const OTP_RESEND_COOLDOWN_MS = 30 * 1000 // 30 seconds
const LOGIN_MAX_FAILED_ATTEMPTS = 5
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000 // 15 minutes

// Argon2id parameters (OWASP recommended profile)
const ARGON2_MEMORY_KIB = 19456 // 19 MiB
const ARGON2_PASSES = 2
const ARGON2_PARALLELISM = 1
const ARGON2_TAG_LENGTH = 32
const ARGON2_SALT_LENGTH = 16

function getSigningSecret(): string {
  const secret =
    process.env.MOBILE_AUTH_SECRET ||
    process.env.ACCESS_TOKEN_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET
  if (secret && secret.length >= 16) {
    return secret
  }
  if (process.env.DATABASE_URL) {
    return crypto
      .createHmac("sha256", "tuta-mobile-auth-signing-key-v1")
      .update(process.env.DATABASE_URL)
      .digest("hex")
  }
  throw new Error("Server authentication secret (AUTH_SECRET) is not configured.")
}

export const SECURITY_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Platform",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
}

// ============================================================================
// 2. NON-DESTRUCTIVE SCHEMA INITIALIZATION GUARD
// ============================================================================

const globalForAuthSchema = globalThis as unknown as {
  mobileAuthSchemaEnsured?: boolean
  mobileAuthSchemaPromise?: Promise<void>
}

export async function ensureMobileAuthSchema(): Promise<void> {
  if (globalForAuthSchema.mobileAuthSchemaEnsured) return
  if (globalForAuthSchema.mobileAuthSchemaPromise) {
    return globalForAuthSchema.mobileAuthSchemaPromise
  }

  globalForAuthSchema.mobileAuthSchemaPromise = (async () => {
    try {
      // Fast path: if MobileOtpRecord & MobileCustomerSession already exist in PostgreSQL, skip DDL round-trips
      try {
        await prisma.$queryRawUnsafe(`SELECT 1 FROM "MobileOtpRecord" LIMIT 1`)
        globalForAuthSchema.mobileAuthSchemaEnsured = true
        return
      } catch {
        // Table not yet created; proceed with full non-destructive DDL initialization
      }

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "MobileCustomer" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "phone" TEXT NOT NULL,
          "email" TEXT,
          "address" TEXT,
          "passwordHash" TEXT,
          "emailVerifiedAt" TIMESTAMP(3),
          "googleSub" TEXT,
          "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
          "lockedUntil" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "MobileCustomer_pkey" PRIMARY KEY ("id")
        );
      `)
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "MobileCustomer" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);`
      )
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "MobileCustomer" ADD COLUMN IF NOT EXISTS "googleSub" TEXT;`
      )
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "MobileCustomer" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;`
      )
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "MobileCustomer" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);`
      )
      // Backfill emailVerifiedAt on pre-existing legacy rows so existing customers are never locked out
      await prisma.$executeRawUnsafe(`
        UPDATE "MobileCustomer"
        SET "emailVerifiedAt" = "createdAt"
        WHERE "emailVerifiedAt" IS NULL AND "passwordHash" IS NOT NULL AND "passwordHash" NOT LIKE '$argon2id$%';
      `)

      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "MobileCustomer_email_idx" ON "MobileCustomer"("email");`
      )
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "MobileCustomer_phone_idx" ON "MobileCustomer"("phone");`
      )
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "MobileCustomer_googleSub_idx" ON "MobileCustomer"("googleSub");`
      )

      await prisma.$executeRawUnsafe(
        `ALTER TABLE "GrabAndGoOrder" ADD COLUMN IF NOT EXISTS "customerId" TEXT;`
      )
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "GrabAndGoOrder_customerId_idx" ON "GrabAndGoOrder"("customerId");`
      )

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "MobileCustomerSession" (
          "id" TEXT NOT NULL,
          "customerId" TEXT NOT NULL,
          "refreshTokenHash" TEXT NOT NULL,
          "previousTokenHash" TEXT,
          "familyId" TEXT NOT NULL,
          "deviceInfo" TEXT,
          "ipAddress" TEXT,
          "expiresAt" TIMESTAMP(3) NOT NULL,
          "revokedAt" TIMESTAMP(3),
          "revokedReason" TEXT,
          "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "MobileCustomerSession_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "MobileCustomerSession_customerId_fkey"
            FOREIGN KEY ("customerId") REFERENCES "MobileCustomer"("id")
            ON DELETE CASCADE ON UPDATE CASCADE
        );
      `)
      await prisma.$executeRawUnsafe(
        `CREATE UNIQUE INDEX IF NOT EXISTS "MobileCustomerSession_refreshTokenHash_key" ON "MobileCustomerSession"("refreshTokenHash");`
      )
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "MobileCustomerSession_customerId_idx" ON "MobileCustomerSession"("customerId");`
      )
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "MobileCustomerSession_familyId_idx" ON "MobileCustomerSession"("familyId");`
      )

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "MobileOtpRecord" (
          "id" TEXT NOT NULL,
          "identifier" TEXT NOT NULL,
          "purpose" TEXT NOT NULL,
          "otpHash" TEXT NOT NULL,
          "payloadJson" TEXT,
          "attempts" INTEGER NOT NULL DEFAULT 0,
          "maxAttempts" INTEGER NOT NULL DEFAULT 5,
          "expiresAt" TIMESTAMP(3) NOT NULL,
          "consumedAt" TIMESTAMP(3),
          "invalidatedAt" TIMESTAMP(3),
          "ipAddress" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "MobileOtpRecord_pkey" PRIMARY KEY ("id")
        );
      `)
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "MobileOtpRecord_identifier_purpose_idx" ON "MobileOtpRecord"("identifier", "purpose");`
      )

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "MobileAuthRateLimit" (
          "key" TEXT NOT NULL,
          "count" INTEGER NOT NULL DEFAULT 1,
          "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "blockedUntil" TIMESTAMP(3),
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "MobileAuthRateLimit_pkey" PRIMARY KEY ("key")
        );
      `)

      globalForAuthSchema.mobileAuthSchemaEnsured = true
    } catch (err) {
      console.error("Schema initialization warning:", err)
    } finally {
      globalForAuthSchema.mobileAuthSchemaPromise = undefined
    }
  })()

  return globalForAuthSchema.mobileAuthSchemaPromise
}

// ============================================================================
// 3. INPUT VALIDATION & NORMALIZATION
// ============================================================================

export function normalizeEmail(raw: string): string {
  return (raw || "").trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
}

/**
 * Normalizes Nigerian and international phone numbers to E.164 format (+234...)
 */
export function normalizePhoneNG(raw: string): string {
  const digitsAndPlus = (raw || "").trim().replace(/[\s\-().]/g, "")
  if (!digitsAndPlus) return ""

  // Nigerian local format: 080..., 081..., 070..., 090..., 091... (11 digits)
  if (/^0[789][01]\d{8}$/.test(digitsAndPlus)) {
    return `+234${digitsAndPlus.slice(1)}`
  }
  // 10-digit Nigerian number missing leading 0: 8012345678
  if (/^[789][01]\d{8}$/.test(digitsAndPlus)) {
    return `+234${digitsAndPlus}`
  }
  // 2348012345678 without leading +
  if (/^234[789][01]\d{8}$/.test(digitsAndPlus)) {
    return `+${digitsAndPlus}`
  }
  // Already +234...
  if (/^\+234[789][01]\d{8}$/.test(digitsAndPlus)) {
    return digitsAndPlus
  }
  // Other international E.164
  if (/^\+\d{8,15}$/.test(digitsAndPlus)) {
    return digitsAndPlus
  }
  return digitsAndPlus
}

export function isValidPhoneNG(phone: string): boolean {
  const norm = normalizePhoneNG(phone)
  return /^\+234[789][01]\d{8}$/.test(norm) || /^\+\d{10,15}$/.test(norm)
}

/**
 * Returns all phone representations (+23480..., 080..., 23480...) to preserve lookup compatibility
 * with existing MobileCustomer rows stored in local 080... format.
 */
export function getPhoneLookupVariants(rawPhone: string): string[] {
  const e164 = normalizePhoneNG(rawPhone)
  const variants = new Set<string>()
  if (rawPhone.trim()) variants.add(rawPhone.trim().replace(/\s+/g, ""))
  if (e164) {
    variants.add(e164)
    if (e164.startsWith("+234") && e164.length === 14) {
      variants.add(`0${e164.slice(4)}`)
      variants.add(e164.slice(1))
    }
  }
  return Array.from(variants)
}

export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== "string") {
    return { valid: false, error: "Password is required." }
  }
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long." }
  }
  if (password.length > 128) {
    return { valid: false, error: "Password must not exceed 128 characters." }
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return {
      valid: false,
      error: "Password must contain at least one letter and one number or special character.",
    }
  }
  return { valid: true }
}

// ============================================================================
// 4. ARGON2ID PASSWORD HASHING & LEGACY SHA-256 MIGRATION
// ============================================================================

function toUnpaddedBase64(buf: Uint8Array | Buffer): string {
  return Buffer.from(buf).toString("base64").replace(/=+$/, "")
}

function fromUnpaddedBase64(str: string): Buffer {
  const padLen = (4 - (str.length % 4)) % 4
  return Buffer.from(str + "=".repeat(padLen), "base64")
}

async function computeArgon2idRaw(
  password: string,
  salt: Buffer,
  memory: number,
  passes: number,
  parallelism: number,
  tagLength: number
): Promise<Buffer> {
  const c = crypto as any
  if (typeof c.argon2 === "function") {
    return new Promise<Buffer>((resolve, reject) => {
      c.argon2(
        "argon2id",
        {
          message: Buffer.from(password, "utf-8"),
          nonce: salt,
          parallelism,
          tagLength,
          memory,
          passes,
        },
        (err: Error | null, derivedKey: Buffer) => {
          if (err) reject(err)
          else resolve(Buffer.from(derivedKey))
        }
      )
    })
  }

  // Fallback to audited @noble/hashes/argon2 for Node environments without native crypto.argon2
  const derived = argon2id(Buffer.from(password, "utf-8"), new Uint8Array(salt), {
    m: memory,
    t: passes,
    p: parallelism,
    dkLen: tagLength,
  })
  return Buffer.from(derived)
}

/**
 * Hashes a plaintext password using Argon2id and returns a standard RFC 9106 PHC string:
 * $argon2id$v=19$m=19456,t=2,p=1$<salt_b64>$<hash_b64>
 */
export async function hashPasswordArgon2id(password: string): Promise<string> {
  const salt = crypto.randomBytes(ARGON2_SALT_LENGTH)
  const tag = await computeArgon2idRaw(
    password,
    salt,
    ARGON2_MEMORY_KIB,
    ARGON2_PASSES,
    ARGON2_PARALLELISM,
    ARGON2_TAG_LENGTH
  )
  return `$argon2id$v=19$m=${ARGON2_MEMORY_KIB},t=${ARGON2_PASSES},p=${ARGON2_PARALLELISM}$${toUnpaddedBase64(salt)}$${toUnpaddedBase64(tag)}`
}

export function isLegacySha256Hash(storedHash: string | null | undefined): boolean {
  if (!storedHash) return false
  if (storedHash.startsWith("$argon2")) return false
  return /^[a-f0-9]{64}$/i.test(storedHash.trim())
}

export async function verifyArgon2idHash(password: string, phcString: string): Promise<boolean> {
  try {
    const parts = phcString.split("$")
    // ["", "argon2id", "v=19", "m=19456,t=2,p=1", "<salt>", "<tag>"]
    if (parts.length !== 6 || parts[1] !== "argon2id") return false

    const paramPairs = parts[3].split(",")
    const params: Record<string, number> = {}
    for (const pair of paramPairs) {
      const [k, v] = pair.split("=")
      params[k] = parseInt(v, 10)
    }

    const memory = params.m || ARGON2_MEMORY_KIB
    const passes = params.t || ARGON2_PASSES
    const parallelism = params.p || ARGON2_PARALLELISM

    const salt = fromUnpaddedBase64(parts[4])
    const expectedTag = fromUnpaddedBase64(parts[5])
    if (salt.length < 8 || expectedTag.length < 16) return false

    const computedTag = await computeArgon2idRaw(
      password,
      salt,
      memory,
      passes,
      parallelism,
      expectedTag.length
    )

    if (computedTag.length !== expectedTag.length) return false
    return crypto.timingSafeEqual(computedTag, expectedTag)
  } catch {
    return false
  }
}

export function verifyLegacySha256Password(password: string, storedHexHash: string): boolean {
  try {
    if (!isLegacySha256Hash(storedHexHash)) return false
    // Support both exact password and trimmed password (since legacy code called password.trim())
    const expectedBuf = Buffer.from(storedHexHash.trim().toLowerCase(), "hex")
    const exactDigest = crypto.createHash("sha256").update(password).digest()
    if (
      exactDigest.length === expectedBuf.length &&
      crypto.timingSafeEqual(exactDigest, expectedBuf)
    ) {
      return true
    }

    const trimmedDigest = crypto.createHash("sha256").update(password.trim()).digest()
    return (
      trimmedDigest.length === expectedBuf.length &&
      crypto.timingSafeEqual(trimmedDigest, expectedBuf)
    )
  } catch {
    return false
  }
}

/**
 * Verifies a password against either an Argon2id PHC hash or a legacy SHA-256 hash.
 * If legacy verification succeeds, generates a new Argon2id hash and atomically upgrades the DB row.
 */
export async function verifyAndMigrateCustomerPassword(
  customerId: string,
  password: string,
  storedHash: string | null | undefined
): Promise<{ valid: boolean; migrated: boolean }> {
  if (!storedHash || !password) {
    await verifyDummyPassword(password || "invalid")
    return { valid: false, migrated: false }
  }

  if (storedHash.startsWith("$argon2id$")) {
    const valid = await verifyArgon2idHash(password, storedHash)
    return { valid, migrated: false }
  }

  if (isLegacySha256Hash(storedHash)) {
    const legacyValid = verifyLegacySha256Password(password, storedHash)
    if (!legacyValid) {
      return { valid: false, migrated: false }
    }

    // Upgrade to Argon2id atomically (safe against concurrent logins)
    try {
      const newArgon2Hash = await hashPasswordArgon2id(password)
      await prisma.$executeRawUnsafe(
        `UPDATE "MobileCustomer"
         SET "passwordHash" = $1, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = $2 AND "passwordHash" = $3`,
        newArgon2Hash,
        customerId,
        storedHash
      )
      return { valid: true, migrated: true }
    } catch {
      // Verification succeeded even if concurrent migration update already ran
      return { valid: true, migrated: false }
    }
  }

  return { valid: false, migrated: false }
}

let cachedDummyHash: string | null = null
export async function verifyDummyPassword(password: string): Promise<void> {
  try {
    if (!cachedDummyHash) {
      cachedDummyHash = await hashPasswordArgon2id("dummy_timing_defense_password_2026!")
    }
    await verifyArgon2idHash(password, cachedDummyHash)
  } catch {}
}

// ============================================================================
// 5. CRYPTOGRAPHICALLY SECURE OTP GENERATION, HASHING & VERIFICATION
// ============================================================================

export function generateSixDigitOtp(): string {
  return crypto.randomInt(100000, 1000000).toString()
}

export function hashOtpValue(
  identifier: string,
  purpose: "REGISTER" | "PASSWORD_RESET",
  otpCode: string,
  saltHex?: string
): string {
  const salt = saltHex || crypto.randomBytes(16).toString("hex")
  const secret = getSigningSecret()
  const digest = crypto
    .createHmac("sha256", secret)
    .update(`${salt}:${identifier.toLowerCase()}:${purpose}:${otpCode}`)
    .digest("hex")
  return `${salt}:${digest}`
}

export function verifyOtpHashConstantTime(
  identifier: string,
  purpose: "REGISTER" | "PASSWORD_RESET",
  otpCode: string,
  storedOtpHash: string
): boolean {
  try {
    const [salt, expectedHex] = (storedOtpHash || "").split(":")
    if (!salt || !expectedHex) return false
    const computed = hashOtpValue(identifier, purpose, otpCode, salt)
    const computedHex = computed.split(":")[1]
    if (!computedHex || computedHex.length !== expectedHex.length) return false
    return crypto.timingSafeEqual(
      Buffer.from(computedHex, "hex"),
      Buffer.from(expectedHex, "hex")
    )
  } catch {
    return false
  }
}

export async function issueOtpRecord(params: {
  identifier: string
  purpose: "REGISTER" | "PASSWORD_RESET"
  payload?: Record<string, any>
  ipAddress?: string
}): Promise<{
  allowed: boolean
  retryAfterSeconds?: number
  otpCode?: string
  otpRecordId?: string
}> {
  await ensureMobileAuthSchema()
  const normId = params.identifier.trim().toLowerCase()

  // Check resend cooldown (30s)
  const recentRows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT "id", "createdAt"
     FROM "MobileOtpRecord"
     WHERE "identifier" = $1 AND "purpose" = $2
       AND "createdAt" > $3
     ORDER BY "createdAt" DESC
     LIMIT 1`,
    normId,
    params.purpose,
    new Date(Date.now() - OTP_RESEND_COOLDOWN_MS)
  )

  if (recentRows.length > 0) {
    const elapsedMs = Date.now() - new Date(recentRows[0].createdAt).getTime()
    const retryAfterSeconds = Math.max(1, Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsedMs) / 1000))
    return { allowed: false, retryAfterSeconds }
  }

  // Invalidate any previous active OTPs for this identifier + purpose
  await prisma.$executeRawUnsafe(
    `UPDATE "MobileOtpRecord"
     SET "invalidatedAt" = CURRENT_TIMESTAMP
     WHERE "identifier" = $1 AND "purpose" = $2
       AND "consumedAt" IS NULL AND "invalidatedAt" IS NULL`,
    normId,
    params.purpose
  )

  const otpCode = generateSixDigitOtp()
  const otpHash = hashOtpValue(normId, params.purpose, otpCode)
  const recordId = `otp_${crypto.randomBytes(12).toString("hex")}`
  const expiresAt = new Date(Date.now() + OTP_TTL_MS)
  const payloadJson = params.payload ? JSON.stringify(params.payload) : null

  await prisma.$executeRawUnsafe(
    `INSERT INTO "MobileOtpRecord" (
      "id", "identifier", "purpose", "otpHash", "payloadJson", "attempts", "maxAttempts", "expiresAt", "ipAddress", "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8, CURRENT_TIMESTAMP)`,
    recordId,
    normId,
    params.purpose,
    otpHash,
    payloadJson,
    OTP_MAX_ATTEMPTS,
    expiresAt,
    params.ipAddress || null
  )

  return { allowed: true, otpCode, otpRecordId: recordId }
}

export async function consumeOtpRecord(params: {
  identifier: string
  purpose: "REGISTER" | "PASSWORD_RESET"
  submittedOtp: string
}): Promise<{
  valid: boolean
  error?: string
  payload?: Record<string, any> | null
}> {
  await ensureMobileAuthSchema()
  const normId = params.identifier.trim().toLowerCase()
  const code = (params.submittedOtp || "").trim()

  if (!/^\d{6}$/.test(code)) {
    return { valid: false, error: "Please enter a valid 6-digit verification code." }
  }

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT "id", "otpHash", "payloadJson", "attempts", "maxAttempts", "expiresAt", "consumedAt", "invalidatedAt"
     FROM "MobileOtpRecord"
     WHERE "identifier" = $1 AND "purpose" = $2
     ORDER BY "createdAt" DESC
     LIMIT 1`,
    normId,
    params.purpose
  )

  if (rows.length === 0) {
    return { valid: false, error: "Invalid or expired verification code." }
  }

  const record = rows[0]

  if (record.consumedAt) {
    return { valid: false, error: "This verification code has already been used. Please request a new code." }
  }

  if (record.invalidatedAt) {
    return { valid: false, error: "This verification code is no longer valid. Please request a new code." }
  }

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    await prisma.$executeRawUnsafe(
      `UPDATE "MobileOtpRecord" SET "invalidatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1`,
      record.id
    )
    return { valid: false, error: "Verification code has expired. Please request a new code." }
  }

  if (record.attempts >= record.maxAttempts) {
    await prisma.$executeRawUnsafe(
      `UPDATE "MobileOtpRecord" SET "invalidatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1`,
      record.id
    )
    return {
      valid: false,
      error: "Too many failed verification attempts. Please request a new code.",
    }
  }

  const isMatch = verifyOtpHashConstantTime(normId, params.purpose, code, record.otpHash)
  if (!isMatch) {
    const newAttempts = (record.attempts || 0) + 1
    const shouldInvalidate = newAttempts >= record.maxAttempts
    await prisma.$executeRawUnsafe(
      `UPDATE "MobileOtpRecord"
       SET "attempts" = $1,
           "invalidatedAt" = CASE WHEN $2 THEN CURRENT_TIMESTAMP ELSE "invalidatedAt" END
       WHERE "id" = $3`,
      newAttempts,
      shouldInvalidate,
      record.id
    )
    const remaining = Math.max(0, record.maxAttempts - newAttempts)
    return {
      valid: false,
      error:
        remaining > 0
          ? `Incorrect verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
          : "Too many incorrect attempts. This code has been invalidated.",
    }
  }

  // Atomically mark OTP consumed to prevent race-condition replay
  const updatedCount = await prisma.$executeRawUnsafe(
    `UPDATE "MobileOtpRecord"
     SET "consumedAt" = CURRENT_TIMESTAMP
     WHERE "id" = $1 AND "consumedAt" IS NULL AND "invalidatedAt" IS NULL`,
    record.id
  )

  if (!updatedCount) {
    return { valid: false, error: "Verification code was already consumed." }
  }

  let parsedPayload: Record<string, any> | null = null
  if (record.payloadJson) {
    try {
      parsedPayload = JSON.parse(record.payloadJson)
    } catch {}
  }

  return { valid: true, payload: parsedPayload }
}

// ============================================================================
// 6. JWT ACCESS TOKENS & ROTATING REFRESH TOKEN SESSIONS
// ============================================================================

export interface AccessTokenPayload {
  sub: string
  sid: string
  name: string
  phone: string
  email?: string | null
  iat: number
  exp: number
  type: "access"
}

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url")
}

function base64UrlDecode(input: string): Buffer {
  return Buffer.from(input, "base64url")
}

export function signAccessToken(customer: {
  id: string
  name: string
  phone: string
  email?: string | null
  sessionId: string
}): { accessToken: string; expiresAt: number } {
  const nowSec = Math.floor(Date.now() / 1000)
  const expSec = nowSec + ACCESS_TOKEN_TTL_SECONDS

  const header = { alg: "HS256", typ: "JWT" }
  const payload: AccessTokenPayload = {
    sub: customer.id,
    sid: customer.sessionId,
    name: customer.name,
    phone: customer.phone,
    email: customer.email || null,
    iat: nowSec,
    exp: expSec,
    type: "access",
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signingInput = `${encodedHeader}.${encodedPayload}`
  const signature = crypto
    .createHmac("sha256", getSigningSecret())
    .update(signingInput)
    .digest("base64url")

  return {
    accessToken: `${signingInput}.${signature}`,
    expiresAt: expSec * 1000,
  }
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const parts = (token || "").split(".")
    if (parts.length !== 3) return null
    const [encodedHeader, encodedPayload, signature] = parts
    const signingInput = `${encodedHeader}.${encodedPayload}`
    const expectedSig = crypto
      .createHmac("sha256", getSigningSecret())
      .update(signingInput)
      .digest()
    const actualSig = base64UrlDecode(signature)

    if (expectedSig.length !== actualSig.length) return null
    if (!crypto.timingSafeEqual(expectedSig, actualSig)) return null

    const payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf-8")) as AccessTokenPayload
    if (payload.type !== "access" || !payload.sub || !payload.sid) return null
    if (payload.exp * 1000 < Date.now()) return null

    return payload
  } catch {
    return null
  }
}

export function generateRefreshToken(): string {
  return `rt_${crypto.randomBytes(32).toString("base64url")}`
}

export function hashRefreshToken(rawToken: string): string {
  return crypto
    .createHmac("sha256", getSigningSecret())
    .update(`refresh:${rawToken}`)
    .digest("hex")
}

export async function createCustomerSession(params: {
  customer: {
    id: string
    name: string
    phone: string
    email?: string | null
    address?: string | null
  }
  deviceInfo?: string
  ipAddress?: string
}) {
  await ensureMobileAuthSchema()
  const sessionId = `sess_${crypto.randomBytes(12).toString("hex")}`
  const familyId = `fam_${crypto.randomBytes(10).toString("hex")}`
  const refreshToken = generateRefreshToken()
  const refreshTokenHash = hashRefreshToken(refreshToken)
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS)

  await prisma.$executeRawUnsafe(
    `INSERT INTO "MobileCustomerSession" (
      "id", "customerId", "refreshTokenHash", "familyId", "deviceInfo", "ipAddress", "expiresAt", "lastUsedAt", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    sessionId,
    params.customer.id,
    refreshTokenHash,
    familyId,
    params.deviceInfo || null,
    params.ipAddress || null,
    refreshExpiresAt
  )

  const { accessToken, expiresAt } = signAccessToken({
    id: params.customer.id,
    name: params.customer.name,
    phone: params.customer.phone,
    email: params.customer.email,
    sessionId,
  })

  return {
    sessionId,
    accessToken,
    accessTokenExpiresAt: expiresAt,
    refreshToken,
    refreshTokenExpiresAt: refreshExpiresAt.getTime(),
  }
}

export async function rotateRefreshTokenSession(params: {
  refreshToken: string
  ipAddress?: string
  deviceInfo?: string
}): Promise<{
  ok: boolean
  error?: string
  reuseDetected?: boolean
  session?: {
    accessToken: string
    accessTokenExpiresAt: number
    refreshToken: string
    refreshTokenExpiresAt: number
    user: {
      id: string
      name: string
      phone: string
      email: string | null
      address: string
    }
  }
}> {
  await ensureMobileAuthSchema()
  const rawToken = (params.refreshToken || "").trim()
  if (!rawToken.startsWith("rt_")) {
    return { ok: false, error: "Invalid refresh token format." }
  }

  const tokenHash = hashRefreshToken(rawToken)

  const sessions = await prisma.$queryRawUnsafe<any[]>(
    `SELECT s."id", s."customerId", s."refreshTokenHash", s."previousTokenHash", s."familyId",
            s."expiresAt", s."revokedAt",
            c."name", c."phone", c."email", c."address"
     FROM "MobileCustomerSession" s
     INNER JOIN "MobileCustomer" c ON c."id" = s."customerId"
     WHERE s."refreshTokenHash" = $1 OR s."previousTokenHash" = $1
     LIMIT 1`,
    tokenHash
  )

  if (sessions.length === 0) {
    return { ok: false, error: "Session not found or expired." }
  }

  const session = sessions[0]

  // REUSE DETECTION: If caller presents a previously rotated token, revoke the entire session family!
  if (session.previousTokenHash === tokenHash) {
    await prisma.$executeRawUnsafe(
      `UPDATE "MobileCustomerSession"
       SET "revokedAt" = CURRENT_TIMESTAMP,
           "revokedReason" = 'REFRESH_TOKEN_REUSE_DETECTED',
           "updatedAt" = CURRENT_TIMESTAMP
       WHERE "familyId" = $1 AND "revokedAt" IS NULL`,
      session.familyId
    )
    return {
      ok: false,
      reuseDetected: true,
      error: "Security alert: Refresh token reuse detected. Session has been revoked.",
    }
  }

  if (session.revokedAt) {
    return { ok: false, error: "Session has been revoked. Please sign in again." }
  }

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await prisma.$executeRawUnsafe(
      `UPDATE "MobileCustomerSession"
       SET "revokedAt" = CURRENT_TIMESTAMP, "revokedReason" = 'EXPIRED', "updatedAt" = CURRENT_TIMESTAMP
       WHERE "id" = $1`,
      session.id
    )
    return { ok: false, error: "Session expired. Please sign in again." }
  }

  const newRefreshToken = generateRefreshToken()
  const newRefreshTokenHash = hashRefreshToken(newRefreshToken)
  const newRefreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS)

  const updatedRows = await prisma.$executeRawUnsafe(
    `UPDATE "MobileCustomerSession"
     SET "previousTokenHash" = "refreshTokenHash",
         "refreshTokenHash" = $1,
         "expiresAt" = $2,
         "lastUsedAt" = CURRENT_TIMESTAMP,
         "ipAddress" = COALESCE($3, "ipAddress"),
         "deviceInfo" = COALESCE($4, "deviceInfo"),
         "updatedAt" = CURRENT_TIMESTAMP
     WHERE "id" = $5 AND "refreshTokenHash" = $6 AND "revokedAt" IS NULL`,
    newRefreshTokenHash,
    newRefreshExpiresAt,
    params.ipAddress || null,
    params.deviceInfo || null,
    session.id,
    tokenHash
  )

  if (!updatedRows) {
    return { ok: false, error: "Concurrent refresh conflict. Please retry." }
  }

  const { accessToken, expiresAt } = signAccessToken({
    id: session.customerId,
    name: session.name,
    phone: session.phone,
    email: session.email,
    sessionId: session.id,
  })

  return {
    ok: true,
    session: {
      accessToken,
      accessTokenExpiresAt: expiresAt,
      refreshToken: newRefreshToken,
      refreshTokenExpiresAt: newRefreshExpiresAt.getTime(),
      user: {
        id: session.customerId,
        name: session.name,
        phone: session.phone,
        email: session.email || null,
        address: session.address || "Mowe, Assurance CDA Estate",
      },
    },
  }
}

export async function revokeCustomerSessionByRefreshToken(refreshToken: string): Promise<boolean> {
  await ensureMobileAuthSchema()
  const tokenHash = hashRefreshToken((refreshToken || "").trim())
  const count = await prisma.$executeRawUnsafe(
    `UPDATE "MobileCustomerSession"
     SET "revokedAt" = CURRENT_TIMESTAMP, "revokedReason" = 'USER_LOGOUT', "updatedAt" = CURRENT_TIMESTAMP
     WHERE ("refreshTokenHash" = $1 OR "previousTokenHash" = $1) AND "revokedAt" IS NULL`,
    tokenHash
  )
  return Number(count) > 0
}

export async function revokeCustomerSessionById(sessionId: string, customerId: string): Promise<boolean> {
  await ensureMobileAuthSchema()
  const count = await prisma.$executeRawUnsafe(
    `UPDATE "MobileCustomerSession"
     SET "revokedAt" = CURRENT_TIMESTAMP, "revokedReason" = 'USER_LOGOUT', "updatedAt" = CURRENT_TIMESTAMP
     WHERE "id" = $1 AND "customerId" = $2 AND "revokedAt" IS NULL`,
    sessionId,
    customerId
  )
  return Number(count) > 0
}

export async function revokeAllCustomerSessions(customerId: string, reason = "PASSWORD_RESET"): Promise<void> {
  await ensureMobileAuthSchema()
  await prisma.$executeRawUnsafe(
    `UPDATE "MobileCustomerSession"
     SET "revokedAt" = CURRENT_TIMESTAMP, "revokedReason" = $1, "updatedAt" = CURRENT_TIMESTAMP
     WHERE "customerId" = $2 AND "revokedAt" IS NULL`,
    reason,
    customerId
  )
}

export async function getAuthenticatedCustomerFromRequest(req: Request): Promise<{
  customer: {
    id: string
    name: string
    phone: string
    email: string | null
    address: string
    emailVerifiedAt: Date | null
  }
  sessionId: string
} | null> {
  const authHeader = req.headers.get("authorization") || ""
  if (!authHeader.startsWith("Bearer ")) return null
  const token = authHeader.slice(7).trim()
  const payload = verifyAccessToken(token)
  if (!payload) return null

  await ensureMobileAuthSchema()
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT c."id", c."name", c."phone", c."email", c."address", c."emailVerifiedAt",
            s."id" AS "sessionId", s."revokedAt", s."expiresAt"
     FROM "MobileCustomerSession" s
     INNER JOIN "MobileCustomer" c ON c."id" = s."customerId"
     WHERE s."id" = $1 AND c."id" = $2
     LIMIT 1`,
    payload.sid,
    payload.sub
  )

  if (rows.length === 0) return null
  const row = rows[0]
  if (row.revokedAt || new Date(row.expiresAt).getTime() < Date.now()) {
    return null
  }

  return {
    sessionId: row.sessionId,
    customer: {
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email || null,
      address: row.address || "Mowe, Assurance CDA Estate",
      emailVerifiedAt: row.emailVerifiedAt ? new Date(row.emailVerifiedAt) : null,
    },
  }
}

// ============================================================================
// 7. RATE LIMITING & BRUTE-FORCE PROTECTION
// ============================================================================

const memoryRateLimits = new Map<string, { count: number; windowStart: number; blockedUntil: number }>()

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  return req.headers.get("x-real-ip") || "127.0.0.1"
}

export async function enforceRateLimit(params: {
  key: string
  maxAttempts: number
  windowMs: number
  blockDurationMs: number
}): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const now = Date.now()
  const mem = memoryRateLimits.get(params.key)

  if (mem && mem.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((mem.blockedUntil - now) / 1000)),
    }
  }

  let currentCount = 1
  let windowStart = now
  let blockedUntil = 0

  if (mem && now - mem.windowStart < params.windowMs) {
    currentCount = mem.count + 1
    windowStart = mem.windowStart
    if (currentCount > params.maxAttempts) {
      blockedUntil = now + params.blockDurationMs
    }
  }

  memoryRateLimits.set(params.key, { count: currentCount, windowStart, blockedUntil })

  if (blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((blockedUntil - now) / 1000)),
    }
  }

  // Persist in DB for multi-instance serverless consistency
  try {
    await ensureMobileAuthSchema()
    const dbRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT "count", "windowStart", "blockedUntil" FROM "MobileAuthRateLimit" WHERE "key" = $1 LIMIT 1`,
      params.key
    )
    if (dbRows.length > 0) {
      const row = dbRows[0]
      if (row.blockedUntil && new Date(row.blockedUntil).getTime() > now) {
        const waitSec = Math.max(
          1,
          Math.ceil((new Date(row.blockedUntil).getTime() - now) / 1000)
        )
        return { allowed: false, retryAfterSeconds: waitSec }
      }

      const dbWindowStart = new Date(row.windowStart).getTime()
      if (now - dbWindowStart < params.windowMs) {
        const nextCount = Number(row.count) + 1
        const nextBlocked =
          nextCount > params.maxAttempts ? new Date(now + params.blockDurationMs) : null
        await prisma.$executeRawUnsafe(
          `UPDATE "MobileAuthRateLimit"
           SET "count" = $1, "blockedUntil" = $2, "updatedAt" = CURRENT_TIMESTAMP
           WHERE "key" = $3`,
          nextCount,
          nextBlocked,
          params.key
        )
        if (nextBlocked) {
          return {
            allowed: false,
            retryAfterSeconds: Math.ceil(params.blockDurationMs / 1000),
          }
        }
      } else {
        await prisma.$executeRawUnsafe(
          `UPDATE "MobileAuthRateLimit"
           SET "count" = 1, "windowStart" = CURRENT_TIMESTAMP, "blockedUntil" = NULL, "updatedAt" = CURRENT_TIMESTAMP
           WHERE "key" = $1`,
          params.key
        )
      }
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "MobileAuthRateLimit" ("key", "count", "windowStart", "updatedAt")
         VALUES ($1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT ("key") DO NOTHING`,
        params.key
      )
    }
  } catch {
    // In-memory rate limit still enforced if DB query times out
  }

  return { allowed: true }
}

export { LOGIN_MAX_FAILED_ATTEMPTS, LOGIN_LOCKOUT_MS }

// ============================================================================
// 8. GOOGLE ID TOKEN CRYPTOGRAPHIC VERIFICATION (JWKS RS256)
// ============================================================================

interface GoogleJwk {
  kid: string
  kty: string
  alg: string
  use: string
  n: string
  e: string
}

let cachedGoogleJwks: { keys: GoogleJwk[]; expiresAt: number } | null = null

async function getGooglePublicJwks(): Promise<GoogleJwk[]> {
  if (cachedGoogleJwks && cachedGoogleJwks.expiresAt > Date.now()) {
    return cachedGoogleJwks.keys
  }
  const res = await fetch("https://www.googleapis.com/oauth2/v3/certs")
  if (!res.ok) {
    throw new Error("Unable to fetch Google public certificates.")
  }
  const data = await res.json()
  const keys = Array.isArray(data.keys) ? (data.keys as GoogleJwk[]) : []
  cachedGoogleJwks = {
    keys,
    expiresAt: Date.now() + 60 * 60 * 1000, // Cache for 1 hour
  }
  return keys
}

export interface VerifiedGoogleIdentity {
  sub: string
  email: string
  emailVerified: boolean
  name: string
  picture?: string
}

export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleIdentity> {
  if (!idToken || typeof idToken !== "string") {
    throw new Error("Google ID token is required.")
  }

  const parts = idToken.split(".")
  if (parts.length !== 3) {
    throw new Error("Malformed Google ID token.")
  }

  const [headerB64, payloadB64, signatureB64] = parts
  const header = JSON.parse(Buffer.from(headerB64, "base64url").toString("utf-8"))
  const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"))
  const signature = Buffer.from(signatureB64, "base64url")

  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("Unsupported Google ID token signature algorithm.")
  }

  const keys = await getGooglePublicJwks()
  const matchingJwk = keys.find((k) => k.kid === header.kid)
  if (!matchingJwk) {
    throw new Error("Google ID token key ID not found in Google certs.")
  }

  const publicKey = crypto.createPublicKey({
    key: matchingJwk as any,
    format: "jwk",
  })

  const isSignatureValid = crypto.verify(
    "RSA-SHA256",
    Buffer.from(`${headerB64}.${payloadB64}`, "utf-8"),
    publicKey,
    signature
  )

  if (!isSignatureValid) {
    throw new Error("Invalid Google ID token cryptographic signature.")
  }

  // Verify issuer
  if (
    payload.iss !== "https://accounts.google.com" &&
    payload.iss !== "accounts.google.com"
  ) {
    throw new Error("Invalid Google ID token issuer.")
  }

  // Verify expiration
  const nowSec = Math.floor(Date.now() / 1000)
  if (!payload.exp || Number(payload.exp) <= nowSec) {
    throw new Error("Google ID token has expired.")
  }

  // Verify audience against configured Google client IDs
  const allowedClientIds = [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_WEB_CLIENT_ID,
    process.env.GOOGLE_IOS_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
  ]
    .filter(Boolean)
    .flatMap((v) => (v as string).split(",").map((s) => s.trim()))
    .filter(Boolean)

  if (allowedClientIds.length === 0) {
    throw new Error("Google OAuth Client ID (GOOGLE_CLIENT_ID) is not configured on the server.")
  }

  if (!allowedClientIds.includes(payload.aud)) {
    throw new Error("Google ID token audience does not match configured client ID.")
  }

  if (!payload.sub || !payload.email) {
    throw new Error("Google ID token is missing subject or email claims.")
  }

  const emailVerified =
    payload.email_verified === true || payload.email_verified === "true"
  if (!emailVerified) {
    throw new Error("Google account email address is not verified.")
  }

  return {
    sub: String(payload.sub),
    email: normalizeEmail(String(payload.email)),
    emailVerified: true,
    name: String(payload.name || payload.email.split("@")[0]).trim(),
    picture: payload.picture ? String(payload.picture) : undefined,
  }
}

