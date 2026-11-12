import { NextResponse } from "next/server"
import {
  SECURITY_CORS_HEADERS,
  rotateRefreshTokenSession,
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
      key: `refresh:ip:${ip}`,
      maxAttempts: 30,
      windowMs: 5 * 60 * 1000,
      blockDurationMs: 10 * 60 * 1000,
    })

    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many token refresh attempts. Please wait ${ipLimit.retryAfterSeconds} seconds.`,
        },
        { status: 429, headers: SECURITY_CORS_HEADERS }
      )
    }

    const body = await req.json().catch(() => ({}))
    const refreshToken = typeof body.refreshToken === "string" ? body.refreshToken.trim() : ""
    const deviceInfo = typeof body.deviceInfo === "string" ? body.deviceInfo.slice(0, 200) : undefined

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: "Refresh token is required." },
        { status: 400, headers: SECURITY_CORS_HEADERS }
      )
    }

    const result = await rotateRefreshTokenSession({
      refreshToken,
      ipAddress: ip,
      deviceInfo,
    })

    if (!result.ok || !result.session) {
      return NextResponse.json(
        {
          success: false,
          code: result.reuseDetected ? "TOKEN_REUSE_DETECTED" : "SESSION_INVALID",
          error: result.error || "Invalid or expired session.",
        },
        { status: 401, headers: SECURITY_CORS_HEADERS }
      )
    }

    return NextResponse.json(
      {
        success: true,
        user: result.session.user,
        accessToken: result.session.accessToken,
        accessTokenExpiresAt: result.session.accessTokenExpiresAt,
        refreshToken: result.session.refreshToken,
        refreshTokenExpiresAt: result.session.refreshTokenExpiresAt,
      },
      { headers: SECURITY_CORS_HEADERS }
    )
  } catch (error) {
    console.error("Refresh token error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json(
      { success: false, error: "Could not refresh session." },
      { status: 500, headers: SECURITY_CORS_HEADERS }
    )
  }
}

