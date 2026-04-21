import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { Redis } from "@upstash/redis";

const PUBLIC_CONTENT_KV_KEY = "devprofile:public-content:v1";

function readEnv(name) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function resolveKvCredentials() {
  const url = readEnv("KV_REST_API_URL") ?? readEnv("UPSTASH_REDIS_REST_URL");
  const token =
    readEnv("KV_REST_API_TOKEN") ?? readEnv("UPSTASH_REDIS_REST_TOKEN");

  if (!url || !token) {
    throw new Error(
      "KV nao configurado. Defina KV_REST_API_URL e KV_REST_API_TOKEN (ou UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN).",
    );
  }

  return { url, token };
}

async function readSnapshotFromDisk() {
  const snapshotPath = path.join(
    process.cwd(),
    ".data",
    "dev-profile-content.json",
  );
  const raw = await fs.readFile(snapshotPath, "utf8");
  return JSON.parse(raw);
}

async function main() {
  const { url, token } = resolveKvCredentials();
  const redis = new Redis({ url, token });

  const snapshot = await readSnapshotFromDisk();
  await redis.set(PUBLIC_CONTENT_KV_KEY, snapshot);

  console.log(`Seed concluido com sucesso em ${PUBLIC_CONTENT_KV_KEY}.`);
}

main().catch((error) => {
  console.error("Falha ao executar seed no KV.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
