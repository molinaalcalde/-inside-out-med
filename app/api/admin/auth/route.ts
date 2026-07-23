// Required env vars (set in Vercel dashboard, never in code):
// ADMIN_EMAIL — admin login email
// ADMIN_PASSWORD — admin login password

import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Generate a simple session token
function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, "0")).join("")
}

// Server-side session store (in-memory, resets on deploy — acceptable for single admin)
const activeSessions = new Set<string>()

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      return NextResponse.json({ error: "Admin no configurado" }, { status: 500 })
    }

    if (email?.toLowerCase().trim() !== adminEmail.toLowerCase().trim() || password !== adminPassword) {
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 })
    }

    const token = generateToken()
    activeSessions.add(token)

    // Set httpOnly cookie (more secure than sessionStorage)
    const response = NextResponse.json({ success: true })
    response.cookies.set("iom_admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/admin",
      maxAge: 60 * 60 * 8, // 8 hours
    })

    return response
  } catch {
    return NextResponse.json({ error: "Error de autenticacion" }, { status: 500 })
  }
}

// Validate session
export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("iom_admin_token")?.value

    if (!token || !activeSessions.has(token)) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({ authenticated: true })
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}

// Logout
export async function DELETE() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("iom_admin_token")?.value
    if (token) activeSessions.delete(token)

    const response = NextResponse.json({ success: true })
    response.cookies.delete("iom_admin_token")
    return response
  } catch {
    return NextResponse.json({ success: true })
  }
}
