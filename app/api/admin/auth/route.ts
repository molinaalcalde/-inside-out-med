// Required env vars (set in Vercel dashboard, never in code):
// ADMIN_EMAIL — admin login email
// ADMIN_PASSWORD — admin login password

import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// HMAC-based token: no server state needed, works across serverless instances
async function signToken(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  )
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

async function verifyToken(token: string, secret: string): Promise<boolean> {
  try {
    const [payload, sig] = token.split(".")
    if (!payload || !sig) return false
    const decoded = atob(payload)
    const data = JSON.parse(decoded)
    // Check expiry
    if (Date.now() > data.exp) return false
    // Verify signature
    const expected = await signToken(decoded, secret)
    return sig === expected
  } catch {
    return false
  }
}

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

    // Create signed token with 8-hour expiry
    const payload = JSON.stringify({ email: adminEmail, exp: Date.now() + 8 * 60 * 60 * 1000 })
    const sig = await signToken(payload, adminPassword)
    const token = `${btoa(payload)}.${sig}`

    const response = NextResponse.json({ success: true })
    response.cookies.set("iom_admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    })

    return response
  } catch {
    return NextResponse.json({ error: "Error de autenticación" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("iom_admin_token")?.value
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!token || !adminPassword) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const valid = await verifyToken(token, adminPassword)
    if (!valid) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({ authenticated: true })
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set("iom_admin_token", "", { path: "/", maxAge: 0 })
  return response
}
