# Known Limitations & Open Decisions

## Intentional Frontend-Only Prototype Boundaries
1. **Simulated Persistence (`localStorage`):** All edits, missions, XP/CP balances, and notifications persist locally under `arena.prototype.v1` and reset on "Reset Data" or clearing browser storage. No multi-user real-time sync exists yet.
2. **Simulated Identity Switcher & Client-Side Authorisation Boundary (No Real Auth/Passwords):** The 6-persona switcher and email-only demo login (`@arena.demo`) omit passwords, sessions, OAuth, and backend JWT verification. Likewise, RBAC checks—including event attendance and Host/Support check-in verification (`recordEventAttendanceOrRole` and the Events `Steward Check-In (Simulated)` controls)—are client-side prototype simulations only and do not provide security in a production environment. Backend engineers must enforce server-side authentication and RBAC authorisation on all mutations.
3. **Simulated File Uploads:** `EvidenceItem.fileMeta` captures local browser `File` metadata (`fileName`, `mimeType`, `sizeBytes`) rather than uploading binaries to cloud storage.
4. **Sample Academy Curriculum:** The 3 Academy learning paths (`Web3 Foundations`, `Wallet & Digital Safety`, `Forge Masters`) and glossary are sample curriculum fixtures (labelled with a single sample-curriculum notice at the top of Academy), ready for editorial replacement by Arena Stewards.
5. **Simulated Notifications & Newsletter:** In-app notification popovers mutate local state only; email alerts and landing newsletter submissions display local confirmation without SMTP delivery.
6. **Responsive Browser Engine Note:** Automated Vitest (`jsdom`) + CSS inspection verified component behaviour and breakpoint rules; a Chromium/Playwright binary was unavailable in this environment for pixel-screenshot rendering.

## Open Decisions Reserved for Product & Backend Governance
- **Real Asset / Token Escrow vs Off-Chain XP:** Currently `Spendable XP` is non-monetary platform credit; if external sponsor grants or tokens are introduced later, legal/custody architecture requires separate approval.
- **Automated Expiry Cron:** In the prototype, mission expiry (`cancelOrExpireMission(..., 'expired')`) is triggered manually via mission controls; production requires a scheduled worker checking `mission.deadline`.
- **Practical Assessment Reviewer Assignment:** Currently `submitPracticalAssessment` verifies length client-side for smooth demo testing; production should queue practical assessments into Stewardship/House reviewer queues.
- **Organisation Multi-Admin Invites (Deferred to V2):** Currently an Organisation tracks `ownerMemberId` and `organisationMemberships`; V2 production will need invite acceptance emails and per-org delegation roles.

## V1 Organisation Feature Deactivation & V2 Reactivation Plan
All Organisation features are intentionally deactivated for V1 via a single central feature flag (`FEATURE_FLAGS.organisationsEnabled = false` in `src/domain/constants.ts`) with no user-facing toggle.

### Deactivated V1 Surfaces & Guards
- **Navigation & Workspace Switcher:** `Sidebar.tsx` hides the `ORGANISATIONS` navigation group, suppresses the workspace organisation dropdown/chevron, and ignores `activeOrganisation`.
- **Routes & Pages:** `/organisations`, `/organisations/*`, `/organizations`, and `/organizations/*` redirect authenticated Spartans to `/dashboard` (while unauthenticated visitors continue redirecting to `/login` via `RequireAuth`). `OrganisationsPage.tsx` also guards against direct component rendering.
- **Shared Pages:** `ProfilePage.tsx` renames the membership tab to `Houses` and hides `Linked Organisations`; `MissionCreatePage.tsx` hides `Sponsor Organisation (optional)` and omits `sponsorOrganisationId`; `MissionDetailPage.tsx` hides `Sponsored by ...` attribution; `ControlRoomPage.tsx` renames the overview tab to `Platform Funnel` and hides the `Organisations` stat card and `Organisation Verification Queue`.
- **State & Services:** `loadArenaState()` in `src/services/arenaStore.ts` forces `activeOrganisationId: null` on hydration without deleting stored organisation records. `ArenaProvider.tsx` derives `activeOrganisation = null` and `memberOrganisations = []`. `arenaService.ts` rejects `createOrganisation`, `setOrganisationVerification`, `switchActiveOrganisation`, `createMission` with `sponsorOrganisationId`, and `addExploreProject` / `addExploreOpportunity` with `organisationId` cleanly with `{ ok: false, error }` without mutating state.

### Preserved for V2 & Reactivation Checklist
- **Preserved Intact:** `OrganisationProfile` and `OrganisationMembership` types (`src/domain/types.ts`), seeded `organisations`, `organisationMemberships`, and historical mission/opportunity references (`src/data/seedData.ts`), full service implementations (`src/services/arenaService.ts`), and `OrganisationsPage.tsx`.
- **Approved V2 Product Decisions:**
  1. Organisations will operate as independent entities separate from individual Spartan identities.
  2. Organisation directories and profiles will be publicly accessible in V2.
  3. The five existing organisation categories (`Project`, `Brand`, `Company`, `Team`, `Community Initiative`) remain preserved.
- **Reactivation Requirements for V2:** Flip `FEATURE_FLAGS.organisationsEnabled` to `true`, implement independent entity/public directory requirements, update `KNOWN_LIMITATIONS_AND_OPEN_DECISIONS.md`, update V1 deactivation tests back to V2 specs, and note that this prototype has no backend server—when V2 API routes are built, backend endpoints and authorisation middleware must enforce `organisationsEnabled` and org permissions server-side.

