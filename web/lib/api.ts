export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  code?: string;
  details?: { message: string; path: string }[];
};

export type UserRole = "ADMIN" | "STAFF";
export type GuestCategory = "VIP" | "FAMILY" | "GENERAL";
export type RsvpStatus = "PENDING" | "CONFIRMED" | "DECLINED";
export type CheckinMethod = "QR" | "MANUAL";
export type CheckinLocationType = "EVENT_GATE" | "HOTEL";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

export type EventRecord = {
  id: string;
  name: string;
  date: string;
  location: string;
  createdBy: string;
  createdAt: string;
};

export type GuestRecord = {
  id: string;
  eventId: string;
  name: string;
  phone: string;
  email: string | null;
  pickupLocation: string | null;
  pickupLat: number | null;
  pickupLng: number | null;
  category: GuestCategory;
  rsvpStatus: RsvpStatus;
  groupSize: number;
  qrCode: string;
  qrImage?: string;
  ivrRespondedAt: string | null;
  createdAt: string;
  checkins?: { id: string; method: CheckinMethod; locationType: string }[];
  cabAssignments?: { id: string; cabId: string }[];
  roomAssignments?: { id: string; roomId: string; assignedMembers: number }[];
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedGuests = {
  items: GuestRecord[];
  pagination: PaginationMeta;
};

export type DashboardSummary = {
  totalGuests: number;
  confirmed: number;
  checkedIn: number;
  pendingPickups: number;
};

export type AuditRecord = {
  id: string;
  eventId: string | null;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type CabRecord = {
  id: string;
  eventId: string;
  driverName: string;
  vehicleNumber: string;
  capacity: number;
  usedSeats: number;
  assignments?: {
    id: string;
    guest: { id: string; name: string; groupSize: number };
  }[];
};

export type HotelRecord = {
  id: string;
  eventId: string;
  name: string;
  location: string;
  rooms?: RoomRecord[];
};

export type RoomRecord = {
  id: string;
  hotelId: string;
  roomNumber: string;
  capacity: number;
  assignments?: {
    id: string;
    assignedMembers: number;
    guest: { id: string; name: string; groupSize: number };
  }[];
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api";

export class ApiError extends Error {
  code?: string;
  details?: { message: string; path: string }[];

  constructor(
    message: string,
    code?: string,
    details?: { message: string; path: string }[],
  ) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const envelope = (await response
    .json()
    .catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !envelope?.success) {
    throw new ApiError(
      envelope?.message || `Request failed with status ${response.status}`,
      envelope?.code,
      envelope?.details,
    );
  }

  return envelope.data;
}

const query = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });
  const value = search.toString();
  return value ? `?${value}` : "";
};

export const api = {
  requestOtp(email: string) {
    return request<{ email: string; otp?: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  verifyOtp(email: string, otp: string) {
    return request<{ user: AuthUser; accessToken: string }>(
      "/auth/verify-otp",
      {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      },
    );
  },
  listEvents(token: string) {
    return request<EventRecord[]>("/events", { token });
  },
  createEvent(
    token: string,
    payload: { name: string; date: string; location: string },
  ) {
    return request<EventRecord>("/events", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },
  dashboardSummary(token: string, eventId: string) {
    return request<DashboardSummary>(
      `/dashboard/summary${query({ eventId })}`,
      { token },
    );
  },
  dashboardFeed(token: string, eventId: string) {
    return request<AuditRecord[]>(`/dashboard/feed${query({ eventId })}`, {
      token,
    });
  },
  listGuests(token: string, eventId: string) {
    return request<GuestRecord[]>(`/guests${query({ eventId })}`, { token });
  },
  listGuestsPage(
    token: string,
    eventId: string,
    params: { page: number; pageSize: number },
  ) {
    return request<PaginatedGuests>(
      `/guests${query({ eventId, page: params.page, pageSize: params.pageSize })}`,
      { token },
    );
  },
  createGuest(
    token: string,
    payload: {
      eventId: string;
      name: string;
      phone: string;
      email?: string;
      category: GuestCategory;
      groupSize: number;
      pickupLocation?: string;
      pickupLat?: number;
      pickupLng?: number;
    },
  ) {
    return request<GuestRecord>("/guests", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },
  uploadGuestCsv(token: string, eventId: string, csv: string) {
    return request<{ inserted: number; guests: GuestRecord[] }>(
      `/guests/upload-csv${query({ eventId })}`,
      {
        method: "POST",
        token,
        headers: { "Content-Type": "text/csv" },
        body: csv,
      },
    );
  },
  updateGuestRsvp(
    token: string,
    guestId: string,
    payload: { rsvpStatus: RsvpStatus; groupSize: number },
  ) {
    return request<GuestRecord>(`/guests/${guestId}/rsvp`, {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    });
  },
  triggerIvr(token: string, guestId: string) {
    return request<{ queued: boolean }>("/ivr/call", {
      method: "POST",
      token,
      body: JSON.stringify({ guestId }),
    });
  },
  scanQr(
    token: string,
    payload: {
      qrCode: string;
      method: CheckinMethod;
      locationType: CheckinLocationType;
    },
  ) {
    return request<{ guest: GuestRecord; checkin: unknown }>("/checkin/scan", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },
  listCabs(token: string, eventId: string) {
    return request<CabRecord[]>(`/cabs${query({ eventId })}`, { token });
  },
  createCab(
    token: string,
    payload: {
      eventId: string;
      driverName: string;
      vehicleNumber: string;
      capacity: number;
    },
  ) {
    return request<CabRecord>("/cabs", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },
  assignCab(token: string, payload: { cabId: string; guestId: string }) {
    return request<unknown>("/cabs/assignments", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },
  listHotels(token: string, eventId: string) {
    return request<HotelRecord[]>(`/hotels${query({ eventId })}`, { token });
  },
  createHotel(
    token: string,
    payload: { eventId: string; name: string; location: string },
  ) {
    return request<HotelRecord>("/hotels", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },
  createRoom(
    token: string,
    payload: { hotelId: string; roomNumber: string; capacity: number },
  ) {
    return request<RoomRecord>("/hotels/rooms", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },
  assignRoom(token: string, payload: { roomId: string; guestId: string }) {
    return request<unknown>("/hotels/room-assignments", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },
};
