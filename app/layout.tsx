import type { Metadata } from "next"
import { Inter, Fraunces } from "next/font/google"
import "./globals.css"
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll"
import { CursorGlow } from "@/components/providers/cursor-glow"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
})

export const metadata: Metadata = {
  title: "InsideOutMed — Análisis Facial con IA Médica",
  description:
    "Análisis visual de 12 biomarcadores de piel. Sin agujas, sin esperas. Tu plan personalizado en menos de 60 segundos.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        <SmoothScrollProvider>
          <CursorGlow />
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  )
}
