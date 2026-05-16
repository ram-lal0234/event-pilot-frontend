import type { HotelData } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function HotelPanel({ data }: { data: HotelData }) {
  return (
    <Card className="border-border shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Hotel Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {data.roomTypes.map((room) => (
            <RoomRow key={room.name} room={room} />
          ))}
        </div>
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase text-muted-foreground">
            Ready for Check-In
          </p>
          <ul className="space-y-2">
            {data.readyRooms.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <span>
                  <span className="font-medium">{r.room}</span>
                  <span className="text-muted-foreground"> · {r.type}</span>
                </span>
                <Button variant="link" type="button" className="h-auto p-0">
                  Assign
                </Button>
              </li>
            ))}
          </ul>
        </div>
        <Button variant="outline" className="w-full" type="button">
          View All Rooms
        </Button>
      </CardContent>
    </Card>
  );
}

function RoomRow({ room }: { room: { name: string; occupied: number; total: number } }) {
  const pct = (room.occupied / room.total) * 100;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium">{room.name}</span>
        <span className="text-muted-foreground">
          {room.occupied}/{room.total}
        </span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}
