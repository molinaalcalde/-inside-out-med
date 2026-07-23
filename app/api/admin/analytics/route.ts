import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Fetch all leads with scan data
    const { data: leads } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500)

    if (!leads || leads.length === 0) {
      return NextResponse.json({ totalLeads: 0, analytics: null })
    }

    const withScans = leads.filter((l: any) => l.scan_data?.overall)
    const profiles = leads.filter((l: any) => l.profile_data)

    // Aggregate biomarker averages
    const bioKeys = ["luminosity", "hydration", "uniformity", "glycation", "inflammation", "sunDamage", "vascularity"]
    const bioAvgs: Record<string, number> = {}
    for (const key of bioKeys) {
      const values = withScans.map((l: any) => l.scan_data?.[key]).filter((v: any) => typeof v === "number")
      bioAvgs[key] = values.length > 0 ? Math.round(values.reduce((a: number, b: number) => a + b, 0) / values.length) : 0
    }

    // Age distribution
    const ages = withScans.map((l: any) => l.scan_data?.ageApparent).filter(Boolean)
    const avgApparentAge = ages.length > 0 ? Math.round(ages.reduce((a: number, b: number) => a + b, 0) / ages.length) : 0

    // Score distribution
    const scores = withScans.map((l: any) => l.scan_data?.overall).filter(Boolean)
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0

    // Lifestyle correlations
    const stressHigh = profiles.filter((l: any) => l.profile_data?.stress === "alto")
    const stressHighInflammation = stressHigh.filter((l: any) => l.scan_data?.inflammation > 30)

    const sleepLow = profiles.filter((l: any) => l.profile_data?.sleep === "<5h" || l.profile_data?.sleep === "5-6h")
    const sunHigh = profiles.filter((l: any) => l.profile_data?.sun === "alta")

    // Funnel conversion
    const funnelStages = ["started", "quiz_complete", "scan_started", "scan_complete", "contact_complete", "results_viewed", "full_results_viewed", "plan_viewed"]
    const funnelCounts: Record<string, number> = {}
    for (const stage of funnelStages) {
      funnelCounts[stage] = leads.filter((l: any) => funnelStages.indexOf(l.funnel_stage) >= funnelStages.indexOf(stage)).length
    }

    // Top 3 worst biomarkers
    const bioRanked = Object.entries(bioAvgs)
      .map(([key, val]) => ({
        key,
        displayValue: ["glycation", "inflammation", "sunDamage", "vascularity"].includes(key) ? 100 - val : val
      }))
      .sort((a, b) => a.displayValue - b.displayValue)
      .slice(0, 3)

    return NextResponse.json({
      totalLeads: leads.length,
      totalScans: withScans.length,
      avgScore,
      avgApparentAge,
      bioAvgs,
      topWeaknesses: bioRanked,
      correlations: {
        stressInflammation: stressHigh.length > 0 ? Math.round(stressHighInflammation.length / stressHigh.length * 100) : null,
        sleepIssues: sleepLow.length,
        sunExposure: sunHigh.length,
      },
      funnelCounts,
    })
  } catch (err) {
    console.error("Analytics error:", err)
    return NextResponse.json({ totalLeads: 0, analytics: null })
  }
}
