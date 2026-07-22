import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { session_id, name, age, email, phone, profileData, scanData, planData, funnelStage } = body

    if (!session_id) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    // Upsert lead by session_id
    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq("session_id", session_id)
      .limit(1)
      .single()

    const leadData: Record<string, unknown> = { session_id }
    if (name !== undefined) leadData.name = name
    if (age !== undefined) leadData.age = age
    if (email !== undefined) leadData.email = email
    if (phone !== undefined) leadData.phone = phone
    if (profileData !== undefined) leadData.profile_data = profileData
    if (scanData !== undefined) leadData.scan_data = scanData
    if (planData !== undefined) leadData.plan_data = planData
    if (funnelStage !== undefined) leadData.funnel_stage = funnelStage

    if (existing?.id) {
      await supabase.from("leads").update(leadData).eq("id", existing.id)
    } else {
      await supabase.from("leads").insert(leadData)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
