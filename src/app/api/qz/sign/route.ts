import { NextRequest, NextResponse } from 'next/server'
import { signQzHash } from '@/lib/qz-security'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const toSign = searchParams.get('toSign')

    if (!toSign) {
      return new NextResponse('Missing toSign parameter', { status: 400 })
    }

    const signature = signQzHash(toSign)
    return new NextResponse(signature, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  } catch (error) {
    console.error('Error signing QZ hash:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
