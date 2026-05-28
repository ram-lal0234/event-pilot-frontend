export type PhoneCountryCode = "IN";

export type PhoneCountryOption = {
  code: PhoneCountryCode;
  dialCode: string;
  label: string;
};

export const PHONE_COUNTRIES: PhoneCountryOption[] = [
  { code: "IN", dialCode: "91", label: "India" },
];

const INDIA_MOBILE = /^[6-9]\d{9}$/;

export function getPhoneCountry(code: PhoneCountryCode) {
  const country = PHONE_COUNTRIES.find((entry) => entry.code === code);
  if (!country) {
    throw new Error(`Unsupported country code: ${code}`);
  }
  return country;
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function formatPhoneE164(countryCode: PhoneCountryCode, nationalDigits: string) {
  const digits = digitsOnly(nationalDigits);

  if (countryCode === "IN") {
    if (!INDIA_MOBILE.test(digits)) {
      throw new Error("Enter a valid 10-digit India mobile (starts with 6–9).");
    }
    return `+91${digits}`;
  }

  throw new Error("Unsupported country");
}

export function parsePhoneE164(
  stored: string,
  defaultCountry: PhoneCountryCode = "IN",
): { country: PhoneCountryCode; national: string } {
  const digits = digitsOnly(stored);

  if (!digits) {
    return { country: defaultCountry, national: "" };
  }

  if (digits.startsWith("91") && digits.length === 12 && INDIA_MOBILE.test(digits.slice(2))) {
    return { country: "IN", national: digits.slice(2) };
  }

  if (digits.length === 10 && INDIA_MOBILE.test(digits)) {
    return { country: "IN", national: digits };
  }

  if (digits.length === 11 && digits.startsWith("0") && INDIA_MOBILE.test(digits.slice(1))) {
    return { country: "IN", national: digits.slice(1) };
  }

  throw new Error("Use a valid India mobile number.");
}

export function normalizePhoneInput(
  countryCode: PhoneCountryCode,
  input: string,
): { e164: string } | { error: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { error: "Phone is required" };
  }

  try {
    const digits = digitsOnly(trimmed);

    if (trimmed.startsWith("+") || digits.length > 10) {
      const parsed = parsePhoneE164(trimmed, countryCode);
      return { e164: formatPhoneE164(parsed.country, parsed.national) };
    }

    return { e164: formatPhoneE164(countryCode, trimmed) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Invalid phone number",
    };
  }
}
