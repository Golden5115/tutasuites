import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

async function ensureCustomerTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MobileCustomer" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "email" TEXT,
        "address" TEXT,
        "passwordHash" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "MobileCustomer_pkey" PRIMARY KEY ("id")
      );
    `)
  } catch (e) {
    console.warn("Could not ensure MobileCustomer table:", e)
  }
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
    const { name, phone, email, address, password } = body

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: "Name and phone number are required." },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    await ensureCustomerTable()

    const cleanPhone = phone.trim().replace(/\s+/g, "")
    const cleanName = name.trim()
    const cleanEmail = (email || "").trim().toLowerCase() || null
    const cleanAddress = (address || "").trim() || "Mowe, Ogun State"

    // Simple password hash
    const passwordHash = password
      ? crypto.createHash("sha256").update(password.trim()).digest("hex")
      : null

    const customerId = `cust_${crypto.randomBytes(8).toString("hex")}`

    // Check if phone already registered
    const existing = await prisma
      .$queryRawUnsafe<any[]>(
        `SELECT "id" FROM "MobileCustomer" WHERE "phone" = $1 LIMIT 1`,
        cleanPhone
      )
      .catch(() => [])

    if (existing && existing.length > 0) {
      // Update existing record
      await prisma
        .$executeRawUnsafe(
          `UPDATE "MobileCustomer" 
           SET "name" = $1, "email" = $2, "address" = $3, "updatedAt" = CURRENT_TIMESTAMP
           WHERE "phone" = $4`,
          cleanName,
          cleanEmail,
          cleanAddress,
          cleanPhone
        )
        .catch(() => null)
    } else {
      // Insert new customer
      await prisma
        .$executeRawUnsafe(
          `INSERT INTO "MobileCustomer" ("id", "name", "phone", "email", "address", "passwordHash", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          customerId,
          cleanName,
          cleanPhone,
          cleanEmail,
          cleanAddress,
          passwordHash
        )
        .catch(() => null)
    }

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful!",
        user: {
          id: customerId,
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          address: cleanAddress,
        },
      },
      { headers: CORS_HEADERS }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Registration failed" },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
