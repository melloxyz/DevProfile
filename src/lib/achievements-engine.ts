import { ACHIEVEMENT_DEFINITIONS } from "@/config/achievements";
import type { GitHubMetrics } from "@/types/github";
import type { AchievementMetric, AchievementProgress } from "@/types/ui";

function readMetricValue(
  metric: AchievementMetric,
  metrics: GitHubMetrics,
): number {
  switch (metric) {
    case "commitsTotal":
      return metrics.commitTotalLastYear;
    case "publicRepos":
      return metrics.user.public_repos;
    case "starsTotal":
      return metrics.starsTotal;
    case "prsMerged":
      return metrics.pullRequests.merged;
    case "streakCurrent":
      return metrics.streak.current;
    case "streakMax":
      return metrics.streak.max;
    case "languagesDistinct":
      return metrics.languageDiversity;
    case "followers":
      return metrics.user.followers;
    default:
      return 0;
  }
}

export function calculateAchievements(
  metrics: GitHubMetrics,
): AchievementProgress[] {
  return ACHIEVEMENT_DEFINITIONS.map((achievement) => {
    const current = readMetricValue(achievement.metric, metrics);
    const unlocked = current >= achievement.target;

    return {
      ...achievement,
      current,
      unlocked,
      progressLabel: `${current.toLocaleString("pt-BR")} / ${achievement.target.toLocaleString("pt-BR")}`,
    };
  });
}
