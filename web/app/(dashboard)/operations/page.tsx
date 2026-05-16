import { PageHeader } from "@/components/domain/page-header";
import { CabGrid } from "@/components/domain/operations/cab-grid";
import { HotelPanel } from "@/components/domain/operations/hotel-panel";
import { PickupTable } from "@/components/domain/operations/pickup-table";
import { cabs, hotelData, pickups } from "@/lib/mock-data";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata = {
  title: "Operations",
  description: "Logistics, hotels, and guest pickups",
};

export default function OperationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Hub"
        description="Real-time oversight of Logistics, Hotels, and Guest Pickups"
        actions={
          <Tabs defaultValue="logistics">
            <TabsList>
              <TabsTrigger value="logistics">Logistics View</TabsTrigger>
              <TabsTrigger value="timeline">Timeline View</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <CabGrid cabs={cabs} />
        </div>
        <HotelPanel data={hotelData} />
      </div>
      <PickupTable pickups={pickups} />
    </div>
  );
}
