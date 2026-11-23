import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../../App'
import { ARENA_STORAGE_KEY, loadSidebarCollapsed, resetArenaStorage } from '../../services/arenaStore'

function renderApp(initialRoute: string) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>,
  )
}

function signInDemoUser(namePattern: RegExp) {
  fireEvent.click(screen.getByRole('button', { name: namePattern }))
}

function renderAuthenticatedAt(initialRoute: string, demoNamePattern: RegExp = /Jordan Davis/i) {
  const view = renderApp(initialRoute)
  signInDemoUser(demoNamePattern)
  return view
}

describe('The Arena Frontend Auth, Access Control & UI Tests', () => {
  beforeEach(() => {
    window.localStorage.clear()
    resetArenaStorage()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders public LandingPage with preserved navigation links, no DemoPersonaBar, and no Cmd+K search modal', () => {
    renderApp('/')
    expect(screen.getByText(/Build what/i)).toBeTruthy()
    expect(screen.getAllByText(/Forge Masters/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Echoes/i).length).toBeGreaterThan(0)

    // Landing navigation links remain visible and intact
    const landingNav = screen.getByRole('navigation', { name: /Landing navigation/i })
    for (const label of ['Houses', 'Missions', 'Explore', 'Academy', 'Events']) {
      expect(within(landingNav).getByRole('link', { name: label })).toBeTruthy()
    }

    // No DemoPersonaBar or Workspace Sidebar on Landing
    expect(screen.queryByLabelText(/Switch Demo Persona/i)).toBeNull()
    expect(screen.queryByLabelText(/Primary Arena navigation/i)).toBeNull()

    // Cmd/Ctrl+K does not open Global Search while unauthenticated
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(screen.queryByRole('dialog', { name: /Global Arena Search/i })).toBeNull()
  })

  it('redirects unauthenticated Enter The Arena CTA and landing links to /login preserving intended destination', () => {
    renderApp('/')
    fireEvent.click(screen.getByRole('link', { name: /Enter The Arena/i }))
    expect(screen.getByRole('heading', { name: /Welcome back\./i })).toBeTruthy()
    signInDemoUser(/Jordan Davis/i)
    expect(screen.getByRole('heading', { name: /^Dashboard\.?$/i })).toBeTruthy()

    cleanup()
    resetArenaStorage()
    renderApp('/')
    const landingNav = screen.getByRole('navigation', { name: /Landing navigation/i })
    fireEvent.click(within(landingNav).getByRole('link', { name: 'Explore' }))
    expect(screen.getByRole('heading', { name: /Welcome back\./i })).toBeTruthy()

    // Signing in via email form returns to preserved /explore destination
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'jordan.davis@arena.demo' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign in to Workspace/i }))
    expect(screen.getByRole('heading', { name: /Explore The Arena/i })).toBeTruthy()
  })

  it('blocks direct unauthenticated access to protected routes, preserves query+hash across login/signup, and isolates 404', () => {
    // 1. Direct protected route redirects to /login without rendering Sidebar or DemoPersonaBar
    for (const route of ['/dashboard', '/home', '/onboarding', '/explore', '/missions/new', '/profile', '/control-room', '/discover']) {
      renderApp(route)
      expect(screen.getByRole('heading', { name: /Welcome back\./i })).toBeTruthy()
      expect(screen.queryByLabelText(/Primary Arena navigation/i)).toBeNull()
      expect(screen.queryByLabelText(/Switch Demo Persona/i)).toBeNull()
      cleanup()
    }

    // 2. Deep-link query+hash preservation across login -> register toggle
    renderApp('/explore?tab=discussions#thread-1')
    expect(screen.getByRole('heading', { name: /Welcome back\./i })).toBeTruthy()
    fireEvent.click(screen.getByRole('link', { name: /Create a unified account/i }))
    expect(screen.getByText(/Join as a Spartan/i)).toBeTruthy()
    fireEvent.change(screen.getByLabelText(/Display Name/i), { target: { value: 'Samira Patel' } })
    fireEvent.change(screen.getByLabelText(/Arena Handle/i), { target: { value: 'samira.patel' } })
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'samira@arena.demo' } })
    fireEvent.click(screen.getByRole('button', { name: /Create Unified Spartan Account/i }))
    expect(screen.getByRole('heading', { name: /Explore The Arena/i })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /Discussions/i }).getAttribute('aria-selected')).toBe('true')
    cleanup()
    resetArenaStorage()

    // 3. Unknown route while unauthenticated exposes only Landing & Sign in, never Dashboard or Sidebar
    renderApp('/unknown-nonexistent-page')
    expect(screen.getByText(/PAGE NOT FOUND/i)).toBeTruthy()
    expect(screen.queryByLabelText(/Primary Arena navigation/i)).toBeNull()
    expect(screen.queryByLabelText(/Switch Demo Persona/i)).toBeNull()
    expect(screen.queryByRole('link', { name: /Go to Dashboard/i })).toBeNull()
    expect(screen.getByRole('link', { name: /Back to Landing/i })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Sign in/i })).toBeTruthy()
  })

  it('supports unified AuthPage signup via /signup redirect and redirects already-authenticated users away from /login', () => {
    renderApp('/signup')
    expect(screen.getByText(/Join as a Spartan/i)).toBeTruthy()
    expect(screen.getByText(/Create Unified Spartan Account/i)).toBeTruthy()
    expect(screen.queryByText(/Select Account Role/i)).toBeNull()

    signInDemoUser(/Jordan Davis/i)
    expect(screen.getByRole('heading', { name: /^Dashboard\.?$/i })).toBeTruthy()
    cleanup()

    // Remounting directly at /login while session is persisted redirects to /dashboard
    renderApp('/login')
    expect(screen.getByRole('heading', { name: /^Dashboard\.?$/i })).toBeTruthy()
  })

  it('rejects tampered visitor session in localStorage across reload', () => {
    resetArenaStorage()
    const raw = JSON.parse(window.localStorage.getItem(ARENA_STORAGE_KEY)!)
    raw.currentMemberId = 'mem-jordan'
    raw.members = raw.members.map((m: { id: string; membershipStatus: string }) =>
      m.id === 'mem-jordan' ? { ...m, membershipStatus: 'visitor' } : m,
    )
    window.localStorage.setItem(ARENA_STORAGE_KEY, JSON.stringify(raw))

    renderApp('/dashboard')
    expect(screen.getByRole('heading', { name: /Welcome back\./i })).toBeTruthy()
    expect(screen.queryByLabelText(/Primary Arena navigation/i)).toBeNull()
  })

  it('switches Spartan Demo Persona via authenticated DemoPersonaBar (excluding Visitor) and unlocks Control Room appropriately', () => {
    renderAuthenticatedAt('/control-room', /Jordan Davis/i)
    expect(screen.getByText(/Permission required: Control Room Administration/i)).toBeTruthy()

    const select = screen.getByLabelText(/Switch Demo Persona/i) as HTMLSelectElement
    // Visitor option is not selectable in authenticated DemoPersonaBar
    expect(within(select).queryByRole('option', { name: /Visitor/i })).toBeNull()

    fireEvent.change(select, { target: { value: 'mem-marcus' } })
    expect(screen.getByText(/Arena Control Room/i)).toBeTruthy()
    expect(screen.getByText(/Members, Ascendancy & RBAC/i)).toBeTruthy()
    expect(screen.getByText(/Configurable Rules/i)).toBeTruthy()
  })

  it('shows House Echoes cross-House outreach capability & anti-farming policy on /houses/echoes after login', () => {
    renderAuthenticatedAt('/houses/echoes', /Jordan Davis/i)
    expect(screen.getByText(/CANONICAL HOUSE \+ CROSS-HOUSE CAPABILITY/i)).toBeTruthy()
    expect(screen.getByText(/anti-engagement-farming policy/i)).toBeTruthy()
  })

  it('renders 7-step Mission Creation Wizard and enforces sequential step validation', () => {
    renderAuthenticatedAt('/missions/new', /Jordan Davis/i)

    expect(screen.getByText(/Create a Mission/i)).toBeTruthy()
    expect(screen.getByText(/1\. Purpose & House/i)).toBeTruthy()
    expect(screen.getByText(/7\. Review & Publish/i)).toBeTruthy()

    // Jumping ahead to Step 7 while Step 1 is incomplete must be blocked
    fireEvent.click(screen.getByRole('button', { name: /7\. Review & Publish/i }))
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByPlaceholderText(/Deterministic Proof-of-Work Diff Checker/i)).toBeTruthy()

    // Filling Step 1 allows advancing cleanly to Step 2 and preserving inputs on back navigation
    fireEvent.change(screen.getByPlaceholderText(/Deterministic Proof-of-Work Diff Checker/i), {
      target: { value: 'Deterministic Test Mission' },
    })
    fireEvent.change(screen.getByPlaceholderText(/Clear overview of the problem/i), {
      target: { value: 'Verify deterministic wizard step progression.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }))
    expect(screen.getByLabelText(/Mission Category/i)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Previous Step/i }))
    expect((screen.getByPlaceholderText(/Deterministic Proof-of-Work Diff Checker/i) as HTMLInputElement).value).toBe(
      'Deterministic Test Mission',
    )

    // Saving as Draft succeeds and navigates to detail view
    fireEvent.click(screen.getByRole('button', { name: /Save as Draft \(0 XP\)/i }))
    expect(screen.getByText(/Deterministic Test Mission/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Publish & Reserve XP/i })).toBeTruthy()
  })

  it('connects Explore People tab CTA to Edit Profile instead of Opportunity modal', () => {
    renderAuthenticatedAt('/explore?tab=people', /Jordan Davis/i)

    expect(screen.queryByText(/Add to people/i)).toBeNull()
    const editButtons = screen.getAllByRole('button', { name: /Edit Profile/i })
    expect(editButtons.length).toBeGreaterThan(0)
    fireEvent.click(editButtons[0])
    expect(screen.getByRole('heading', { name: /Edit Public Spartan Identity/i })).toBeTruthy()
  })

  it('restricts Events Steward Check-In controls to authorised RBAC holders only', () => {
    renderAuthenticatedAt('/events', /Jordan Davis/i)
    const select = screen.getByLabelText(/Switch Demo Persona/i)

    // Ordinary member (Jordan) sees RSVP but not Steward Check-In controls
    expect(screen.queryByText(/Steward Check-In \(Simulated\)/i)).toBeNull()
    expect(screen.queryByRole('button', { name: /Mark Verified/i })).toBeNull()

    // Authorised event manager (Maya) sees Steward Check-In controls
    fireEvent.change(select, { target: { value: 'mem-maya' } })
    expect(screen.getAllByText(/Steward Check-In \(Simulated\)/i).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /Mark Verified \(Simulated\)/i }).length).toBeGreaterThan(0)
  })

  it('scopes Sidebar Missions review badge only to submissions the current user can review', () => {
    renderAuthenticatedAt('/dashboard', /Alex Mercer/i)
    const select = screen.getByLabelText(/Switch Demo Persona/i)

    const getMissionsNavText = () => {
      const link = screen.getByRole('link', { name: /^Missions/i })
      return link.textContent ?? ''
    }

    // New Spartan (Alex) cannot review seeded submissions -> badge omitted
    expect(getMissionsNavText()).toBe('Missions')

    // Authorised reviewer (Jordan / Maya) sees 1 reviewable pending submission
    fireEvent.change(select, { target: { value: 'mem-jordan' } })
    expect(getMissionsNavText()).toContain('1')
  })

  it('renders sequential 5-step onboarding on Dashboard without duplicate mission panels or Academy notification clutter', () => {
    renderAuthenticatedAt('/home', /Alex Mercer/i)

    const onboarding = screen.getByLabelText(/New Spartan Onboarding Checklist/i)
    expect(within(onboarding).getByText('0 / 5 completed')).toBeTruthy()
    expect(within(onboarding).getByText(/1\. Orientation & Rules Check/i)).toBeTruthy()
    expect(within(onboarding).getByText(/2\. Choose Your Houses/i)).toBeTruthy()
    expect(within(onboarding).getByText(/3\. Complete Your Profile/i)).toBeTruthy()
    expect(within(onboarding).getByText(/4\. Start in the Academy/i)).toBeTruthy()
    expect(within(onboarding).getByText(/5\. Join the Intro Mission/i)).toBeTruthy()

    // Step 2: saving Primary House increments progress to 1 / 5 completed
    const primarySelect = within(onboarding).getByLabelText(/Primary House/i)
    fireEvent.change(primarySelect, { target: { value: 'forge-masters' } })
    fireEvent.click(within(onboarding).getByRole('button', { name: /Save Houses/i }))
    expect(within(onboarding).getByText('1 / 5 completed')).toBeTruthy()

    // Completing Step 1 increments progress to 2 / 5 completed while keeping checklist visible until 5/5
    fireEvent.click(within(onboarding).getByRole('button', { name: /Complete \(\+20 XP\)/i }))
    expect(screen.getByLabelText(/New Spartan Onboarding Checklist/i)).toBeTruthy()
    expect(within(screen.getByLabelText(/New Spartan Onboarding Checklist/i)).getByText('2 / 5 completed')).toBeTruthy()

    // Duplicate Active House Missions panel is removed; Recent Notifications appears in its own panel
    expect(screen.queryByText(/Active House Missions/i)).toBeNull()
    expect(screen.getByLabelText(/Recent notifications/i)).toBeTruthy()
  })

  it('syncs ProfilePage form fields when switching Demo Personas', () => {
    renderAuthenticatedAt('/profile', /Jordan Davis/i)
    const select = screen.getByLabelText(/Switch Demo Persona/i)

    expect((screen.getByLabelText(/Display Name/i) as HTMLInputElement).value).toBe('Jordan Davis')

    fireEvent.change(select, { target: { value: 'mem-maya' } })
    expect((screen.getByLabelText(/Display Name/i) as HTMLInputElement).value).toBe('Maya Kim')
  })

  it('blocks MissionCreatePage Step 5 progression when maxContributors exceeds participant capacity', () => {
    renderAuthenticatedAt('/missions/new', /Jordan Davis/i)

    fireEvent.change(screen.getByPlaceholderText(/Deterministic Proof-of-Work Diff Checker/i), {
      target: { value: 'Capacity Validation Mission' },
    })
    fireEvent.change(screen.getByPlaceholderText(/Clear overview of the problem/i), {
      target: { value: 'Ensure contributor count cannot exceed participant capacity.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }))

    // Step 2: set participant capacity to 1
    fireEvent.change(screen.getByLabelText(/Participant Capacity/i), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }))
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }))
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }))

    // Step 5: default maxContributors is 2 > capacity 1
    expect(screen.getByText(/exceeds participant capacity \(1\)/i)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }))
    expect(screen.getByRole('alert').textContent).toMatch(/cannot exceed participant capacity/i)
  })

  it('gates Discussion creation in Explore and Quick Create at Level 15 while keeping replies open below Level 15', () => {
    renderAuthenticatedAt('/explore?tab=discussions', /Maya Kim/i)
    const select = screen.getByLabelText(/Switch Demo Persona/i)

    // Level 14 (Maya) cannot start a new discussion
    const startBtnBlocked = screen.getByRole('button', { name: /Start Discussion/i }) as HTMLButtonElement
    expect(startBtnBlocked.disabled).toBe(true)
    expect(screen.getByText(/Discussion creation unlocks at Level 15/i)).toBeTruthy()

    // Level 1 Spartan (Alex) can still reply to an existing discussion
    fireEvent.change(select, { target: { value: 'mem-newbie' } })
    const replyInputs = screen.getAllByPlaceholderText(/Write a constructive reply/i)
    fireEvent.change(replyInputs[0], { target: { value: 'Great discussion point from a Level 1 Spartan.' } })
    fireEvent.click(screen.getAllByRole('button', { name: /Reply/i })[0])
    expect(screen.getByText(/Great discussion point from a Level 1 Spartan\./i)).toBeTruthy()

    // Level 17 (Elena) can open Quick Create Discussion and publish
    fireEvent.change(select, { target: { value: 'mem-elena' } })
    const startBtnAllowed = screen.getByRole('button', { name: /Start Discussion/i }) as HTMLButtonElement
    expect(startBtnAllowed.disabled).toBe(false)
    fireEvent.click(startBtnAllowed)

    const modal = screen.getByRole('dialog', { name: /Quick Create in The Arena/i })
    fireEvent.change(within(modal).getByPlaceholderText(/Enter discussion title/i), {
      target: { value: 'Level 17 Verification Proposal' },
    })
    fireEvent.change(within(modal).getByPlaceholderText(/Add clear details for members/i), {
      target: { value: 'Testing discussion creation unlock at Level 15+.' },
    })
    fireEvent.click(within(modal).getByRole('button', { name: /Publish discussion/i }))
    expect(screen.getByText(/Level 17 Verification Proposal/i)).toBeTruthy()
  })

  it('supports sidebar header search, full desktop collapse persistence, and clickable breadcrumbs', () => {
    renderAuthenticatedAt('/missions/new', /Jordan Davis/i)

    // Sidebar header Search opens Global Search modal
    const sidebar = screen.getByLabelText(/Primary Arena navigation/i)
    const sidebarSearchBtn = within(sidebar).getByRole('button', { name: /^Search$/i })
    fireEvent.click(sidebarSearchBtn)
    expect(screen.getByRole('dialog', { name: /Global Arena Search/i })).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Escape' })

    // Collapsing sidebar persists collapsed state and exposes Topbar Expand + Search controls
    const collapseBtn = within(sidebar).getByRole('button', { name: /Collapse sidebar/i })
    fireEvent.click(collapseBtn)
    expect(loadSidebarCollapsed()).toBe(true)
    const banner = screen.getByRole('banner')
    const expandBtn = within(banner).getByRole('button', { name: /Expand sidebar/i })
    expect(expandBtn).toBeTruthy()
    expect(within(banner).getByRole('button', { name: /^Search$/i })).toBeTruthy()
    fireEvent.click(expandBtn)
    expect(loadSidebarCollapsed()).toBe(false)

    // Clicking Missions parent segment in Breadcrumb navigates to /missions
    const breadcrumbNav = screen.getByRole('navigation', { name: /Breadcrumb/i })
    fireEvent.click(within(breadcrumbNav).getByRole('link', { name: /Missions/i }))
    expect(screen.getByRole('heading', { name: /Missions/i })).toBeTruthy()
  })

  it('closes Topbar notification popover on Escape/outside click and opens dedicated /notifications page', () => {
    renderAuthenticatedAt('/dashboard', /Jordan Davis/i)

    const bellBtn = screen.getByRole('button', { name: /Notifications/i })
    fireEvent.click(bellBtn)
    expect(screen.getByRole('region', { name: /^Notifications$/i })).toBeTruthy()

    // Escape closes popover
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('region', { name: /^Notifications$/i })).toBeNull()

    // Reopen and outside click closes popover
    fireEvent.click(bellBtn)
    expect(screen.getByRole('region', { name: /^Notifications$/i })).toBeTruthy()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('region', { name: /^Notifications$/i })).toBeNull()

    // Reopen and navigate to /notifications via footer link
    fireEvent.click(bellBtn)
    fireEvent.click(screen.getByRole('link', { name: /View all notifications/i }))
    expect(screen.getByRole('heading', { name: /^Notifications\.?$/i })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /Announcements/i })).toBeTruthy()
  })

  it('opens 5-item Account Menu, links Personalization/Settings/Help, and Log out revokes access across navigation and reload', () => {
    renderAuthenticatedAt('/profile', /Jordan Davis/i)

    // ProfilePage no longer contains an Account Settings tab
    expect(screen.queryByRole('tab', { name: /Account Settings/i })).toBeNull()

    const sidebar = screen.getByLabelText(/Primary Arena navigation/i)
    const accountTrigger = within(sidebar).getByRole('button', { name: /Account menu/i })
    fireEvent.click(accountTrigger)

    const menu = screen.getByRole('menu', { name: /Account menu/i })
    const items = within(menu).getAllByRole('menuitem')
    expect(items.map((el) => el.textContent?.trim())).toEqual([
      'Profile',
      'Personalization',
      'Settings',
      'Help',
      'Log out',
    ])

    // Navigate to Personalization and save custom interest
    fireEvent.click(within(menu).getByRole('menuitem', { name: /Personalization/i }))
    expect(screen.getByRole('heading', { name: /^Personalization\.?$/i })).toBeTruthy()
    fireEvent.change(screen.getByLabelText(/Custom interests/i), {
      target: { value: 'Protocol Security' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Add Interest/i }))
    fireEvent.click(screen.getByRole('button', { name: /Save Interests/i }))
    expect(screen.getByText(/Protocol Security/i)).toBeTruthy()

    // Navigate to Settings via Account Menu and check all 5 privacy toggles
    fireEvent.click(within(sidebar).getByRole('button', { name: /Account menu/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Settings/i }))
    expect(screen.getByRole('heading', { name: /^Settings\.?$/i })).toBeTruthy()
    expect(screen.getByText(/Show verified contributions publicly/i)).toBeTruthy()
    expect(screen.getByText(/Email digest notifications/i)).toBeTruthy()

    // Navigate to Help via Account Menu
    fireEvent.click(within(sidebar).getByRole('button', { name: /Account menu/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Help/i }))
    expect(screen.getByRole('heading', { name: /Help & Arena Guide/i })).toBeTruthy()
    expect(screen.getByText(/Discussions Unlock at Level 15/i)).toBeTruthy()

    // Log out clears active member and activeOrganisationId, closes workspace UI, and lands on '/'
    fireEvent.click(within(sidebar).getByRole('button', { name: /Account menu/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Log out/i }))
    expect(screen.getByText(/Build what/i)).toBeTruthy()
    expect(screen.queryByLabelText(/Switch Demo Persona/i)).toBeNull()

    // Clicking Enter The Arena or navigating to /dashboard after logout redirects to /login (and stays unauthenticated on reload)
    fireEvent.click(screen.getByRole('link', { name: /Enter The Arena/i }))
    expect(screen.getByRole('heading', { name: /Welcome back\./i })).toBeTruthy()
    cleanup()
    renderApp('/dashboard')
    expect(screen.getByRole('heading', { name: /Welcome back\./i })).toBeTruthy()
  })

  it('renders dynamic Sidebar XP progression card with explicit XP left to next level per persona', () => {
    renderAuthenticatedAt('/dashboard', /Alex Mercer/i)
    const select = screen.getByLabelText(/Switch Demo Persona/i)
    const sidebar = screen.getByLabelText(/Primary Arena navigation/i)

    // New Spartan (Alex): Level 1, 0 Lifetime XP -> 100 XP left to Level 2
    const xpCardNewbie = within(sidebar).getByLabelText(/XP Progression/i)
    expect(within(xpCardNewbie).getByText(/LEVEL 1/i)).toBeTruthy()
    expect(within(xpCardNewbie).getByText(/0 Lifetime XP/i)).toBeTruthy()
    expect(within(xpCardNewbie).getByText(/100 XP left to Level 2/i)).toBeTruthy()

    // Elder (Elena): Level 17, 7,800 Lifetime XP -> 700 XP left to Level 18
    fireEvent.change(select, { target: { value: 'mem-elena' } })
    const xpCardElena = within(sidebar).getByLabelText(/XP Progression/i)
    expect(within(xpCardElena).getByText(/LEVEL 17/i)).toBeTruthy()
    expect(within(xpCardElena).getByText(/7,800 Lifetime XP/i)).toBeTruthy()
    expect(within(xpCardElena).getByText(/700 XP left to Level 18/i)).toBeTruthy()
  })

  it('renders restructured Dashboard with exact 6 Quick Actions, no Mission quick action, and separate Notifications vs Announcements', () => {
    renderAuthenticatedAt('/dashboard', /Maya Kim/i)
    const select = screen.getByLabelText(/Switch Demo Persona/i)

    // Level 14 (Maya): Create Discussion quick action disabled
    expect(screen.getByRole('heading', { name: /^Dashboard\.?$/i })).toBeTruthy()
    expect(screen.queryByText(/Welcome back,/i)).toBeNull()

    const qaRegion = screen.getByRole('region', { name: /Dashboard quick actions/i })
    const qaButtons = within(qaRegion).getAllByRole('button')
    expect(qaButtons.map((b) => b.textContent?.trim())).toEqual([
      'Create Project',
      'Create Service',
      'Create Resource',
      'Create Opportunity',
      'Create Event',
      'Create Discussion',
    ])
    const discBtn = within(qaRegion).getByRole('button', { name: /Create Discussion/i }) as HTMLButtonElement
    expect(discBtn.disabled).toBe(true)

    // Clicking Create Project opens Quick Create modal directly to Project
    fireEvent.click(within(qaRegion).getByRole('button', { name: /Create Project/i }))
    expect(screen.getByRole('dialog', { name: /Quick Create in The Arena/i })).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Escape' })

    // Personal notifications and Announcements render in distinct regions
    expect(screen.getByRole('region', { name: /Recent notifications/i })).toBeTruthy()
    expect(screen.getByRole('region', { name: /Community announcements/i })).toBeTruthy()

    // Level 17 (Elena) unlocks Create Discussion quick action on Dashboard
    fireEvent.change(select, { target: { value: 'mem-elena' } })
    const elenaDiscBtn = within(screen.getByRole('region', { name: /Dashboard quick actions/i })).getByRole('button', {
      name: /Create Discussion/i,
    }) as HTMLButtonElement
    expect(elenaDiscBtn.disabled).toBe(false)
  })

  it('Stage 3: separates Personal and Organisations navigation, fixes /organisations breadcrumb, cleans Search tooltip, and removes duplicate mobile/expanded Topbar search', () => {
    renderAuthenticatedAt('/organisations', /Jordan Davis/i)

    // Personal navigation contains ONLY My Activity and My Profile (not Organisations)
    const personalNav = screen.getByRole('navigation', { name: /Personal navigation/i })
    const personalLinks = within(personalNav).getAllByRole('link').map((l) => l.textContent?.trim())
    expect(personalLinks).toEqual(['My Activity', 'My Profile'])

    // Organisations lives in its own navigation group
    const orgNav = screen.getByRole('navigation', { name: /Organisations navigation/i })
    expect(within(orgNav).getByRole('link', { name: /Organisations/i })).toBeTruthy()

    // /organisations breadcrumb does not route through Personal or /activity
    const breadcrumb = screen.getByRole('navigation', { name: /Breadcrumb/i })
    expect(within(breadcrumb).queryByText('Personal')).toBeNull()
    expect(within(breadcrumb).getByRole('link', { name: 'Arena' }).getAttribute('href')).toBe('/dashboard')

    // Sidebar Search tooltip is exact "Search" (no "(⌘K)") and expanded Topbar has NO duplicate Search button
    const sidebar = screen.getByLabelText(/Primary Arena navigation/i)
    const sidebarSearch = within(sidebar).getByRole('button', { name: /^Search$/i })
    expect(sidebarSearch.getAttribute('title')).toBe('Search')
    const banner = screen.getByRole('banner')
    expect(within(banner).queryByRole('button', { name: /^Search$/i })).toBeNull()
    expect(within(banner).queryByRole('button', { name: /Account menu/i })).toBeNull()

    // When desktop sidebar is collapsed, Topbar exposes Search (exact tooltip) + shared Account Menu with keyboard/Escape focus restore
    fireEvent.click(within(sidebar).getByRole('button', { name: /Collapse sidebar/i }))
    const topbarSearch = within(banner).getByRole('button', { name: /^Search$/i })
    expect(topbarSearch.getAttribute('title')).toBe('Search')

    const topbarAccountTrigger = within(banner).getByRole('button', { name: /Account menu/i })
    fireEvent.click(topbarAccountTrigger)
    const menu = screen.getByRole('menu', { name: /Account menu/i })
    const items = within(menu).getAllByRole('menuitem')
    expect(items.map((el) => el.textContent?.trim())).toEqual([
      'Profile',
      'Personalization',
      'Settings',
      'Help',
      'Log out',
    ])
    expect(document.activeElement).toBe(items[0])

    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(items[1])
    fireEvent.keyDown(menu, { key: 'End' })
    expect(document.activeElement).toBe(items[4])
    fireEvent.keyDown(menu, { key: 'Home' })
    expect(document.activeElement).toBe(items[0])
    fireEvent.keyDown(menu, { key: 'Escape' })
    expect(screen.queryByRole('menu', { name: /Account menu/i })).toBeNull()
    expect(document.activeElement).toBe(topbarAccountTrigger)
  })

  it('Stage 3: LandingPage mobile menu toggle exposes title and aria-expanded', () => {
    renderApp('/')
    const toggle = screen.getByRole('button', { name: /Open navigation menu/i })
    expect(toggle.getAttribute('title')).toBe('Open navigation menu')
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(toggle.getAttribute('title')).toBe('Close navigation menu')
  })

  it('Stage 3: enforces publicProfileVisible and showContributionsPublicly while preserving self-views', () => {
    // Jordan disables both publicProfileVisible and showContributionsPublicly
    renderAuthenticatedAt('/settings', /Jordan Davis/i)
    const profileToggle = screen.getByLabelText(/Show my public Spartan profile/i) as HTMLInputElement
    const contribToggle = screen.getByLabelText(/Show verified contributions publicly/i) as HTMLInputElement
    fireEvent.click(profileToggle)
    fireEvent.click(contribToggle)
    expect(profileToggle.checked).toBe(false)
    expect(contribToggle.checked).toBe(false)

    // Own My Activity & Profile Portfolio remain intact
    cleanup()
    renderApp('/activity')
    expect(screen.getAllByText(/Helix L2 RPC Diagnostics Script/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Season 2 Kickoff Documentation Sprint/i).length).toBeGreaterThan(0)

    cleanup()
    renderApp('/profile')
    fireEvent.click(screen.getByRole('tab', { name: /Proof-of-Work Portfolio/i }))
    expect(screen.getByText(/Season 2 Kickoff Documentation Sprint/i)).toBeTruthy()

    // Jordan still sees self in Explore -> People & House Forge Masters (self-view preserved)
    cleanup()
    renderApp('/explore?tab=people')
    expect(within(screen.getByRole('main')).getByText('Jordan Davis')).toBeTruthy()

    // Another viewer (Maya) cannot see Jordan in Explore -> People, Global Search, House Forge Masters, or Dashboard Recent Contributions
    cleanup()
    renderApp('/explore?tab=people')
    fireEvent.change(screen.getByLabelText(/Switch Demo Persona/i), { target: { value: 'mem-maya' } })
    expect(within(screen.getByRole('main')).queryByText('Jordan Davis')).toBeNull()

    const sidebar = screen.getByLabelText(/Primary Arena navigation/i)
    fireEvent.click(within(sidebar).getByRole('button', { name: /^Search$/i }))
    const searchDialog = screen.getByRole('dialog', { name: /Global Arena Search/i })
    fireEvent.change(within(searchDialog).getByPlaceholderText(/Search missions/i), { target: { value: 'Jordan' } })
    expect(within(searchDialog).queryByText('Jordan Davis')).toBeNull()

    cleanup()
    renderApp('/houses/forge-masters')
    expect(within(screen.getByRole('main')).queryByText('Jordan Davis')).toBeNull()
    expect(within(screen.getByRole('main')).queryByText(/Helix L2 RPC Diagnostics Script/i)).toBeNull()

    cleanup()
    renderApp('/dashboard')
    expect(within(screen.getByRole('main')).queryByText(/Helix L2 RPC Diagnostics Script/i)).toBeNull()
  })

  it('Stage 3: clears Primary & Secondary House to None and persists across reloads and persona switches', () => {
    // 1. ProfilePage: clear Secondary House then Primary House -> persists after remount (reload)
    renderAuthenticatedAt('/profile', /Jordan Davis/i)
    fireEvent.click(screen.getByRole('tab', { name: /Houses & Organisations/i }))

    const primarySelect = screen.getByLabelText(/^Primary House$/i) as HTMLSelectElement
    const secondarySelect = screen.getByLabelText(/^Secondary House$/i) as HTMLSelectElement
    expect(primarySelect.value).toBe('forge-masters')
    expect(secondarySelect.value).toBe('seers')

    fireEvent.change(secondarySelect, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /Save House Alignment/i }))
    fireEvent.change(primarySelect, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /Save House Alignment/i }))

    // Remount from persisted localStorage (without clearing storage)
    cleanup()
    renderApp('/profile')
    fireEvent.click(screen.getByRole('tab', { name: /Houses & Organisations/i }))
    expect((screen.getByLabelText(/^Primary House$/i) as HTMLSelectElement).value).toBe('')
    expect((screen.getByLabelText(/^Secondary House$/i) as HTMLSelectElement).value).toBe('')

    // 2. Switching Demo Persona preserves Maya's own seeded Houses while leaving Jordan cleared
    fireEvent.change(screen.getByLabelText(/Switch Demo Persona/i), { target: { value: 'mem-maya' } })
    fireEvent.click(screen.getByRole('tab', { name: /Houses & Organisations/i }))
    expect((screen.getByLabelText(/^Primary House$/i) as HTMLSelectElement).value).toBe('forge-masters')
    expect((screen.getByLabelText(/^Secondary House$/i) as HTMLSelectElement).value).toBe('artisans')

    // 3. HousesPage: clearing Secondary & Primary House persists cleanly
    cleanup()
    renderApp('/houses')
    expect((screen.getByLabelText(/Primary House/i) as HTMLSelectElement).value).toBe('forge-masters')
    fireEvent.change(screen.getByLabelText(/Primary House/i), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /Save Houses/i }))
    cleanup()
    renderApp('/houses')
    expect((screen.getByLabelText(/Primary House/i) as HTMLSelectElement).value).toBe('')
    expect((screen.getByLabelText(/Secondary House/i) as HTMLSelectElement).value).toBe('')

    // 4. Dashboard Onboarding House selection allows clearing back to None ("")
    cleanup()
    renderApp('/dashboard')
    fireEvent.change(screen.getByLabelText(/Switch Demo Persona/i), { target: { value: 'mem-newbie' } })
    const onboarding = screen.getByLabelText(/New Spartan Onboarding Checklist/i)
    fireEvent.change(within(onboarding).getByLabelText(/Primary House/i), { target: { value: 'scribes' } })
    fireEvent.click(within(onboarding).getByRole('button', { name: /Save Houses/i }))
    expect(within(onboarding).getByText('1 / 5 completed')).toBeTruthy()
    fireEvent.change(within(onboarding).getByLabelText(/Primary House/i), { target: { value: '' } })
    fireEvent.click(within(onboarding).getByRole('button', { name: /Save Houses/i }))
    cleanup()
    renderApp('/dashboard')
    const onboardingReloaded = screen.getByLabelText(/New Spartan Onboarding Checklist/i)
    expect((within(onboardingReloaded).getByLabelText(/Primary House/i) as HTMLSelectElement).value).toBe('')
  })

  it('Stage 3: removes unapproved Reset Demo Data button from HelpPage while keeping guidance links', () => {
    renderAuthenticatedAt('/help', /Jordan Davis/i)
    expect(screen.getByRole('heading', { name: /Help & Arena Guide/i })).toBeTruthy()
    expect(screen.getByText(/Demo Mode & Local Persistence/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Reset Demo Data/i })).toBeNull()
    expect(screen.getByRole('link', { name: /Open Academy/i })).toBeTruthy()
    expect(screen.getByRole('link', { name: /View Intro Mission/i })).toBeTruthy()
  })
})
