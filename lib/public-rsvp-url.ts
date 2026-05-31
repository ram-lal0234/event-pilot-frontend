/**
 * Public RSVP link resolution (frontend fallback only).
 *
 * 1. `publicRsvpUrl` from the API — preferred. Built on the backend from
 *    PUBLIC_RSVP_BASE_URL / PUBLIC_APP_URL for that deploy.
 * 2. `NEXT_PUBLIC_APP_URL` + invite code — only when the API did not include a URL.
 *
 * We do not use window.location.origin: the dev port can change (3000 vs 3001),
 * and links must match what you configure for staging/production, not whatever
 * tab the organizer happened to have open.
 *
 * Set NEXT_PUBLIC_APP_URL in .env.local (local) and in your host's env (prod).
 */
export function resolvePublicRsvpUrl(
  backendUrl?: string | null,
  inviteCode?: string | null,
): string {
  const url = backendUrl?.trim();
  if (url) return url;

  const code = inviteCode?.trim();
  if (!code) return "";

  const base = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!base) return "";

  return `${base.replace(/\/$/, "")}/rsvp/${code}`;
}
