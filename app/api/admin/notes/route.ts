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

    const notes = await sql`
      SELECT 
        n.id,
        n.title,
        n.content,
        n.created_at,
        n.updated_at,
        u.name as user_name,
        u.email as user_email
      FROM notes n
      JOIN users u ON n.user_id = u.id
      ORDER BY n.created_at DESC
      LIMIT 100
    `

    return NextResponse.json(notes)
  } catch (error) {
    console.error("Get all notes error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
}
