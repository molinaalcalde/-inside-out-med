import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function GET() {
  try {
    const { data, error } = await supabase()
      .from("referrals")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ referrals: [], error: error.message })
    return NextResponse.json({ referrals: data || [] })
  } catch {
    return NextResponse.json({ referrals: [] })
  }
}

export async function POST(req: Request) {
  try {
    const r = await req.json()
    const row = {
      id: r.id?.startsWith("ref-") ? undefined : r.id,
      name: r.name,
      code: r.code,
      amazon_tag: r.amazonTag,
      active: r.active ?? true,
    }

    const { error } = await supabase().from("referrals").upsert(row)
    if (error) return NextResponse.json({ error: error.message })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()
    const { error } = await supabase().from("referrals").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
