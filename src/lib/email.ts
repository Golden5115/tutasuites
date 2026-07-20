import { prisma } from "@/lib/prisma"

/**
 * Mock Email Service
 * In production, replace this with Resend/SendGrid API calls.
 */
async function mockSendEmail(to: string, subject: string, htmlContent: string) {
  console.log("\n" + "=".repeat(60))
  console.log(`✉️ MOCK EMAIL SENT`)
  console.log(`To:      ${to}`)
  console.log(`Subject: ${subject}`)
  console.log("-".repeat(60))
  console.log(htmlContent)
  console.log("=".repeat(60) + "\n")
}

export async function sendBookingConfirmation(reservationId: string) {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        guest: true,
        room: { include: { roomType: true } }
      }
    })

    if (!reservation) {
      console.error("Booking confirmation failed: Reservation not found")
      return
    }

    const { guest, room, checkIn, checkOut, bookingReference, totalAmount } = reservation

    const subject = `Your Booking Confirmation at Tuta Suites - ${bookingReference}`
    const htmlContent = `
Dear ${guest.firstName} ${guest.lastName},

Thank you for choosing Tuta Suites! Your reservation is confirmed.

BOOKING DETAILS:
--------------------------------
Reference:  ${bookingReference}
Room:       ${room.number} (${room.roomType.name})
Check-In:   ${new Date(checkIn).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} (After 12:00 PM)
Check-Out:  ${new Date(checkOut).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} (Before 12:00 PM)
Total Paid: ₦${totalAmount.toLocaleString()}

We are looking forward to welcoming you to Tuta Suites.
If you have any questions, please reply to this email or call our front desk.

Warm regards,
The Tuta Suites Team
`

    // Do not await if we want it to be fully non-blocking, but async function returns immediately if no await block inside
    await mockSendEmail(guest.email || "guest@example.com", subject, htmlContent)

  } catch (error) {
    console.error("Failed to send booking confirmation email:", error)
  }
}
