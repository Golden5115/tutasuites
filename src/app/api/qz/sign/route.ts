import { NextRequest, NextResponse } from 'next/server'
import { signQzHash } from '@/lib/qz-security'

export async function POST(req: NextRequest) {
  try {
    let toSign = ''
    const contentType = req.headers.get('content-type') || ''
    
    if (contentType.includes('application/json')) {
      const body = await req.json()
      toSign = body.requestToSign || body.toSign || ''
    } else {
      toSign = await req.text()
    }

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const toSign = searchParams.get('toSign') || searchParams.get('requestToSign')

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
