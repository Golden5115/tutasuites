"use client"

import { cn } from "@/lib/utils"
import { useActionState, useState } from "react"
import { loginAction } from "@/app/actions/auth-actions"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [state, formAction, isPending] = useActionState(loginAction, undefined)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className={cn("flex flex-col gap-8", className)} {...props}>
      <div className="text-center lg:text-left">
        <h2 className="text-3xl font-heading mb-2">Welcome Back</h2>
        <p className="text-white/60 text-sm">Please sign in to your staff account.</p>
      </div>
      
      <form action={formAction} className="flex flex-col gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.1em] text-white/70">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.1em] text-white/70">
              Password
            </label>
            <div className="relative">
              <input 
                id="password" 
                name="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter your password"
                required 
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {state?.error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400 font-medium flex items-center justify-center">
            {state.error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isPending}
          className="w-full bg-[#D4AF37] text-black font-bold uppercase tracking-[0.15em] text-sm rounded-xl px-6 py-4 hover:bg-[#F3E5AB] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2 mt-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Authenticating...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </div>
  )
}
