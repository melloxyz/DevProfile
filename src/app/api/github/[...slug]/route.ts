import { NextRequest, NextResponse } from "next/server";

import { getGitHubToken } from "@/lib/env.server";

const GITHUB_API_BASE = "https://api.github.com";
const PROXY_USER_AGENT = "dev-profile-proxy";
const FORWARDED_RESPONSE_HEADERS = [
  "content-type",
  "cache-control",
  "etag",
  "last-modified",
  "x-ratelimit-limit",
  "x-ratelimit-remaining",
  "x-ratelimit-reset",
  "x-ratelimit-resource",
  "x-ratelimit-used",
] as const;

type RouteParams = {
  slug: string[];
};

type HandlerContext = {
  params: Promise<RouteParams>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildGitHubUrl(slug: string[], search: string): string {
  const endpoint = slug.map((part) => encodeURIComponent(part)).join("/");
  return `${GITHUB_API_BASE}/${endpoint}${search}`;
}

function buildRequestHeaders(request: NextRequest, token?: string): Headers {
  const headers = new Headers();

  headers.set(
    "Accept",
    request.headers.get("accept") ?? "application/vnd.github+json",
  );
  headers.set("User-Agent", PROXY_USER_AGENT);
  headers.set("X-GitHub-Api-Version", "2022-11-28");

  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch) {
    headers.set("If-None-Match", ifNoneMatch);
  }

  const ifModifiedSince = request.headers.get("if-modified-since");
  if (ifModifiedSince) {
    headers.set("If-Modified-Since", ifModifiedSince);
  }

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

function buildResponseHeaders(response: Response, hasToken: boolean): Headers {
  const headers = new Headers();

  for (const headerName of FORWARDED_RESPONSE_HEADERS) {
    const headerValue = response.headers.get(headerName);
    if (headerValue) {
      headers.set(headerName, headerValue);
    }
  }

  headers.set("X-DevProfile-GitHub-Mode", hasToken ? "token" : "limited");
  headers.set("X-Content-Type-Options", "nosniff");

  return headers;
}

async function getProxyBody(
  request: NextRequest,
): Promise<BodyInit | undefined> {
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined;
  }

  const rawBody = await request.text();
  return rawBody.length > 0 ? rawBody : undefined;
}

async function proxyToGitHub(
  request: NextRequest,
  slug: string[],
): Promise<NextResponse> {
  if (slug.length === 0) {
    return NextResponse.json(
      {
        error: "Informe um endpoint para o proxy do GitHub.",
      },
      { status: 400 },
    );
  }

  const token = getGitHubToken();
  const targetUrl = buildGitHubUrl(slug, request.nextUrl.search);

  try {
    const githubResponse = await fetch(targetUrl, {
      method: request.method,
      headers: buildRequestHeaders(request, token),
      body: await getProxyBody(request),
      cache: "no-store",
    });

    const responseBuffer = await githubResponse.arrayBuffer();

    return new NextResponse(responseBuffer, {
      status: githubResponse.status,
      headers: buildResponseHeaders(githubResponse, Boolean(token)),
    });
  } catch {
    return NextResponse.json(
      {
        error: "Falha ao consultar a API do GitHub.",
      },
      {
        status: 502,
        headers: {
          "X-DevProfile-GitHub-Mode": token ? "token" : "limited",
        },
      },
    );
  }
}

async function handleProxy(
  request: NextRequest,
  { params }: HandlerContext,
): Promise<NextResponse> {
  const { slug } = await params;
  return proxyToGitHub(request, slug);
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const HEAD = handleProxy;

export function OPTIONS(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS",
    },
  });
}
