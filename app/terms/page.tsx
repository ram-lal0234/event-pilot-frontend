import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { termsSections } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsOfServicePage() {
  return (
    <LegalPageShell
      title="Terms of Service"
      lastUpdated="May 16, 2026"
      sections={termsSections}
    />
  );
}
