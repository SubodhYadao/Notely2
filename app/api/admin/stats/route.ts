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

    // Get total counts
    const [totalUsers] = await sql`SELECT COUNT(*) as count FROM users WHERE role != 'admin'`
    const [totalNotes] = await sql`SELECT COUNT(*) as count FROM notes`

    // Get today's counts
    const [usersToday] = await sql`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE role != 'admin' AND DATE(created_at) = CURRENT_DATE
    `
    const [notesToday] = await sql`
      SELECT COUNT(*) as count 
      FROM notes 
      WHERE DATE(created_at) = CURRENT_DATE
    `

    return NextResponse.json({
      total_users: Number.parseInt(totalUsers.count),
      total_notes: Number.parseInt(totalNotes.count),
      users_today: Number.parseInt(usersToday.count),
      notes_today: Number.parseInt(notesToday.count),
    })
  } catch (error) {
    console.error("Get stats error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
}
