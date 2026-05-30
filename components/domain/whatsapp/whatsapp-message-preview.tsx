"use client";

type WhatsAppMessagePreviewProps = {
  contactName: string;
  message: string;
  imageSrc?: string | null;
  imageAlt?: string;
  timeLabel?: string;
};

function contactInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
}

/** WhatsApp dark-theme chat wallpaper (simplified doodle pattern). */
const CHAT_WALLPAPER = `url("data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="412" height="412" viewBox="0 0 412 412">
  <rect width="412" height="412" fill="#0b141a"/>
  <g fill="none" stroke="#1f2c34" stroke-width="1.2" opacity="0.45">
    <circle cx="48" cy="52" r="14"/><rect x="120" y="36" width="22" height="22" rx="4"/>
    <path d="M220 48h18v18h-18z"/><circle cx="320" cy="64" r="10"/>
    <path d="M36 160c0-8 6-14 14-14s14 6 14 14-6 14-14 14-14-6-14-14z"/>
    <rect x="148" y="140" width="28" height="18" rx="9"/><circle cx="268" cy="156" r="12"/>
    <path d="M352 148l10 10-10 10-10-10z"/><circle cx="72" cy="268" r="11"/>
    <rect x="168" y="252" width="24" height="24" rx="5"/><circle cx="300" cy="280" r="9"/>
    <path d="M40 360h20v12H40z"/><circle cx="200" cy="340" r="13"/><rect x="328" y="328" width="20" height="20" rx="3"/>
  </g>
</svg>
`)}")`;

function IconBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15.5 5.5 9 12l6.5 6.5"
        stroke="#aebac1"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconVideo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#aebac1" aria-hidden>
      <path d="M4 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm14 3.5 5-3v11l-5-3v-5z" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#aebac1" aria-hidden>
      <path d="M6.6 10.8a15.9 15.9 0 0 0 6.6 6.6l2.2-2.2c.3-.3.8-.4 1.2-.2 1.3.5 2.7.8 4.1.8.7 0 1.2.5 1.2 1.2V21c0 .7-.5 1.2-1.2 1.2C10.9 22.2 1.8 13.1 1.8 2.2 1.8 1.5 2.3 1 3 1h3.5c.7 0 1.2.5 1.2 1.2 0 1.4.3 2.8.8 4.1.1.4 0 .9-.3 1.2L6.6 10.8z" />
    </svg>
  );
}

function IconReadTicks() {
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" aria-hidden className="shrink-0">
      <path
        fill="#53bdeb"
        d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.405-2.272a.463.463 0 0 0-.336-.146.47.47 0 0 0-.344.15.454.454 0 0 0-.001.64l2.75 2.6a.46.46 0 0 0 .347.133.48.48 0 0 0 .35-.15l6.518-8.043a.447.447 0 0 0 .024-.629zm3.086 0-6.518 8.043a.46.46 0 0 1-.35.15.48.48 0 0 1-.347-.133l-2.75-2.6a.454.454 0 0 1 0-.64.47.47 0 0 1 .344-.15.463.463 0 0 1 .336.146l2.405 2.272 6.19-7.636a.493.493 0 0 1 .381-.178.457.457 0 0 1 .304.102.447.447 0 0 1 .024.629z"
      />
    </svg>
  );
}

function BubbleTail() {
  return (
    <svg
      className="absolute -right-[7px] bottom-0 h-[13px] w-[8px]"
      viewBox="0 0 8 13"
      aria-hidden
    >
      <path
        fill="#005c4b"
        d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z"
      />
    </svg>
  );
}

function OutgoingBubble({
  message,
  imageSrc,
  imageAlt,
  timeLabel,
}: {
  message: string;
  imageSrc?: string | null;
  imageAlt: string;
  timeLabel: string;
}) {
  const hasImage = Boolean(imageSrc);
  const hasText = Boolean(message.trim());

  if (!hasImage && !hasText) return null;

  const meta = (
    <span className="inline-flex items-center gap-0.5 align-bottom">
      <span className="text-[11px] leading-none text-[#ffffff99]">{timeLabel}</span>
      <IconReadTicks />
    </span>
  );

  if (hasImage && !hasText) {
    return (
      <div className="relative max-w-[85%]">
        <div className="relative overflow-hidden rounded-lg rounded-br-none bg-[#005c4b] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageSrc!} alt={imageAlt} className="block max-h-44 w-full min-w-[200px] object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-2 pb-1.5 pt-6">
            <div className="flex justify-end">{meta}</div>
          </div>
        </div>
        <BubbleTail />
      </div>
    );
  }

  if (hasImage && hasText) {
    return (
      <div className="relative max-w-[85%]">
        <div className="overflow-hidden rounded-lg rounded-br-none bg-[#005c4b] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageSrc!} alt={imageAlt} className="block max-h-40 w-full min-w-[200px] object-cover" />
          <div className="px-[7px] pb-[4px] pt-[3px]">
            <p className="whitespace-pre-wrap break-words text-[14.2px] leading-[19px] text-[#e9edef]">
              {message}
            </p>
            <div className="-mt-0.5 flex justify-end">{meta}</div>
          </div>
        </div>
        <BubbleTail />
      </div>
    );
  }

  return (
    <div className="relative max-w-[85%]">
      <div className="rounded-lg rounded-br-none bg-[#005c4b] px-[7px] py-[6px] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]">
        <p className="whitespace-pre-wrap break-words text-[14.2px] leading-[19px] text-[#e9edef]">
          {message}
        </p>
        <div className="-mt-0.5 flex justify-end">{meta}</div>
      </div>
      <BubbleTail />
    </div>
  );
}

