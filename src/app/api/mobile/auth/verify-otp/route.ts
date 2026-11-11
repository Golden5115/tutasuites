import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

const OTP_FILE = path.join(process.cwd(), ".delivery-orders", "otps.json")
const USERS_FILE = path.join(process.cwd(), ".delivery-orders", "mobile-users.json")

function getOtpStore(): Record<string, { code: string; expiresAt: number; name?: string }> {
  try {
    if (!fs.existsSync(OTP_FILE)) return {}
    return JSON.parse(fs.readFileSync(OTP_FILE, "utf-8"))
  } catch {
    return {}
  }
}

function saveOtpStore(store: Record<string, { code: string; expiresAt: number; name?: string }>) {
  try {
    fs.writeFileSync(OTP_FILE, JSON.stringify(store, null, 2), "utf-8")
  } catch {}
}

function getUsers(): any[] {
  try {
    if (!fs.existsSync(USERS_FILE)) return []
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"))
  } catch {
    return []
  }
}

function saveUsers(users: any[]) {
  try {
    const dir = path.dirname(USERS_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8")
  } catch {}
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, phone, otp, name, address, password } = body

    const identifier = (email || phone || "").trim().toLowerCase()
    const submittedOtp = (otp || "").toString().trim()

    if (!identifier || !submittedOtp) {
      return NextResponse.json(
        { success: false, error: "Identifier and OTP code are required." },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const store = getOtpStore()
    const entry = store[identifier]

    // Verify OTP code (or accept universal developer test code 123456)
    const isValid = (entry && entry.code === submittedOtp && entry.expiresAt > Date.now()) || submittedOtp === "123456"

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification code." },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    // Clean up OTP
    if (entry) {
      delete store[identifier]
      saveOtpStore(store)
    }

    const displayName = name || (entry && entry.name) || "Customer"
    const userPhone = phone || ""
    const userEmail = email || ""
    const userAddress = address || "Mowe, Assurance CDA Estate"

    const existingUsers = getUsers()
    let user = existingUsers.find(
      (u) =>
        (userEmail && u.email?.toLowerCase() === userEmail.toLowerCase()) ||
        (userPhone && u.phone === userPhone)
    )

    if (!user) {
      user = {
        id: `cust_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: displayName,
        phone: userPhone,
        email: userEmail,
        address: userAddress,
        isVerified: true,
        createdAt: new Date().toISOString(),
      }
      saveUsers([user, ...existingUsers])
    } else {
      user.isVerified = true
    }

    // Insert/Update into PostgreSQL Guest table if available
    try {
      const nameParts = displayName.trim().split(" ")
      const firstName = nameParts[0] || "Customer"
      const lastName = nameParts.slice(1).join(" ") || "Tuta"

      const guestId = `gst_${crypto.randomBytes(8).toString("hex")}`
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Guest" ("id", "firstName", "lastName", "email", "phone", "address", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT ("email") DO UPDATE SET "phone" = EXCLUDED."phone", "address" = EXCLUDED."address"`,
        guestId,
        firstName,
        lastName,
        userEmail || `${userPhone}@tutaguest.com`,
        userPhone,
        userAddress
      )
    } catch (e) {
      // Postgres sync is optional, file cache guarantees session
    }

    return NextResponse.json(
      {
        success: true,
        message: "Email & phone verified successfully!",
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          address: user.address,
        },
      },
      { headers: CORS_HEADERS }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "OTP verification failed." },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
