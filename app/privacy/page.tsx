import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { privacyPolicySections } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      lastUpdated="May 16, 2026"
      sections={privacyPolicySections}
    />
  );
}
