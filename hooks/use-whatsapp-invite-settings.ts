"use client";

import { useCallback, useEffect, useState } from "react";
import {
  defaultWhatsAppInviteSettings,
  loadWhatsAppInviteSettings,
  saveWhatsAppInviteSettings,
  type WhatsAppInviteSettings,
} from "@/lib/whatsapp-invite";

export function useWhatsAppInviteSettings(eventId: string | undefined) {
  const [settings, setSettings] = useState<WhatsAppInviteSettings>(defaultWhatsAppInviteSettings);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setSettings(defaultWhatsAppInviteSettings());
      setHydrated(true);
      return;
    }
    setSettings(loadWhatsAppInviteSettings(eventId));
    setHydrated(true);
  }, [eventId]);

  const persist = useCallback(
    (next: WhatsAppInviteSettings) => {
      setSettings(next);
      if (eventId) {
        saveWhatsAppInviteSettings(eventId, next);
      }
    },
    [eventId],
  );

  return { settings, setSettings: persist, hydrated };
}
