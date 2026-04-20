import type {
  ContributionCalendar,
  ContributionCalendarMonth,
  ContributionWeek,
  GitHubMode,
} from "@/types/github";

const GITHUB_GRAPHQL_PROXY = "/api/github/graphql";

const CONTRIBUTION_QUERY = `
  query ContributionCalendar($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        contributionCalendar {
          totalContributions
          months {
            name
            year
            firstDay
            totalWeeks
          }
          weeks {
            firstDay
            contributionDays {
              color
              contributionCount
              date
              weekday
            }
          }
        }
      }
    }
  }
`;

type ContributionCalendarResponse = {
  data?: {
    user?: {
      contributionsCollection?: {
        totalCommitContributions: number;
        contributionCalendar: ContributionCalendar;
      };
    };
  };
  errors?: Array<{ message: string }>;
};

function readModeFromHeaders(headers: Headers): GitHubMode {
  return headers.get("X-DevProfile-GitHub-Mode") === "token"
    ? "token"
    : "limited";
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, amount: number): Date {
  const clone = new Date(date);
  clone.setUTCDate(clone.getUTCDate() + amount);
  return clone;
}

function buildMonthsFromWeeks(
  weeks: ContributionWeek[],
): ContributionCalendarMonth[] {
  const monthMap = new Map<string, ContributionCalendarMonth>();

  for (const week of weeks) {
    const weekDate = new Date(`${week.firstDay}T00:00:00Z`);
    const key = `${weekDate.getUTCFullYear()}-${weekDate.getUTCMonth()}`;

    if (!monthMap.has(key)) {
      monthMap.set(key, {
        name: weekDate.toLocaleString("en-US", {
          month: "short",
          timeZone: "UTC",
        }),
        year: weekDate.getUTCFullYear(),
        firstDay: week.firstDay,
        totalWeeks: 1,
      });
    } else {
      const currentMonth = monthMap.get(key);
      if (currentMonth) {
        currentMonth.totalWeeks += 1;
      }
    }
  }

  return Array.from(monthMap.values());
}

export function buildEmptyContributionCalendar(
  toISO: string,
): ContributionCalendar {
  const toDate = new Date(toISO);
  const lastDate = new Date(
    Date.UTC(
      toDate.getUTCFullYear(),
      toDate.getUTCMonth(),
      toDate.getUTCDate(),
    ),
  );
  const firstDate = addDays(lastDate, -(52 * 7 - 1));

  const weeks: ContributionWeek[] = [];

  for (let weekIndex = 0; weekIndex < 52; weekIndex += 1) {
    const firstDay = addDays(firstDate, weekIndex * 7);
    const contributionDays = Array.from({ length: 7 }).map((_, dayIndex) => {
      const day = addDays(firstDay, dayIndex);
      return {
        date: toDateKey(day),
        contributionCount: 0,
        color: "#1e1e22",
        weekday: day.getUTCDay(),
      };
    });

    weeks.push({
      firstDay: toDateKey(firstDay),
      contributionDays,
    });
  }

  return {
    totalContributions: 0,
    weeks,
    months: buildMonthsFromWeeks(weeks),
  };
}

function normalizeCalendar(
  calendar: ContributionCalendar,
): ContributionCalendar {
  const weeks = calendar.weeks.slice(-52);

  if (weeks.length === 52) {
    return {
      ...calendar,
      weeks,
      months: buildMonthsFromWeeks(weeks),
    };
  }

  const padded = buildEmptyContributionCalendar(new Date().toISOString());
  const mergedWeeks = [...padded.weeks.slice(weeks.length), ...weeks].slice(
    -52,
  );

  return {
    totalContributions: calendar.totalContributions,
    weeks: mergedWeeks,
    months: buildMonthsFromWeeks(mergedWeeks),
  };
}

export async function fetchContributionCalendar(params: {
  username: string;
  fromISO: string;
  toISO: string;
}): Promise<{
  calendar: ContributionCalendar;
  totalCommitContributions: number;
  mode: GitHubMode;
  hasGraphData: boolean;
}> {
  const response = await fetch(GITHUB_GRAPHQL_PROXY, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: CONTRIBUTION_QUERY,
      variables: {
        username: params.username,
        from: params.fromISO,
        to: params.toISO,
      },
    }),
    cache: "no-store",
  });

  const mode = readModeFromHeaders(response.headers);

  if (!response.ok) {
    return {
      calendar: buildEmptyContributionCalendar(params.toISO),
      totalCommitContributions: 0,
      mode,
      hasGraphData: false,
    };
  }

  const payload = (await response.json()) as ContributionCalendarResponse;

  const contributionCollection = payload.data?.user?.contributionsCollection;

  if (!contributionCollection || payload.errors?.length) {
    return {
      calendar: buildEmptyContributionCalendar(params.toISO),
      totalCommitContributions: 0,
      mode,
      hasGraphData: false,
    };
  }

  return {
    calendar: normalizeCalendar(contributionCollection.contributionCalendar),
    totalCommitContributions:
      contributionCollection.totalCommitContributions ?? 0,
    mode,
    hasGraphData: true,
  };
}
