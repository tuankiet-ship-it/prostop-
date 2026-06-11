export enum LevelName {
  Bronze = 'Bronze',
  Silver = 'Silver',
  Gold = 'Gold',
  Diamond = 'Diamond',
  Master = 'Master',
  Legend = 'Legend'
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  dailyLimitMinutes: number; // e.g. 30, 60, 120, 180
  currentUsageMinutes: number; // incremental social media usage
  xp: number;
  level: LevelName;
  streak: number;
  timeSavedMinutes: number; // accumulated time from Choosing learning over scrolling
  skillsLearnedCount: number; // count of completed challenges
  lastActiveAt?: string;
}

export type ChallengeType = 'learn' | 'article' | 'podcast' | 'speak' | 'workout' | 'quiz';

export interface CompletedChallenge {
  id: string;
  userId: string;
  type: ChallengeType;
  title: string;
  xpEarned: number;
  completedAt: string;
}

export interface CoachMessage {
  id: string;
  userId: string;
  sender: 'user' | 'ai';
  text: string;
  createdAt: string;
}

export interface Group {
  groupId: string;
  name: string;
  creatorId: string;
  memberUids: string[];
  totalXp: number;
  createdAt: string;
}

export interface MarketTrend {
  skill: string;
  change: string;
  isPositive: boolean;
  value: string;
}

export interface DailyMission {
  id: string;
  title: string;
  isChecked: boolean;
  xpReward: number;
}
