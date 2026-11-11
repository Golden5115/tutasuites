import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      email,
      name = "Google User",
      googleId,
      photoUrl = "",
      phone = "08012345678",
      address = "Mowe, Assurance CDA Estate",
    } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Google account email is required." },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanName = (name || cleanEmail.split("@")[0]).trim()
    const userId = `google_${googleId || crypto.randomBytes(6).toString("hex")}`

    // Save/update in PostgreSQL MobileCustomer table with 2.5s timeout
    try {
      await Promise.race([
        (async () => {
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
          await prisma.$executeRawUnsafe(
            `INSERT INTO "MobileCustomer" ("id", "name", "phone", "email", "address", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            userId,
            cleanName,
            phone,
            cleanEmail,
            address
          )
        })(),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ])
    } catch {
      // Graceful fallback
    }

    return NextResponse.json(
      {
        success: true,
        message: "Successfully signed in with Google!",
        user: {
          id: userId,
          name: cleanName,
          email: cleanEmail,
          phone,
          address,
          photoUrl,
        },
      },
      { headers: CORS_HEADERS }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Google sign in failed" },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
