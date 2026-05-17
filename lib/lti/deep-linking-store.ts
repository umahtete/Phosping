import { randomUUID } from "crypto";

/**
 * Settings received from the LTI platform during a deep linking launch.
 * Stored server-side to avoid cookie size limits — Moodle's `data` field
 * can exceed 4KB, causing silent failures with cookie-based approaches.
 */
export interface DeepLinkingSettings {
  deep_link_return_url: string;
  accept_presentation_document_targets: string[];
  data?: string;
  accept_types?: string[];
  accept_multiple?: boolean;
  auto_create?: boolean;
}

const TTL_MS = 10 * 60 * 1000; // 10 minutes
const CLEANUP_INTERVAL_MS = 60 * 1000; // 60 seconds

type Entry = { settings: DeepLinkingSettings; createdAt: number };

const store = new Map<string, Entry>();

// Periodically purge expired entries so the map doesn't grow unbounded.
// `.unref()` ensures the timer won't prevent the process from exiting.
const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.createdAt > TTL_MS) {
      store.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);
cleanup.unref();

/**
 * Persist deep linking settings and return a unique key the client
 * can reference in subsequent requests (e.g. via a hidden form field).
 */
export function storeSettings(settings: DeepLinkingSettings): string {
  const key = randomUUID();
  store.set(key, { settings, createdAt: Date.now() });
  return key;
}

/**
 * Retrieve previously stored settings. Returns `null` when the key is
 * unknown or the entry has exceeded its TTL.
 */
export function getSettings(key: string): DeepLinkingSettings | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > TTL_MS) {
    store.delete(key);
    return null;
  }
  return entry.settings;
}

/**
 * Remove settings after they have been consumed (one-time use).
 */
export function deleteSettings(key: string): void {
  store.delete(key);
}
