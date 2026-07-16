import type { Metadata } from "next"
import { Fraunces, Inter } from "next/font/google"
import "./globals.css"
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll"
import { CursorGlow } from "@/components/providers/cursor-glow"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
})

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "InsideOutMed — Análisis facial inteligente",
  description:
    "Descubre lo que tu piel dice sobre tu salud interior. Análisis facial con IA médica en segundos.",
  keywords: ["análisis facial", "skincare", "IA médica", "biomarcadores", "dermatología"],
  openGraph: {
    title: "InsideOutMed — Análisis facial inteligente",
    description: "Tu piel tiene una historia. Nosotros la leemos.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${fraunces.variable}`}
      style={{ background: "#0e0c12" }}
    >
      <body className="grain">
        <SmoothScrollProvider>
          <CursorGlow />
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  )
}
