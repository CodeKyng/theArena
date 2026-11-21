# The Arena — Frontend Feature Map

## Route Architecture (`src/App.tsx`)

| Route | Page Component | Audience & Purpose |
|---|---|---|
| `/` | `LandingPage` | Public entry featuring Hero metrics, 6 Houses showcase, Mission highlights, Demo Persona switcher, and mobile drawer nav. |
| `/login` & `/register` | `AuthPage` | Unified Spartan entry (`login` / `register` without Creator/Org signup split) plus 1-click Demo Persona cards. |
| `/home` | `HomePage` | Member command workspace: Newbie onboarding checklist (`+20 XP` rules check, House picker, Academy & Intro mission), active missions, and notifications. |
| `/missions` | `MissionsPage` | Mission discovery directory with House, Category, Format, Reward Band, Difficulty, Status, Open-only filters, and personal Submissions Queue tab. |
| `/missions/new` | `MissionCreatePage` | Guided 7-step Mission Creation Wizard with live policy validator, reward band classifier, Draft vs Funded Publish, and `>1,500 XP` Control Room hold preview. |
| `/missions/:id` | `MissionDetailPage` | Mission brief, budget/escrow ledger summary, Join / Apply flow, PoW Submission with local file metadata placeholder, Revision loop, Creator/House review (self-review blocked), Dispute filing, and Cancel/Expire escrow refund. |
| `/houses` | `HousesPage` | Directory of all 6 canonical Houses (`Scribes`, `Heralds`, `Artisans`, `Echoes`, `Forge Masters`, `Seers`) + cross-House Echoes notice. |
| `/houses/:slug` | `HouseDetailPage` | Dedicated House workspace (`Overview`, `Activity`, `Missions`, `Academy`, `Members`, `About & Standards`, and House-scoped `House Management` tab for authorised `Strategos`). |
| `/explore` | `ExplorePage` | 6-tab ecosystem discovery (`Opportunities`, `People`, `Projects`, `Services`, `Resources`, `Discussions`), quick-create modals, bookmarking, and Service-to-Funded-Mission commissioning. |
| `/academy` | `AcademyPage` | Explicitly labelled Demo Catalogue learning paths, modules, interactive lesson knowledge checks, practical assessments, and Arena Glossary. |
| `/events` | `EventsPage` | Upcoming and past Arena sessions, RSVP capacity handling, Event Proposal modal, and Steward/Host verified Attendance/Support/Hosting attribution. |
| `/leaderboards` | `LeaderboardsPage` | Contribution Point (`CP`) rankings only: Season 2 (90-day) vs All-Time toggle; `Overall`, `Missions`, `Learning`, `Community & Stewardship`, and per-House views with top-3 podium & privacy opt-out enforcement. |
| `/activity` | `ActivityPage` | Personal tracker: `Contributions`, `Created Missions`, `Submissions`, `Applications`, `Saved`, `XP Ledger`, and `Level & Achievements` (30-level progress + all 19 achievements). |
| `/profile` | `ProfilePage` | Member identity, Ascendancy badge, House badges, editable profile skills/links, Privacy & Leaderboard opt-out toggles, and connected portfolio/contributions. |
| `/organisations` | `OrganisationsPage` | Create an Organisation from a unified Spartan account, switch active workspace context, track `unverified` / `pending_review` / `verified` status, and sponsor missions. |
| `/stewardship` | `StewardshipPage` | Gated by `mentor.manage`, `moderator`, `house.manage`, or `platform.admin`: Dispute Queue (with immutable evidence snapshots), Review Center, Mentorship Session Verification (`60 CP` pair cap), and Community Health. |
| `/control-room` | `ControlRoomPage` | Gated by `platform.admin` or `finance.admin`: Funnel & Org Verification, Members & Explicit Ascendancy Appointments, Scoped RBAC PermissionGrants, `>1,500 XP` Mission Approvals, XP Ledger Adjustments, Configurable Rules, and Audit Log. |

## Legacy Redirects Preserved
- `/discover` → `/explore?tab=opportunities`
- `/opportunities`, `/bounties`, `/grants`, `/hackathons` → `/missions`
- `/projects` → `/explore?tab=projects`
- `/services` → `/explore?tab=services`
- `/communities` → `/houses`
- `/learning` → `/academy`
- `/organizations` → `/organisations`
- `/resources` → `/explore?tab=resources`
- `/discussions` → `/explore?tab=discussions`
- `/dashboard`, `/applications` → `/activity`
- `/notifications` → `/home`
- `/achievements`, `/reputation` → `/activity?tab=progress`
- `/admin`, `/analytics`, `/moderation`, `/applicants` → `/control-room`
- `/messages` → Intentionally falls through to `NotFoundPage` (`404`) explaining MVP removal.
