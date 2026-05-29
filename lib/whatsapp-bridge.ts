/**
 * Local Go bridge (whatsapp-mcp/whatsapp-bridge) — same contract as send-message.html.
 * POST { recipient, message, media_path? } → { success, message }
 */

export const DEFAULT_WHATSAPP_BRIDGE_API_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_BRIDGE_URL?.replace(/\/$/, "") ||
  "http://localhost:8080/api/send";

export type WhatsAppBridgeSendPayload = {
  recipient: string;
  message: string;
  /** Absolute path on the machine running whatsapp-bridge */
  media_path?: string;
  /** Raw base64 or data URL — bridge writes a temp file (for browser uploads) */
  media_base64?: string;
  media_filename?: string;
};

export function bridgeMediaFromStoredImage(
  imageDataUrl: string | null | undefined,
  imageName?: string | null,
): Pick<WhatsAppBridgeSendPayload, "media_base64" | "media_filename"> | undefined {
  if (!imageDataUrl?.startsWith("data:")) return undefined;
  return {
    media_base64: imageDataUrl,
    media_filename: imageName || "invite.jpg",
  };
}

export function buildWhatsAppBridgeSendPayload(
  recipient: string,
  message: string,
  image?: { imageDataUrl: string | null; imageName?: string | null },
): WhatsAppBridgeSendPayload {
  return {
    recipient,
    message,
    ...bridgeMediaFromStoredImage(image?.imageDataUrl, image?.imageName),
  };
}

export type WhatsAppBridgeSendResponse = {
  success: boolean;
  message: string;
};

export function resolveWhatsAppBridgeApiUrl(override?: string | null) {
  const trimmed = override?.trim();
  return trimmed || DEFAULT_WHATSAPP_BRIDGE_API_URL;
}

export async function sendViaWhatsAppBridge(
  apiUrl: string,
  payload: WhatsAppBridgeSendPayload,
): Promise<WhatsAppBridgeSendResponse> {
  const url = resolveWhatsAppBridgeApiUrl(apiUrl);

  if (!payload.recipient) {
    return { success: false, message: "Enter a valid phone number." };
  }
  if (!payload.message?.trim() && !payload.media_path && !payload.media_base64) {
    return { success: false, message: "Message or image is required." };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: payload.recipient,
        message: payload.message,
        ...(payload.media_path ? { media_path: payload.media_path } : {}),
        ...(payload.media_base64
          ? {
              media_base64: payload.media_base64,
              ...(payload.media_filename ? { media_filename: payload.media_filename } : {}),
            }
          : {}),
      }),
    });

    const data = (await response.json().catch(() => ({}))) as Partial<WhatsAppBridgeSendResponse>;

    if (response.ok && data.success) {
      return {
        success: true,
        message: data.message || "Message sent successfully.",
      };
    }

    const err = data.message || response.statusText || "Request failed";
    return {
      success: false,
      message: `Failed (${response.status}): ${err}`,
    };
  } catch (error) {
    const isNetwork =
      error instanceof TypeError &&
      (error.message.includes("fetch") || error.message.includes("Failed to fetch"));

    return {
      success: false,
      message: isNetwork
        ? "Cannot reach the local bridge. Run `go run main.go` in whatsapp-mcp/whatsapp-bridge (CORS enabled on :8080)."
        : error instanceof Error
          ? error.message
          : "Request failed",
    };
  }
}
