/**
 * Public app link resolution for RSVP and team join URLs.
 *
 * Shared links always prefer `NEXT_PUBLIC_APP_URL` when set (local .env.local or Amplify).
 * Backend-generated URLs are only used when they point at a non-localhost origin and
 * NEXT_PUBLIC_APP_URL is unset.
 *
 * Set NEXT_PUBLIC_APP_URL in .env.local (local) and in your host env (prod/staging).
 */

export function getConfiguredAppBase(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") || "";
}

function extractPathToken(url: string, segment: "rsvp" | "join"): string | null {
  try {
    const match = new URL(url).pathname.match(new RegExp(`\\/${segment}\\/([^/]+)\\/?$`));
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

function resolvePublicAppPath(
  segment: "rsvp" | "join",
  backendUrl?: string | null,
  token?: string | null,
): string {
  const base = getConfiguredAppBase();
  const url = backendUrl?.trim() || "";
  const code =
    token?.trim() ||
    (url ? extractPathToken(url, segment) : null) ||
    "";

  if (base && code) {
    return `${base}/${segment}/${code}`;
  }

  if (url && !isLocalDevOrigin(url)) {
    return url;
  }

  return "";
}

export function buildPublicRsvpUrl(inviteCode: string): string {
  return resolvePublicAppPath("rsvp", null, inviteCode);
}

export function resolvePublicRsvpUrl(
  backendUrl?: string | null,
  inviteCode?: string | null,
): string {
  return resolvePublicAppPath("rsvp", backendUrl, inviteCode);
}

export function resolvePublicJoinUrl(
  backendUrl?: string | null,
  inviteCode?: string | null,
): string {
  return resolvePublicAppPath("join", backendUrl, inviteCode);
}
