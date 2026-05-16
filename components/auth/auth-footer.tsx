import Link from "next/link";

export function AuthFooter() {
  return (
    <footer className="absolute inset-x-0 bottom-0 z-10 px-4 pb-5 pt-3 sm:pb-6">
      <div className="mx-auto flex max-w-md flex-col items-center gap-1.5 text-center">
        <nav
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-medium text-[#918fa1]"
          aria-label="Legal"
        >
          <Link href="/privacy" className="transition-colors hover:text-[#dae2fd]">
            Privacy Policy
          </Link>
          <span className="text-[#464555]/60" aria-hidden>
            ·
          </span>
          <Link href="/terms" className="transition-colors hover:text-[#dae2fd]">
            Terms of Service
          </Link>
        </nav>
        <p className="text-[11px] text-[#c7c4d8]/50">© 2026 EventPilot AI. All rights reserved.</p>
      </div>
    </footer>
  );
}
