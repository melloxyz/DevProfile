export type GitHubMode = "token" | "limited";

export interface GitHubUserProfile {
  login: string;
  name: string | null;
  avatar_url: string;
  followers: number;
  public_repos: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  private: boolean;
  fork: boolean;
  archived: boolean;
  pushed_at: string;
}

export interface ContributionDay {
  date: string;
  contributionCount: number;
  color: string;
  weekday: number;
}

export interface ContributionWeek {
  firstDay: string;
  contributionDays: ContributionDay[];
}

export interface ContributionCalendarMonth {
  name: string;
  year: number;
  firstDay: string;
  totalWeeks: number;
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
  months: ContributionCalendarMonth[];
}

export interface GitHubLanguageStat {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface GitHubStreak {
  current: number;
  max: number;
}

export interface GitHubPullRequestStats {
  open: number;
  merged: number;
}

export interface GitHubMetrics {
  mode: GitHubMode;
  isLimited: boolean;
  user: GitHubUserProfile;
  repos: GitHubRepo[];
  starsTotal: number;
  pullRequests: GitHubPullRequestStats;
  commitTotalLastYear: number;
  contributionCalendar: ContributionCalendar;
  languages: GitHubLanguageStat[];
  mainLanguage: string;
  languageDiversity: number;
  streak: GitHubStreak;
  lastUpdated: string;
}
