"use client";

import { useQuery } from "@tanstack/react-query";

import { calculateAchievements } from "@/lib/achievements-engine";
import { fetchContributionCalendar } from "@/lib/github-graphql";
import {
  fetchPullRequestStats,
  fetchUserProfile,
  fetchUserRepos,
} from "@/lib/github-rest";
import { publicEnv } from "@/lib/env.public";
import type {
  ContributionCalendar,
  GitHubLanguageStat,
  GitHubMetrics,
  GitHubMode,
  GitHubRepo,
} from "@/types/github";
import type { AchievementProgress } from "@/types/ui";

type GitHubInsightsData = {
  metrics: GitHubMetrics;
  achievements: AchievementProgress[];
  hasGraphData: boolean;
};

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#DEA584",
  Java: "#b07219",
  CSS: "#563d7c",
  HTML: "#e34c26",
  Shell: "#89e051",
};

function getRollingDateRange() {
  const today = new Date();
  const toDate = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  const fromDate = new Date(toDate);
  fromDate.setUTCDate(fromDate.getUTCDate() - 364);

  return {
    fromISO: fromDate.toISOString(),
    toISO: toDate.toISOString(),
  };
}

function mergeMode(modes: GitHubMode[]): GitHubMode {
  return modes.every((mode) => mode === "token") ? "token" : "limited";
}

function buildLanguageStats(repos: GitHubRepo[]): {
  languages: GitHubLanguageStat[];
  mainLanguage: string;
  languageDiversity: number;
} {
  const relevantRepos = repos.filter((repo) => !repo.fork && !repo.archived);
  const sourceRepos = relevantRepos.length > 0 ? relevantRepos : repos;

  const counts = new Map<string, number>();

  for (const repo of sourceRepos) {
    if (!repo.language) {
      continue;
    }

    counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  }

  const total = Array.from(counts.values()).reduce(
    (sum, count) => sum + count,
    0,
  );

  if (total === 0) {
    return {
      languages: [],
      mainLanguage: "N/A",
      languageDiversity: 0,
    };
  }

  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);

  const topEntries = sorted.slice(0, 8);
  const otherCount = sorted.slice(8).reduce((sum, [, count]) => sum + count, 0);

  const normalized = topEntries.map(([name, count]) => ({
    name,
    count,
    percentage: Number(((count / total) * 100).toFixed(1)),
    color: LANGUAGE_COLORS[name] ?? "#94a3b8",
  }));

  if (otherCount > 0) {
    normalized.push({
      name: "Other",
      count: otherCount,
      percentage: Number(((otherCount / total) * 100).toFixed(1)),
      color: "#64748b",
    });
  }

  return {
    languages: normalized,
    mainLanguage: sorted[0]?.[0] ?? "N/A",
    languageDiversity: counts.size,
  };
}

function calculateStreak(calendar: ContributionCalendar) {
  const days = calendar.weeks
    .flatMap((week) => week.contributionDays)
    .sort((a, b) => a.date.localeCompare(b.date));

  let max = 0;
  let running = 0;

  for (const day of days) {
    if (day.contributionCount > 0) {
      running += 1;
      max = Math.max(max, running);
    } else {
      running = 0;
    }
  }

  let current = 0;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (days[index]?.contributionCount > 0) {
      current += 1;
    } else {
      break;
    }
  }

  return {
    current,
    max,
  };
}

async function fetchGitHubInsights(): Promise<GitHubInsightsData> {
  const username = publicEnv.githubUsername;

  const { fromISO, toISO } = getRollingDateRange();

  const [profileResult, reposResult, pullRequestsResult, contributionResult] =
    await Promise.all([
      fetchUserProfile(username),
      fetchUserRepos(username),
      fetchPullRequestStats(username),
      fetchContributionCalendar({ username, fromISO, toISO }),
    ]);

  const mode = mergeMode([
    profileResult.mode,
    reposResult.mode,
    pullRequestsResult.mode,
    contributionResult.mode,
  ]);

  const starsTotal = reposResult.repos.reduce(
    (sum, repo) => sum + (repo.stargazers_count ?? 0),
    0,
  );

  const { languages, mainLanguage, languageDiversity } = buildLanguageStats(
    reposResult.repos,
  );

  const streak = calculateStreak(contributionResult.calendar);

  const metrics: GitHubMetrics = {
    mode,
    isLimited: mode === "limited",
    user: profileResult.profile,
    repos: reposResult.repos,
    starsTotal,
    pullRequests: {
      open: pullRequestsResult.open,
      merged: pullRequestsResult.merged,
    },
    commitTotalLastYear: contributionResult.totalCommitContributions,
    contributionCalendar: contributionResult.calendar,
    languages,
    mainLanguage,
    languageDiversity,
    streak,
    lastUpdated: new Date().toISOString(),
  };

  return {
    metrics,
    achievements: calculateAchievements(metrics),
    hasGraphData: contributionResult.hasGraphData,
  };
}

export function useGitHubData(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["github-insights", publicEnv.githubUsername],
    queryFn: fetchGitHubInsights,
    enabled: options?.enabled ?? true,
  });
}
