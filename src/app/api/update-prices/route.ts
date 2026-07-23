import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  await prisma.roomType.updateMany({
    where: { slug: { contains: 'signature' } },
    data: { basePrice: 25000, hourlyPrice: 10000 }
  });

  await prisma.roomType.updateMany({
    where: { slug: { contains: 'executive' } },
    data: { basePrice: 30000, hourlyPrice: 15000 }
  });

  const rooms = await prisma.roomType.findMany();
  return NextResponse.json(rooms);
}
