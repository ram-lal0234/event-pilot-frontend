import { BrandLogo } from "@/components/brand-logo";
import { brand } from "@/lib/design-tokens";

export function PublicRsvpShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-4 sm:px-6">
          <BrandLogo priority imageClassName="h-9 w-auto" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">{brand.name}</p>
            <p className="text-[11px] text-muted-foreground">Guest RSVP</p>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-xl px-4 py-6 sm:px-6">{children}</div>
    </div>
  );
}
