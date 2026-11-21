# Mock Data & Backend Service Contracts

## Layer Separation
1. **Domain Contracts & Invariants (`src/domain/types.ts`, `src/domain/constants.ts`, `src/domain/progression.ts`):** Pure TypeScript models and deterministic calculation functions reusable on Node/Edge backends without browser dependencies.
2. **Seed Snapshot (`src/data/seedData.ts`):** Initial consistent fixture (`INITIAL_ARENA_STATE`) containing 8 members, mathematically reconciled `xpTransactions`, 6 Houses, 3 Organisations, 11 Missions (including `pending_review`, `active`, `paused`, `completed`), 6 Submissions, 1 open Dispute, 3 Demo Academy Paths, 5 Events, Explore content, Mentorship sessions, Notifications, and Audit logs.
3. **Pure Transition Engine (`src/services/arenaService.ts`):** Stateless `(state, ...args) => ServiceResult<T>` functions ready to be mapped 1-for-1 to REST/tRPC/GraphQL endpoints or PostgreSQL transactions.
4. **Client Persistence (`src/services/arenaStore.ts` + `src/app/ArenaProvider.tsx`):** Persists `ArenaPrototypeState` in `localStorage` under `arena.prototype.v1` and exposes `resetArenaStorage()`.

## Core Domain Contracts (`src/domain/types.ts`)
- **`MemberProfile`:** Unified Spartan identity (`membershipStatus: 'spartan'`, `onboardingStage: 'newbie' | 'completed'`, `ascendancyRank`, `primaryHouseId`, `secondaryHouseId`, `privacy`).
- **`OrganisationProfile`:** Linked via `ownerMemberId` and `memberIds`; carries `verificationStatus` (`'unverified' | 'pending_review' | 'verified'`). Organisations do **not** inherit personal XP or Ascendancy ranks.
- **`XPTransaction`:** Append-only ledger record with explicit `deltaLifetime`, `deltaSpendable`, `deltaReserved`, `transactionType` (`earned | reserved | transferred | refunded | received | adjustment`), `sourceType`, `referenceType`, `referenceId`, `actorMemberId`, and `idempotencyKey`.
- **`ContributionRecord` & `ContributionPointEvent`:** Permanent proof record + seasonal/house CP event (`seasonId`, `houseId`, `activityCategory`, `leaderboardBucket`, `cpAmount`, `partnerMemberId`, `referenceKey`).
- **`Mission`, `MissionParticipation`, `MissionSubmission`, `MissionDispute`:** Full lifecycle state machines with `revisionHistory` snapshots, `EvidenceItem` (`fileMeta.simulatedNotice`), `reviews`, and `preservedEvidenceSnapshot` / `preservedReviewComments` on disputes.
- **`PermissionGrant` & `AuditLogEntry`:** Scoped RBAC (`scope` + optional `houseId`) and immutable governance trail.

## Backend API Replacement Checklist
When replacing `src/services/arenaService.ts` with real backend endpoints:
1. Replace `switchDemoPersona` / `signInDemoByEmail` / `registerUnifiedAccount` with OAuth / session authentication (HTTP-only cookies or JWTs).
2. Execute `createMission`, `publishDraftMission`, `reviewSubmission` (`approved`), `resolveDispute` (`resolved_overturned`), and `cancelOrExpireMission` inside **database ACID transactions** using the existing `idempotencyKey` and `referenceKey` semantics to prevent double-spend or duplicate XP/CP payouts.
3. Enforce `memberHasPermission` and self-review / self-dispute checks server-side (never trust client checks alone).
4. Replace `EvidenceItem.fileMeta` placeholder metadata with signed cloud object storage uploads + malware/MIME verification.
5. Wire `ArenaNotification` emissions to transactional email / push / websocket workers.
