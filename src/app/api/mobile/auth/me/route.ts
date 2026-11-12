import { NextResponse } from "next/server"
import {
  SECURITY_CORS_HEADERS,
  getAuthenticatedCustomerFromRequest,
} from "@/lib/mobile-auth"

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: SECURITY_CORS_HEADERS })
}

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedCustomerFromRequest(req)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized or session expired." },
        { status: 401, headers: SECURITY_CORS_HEADERS }
      )
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: auth.customer.id,
          name: auth.customer.name,
          phone: auth.customer.phone,
          email: auth.customer.email,
          address: auth.customer.address,
        },
      },
      { headers: SECURITY_CORS_HEADERS }
    )
  } catch (error) {
    console.error("Profile fetch error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json(
      { success: false, error: "Could not fetch customer profile." },
      { status: 500, headers: SECURITY_CORS_HEADERS }
    )
  }
}

