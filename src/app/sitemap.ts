import { MetadataRoute } from 'next'
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://tutasuites.com'

  // Get all rooms from the database to add to the sitemap
  const rooms = await prisma.roomType.findMany({
    select: {
      slug: true,
      updatedAt: true,
    }
  })

  // Dynamic room URLs
  const roomUrls = rooms.map((room) => ({
    url: `${baseUrl}/rooms/${room.slug}`,
    lastModified: room.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/rooms`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    ...roomUrls,
  ]
}
