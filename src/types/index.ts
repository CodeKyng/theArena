export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  location: string;
  skills: string[];
  interests: string[];
  experience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  role: 'member' | 'organization' | 'admin';
  verified: boolean;
  walletAddress?: string;
  reputation: number;
  xp: number;
  level: ReputationLevel;
  badges: Badge[];
  projects: string[];
  contributions: number;
  followers: number;
  following: number;
  joinedAt: string;
  socials: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  ecosystems: string[];
}

export type ReputationLevel = 'Explorer' | 'Participant' | 'Contributor' | 'Builder' | 'Leader' | 'Pioneer';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  earnedAt: string;
}

export interface Project {
  id: string;
  name: string;
  logo: string;
  description: string;
  longDescription?: string;
  category: string;
  chain: string;
  status: 'Idea' | 'Building' | 'Beta' | 'Live' | 'Seeking Contributors';
  teamSize: number;
  members: Partial<User>[];
  requiredSkills: string[];
  openRoles: string[];
  githubUrl?: string;
  websiteUrl?: string;
  tags: string[];
  stars: number;
  contributors: number;
  createdAt: string;
  updatedAt: string;
}

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  organizationLogo: string;
  type: OpportunityType;
  category: string;
  description: string;
  requirements: string[];
  skills: string[];
  location: string;
  remote: boolean;
  compensation?: string;
  deadline: string;
  experienceLevel: 'Entry' | 'Mid' | 'Senior' | 'Any';
  postedAt: string;
  applicationUrl?: string;
  saved: boolean;
  chain?: string;
  tags: string[];
}

export type OpportunityType =
  | 'Internship'
  | 'Fellowship'
  | 'Hackathon'
  | 'Bounty'
  | 'Grant'
  | 'Freelance'
  | 'Volunteer'
  | 'Ambassador'
  | 'Community'
  | 'Research';

export interface Community {
  id: string;
  name: string;
  logo: string;
  description: string;
  category: string;
  members: number;
  activityLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  verified: boolean;
  tags: string[];
  socials: {
    discord?: string;
    telegram?: string;
    twitter?: string;
  };
  createdAt: string;
}

export interface Service {
  id: string;
  provider: Partial<User>;
  title: string;
  description: string;
  category: string;
  startingPrice: string;
  rating: number;
  reviews: number;
  completedProjects: number;
  verified: boolean;
  skills: string[];
  deliveryTime: string;
  available: boolean;
}

export interface ArenaEvent {
  id: string;
  name: string;
  description: string;
  image?: string;
  type: EventType;
  date: string;
  time: string;
  host: string;
  hostAvatar?: string;
  location: string;
  online: boolean;
  attendees: number;
  maxAttendees?: number;
  registered: boolean;
  tags: string[];
  chain?: string;
}

export type EventType = 'AMA' | 'Space' | 'Workshop' | 'Hackathon' | 'Meetup' | 'Conference' | 'Community Call' | 'Demo Day' | 'Networking' | 'Webinar';

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  instructorAvatar?: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  lessons: number;
  enrolled: number;
  rating: number;
  image?: string;
  free: boolean;
  price?: string;
  tags: string[];
  progress?: number;
}

export interface Discussion {
  id: string;
  title: string;
  content: string;
  author: Partial<User>;
  category: string;
  tags: string[];
  replies: number;
  upvotes: number;
  views: number;
  createdAt: string;
  pinned: boolean;
}

export interface Notification {
  id: string;
  type: 'message' | 'invitation' | 'opportunity' | 'follower' | 'comment' | 'mention' | 'application' | 'event' | 'reputation' | 'badge';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface Organization {
  id: string;
  name: string;
  logo: string;
  description: string;
  website: string;
  type: 'DAO' | 'Protocol' | 'Startup' | 'Community' | 'Foundation' | 'DevEcosystem' | 'Investment';
  ecosystem: string[];
  members: number;
  verified: boolean;
  socials: {
    twitter?: string;
    discord?: string;
    github?: string;
  };
  opportunities: number;
  events: number;
}

export interface Hackathon {
  id: string;
  name: string;
  organizer: string;
  organizerLogo: string;
  description: string;
  prizePool: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  tracks: string[];
  sponsors: string[];
  participants: number;
  status: 'Upcoming' | 'Active' | 'Ended';
  tags: string[];
  websiteUrl?: string;
}

export interface Grant {
  id: string;
  organization: string;
  organizationLogo: string;
  title: string;
  description: string;
  amount: string;
  category: string;
  deadline: string;
  requirements: string[];
  chain: string;
  applicationUrl: string;
  tags: string[];
}

export interface Bounty {
  id: string;
  organization: string;
  organizationLogo: string;
  title: string;
  description: string;
  reward: string;
  rewardToken: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  skills: string[];
  deadline: string;
  submissions: number;
  status: 'Open' | 'In Review' | 'Completed';
  tags: string[];
}

export interface FeedPost {
  id: string;
  author: Partial<User>;
  type: 'discussion' | 'update' | 'opportunity' | 'question' | 'tutorial' | 'announcement' | 'win' | 'event' | 'resource';
  content: string;
  image?: string;
  likes: number;
  comments: number;
  reposts: number;
  bookmarks: number;
  liked: boolean;
  bookmarked: boolean;
  createdAt: string;
  tags: string[];
}
