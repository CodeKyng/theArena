# The Arena — Product Acceptance Checklist

Every requirement below is implemented in the frontend prototype and backed by unit/integration tests (`npm test`) and route components:

## 1. Identity, Accounts & Onboarding
- [x] **No Role Split on Registration:** `/register` creates a unified Spartan account (`membershipStatus: 'spartan'`, `onboardingStage: 'newbie'`).
- [x] **Idempotent Orientation:** Orientation & rules check grants `+20 XP` once and unlocks `Arena Ready` (`ach-01`); duplicate triggers grant `0 XP`.
- [x] **0-XP House Alignment:** Choosing/updating Primary and Secondary Houses carries `0 XP`.
- [x] **Unified Account → Organisation Creation:** Any Spartan can create an Organisation (`/organisations`) starting `unverified`, switch workspace context, and sponsor missions without inflating personal XP or Ascendancy.

## 2. Six Canonical Houses & Echoes Policy
- [x] All 6 canonical Houses rendered and navigable: `Scribes`, `Heralds`, `Artisans`, `Echoes`, `Forge Masters`, `Seers`.
- [x] House `Echoes` preserves canonical House status while enabling cross-House outreach missions.
- [x] Anti-engagement-farming policy rejects missions asking for bought/rewarded likes, follows, reposts, or views (`validateMissionPolicy`).

## 3. Dual Progression: XP Ledger (30 Levels) vs Contribution Points (CP)
- [x] Exact 30 Lifetime XP level thresholds (`0` at L1 through `23,200` at L30).
- [x] `Spendable XP` vs `Lifetime XP` separation: funding or commissioning a mission moves `Spendable XP -> Reserved XP` with **zero reduction** to `Lifetime XP` or Level.
- [x] No negative `Spendable XP`: over-budget mission funding and excessive negative admin adjustments are rejected.
- [x] `CP` strictly separated from `XP` for Season 2 (90-day) & All-Time leaderboards with `Overall`, `Missions`, `Learning`, `Community & Stewardship`, and per-House views + tie handling + `showOnLeaderboard` privacy opt-out.
- [x] Seasonal CP caps enforced: `10 CP` event attendance, `50 CP` community support, `60 CP` mentorship per mentor-mentee pair.
- [x] All 19 initial achievements tracked and evaluated on state changes.

## 4. Missions, Proof of Work, Review & Disputes
- [x] Guided 7-step Mission Creation Wizard (`/missions/new`) supporting Draft save (0 XP reserved) and Funded publish.
- [x] Reward bands classified (`Micro 25–75`, `Standard 100–250`, `Substantial 300–750`, `Major 800–1,500`, `>1,500 XP` Control Room hold).
- [x] Open, Application-based, Team-based, and Guided formats supported.
- [x] Self-review strictly blocked (`submission.memberId === reviewerId` rejected).
- [x] Revision requests & resubmissions preserve immutable `revisionHistory`.
- [x] Approval atomically transfers Creator `Reserved XP -> Contributor Lifetime & Spendable XP` + `ContributionRecord` + `CP`.
- [x] Cancellation / Expiry refunds unallocated `Reserved XP` back to Creator `Spendable XP`.
- [x] Disputes preserve immutable evidence/comment snapshots and prevent dispute opener self-resolution.

## 5. Ascendancy & Scoped RBAC
- [x] Ascendancy Ladder (`Spartan`, `Vanguard`, `Gladiator`, `Strategos`, `Elder`, `Champion`) is **never auto-unlocked by XP alone**—appointments are explicit in Control Room.
- [x] House-scoped `Strategos` (`Maya Kim`) can manage `Forge Masters` and is blocked from `Scribes`/`Echoes` management and Control Room.
- [x] `Elder` (`Elena Rostova`) can access `/stewardship` (Disputes, Mentorship verification, Review Center) while Platform/Finance admin (`Marcus Vance`) accesses `/control-room`.
