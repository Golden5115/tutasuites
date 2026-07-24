import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "file:./dev.db" // Fallback to local SQLite if URL isn't loaded
    }
  }
})

async function main() {
  const rooms = await prisma.roomType.findMany()
  for (const room of rooms) {
    if (room.images && room.images.length > 0) {
      const updatedImages = room.images.map(img => img.replace('.png', '.jpeg'))
      await prisma.roomType.update({
        where: { id: room.id },
        data: { images: updatedImages }
      })
      console.log(`Updated images for room ${room.name}`)
    }
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
