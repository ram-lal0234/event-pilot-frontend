import type {
  Arrival,
  Cab,
  CheckedInGuest,
  DashboardStats,
  FeedItem,
  Guest,
  HotelData,
  Pickup,
} from "@/types";

export const dashboardStats: DashboardStats = {
  checkInPercent: 75,
  checkInTrend: "+12%",
  pendingPickups: 12,
  delayedPickups: 4,
  roomOccupied: 88,
  roomTotal: 120,
  vipAlerts: 3,
};

export const liveFeed: FeedItem[] = [
  {
    id: "1",
    title: "Guest Sarah J. checked in",
    subtitle: "Lobby Desk 2",
    time: "Just now",
    type: "checkin",
  },
  {
    id: "2",
    title: "Driver Marcus V. assigned to VIP Route A",
    subtitle: "Fleet Ops",
    time: "2m ago",
    type: "cab",
  },
  {
    id: "3",
    title: "Dietary alert: Table 4 - Peanut Allergy",
    subtitle: "Main Ballroom",
    time: "5m ago",
    type: "alert",
  },
  {
    id: "4",
    title: "Room 402 marked as Ready",
    subtitle: "Housekeeping",
    time: "12m ago",
    type: "room",
  },
  {
    id: "5",
    title: "Guest Johnathan Doe checked in",
    subtitle: "Terminal 1 Arrival",
    time: "15m ago",
    type: "checkin",
  },
];

export const arrivals: Arrival[] = [
  {
    id: "1",
    guestName: "Robert H.",
    guestInitials: "RH",
    source: "DL1092 (JFK)",
    eta: "14:25",
    status: "on-time",
    statusLabel: "On Time",
    pickup: "V. Chen",
  },
  {
    id: "2",
    guestName: "Alice L.",
    guestInitials: "AL",
    source: "LH442 (FRA)",
    eta: "14:50",
    etaHighlight: true,
    status: "delayed",
    statusLabel: "Delayed (20m)",
    pickup: "Unassigned",
  },
  {
    id: "3",
    guestName: "David M.",
    guestInitials: "DM",
    source: "Private Rail",
    eta: "15:15",
    status: "confirmed",
    statusLabel: "Confirmed",
    pickup: "M. Peters",
    isVip: true,
  },
];

export const guests: Guest[] = [
  {
    id: "1",
    name: "Sarah Chen",
    email: "sarah.chen@techcorp.io",
    category: "SPEAKER",
    rsvpStatus: "confirmed",
    checkInStatus: "checked-in",
    operations: "Cab: CAB-204 · Hilton Room 1204",
  },
  {
    id: "2",
    name: "Marcus Vane",
    email: "marcus.v@enterprise.com",
    category: "VIP",
    rsvpStatus: "confirmed",
    checkInStatus: "pending",
    operations: "Cab: Unassigned · Marriott Suite 402",
  },
  {
    id: "3",
    name: "Liam Foster",
    email: "liam.foster@startup.io",
    category: "ATTENDEE",
    rsvpStatus: "pending",
    checkInStatus: "pending",
    phone: "+1 (555) 012-3456",
    linkedIn: "linkedin.com/in/liamfoster",
    dietary: ["GLUTEN FREE", "NO SHELLFISH"],
    arrival: {
      source: "AA-2401",
      time: "14:20 GMT",
      terminal: "Terminal 3",
      gate: "Gate B12",
    },
    expanded: true,
  },
  {
    id: "4",
    name: "Elena Belova",
    email: "elena.b@design.co",
    category: "SPEAKER",
    rsvpStatus: "confirmed",
    checkInStatus: "checked-in",
    operations: "Cab: CAB-441 · Hyatt Room 805",
  },
  {
    id: "5",
    name: "David Kim",
    email: "david.kim@global.net",
    category: "ATTENDEE",
    rsvpStatus: "confirmed",
    checkInStatus: "pending",
    operations: "Cab: CAB-204 · Hilton Room 512",
  },
];

export const guestStats = {
  total: 1248,
  checkedIn: 842,
  pending: 406,
};

export const cabs: Cab[] = [
  {
    id: "CAB-204",
    label: "CAB-204",
    model: "Toyota Camry",
    driver: "Marcus V.",
    capacity: 4,
    assigned: 3,
    status: "active",
    statusLabel: "Heading to Terminal A",
  },
  {
    id: "CAB-118",
    label: "CAB-118",
    model: "Mercedes E-Class",
    driver: "Sofia R.",
    capacity: 4,
    assigned: 4,
    status: "delayed",
    statusLabel: "Stuck in Traffic (5m delay)",
  },
  {
    id: "CAB-441",
    label: "CAB-441",
    model: "BMW 5 Series",
    driver: "James K.",
    capacity: 3,
    assigned: 2,
    status: "active",
    statusLabel: "Transporting VIP to Site",
  },
  {
    id: "CAB-092",
    label: "CAB-092",
    model: "Tesla Model 3",
    driver: "Elena P.",
    capacity: 4,
    assigned: 0,
    status: "idle",
    statusLabel: "Idle at Fairmont Plaza",
  },
];

export const hotelData: HotelData = {
  roomTypes: [
    { name: "Standard Rooms", occupied: 142, total: 150 },
    { name: "Junior Suites", occupied: 28, total: 40 },
    { name: "VIP Suites", occupied: 8, total: 12 },
  ],
  readyRooms: [
    { id: "1", room: "Room 1204", type: "Junior Suite" },
    { id: "2", room: "Room 402", type: "Standard" },
    { id: "3", room: "Room 805", type: "VIP Suite" },
  ],
};

export const pickups: Pickup[] = [
  {
    id: "1",
    guestName: "Johnathan Doe",
    arrivalInfo: "Flight BA241 · Terminal 5",
    arrivalIcon: "flight",
    scheduledTime: "14:20 PM",
    driverStatus: "assigned",
    driverLabel: "Assigned (CAB-204)",
    cabId: "CAB-204",
  },
  {
    id: "2",
    guestName: "Alice Simpson",
    arrivalInfo: "Eurostar · St Pancras",
    arrivalIcon: "train",
    scheduledTime: "15:05 PM",
    timeHighlight: true,
    driverStatus: "unassigned",
    driverLabel: "Unassigned",
  },
  {
    id: "3",
    guestName: "Richard Branson",
    arrivalInfo: "Private Jet · FBO North",
    arrivalIcon: "jet",
    scheduledTime: "15:30 PM",
    driverStatus: "assigned",
    driverLabel: "Assigned (CAB-441)",
    cabId: "CAB-441",
  },
];

export const checkedInGuest: CheckedInGuest = {
  id: "guest-1",
  firstName: "John",
  lastName: "Doe",
  title: "Chief Technical Officer",
  company: "TechNexus",
  avatar:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
  badges: ["VIP GUEST", "PRESS"],
  tableNumber: "Table #12",
  guestType: "Executive",
  plusOnes: "+2 Guests",
  dietary: "Vegan",
  checkInTime: "09:42 AM",
  sessions: [
    { title: "Future of AI Keynote", time: "10:30 AM" },
    { title: "VIP Executive Lunch", time: "12:15 PM" },
  ],
};

export const userAvatar =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop";
