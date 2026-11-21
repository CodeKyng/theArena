# Known Limitations & Open Decisions

## Intentional Frontend-Only Prototype Boundaries
1. **Simulated Persistence (`localStorage`):** All edits, missions, XP/CP balances, and notifications persist locally under `arena.prototype.v1` and reset on "Reset Data" or clearing browser storage. No multi-user real-time sync exists yet.
2. **Simulated Identity Switcher (No Real Auth/Passwords):** The 6-persona switcher and email-only demo login (`@arena.demo`) omit passwords, sessions, OAuth, and backend JWT verification. Backend engineers must never trust client-provided actor IDs in production.
3. **Simulated File Uploads:** `EvidenceItem.fileMeta` captures local browser `File` metadata (`fileName`, `mimeType`, `sizeBytes`) and renders an explicit simulation notice rather than uploading binaries to cloud storage.
4. **Demo Academy Catalogue:** The 3 Academy learning paths (`Web3 Foundations`, `Wallet & Digital Safety`, `Forge Masters`) and glossary are demonstration curriculum fixtures clearly labelled `Demo Catalogue`, ready for editorial replacement by Arena Stewards.
5. **Simulated Notifications & Newsletter:** In-app notification popovers mutate local state only; email alerts and landing newsletter submissions display local confirmation without SMTP delivery.
6. **Responsive Browser Engine Note:** Automated Vitest (`jsdom`) + CSS inspection verified component behaviour and breakpoint rules; a Chromium/Playwright binary was unavailable in this environment for pixel-screenshot rendering.

## Open Decisions Reserved for Product & Backend Governance
- **Real Asset / Token Escrow vs Off-Chain XP:** Currently `Spendable XP` is non-monetary platform credit; if external sponsor grants or tokens are introduced later, legal/custody architecture requires separate approval.
- **Automated Expiry Cron:** In the prototype, mission expiry (`cancelOrExpireMission(..., 'expired')`) is triggered manually via mission controls; production requires a scheduled worker checking `mission.deadline`.
- **Practical Assessment Reviewer Assignment:** Currently `submitPracticalAssessment` verifies length client-side for smooth demo testing; production should queue practical assessments into Stewardship/House reviewer queues.
- **Organisation Multi-Admin Invites:** Currently an Organisation tracks `ownerMemberId` and `memberIds`; production will need invite acceptance emails and per-org billing/delegation roles.
