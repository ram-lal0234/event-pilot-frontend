"use client";

import { useState } from "react";
import { Copy, ExternalLink, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { resolvePublicRsvpUrl } from "@/lib/public-rsvp-url";
import { api, type EventRecord, type GuestRecord } from "@/lib/api";
import { useApp } from "@/components/providers/app-provider";
import {
  buildTemplateContext,
  buildWhatsAppWebUrl,
  loadWhatsAppInviteSettings,
  phoneToWhatsAppRecipient,
  renderWhatsAppMessage,
  whatsAppMediaPayload,
} from "@/lib/whatsapp-invite";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type GuestWhatsAppActionsProps = {
  guest: GuestRecord;
  event: EventRecord;
  compact?: boolean;
  /** Full-width outline button for guest detail sheet */
  stacked?: boolean;
};

async function resolveGuestRsvpUrl(token: string, guest: GuestRecord) {
  let inviteCode = guest.inviteCode;
  let backendUrl = guest.publicRsvpUrl;
  if (!inviteCode && !backendUrl) {
    const link = await api.getGuestRsvpLink(token, guest.id);
    inviteCode = link.inviteCode;
    backendUrl = link.publicRsvpUrl;
  }
  return resolvePublicRsvpUrl(backendUrl, inviteCode);
}

export function useGuestWhatsAppActions(guest: GuestRecord, event: EventRecord | null) {
  const { token, currentEventId } = useApp();
  const [busy, setBusy] = useState(false);

  const buildMessage = async () => {
    if (!token || !currentEventId || !event) {
      throw new Error("Sign in and select an event first");
    }

    const settings = loadWhatsAppInviteSettings(currentEventId);
    const rsvpLink = settings.includeRsvpLink
      ? await resolveGuestRsvpUrl(token, guest)
      : "";

    if (settings.includeRsvpLink && !rsvpLink) {
      throw new Error("Could not load RSVP link for this guest");
    }

    const context = buildTemplateContext(guest, event, rsvpLink || "(RSVP link disabled)");
    return renderWhatsAppMessage(settings.messageTemplate, context, {
      includeRsvpLink: settings.includeRsvpLink,
    });
  };

  const copyMessage = async () => {
    setBusy(true);
    try {
      const message = await buildMessage();
      await navigator.clipboard.writeText(message);
      toast.success("WhatsApp message copied");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not copy message");
    } finally {
      setBusy(false);
    }
  };

  const sendWhatsAppMessage = async () => {
    if (!token) {
      toast.error("Sign in to send WhatsApp messages");
      return;
    }
    if (!currentEventId) {
      toast.error("Select an event first");
      return;
    }
    setBusy(true);
    try {
      const recipient = phoneToWhatsAppRecipient(guest.phone);
      if (!recipient) {
        toast.error("Guest phone number is not valid for WhatsApp");
        return;
      }
      const settings = loadWhatsAppInviteSettings(currentEventId);
      const message = await buildMessage();
      const result = await api.sendGuestWhatsApp(token, guest.id, {
        message,
        ...whatsAppMediaPayload(settings),
      });
      toast.success(result.message || "WhatsApp message sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send message");
    } finally {
      setBusy(false);
    }
  };

  const openWhatsApp = async () => {
    setBusy(true);
    try {
      const recipient = phoneToWhatsAppRecipient(guest.phone);
      if (!recipient) {
        toast.error("Guest phone number is not valid for WhatsApp");
        return;
      }
      const message = await buildMessage();
      window.open(buildWhatsAppWebUrl(recipient, message), "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open WhatsApp");
    } finally {
      setBusy(false);
    }
  };

  return { busy, copyMessage, sendWhatsAppMessage, openWhatsApp };
}

export function GuestWhatsAppActions({
  guest,
  event,
  compact = false,
  stacked = false,
}: GuestWhatsAppActionsProps) {
  const { busy, copyMessage, sendWhatsAppMessage, openWhatsApp } = useGuestWhatsAppActions(
    guest,
    event,
  );

  const trigger = (
    <Button
      variant={stacked || !compact ? "outline" : "ghost"}
      size={compact ? "icon-sm" : "sm"}
      type="button"
      className={stacked ? "w-full justify-center gap-2" : compact ? undefined : "gap-2"}
      disabled={busy}
      loading={busy}
    >
      <MessageCircle className="size-4" />
      {!compact ? "WhatsApp" : null}
    </Button>
  );

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => void sendWhatsAppMessage()}>
          <Send className="size-4" />
          Send WhatsApp message
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void copyMessage()}>
          <Copy className="size-4" />
          Copy message
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void openWhatsApp()}>
          <ExternalLink className="size-4" />
          Open WhatsApp (wa.me)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger render={menu} />
        <TooltipContent>Send via Event Pilot API, copy message, or open wa.me</TooltipContent>
      </Tooltip>
    );
  }

  return menu;
}
