import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

export function getReputationColor(level: string): string {
  const colors: Record<string, string> = {
    'Explorer':    'text-slate-400',
    'Participant': 'text-green-400',
    'Contributor': 'text-blue-400',
    'Builder':     'text-purple-400',
    'Leader':      'text-amber-400',
    'Pioneer':     'text-rose-400',
  };
  return colors[level] || 'text-slate-400';
}

export function getReputationBg(level: string): string {
  const colors: Record<string, string> = {
    'Explorer':    'bg-slate-500/20 text-slate-400 border-slate-500/30',
    'Participant': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Contributor': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Builder':     'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Leader':      'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Pioneer':     'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };
  return colors[level] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
}

export function getLevelFromXp(xp: number): string {
  if (xp >= 15000) return 'Pioneer';
  if (xp >= 7500)  return 'Leader';
  if (xp >= 3500)  return 'Builder';
  if (xp >= 1500)  return 'Contributor';
  if (xp >= 500)   return 'Participant';
  return 'Explorer';
}

export function getNextLevelXp(xp: number): number {
  if (xp >= 15000) return 15000;
  if (xp >= 7500)  return 15000;
  if (xp >= 3500)  return 7500;
  if (xp >= 1500)  return 3500;
  if (xp >= 500)   return 1500;
  return 500;
}

export function getXpProgress(xp: number): number {
  const levels = [0, 500, 1500, 3500, 7500, 15000];
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i]) {
      const next = levels[i + 1] ?? levels[i];
      if (next === levels[i]) return 100;
      return Math.round(((xp - levels[i]) / (next - levels[i])) * 100);
    }
  }
  return 0;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function getStatusStyle(status: string): string {
  const styles: Record<string, string> = {
    'Idea':                'status-idea',
    'Building':            'status-building',
    'Beta':                'status-beta',
    'Live':                'status-live',
    'Seeking Contributors':'status-seeking',
    'Open':                'status-live',
    'In Review':           'status-building',
    'Completed':           'bg-slate-500/20 text-slate-400 border border-slate-500/20',
    'Upcoming':            'bg-blue-500/20 text-blue-400 border border-blue-500/20',
    'Active':              'status-live',
    'Ended':               'bg-slate-500/20 text-slate-400 border border-slate-500/20',
  };
  return styles[status] || 'bg-slate-500/20 text-slate-400 border border-slate-500/20';
}

export function getDifficultyStyle(difficulty: string): string {
  const styles: Record<string, string> = {
    'Easy':   'bg-green-500/20 text-green-400 border border-green-500/20',
    'Medium': 'bg-amber-500/20 text-amber-400 border border-amber-500/20',
    'Hard':   'bg-rose-500/20 text-rose-400 border border-rose-500/20',
  };
  return styles[difficulty] || '';
}

export function getActivityStyle(level: string): string {
  const styles: Record<string, string> = {
    'Low':       'text-slate-400',
    'Medium':    'text-blue-400',
    'High':      'text-green-400',
    'Very High': 'text-emerald-400',
  };
  return styles[level] || 'text-slate-400';
}

export const ECOSYSTEMS = [
  'Ethereum', 'Base', 'Polygon', 'Arbitrum', 'Optimism', 'Solana', 'Avalanche', 'BNB Chain',
];

export const SKILL_CATEGORIES = [
  'Smart Contract Development', 'Frontend Development', 'Backend Development',
  'UI/UX Design', 'Graphic Design', 'Community Management', 'Marketing & Growth',
  'Content Writing', 'Research', 'Tokenomics', 'Security', 'Data Analysis',
  'Product Management', 'Business Development', 'Video Production',
];
