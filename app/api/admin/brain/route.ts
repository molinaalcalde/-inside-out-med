import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const { data: papers, error } = await supabase
      .from("papers")
      .select("*")
      .order("year", { ascending: false })

    if (error) {
      return NextResponse.json({ papers: [], error: error.message })
    }

    return NextResponse.json({ papers: papers || [] })
  } catch {
    return NextResponse.json({ papers: [] })
  }
}

export async function POST(req: Request) {
  try {
    const paper = await req.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const { error } = await supabase
      .from("papers")
      .upsert({
        id: paper.id?.startsWith("seed-") ? undefined : paper.id,
        title: paper.title,
        authors: paper.authors,
        year: paper.year,
        journal: paper.journal,
        doi: paper.doi,
        key_findings: paper.key_findings,
        applicable_zones: paper.applicable_zones,
        applicable_treatments: paper.applicable_treatments,
        tags: paper.tags,
        full_citation: paper.full_citation,
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 200 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
