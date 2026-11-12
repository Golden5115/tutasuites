import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  consumeOtpRecord,
  enforceRateLimit,
  ensureMobileAuthSchema,
  getClientIp,
  hashPasswordArgon2id,
  normalizeEmail,
  revokeAllCustomerSessions,
  SECURITY_CORS_HEADERS,
  validatePasswordStrength,
  verifyDummyPassword,
} from "@/lib/mobile-auth";

export async function OPTIONS() {
  return NextResponse.json({}, { headers: SECURITY_CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    await ensureMobileAuthSchema();

    const body = await req.json();
    const rawEmail = typeof body.email === "string" ? body.email : "";
    const rawOtp = typeof body.otp === "string" ? body.otp.trim() : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    const email = normalizeEmail(rawEmail);
    if (!email || !rawOtp || !newPassword) {
      return NextResponse.json(
        { error: "Email, verification code, and new password are required." },
        { status: 400, headers: SECURITY_CORS_HEADERS }
      );
    }

    const passwordCheck = validatePasswordStrength(newPassword);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.error },
        { status: 400, headers: SECURITY_CORS_HEADERS }
      );
    }

    const ipAddress = getClientIp(req);
    const rateLimit = await enforceRateLimit({
      key: `auth:reset-password:${ipAddress}:${email}`,
      maxAttempts: 10,
      windowMs: 15 * 60 * 1000,
      blockDurationMs: 15 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many password reset attempts. Please wait ${rateLimit.retryAfterSeconds} seconds.`,
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        { status: 429, headers: SECURITY_CORS_HEADERS }
      );
    }

    // Verify & atomically consume the PASSWORD_RESET OTP
    const otpVerification = await consumeOtpRecord({
      identifier: email,
      purpose: "PASSWORD_RESET",
      submittedOtp: rawOtp,
    });

    if (!otpVerification.valid) {
      return NextResponse.json(
        {
          error: otpVerification.error,
        },
        { status: 400, headers: SECURITY_CORS_HEADERS }
      );
    }

    // Look up customer by normalized email
    const customers = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT "id" FROM "MobileCustomer" WHERE LOWER("email") = $1 LIMIT 1`,
      email
    );

    if (customers.length === 0) {
      await verifyDummyPassword(newPassword);
      return NextResponse.json(
        { error: "Invalid or expired reset code. Please request a new code." },
        { status: 400, headers: SECURITY_CORS_HEADERS }
      );
    }

    const customerId = customers[0].id;
    const newPasswordHash = await hashPasswordArgon2id(newPassword);

    // Update customer password to Argon2id, mark email verified, and reset lockout counters
    await prisma.$executeRawUnsafe(
      `UPDATE "MobileCustomer"
       SET "passwordHash" = $1,
           "emailVerifiedAt" = COALESCE("emailVerifiedAt", CURRENT_TIMESTAMP),
           "failedLoginAttempts" = 0,
           "lockedUntil" = NULL,
           "updatedAt" = CURRENT_TIMESTAMP
       WHERE "id" = $2`,
      newPasswordHash,
      customerId
    );

    // Revoke all active sessions across devices after password change
    await revokeAllCustomerSessions(customerId, "PASSWORD_RESET");

    return NextResponse.json(
      {
        success: true,
        message:
          "Your password has been reset successfully. You may now sign in with your new password.",
      },
      { headers: SECURITY_CORS_HEADERS }
    );
  } catch (error) {
    console.error(
      "[AUTH RESET-PASSWORD ERROR]:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Unable to reset password right now. Please try again shortly." },
      { status: 500, headers: SECURITY_CORS_HEADERS }
    );
  }
}
