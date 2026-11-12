import { NextResponse } from "next/server"
import {
  SECURITY_CORS_HEADERS,
  revokeCustomerSessionByRefreshToken,
  revokeCustomerSessionById,
  getAuthenticatedCustomerFromRequest,
} from "@/lib/mobile-auth"

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: SECURITY_CORS_HEADERS })
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const refreshToken = typeof body.refreshToken === "string" ? body.refreshToken.trim() : ""

    if (refreshToken) {
      await revokeCustomerSessionByRefreshToken(refreshToken)
    }

    const auth = await getAuthenticatedCustomerFromRequest(req)
    if (auth) {
      await revokeCustomerSessionById(auth.sessionId, auth.customer.id)
    }

    return NextResponse.json(
      { success: true, message: "Session revoked and logged out successfully." },
      { headers: SECURITY_CORS_HEADERS }
    )
  } catch (error) {
    console.error("Logout error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json(
      { success: true, message: "Logged out." },
      { headers: SECURITY_CORS_HEADERS }
    )
  }
}

