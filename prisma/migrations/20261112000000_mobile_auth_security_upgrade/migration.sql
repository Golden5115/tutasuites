-- Tuta Grab & Go — Non-Destructive Mobile Authentication Security Upgrade Migration
-- Preserves all existing MobileCustomer and GrabAndGoOrder rows and relationships.

-- 1. Ensure MobileCustomer table exists and add new security columns non-destructively
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

ALTER TABLE "MobileCustomer" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "MobileCustomer" ADD COLUMN IF NOT EXISTS "googleSub" TEXT;
ALTER TABLE "MobileCustomer" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "MobileCustomer" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);

-- Backfill emailVerifiedAt for pre-existing customers so legacy accounts are not locked out
UPDATE "MobileCustomer"
SET "emailVerifiedAt" = "createdAt"
WHERE "emailVerifiedAt" IS NULL;

-- Normalize empty-string emails to NULL before creating unique indexes
UPDATE "MobileCustomer"
SET "email" = NULL
WHERE "email" = '';

-- Create non-destructive indexes on MobileCustomer
CREATE INDEX IF NOT EXISTS "MobileCustomer_email_idx" ON "MobileCustomer"("email");
CREATE INDEX IF NOT EXISTS "MobileCustomer_phone_idx" ON "MobileCustomer"("phone");
CREATE INDEX IF NOT EXISTS "MobileCustomer_googleSub_idx" ON "MobileCustomer"("googleSub");
CREATE UNIQUE INDEX IF NOT EXISTS "MobileCustomer_googleSub_key" ON "MobileCustomer"("googleSub") WHERE "googleSub" IS NOT NULL;

-- 2. Add optional customerId to GrabAndGoOrder to link customer order history
ALTER TABLE "GrabAndGoOrder" ADD COLUMN IF NOT EXISTS "customerId" TEXT;
CREATE INDEX IF NOT EXISTS "GrabAndGoOrder_customerId_idx" ON "GrabAndGoOrder"("customerId");

-- 3. Create MobileCustomerSession table for rotating refresh tokens and session revocation
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

CREATE UNIQUE INDEX IF NOT EXISTS "MobileCustomerSession_refreshTokenHash_key" ON "MobileCustomerSession"("refreshTokenHash");
CREATE UNIQUE INDEX IF NOT EXISTS "MobileCustomerSession_previousTokenHash_key" ON "MobileCustomerSession"("previousTokenHash") WHERE "previousTokenHash" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "MobileCustomerSession_customerId_idx" ON "MobileCustomerSession"("customerId");
CREATE INDEX IF NOT EXISTS "MobileCustomerSession_familyId_idx" ON "MobileCustomerSession"("familyId");
CREATE INDEX IF NOT EXISTS "MobileCustomerSession_expiresAt_idx" ON "MobileCustomerSession"("expiresAt");

-- 4. Create MobileOtpRecord table for hashed OTP storage, attempt limits, and replay prevention
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

CREATE INDEX IF NOT EXISTS "MobileOtpRecord_identifier_purpose_idx" ON "MobileOtpRecord"("identifier", "purpose");
CREATE INDEX IF NOT EXISTS "MobileOtpRecord_expiresAt_idx" ON "MobileOtpRecord"("expiresAt");

-- 5. Create MobileAuthRateLimit table for per-IP and per-identifier rate limiting
CREATE TABLE IF NOT EXISTS "MobileAuthRateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MobileAuthRateLimit_pkey" PRIMARY KEY ("key")
);

