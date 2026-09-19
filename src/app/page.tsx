import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import HeroSection from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import CourseTopicsSection from '@/components/landing/CourseTopicsSection'
import CTASection from '@/components/landing/CTASection'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CourseTopicsSection />
      <CTASection />
      <Footer />
    </main>
  )
}
