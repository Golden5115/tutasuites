import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendResendEmail, buildLuxuryOtpEmailHtml } from "@/lib/email"
import {
  SECURITY_CORS_HEADERS,
  ensureMobileAuthSchema,
  normalizeEmail,
  isValidEmail,
  normalizePhoneNG,
  isValidPhoneNG,
  getPhoneLookupVariants,
  validatePasswordStrength,
  hashPasswordArgon2id,
  issueOtpRecord,
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
      key: `otp_send:ip:${ip}`,
      maxAttempts: 10,
      windowMs: 10 * 60 * 1000,
      blockDurationMs: 15 * 60 * 1000,
    })

    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many verification requests. Please wait ${ipLimit.retryAfterSeconds} seconds.`,
          retryAfterSeconds: ipLimit.retryAfterSeconds,
        },
        { status: 429, headers: SECURITY_CORS_HEADERS }
      )
    }

    const body = await req.json().catch(() => ({}))
    const rawName = typeof body.name === "string" ? body.name.trim() : ""
    const rawEmail = typeof body.email === "string" ? body.email : ""
    const rawPhone = typeof body.phone === "string" ? body.phone : ""
    const rawAddress = typeof body.address === "string" ? body.address.trim() : ""
    const rawPassword = typeof body.password === "string" ? body.password : ""

    if (!rawName || rawName.length < 2 || rawName.length > 100) {
      return NextResponse.json(
        { success: false, error: "Please enter your full name (2–100 characters)." },
        { status: 400, headers: SECURITY_CORS_HEADERS }
      )
    }

    const email = normalizeEmail(rawEmail)
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address to receive your verification code." },
        { status: 400, headers: SECURITY_CORS_HEADERS }
      )
    }

    const phone = normalizePhoneNG(rawPhone)
    if (!isValidPhoneNG(phone)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid Nigerian phone number (e.g. 08012345678)." },
        { status: 400, headers: SECURITY_CORS_HEADERS }
      )
    }

    const pwCheck = validatePasswordStrength(rawPassword)
    if (!pwCheck.valid) {
      return NextResponse.json(
        { success: false, error: pwCheck.error },
        { status: 400, headers: SECURITY_CORS_HEADERS }
      )
    }

    const emailLimit = await enforceRateLimit({
      key: `otp_send:email:${email}`,
      maxAttempts: 5,
      windowMs: 10 * 60 * 1000,
      blockDurationMs: 15 * 60 * 1000,
    })

    if (!emailLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Please wait ${emailLimit.retryAfterSeconds} seconds before requesting another code.`,
          retryAfterSeconds: emailLimit.retryAfterSeconds,
        },
        { status: 429, headers: SECURITY_CORS_HEADERS }
      )
    }

    await ensureMobileAuthSchema()

    // Only block if a different verified email already owns this phone number
    const phoneVariants = getPhoneLookupVariants(phone)
    const conflictingPhone = await prisma.$queryRawUnsafe<any[]>(
      `SELECT "id", "email", "phone", "emailVerifiedAt"
       FROM "MobileCustomer"
       WHERE "phone" = ANY($1::text[])
         AND LOWER(COALESCE("email", '')) <> $2
         AND "emailVerifiedAt" IS NOT NULL
       LIMIT 1`,
      phoneVariants,
      email
    )

    if (conflictingPhone.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "This phone number is already linked to another verified account.",
        },
        { status: 409, headers: SECURITY_CORS_HEADERS }
      )
    }

    // Pre-hash password with Argon2id so plaintext password is never persisted
    const passwordHash = await hashPasswordArgon2id(rawPassword)

    const otpIssued = await issueOtpRecord({
      identifier: email,
      purpose: "REGISTER",
      ipAddress: ip,
      payload: {
        name: rawName,
        email,
        phone,
        address: rawAddress || "Mowe, Assurance CDA Estate",
        passwordHash,
      },
    })

    if (!otpIssued.allowed || !otpIssued.otpCode) {
      return NextResponse.json(
        {
          success: false,
          error: `Please wait ${otpIssued.retryAfterSeconds} seconds before requesting a new code.`,
          retryAfterSeconds: otpIssued.retryAfterSeconds,
        },
        { status: 429, headers: SECURITY_CORS_HEADERS }
      )
    }

    const html = buildLuxuryOtpEmailHtml({
      name: rawName,
      code: otpIssued.otpCode,
      purpose: "REGISTER",
    })

    const emailResult = await sendResendEmail(
      email,
      "Your Tuta Grab & Go Verification Code",
      html
    )

    if (!emailResult.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to send verification email at this moment. Please check your email address and try again.",
        },
        { status: 502, headers: SECURITY_CORS_HEADERS }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: `A 6-digit verification code has been sent to ${email}.`,
        expiresInSeconds: 600,
        resendCooldownSeconds: 30,
      },
      { headers: SECURITY_CORS_HEADERS }
    )
  } catch (error) {
    console.error("Send OTP error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json(
      { success: false, error: "Unable to process registration request. Please try again." },
      { status: 500, headers: SECURITY_CORS_HEADERS }
    )
  }
}
