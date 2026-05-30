export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  code?: string;
  details?: { message: string; path: string }[];
};

export type UserRole = "ADMIN" | "STAFF";
export type AccountRole = "OWNER" | "ADMIN" | "STAFF";
export type AccessLevel = "FULL" | "READ_ONLY";
export type InviteStatus = "PENDING" | "ACCEPTED" | "REVOKED";
export type GuestCategory = "VIP" | "FAMILY" | "GENERAL";
export type RsvpStatus = "PENDING" | "CONFIRMED" | "DECLINED";
export type CheckinMethod = "QR" | "MANUAL";
export type CheckinLocationType = "EVENT_GATE" | "HOTEL";

export type AuthUser = {
  id: string;
  email: string;
  role?: UserRole;
  accountId?: string;
  memberId?: string;
  accountRole?: AccountRole;
  accountName?: string;
};

export type AccountInfo = {
  id: string;
  name: string;
  ownerId: string;
};

export type AccountMembership = {
  id: string;
  role: AccountRole;
  email: string;
  name: string | null;
  phone?: string | null;
  status: InviteStatus;
  onboardingCompletedAt?: string | null;
};

export type TeamMemberRecord = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: AccountRole;
  status: InviteStatus;
  inviteCode?: string;
  inviteUrl?: string;
  acceptedAt?: string | null;
  revokedAt?: string | null;
  eventAccess: Array<{
    eventId: string;
    eventName?: string;
    accessLevel: AccessLevel;
  }>;
};

export type EventRecord = {
  id: string;
  name: string;
  date: string;
  location: string;
  createdBy: string;
  createdAt: string;
  accessLevel?: AccessLevel;
  guestCount?: number;
  rsvpConfirmedCount?: number;
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
  followUpStatus?: "NONE" | "NEEDS_FOLLOW_UP" | "CALLBACK_LATER" | "NO_ANSWER" | "VOICEMAIL" | "COMPLETED";
  callbackAt?: string | null;
  callbackTriggered?: boolean;
  lastContactedAt?: string | null;
  assignedTo?: string | null;
  needsCab?: boolean | null;
  needsHotel?: boolean | null;
  guestNotes?: string | null;
  language?: string | null;
  inviteCode?: string | null;
  publicRsvpUrl?: string | null;
  createdAt: string;
  checkins?: { id: string; method: CheckinMethod; locationType: string; checkinTime?: string }[];
  cabAssignments?: { id: string; cabId: string }[];
  roomAssignments?: { id: string; roomId: string; assignedMembers: number }[];
};

export type GuestCallLogEntry = {
  id: string;
  source: "call" | "call_event" | "ivr_log";
  type: "call_status" | "lifecycle" | "transcript" | "error" | "rsvp" | "ivr_response" | "ivr_log" | string;
  at: string | null;
  status: string | null;
  callUuid: string | null;
  callId: string | null;
  eventName: string | null;
  outcome: string | null;
  rsvpStatus: RsvpStatus | null;
  groupSize: number | null;
  needsCab: boolean | null;
  needsHotel: boolean | null;
  pickupLocation: string | null;
  guestNotes: string | null;
  language: string | null;
  transcription: string | null;
  recordingUrl: string | null;
  attempt?: number;
  callDuration?: number | null;
  rsvpCaptured?: boolean;
  groupSizeCaptured?: boolean;
  provider?: string;
  lastEventAt?: string | null;
  updatedAt?: string | null;
};

