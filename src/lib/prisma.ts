import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Upgrade legacy `prefer` / `require` / `verify-ca` sslmode query params to explicit `verify-full`
 * (unless `uselibpqcompat=true` is already set) so pg-connection-string matches current behavior
 * without emitting cold-start stderr SECURITY WARNINGs to Vercel logs.
 */
export function normalizePostgresConnectionString(rawUrl?: string): string | undefined {
  if (!rawUrl) return rawUrl
  try {
    const parsed = new URL(rawUrl)
    const sslmode = parsed.searchParams.get('sslmode')
    const hasCompat = parsed.searchParams.get('uselibpqcompat') === 'true'
    if (
      !hasCompat &&
      (sslmode === 'prefer' || sslmode === 'require' || sslmode === 'verify-ca')
    ) {
      parsed.searchParams.set('sslmode', 'verify-full')
      return parsed.toString()
    }
    return rawUrl
  } catch {
    return rawUrl
  }
}

const connectionString = normalizePostgresConnectionString(
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL
) as string

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
  ssl: !connectionString?.includes('sslmode=') && process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : undefined
})
const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
