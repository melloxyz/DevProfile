import "server-only";

import type { NextRequest } from "next/server";

type LoginRateLimitState = {
  failedAttempts: number;
  windowStartedAt: number;
  blockedUntil: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000;

const loginAttempts = new Map<string, LoginRateLimitState>();

function getOrInitState(ip: string, now: number): LoginRateLimitState {
  const current = loginAttempts.get(ip);

  if (!current || now - current.windowStartedAt > WINDOW_MS) {
    const freshState: LoginRateLimitState = {
      failedAttempts: 0,
      windowStartedAt: now,
      blockedUntil: 0,
    };

    loginAttempts.set(ip, freshState);
    return freshState;
  }

  return current;
}

export function readRequestIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  return realIp?.trim() || "unknown";
}

export function checkLoginRateLimit(ip: string): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const state = getOrInitState(ip, now);

  if (state.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((state.blockedUntil - now) / 1000),
    };
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}

export function registerFailedLoginAttempt(ip: string): void {
  const now = Date.now();
  const state = getOrInitState(ip, now);

  state.failedAttempts += 1;

  if (state.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    state.failedAttempts = 0;
    state.windowStartedAt = now;
    state.blockedUntil = now + BLOCK_DURATION_MS;
  }

  loginAttempts.set(ip, state);
}

export function clearLoginRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}