/** Phone mockup with WhatsApp dark-theme chat UI. */
export function WhatsAppMessagePreview({
  contactName,
  message,
  imageSrc,
  imageAlt = "Attachment",
  timeLabel = "12:45 PM",
}: WhatsAppMessagePreviewProps) {
  const hasContent = Boolean(message.trim() || imageSrc);
  const initials = contactInitials(contactName);

  return (
    <div
      className="mx-auto w-full max-w-[320px] select-none"
      aria-label="WhatsApp message preview"
    >
      <div className="overflow-hidden rounded-[2rem] border-[3px] border-[#0a0a0a] bg-[#0b141a] shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
        {/* Status bar */}
        <div className="flex items-center justify-between bg-[#1f2c34] px-5 pb-0.5 pt-2 text-[10px] font-medium text-[#e9edef]">
          <span>9:41</span>
          <div className="flex items-center gap-1" aria-hidden>
            <span className="h-2 w-3 rounded-sm border border-[#e9edef]/80" />
            <span className="h-2.5 w-2.5 rounded-full border border-[#e9edef]/80" />
            <span className="h-2.5 w-4 rounded-[2px] bg-[#e9edef]/90" />
          </div>
        </div>

        {/* Chat header */}
        <header className="flex items-center gap-1 bg-[#1f2c34] px-1 pb-2 pt-0.5">
          <button type="button" className="p-2" tabIndex={-1} aria-hidden>
            <IconBack />
          </button>
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#6b7c85] text-[11px] font-semibold text-white"
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1 px-1">
            <p className="truncate text-[16px] font-normal leading-tight text-[#e9edef]">
              {contactName}
            </p>
            <p className="text-[12px] leading-tight text-[#8696a0]">online</p>
          </div>
          <div className="flex items-center gap-3 pr-3 text-[#aebac1]" aria-hidden>
            <IconVideo />
            <IconPhone />
          </div>
        </header>

        {/* Messages */}
        <div
          className="relative flex min-h-[340px] flex-col px-3 pb-2 pt-3"
          style={{
            backgroundColor: "#0b141a",
            backgroundImage: CHAT_WALLPAPER,
            backgroundSize: "412px 412px",
          }}
        >
          <div className="mb-3 flex justify-center">
            <span className="rounded-lg bg-[#182229] px-3 py-1 text-[11.5px] font-medium text-[#8696a0] shadow-sm">
              Today
            </span>
          </div>

          <div className="mt-auto flex flex-col items-end gap-1">
            {hasContent ? (
              <OutgoingBubble
                message={message}
                imageSrc={imageSrc}
                imageAlt={imageAlt}
                timeLabel={timeLabel}
              />
            ) : (
              <p className="w-full py-8 text-center text-[12px] text-[#8696a0]">
                Your message will appear here
              </p>
            )}
          </div>
        </div>

        {/* Input bar */}
        <footer className="flex items-center gap-2 bg-[#1f2c34] px-2 py-2">
          <span className="p-1.5 text-lg leading-none text-[#8696a0]" aria-hidden>
            ☺
          </span>
          <div className="flex min-h-[36px] flex-1 items-center rounded-full bg-[#2a3942] px-4">
            <span className="text-[15px] text-[#8696a0]">Message</span>
          </div>
          <span className="p-1.5 text-[#8696a0]" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0-10C6.48 4 2 8.48 2 14s4.48 10 10 10 10-4.48 10-10S17.52 4 12 4zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
            </svg>
          </span>
          <span className="flex size-9 items-center justify-center rounded-full bg-[#00a884] text-white" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v5c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V20h2v-2.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </span>
        </footer>
      </div>
    </div>
  );
}
