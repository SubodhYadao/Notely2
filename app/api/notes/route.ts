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

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)

    const notes = await sql`
      SELECT id, title, content, created_at, updated_at
      FROM notes 
      WHERE user_id = ${user.userId}
      ORDER BY created_at DESC
    `

    return NextResponse.json(
      notes.map((note) => ({
        id: note.id,
        title: note.title,
        content: note.content,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      })),
    )
  } catch (error) {
    console.error("Get notes error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    const { title, content } = await request.json()

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    const [note] = await sql`
      INSERT INTO notes (user_id, title, content)
      VALUES (${user.userId}, ${title}, ${content})
      RETURNING id, title, content, created_at, updated_at
    `

    return NextResponse.json({
      id: note.id,
      title: note.title,
      content: note.content,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    })
  } catch (error) {
    console.error("Create note error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
