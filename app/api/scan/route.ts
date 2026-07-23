import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { sessionId, email, scores, profile } = body

    if (!scores || !email) {
      return NextResponse.json({ error: "Missing scores or email" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Find or create lead by email
    const { data: lead } = await supabase
      .from("leads")
      .select("id")
      .eq("email", email)
      .single()

    const leadId = lead?.id || sessionId

    // Insert scan record
    const { data: scan, error } = await supabase
      .from("scans")
      .insert({
        user_id: leadId,
        scan_date: new Date().toISOString(),
        overall: scores.overall,
        visible_age: scores.ageApparent,
        age_delta: (scores.ageApparent || 0) - (parseInt(profile?.age) || 30),
        symmetry: scores.symmetry,
        zones: scores.zoneScores || {},
        bio: {
          luminosity: scores.luminosity,
          hydration: scores.hydration,
          uniformity: scores.uniformity,
          glycation: scores.glycation,
          inflammation: scores.inflammation,
          sunDamage: scores.sunDamage,
          vascularity: scores.vascularity,
          texture: scores.texture,
          wrinkleDepth: scores.wrinkleDepth,
          darkCircles: scores.darkCircles,
        },
        quality: 80,
        samples: 90,
      })
      .select("id")
      .single()

    if (error) {
      console.error("Scan save error:", error)
      // Don't fail the user experience — just log
      return NextResponse.json({ saved: false, error: error.message })
    }

    return NextResponse.json({ saved: true, scanId: scan?.id })
  } catch (err) {
    console.error("Scan API error:", err)
    return NextResponse.json({ saved: false })
  }
}

// GET: Fetch scan history by email
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ scans: [] })
    }

    const supabase = createAdminClient()

    // Find lead by email
    const { data: lead } = await supabase
      .from("leads")
      .select("id")
      .eq("email", email)
      .single()

    if (!lead) {
      return NextResponse.json({ scans: [] })
    }

    // Fetch scans for this lead
    const { data: scans } = await supabase
      .from("scans")
      .select("id, scan_date, overall, visible_age, age_delta, symmetry, bio, zones")
      .eq("user_id", lead.id)
      .order("scan_date", { ascending: false })
      .limit(20)

    return NextResponse.json({ scans: scans || [] })
  } catch {
    return NextResponse.json({ scans: [] })
  }
}
