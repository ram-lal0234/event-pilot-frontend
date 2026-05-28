import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "EventPilot AI",
    template: "%s | EventPilot AI",
  },
  description: "CamRSVP event operations platform",
  applicationName: "EventPilot AI",
  icons: {
    icon: [
      { url: "/logos/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/logos/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/logos/favicon.ico",
    apple: "/logos/apple-touch-icon.png",
    other: [
      { rel: "android-chrome-192x192", url: "/logos/android-chrome-192x192.png" },
      { rel: "android-chrome-512x512", url: "/logos/android-chrome-512x512.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
