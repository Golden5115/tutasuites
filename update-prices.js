const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Updating Classic room (smallest)...");
  await prisma.roomType.updateMany({
    where: { slug: { contains: 'signature' } },
    data: {
      basePrice: 25000,
      hourlyPrice: 10000
    }
  });

  console.log("Updating Premium room...");
  await prisma.roomType.updateMany({
    where: { slug: { contains: 'executive' } },
    data: {
      basePrice: 30000,
      hourlyPrice: 15000
    }
  });

  const rooms = await prisma.roomType.findMany();
  console.log("Updated Rooms:", rooms.map(r => ({ slug: r.slug, basePrice: r.basePrice, hourlyPrice: r.hourlyPrice })));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
