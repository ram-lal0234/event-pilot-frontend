"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Bed, Car, Hotel, Plus, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/domain/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  api,
  type CabRecord,
  type GuestRecord,
  type HotelRecord,
} from "@/lib/api";
import { useApp } from "@/components/providers/app-provider";

export default function OperationsPage() {
  const { token, currentEventId } = useApp();
  const [cabs, setCabs] = useState<CabRecord[]>([]);
  const [hotels, setHotels] = useState<HotelRecord[]>([]);
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [cabForm, setCabForm] = useState({ driverName: "", vehicleNumber: "", capacity: 4 });
  const [hotelForm, setHotelForm] = useState({ name: "", location: "" });
  const [roomForm, setRoomForm] = useState({ hotelId: "", roomNumber: "", capacity: 2 });
  const [cabAssign, setCabAssign] = useState({ cabId: "", guestId: "" });
  const [roomAssign, setRoomAssign] = useState({ roomId: "", guestId: "" });

  const load = useCallback(async () => {
    if (!currentEventId) return;
    try {
      const [cabResult, hotelResult, guestResult] = await Promise.all([
        api.listCabs(token, currentEventId),
        api.listHotels(token, currentEventId),
        api.listGuests(token, currentEventId),
      ]);
      setCabs(cabResult);
      setHotels(hotelResult);
      setGuests(guestResult);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load operations");
    }
  }, [currentEventId, token]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const rooms = useMemo(() => hotels.flatMap((hotel) => hotel.rooms || []), [hotels]);
  const unassignedCabGuests = guests.filter((guest) => !guest.cabAssignments?.length);
  const unassignedRoomGuests = guests.filter((guest) => !guest.roomAssignments?.length);

  const submit = async (task: () => Promise<unknown>, success: string) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await task();
      setMessage(success);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
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

  const assignCab = (event: FormEvent) => {
    event.preventDefault();
    submit(() => api.assignCab(token, cabAssign), "Guest assigned to cab");
  };

  const assignRoom = (event: FormEvent) => {
    event.preventDefault();
    submit(() => api.assignRoom(token, roomAssign), "Guest assigned to room");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Hub"
        description="Logistics, hotels, and guest pickups"
        actions={
          <Button variant="outline" type="button" className="gap-2" onClick={load}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        }
      />
      {message && <p className="rounded-md bg-status-success-bg p-3 text-sm text-status-success">{message}</p>}
      {error && <p className="rounded-md bg-status-error-bg p-3 text-sm text-status-error">{error}</p>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="border-border shadow-none xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="size-5 text-primary" />
              Cabs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {cabs.map((cab) => (
                <div key={cab.id} className="rounded-lg border border-border p-4">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-bold">{cab.vehicleNumber}</p>
                      <p className="text-sm text-muted-foreground">{cab.driverName}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{cab.usedSeats}/{cab.capacity}</span>
                  </div>
                  <Progress className="mt-3 h-2" value={(cab.usedSeats / cab.capacity) * 100} />
                </div>
              ))}
            </div>
            <form className="grid gap-2 rounded-lg bg-surface-container-low p-3 md:grid-cols-4" onSubmit={createCab}>
              <Input value={cabForm.driverName} onChange={(event) => setCabForm({ ...cabForm, driverName: event.target.value })} placeholder="Driver" required />
              <Input value={cabForm.vehicleNumber} onChange={(event) => setCabForm({ ...cabForm, vehicleNumber: event.target.value })} placeholder="Vehicle" required />
              <Input type="number" min={1} value={cabForm.capacity} onChange={(event) => setCabForm({ ...cabForm, capacity: Number(event.target.value) })} placeholder="Capacity" required />
              <Button type="submit" disabled={busy} className="gap-2"><Plus className="size-4" />Cab</Button>
            </form>
            <AssignmentForm
              title="Assign guest to cab"
              firstLabel="Cab"
              firstValue={cabAssign.cabId}
              firstOptions={cabs.map((cab) => ({ value: cab.id, label: `${cab.vehicleNumber} (${cab.usedSeats}/${cab.capacity})` }))}
              guestValue={cabAssign.guestId}
              guests={unassignedCabGuests}
              onFirstChange={(cabId) => setCabAssign({ ...cabAssign, cabId })}
              onGuestChange={(guestId) => setCabAssign({ ...cabAssign, guestId })}
              onSubmit={assignCab}
              busy={busy}
            />
          </CardContent>
        </Card>

        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hotel className="size-5 text-primary" />
              Hotels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hotels.map((hotel) => (
              <div key={hotel.id} className="rounded-lg border border-border p-3">
                <p className="font-semibold">{hotel.name}</p>
                <p className="text-sm text-muted-foreground">{hotel.location}</p>
                <p className="mt-2 text-xs text-muted-foreground">{hotel.rooms?.length || 0} rooms</p>
              </div>
            ))}
            <form className="space-y-2 rounded-lg bg-surface-container-low p-3" onSubmit={createHotel}>
              <Input value={hotelForm.name} onChange={(event) => setHotelForm({ ...hotelForm, name: event.target.value })} placeholder="Hotel name" required />
              <Input value={hotelForm.location} onChange={(event) => setHotelForm({ ...hotelForm, location: event.target.value })} placeholder="Location" required />
              <Button className="w-full gap-2" type="submit" disabled={busy}><Plus className="size-4" />Hotel</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bed className="size-5 text-primary" />
            Rooms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            {rooms.map((room) => {
              const used = room.assignments?.reduce((sum, assignment) => sum + assignment.assignedMembers, 0) || 0;
              return (
                <div key={room.id} className="rounded-lg border border-border p-3">
                  <p className="font-semibold">Room {room.roomNumber}</p>
                  <p className="text-sm text-muted-foreground">{used}/{room.capacity} members</p>
                  <Progress className="mt-3 h-2" value={(used / room.capacity) * 100} />
                </div>
              );
            })}
          </div>
          <form className="grid gap-2 rounded-lg bg-surface-container-low p-3 md:grid-cols-4" onSubmit={createRoom}>
            <Select value={roomForm.hotelId} onChange={(event) => setRoomForm({ ...roomForm, hotelId: event.target.value })} required>
              <option value="">Hotel</option>
              {hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}
            </Select>
            <Input value={roomForm.roomNumber} onChange={(event) => setRoomForm({ ...roomForm, roomNumber: event.target.value })} placeholder="Room" required />
            <Input type="number" min={1} value={roomForm.capacity} onChange={(event) => setRoomForm({ ...roomForm, capacity: Number(event.target.value) })} placeholder="Capacity" required />
            <Button type="submit" disabled={busy} className="gap-2"><Plus className="size-4" />Room</Button>
          </form>
          <AssignmentForm
            title="Assign guest to room"
            firstLabel="Room"
            firstValue={roomAssign.roomId}
            firstOptions={rooms.map((room) => ({ value: room.id, label: `Room ${room.roomNumber}` }))}
            guestValue={roomAssign.guestId}
            guests={unassignedRoomGuests}
            onFirstChange={(roomId) => setRoomAssign({ ...roomAssign, roomId })}
            onGuestChange={(guestId) => setRoomAssign({ ...roomAssign, guestId })}
            onSubmit={assignRoom}
            busy={busy}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function AssignmentForm({
  title,
  firstLabel,
  firstValue,
  firstOptions,
  guestValue,
  guests,
  onFirstChange,
  onGuestChange,
  onSubmit,
  busy,
}: {
  title: string;
  firstLabel: string;
  firstValue: string;
  firstOptions: { value: string; label: string }[];
  guestValue: string;
  guests: GuestRecord[];
  onFirstChange: (value: string) => void;
  onGuestChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  busy: boolean;
}) {
  return (
    <form className="grid gap-2 rounded-lg border border-border p-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={onSubmit}>
      <Select value={firstValue} onChange={(event) => onFirstChange(event.target.value)} required>
        <option value="">{firstLabel}</option>
        {firstOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </Select>
      <Select value={guestValue} onChange={(event) => onGuestChange(event.target.value)} required>
        <option value="">{title}</option>
        {guests.map((guest) => <option key={guest.id} value={guest.id}>{guest.name} ({guest.groupSize})</option>)}
      </Select>
      <Button type="submit" disabled={busy}>Assign</Button>
    </form>
  );
}
