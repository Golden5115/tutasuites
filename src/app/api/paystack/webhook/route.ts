import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(request: Request) {
  const body = await request.text()
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY

  if (!paystackSecret) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 })
  }

  // Verify webhook signature
  const hash = crypto
    .createHmac("sha512", paystackSecret)
    .update(body)
    .digest("hex")

  const signature = request.headers.get("x-paystack-signature")
  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const event = JSON.parse(body)

  if (event.event === "charge.success") {
    const { reference } = event.data

    try {
      const payment = await prisma.payment.findUnique({ where: { reference } })
      if (payment && payment.status !== "SUCCESS") {
        await prisma.payment.update({
          where: { reference },
          data: { status: "SUCCESS" },
        })
        await prisma.reservation.update({
          where: { id: payment.reservationId },
          data: {
            paymentStatus: "PAID",
            status: "CONFIRMED",
          },
        })
      }
    } catch (error) {
      console.error("Webhook processing error:", error)
    }
  }

  return NextResponse.json({ received: true })
}
