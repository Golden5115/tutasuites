import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  SECURITY_CORS_HEADERS,
  ensureMobileAuthSchema,
  normalizeEmail,
  getPhoneLookupVariants,
  verifyAndMigrateCustomerPassword,
  verifyDummyPassword,
  createCustomerSession,
  enforceRateLimit,
  getClientIp,
  LOGIN_MAX_FAILED_ATTEMPTS,
  LOGIN_LOCKOUT_MS,
} from "@/lib/mobile-auth"

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: SECURITY_CORS_HEADERS,
  })
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)
    const ipLimit = await enforceRateLimit({
      key: `login:ip:${ip}`,
      maxAttempts: 15,
      windowMs: 10 * 60 * 1000,
      blockDurationMs: 15 * 60 * 1000,
    })

    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many sign-in attempts. Please wait ${ipLimit.retryAfterSeconds} seconds.`,
          retryAfterSeconds: ipLimit.retryAfterSeconds,
        },
        { status: 429, headers: SECURITY_CORS_HEADERS }
      )
    }

    const body = await req.json().catch(() => ({}))
    const rawIdentifier = typeof body.phoneOrEmail === "string" ? body.phoneOrEmail.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""
    const deviceInfo = typeof body.deviceInfo === "string" ? body.deviceInfo.slice(0, 200) : undefined

    if (!rawIdentifier || !password) {
      return NextResponse.json(
        { success: false, error: "Please enter both your email/phone and password." },
        { status: 400, headers: SECURITY_CORS_HEADERS }
      )
    }

    const isEmailInput = rawIdentifier.includes("@")
    const normalizedEmail = isEmailInput ? normalizeEmail(rawIdentifier) : ""
    const phoneVariants = !isEmailInput ? getPhoneLookupVariants(rawIdentifier) : []
    const rateKeyId = isEmailInput ? normalizedEmail : phoneVariants[0] || rawIdentifier

    const accountLimit = await enforceRateLimit({
      key: `login:acct:${rateKeyId}`,
      maxAttempts: 8,
      windowMs: 10 * 60 * 1000,
      blockDurationMs: 15 * 60 * 1000,
    })

    if (!accountLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed sign-in attempts for this account. Please try again in ${accountLimit.retryAfterSeconds} seconds.`,
          retryAfterSeconds: accountLimit.retryAfterSeconds,
        },
        { status: 429, headers: SECURITY_CORS_HEADERS }
      )
    }

    await ensureMobileAuthSchema()

    const customers = isEmailInput
      ? await prisma.$queryRawUnsafe<any[]>(
          `SELECT "id", "name", "phone", "email", "address", "passwordHash",
                  "emailVerifiedAt", "failedLoginAttempts", "lockedUntil"
           FROM "MobileCustomer"
           WHERE LOWER("email") = $1
           LIMIT 1`,
          normalizedEmail
        )
      : await prisma.$queryRawUnsafe<any[]>(
          `SELECT "id", "name", "phone", "email", "address", "passwordHash",
                  "emailVerifiedAt", "failedLoginAttempts", "lockedUntil"
           FROM "MobileCustomer"
           WHERE "phone" = ANY($1::text[])
           LIMIT 1`,
          phoneVariants
        )

    if (!customers || customers.length === 0) {
      // Timing-safe dummy verification to prevent account enumeration
      await verifyDummyPassword(password)
      return NextResponse.json(
        { success: false, error: "Invalid email/phone or password." },
        { status: 401, headers: SECURITY_CORS_HEADERS }
      )
    }

    const customer = customers[0]

    // Check temporary account lockout
    if (customer.lockedUntil && new Date(customer.lockedUntil).getTime() > Date.now()) {
      const waitSeconds = Math.max(
        1,
        Math.ceil((new Date(customer.lockedUntil).getTime() - Date.now()) / 1000)
      )
      return NextResponse.json(
        {
          success: false,
          error: `Account temporarily locked due to multiple failed attempts. Try again in ${waitSeconds} seconds.`,
        },
        { status: 429, headers: SECURITY_CORS_HEADERS }
      )
    }

    const { valid } = await verifyAndMigrateCustomerPassword(
      customer.id,
      password,
      customer.passwordHash
    )

    if (!valid) {
      const nextFailed = Number(customer.failedLoginAttempts || 0) + 1
      const lockUntil =
        nextFailed >= LOGIN_MAX_FAILED_ATTEMPTS
          ? new Date(Date.now() + LOGIN_LOCKOUT_MS)
          : null

      await prisma.$executeRawUnsafe(
        `UPDATE "MobileCustomer"
         SET "failedLoginAttempts" = $1, "lockedUntil" = $2, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = $3`,
        nextFailed,
        lockUntil,
        customer.id
      )

      return NextResponse.json(
        { success: false, error: "Invalid email/phone or password." },
        { status: 401, headers: SECURITY_CORS_HEADERS }
      )
    }

    // Reject unverified email accounts (legacy pre-existing accounts have emailVerifiedAt backfilled)
    if (customer.email && !customer.emailVerifiedAt) {
      return NextResponse.json(
        {
          success: false,
          code: "EMAIL_NOT_VERIFIED",
          error: "Please verify your email address before signing in.",
        },
        { status: 403, headers: SECURITY_CORS_HEADERS }
      )
    }

    // Reset failed login counter
    if (customer.failedLoginAttempts > 0 || customer.lockedUntil) {
      await prisma.$executeRawUnsafe(
        `UPDATE "MobileCustomer"
         SET "failedLoginAttempts" = 0, "lockedUntil" = NULL, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = $1`,
        customer.id
      )
    }

    const safeUser = {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || null,
      address: customer.address || "Mowe, Assurance CDA Estate",
    }

    const session = await createCustomerSession({
      customer: safeUser,
      deviceInfo,
      ipAddress: ip,
    })

    return NextResponse.json(
      {
        success: true,
        message: "Login successful!",
        user: safeUser,
        accessToken: session.accessToken,
        accessTokenExpiresAt: session.accessTokenExpiresAt,
        refreshToken: session.refreshToken,
        refreshTokenExpiresAt: session.refreshTokenExpiresAt,
      },
      { headers: SECURITY_CORS_HEADERS }
    )
  } catch (error) {
    console.error("Login error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json(
      { success: false, error: "Sign in failed. Please try again." },
      { status: 500, headers: SECURITY_CORS_HEADERS }
    )
  }
}
