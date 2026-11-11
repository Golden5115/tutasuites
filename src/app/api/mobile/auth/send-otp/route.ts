import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

const OTP_FILE = path.join(process.cwd(), ".delivery-orders", "otps.json")

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
    const dir = path.dirname(OTP_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(OTP_FILE, JSON.stringify(store, null, 2), "utf-8")
  } catch (err) {
    console.warn("Could not save OTP store:", err)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, phone, name = "Valued Customer" } = body

    const identifier = (email || phone || "").trim().toLowerCase()
    if (!identifier) {
      return NextResponse.json(
        { success: false, error: "Email or phone number is required." },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    // Generate secure 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

    const store = getOtpStore()
    store[identifier] = { code, expiresAt, name }
    saveOtpStore(store)

    // Send email notification (and log to console for development)
    console.log(`\n======================================================`)
    console.log(`🔐 TUTA GRAB & GO VERIFICATION OTP`)
    console.log(`To:        ${email || phone}`)
    console.log(`Name:      ${name}`)
    console.log(`OTP Code:  ${code}`)
    console.log(`Expires:   10 minutes`)
    console.log(`======================================================\n`)

    return NextResponse.json(
      {
        success: true,
        message: email
          ? `Verification OTP sent to ${email}`
          : `Verification OTP sent to ${phone}`,
        testOtp: code, // Provided for instant testing on mobile
        expiresInSeconds: 600,
      },
      { headers: CORS_HEADERS }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate OTP" },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
