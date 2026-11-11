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

const USERS_FILE = path.join(process.cwd(), ".delivery-orders", "mobile-users.json")

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

    const existingUsers = getUsers()
    let user = existingUsers.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase() || (googleId && u.googleId === googleId)
    )

    if (!user) {
      user = {
        id: `google_${googleId || Date.now()}`,
        googleId: googleId || `gid_${Date.now()}`,
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        phone: phone || "",
        address: address || "Mowe, Assurance CDA Estate",
        photoUrl,
        isVerified: true,
        createdAt: new Date().toISOString(),
      }
      saveUsers([user, ...existingUsers])
    } else {
      user.name = name || user.name
      user.photoUrl = photoUrl || user.photoUrl
    }

    // Save/update in PostgreSQL Guest table
    try {
      const nameParts = (user.name || "Google User").trim().split(" ")
      const firstName = nameParts[0] || "Google"
      const lastName = nameParts.slice(1).join(" ") || "User"
      const guestId = `gst_${crypto.randomBytes(8).toString("hex")}`

      await prisma.$executeRawUnsafe(
        `INSERT INTO "Guest" ("id", "firstName", "lastName", "email", "phone", "address", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT ("email") DO UPDATE SET "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName"`,
        guestId,
        firstName,
        lastName,
        user.email,
        user.phone || null,
        user.address || null
      )
    } catch (e) {
      // Graceful fallback
    }

    return NextResponse.json(
      {
        success: true,
        message: "Successfully signed in with Google!",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          photoUrl: user.photoUrl,
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
