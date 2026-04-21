import "server-only";

import { Redis } from "@upstash/redis";

import { serverEnv } from "@/lib/env.server";

export const PUBLIC_CONTENT_KV_KEY = "devprofile:public-content:v1";
export const ADMIN_AUTH_SETTINGS_KV_KEY = "devprofile:admin-auth-settings:v1";

let kvClient: Redis | null | undefined;

function createKvClient(): Redis | null {
  const url = serverEnv.KV_REST_API_URL;
  const token = serverEnv.KV_REST_API_TOKEN;

  if (!url || !token) {
    return null;
  }

  return new Redis({
    url,
    token,
  });
}

function getKvClient(): Redis | null {
  if (kvClient !== undefined) {
    return kvClient;
  }

  kvClient = createKvClient();
  return kvClient;
}

function getRequiredKvClient(): Redis {
  const client = getKvClient();

  if (!client) {
    throw new Error(
      "KV nao configurado. Defina KV_REST_API_URL e KV_REST_API_TOKEN (ou UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN).",
    );
  }

  return client;
}

export function isKvConfigured(): boolean {
  return getKvClient() !== null;
}

export async function readKvJson<T>(key: string): Promise<T | null> {
  const client = getKvClient();

  if (!client) {
    return null;
  }

  const value = await client.get<T>(key);
  return value ?? null;
}

export async function writeKvJson(key: string, value: unknown): Promise<void> {
  const client = getRequiredKvClient();
  await client.set(key, value);
}
