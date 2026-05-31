"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Bed, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { api, type HotelRecord } from "@/lib/api";

const ROOM_TYPE_HINTS = ["Standard", "Deluxe", "Suite", "Executive", "Family"];

const initialForm = {
  hotelId: "",
  roomNumber: "",
  capacity: 2,
  roomType: "",
  floor: "",
  roomStatus: "Available",
  checkInDate: "",
  checkOutDate: "",
};

export function CreateRoomSheet({
  token,
  hotels,
  onCreated,
}: {
  token: string;
  hotels: HotelRecord[];
  onCreated: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [busy, setBusy] = useState(false);

  const selectedHotelName = useMemo(
    () => hotels.find((hotel) => hotel.id === form.hotelId)?.name ?? "",
    [form.hotelId, hotels],
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.hotelId) {
      toast.error("Select a hotel first");
      return;
    }
    setBusy(true);
    try {
      await api.createRoom(token, {
        ...form,
        capacity: Number(form.capacity),
        checkInDate: form.checkInDate ? new Date(form.checkInDate).toISOString() : undefined,
        checkOutDate: form.checkOutDate ? new Date(form.checkOutDate).toISOString() : undefined,
      });
      setForm(initialForm);
      setOpen(false);
      toast.success("Room created");
      await onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create room");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            className="h-9 gap-2 rounded-md bg-foreground px-4 text-background hover:bg-foreground/90"
            type="button"
            disabled={!hotels.length}
          />
        }
      >
        <Plus className="size-4" />
        Add Room
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={submit}>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Bed className="size-5 text-primary" />
              Add Room
            </SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-4">
            <label className="block space-y-1 text-sm font-medium">
              <span>Hotel</span>
              <Select
                value={form.hotelId || undefined}
                onValueChange={(hotelId) => {
                  if (hotelId != null) setForm({ ...form, hotelId });
                }}
              >
                <SelectTrigger className="w-full justify-between font-normal">
                  <SelectValue placeholder="Select hotel">
                    {selectedHotelName || "Select hotel"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="start">
                  {hotels.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.id}>
                      {hotel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Room number</span>
              <Input
                value={form.roomNumber}
                onChange={(event) => setForm({ ...form, roomNumber: event.target.value })}
                placeholder="e.g. 204"
                required
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Room type</span>
              <Input
                value={form.roomType}
                onChange={(event) => setForm({ ...form, roomType: event.target.value })}
                placeholder="e.g. Deluxe"
                list="room-type-hints"
              />
              <datalist id="room-type-hints">
                {ROOM_TYPE_HINTS.map((hint) => (
                  <option key={hint} value={hint} />
                ))}
              </datalist>
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Floor</span>
              <Input
                value={form.floor}
                onChange={(event) => setForm({ ...form, floor: event.target.value })}
                placeholder="e.g. 2"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Status</span>
              <Input
                value={form.roomStatus}
                onChange={(event) => setForm({ ...form, roomStatus: event.target.value })}
                placeholder="e.g. Available"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Check-in</span>
              <Input
                type="datetime-local"
                value={form.checkInDate}
                onChange={(event) => setForm({ ...form, checkInDate: event.target.value })}
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Check-out</span>
              <Input
                type="datetime-local"
                value={form.checkOutDate}
                onChange={(event) => setForm({ ...form, checkOutDate: event.target.value })}
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Capacity</span>
              <Input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(event) => setForm({ ...form, capacity: Number(event.target.value) })}
                required
              />
            </label>
          </SheetBody>
          <SheetFooter>
            <Button type="submit" loading={busy} loadingText="Creating room">
              Create Room
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
