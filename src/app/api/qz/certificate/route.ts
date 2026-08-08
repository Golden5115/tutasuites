import { NextResponse } from 'next/server'
import { getQzCertificate } from '@/lib/qz-security'

export async function GET() {
  try {
    const cert = getQzCertificate()
    return new NextResponse(cert, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  } catch (error) {
    console.error('Error fetching QZ certificate:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
