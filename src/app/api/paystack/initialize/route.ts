import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reservationId = searchParams.get("reservationId")

  if (!reservationId) {
    return NextResponse.json({ error: "Missing reservationId" }, { status: 400 })
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { guest: true },
  })

  if (!reservation) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
  }

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY
  if (!paystackSecret) {
    return NextResponse.json({ error: "Paystack secret key is not configured in .env" }, { status: 500 })
  }

  const reference = `PAY-${reservation.bookingReference || Date.now()}-${Date.now()}`
  const guestEmail = reservation.guest?.email?.trim() || "guest@tutasuites.com"

  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: guestEmail,
        amount: Math.round(reservation.totalAmount * 100), // kobo
        currency: "NGN",
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/paystack/verify?reference=${reference}`,
        metadata: {
          reservationId: reservation.id,
          bookingReference: reservation.bookingReference,
        },
      }),
    })

    const data = await response.json()

    if (data.status) {
      // Upsert payment record to allow retries
      await prisma.payment.upsert({
        where: { reservationId: reservation.id },
        update: {
          amount: reservation.totalAmount,
          reference,
          status: "PENDING",
        },
        create: {
          reservationId: reservation.id,
          amount: reservation.totalAmount,
          reference,
          status: "PENDING",
        },
      })

      // Redirect to Paystack checkout
      return NextResponse.redirect(data.data.authorization_url)
    }

    console.error("Paystack API response error:", data)
    return NextResponse.json({ 
      error: "Failed to initialize payment with Paystack", 
      details: data.message || data 
    }, { status: 500 })
  } catch (error: any) {
    console.error("Paystack init exception:", error)
    return NextResponse.json({ 
      error: "Payment initialization failed", 
      message: error?.message || String(error) 
    }, { status: 500 })
  }
}
