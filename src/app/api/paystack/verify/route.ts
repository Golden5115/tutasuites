import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get("reference")

  if (!reference) {
    return NextResponse.redirect(new URL("/booking", request.url))
  }

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY
  if (!paystackSecret) {
    return NextResponse.redirect(new URL("/booking", request.url))
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
      },
    })

    const data = await response.json()

    if (data.status && data.data.status === "success") {
      // Update payment record
      const payment = await prisma.payment.update({
        where: { reference },
        data: { status: "SUCCESS" },
      })

      // Update reservation status
      await prisma.reservation.update({
        where: { id: payment.reservationId },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
        },
        include: { guest: true },
      })

      const reservation = await prisma.reservation.findUnique({
        where: { id: payment.reservationId },
      })

      if (reservation) {
        import("@/lib/email").then((module) => {
          module.sendBookingConfirmation(reservation.id)
        })
      }

      return NextResponse.redirect(
        new URL(`/book/confirmation?ref=${reservation?.bookingReference}`, request.url)
      )
    }

    // Payment failed
    const payment = await prisma.payment.findUnique({ where: { reference } })
    if (payment) {
      await prisma.payment.update({
        where: { reference },
        data: { status: "FAILED" },
      })
      await prisma.reservation.update({
        where: { id: payment.reservationId },
        data: { paymentStatus: "FAILED" },
      })
    }

    return NextResponse.redirect(new URL("/booking?error=payment_failed", request.url))
  } catch (error) {
    console.error("Paystack verify error:", error)
    return NextResponse.redirect(new URL("/booking?error=verification_failed", request.url))
  }
}
