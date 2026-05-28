/** Initials and display labels for the signed-in user (header, profile, menus). */
export function profileInitials(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  const local = email.split("@")[0] ?? "";
  return (local.slice(0, 2) || "U").toUpperCase();
}

export function userDisplayName(name: string | null | undefined, email: string) {
  const trimmed = (name ?? "").trim();
  if (trimmed) return trimmed;
  const local = email.split("@")[0] ?? "User";
  return local.charAt(0).toUpperCase() + local.slice(1);
}
