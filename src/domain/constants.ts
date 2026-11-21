import type {
  AchievementDefinition,
  AscendancyRank,
  CPActivityCategory,
  DemoPersona,
  EvidenceType,
  House,
  MissionCategory,
  MissionStatus,
  ParticipationFormat,
  PermissionScope,
  PlatformConfig,
  SubmissionStatus,
} from './types'

export const LEVEL_THRESHOLDS: number[] = [
  0,     // L1
  100,   // L2
  250,   // L3
  450,   // L4
  700,   // L5
  1000,  // L6
  1350,  // L7
  1750,  // L8
  2200,  // L9
  2700,  // L10
  3250,  // L11
  3850,  // L12
  4500,  // L13
  5200,  // L14
  5950,  // L15
  6750,  // L16
  7600,  // L17
  8500,  // L18
  9450,  // L19
  10450, // L20
  11500, // L21
  12600, // L22
  13750, // L23
  14950, // L24
  16200, // L25
  17500, // L26
  18850, // L27
  20250, // L28
  21700, // L29
  23200, // L30
]

export const ASCENDANCY_LADDER: { rank: AscendancyRank; summary: string }[] = [
  { rank: 'Spartan', summary: 'Default member identity and participation starting point.' },
  { rank: 'Vanguard', summary: 'First leadership step; initiative and part-time ambassador support.' },
  { rank: 'Gladiator', summary: 'Proven contributor and full Arena ambassador.' },
  { rank: 'Strategos', summary: 'Leader of a House; coordinates House activity, missions, and members.' },
  { rank: 'Elder', summary: 'Experienced mentor and steward supporting Spartans and Strategoi.' },
  { rank: 'Champion', summary: 'Highest Ascendancy level; recognised mastery, leadership, and impact.' },
]

export const PERMISSION_LABELS: Record<PermissionScope, string> = {
  'mission.create': 'Create Missions',
  'mission.review': 'Review Submissions',
  'house.manage': 'Manage Assigned House',
  'mentor.manage': 'Verify Mentorship',
  'event.manage': 'Manage Events',
  'content.manage': 'Manage Academy & Content',
  moderator: 'Moderation & Disputes',
  'finance.admin': 'XP Ledger Adjustments',
  'platform.admin': 'Control Room Administration',
}

export const HOUSES: House[] = [
  {
    id: 'scribes',
    slug: 'scribes',
    name: 'Scribes',
    tagline: 'Narratives, clarity, documentation, and enduring knowledge.',
    description: 'Home for writers, editors, storytellers, and technical documentarians turning complex work into clear narratives.',
    focusAreas: ['Writing', 'Storytelling', 'Narratives', 'Documentation', 'Campaign content', 'Communication'],
    glyph: '✎',
    tone: 'blue',
    aboutDetails: 'Scribes chronicle ecosystem progress, craft protocol guides, maintain docs, and elevate Arena storytelling.',
    stewardsNote: 'Prioritise verified originality, technical accuracy, and clear sourcing in every deliverable.',
  },
  {
    id: 'heralds',
    slug: 'heralds',
    name: 'Heralds',
    tagline: 'Hosting, welcomes, events, and living community energy.',
    description: 'The voice and hosts of The Arena—coordinating workshops, AMAs, onboarding welcomes, and public announcements.',
    focusAreas: ['Speaking', 'Hosting', 'Event coordination', 'Community communication', 'Welcoming members', 'Announcements'],
    glyph: '◈',
    tone: 'red',
    aboutDetails: 'Heralds make newcomers feel at home, facilitate live conversations, and anchor regular Arena gatherings.',
    stewardsNote: 'Measure impact by member readiness and session clarity—never raw noise.',
  },
  {
    id: 'artisans',
    slug: 'artisans',
    name: 'Artisans',
    tagline: 'Visual craft, design systems, editing, and culture.',
    description: 'Designers, illustrators, video editors, and creative directors shaping visual identity across The Arena.',
    focusAreas: ['Design', 'Illustration', 'Editing', 'Memes', 'Visual assets', 'Creative production'],
    glyph: '✳',
    tone: 'slate',
    aboutDetails: 'Artisans produce high-craft visual artefacts, campaign toolkits, UI explorations, and community media.',
    stewardsNote: 'Every design submission requires source or exported artefact proof plus rationale.',
  },
  {
    id: 'echoes',
    slug: 'echoes',
    name: 'Echoes',
    tagline: 'Policy-compliant distribution, outreach, and meaningful amplification.',
    description: 'Supports campaign distribution and ecosystem outreach—plus an opt-in capability open to Spartans across all Houses.',
    focusAreas: ['Distribution', 'Amplification', 'Outreach', 'Campaign support'],
    glyph: '◎',
    tone: 'deep',
    supportsCrossHouseOutreach: true,
    aboutDetails:
      'Echoes remains a full canonical House and uniquely offers cross-House outreach missions. All missions enforce anti-engagement-farming policy: no buying likes, reposts, follows, or views.',
    stewardsNote: 'Outreach proof evaluates substance, contextual commentary, and policy compliance—not vanity clicks.',
  },
  {
    id: 'forge-masters',
    slug: 'forge-masters',
    name: 'Forge Masters',
    tagline: 'Engineering, smart contracts, prototypes, and technical craft.',
    description: 'Builders shipping open-source software, technical tools, audits, prototypes, and infrastructure experiments.',
    focusAreas: ['Development', 'Technology', 'Building', 'Experiments', 'Technical innovation'],
    glyph: '⌘',
    tone: 'blue',
    aboutDetails: 'Forge Masters ship working repositories, smart contracts, dashboards, and developer tooling.',
    stewardsNote: 'Submissions should include reproducible commits, live previews, or test evidence.',
  },
  {
    id: 'seers',
    slug: 'seers',
    name: 'Seers',
    tagline: 'Research, ecosystem scouting, analysis, and strategic insight.',
    description: 'Analysts, protocol researchers, and ecosystem scouts surfacing signal, diligence reports, and new opportunities.',
    focusAreas: ['Research', 'Analysis', 'Ecosystem scouting', 'Opportunity discovery', 'Reports and insights'],
    glyph: '◇',
    tone: 'red',
    aboutDetails: 'Seers map protocols, governance proposals, funding rounds, and emerging patterns for the entire community.',
    stewardsNote: 'Cite primary sources and separate verified data from hypothesis.',
  },
]

