import "server-only";

function readTrimmedEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

export function getGitHubToken(): string | undefined {
  return readTrimmedEnv("GITHUB_TOKEN");
}

export const serverEnv = {
  ADMIN_ROUTE_SLUG: readTrimmedEnv("ADMIN_ROUTE_SLUG"),
  ADMIN_PASSWORD_HASH: readTrimmedEnv("ADMIN_PASSWORD_HASH"),
  ADMIN_SESSION_SECRET: readTrimmedEnv("ADMIN_SESSION_SECRET"),
  KV_REST_API_URL: readTrimmedEnv("KV_REST_API_URL"),
  KV_REST_API_TOKEN: readTrimmedEnv("KV_REST_API_TOKEN"),
} as const;
