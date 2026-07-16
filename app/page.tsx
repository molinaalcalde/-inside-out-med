import { Nav } from "@/components/landing/nav"
import { Hero } from "@/components/landing/hero"
import { FaceScrollSection } from "@/components/landing/face-scroll"
import { Stats } from "@/components/landing/stats"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Testimonials } from "@/components/landing/testimonials"
import { CTA } from "@/components/landing/cta"
import { Footer } from "@/components/landing/footer"

export default function Home() {
  return (
    <main style={{ background: "#0e0c12", minHeight: "100vh" }}>
      <Nav />
      <Hero />
      <FaceScrollSection />
      <Stats />
      <HowItWorks />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  )
}
