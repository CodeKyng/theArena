import { useArena } from '../../app/arenaContext'
import DemoPersonaBar from '../../components/DemoPersonaBar'
import CommunitySection from '../../components/landing/CommunitySection'
import HeroSection from '../../components/landing/HeroSection'
import LandingFooter from '../../components/landing/LandingFooter'
import Newsletter from '../../components/landing/Newsletter'
import OpportunityHighlights from '../../components/landing/OpportunityHighlights'

export default function LandingPage() {
  const { flash } = useArena()

  return (
    <>
      <HeroSection />
      <OpportunityHighlights />
      <CommunitySection />
      <Newsletter flash={flash} />
      <LandingFooter />
      <DemoPersonaBar variant="footer" />
    </>
  )
}
