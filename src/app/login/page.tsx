import { LoginForm } from "@/components/login-form"
import Image from "next/image"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex bg-black text-white selection:bg-[#D4AF37] selection:text-black">
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12">
        <div className="absolute inset-0 z-0">
          <Image
            src="/dsc_0990.jpg"
            alt="Luxury Interior"
            fill
            className="object-cover opacity-60"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>
        
        <Link href="/" className="relative z-10 w-32 h-12 block hover:opacity-80 transition-opacity">
          <Image 
            src="/logo.png" 
            alt="Tuta Suites" 
            fill 
            className="object-contain invert"
          />
        </Link>
        
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-heading mb-4 text-white">Staff Portal</h1>
          <p className="text-white/60 font-light text-lg leading-relaxed">
            Access the Tuta Suites management system. Ensure you are using a secure and authorized network before logging in.
          </p>
        </div>
      </div>
      
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        <div className="absolute inset-0 z-0 lg:hidden">
          <Image
            src="/dsc_0990.jpg"
            alt="Luxury Interior"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-black/80" />
        </div>
        <div className="w-full max-w-sm relative z-10">
          <div className="lg:hidden mb-12 flex justify-center">
            <Link href="/" className="relative w-32 h-12 block">
              <Image 
                src="/logo.png" 
                alt="Tuta Suites" 
                fill 
                className="object-contain invert"
              />
            </Link>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
