"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { authApi } from "@/lib/api"

export default function VerifyOtpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams?.get("email") || ""
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)

  const handleVerify = async () => {
    if (otp.length !== 6) return toast.error("Please enter full OTP")
    setLoading(true)
    try {
      await authApi.verifyOtp({ email, otp })
      toast.success("OTP verified successfully")
      router.push(`/reset-password?email=${email}&otp=${otp}`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid OTP")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Enter OTP</h1>
        </div>

        <div className="flex justify-center py-4">
          <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <p className="text-sm text-muted-foreground">
          Didn't Receive OTP?{" "}
          <button className="text-primary hover:underline font-medium" onClick={() => {}}>
            RESEND OTP
          </button>
        </p>

        <Button onClick={handleVerify} className="w-full h-11" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify"}
        </Button>
      </div>
    </div>
  )
}
