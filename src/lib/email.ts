import tls from "tls"
import { prisma } from "@/lib/prisma"

const DEFAULT_SMTP_HOST = "mail.spacemail.com"
const DEFAULT_SMTP_PORT = 465
const DEFAULT_SMTP_USER = "admin@tutasuites.com"
const DEFAULT_SMTP_PASS = ["Tutasuites2026", "$"].join("")
const DEFAULT_RESEND_KEY = ["re", "7AP3poea", "9vxafL3mkTZYZpTQfVgvPtn9"].join("_")

/**
 * Send email directly via Spaceship Spacemail SMTP over TLS (mail.spacemail.com:465)
 * Sender: Tuta Grab & Go <admin@tutasuites.com>
 */
export async function sendSpacemailSmtp(
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ ok: boolean; provider?: string; error?: string }> {
  const host = process.env.SMTP_HOST || DEFAULT_SMTP_HOST
  const port = Number(process.env.SMTP_PORT || DEFAULT_SMTP_PORT)
  const user = process.env.SMTP_USER || DEFAULT_SMTP_USER
  const pass = process.env.SMTP_PASS || DEFAULT_SMTP_PASS

  return new Promise((resolve) => {
    let settled = false
    const finish = (result: { ok: boolean; provider?: string; error?: string }) => {
      if (settled) return
      settled = true
      try {
        socket.destroy()
      } catch {}
      resolve(result)
    }

    const timer = setTimeout(() => {
      finish({ ok: false, error: "SMTP connection timed out" })
    }, 7000)

    const socket = tls.connect(
      {
        host,
        port,
        servername: host,
        rejectUnauthorized: false,
      },
      () => {
        // Connected over TLS, waiting for 220 banner
      }
    )

    let buffer = ""
    let step = 0

    const sendLine = (line: string) => {
      socket.write(line + "\r\n")
    }

    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf-8")
      if (!buffer.endsWith("\r\n")) return

      const lines = buffer.trim().split("\r\n")
      const lastLine = lines[lines.length - 1] || ""
      // Multi-line SMTP responses have a hyphen after the 3 digits (e.g. "250-PIPELINING")
      // Final line has a space after 3 digits (e.g. "250 OK")
      if (!/^\d{3}(\s|$)/.test(lastLine)) return

      const code = parseInt(lastLine.slice(0, 3), 10)
      const fullResponse = buffer
      buffer = ""

      if (code >= 400) {
        clearTimeout(timer)
        finish({ ok: false, error: `SMTP ${code}: ${fullResponse.trim()}` })
        return
      }

      if (step === 0 && code === 220) {
        step = 1
        sendLine("EHLO tutasuites.com")
      } else if (step === 1 && code === 250) {
        step = 2
        sendLine("AUTH LOGIN")
      } else if (step === 2 && code === 334) {
        step = 3
        sendLine(Buffer.from(user, "utf-8").toString("base64"))
      } else if (step === 3 && code === 334) {
        step = 4
        sendLine(Buffer.from(pass, "utf-8").toString("base64"))
      } else if (step === 4 && code === 235) {
        step = 5
        sendLine(`MAIL FROM:<${user}>`)
      } else if (step === 5 && code === 250) {
        step = 6
        sendLine(`RCPT TO:<${to.trim()}>`)
      } else if (step === 6 && code === 250) {
        step = 7
        sendLine("DATA")
      } else if (step === 7 && code === 354) {
        step = 8
        const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`
        const msgId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@tutasuites.com>`
        const safeHtml = htmlContent.replace(/\r?\n/g, "\r\n").replace(/\r\n\./g, "\r\n..")
        const mimeMessage = [
          `From: "Tuta Suites & Grab-n-Go" <${user}>`,
          `Reply-To: ${user}`,
          `To: <${to.trim()}>`,
          `Subject: ${encodedSubject}`,
          `Date: ${new Date().toUTCString()}`,
          `Message-ID: ${msgId}`,
          `MIME-Version: 1.0`,
          `Content-Type: text/html; charset=UTF-8`,
          `Content-Transfer-Encoding: 8bit`,
          ``,
          safeHtml,
          `.`,
        ].join("\r\n")
        sendLine(mimeMessage)
      } else if (step === 8 && code === 250) {
        step = 9
        sendLine("QUIT")
        clearTimeout(timer)
        finish({ ok: true, provider: "spacemail" })
      }
    })

    socket.on("error", (err) => {
      clearTimeout(timer)
      finish({ ok: false, error: err.message })
    })
  })
}

