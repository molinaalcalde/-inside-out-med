import { NextResponse } from "next/server"

export async function GET() {
  // For now, return empty — localStorage is primary storage
  return NextResponse.json({ products: [] })
}

export async function POST(req: Request) {
  // For future Supabase integration
  const body = await req.json()
  return NextResponse.json({ saved: true })
}