export const MISSION_CATEGORIES: MissionCategory[] = [
  'Social and Outreach',
  'Creative and Design',
  'Writing and Research',
  'Technical and Development',
  'Learning and Education',
  'Events and Participation',
  'Community and Operations',
  'Offline and IRL',
  'Collaboration',
  'Custom',
]

export const PARTICIPATION_FORMATS: { value: ParticipationFormat; label: string; summary: string }[] = [
  { value: 'open', label: 'Open participation', summary: 'Eligible members can join immediately and submit proof of work.' },
  { value: 'application', label: 'Application-based', summary: 'Members apply with a brief pitch; creator or manager selects participants.' },
  { value: 'team', label: 'Team-based', summary: 'Contributors collaborate toward a shared outcome with individual attribution.' },
  { value: 'guided', label: 'Automatic / guided', summary: 'Structured learning or onboarding sequence with guided completion.' },
]

export const MISSION_STATUSES: { value: MissionStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Pending review' },
  { value: 'published', label: 'Published' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
  { value: 'archived', label: 'Archived' },
]

export const SUBMISSION_STATUSES: { value: SubmissionStatus; label: string }[] = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'revision_requested', label: 'Revision requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'disputed', label: 'Disputed' },
]

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  text: 'Written summary / text',
  images: 'Image attachment (local metadata)',
  files: 'File deliverable (local metadata)',
  links: 'Public URL / repository / thread link',
  video_audio: 'Video or audio reference',
  structured_response: 'Structured checklist response',
  attendance_verification: 'Event attendance verification',
  reviewer_confirmation: 'Reviewer / host confirmation',
}

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  levelThresholds: LEVEL_THRESHOLDS,
  systemXpValues: {
    orientationOnce: 20,
    academyLesson: 5,
    academyModule: 20,
    learningPath: 75,
    practicalAssessmentDefault: 50, // Band: 25-100
    communitySupportDefault: 15,    // Band: 10-25
    eventAttendance: 5,
    eventSupportDefault: 35,        // Band: 25-50
    eventHostDefault: 75,           // Band: 50-100
    mentorshipSession: 20,
    houseResponsibilityDefault: 40, // Band: 25-75
    leadershipResponsibilityDefault: 50, // Band: 25-100
  },
  cpValues: {
    mission_micro: 5,
    mission_standard: 15,
    mission_substantial: 30,
    mission_major: 50,
    academy_lesson: 1,
    academy_module: 5,
    academy_path: 15,
    practical_assessment: 10, // Band: 5-15
    community_support: 5,
    event_attendance: 1,
    event_support: 5,
    event_hosting: 10,
    mentorship: 10,
    house_responsibility: 10,
  } satisfies Record<CPActivityCategory, number>,
  seasonalCpCaps: {
    eventAttendancePerSeason: 10,
    communitySupportPerSeason: 50,
    mentorshipPairPerSeason: 60,
  },
  rewardBands: {
    micro: [25, 75],
    standard: [100, 250],
    substantial: [300, 750],
    major: [800, 1500],
  },
}

