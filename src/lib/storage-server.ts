import "server-only";

import { unstable_cache } from "next/cache";

import {
  DEFAULT_CERTIFICATES,
  DEFAULT_EVENTS,
  DEFAULT_LINKS,
  DEFAULT_PROFILE,
  DEFAULT_PROJECTS,
} from "@/config/defaults";
import {
  isKvConfigured,
  PUBLIC_CONTENT_KV_KEY,
  readKvJson,
  writeKvJson,
} from "@/lib/kv-store.server";
import type {
  Certificate,
  EventItem,
  ProfileData,
  Project,
  PublicContentSnapshot,
  QuickLink,
  StatusColor,
} from "@/types/profile";

export const PUBLIC_CONTENT_CACHE_TAG = "public-content";

const STATUS_COLORS: StatusColor[] = ["green", "yellow", "blue", "red"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readRequiredString(
  value: unknown,
  options?: { allowEmpty?: boolean },
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!options?.allowEmpty && trimmed.length === 0) {
    return null;
  }

  return trimmed;
}

function readOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readStatusColor(value: unknown): StatusColor | null {
  if (typeof value !== "string") {
    return null;
  }

  return STATUS_COLORS.includes(value as StatusColor)
    ? (value as StatusColor)
    : null;
}

function normalizeProfileData(input: unknown): ProfileData | null {
  if (!isRecord(input)) {
    return null;
  }

  const displayName = readRequiredString(input.displayName);
  const username = readRequiredString(input.username);
  const bio = readRequiredString(input.bio);
  const statusText = readRequiredString(input.statusText);
  const statusColor = readStatusColor(input.statusColor);

  if (!displayName || !username || !bio || !statusText || !statusColor) {
    return null;
  }

  const bannerUrlRaw = input.bannerUrl;
  const bannerUrl =
    bannerUrlRaw === null ? null : (readOptionalString(bannerUrlRaw) ?? null);

  return {
    displayName,
    username: username.replace(/^@/, ""),
    bio,
    statusText,
    statusColor,
    bannerUrl,
  };
}

export function parseQuickLinksInput(input: unknown): QuickLink[] | null {
  if (!Array.isArray(input)) {
    return null;
  }

  if (input.length > 12) {
    return null;
  }

  const normalized: QuickLink[] = [];

  for (const item of input) {
    if (!isRecord(item)) {
      return null;
    }

    const id = readRequiredString(item.id) ?? crypto.randomUUID();
    const label = readRequiredString(item.label);
    const url = readRequiredString(item.url);
    const iconText = readRequiredString(item.iconText);

    if (!label || !url || !iconText) {
      return null;
    }

    normalized.push({
      id,
      label,
      url,
      iconText,
    });
  }

  return normalized;
}

function normalizeStack(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const stack = value
    .map((item) => readRequiredString(item))
    .filter((item): item is string => Boolean(item));

  return stack;
}

export function parseProjectsInput(input: unknown): Project[] | null {
  if (!Array.isArray(input)) {
    return null;
  }

  const normalized: Project[] = [];

  for (const item of input) {
    if (!isRecord(item)) {
      return null;
    }

    const id = readRequiredString(item.id) ?? crypto.randomUUID();
    const name = readRequiredString(item.name);
    const description = readRequiredString(item.description);
    const stack = normalizeStack(item.stack);
    const repoUrl = readRequiredString(item.repoUrl);
    const demoUrl = readOptionalString(item.demoUrl);
    const thumbnailUrl = readOptionalString(item.thumbnailUrl);

    if (!name || !description || !stack || !repoUrl) {
      return null;
    }

    normalized.push({
      id,
      name,
      description,
      stack,
      repoUrl,
      demoUrl,
      thumbnailUrl,
    });
  }

  return normalized;
}

function parseCredentialEntry(input: Record<string, unknown>): {
  titulo: string;
  instituicao: string;
  emitido_em: string;
  codigo_credencial: string;
  url_validador: string;
} | null {
  const titulo = readRequiredString(input.titulo ?? input.title ?? input.name);
  const instituicao = readRequiredString(
    input.instituicao ?? input.issuer ?? input.location,
  );
  const emitidoEm = readRequiredString(input.emitido_em ?? input.date);
  const codigoCredencial = readRequiredString(
    input.codigo_credencial ?? input.id,
  );
  const urlValidador = readRequiredString(
    input.url_validador ?? input.verificationUrl ?? input.url,
  );

  if (
    !titulo ||
    !instituicao ||
    !emitidoEm ||
    !codigoCredencial ||
    !urlValidador
  ) {
    return null;
  }

  return {
    titulo,
    instituicao,
    emitido_em: emitidoEm,
    codigo_credencial: codigoCredencial,
    url_validador: urlValidador,
  };
}

