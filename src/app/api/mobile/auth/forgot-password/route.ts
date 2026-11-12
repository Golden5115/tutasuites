import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendResendEmail, buildLuxuryOtpEmailHtml } from "@/lib/email"
import {
  SECURITY_CORS_HEADERS,
  ensureMobileAuthSchema,
  normalizeEmail,
  isValidEmail,
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
      key: `forgot_pw:ip:${ip}`,
      maxAttempts: 10,
      windowMs: 10 * 60 * 1000,
      blockDurationMs: 15 * 60 * 1000,
    })

    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many password recovery requests. Please wait ${ipLimit.retryAfterSeconds} seconds.`,
          retryAfterSeconds: ipLimit.retryAfterSeconds,
        },
        { status: 429, headers: SECURITY_CORS_HEADERS }
      )
    }

    const body = await req.json().catch(() => ({}))
    const email = normalizeEmail(typeof body.email === "string" ? body.email : "")

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400, headers: SECURITY_CORS_HEADERS }
      )
    }

    const emailLimit = await enforceRateLimit({
      key: `forgot_pw:email:${email}`,
      maxAttempts: 4,
      windowMs: 10 * 60 * 1000,
      blockDurationMs: 15 * 60 * 1000,
    })

    if (!emailLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Please wait ${emailLimit.retryAfterSeconds} seconds before requesting another recovery code.`,
          retryAfterSeconds: emailLimit.retryAfterSeconds,
        },
        { status: 429, headers: SECURITY_CORS_HEADERS }
      )
    }

    await ensureMobileAuthSchema()

    const customers = await prisma.$queryRawUnsafe<any[]>(
      `SELECT "id", "name", "email"
       FROM "MobileCustomer"
       WHERE LOWER("email") = $1
       LIMIT 1`,
      email
    )

    const genericSuccessResponse = NextResponse.json(
      {
        success: true,
        message: "If an account exists with this email address, a 6-digit recovery code has been sent.",
        expiresInSeconds: 600,
        resendCooldownSeconds: 30,
      },
      { headers: SECURITY_CORS_HEADERS }
    )

    if (customers.length === 0) {
      // Constant-ish delay to prevent timing enumeration of registered emails
      await new Promise((r) => setTimeout(r, 250))
      return genericSuccessResponse
    }

    const customer = customers[0]
    const otpIssued = await issueOtpRecord({
      identifier: email,
      purpose: "PASSWORD_RESET",
      ipAddress: ip,
      payload: { customerId: customer.id },
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
      name: customer.name || "Valued Customer",
      code: otpIssued.otpCode,
      purpose: "PASSWORD_RESET",
    })

    await sendResendEmail(
      email,
      "Your Tuta Grab & Go Password Recovery Code",
      html
    )

    return genericSuccessResponse
  } catch (error) {
    console.error("Forgot password error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json(
      { success: false, error: "Could not process password recovery request." },
      { status: 500, headers: SECURITY_CORS_HEADERS }
    )
  }
}