export type GuestCallLogs = {
  guest: {
    id: string;
    name: string;
    phone: string;
    rsvpStatus: RsvpStatus;
  };
  summary: {
    totalCalls: number;
    totalEvents: number;
    totalIvrLogs: number;
    latestStatus: string | null;
    lastVoiceResponseAt: string | null;
    hasTranscript: boolean;
  };
  timeline: GuestCallLogEntry[];
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
  declined?: number;
  pendingRsvp?: number;
  checkedIn: number;
  pendingPickups: number;
  callbackLater?: number;
  noAnswer?: number;
  voicemail?: number;
  needsFollowUp?: number;
  needsFollowUpGuests?: Array<{
    id: string;
    name: string;
    phone: string;
    rsvpStatus: RsvpStatus;
    followUpStatus: string;
    callbackAt: string | null;
    lastContactedAt: string | null;
  }>;
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
  driverPhone?: string | null;
  vehicleNumber: string;
  capacity: number;
  usedSeats: number;
  pickupTime?: string | null;
  routeZone?: string | null;
  tripStatus?: string | null;
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
  roomType?: string | null;
  floor?: string | null;
  roomStatus?: string | null;
  checkInDate?: string | null;
  checkOutDate?: string | null;
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
  getAccountMe(token: string) {
    return request<{
      account: AccountInfo;
      membership: AccountMembership;
      needsOnboarding: boolean;
    }>("/account/me", { token });
  },
  completeOnboarding(
    token: string,
    payload: { name: string; phone: string; workspaceName?: string },
  ) {
    return request<{
      account: AccountInfo;
      membership: AccountMembership;
      needsOnboarding: boolean;
    }>("/account/onboarding", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },
  updateAccountName(token: string, name: string) {
    return request<AccountInfo>("/account/me", {
      method: "PATCH",
      token,
      body: JSON.stringify({ name }),
    });
  },
  updateMyProfile(token: string, payload: { name?: string; phone?: string }) {
    return request<AccountMembership>("/account/me/profile", {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    });
  },
  listTeamMembers(token: string) {
    return request<TeamMemberRecord[]>("/account/members", { token });
  },
  inviteTeamMember(
    token: string,
    payload: {
      email: string;
      role: "ADMIN" | "STAFF";
      name?: string;
      phone?: string;
      eventAssignments?: Array<{ eventId: string; accessLevel?: AccessLevel }>;
    },
  ) {
    return request<TeamMemberRecord & { inviteUrl?: string }>("/account/members/invite", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },
  revokeTeamMember(token: string, memberId: string) {
    return request<{ id: string }>(`/account/members/${memberId}/revoke`, {
      method: "POST",
      token,
    });
  },
  updateTeamMemberRole(token: string, memberId: string, role: "ADMIN" | "STAFF") {
    return request<TeamMemberRecord>(`/account/members/${memberId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ role }),
    });
  },
  updateTeamMemberEvents(
    token: string,
    memberId: string,
    eventAssignments: Array<{ eventId: string; accessLevel: AccessLevel }>,
  ) {
    return request<TeamMemberRecord>(`/account/members/${memberId}/events`, {
      method: "PUT",
      token,
      body: JSON.stringify({ eventAssignments }),
    });
  },
  getJoinPreview(code: string) {
    return request<{
      code: string;
      accountName: string;
      email: string;
      role: AccountRole;
      status: InviteStatus;
    }>(`/join/${code}`);
  },
  acceptJoin(token: string, code: string) {
    return request<{ user: AuthUser; accessToken: string }>(`/join/${code}/accept`, {
      method: "POST",
      token,
    });
  },
  verifyJoinOtp(code: string, email: string, otp: string) {
    return request<{ user: AuthUser; accessToken: string }>(`/join/${code}/verify-otp`, {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
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
    params: {
      page: number;
      pageSize: number;
      q?: string;
      rsvpStatus?: string;
      category?: string;
      followUpStatus?: string;
      needsCab?: string;
      needsHotel?: string;
      assignedTo?: string;
    },
  ) {
    return request<PaginatedGuests>(
      `/guests${query({
        eventId,
        page: params.page,
        pageSize: params.pageSize,
        q: params.q,
        rsvpStatus: params.rsvpStatus,
        category: params.category,
        followUpStatus: params.followUpStatus,
        needsCab: params.needsCab,
        needsHotel: params.needsHotel,
        assignedTo: params.assignedTo,
      })}`,
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
  updateGuest(
    token: string,
    guestId: string,
    payload: {
      name?: string;
      phone?: string;
      email?: string | null;
      category?: GuestCategory;
      groupSize?: number;
      pickupLocation?: string | null;
      pickupLat?: number;
      pickupLng?: number;
      rsvpStatus?: RsvpStatus;
      followUpStatus?: GuestRecord["followUpStatus"];
      callbackAt?: string | null;
      callbackTriggered?: boolean;
      lastContactedAt?: string | null;
      assignedTo?: string | null;
      needsCab?: boolean | null;
      needsHotel?: boolean | null;
      guestNotes?: string | null;
      language?: string | null;
    },
  ) {
    return request<GuestRecord>(`/guests/${guestId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    });
  },
  getGuestRsvpLink(token: string, guestId: string) {
    return request<{ inviteCode: string; publicRsvpUrl: string }>(`/guests/${guestId}/rsvp-link`, {
      token,
    });
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
  getGuestCallLogs(token: string, guestId: string) {
    return request<GuestCallLogs>(`/guests/${guestId}/call-logs`, { token });
  },
  triggerVoiceCall(token: string, guestId: string, callMode: "ai" | "ivr") {
    return request<{ queued: boolean; callId: string; callMode: "ai" | "ivr" }>(
      "/ivr/call",
      {
        method: "POST",
        token,
        body: JSON.stringify({ guestId, callMode }),
      },
    );
  },
  triggerBulkVoiceCalls(token: string, eventId: string, callMode: "ai" | "ivr" = "ai") {
    return request<{
      callMode: "ai" | "ivr";
      totalPending: number;
      queued: number;
      skipped: number;
      skippedReasons: { callInProgress: number; error: number };
      callIds: string[];
    }>("/ivr/call-all", {
      method: "POST",
      token,
      body: JSON.stringify({ eventId, callMode }),
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
    return request<{ guest: GuestRecord; checkin: unknown; alreadyCheckedIn?: boolean }>("/checkin/scan", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },
  undoCheckin(token: string, payload: { qrCode: string; locationType?: CheckinLocationType }) {
    return request<{ guestId: string }>("/checkin/undo", {
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
      driverPhone?: string;
      vehicleNumber: string;
      capacity: number;
      pickupTime?: string;
      routeZone?: string;
      tripStatus?: string;
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
  unassignCab(token: string, payload: { guestId: string }) {
    return request<{ id: string }>("/cabs/assignments/unassign", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },
  moveCab(token: string, payload: { guestId: string; toCabId: string }) {
    return request<{ id: string }>("/cabs/assignments/move", {
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
    payload: { hotelId: string; roomNumber: string; capacity: number; roomType?: string; floor?: string; roomStatus?: string; checkInDate?: string; checkOutDate?: string },
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
  unassignRoom(token: string, payload: { guestId: string }) {
    return request<{ id: string }>("/hotels/room-assignments/unassign", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },
  moveRoom(token: string, payload: { guestId: string; toRoomId: string }) {
    return request<{ id: string }>("/hotels/room-assignments/move", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },
  getPublicRsvp(code: string) {
    return request<{
      code: string;
      expiresAt: string | null;
      guest: {
        id: string;
        name: string;
        phone: string;
        email: string | null;
        rsvpStatus: RsvpStatus;
        groupSize: number;
        pickupLocation: string | null;
        needsCab?: boolean | null;
        needsHotel?: boolean | null;
        guestNotes?: string | null;
      };
      event: EventRecord;
    }>(`/public-rsvp/${code}`);
  },
  submitPublicRsvp(
    code: string,
    payload: {
      rsvpStatus: RsvpStatus;
      groupSize: number;
      pickupLocation?: string | null;
      needsCab?: boolean | null;
      needsHotel?: boolean | null;
      guestNotes?: string | null;
      callbackAt?: string | null;
      followUpStatus?: "NONE" | "NEEDS_FOLLOW_UP" | "CALLBACK_LATER" | "NO_ANSWER" | "VOICEMAIL" | "COMPLETED";
    },
  ) {
    return request<{ guest: { id: string; name: string; rsvpStatus: RsvpStatus; groupSize: number; pickupLocation: string | null } }>(
      `/public-rsvp/${code}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
  },
};
