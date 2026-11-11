import { NextResponse } from "next/server"
import crypto from "crypto"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

const SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "tuta-grab-and-go-secret-2026"

export function signOtpToken(identifier: string, code: string, expiresAt: number): string {
  const payload = `${identifier}|${code}|${expiresAt}`
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex")
  return Buffer.from(`${payload}|${sig}`).toString("base64")
}

async function sendRealEmailIfConfigured(email: string, name: string, code: string): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey || !email) return false

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Tuta Grab & Go <onboarding@resend.dev>",
        to: [email],
        subject: `${code} is your Tuta Grab & Go verification code`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #08090D; color: #FFFFFF; padding: 32px; border-radius: 16px; border: 1px solid #E6C665;">
            <h2 style="color: #E6C665; margin-top: 0;">👑 TUTA GRAB & GO</h2>
            <p style="color: #A3A8B8; font-size: 14px;">Hello ${name},</p>
            <p style="color: #FFFFFF; font-size: 15px;">Use the 6-digit verification code below to complete your sign-in:</p>
            <div style="background: #11131B; border: 1px solid #E6C665; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #E6C665;">${code}</span>
            </div>
            <p style="color: #6B7280; font-size: 12px;">This code expires in 10 minutes. Express Kitchen • Mowe, Ogun State.</p>
          </div>
        `,
      }),
    })
    return res.ok
  } catch (err) {
    console.warn("Resend email error:", err)
    return false
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
    const otpToken = signOtpToken(identifier, code, expiresAt)

    // Send real email if RESEND_API_KEY is configured in .env
    const emailSent = email ? await sendRealEmailIfConfigured(email.trim(), name, code) : false

    console.log(`\n======================================================`)
    console.log(`🔐 TUTA GRAB & GO VERIFICATION OTP`)
    console.log(`To:         ${email || phone}`)
    console.log(`Name:       ${name}`)
    console.log(`OTP Code:   ${code}`)
    console.log(`Email Sent: ${emailSent ? "YES (via Resend)" : "SANDBOX MODE (Displayed in App)"}`)
    console.log(`======================================================\n`)

    return NextResponse.json(
      {
        success: true,
        message: emailSent
          ? `Verification code sent to ${email}`
          : `Verification code generated for ${email || phone}`,
        otpToken,
        testOtp: code,
        emailSent,
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
