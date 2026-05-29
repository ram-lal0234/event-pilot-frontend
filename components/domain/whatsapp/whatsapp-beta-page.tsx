"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ImagePlus, RotateCcw, Save, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/providers/app-provider";
import { useWhatsAppInviteSettings } from "@/hooks/use-whatsapp-invite-settings";
import { api, type GuestRecord } from "@/lib/api";
import {
  buildWhatsAppBridgeSendPayload,
  DEFAULT_WHATSAPP_BRIDGE_API_URL,
  sendViaWhatsAppBridge,
} from "@/lib/whatsapp-bridge";
import {
  buildTemplateContext,
  DEFAULT_WHATSAPP_MESSAGE_TEMPLATE,
  phoneToWhatsAppRecipient,
  readImageFileAsDataUrl,
  renderWhatsAppMessage,
} from "@/lib/whatsapp-invite";
import { scopedEventHref } from "@/lib/design-tokens";
import { WhatsAppMessagePreview } from "@/components/domain/whatsapp/whatsapp-message-preview";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { OptionDropdown } from "@/components/ui/option-dropdown";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const PLACEHOLDERS =
  "{{guestName}}, {{eventName}}, {{rsvpLink}}, {{eventDate}}, {{eventLocation}}";

export function WhatsAppBetaPage() {
  const { token, currentEvent, currentEventId } = useApp();
  const { settings, setSettings, hydrated } = useWhatsAppInviteSettings(currentEventId);
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [previewGuestId, setPreviewGuestId] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  useEffect(() => {
    if (!token || !currentEventId) {
      setGuests([]);
      setPreviewGuestId("");
      return;
    }
    void api
      .listGuests(token, currentEventId)
      .then((data) => {
        setGuests(data);
        setPreviewGuestId((prev) => prev || data[0]?.id || "");
      })
      .catch(() => setGuests([]));
  }, [token, currentEventId]);

  const previewGuest = guests.find((g) => g.id === previewGuestId) ?? guests[0] ?? null;

  useEffect(() => {
    setTestPhone(previewGuest?.phone?.trim() ?? "");
  }, [previewGuest?.id, previewGuest?.phone]);

  const previewMessage = useMemo(() => {
    if (!currentEvent || !previewGuest) {
      return settings.messageTemplate;
    }
    const link = previewGuest.publicRsvpUrl ?? "…";
    const context = buildTemplateContext(previewGuest, currentEvent, link);
    return renderWhatsAppMessage(settings.messageTemplate, context, {
      includeRsvpLink: settings.includeRsvpLink,
    });
  }, [currentEvent, previewGuest, settings.includeRsvpLink, settings.messageTemplate]);

  const previewContactName = previewGuest?.name ?? currentEvent?.name ?? "Guest";

  const onSave = () => {
    if (!currentEventId) return;
    setSettings({ ...settings });
    toast.success("Saved on this device");
  };

  const onImagePick = async (file: File | null) => {
    if (!file) return;
    try {
      const { dataUrl, name } = await readImageFileAsDataUrl(file);
      setSettings({ ...settings, imageDataUrl: dataUrl, imageName: name });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not attach image");
    }
  };

  const sendTestViaBridge = async () => {
    const phone = testPhone || previewGuest?.phone || "";
    const recipient = phoneToWhatsAppRecipient(phone);
    if (!recipient) {
      toast.error(
        previewGuest
          ? "Selected guest has no valid WhatsApp number"
          : "Select a guest with a phone number",
      );
      return;
    }
    if (!previewMessage.trim() && !settings.imageDataUrl) {
      toast.error("Add a message or attach an image");
      return;
    }

    setSendingTest(true);
    const result = await sendViaWhatsAppBridge(
      settings.bridgeApiUrl,
      buildWhatsAppBridgeSendPayload(recipient, previewMessage, {
        imageDataUrl: settings.imageDataUrl,
        imageName: settings.imageName,
      }),
    );
    setSendingTest(false);

    if (result.success) toast.success(result.message);
    else toast.error(result.message);
  };

  if (!currentEventId || !currentEvent) {
    return (
      <p className="text-sm text-muted-foreground">Select an event to configure WhatsApp (Beta).</p>
    );
  }

  if (!hydrated) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-foreground">WhatsApp (Beta)</h1>
          <Badge variant="outline" className="border-warning/40 bg-warning-bg text-[10px] text-warning">
            Local
          </Badge>
        </div>
        <Link
          href={scopedEventHref(currentEventId, "/guests")}
          className="text-xs font-medium text-primary hover:underline"
        >
          Send from Guests →
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* Left: settings + send */}
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          {guests.length > 0 ? (
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Guest</span>
              <OptionDropdown
                value={previewGuestId || guests[0].id}
                onValueChange={setPreviewGuestId}
                options={guests.map((g) => ({ value: g.id, label: g.name }))}
                placeholder="Select guest"
              />
            </label>
          ) : (
            <p className="text-xs text-muted-foreground">Add guests to preview and send.</p>
          )}

          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-muted/30 p-2.5">
            <label className="grid min-w-0 flex-1 gap-1">
              <span className="text-xs font-medium text-muted-foreground">Phone</span>
              <Input
                readOnly
                placeholder={previewGuest ? "No phone on guest" : "Select a guest"}
                value={testPhone}
                className="h-8 text-xs"
              />
            </label>
            <Button
              type="button"
              size="sm"
              onClick={() => void sendTestViaBridge()}
              loading={sendingTest}
              loadingText="…"
              disabled={!previewGuest?.phone?.trim()}
            >
              <Send className="size-3.5" />
              Send
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Message template</label>
            <Textarea
              className="min-h-28 font-mono text-xs"
              value={settings.messageTemplate}
              onChange={(e) => setSettings({ ...settings, messageTemplate: e.target.value })}
            />
            <p className="text-[10px] text-muted-foreground">{PLACEHOLDERS}</p>
          </div>

          <label className="flex items-center gap-2 text-xs">
            <Checkbox
              checked={settings.includeRsvpLink}
              onChange={(e) => setSettings({ ...settings, includeRsvpLink: e.target.checked })}
            />
            Include {"{{rsvpLink}}"} per guest
          </label>

          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Image (sent with message via bridge)</span>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted/60">
                <ImagePlus className="size-3.5" />
                Attach
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(e) => void onImagePick(e.target.files?.[0] ?? null)}
                />
              </label>
              {settings.imageDataUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setSettings({ ...settings, imageDataUrl: null, imageName: null })}
                >
                  <Trash2 className="size-3" />
                  Remove
                </Button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            <Button type="button" size="sm" onClick={onSave}>
              <Save className="size-3.5" />
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                setSettings({ ...settings, messageTemplate: DEFAULT_WHATSAPP_MESSAGE_TEMPLATE })
              }
            >
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
          </div>

          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium text-foreground/80">Local bridge API</summary>
            <p className="mt-2">
              <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                cd whatsapp-mcp/whatsapp-bridge && go run main.go
              </code>
            </p>
            <Input
              type="url"
              className="mt-2 h-8 text-xs"
              placeholder={DEFAULT_WHATSAPP_BRIDGE_API_URL}
              value={settings.bridgeApiUrl}
              onChange={(e) => setSettings({ ...settings, bridgeApiUrl: e.target.value })}
            />
          </details>
        </div>

        {/* Right: live WhatsApp mockup */}
        <div className="flex justify-center lg:sticky lg:top-4">
          <WhatsAppMessagePreview
            contactName={previewContactName}
            message={previewMessage}
            imageSrc={settings.imageDataUrl}
            imageAlt={settings.imageName ?? "Invite"}
          />
        </div>
      </div>
    </div>
  );
}
