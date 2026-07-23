import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { analyticsData } = await req.json()

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        insights: [{
          title: "API Key no configurada",
          finding: "Agrega ANTHROPIC_API_KEY en las variables de entorno de Vercel para activar insights con IA.",
          recommendation: "Ve a Vercel -> Settings -> Environment Variables -> agrega ANTHROPIC_API_KEY",
          confidence: "--"
        }]
      })
    }

    const prompt = `Eres un dermatologo y data scientist analizando datos agregados de ${analyticsData.totalLeads} pacientes de una app de analisis facial.

Datos agregados:
- Total pacientes analizados: ${analyticsData.totalScans}
- Score promedio de salud facial: ${analyticsData.avgScore}/100
- Edad aparente promedio: ${analyticsData.avgApparentAge} anos
- Biomarcadores promedio: ${JSON.stringify(analyticsData.bioAvgs)}
- Top 3 problemas mas comunes: ${JSON.stringify(analyticsData.topWeaknesses)}
- Correlacion estres alto -> inflamacion: ${analyticsData.correlations?.stressInflammation}%
- Usuarios con poco sueno: ${analyticsData.correlations?.sleepIssues}
- Usuarios con alta exposicion solar: ${analyticsData.correlations?.sunExposure}

Genera exactamente 5 insights en formato JSON array. Cada insight debe tener:
- "title": titulo corto (max 8 palabras)
- "finding": hallazgo basado en los datos (1-2 oraciones)
- "recommendation": recomendacion accionable para el equipo medico (1-2 oraciones)
- "confidence": "alta", "media" o "baja" segun la cantidad de datos

Responde SOLO con el JSON array, sin markdown ni explicaciones.`

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`)
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || "[]"

    // Parse JSON from response
    let insights
    try {
      insights = JSON.parse(text)
    } catch {
      // Try to extract JSON from the text
      const match = text.match(/\[[\s\S]*\]/)
      insights = match ? JSON.parse(match[0]) : []
    }

    return NextResponse.json({ insights })
  } catch (err) {
    console.error("AI insights error:", err)
    return NextResponse.json({
      insights: [{
        title: "Error al generar insights",
        finding: String(err),
        recommendation: "Verifica la API key y vuelve a intentar.",
        confidence: "--"
      }]
    })
  }
}
