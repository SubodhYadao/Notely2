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

    console.log("Fetching stats from database...")

    // Get total counts (exclude admin users)
    const [totalUsers] = await sql`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE COALESCE(role, 'user') != 'admin'
    `
    const [totalNotes] = await sql`
      SELECT COUNT(*) as count 
      FROM notes n
      JOIN users u ON n.user_id = u.id
      WHERE COALESCE(u.role, 'user') != 'admin'
    `

    // Get today's counts
    const [usersToday] = await sql`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE COALESCE(role, 'user') != 'admin' 
      AND DATE(created_at) = CURRENT_DATE
    `
    const [notesToday] = await sql`
      SELECT COUNT(*) as count 
      FROM notes n
      JOIN users u ON n.user_id = u.id
      WHERE COALESCE(u.role, 'user') != 'admin'
      AND DATE(n.created_at) = CURRENT_DATE
    `

    const stats = {
      total_users: Number.parseInt(totalUsers.count),
      total_notes: Number.parseInt(totalNotes.count),
      users_today: Number.parseInt(usersToday.count),
      notes_today: Number.parseInt(notesToday.count),
    }

    console.log("Stats:", stats)

    // Set cache control headers to prevent caching
    const response = NextResponse.json(stats)
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    return response
  } catch (error) {
    console.error("Get stats error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
}
