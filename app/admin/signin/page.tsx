"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function AdminSignInPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleSignIn = async () => {
    if (!formData.email.trim() || !formData.password.trim()) {
      setError("Email and password are required")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/admin/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push("/admin")
      } else {
        setError(data.error || "Invalid admin credentials")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-semibold">HD Admin</span>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Sign In</h1>
              <p className="text-gray-600">Access the administrative dashboard</p>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">{error}</div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm text-gray-600 mb-2 block">
                  Admin Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter admin email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="h-12 border-gray-200 focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm text-gray-600 mb-2 block">
                  Admin Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter admin password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="h-12 border-gray-200 focus:border-red-500 focus:ring-red-500 pr-10"
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

              <Button
                onClick={handleSignIn}
                disabled={loading}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Sign In as Admin
              </Button>
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
        <div className="absolute inset-0 bg-red-900 bg-opacity-20"></div>
      </div>
    </div>
  )
}
