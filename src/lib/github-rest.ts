import type { GitHubMode, GitHubRepo, GitHubUserProfile } from "@/types/github";

const GITHUB_PROXY_BASE = "/api/github";

type RestResponse<T> = {
  data: T;
  mode: GitHubMode;
};

type SearchIssueResponse = {
  total_count: number;
};

function readModeFromHeaders(headers: Headers): GitHubMode {
  return headers.get("X-DevProfile-GitHub-Mode") === "token"
    ? "token"
    : "limited";
}

async function requestGitHub<T>(
  pathAndQuery: string,
): Promise<RestResponse<T>> {
  const response = await fetch(`${GITHUB_PROXY_BASE}/${pathAndQuery}`, {
    headers: {
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });

  const mode = readModeFromHeaders(response.headers);

  if (!response.ok) {
    throw new Error(`Falha na API REST do GitHub (${response.status}).`);
  }

  const data = (await response.json()) as T;

  return { data, mode };
}

async function requestIssueCount(
  query: string,
): Promise<{ count: number; mode: GitHubMode }> {
  const encodedQuery = encodeURIComponent(query);
  const { data, mode } = await requestGitHub<SearchIssueResponse>(
    `search/issues?q=${encodedQuery}&per_page=1`,
  );

  return {
    count: data.total_count ?? 0,
    mode,
  };
}

export async function fetchUserProfile(
  username: string,
): Promise<{ profile: GitHubUserProfile; mode: GitHubMode }> {
  const { data, mode } = await requestGitHub<GitHubUserProfile>(
    `users/${encodeURIComponent(username)}`,
  );

  return {
    profile: data,
    mode,
  };
}

export async function fetchUserRepos(
  username: string,
): Promise<{ repos: GitHubRepo[]; mode: GitHubMode }> {
  const { data, mode } = await requestGitHub<GitHubRepo[]>(
    `users/${encodeURIComponent(username)}/repos?type=owner&sort=updated&per_page=100`,
  );

  return {
    repos: data,
    mode,
  };
}

export async function fetchPullRequestStats(username: string): Promise<{
  open: number;
  merged: number;
  mode: GitHubMode;
}> {
  const [openResult, mergedResult] = await Promise.all([
    requestIssueCount(`author:${username} type:pr is:open`),
    requestIssueCount(`author:${username} type:pr is:merged`),
  ]);

  return {
    open: openResult.count,
    merged: mergedResult.count,
    mode:
      openResult.mode === "token" && mergedResult.mode === "token"
        ? "token"
        : "limited",
  };
}
