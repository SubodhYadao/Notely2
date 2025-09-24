import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string }

    const [user] = await sql`
      SELECT id, name, email, date_of_birth, created_at
      FROM users 
      WHERE id = ${decoded.userId}
    `

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      dateOfBirth: user.date_of_birth,
      createdAt: user.created_at,
    })
  } catch (error) {
    console.error("Profile error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
