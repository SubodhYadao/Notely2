"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Eye, EyeOff, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function SignUpPage() {
  const [step, setStep] = useState<"details" | "otp" | "password">("details")
  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  })
  const [showOtp, setShowOtp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const validateDetailsForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required")
      return false
    }
    if (!formData.dateOfBirth) {
      setError("Date of birth is required")
      return false
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Valid email is required")
      return false
    }
    return true
  }

  const validatePasswordForm = () => {
    if (!formData.password.trim()) {
      setError("Password is required")
      return false
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    return true
  }

  const handleGetOTP = async () => {
    if (!validateDetailsForm()) return

    setLoading(true)
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          dateOfBirth: formData.dateOfBirth,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setStep("otp")
      } else {
        setError(data.error || "Failed to send OTP")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!formData.otp.trim()) {
      setError("OTP is required")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setStep("password")
      } else {
        setError(data.error || "Invalid OTP")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSetPassword = async () => {
    if (!validatePasswordForm()) return

    setLoading(true)
    try {
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push("/dashboard")
      } else {
        setError(data.error || "Failed to set password")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = () => {
    window.location.href = "/api/auth/google"
  }

  const getStepTitle = () => {
    switch (step) {
      case "details":
        return "Sign up"
      case "otp":
        return "Verify Email"
      case "password":
        return "Set Password"
      default:
        return "Sign up"
    }
  }

  const getStepDescription = () => {
    switch (step) {
      case "details":
        return "Sign up to enjoy the feature of HD"
      case "otp":
        return "Enter the OTP sent to your email"
      case "password":
        return "Create a secure password for your account"
      default:
        return "Sign up to enjoy the feature of HD"
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
            <span className="text-xl font-semibold">HD</span>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === "details" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600"}`}
              >
                1
              </div>
              <div className={`w-8 h-1 ${step === "otp" || step === "password" ? "bg-blue-600" : "bg-gray-200"}`}></div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === "otp" ? "bg-blue-600 text-white" : step === "password" ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-400"}`}
              >
                2
              </div>
              <div className={`w-8 h-1 ${step === "password" ? "bg-blue-600" : "bg-gray-200"}`}></div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === "password" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"}`}
              >
                3
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{getStepTitle()}</h1>
              <p className="text-gray-600">{getStepDescription()}</p>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">{error}</div>
            )}

            <div className="space-y-4">
              {step === "details" && (
                <>
                  <div>
                    <Label htmlFor="name" className="text-sm text-gray-600 mb-2 block">
                      Your Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Jonas Khanwald"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dob" className="text-sm text-gray-600 mb-2 block">
                      Date of Birth
                    </Label>
                    <div className="relative">
                      <Input
                        id="dob"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                        className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 pl-10"
                      />
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm text-gray-600 mb-2 block">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="jonas_kahnwald@gmail.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {step === "otp" && (
                <>
                  <div>
                    <Label htmlFor="email" className="text-sm text-blue-600 mb-2 block">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      className="h-12 border-blue-500 focus:border-blue-600 focus:ring-blue-500"
                      disabled
                    />
                  </div>

                  <div>
                    <Label htmlFor="otp" className="text-sm text-gray-600 mb-2 block">
                      OTP
                    </Label>
                    <div className="relative">
                      <Input
                        id="otp"
                        type={showOtp ? "text" : "password"}
                        placeholder="Enter OTP"
                        value={formData.otp}
                        onChange={(e) => handleInputChange("otp", e.target.value)}
                        className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowOtp(!showOtp)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showOtp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setStep("details")}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      ← Back to edit details
                    </button>
                  </div>
                </>
              )}

              {step === "password" && (
                <>
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                      ✓ Email verified successfully
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-sm text-gray-600 mb-2 block">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm text-gray-600 mb-2 block">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <Button
                onClick={step === "details" ? handleGetOTP : step === "otp" ? handleVerifyOTP : handleSetPassword}
                disabled={loading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {step === "details" ? "Get OTP" : step === "otp" ? "Verify OTP" : "Create Account"}
              </Button>

              {step === "details" && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">or</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleGoogleSignUp}
                    variant="outline"
                    className="w-full h-12 border-gray-200 hover:bg-gray-50 bg-transparent"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </Button>
                </>
              )}
            </div>

            <div className="text-center">
              <span className="text-gray-600">Already have an account? </span>
              <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Blue Wave Design */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <Image
          src="/images/blue-wave-design.png"
          alt="Abstract blue wave design"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  )
}
