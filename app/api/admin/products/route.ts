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
      .from("products")
      .select("*")
      .order("phase", { ascending: true })

    if (error) return NextResponse.json({ products: [], error: error.message })
    return NextResponse.json({ products: data || [] })
  } catch {
    return NextResponse.json({ products: [] })
  }
}

export async function POST(req: Request) {
  try {
    const product = await req.json()
    const row = {
      id: product.id?.startsWith("prod-") ? undefined : product.id,
      name: product.name,
      category: product.category,
      tier: product.tier,
      min_age: product.minAge,
      phase: product.phase,
      timing: product.timing || null,
      what: product.what,
      cost: product.cost,
      freq: product.freq,
      results: product.results,
      risk: product.risk,
      evidence: product.evidence,
      amazon_query: product.amazonQuery || null,
      always30: product.always30 || false,
      fitz_caution: product.fitzCaution || false,
      is_new: product.isNew || false,
      problems: product.problems || [],
    }

    const { error } = await supabase().from("products").upsert(row)
    if (error) return NextResponse.json({ error: error.message })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()
    const { error } = await supabase().from("products").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
