import type { AuthUser } from "@/lib/api";

export const AUTH_TOKEN_KEY = "eventpilot.token";
export const AUTH_USER_KEY = "eventpilot.user";
export const AUTH_EVENT_KEY = "eventpilot.currentEventId";

export function persistAuthSession(result: { accessToken: string; user: AuthUser }) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, result.accessToken);
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(result.user));
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
  window.localStorage.removeItem(AUTH_EVENT_KEY);
}

export function readAuthSession(): { token: string | null; user: AuthUser | null } {
  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
  const rawUser = window.localStorage.getItem(AUTH_USER_KEY);
  if (!rawUser) return { token, user: null };
  try {
    return { token, user: JSON.parse(rawUser) as AuthUser };
  } catch {
    window.localStorage.removeItem(AUTH_USER_KEY);
    return { token, user: null };
  }
}
