import Link from "next/link";
import { ArrowLeft, Rocket } from "lucide-react";
import type { LegalSection } from "@/lib/legal-content";

type LegalPageShellProps = {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export function LegalPageShell({ title, lastUpdated, sections }: LegalPageShellProps) {
  return (
    <main className="min-h-dvh bg-[#0b1326] text-[#dae2fd]">
      <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(23,31,51,0.95),rgba(6,14,32,1))]" />

      <header className="relative z-10 border-b border-white/10 bg-[#0b1326]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#c7c4d8] transition-colors hover:text-[#dae2fd]"
          >
            <ArrowLeft className="size-4" />
            Back to login
          </Link>
          <Link href="/" className="flex items-center gap-2 text-[#c3c0ff]">
            <Rocket className="size-6" />
            <span className="text-sm font-bold">EventPilot AI</span>
          </Link>
        </div>
      </header>

      <article className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#c3c0ff]/80">Legal</p>
        <h1 className="mt-2 text-3xl font-bold text-[#dae2fd] sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-[#918fa1]">Last updated {lastUpdated}</p>
        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-[#dae2fd]">{section.title}</h2>
              <div className="mt-3 space-y-3">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)} className="text-sm leading-relaxed text-[#c7c4d8]">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>

      <footer className="relative z-10 border-t border-white/10 px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
          <nav className="flex items-center gap-3 text-xs font-medium text-[#918fa1]">
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
    </main>
  );
}
