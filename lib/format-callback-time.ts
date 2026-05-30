export function formatCallbackAt(iso: string | null | undefined) {
  if (!iso) return "Not scheduled";

  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}
