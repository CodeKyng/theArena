import { createElement } from 'react'
import {
  ArrowUpRight, Bell, BriefcaseBusiness, CircleHelp, Compass, Flame, GraduationCap,
  LayoutDashboard, MessageCircle, Settings, Shield, Sparkles, Trophy, Users, Wallet, Zap,
} from 'lucide-react'

const icons = {
  Discover: Compass,
  Opportunities: BriefcaseBusiness,
  Communities: Users,
  Projects: Zap,
  Services: Sparkles,
  Events: Flame,
  'Learning Hub': GraduationCap,
  Grants: Wallet,
  Hackathons: Trophy,
  Bounties: ArrowUpRight,
  Organizations: Shield,
  Resources: CircleHelp,
  Discussions: MessageCircle,
  Leaderboard: Trophy,
  Dashboard: LayoutDashboard,
  Messages: MessageCircle,
  Notifications: Bell,
  Settings,
  'Admin Dashboard': Shield,
} as const

export default function IconForPage({ name, size = 17 }: { name: string; size?: number }) {
  const Icon = icons[name as keyof typeof icons] ?? Compass
  return createElement(Icon, { size, strokeWidth: 1.8 })
}
