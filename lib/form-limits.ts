/** Shared HTML validation bounds for forms. */
export const formLimits = {
  name: { minLength: 2, maxLength: 120 },
  displayName: { minLength: 1, maxLength: 120 },
  workspaceName: { minLength: 2, maxLength: 120 },
  eventName: { minLength: 2, maxLength: 120 },
  location: { minLength: 2, maxLength: 200 },
  email: { maxLength: 254 },
  phone: { minLength: 8, maxLength: 30 },
  groupSize: { min: 1, max: 20 },
  qrCode: { minLength: 8, maxLength: 512 },
  pickupLocation: { maxLength: 200 },
  latLng: { maxLength: 32 },
} as const;
