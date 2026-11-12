import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import {
  SECURITY_CORS_HEADERS,
  ensureMobileAuthSchema,
  normalizeEmail,
  isValidEmail,
  normalizePhoneNG,
  getPhoneLookupVariants,
  validatePasswordStrength,
  hashPasswordArgon2id,
  consumeOtpRecord,
  createCustomerSession,
  enforceRateLimit,
  getClientIp,
} from "@/lib/mobile-auth"

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: SECURITY_CORS_HEADERS })
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)
    const ipLimit = await enforceRateLimit({
      key: `otp_verify:ip:${ip}`,
      maxAttempts: 15,
      windowMs: 10 * 60 * 1000,
      blockDurationMs: 15 * 60 * 1000,
    })

    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many verification attempts. Please wait ${ipLimit.retryAfterSeconds} seconds.`,
        },
        { status: 429, headers: SECURITY_CORS_HEADERS }
      )
    }

    const body = await req.json().catch(() => ({}))
    const email = normalizeEmail(typeof body.email === "string" ? body.email : "")
    const submittedOtp = typeof body.otp === "string" ? body.otp.trim() : String(body.otp || "").trim()
    const deviceInfo = typeof body.deviceInfo === "string" ? body.deviceInfo.slice(0, 200) : undefined

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "A valid email address is required for verification." },
        { status: 400, headers: SECURITY_CORS_HEADERS }
      )
    }

    const otpResult = await consumeOtpRecord({
      identifier: email,
      purpose: "REGISTER",
      submittedOtp,
    })

    if (!otpResult.valid) {
      return NextResponse.json(
        { success: false, error: otpResult.error || "Invalid or expired verification code." },
        { status: 400, headers: SECURITY_CORS_HEADERS }
      )
    }

    const storedPayload = otpResult.payload || {}
    const finalName = String(storedPayload.name || body.name || "").trim()
    const finalPhone = normalizePhoneNG(String(storedPayload.phone || body.phone || ""))
    const finalAddress =
      String(storedPayload.address || body.address || "Mowe, Assurance CDA Estate").trim() ||
      "Mowe, Assurance CDA Estate"

    let finalPasswordHash =
      typeof storedPayload.passwordHash === "string" ? storedPayload.passwordHash : ""

    if (!finalPasswordHash) {
      const rawPassword = typeof body.password === "string" ? body.password : ""
      const pwCheck = validatePasswordStrength(rawPassword)
      if (!pwCheck.valid) {
        return NextResponse.json(
          { success: false, error: pwCheck.error },
          { status: 400, headers: SECURITY_CORS_HEADERS }
        )
      }
      finalPasswordHash = await hashPasswordArgon2id(rawPassword)
    }

    if (!finalName || !finalPhone) {
      return NextResponse.json(
        { success: false, error: "Registration details are incomplete. Please register again." },
        { status: 400, headers: SECURITY_CORS_HEADERS }
      )
    }

    await ensureMobileAuthSchema()

    const phoneVariants = getPhoneLookupVariants(finalPhone)
    const existingRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT "id", "email", "phone", "emailVerifiedAt"
       FROM "MobileCustomer"
       WHERE LOWER("email") = $1 OR "phone" = ANY($2::text[])
       LIMIT 1`,
      email,
      phoneVariants
    )

    let customerId: string

    if (existingRows.length > 0) {
      const existing = existingRows[0]
      if (existing.emailVerifiedAt) {
        return NextResponse.json(
          {
            success: false,
            error: "An account with this email or phone number is already verified. Please sign in.",
          },
          { status: 409, headers: SECURITY_CORS_HEADERS }
        )
      }
      // Upgrade pre-existing unverified record while preserving its customer ID
      customerId = existing.id
      await prisma.$executeRawUnsafe(
        `UPDATE "MobileCustomer"
         SET "name" = $1,
             "email" = $2,
             "phone" = $3,
             "address" = $4,
             "passwordHash" = $5,
             "emailVerifiedAt" = CURRENT_TIMESTAMP,
             "failedLoginAttempts" = 0,
             "lockedUntil" = NULL,
             "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = $6`,
        finalName,
        email,
        finalPhone,
        finalAddress,
        finalPasswordHash,
        customerId
      )
    } else {
      customerId = `cust_${crypto.randomBytes(8).toString("hex")}`
      await prisma.$executeRawUnsafe(
        `INSERT INTO "MobileCustomer" (
          "id", "name", "phone", "email", "address", "passwordHash", "emailVerifiedAt", "failedLoginAttempts", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        customerId,
        finalName,
        finalPhone,
        email,
        finalAddress,
        finalPasswordHash
      )
    }

    const userProfile = {
      id: customerId,
      name: finalName,
      phone: finalPhone,
      email,
      address: finalAddress,
    }

    const session = await createCustomerSession({
      customer: userProfile,
      deviceInfo,
      ipAddress: ip,
    })

    return NextResponse.json(
      {
        success: true,
        message: "Email verified and account created successfully!",
        user: userProfile,
        accessToken: session.accessToken,
        accessTokenExpiresAt: session.accessTokenExpiresAt,
        refreshToken: session.refreshToken,
        refreshTokenExpiresAt: session.refreshTokenExpiresAt,
      },
      { headers: SECURITY_CORS_HEADERS }
    )
  } catch (error) {
    console.error("Verify OTP error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json(
      { success: false, error: "Verification failed. Please try again." },
      { status: 500, headers: SECURITY_CORS_HEADERS }
    )
  }
}
