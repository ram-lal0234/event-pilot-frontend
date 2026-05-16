import { EventRouteSync } from "@/components/routing/event-route-sync";

export default function EventScopedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EventRouteSync>{children}</EventRouteSync>;
}
