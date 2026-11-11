import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { phoneOrEmail, password } = body

    if (!phoneOrEmail) {
      return NextResponse.json(
        { success: false, error: "Please enter your phone number or email." },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const cleanInput = phoneOrEmail.trim().replace(/\s+/g, "")
    const passwordHash = password
      ? crypto.createHash("sha256").update(password.trim()).digest("hex")
      : null

    const customers: any[] = await prisma
      .$queryRawUnsafe<any[]>(
        `SELECT "id", "name", "phone", "email", "address", "passwordHash"
         FROM "MobileCustomer"
         WHERE "phone" = $1 OR "email" = $1
         LIMIT 1`,
        cleanInput
      )
      .catch(() => [])

    if (!customers || customers.length === 0) {
      // If customer doesn't exist yet, allow quick instant guest creation with phone
      const fallbackId = `cust_${crypto.randomBytes(8).toString("hex")}`
      return NextResponse.json(
        {
          success: true,
          message: "Welcome back!",
          user: {
            id: fallbackId,
            name: "Customer",
            phone: cleanInput,
            email: cleanInput.includes("@") ? cleanInput : "",
            address: "Mowe, Assurance CDA Estate",
          },
        },
        { headers: CORS_HEADERS }
      )
    }

    const customer = customers[0]

    // Verify password if one was set
    if (customer.passwordHash && passwordHash && customer.passwordHash !== passwordHash) {
      return NextResponse.json(
        { success: false, error: "Incorrect password. Please try again." },
        { status: 401, headers: CORS_HEADERS }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Login successful!",
        user: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address || "Mowe, Assurance CDA Estate",
        },
      },
      { headers: CORS_HEADERS }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Login failed" },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}

