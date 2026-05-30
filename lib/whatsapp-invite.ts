import type { EventRecord, GuestRecord } from "@/lib/api";
import { parsePhoneE164 } from "@/lib/phone";

export const WHATSAPP_SETTINGS_STORAGE_PREFIX = "eventpilot.whatsapp.settings.v1";

export const DEFAULT_WHATSAPP_MESSAGE_TEMPLATE = `Hi {{guestName}},

You're invited to {{eventName}}. Please confirm your RSVP here:
{{rsvpLink}}

— EventPilot AI`;

export type WhatsAppInviteSettings = {
  messageTemplate: string;
  includeRsvpLink: boolean;
  imageDataUrl: string | null;
  imageName: string | null;
  /** Override for local bridge; empty uses NEXT_PUBLIC_WHATSAPP_BRIDGE_URL or localhost:8080 */
  bridgeApiUrl: string;
};

export type WhatsAppTemplateContext = {
  guestName: string;
  eventName: string;
  rsvpLink: string;
  eventDate: string;
  eventLocation: string;
};

export function defaultWhatsAppInviteSettings(): WhatsAppInviteSettings {
  return {
    messageTemplate: DEFAULT_WHATSAPP_MESSAGE_TEMPLATE,
    includeRsvpLink: true,
    imageDataUrl: null,
    imageName: null,
    bridgeApiUrl: "",
  };
}

export function whatsAppSettingsStorageKey(eventId: string) {
  return `${WHATSAPP_SETTINGS_STORAGE_PREFIX}.${eventId}`;
}

export function loadWhatsAppInviteSettings(eventId: string): WhatsAppInviteSettings {
  if (typeof window === "undefined") {
    return defaultWhatsAppInviteSettings();
  }

  try {
    const raw = window.localStorage.getItem(whatsAppSettingsStorageKey(eventId));
    if (!raw) return defaultWhatsAppInviteSettings();
    const parsed = JSON.parse(raw) as Partial<WhatsAppInviteSettings>;
    return {
      messageTemplate:
        typeof parsed.messageTemplate === "string" && parsed.messageTemplate.trim()
          ? parsed.messageTemplate
          : DEFAULT_WHATSAPP_MESSAGE_TEMPLATE,
      includeRsvpLink: parsed.includeRsvpLink !== false,
      imageDataUrl: typeof parsed.imageDataUrl === "string" ? parsed.imageDataUrl : null,
      imageName: typeof parsed.imageName === "string" ? parsed.imageName : null,
      bridgeApiUrl: typeof parsed.bridgeApiUrl === "string" ? parsed.bridgeApiUrl : "",
    };
  } catch {
    return defaultWhatsAppInviteSettings();
  }
}

export function saveWhatsAppInviteSettings(eventId: string, settings: WhatsAppInviteSettings) {
  window.localStorage.setItem(whatsAppSettingsStorageKey(eventId), JSON.stringify(settings));
}

export function buildTemplateContext(
  guest: Pick<GuestRecord, "name">,
  event: Pick<EventRecord, "name" | "date" | "location">,
  rsvpLink: string,
): WhatsAppTemplateContext {
  return {
    guestName: guest.name,
    eventName: event.name,
    rsvpLink,
    eventDate: event.date,
    eventLocation: event.location,
  };
}

export function renderWhatsAppMessage(
  template: string,
  context: WhatsAppTemplateContext,
  options?: { includeRsvpLink?: boolean },
): string {
  const includeRsvpLink = options?.includeRsvpLink !== false;
  let text = template
    .replaceAll("{{guestName}}", context.guestName)
    .replaceAll("{{eventName}}", context.eventName)
    .replaceAll("{{eventDate}}", context.eventDate)
    .replaceAll("{{eventLocation}}", context.eventLocation);

  if (includeRsvpLink) {
    text = text.replaceAll("{{rsvpLink}}", context.rsvpLink);
  } else {
    text = text
      .replaceAll("{{rsvpLink}}", "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  return text;
}

/** Digits-only recipient for wa.me / whatsapp bridge (e.g. 919876543210). */
export function phoneToWhatsAppRecipient(phone: string): string | null {
  try {
    const parsed = parsePhoneE164(phone);
    if (parsed.country === "IN") {
      return `91${parsed.national}`;
    }
    return digitsOnlyFromPhone(phone);
  } catch {
    const digits = phone.replace(/\D/g, "");
    if (digits.length >= 10) return digits;
    return null;
  }
}

function digitsOnlyFromPhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function buildWhatsAppWebUrl(recipient: string, message: string) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${recipient}?text=${encoded}`;
}

export const WHATSAPP_IMAGE_MAX_BYTES = 512 * 1024;

export async function readImageFileAsDataUrl(file: File): Promise<{ dataUrl: string; name: string }> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file (PNG, JPG, or WebP).");
  }
  if (file.size > WHATSAPP_IMAGE_MAX_BYTES) {
    throw new Error("Image must be 512 KB or smaller for local storage.");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read image"));
    };
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });

  return { dataUrl, name: file.name };
}
