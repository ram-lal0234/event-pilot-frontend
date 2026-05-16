import { ScannerPanel } from "@/components/domain/check-in/scanner-panel";
import { GuestConfirmation } from "@/components/domain/check-in/guest-confirmation";
import { checkedInGuest } from "@/lib/mock-data";

export const metadata = {
  title: "Check-In",
  description: "QR check-in and guest validation",
};

export default function CheckInPage() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <ScannerPanel />
      </div>
      <div>
        <GuestConfirmation guest={checkedInGuest} />
      </div>
    </div>
  );
}
