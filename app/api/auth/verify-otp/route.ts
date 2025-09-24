import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 })
    }

    // Verify OTP from database
    const [storedOtp] = await sql`
      SELECT otp, expires_at, user_data 
      FROM otp_verifications 
      WHERE email = ${email}
    `

    if (!storedOtp) {
      return NextResponse.json({ error: "OTP not found or expired" }, { status: 400 })
    }

    if (new Date() > new Date(storedOtp.expires_at)) {
      // Clean up expired OTP
      await sql`DELETE FROM otp_verifications WHERE email = ${email}`
      return NextResponse.json({ error: "OTP expired" }, { status: 400 })
    }

    if (storedOtp.otp !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 })
    }

    // OTP is valid - don't delete it yet, we'll need it for password setting
    return NextResponse.json({
      message: "OTP verified successfully",
      verified: true,
    })
  } catch (error) {
    console.error("Verify OTP error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
