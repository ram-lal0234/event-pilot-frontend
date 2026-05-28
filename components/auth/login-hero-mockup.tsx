"use client";

/** Product-themed phone mockup for the login hero panel (no external images). */
export function LoginHeroMockup() {
  return (
    <div className="relative mx-auto mt-6 w-full max-w-[280px]">
      <div
        aria-hidden
        className="absolute left-1/2 top-8 h-48 w-48 -translate-x-1/2 rounded-full border border-white/20"
      />
      <div className="relative rounded-[2rem] border-[6px] border-white/25 bg-slate-900 p-2 shadow-2xl">
        <div className="overflow-hidden rounded-[1.4rem] bg-slate-950">
          <div className="flex items-center justify-between bg-slate-900 px-3 py-2">
            <span className="text-[10px] font-medium text-white/90">Ram &amp; Priya Wedding</span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-semibold text-emerald-300">
              Live
            </span>
          </div>
          <div className="space-y-2 p-3">
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Guests" value="842" />
              <StatCard label="RSVP ✓" value="618" />
            </div>
            <div className="rounded-lg bg-white/5 p-2">
              <div className="mb-1 flex justify-between text-[8px] text-white/50">
                <span>Check-in today</span>
                <span>72%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-violet-400 to-indigo-300" />
              </div>
            </div>
            <div className="space-y-1.5 rounded-lg border border-white/10 bg-white/5 p-2">
              {[
                { name: "Amit Sharma", tag: "VIP" },
                { name: "Neha Patel", tag: "Cab" },
                { name: "Rohan Mehta", tag: "Hotel" },
              ].map((row) => (
                <div key={row.name} className="flex items-center justify-between text-[9px]">
                  <span className="text-white/85">{row.name}</span>
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-white/60">{row.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div
        aria-hidden
        className="absolute -bottom-3 left-1/2 h-4 w-[70%] -translate-x-1/2 rounded-[100%] bg-black/25 blur-md"
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-center">
      <p className="text-[8px] uppercase tracking-wide text-white/50">{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  );
}
