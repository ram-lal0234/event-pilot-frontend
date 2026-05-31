import type { AuditRecord } from "@/lib/api";

function metadataName(metadata: AuditRecord["metadata"]): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const record = metadata as Record<string, unknown>;
  const name = record.guestName ?? record.name ?? record.guest_name;
  return typeof name === "string" && name.trim() ? name.trim() : null;
}

export function formatAuditAction(action: string) {
  return action.replaceAll("_", " ").toLowerCase();
}

/** Human-readable secondary line for activity feeds (prefer guest name over id). */
export function formatAuditEntityLabel(item: AuditRecord) {
  const name = metadataName(item.metadata);
  if (name) return name;
  if (item.entityType === "Guest") return "Guest";
  if (item.entityType === "GuestImport") return "Guest import";
  return item.entityType;
}
