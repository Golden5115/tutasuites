import { POST as sendOtpPost, OPTIONS as sendOtpOptions } from "@/app/api/mobile/auth/send-otp/route"
import { POST as verifyOtpPost } from "@/app/api/mobile/auth/verify-otp/route"

export async function OPTIONS() {
  return sendOtpOptions()
}

export async function POST(req: Request) {
  const cloned = req.clone()
  const body = await cloned.json().catch(() => ({}))
  if (body && body.otp) {
    return verifyOtpPost(req)
  }
  return sendOtpPost(req)
}
