export type GuestCategory = "VIP" | "SPEAKER" | "ATTENDEE" | "PRESS";
export type RsvpStatus = "confirmed" | "pending" | "declined";
export type CheckInStatus = "checked-in" | "pending";
export type ArrivalStatus = "on-time" | "delayed" | "confirmed";
export type CabStatus = "active" | "delayed" | "idle";
export type DriverStatus = "assigned" | "unassigned";

export interface Guest {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  category: GuestCategory;
  rsvpStatus: RsvpStatus;
  checkInStatus: CheckInStatus;
  phone?: string;
  linkedIn?: string;
  dietary?: string[];
  arrival?: {
    source: string;
    time: string;
    terminal?: string;
    gate?: string;
  };
  operations?: string;
  expanded?: boolean;
}

export interface Cab {
  id: string;
  label: string;
  model: string;
  driver: string;
  capacity: number;
  assigned: number;
  status: CabStatus;
  statusLabel: string;
}

export interface RoomType {
  name: string;
  occupied: number;
  total: number;
}

export interface ReadyRoom {
  id: string;
  room: string;
  type: string;
}

export interface HotelData {
  roomTypes: RoomType[];
  readyRooms: ReadyRoom[];
}

export interface Pickup {
  id: string;
  guestName: string;
  arrivalInfo: string;
  arrivalIcon: "flight" | "train" | "jet";
  scheduledTime: string;
  timeHighlight?: boolean;
  driverStatus: DriverStatus;
  driverLabel?: string;
  cabId?: string;
}

export interface Arrival {
  id: string;
  guestName: string;
  guestInitials: string;
  source: string;
  eta: string;
  etaHighlight?: boolean;
  status: ArrivalStatus;
  statusLabel: string;
  pickup: string;
  isVip?: boolean;
}

export interface FeedItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  type: "checkin" | "cab" | "alert" | "room";
}

export interface DashboardStats {
  checkInPercent: number;
  checkInTrend: string;
  pendingPickups: number;
  delayedPickups: number;
  roomOccupied: number;
  roomTotal: number;
  vipAlerts: number;
}

export interface CheckedInGuest {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  avatar: string;
  badges: string[];
  tableNumber: string;
  guestType: string;
  plusOnes: string;
  dietary: string;
  checkInTime: string;
  sessions: { title: string; time: string }[];
}
