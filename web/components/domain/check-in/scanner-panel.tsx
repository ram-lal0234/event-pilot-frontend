import { Flashlight, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ScannerPanel() {
  return (
    <div className="relative flex min-h-[520px] flex-col overflow-hidden rounded-xl">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&q=80')",
        }}
      />
      <div className="relative z-10 flex flex-1 flex-col p-6">
        <div className="flex justify-end gap-2">
          <Button size="icon" variant="secondary" className="rounded-full bg-black/40 text-white hover:bg-black/60" type="button">
            <Flashlight className="size-4" />
          </Button>
          <Button size="icon" variant="secondary" className="rounded-full bg-black/40 text-white hover:bg-black/60" type="button">
            <RefreshCw className="size-4" />
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <PhoneFrame />
        </div>
        <SearchBar />
      </div>
    </div>
  );
}

function SearchBar() {
  return (
    <div className="flex gap-2 rounded-lg bg-white p-2 shadow-lg">
      <Input placeholder="Manual Guest Search (Name, Email, or Phone)" className="border-0 shadow-none focus-visible:ring-0" readOnly />
      <Button type="button" className="shrink-0 gap-2">
        <Search className="size-4" />
        Search
      </Button>
    </div>
  );
}

function PhoneFrame() {
  return (
    <div className="h-[320px] w-[180px] rounded-[2rem] border-4 border-white/80 bg-black/60 p-4 shadow-2xl">
      <div className="relative flex h-full items-center justify-center rounded-xl bg-white/10">
        <div className="size-32 rounded-lg bg-white p-2">
          <div className="grid h-full w-full grid-cols-4 gap-0.5 bg-black p-1">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className={i % 3 === 0 ? "bg-black" : "bg-white"} />
            ))}
          </div>
        </div>
        <div className="absolute inset-x-4 top-1/2 h-0.5 -translate-y-1/2 bg-purple-500 shadow-[0_0_8px_#a855f7]" />
        <div className="absolute left-2 top-2 size-6 border-l-2 border-t-2 border-white" />
        <div className="absolute right-2 top-2 size-6 border-r-2 border-t-2 border-white" />
        <div className="absolute bottom-2 left-2 size-6 border-b-2 border-l-2 border-white" />
        <div className="absolute bottom-2 right-2 size-6 border-b-2 border-r-2 border-white" />
      </div>
    </div>
  );
}
