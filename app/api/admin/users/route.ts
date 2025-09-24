import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

async function verifyAdminToken(request: NextRequest) {
  const token = request.cookies.get("admin-token")?.value

  if (!token) {
    throw new Error("No admin token provided")
  }

  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string }

  if (decoded.role !== "admin") {
    throw new Error("Insufficient permissions")
  }

  return decoded
}

export async function GET(request: NextRequest) {
  try {
    await verifyAdminToken(request)

    const users = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.auth_provider,
        u.created_at,
        COUNT(n.id) as notes_count
      FROM users u
      LEFT JOIN notes n ON u.id = n.user_id
      GROUP BY u.id, u.name, u.email, u.role, u.auth_provider, u.created_at
      ORDER BY u.created_at DESC
    `

    return NextResponse.json(users)
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
}
