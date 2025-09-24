import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

async function getUserFromToken(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value

  if (!token) {
    throw new Error("No token provided")
  }

  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string }
  return decoded
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromToken(request)
    const noteId = params.id

    // Verify note belongs to user and delete
    const result = await sql`
      DELETE FROM notes 
      WHERE id = ${noteId} AND user_id = ${user.userId}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Note not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({ message: "Note deleted successfully" })
  } catch (error) {
    console.error("Delete note error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
