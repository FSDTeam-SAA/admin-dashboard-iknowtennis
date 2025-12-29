"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Mail, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { authApi } from "@/lib/api"

const forgotSchema = z.z.object({
  email: z.string().email("Invalid email address"),
})

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof forgotSchema>) => {
    setLoading(true)
    try {
      await authApi.forgetPassword(values)
      toast.success("OTP sent to your email")
      router.push(`/verify-otp?email=${values.email}`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Forgot Password</h1>
          <p className="text-muted-foreground">
            Enter your registered email address. we'll send you a code to reset your password.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input placeholder="Email" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send OTP"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
