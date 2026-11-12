import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createCustomerSession,
  enforceRateLimit,
  ensureMobileAuthSchema,
  getClientIp,
  normalizePhoneNG,
  SECURITY_CORS_HEADERS,
  verifyGoogleIdToken,
} from "@/lib/mobile-auth";
import crypto from "crypto";

interface GoogleCustomerRow {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  googleSub: string | null;
  emailVerifiedAt: Date | null;
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: SECURITY_CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    await ensureMobileAuthSchema();

    const ipAddress = getClientIp(req);
    const rateLimit = await enforceRateLimit({
      key: `auth:google:${ipAddress}`,
      maxAttempts: 15,
      windowMs: 10 * 60 * 1000,
      blockDurationMs: 10 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many sign-in attempts. Please wait ${rateLimit.retryAfterSeconds} seconds.`,
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        { status: 429, headers: SECURITY_CORS_HEADERS }
      );
    }

    const body = await req.json();
    const idToken = typeof body.idToken === "string" ? body.idToken.trim() : "";
    const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
    const rawAddress = typeof body.address === "string" ? body.address.trim() : "";
    const deviceInfo =
      typeof body.deviceName === "string"
        ? body.deviceName.trim()
        : req.headers.get("user-agent") || "Tuta Grab-n-Go Mobile (Google)";

    if (!idToken) {
      return NextResponse.json(
        { error: "A verified Google ID token (idToken) is required for Google Sign-In." },
        { status: 400, headers: SECURITY_CORS_HEADERS }
      );
    }

    // Independently verify Google's signed RS256 ID token against Google JWKS certificates
    let verifiedIdentity;
    try {
      verifiedIdentity = await verifyGoogleIdToken(idToken);
    } catch (verifyErr) {
      return NextResponse.json(
        {
          error:
            verifyErr instanceof Error
              ? verifyErr.message
              : "Invalid Google ID token.",
        },
        { status: 401, headers: SECURITY_CORS_HEADERS }
      );
    }

    const { sub: googleSub, email, name } = verifiedIdentity;
    const normalizedPhone = rawPhone ? normalizePhoneNG(rawPhone) || rawPhone : "";

    // 1. Check if a customer is already linked by googleSub
    let existing = await prisma.$queryRawUnsafe<GoogleCustomerRow[]>(
      `SELECT "id", "name", "email", "phone", "address", "googleSub", "emailVerifiedAt"
       FROM "MobileCustomer"
       WHERE "googleSub" = $1
       LIMIT 1`,
      googleSub
    );

    // 2. If not linked by googleSub, check if an account exists with the same verified email
    if (existing.length === 0) {
      existing = await prisma.$queryRawUnsafe<GoogleCustomerRow[]>(
        `SELECT "id", "name", "email", "phone", "address", "googleSub", "emailVerifiedAt"
         FROM "MobileCustomer"
         WHERE LOWER("email") = $1
         LIMIT 1`,
        email
      );
    }

    let customer: GoogleCustomerRow;

    if (existing.length > 0) {
      const current = existing[0];
      // Prevent conflicting googleSub hijacking
      if (current.googleSub && current.googleSub !== googleSub) {
        return NextResponse.json(
          { error: "This email is already linked to a different Google account." },
          { status: 409, headers: SECURITY_CORS_HEADERS }
        );
      }

      // Link Google identity to existing account & preserve customer ID + order history
      const updatedRows = await prisma.$queryRawUnsafe<GoogleCustomerRow[]>(
        `UPDATE "MobileCustomer"
         SET "googleSub" = $1,
             "emailVerifiedAt" = COALESCE("emailVerifiedAt", CURRENT_TIMESTAMP),
             "name" = CASE WHEN "name" = '' THEN $2 ELSE "name" END,
             "phone" = CASE WHEN "phone" = '' AND $3 <> '' THEN $3 ELSE "phone" END,
             "address" = CASE WHEN ("address" IS NULL OR "address" = '') AND $4 <> '' THEN $4 ELSE "address" END,
             "failedLoginAttempts" = 0,
             "lockedUntil" = NULL,
             "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = $5
         RETURNING "id", "name", "email", "phone", "address", "googleSub", "emailVerifiedAt"`,
        googleSub,
        name,
        normalizedPhone,
        rawAddress,
        current.id
      );

      customer = updatedRows[0] || current;
    } else {
      // Create new customer account safely
      const newId = `cust_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
      const createdRows = await prisma.$queryRawUnsafe<GoogleCustomerRow[]>(
        `INSERT INTO "MobileCustomer" (
           "id", "name", "email", "phone", "address", "passwordHash", "googleSub",
           "emailVerifiedAt", "failedLoginAttempts", "lockedUntil", "createdAt", "updatedAt"
         )
         VALUES ($1, $2, $3, $4, $5, NULL, $6, CURRENT_TIMESTAMP, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING "id", "name", "email", "phone", "address", "googleSub", "emailVerifiedAt"`,
        newId,
        name,
        email,
        normalizedPhone,
        rawAddress || "Mowe, Assurance CDA Estate",
        googleSub
      );

      customer = createdRows[0];
    }

    const sessionTokens = await createCustomerSession({
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
      },
      deviceInfo,
      ipAddress,
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: customer.id,
          name: customer.name,
          email: customer.email || email,
          phone: customer.phone || "",
          address: customer.address || "Mowe, Assurance CDA Estate",
          emailVerified: true,
          googleLinked: true,
        },
        accessToken: sessionTokens.accessToken,
        accessTokenExpiresAt: new Date(sessionTokens.accessTokenExpiresAt).toISOString(),
        refreshToken: sessionTokens.refreshToken,
        refreshTokenExpiresAt: new Date(sessionTokens.refreshTokenExpiresAt).toISOString(),
      },
      { headers: SECURITY_CORS_HEADERS }
    );
  } catch (error) {
    console.error(
      "[GOOGLE AUTH ERROR]:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Unable to complete Google sign-in right now." },
      { status: 500, headers: SECURITY_CORS_HEADERS }
    );
  }
}
