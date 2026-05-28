import type { GuestCategory, GuestRecord } from "@/lib/api";
import { formatPhoneE164, parsePhoneE164, type PhoneCountryCode } from "@/lib/phone";

export type GuestFormState = {
  name: string;
  phoneCountry: PhoneCountryCode;
  phoneNational: string;
  email: string;
  category: GuestCategory;
  groupSize: number;
  pickupLocation: string;
  pickupLat: string;
  pickupLng: string;
};

export const emptyGuestForm = (): GuestFormState => ({
  name: "",
  phoneCountry: "IN",
  phoneNational: "",
  email: "",
  category: "GENERAL",
  groupSize: 1,
  pickupLocation: "",
  pickupLat: "",
  pickupLng: "",
});

export function guestToFormState(guest: GuestRecord): GuestFormState {
  let phoneCountry: PhoneCountryCode = "IN";
  let phoneNational = "";

  if (guest.phone) {
    try {
      const parsed = parsePhoneE164(guest.phone);
      phoneCountry = parsed.country;
      phoneNational = parsed.national;
    } catch {
      const digits = guest.phone.replace(/\D/g, "");
      phoneNational = digits.length >= 10 ? digits.slice(-10) : digits;
    }
  }

  return {
    name: guest.name,
    phoneCountry,
    phoneNational,
    email: guest.email || "",
    category: guest.category,
    groupSize: guest.groupSize,
    pickupLocation: guest.pickupLocation || "",
    pickupLat: guest.pickupLat != null ? String(guest.pickupLat) : "",
    pickupLng: guest.pickupLng != null ? String(guest.pickupLng) : "",
  };
}

export function buildGuestPhone(form: GuestFormState) {
  return formatPhoneE164(form.phoneCountry, form.phoneNational);
}

export function buildGuestCreatePayload(form: GuestFormState, eventId: string) {
  return {
    eventId,
    name: form.name,
    phone: buildGuestPhone(form),
    email: form.email || undefined,
    category: form.category,
    groupSize: Number(form.groupSize),
    pickupLocation: form.pickupLocation || undefined,
    pickupLat: form.pickupLat ? Number(form.pickupLat) : undefined,
    pickupLng: form.pickupLng ? Number(form.pickupLng) : undefined,
  };
}

export function buildGuestUpdatePayload(form: GuestFormState) {
  return {
    name: form.name,
    phone: buildGuestPhone(form),
    email: form.email || null,
    category: form.category,
    groupSize: Number(form.groupSize),
    pickupLocation: form.pickupLocation || null,
    pickupLat: form.pickupLat ? Number(form.pickupLat) : undefined,
    pickupLng: form.pickupLng ? Number(form.pickupLng) : undefined,
  };
}
