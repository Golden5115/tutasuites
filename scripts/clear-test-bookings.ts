import { prisma } from "../src/lib/prisma"

async function main() {
  console.log("Cleaning up test reservations and linked data...")

  // Delete linked payments
  const deletedPayments = await prisma.payment.deleteMany({})
  console.log(`Deleted ${deletedPayments.count} payment records.`)

  // Delete linked booking extras
  const deletedExtras = await prisma.bookingExtra.deleteMany({})
  console.log(`Deleted ${deletedExtras.count} booking extra records.`)

  // Unlink bar orders
  await prisma.barOrder.updateMany({
    where: { reservationId: { not: null } },
    data: { reservationId: null }
  })

  // Unlink restaurant orders
  await prisma.restaurantOrder.updateMany({
    where: { reservationId: { not: null } },
    data: { reservationId: null }
  })

  // Delete all reservations
  const deletedReservations = await prisma.reservation.deleteMany({})
  console.log(`Deleted ${deletedReservations.count} reservations.`)

  // Reset room statuses back to AVAILABLE
  await prisma.room.updateMany({
    data: { status: "AVAILABLE" }
  })
  console.log("Reset all room statuses to AVAILABLE.")

  console.log("Cleanup complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
