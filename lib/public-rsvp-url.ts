/**
 * Public RSVP link resolution.
 *
 * 1. Prefer `NEXT_PUBLIC_APP_URL` + invite code when the API URL is missing or
 *    points at localhost/127.0.0.1 (common when backend env still has dev defaults).
 * 2. Otherwise use `publicRsvpUrl` from the API.
 * 3. Fall back to `NEXT_PUBLIC_APP_URL` + invite code when only code is known.
 *
 * Set NEXT_PUBLIC_APP_URL in .env.local (local) and in your host env (prod).
 */

function configuredAppBase(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") || "";
}

function extractInviteCodeFromUrl(url: string): string | null {
  try {
    const match = new URL(url).pathname.match(/\/rsvp\/([^/]+)\/?$/);
    return match?.[1]?.trim() || null;
  } catch {
    return null;
  }
}

function isLocalDevOrigin(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

export function resolvePublicRsvpUrl(
  backendUrl?: string | null,
  inviteCode?: string | null,
): string {
  const base = configuredAppBase();
  const url = backendUrl?.trim() || "";
  const code =
    inviteCode?.trim() ||
    (url ? extractInviteCodeFromUrl(url) : null) ||
    "";

  if (base && code && (!url || isLocalDevOrigin(url))) {
    return `${base}/rsvp/${code}`;
  }

  if (url) return url;
  if (base && code) return `${base}/rsvp/${code}`;
  return "";
}
