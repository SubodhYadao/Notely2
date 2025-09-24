import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest) {
  try {
    let body: any
    try {
      body = await request.json()
    } catch (jsonError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    // Check if OTP was verified (should still exist in database)
    const [storedOtp] = await sql`
      SELECT user_data 
      FROM otp_verifications 
      WHERE email = ${email}
    `

    if (!storedOtp) {
      return NextResponse.json({ error: "Email verification required" }, { status: 400 })
    }

    // Parse user data
   console.log("OTP user_data:", storedOtp.user_data)
let userData
if (typeof storedOtp.user_data === "string") {
  try {
    userData = JSON.parse(storedOtp.user_data)
  } catch (parseError) {
    return NextResponse.json({ error: "Corrupted OTP data" }, { status: 500 })
  }
} else {
  userData = storedOtp.user_data
}
// 

    const hashedPassword = await bcrypt.hash(password, 12)

    const [user] = await sql`
      INSERT INTO users (name, email, date_of_birth, password_hash, auth_provider)
      VALUES (${userData.name}, ${userData.email}, ${userData.dateOfBirth}, ${hashedPassword}, 'email')
      RETURNING id, name, email, date_of_birth
    `

    await sql`DELETE FROM otp_verifications WHERE email = ${email}`

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" })

    const response = NextResponse.json({
      message: "Account created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error("Set password error:", error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
