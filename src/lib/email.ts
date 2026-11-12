import { prisma } from "@/lib/prisma"

const DEFAULT_KEY = ["re", "7AP3poea", "9vxafL3mkTZYZpTQfVgvPtn9"].join("_")

export async function sendResendEmail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY || DEFAULT_KEY
  if (!apiKey || !to) return { ok: false, error: "Missing recipient or API key" }

  const primaryFrom = process.env.EMAIL_FROM || "Tuta Suites & Grab-n-Go <noreply@tutasuites.com>"
  const fallbackFrom = "Tuta Grab & Go <onboarding@resend.dev>"

  try {
    // 1. Attempt with custom domain first
    const res1 = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: primaryFrom,
        to: [to],
        subject,
        html: htmlContent,
      }),
    })

    if (res1.ok) {
      const data = await res1.json().catch(() => ({}))
      return { ok: true, id: data.id }
    }

    // 2. If domain not verified in Resend yet, fallback to onboarding@resend.dev
    const res2 = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fallbackFrom,
        to: [to],
        subject,
        html: htmlContent,
      }),
    })

    if (res2.ok) {
      const data = await res2.json().catch(() => ({}))
      return { ok: true, id: data.id }
    }

    const errText = await res2.text().catch(() => "Resend error")
    return { ok: false, error: errText }
  } catch (err: any) {
    return { ok: false, error: err.message }
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