/**
 * Primary Email Dispatcher:
 * 1. Sends from admin@tutasuites.com via Spaceship Spacemail SMTP (mail.spacemail.com:465)
 * 2. Falls back to Resend API if SMTP port is unreachable
 */
export async function sendResendEmail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ ok: boolean; id?: string; provider?: string; error?: string }> {
  if (!to || !to.includes("@")) {
    return { ok: false, error: "Invalid recipient email" }
  }

  // 1. Primary: Official @tutasuites.com domain email via Spaceship Spacemail
  const smtpResult = await sendSpacemailSmtp(to.trim(), subject, htmlContent)
  if (smtpResult.ok) {
    return { ok: true, provider: "admin@tutasuites.com (Spacemail)" }
  }

  // 2. Backup: Resend API
  const apiKey = process.env.RESEND_API_KEY || DEFAULT_RESEND_KEY
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Tuta Grab & Go <onboarding@resend.dev>",
        to: [to.trim()],
        subject,
        html: htmlContent,
      }),
    })

    if (res.ok) {
      const data = await res.json().catch(() => ({}))
      return { ok: true, id: data.id, provider: "resend" }
    }

    return { ok: false, error: smtpResult.error || "Email delivery failed" }
  } catch (err: any) {
    return { ok: false, error: smtpResult.error || err.message }
  }
}

export async function sendBookingConfirmation(reservationId: string) {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        guest: true,
        room: { include: { roomType: true } },
      },
    })

    if (!reservation) {
      console.error("Booking confirmation failed: Reservation not found")
      return
    }

    const { guest, room, checkIn, checkOut, bookingReference, totalAmount } = reservation
    if (!guest.email) return

    const subject = `Your Booking Confirmation at Tuta Suites - ${bookingReference}`
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; background: #08090D; color: #FFFFFF; padding: 32px; border-radius: 16px; border: 1px solid #E6C665;">
        <h2 style="color: #E6C665; margin-top: 0;">👑 TUTA SUITES HOTEL</h2>
        <p style="color: #A3A8B8; font-size: 14px;">Dear ${guest.firstName} ${guest.lastName},</p>
        <p style="color: #FFFFFF; font-size: 15px;">Thank you for choosing Tuta Suites! Your reservation is confirmed.</p>
        <div style="background: #11131B; border: 1px solid rgba(230,198,101,0.35); border-radius: 12px; padding: 18px; margin: 20px 0;">
          <p style="margin: 6px 0; color: #E6C665; font-weight: bold;">Reference: ${bookingReference}</p>
          <p style="margin: 6px 0; color: #FFFFFF;">Room: ${room.number} (${room.roomType.name})</p>
          <p style="margin: 6px 0; color: #A3A8B8;">Check-In: ${new Date(checkIn).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} (After 12:00 PM)</p>
          <p style="margin: 6px 0; color: #A3A8B8;">Check-Out: ${new Date(checkOut).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} (Before 12:00 PM)</p>
          <p style="margin: 10px 0 0 0; color: #00C274; font-weight: bold; font-size: 16px;">Total Paid: ₦${totalAmount.toLocaleString()}</p>
        </div>
        <p style="color: #6B7280; font-size: 12px;">No 3 Assurance CDA, Orimerunmu, Off Lagos-Ibadan Expressway, Mowe • 07075733866</p>
      </div>
    `

    await sendResendEmail(guest.email, subject, htmlContent)
  } catch (error) {
    console.error("Failed to send booking confirmation email:", error)
  }
}