export function parseCertificatesInput(input: unknown): Certificate[] | null {
  if (!Array.isArray(input)) {
    return null;
  }

  const normalized: Certificate[] = [];

  for (const item of input) {
    if (!isRecord(item)) {
      return null;
    }

    const parsed = parseCredentialEntry(item);

    if (!parsed) {
      return null;
    }

    normalized.push(parsed);
  }

  return normalized;
}

export function parseEventsInput(input: unknown): EventItem[] | null {
  if (!Array.isArray(input)) {
    return null;
  }

  const normalized: EventItem[] = [];

  for (const item of input) {
    if (!isRecord(item)) {
      return null;
    }

    const parsed = parseCredentialEntry(item);

    if (!parsed) {
      return null;
    }

    normalized.push(parsed);
  }

  return normalized;
}

function createDefaultSnapshot(): PublicContentSnapshot {
  return {
    profile: structuredClone(DEFAULT_PROFILE),
    quickLinks: structuredClone(DEFAULT_LINKS),
    projects: structuredClone(DEFAULT_PROJECTS),
    certificates: structuredClone(DEFAULT_CERTIFICATES),
    events: structuredClone(DEFAULT_EVENTS),
    updatedAt: new Date().toISOString(),
  };
}

function normalizeSnapshot(input: unknown): PublicContentSnapshot | null {
  if (!isRecord(input)) {
    return null;
  }

  const profile = normalizeProfileData(input.profile);
  const quickLinks = parseQuickLinksInput(input.quickLinks);
  const projects = parseProjectsInput(input.projects);
  const certificates = parseCertificatesInput(input.certificates);
  const events = parseEventsInput(input.events);

  if (!profile || !quickLinks || !projects || !certificates || !events) {
    return null;
  }

  const updatedAt =
    readRequiredString(input.updatedAt) ?? new Date().toISOString();

  return {
    profile,
    quickLinks,
    projects,
    certificates,
    events,
    updatedAt,
  };
}

async function readStoreFromKv(): Promise<PublicContentSnapshot> {
  const parsed = await readKvJson<unknown>(PUBLIC_CONTENT_KV_KEY);
  const normalized = normalizeSnapshot(parsed);

  if (!normalized && isKvConfigured()) {
    const fallback = createDefaultSnapshot();
    await writeKvJson(PUBLIC_CONTENT_KV_KEY, fallback);
    return fallback;
  }

  if (!normalized) {
    return createDefaultSnapshot();
  }

  return normalized;
}

async function writeStoreToKv(
  snapshot: PublicContentSnapshot,
): Promise<PublicContentSnapshot> {
  const withTimestamp: PublicContentSnapshot = {
    ...snapshot,
    updatedAt: new Date().toISOString(),
  };

  await writeKvJson(PUBLIC_CONTENT_KV_KEY, withTimestamp);

  return withTimestamp;
}

export async function readPublicContentSnapshot(): Promise<PublicContentSnapshot> {
  return readStoreFromKv();
}

const readPublicContentSnapshotCachedFn = unstable_cache(
  async () => readStoreFromKv(),
  ["dev-profile-public-content-v3"],
  {
    tags: [PUBLIC_CONTENT_CACHE_TAG],
  },
);

export async function readPublicContentSnapshotCached(): Promise<PublicContentSnapshot> {
  return readPublicContentSnapshotCachedFn();
}

export async function updatePublicContentSnapshot(
  updater: (current: PublicContentSnapshot) => PublicContentSnapshot,
): Promise<PublicContentSnapshot> {
  const current = await readStoreFromKv();
  const candidate = updater(structuredClone(current));
  const normalized = normalizeSnapshot(candidate);

  if (!normalized) {
    throw new Error("Dados invalidos para persistencia.");
  }

  return writeStoreToKv(normalized);
}

export async function replacePublicContentSnapshot(
  input: unknown,
): Promise<PublicContentSnapshot> {
  const normalized = normalizeSnapshot(input);

  if (!normalized) {
    throw new Error("Payload de backup invalido.");
  }

  return writeStoreToKv(normalized);
}

export async function resetPublicContentSnapshot(): Promise<PublicContentSnapshot> {
  return writeStoreToKv(createDefaultSnapshot());
}