export const INITIAL_ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'ach-01', code: 'arena_ready', title: 'Arena Ready', description: 'Complete onboarding orientation and rules check.', unlockConditionLabel: 'Complete orientation & rules check' },
  { id: 'ach-02', code: 'first_contribution', title: 'First Contribution', description: 'Receive your first approved mission contribution.', unlockConditionLabel: '1 approved mission contribution' },
  { id: 'ach-03', code: 'mission_maker', title: 'Mission Maker', description: 'Create a mission successfully completed by another member.', unlockConditionLabel: '1 created mission completed by another member' },
  { id: 'ach-04', code: 'reliable_contributor', title: 'Reliable Contributor', description: 'Complete five approved missions across at least three different dates.', unlockConditionLabel: '5 approved missions across >=3 dates' },
  { id: 'ach-05', code: 'mission_veteran', title: 'Mission Veteran', description: 'Receive 25 approved mission contributions.', unlockConditionLabel: '25 approved mission contributions' },
  { id: 'ach-06', code: 'academy_starter', title: 'Academy Starter', description: 'Complete five Academy modules.', unlockConditionLabel: '5 Academy modules completed' },
  { id: 'ach-07', code: 'path_finisher', title: 'Path Finisher', description: 'Complete an entire learning path.', unlockConditionLabel: '1 full learning path completed' },
  { id: 'ach-08', code: 'practical_learner', title: 'Practical Learner', description: 'Pass three verified practical assessments.', unlockConditionLabel: '3 practical assessments passed' },
  { id: 'ach-09', code: 'cross_house_collaborator', title: 'Cross-House Collaborator', description: 'Make approved contributions in three different Houses.', unlockConditionLabel: 'Approved contributions in 3 Houses' },
  { id: 'ach-10', code: 'house_pillar', title: 'House Pillar', description: 'Make ten approved contributions within one House.', unlockConditionLabel: '10 approved contributions in 1 House' },
  { id: 'ach-11', code: 'community_builder', title: 'Community Builder', description: 'Complete ten verified community-support contributions.', unlockConditionLabel: '10 verified community-support records' },
  { id: 'ach-12', code: 'event_steward', title: 'Event Steward', description: 'Support or host three Arena events.', unlockConditionLabel: '3 events supported or hosted' },
  { id: 'ach-13', code: 'mentors_mark', title: "Mentor's Mark", description: 'Complete three verified mentorship sessions.', unlockConditionLabel: '3 verified mentorship sessions' },
  { id: 'ach-14', code: 'scribes_mark', title: "Scribe's Mark", description: 'Complete an approved writing deliverable.', unlockConditionLabel: 'Approved Scribes / writing contribution' },
  { id: 'ach-15', code: 'heralds_voice', title: "Herald's Voice", description: 'Complete an approved speaking, hosting or communication deliverable.', unlockConditionLabel: 'Approved Heralds / communication contribution' },
  { id: 'ach-16', code: 'artisans_craft', title: "Artisan's Craft", description: 'Complete an approved creative deliverable.', unlockConditionLabel: 'Approved Artisans / design contribution' },
  { id: 'ach-17', code: 'echoes_reach', title: "Echoes' Reach", description: 'Complete an approved, policy-compliant outreach deliverable.', unlockConditionLabel: 'Approved Echoes outreach contribution' },
  { id: 'ach-18', code: 'forge_mark', title: 'Forge Mark', description: 'Complete an approved technical deliverable.', unlockConditionLabel: 'Approved Forge Masters / technical contribution' },
  { id: 'ach-19', code: 'seers_insight', title: "Seer's Insight", description: 'Complete an approved research deliverable.', unlockConditionLabel: 'Approved Seers / research contribution' },
]

export const PROHIBITED_ENGAGEMENT_PATTERNS: RegExp[] = [
  /\b(buy|paid|reward(ed)?|earn\s+xp)\b.*\b(like|likes|repost|reposts|retweet|retweets|follow|follows|views?|impressions?|comment\s+count)\b/i,
  /\b(like\s+and\s+retweet|like\s*&\s*rt|follow\s+for\s+xp|engagement\s+farm|boost\s+views)\b/i,
]

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: 'visitor',
    label: 'Visitor (Public)',
    shortRole: 'Visitor',
    description: 'Unauthenticated guest browsing public Houses, Academy overview, Events, and Explore.',
    memberId: null,
  },
  {
    id: 'newbie',
    label: 'Alex Mercer (New Spartan)',
    shortRole: 'Newbie Stage',
    description: 'Newly joined Spartan in onboarding stage—test orientation, rules check, and House selection.',
    memberId: 'mem-newbie',
  },
  {
    id: 'spartan',
    label: 'Jordan Davis (Spartan / Gladiator)',
    shortRole: 'Contributor & Creator',
    description: 'Active Spartan with Forge Masters / Seers Houses, Spendable XP, Mission Creator permission, and Org ownership.',
    memberId: 'mem-jordan',
  },
  {
    id: 'strategos',
    label: 'Maya Kim (Strategos)',
    shortRole: 'Forge Masters Strategos',
    description: 'House-scoped Strategos authorised to manage Forge Masters & review submissions—blocked from other Houses.',
    memberId: 'mem-maya',
  },
  {
    id: 'elder',
    label: 'Elena Rostova (Elder)',
    shortRole: 'Elder & Steward',
    description: 'Stewardship Workspace access: Mentorship verification, Review Center, Community Health, Knowledge Vault.',
    memberId: 'mem-elena',
  },
  {
    id: 'admin',
    label: 'Marcus Vance (Control Room)',
    shortRole: 'Champion · Control Room',
    description: 'Platform & Finance Admin permissions: Control Room config, XP ledger adjustments, disputes, Ascendancy grants.',
    memberId: 'mem-marcus',
  },
]
