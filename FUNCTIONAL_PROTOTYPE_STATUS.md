# The Arena — Functional Prototype Status

## Summary
This repository implements a **complete, interactive frontend-only functional prototype** of **The Arena** aligned with *The Arena — Master Product & Implementation Specification v1.0* and *The Arena — Audit Reconciliation & Final Implementation Blueprint*.

All domain rules, progression math, escrow states, submissions, disputes, RBAC scoping, Academy quizzes, Events, Explore commissioning, Organisations, Stewardship, and Control Room workflows run locally in the browser using pure TypeScript transition services (`src/services/arenaService.ts`) persisted to `localStorage` (`arena.prototype.v1`).

## Verification Status
- **TypeScript + Production Bundle (`npm run build`):** Verified passing cleanly after all source changes.
- **Linter (`npm run lint` / `oxlint`):** Verified passing with 0 errors and 0 warnings.
- **Automated Tests (`npm test` / Vitest):** 20 tests passing across 3 suites (`progression.test.ts`, `journeys.test.ts`, `ui.test.tsx`).
- **Live Server Check:** Vite development server verified serving HTTP 200 on port 3000 (`http://localhost:3000`). Note: headless Chromium/Playwright binary is not installed in the container environment, so CSS responsiveness across `320px`, `375px`, `768px`, `1280px` was verified through stylesheet breakpoint inspection and React Testing Library component checks.

## Implemented vs. Simulated vs. Deferred Boundaries

| Capability Area | Status | Notes |
|---|---|---|
| Unified Account & Onboarding (`Spartan`, Newbie checklist, `+20 XP` once, `0 XP` House choice) | Working (Client Simulation) | 6-persona switcher in top simulation bar + unified `/register` and `/login`. No passwords stored. |
| 6 Canonical Houses + House Echoes Cross-House Outreach | Working | `Scribes`, `Heralds`, `Artisans`, `Echoes`, `Forge Masters`, `Seers` with dedicated House workspaces and scoped management tab. |
| XP System (`Lifetime XP`, `Spendable XP`, `Reserved XP`, 30 Levels, Ledger) | Working (Client Simulation) | Pure append-only ledger invariants enforced client-side (`no negative Spendable`, `Spendable reserve/transfer preserves Lifetime XP`, idempotency keys). |
| Contribution Points (`CP`), Seasonal Caps & Leaderboards | Working (Client Simulation) | 90-day seasonal vs all-time rankings, overall / category / per-House views, tie ranks, caps (`10` attendance, `50` community support, `60` mentorship pair), and privacy opt-out respected. |
| Guided 7-Step Mission Wizard, Escrow, PoW, Revisions, Disputes & Refunds | Working (Client Simulation) | Anti-engagement-farming check, `>1,500 XP` Control Room approval hold, self-review block, local file metadata placeholders, dispute snapshot & Steward resolution. |
| Academy (Demo Catalogue), Glossary & Practical Assessments | Working (Demo Content) | Labelled explicitly as Demo Catalogue; interactive knowledge checks award `+5 XP / +1 CP` (lesson), `+20 XP / +5 CP` (module), `+75 XP / +15 CP` (path). |
| Explore & Events (Commissioning, Bookmarks, RSVP, Attendance Roles) | Working (Client Simulation) | Commissioning an Explore Service opens a real XP-funded Mission; Event attendance/support/host records enforce caps and unlock achievements. |
| Organisations (Unified Account Attachment, Zero XP Inheritance) | Working (Client Simulation) | Any Spartan can create and switch into an Organisation (`unverified` initially); verification managed in Control Room. |
| Stewardship & Control Room Governance | Working (Client RBAC Simulation) | Scoped `PermissionGate` and service checks enforce House-scoped `Strategos`, `Elder` mentorship/disputes, and `Control Room` admin controls & explicit `Ascendancy` appointments. |
| Production Backend / Auth / Cloud Uploads / Email / On-Chain Signing | Intentionally Excluded | Out of scope for this frontend-only prototype; isolated cleanly behind `src/services/arenaService.ts` and `src/services/arenaStore.ts`. |
| Standalone Messaging (`/messages`) | Intentionally Removed | Deferred from MVP per Master Specification. |
