import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check if the request is for admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Skip middleware for admin signin page
    if (request.nextUrl.pathname === "/admin/signin") {
      return NextResponse.next()
    }

    // Check for admin token
    const adminToken = request.cookies.get("admin-token")

    if (!adminToken) {
      return NextResponse.redirect(new URL("/admin/signin", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
