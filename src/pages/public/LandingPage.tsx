import { useAppState } from '../../app/appStateContext'
import HeroSection from '../../components/landing/HeroSection'
import OpportunityHighlights from '../../components/landing/OpportunityHighlights'
import CommunitySection from '../../components/landing/CommunitySection'
import Newsletter from '../../components/landing/Newsletter'
import LandingFooter from '../../components/landing/LandingFooter'

export default function LandingPage() {
  const { flash } = useAppState()
  return <>
    <HeroSection />
    <OpportunityHighlights />
    <CommunitySection />
    <Newsletter flash={flash} />
    <LandingFooter />
  </>
}
