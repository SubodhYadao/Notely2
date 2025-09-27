import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Force dynamic rendering
export const dynamic = "force-dynamic"

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

    console.log("Fetching users from database...")

    const users = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        COALESCE(u.role, 'user') as role,
        u.auth_provider,
        u.created_at,
        COUNT(n.id) as notes_count
      FROM users u
      LEFT JOIN notes n ON u.id = n.user_id
      WHERE COALESCE(u.role, 'user') != 'admin'
      GROUP BY u.id, u.name, u.email, u.role, u.auth_provider, u.created_at
      ORDER BY u.created_at DESC
    `

    console.log(`Found ${users.length} users`)

    // Set cache control headers to prevent caching
    const response = NextResponse.json(users)
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    return response
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
}
