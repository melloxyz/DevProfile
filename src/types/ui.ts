export type AchievementMetric =
  | "commitsTotal"
  | "publicRepos"
  | "starsTotal"
  | "prsMerged"
  | "streakCurrent"
  | "streakMax"
  | "languagesDistinct"
  | "followers";

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  metric: AchievementMetric;
  target: number;
}

export interface AchievementProgress extends AchievementDefinition {
  current: number;
  unlocked: boolean;
  progressLabel: string;
}
