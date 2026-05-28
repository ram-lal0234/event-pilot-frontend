import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to EventPilot AI",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh text-foreground">{children}</div>;
}
