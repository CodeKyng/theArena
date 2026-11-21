import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ArenaProvider } from '../../app/ArenaProvider'
import { resetArenaStorage } from '../../services/arenaStore'
import AppLayout from '../../layouts/AppLayout'
import LandingPage from '../../pages/public/LandingPage'
import AuthPage from '../../pages/auth/AuthPage'
import HomePage from '../../pages/HomePage'
import MissionsPage from '../../pages/MissionsPage'
import MissionCreatePage from '../../pages/MissionCreatePage'
import HouseDetailPage from '../../pages/HouseDetailPage'
import ControlRoomPage from '../../pages/ControlRoomPage'

function renderAt(initialRoute: string) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ArenaProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route element={<AppLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/missions" element={<MissionsPage />} />
            <Route path="/missions/new" element={<MissionCreatePage />} />
            <Route path="/houses/:slug" element={<HouseDetailPage />} />
            <Route path="/control-room" element={<ControlRoomPage />} />
          </Route>
        </Routes>
      </ArenaProvider>
    </MemoryRouter>,
  )
}

describe('The Arena Frontend UI Smoke & Routing Tests', () => {
  beforeEach(() => {
    resetArenaStorage()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders LandingPage with 6 canonical Houses and Demo Persona Switcher', () => {
    renderAt('/')
    expect(screen.getByText(/Build what/i)).toBeTruthy()
    expect(screen.getByLabelText(/Switch Demo Persona/i)).toBeTruthy()
    expect(screen.getAllByText(/Forge Masters/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Echoes/i).length).toBeGreaterThan(0)
  })

  it('renders unified AuthPage without role split on signup', () => {
    renderAt('/register')
    expect(screen.getByText(/Join as a Spartan/i)).toBeTruthy()
    expect(screen.getByText(/Create Unified Spartan Account/i)).toBeTruthy()
    // Ensure no legacy Creator/Organisation account-type selector exists
    expect(screen.queryByText(/Select Account Role/i)).toBeNull()
  })

  it('switches Demo Persona via DemoPersonaBar and unlocks Control Room appropriately', () => {
    renderAt('/control-room')
    // Visitor cannot access Control Room
    expect(screen.getByText(/Sign in required for Control Room Administration/i)).toBeTruthy()

    // Switch persona to Marcus Vance (Control Room Admin)
    const select = screen.getByLabelText(/Switch Demo Persona/i)
    fireEvent.change(select, { target: { value: 'mem-marcus' } })

    // Control Room now renders governance tabs
    expect(screen.getByText(/Arena Control Room/i)).toBeTruthy()
    expect(screen.getByText(/Members, Ascendancy & RBAC/i)).toBeTruthy()
    expect(screen.getByText(/Configurable Rules/i)).toBeTruthy()
  })

  it('shows House Echoes cross-House outreach capability & anti-farming policy on /houses/echoes', () => {
    renderAt('/houses/echoes')
    expect(screen.getByText(/CANONICAL HOUSE \+ CROSS-HOUSE CAPABILITY/i)).toBeTruthy()
    expect(screen.getByText(/anti-engagement-farming policy/i)).toBeTruthy()
  })

  it('renders 7-step Mission Creation Wizard when switched to Jordan Davis', () => {
    renderAt('/missions/new')
    const select = screen.getByLabelText(/Switch Demo Persona/i)
    fireEvent.change(select, { target: { value: 'mem-jordan' } })

    expect(screen.getByText(/Create a Mission/i)).toBeTruthy()
    expect(screen.getByText(/1\. Purpose & House/i)).toBeTruthy()
    expect(screen.getByText(/7\. Review & Publish/i)).toBeTruthy()
  })
})

