import { AlertTriangle, Bed, Car, CheckCircle2 } from "lucide-react";
import type { FeedItem } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const icons = {
  checkin: CheckCircle2,
  cab: Car,
  alert: AlertTriangle,
  room: Bed,
};

const colors = {
  checkin: "text-status-success",
  cab: "text-primary",
  alert: "text-status-error",
  room: "text-muted-foreground",
};

export function LiveOperationsFeed({ items }: { items: FeedItem[] }) {
  return (
    <Card className="border-border shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Live Operations Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-4">
          <ul className="space-y-4">
            {items.map((item) => {
              const Icon = icons[item.type];
              return (
                <li key={item.id} className="flex gap-3 border-b border-border pb-4 last:border-0">
                  <Icon className={`mt-0.5 size-5 shrink-0 ${colors[item.type]}`} />
                  <FeedItemContent item={item} />
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function FeedItemContent({ item }: { item: FeedItem }) {
  return (
    <div>
      <p className="text-sm font-medium text-text-main">{item.title}</p>
      <p className="text-xs text-muted-foreground">
        {item.subtitle} · {item.time}
      </p>
    </div>
  );
}
