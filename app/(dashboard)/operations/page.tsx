"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Bed, Car, Hotel, Plus, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/domain/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  api,
  type CabRecord,
  type GuestRecord,
  type HotelRecord,
  type RoomRecord,
} from "@/lib/api";
import { useApp } from "@/components/providers/app-provider";

type AssignmentMode = "cab" | "room";

export default function OperationsPage() {
  const { token, currentEventId, eventsLoaded, eventsLoading } = useApp();
  const [cabs, setCabs] = useState<CabRecord[]>([]);
  const [hotels, setHotels] = useState<HotelRecord[]>([]);
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [operationsLoaded, setOperationsLoaded] = useState(false);

  const [cabForm, setCabForm] = useState({ driverName: "", driverPhone: "", vehicleNumber: "", capacity: 4, routeZone: "", tripStatus: "" });
  const [hotelForm, setHotelForm] = useState({ name: "", location: "" });
  const [roomForm, setRoomForm] = useState({ hotelId: "", roomNumber: "", capacity: 2, roomType: "", floor: "", roomStatus: "" });
  const [assignment, setAssignment] = useState<{ mode: AssignmentMode; targetId: string } | null>(null);
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("assignments");

  const load = useCallback(async () => {
    if (!currentEventId) {
      setOperationsLoaded(false);
      return;
    }

    try {
      setOperationsLoaded(false);
      const [cabResult, hotelResult, guestResult] = await Promise.all([
        api.listCabs(token, currentEventId),
        api.listHotels(token, currentEventId),
        api.listGuests(token, currentEventId),
      ]);
      setCabs(cabResult);
      setHotels(hotelResult);
      setGuests(guestResult);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load operations");
    } finally {
      setOperationsLoaded(true);
    }
  }, [currentEventId, token]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const rooms = useMemo(() => hotels.flatMap((hotel) => hotel.rooms || []), [hotels]);
  const unassignedCabGuests = guests.filter((guest) => guest.rsvpStatus === "CONFIRMED" && !guest.cabAssignments?.length);
  const unassignedRoomGuests = guests.filter((guest) => guest.rsvpStatus === "CONFIRMED" && !guest.roomAssignments?.length);
  const pendingAssignments = unassignedCabGuests.length + unassignedRoomGuests.length;
  const loading = !eventsLoaded || eventsLoading || !operationsLoaded;

  const selectedCab = assignment?.mode === "cab"
    ? cabs.find((cab) => cab.id === assignment.targetId) || null
    : null;
  const selectedRoom = assignment?.mode === "room"
    ? rooms.find((room) => room.id === assignment.targetId) || null
    : null;
  const selectedHotel = selectedRoom
    ? hotels.find((hotel) => hotel.id === selectedRoom.hotelId) || null
    : null;
  const assignableGuests = guests.filter((guest) => guest.rsvpStatus === "CONFIRMED");

  const submit = async (task: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await task();
      toast.success(success);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setBusy(false);
    }
  };

  const createCab = (event: FormEvent) => {
    event.preventDefault();
    submit(
      () => api.createCab(token, { eventId: currentEventId, ...cabForm, capacity: Number(cabForm.capacity) }),
      "Cab created"
    );
  };

  const createHotel = (event: FormEvent) => {
    event.preventDefault();
    submit(() => api.createHotel(token, { eventId: currentEventId, ...hotelForm }), "Hotel created");
  };

  const createRoom = (event: FormEvent) => {
    event.preventDefault();
    submit(() => api.createRoom(token, { ...roomForm, capacity: Number(roomForm.capacity) }), "Room created");
  };

  const unassignCabGuest = (guestId: string) => submit(() => api.unassignCab(token, { guestId }), "Guest unassigned from cab");
  const unassignRoomGuest = (guestId: string) => submit(() => api.unassignRoom(token, { guestId }), "Guest unassigned from room");

  const openAssignment = (mode: AssignmentMode, targetId: string) => {
    setSelectedGuestIds([]);
    setAssignment({ mode, targetId });
  };

  const submitAssignment = async () => {
    if (!assignment || !selectedGuestIds.length) return;

    await submit(async () => {
      for (const guestId of selectedGuestIds) {
        const guest = guests.find((item) => item.id === guestId);
        if (assignment.mode === "cab") {
          if (guest?.cabAssignments?.length) {
            await api.moveCab(token, { guestId, toCabId: assignment.targetId });
          } else {
            await api.assignCab(token, { cabId: assignment.targetId, guestId });
          }
        } else {
          if (guest?.roomAssignments?.length) {
            await api.moveRoom(token, { guestId, toRoomId: assignment.targetId });
          } else {
            await api.assignRoom(token, { roomId: assignment.targetId, guestId });
          }
        }
      }
    }, `${selectedGuestIds.length} guest${selectedGuestIds.length === 1 ? "" : "s"} assigned`);

    setAssignment(null);
    setSelectedGuestIds([]);
  };

  return loading ? (
    <OperationsSkeleton />
  ) : (
    <div className="space-y-6">
      <PageHeader
        title="Operations Hub"
        description="Manage transport, hotels, room occupancy, and guest assignments"
      />

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-0">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList variant="line" className="h-9 w-full justify-start sm:w-auto">
              <TabsTrigger value="assignments" className="gap-1.5">
                <Users className="size-4" />
                Assignments
                {pendingAssignments > 0 ? (
                  <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
                    {pendingAssignments}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="cabs" className="gap-1.5">
                <Car className="size-4" />
                Cabs
                {cabs.length > 0 ? (
                  <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
                    {cabs.length}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="hotels" className="gap-1.5">
                <Hotel className="size-4" />
                Hotels
                {hotels.length > 0 ? (
                  <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
                    {hotels.length}
                  </Badge>
                ) : null}
              </TabsTrigger>
            </TabsList>
            <Button variant="outline" type="button" size="sm" className="gap-2" onClick={load}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </div>

          <TabsContent value="assignments" className="space-y-4 p-4 pt-5">
            <AssignmentsOverview
              cabs={cabs}
              hotels={hotels}
              guests={guests}
              unassignedCabGuests={unassignedCabGuests}
              unassignedRoomGuests={unassignedRoomGuests}
              onAssignCab={(cabId) => openAssignment("cab", cabId)}
              onAssignRoom={(roomId) => openAssignment("room", roomId)}
            />
          </TabsContent>

          <TabsContent value="cabs" className="space-y-4 p-4 pt-5">
            <CreateCabCard form={cabForm} setForm={setCabForm} onSubmit={createCab} busy={busy} />
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {cabs.map((cab) => (
                <CabCard key={cab.id} cab={cab} onAssign={() => openAssignment("cab", cab.id)} onUnassign={unassignCabGuest} />
              ))}
              {!cabs.length && <EmptyPanel title="No cabs yet" body="Create your first cab to start assigning guests." />}
            </div>
          </TabsContent>

          <TabsContent value="hotels" className="space-y-4 p-4 pt-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="space-y-4">
                {hotels.map((hotel) => (
                  <HotelRoomsCard
                    key={hotel.id}
                    hotel={hotel}
                    onAssignRoom={(roomId) => openAssignment("room", roomId)}
                    onUnassignRoomGuest={unassignRoomGuest}
                  />
                ))}
                {!hotels.length && <EmptyPanel title="No hotels yet" body="Create a hotel, then add rooms inside it." />}
              </div>
              <div className="space-y-4">
                <CreateHotelCard form={hotelForm} setForm={setHotelForm} onSubmit={createHotel} busy={busy} />
                <CreateRoomCard form={roomForm} setForm={setRoomForm} hotels={hotels} onSubmit={createRoom} busy={busy} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AssignmentSheet
        assignment={assignment}
        selectedCab={selectedCab}
        selectedRoom={selectedRoom}
        selectedHotel={selectedHotel}
        guests={assignableGuests}
        selectedGuestIds={selectedGuestIds}
        setSelectedGuestIds={setSelectedGuestIds}
        onOpenChange={(open) => {
          if (!open) {
            setAssignment(null);
            setSelectedGuestIds([]);
          }
        }}
        onSubmit={submitAssignment}
        busy={busy}
      />
    </div>
  );
}

function CreateCabCard({
  form,
  setForm,
  onSubmit,
  busy,
}: {
  form: { driverName: string; driverPhone: string; vehicleNumber: string; capacity: number; routeZone: string; tripStatus: string };
  setForm: (form: { driverName: string; driverPhone: string; vehicleNumber: string; capacity: number; routeZone: string; tripStatus: string }) => void;
  onSubmit: (event: FormEvent) => void;
  busy: boolean;
}) {
  return (
    <Card className="border-border shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="size-5 text-primary" />
          Create Cab
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-2 md:grid-cols-6" onSubmit={onSubmit}>
          <Input value={form.driverName} onChange={(event) => setForm({ ...form, driverName: event.target.value })} placeholder="Driver" required />
          <Input value={form.driverPhone} onChange={(event) => setForm({ ...form, driverPhone: event.target.value })} placeholder="Driver phone" />
          <Input value={form.vehicleNumber} onChange={(event) => setForm({ ...form, vehicleNumber: event.target.value })} placeholder="Vehicle" required />
          <Input value={form.routeZone} onChange={(event) => setForm({ ...form, routeZone: event.target.value })} placeholder="Route/zone" />
          <Input value={form.tripStatus} onChange={(event) => setForm({ ...form, tripStatus: event.target.value })} placeholder="Trip status" />
          <Input type="number" min={1} value={form.capacity} onChange={(event) => setForm({ ...form, capacity: Number(event.target.value) })} placeholder="Capacity" required />
          <Button type="submit" loading={busy} loadingText="Creating cab" className="gap-2"><Plus className="size-4" />Cab</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CabCard({ cab, onAssign, onUnassign }: { cab: CabRecord; onAssign: () => void; onUnassign: (guestId: string) => void }) {
  const usage = cab.capacity ? Math.min(100, (cab.usedSeats / cab.capacity) * 100) : 0;
  const available = cab.capacity - cab.usedSeats;
  const isFull = available <= 0;

  return (
    <Card className="border-border shadow-none">
      <CardHeader>
        <CardTitle className="flex items-start justify-between gap-3">
          <span>
            <span className="block">{cab.vehicleNumber}</span>
            <span className="text-sm font-normal text-muted-foreground">{cab.driverName}</span>
          </span>
          <AvailabilityBadge available={!isFull} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Seats used</span>
            <span className="font-semibold">{cab.usedSeats}/{cab.capacity}</span>
          </div>
          <Progress value={usage} className="h-2" />
        </div>
        <div className="space-y-2 text-sm">
          {(cab.assignments || []).map((assignment) => (
            <div key={assignment.id} className="flex items-center justify-between gap-2 rounded-md bg-surface-container-low px-2 py-1.5">
              <span>{assignment.guest.name} ({assignment.guest.groupSize})</span>
              <Button type="button" size="sm" variant="ghost" onClick={() => onUnassign(assignment.guest.id)}>Unassign</Button>
            </div>
          ))}
          {!cab.assignments?.length ? <p className="text-muted-foreground">No guests assigned</p> : null}
        </div>
        <Button className="w-full gap-2" variant="outline" type="button" onClick={onAssign} disabled={isFull}>
          <Users className="size-4" />
          Assign Guests
        </Button>
      </CardContent>
    </Card>
  );
}

function CreateHotelCard({
  form,
  setForm,
  onSubmit,
  busy,
}: {
  form: { name: string; location: string };
  setForm: (form: { name: string; location: string }) => void;
  onSubmit: (event: FormEvent) => void;
  busy: boolean;
}) {
  return (
    <Card className="border-border shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hotel className="size-5 text-primary" />
          Create Hotel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-2" onSubmit={onSubmit}>
          <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Hotel name" required />
          <Input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Location" required />
          <Button className="w-full gap-2" type="submit" loading={busy} loadingText="Creating hotel"><Plus className="size-4" />Hotel</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CreateRoomCard({
  form,
  setForm,
  hotels,
  onSubmit,
  busy,
}: {
  form: { hotelId: string; roomNumber: string; capacity: number; roomType: string; floor: string; roomStatus: string };
  setForm: (form: { hotelId: string; roomNumber: string; capacity: number; roomType: string; floor: string; roomStatus: string }) => void;
  hotels: HotelRecord[];
  onSubmit: (event: FormEvent) => void;
  busy: boolean;
}) {
  return (
    <Card className="border-border shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bed className="size-5 text-primary" />
          Add Room
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-2" onSubmit={onSubmit}>
          <Select value={form.hotelId} onChange={(event) => setForm({ ...form, hotelId: event.target.value })} required>
            <option value="">Select hotel</option>
            {hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}
          </Select>
          <Input value={form.roomNumber} onChange={(event) => setForm({ ...form, roomNumber: event.target.value })} placeholder="Room number" required />
          <Input value={form.roomType} onChange={(event) => setForm({ ...form, roomType: event.target.value })} placeholder="Room type" />
          <Input value={form.floor} onChange={(event) => setForm({ ...form, floor: event.target.value })} placeholder="Floor" />
          <Input value={form.roomStatus} onChange={(event) => setForm({ ...form, roomStatus: event.target.value })} placeholder="Room status" />
          <Input type="number" min={1} value={form.capacity} onChange={(event) => setForm({ ...form, capacity: Number(event.target.value) })} placeholder="Capacity" required />
          <Button className="w-full gap-2" type="submit" disabled={!hotels.length} loading={busy} loadingText="Creating room"><Plus className="size-4" />Room</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function HotelRoomsCard({
  hotel,
  onAssignRoom,
  onUnassignRoomGuest,
}: {
  hotel: HotelRecord;
  onAssignRoom: (roomId: string) => void;
  onUnassignRoomGuest: (guestId: string) => void;
}) {
  const rooms = hotel.rooms || [];
  const occupied = rooms.reduce((sum, room) => sum + usedRoomMembers(room), 0);
  const capacity = rooms.reduce((sum, room) => sum + room.capacity, 0);

  return (
    <Card className="border-border shadow-none">
      <CardHeader>
        <CardTitle className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <span>
            <span className="block">{hotel.name}</span>
            <span className="text-sm font-normal text-muted-foreground">{hotel.location}</span>
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {rooms.length} rooms · {occupied}/{capacity || 0} members
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rooms.map((room) => (
          <RoomRow key={room.id} room={room} onAssign={() => onAssignRoom(room.id)} onUnassign={onUnassignRoomGuest} />
        ))}
        {!rooms.length && <p className="rounded-lg bg-surface-container-low p-4 text-sm text-muted-foreground">No rooms added yet.</p>}
      </CardContent>
    </Card>
  );
}

function RoomRow({ room, onAssign, onUnassign }: { room: RoomRecord; onAssign: () => void; onUnassign: (guestId: string) => void }) {
  const used = usedRoomMembers(room);
  const isFull = used >= room.capacity;

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">Room {room.roomNumber}</p>
            <AvailabilityBadge available={!isFull} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{used}/{room.capacity} members assigned</p>
          <Progress className="mt-3 h-2" value={room.capacity ? Math.min(100, (used / room.capacity) * 100) : 0} />
          <div className="mt-3 space-y-2 text-sm">
            {(room.assignments || []).map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between gap-2 rounded-md bg-surface-container-low px-2 py-1.5">
                <span>{assignment.guest.name} ({assignment.assignedMembers})</span>
                <Button type="button" size="sm" variant="ghost" onClick={() => onUnassign(assignment.guest.id)}>Unassign</Button>
              </div>
            ))}
            {!room.assignments?.length ? <p className="text-muted-foreground">No guests assigned</p> : null}
          </div>
        </div>
        <Button variant="outline" type="button" className="gap-2" onClick={onAssign} disabled={isFull}>
          <Users className="size-4" />
          Assign
        </Button>
      </div>
    </div>
  );
}

function AssignmentsOverview({
  cabs,
  hotels,
  guests,
  unassignedCabGuests,
  unassignedRoomGuests,
  onAssignCab,
  onAssignRoom,
}: {
  cabs: CabRecord[];
  hotels: HotelRecord[];
  guests: GuestRecord[];
  unassignedCabGuests: GuestRecord[];
  unassignedRoomGuests: GuestRecord[];
  onAssignCab: (cabId: string) => void;
  onAssignRoom: (roomId: string) => void;
}) {
  const rooms = hotels.flatMap((hotel) => hotel.rooms || []);

  return (
    <div className="grid items-stretch gap-4 xl:grid-cols-3">
      <Card className="min-h-[18rem] border-border shadow-none">
        <CardHeader>
          <CardTitle>Unassigned Guests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <SummaryLine label="Cab pending" value={unassignedCabGuests.length} />
          <SummaryLine label="Room pending" value={unassignedRoomGuests.length} />
          <SummaryLine label="Total guests" value={guests.length} />
        </CardContent>
      </Card>

      <Card className="min-h-[18rem] border-border shadow-none">
        <CardHeader>
          <CardTitle>Cab Assignments</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[20rem] space-y-3 overflow-auto pr-3">
          {cabs.map((cab) => (
            <div key={cab.id} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{cab.vehicleNumber}</p>
                  <p className="text-xs text-muted-foreground">{cab.usedSeats}/{cab.capacity} seats</p>
                </div>
                <Button size="sm" variant="outline" type="button" onClick={() => onAssignCab(cab.id)}>Assign</Button>
              </div>
              <AssignmentList className="mt-3" empty="No guests assigned" items={(cab.assignments || []).map((assignment) => assignment.guest.name)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="min-h-[18rem] border-border shadow-none">
        <CardHeader>
          <CardTitle>Room Assignments</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[20rem] space-y-3 overflow-auto pr-3">
          {rooms.map((room) => (
            <div key={room.id} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Room {room.roomNumber}</p>
                  <p className="text-xs text-muted-foreground">{usedRoomMembers(room)}/{room.capacity} members</p>
                </div>
                <Button size="sm" variant="outline" type="button" onClick={() => onAssignRoom(room.id)}>Assign</Button>
              </div>
              <AssignmentList className="mt-3" empty="No guests assigned" items={(room.assignments || []).map((assignment) => assignment.guest.name)} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function AssignmentSheet({
  assignment,
  selectedCab,
  selectedRoom,
  selectedHotel,
  guests,
  selectedGuestIds,
  setSelectedGuestIds,
  onOpenChange,
  onSubmit,
  busy,
}: {
  assignment: { mode: AssignmentMode; targetId: string } | null;
  selectedCab: CabRecord | null;
  selectedRoom: RoomRecord | null;
  selectedHotel: HotelRecord | null;
  guests: GuestRecord[];
  selectedGuestIds: string[];
  setSelectedGuestIds: (guestIds: string[]) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  const title = assignment?.mode === "cab"
    ? `Assign Guests to ${selectedCab?.vehicleNumber || "Cab"}`
    : `Assign Guests to Room ${selectedRoom?.roomNumber || ""}`;
  const subtitle = assignment?.mode === "cab"
    ? "Only confirmed guests without a cab assignment are shown."
    : assignment?.mode === "room" && selectedHotel
    ? `${selectedHotel.name}, ${selectedHotel.location}. Only confirmed guests without a room assignment are shown.`
    : "Select one or more unassigned guests.";
  const visibleCount = 20;
  const [visibleGuests, setVisibleGuests] = useState(visibleCount);
  const pagedGuests = guests.slice(0, visibleGuests);
  const hasMoreGuests = visibleGuests < guests.length;

  const loadMoreGuests = () => {
    setVisibleGuests((count) => Math.min(count + visibleCount, guests.length));
  };

  const toggleGuest = (guestId: string) => {
    setSelectedGuestIds(
      selectedGuestIds.includes(guestId)
        ? selectedGuestIds.filter((id) => id !== guestId)
        : [...selectedGuestIds, guestId]
    );
  };

  return (
    <Sheet open={Boolean(assignment)} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{subtitle}</SheetDescription>
        </SheetHeader>
        <div
          className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4"
          onScroll={(event) => {
            const target = event.currentTarget;
            if (hasMoreGuests && target.scrollTop + target.clientHeight >= target.scrollHeight - 32) {
              loadMoreGuests();
            }
          }}
        >
          {pagedGuests.map((guest) => (
            <label key={guest.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3">
              <Checkbox
                checked={selectedGuestIds.includes(guest.id)}
                onChange={() => toggleGuest(guest.id)}
              />
              <span className="min-w-0">
                <span className="block font-medium">{guest.name}</span>
                <span className="block text-xs text-muted-foreground">
                  Group {guest.groupSize} · {guest.pickupLocation || "No pickup"}
                </span>
              </span>
            </label>
          ))}
          {!guests.length && (
            <p className="rounded-lg bg-surface-container-low p-4 text-sm text-muted-foreground">
              {assignment?.mode === "cab"
                ? "No confirmed guests are waiting for cab assignment."
                : "No confirmed guests are waiting for room assignment."}
            </p>
          )}
          {hasMoreGuests && (
            <Button variant="outline" type="button" className="w-full" onClick={loadMoreGuests}>
              Load more guests
            </Button>
          )}
        </div>
        <SheetFooter>
          <Button type="button" onClick={onSubmit} disabled={!selectedGuestIds.length} loading={busy} loadingText="Assigning guests">
            Assign {selectedGuestIds.length} Guest{selectedGuestIds.length === 1 ? "" : "s"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function AssignmentList({ items, empty, className }: { items: string[]; empty: string; className?: string }) {
  if (!items.length) {
    return <p className={["text-sm text-muted-foreground", className].filter(Boolean).join(" ")}>{empty}</p>;
  }

  return (
    <ul className={["space-y-1 text-sm", className].filter(Boolean).join(" ")}>
      {items.slice(0, 5).map((item) => (
        <li key={item} className="truncate text-muted-foreground">- {item}</li>
      ))}
      {items.length > 5 && <li className="text-muted-foreground">+{items.length - 5} more</li>}
    </ul>
  );
}

function AvailabilityBadge({ available }: { available: boolean }) {
  return (
    <Badge variant={available ? "secondary" : "outline"} className={available ? "bg-status-success-bg text-status-success" : "bg-status-warning-bg text-status-warning"}>
      {available ? "Available" : "Full"}
    </Badge>
  );
}

function SummaryLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-6">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function usedRoomMembers(room: RoomRecord) {
  return room.assignments?.reduce((sum, assignment) => sum + assignment.assignedMembers, 0) || 0;
}

function OperationsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-9 w-20" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>

        <div className="grid items-stretch gap-4 p-4 pt-5 xl:grid-cols-3">
        <div className="min-h-[18rem] rounded-xl border border-border bg-card p-5">
          <Skeleton className="h-5 w-36" />
          <div className="mt-5 space-y-3">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        </div>

        {Array.from({ length: 2 }).map((_, cardIndex) => (
          <div key={cardIndex} className="min-h-[18rem] rounded-xl border border-border bg-card p-5">
            <Skeleton className="h-5 w-36" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 3 }).map((_, rowIndex) => (
                <div key={rowIndex} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-8 w-16 rounded-md" />
                  </div>
                  <Skeleton className="mt-3 h-8 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
