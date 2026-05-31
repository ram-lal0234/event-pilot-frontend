"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { z } from "zod";
import { CheckCircle2, ChevronLeft, ChevronRight, Download, FileText, FileUp, Plus, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  GuestListHeaderActions,
  GuestListSecondaryActions,
} from "@/components/domain/guests/guest-list-toolbar";
import { OutreachStartBanner } from "@/components/domain/outreach/outreach-start-banner";
import { GuestTable } from "@/components/domain/guests/guest-table";
import { GuestFormFields } from "@/components/domain/guests/guest-form-fields";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { useDataTableQuery } from "@/hooks/use-data-table-query";
import type { DataTableFilterConfig } from "@/lib/data-table/types";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError, api, type GuestRecord, type PaginationMeta } from "@/lib/api";
import {
  buildTemplateContext,
  buildWhatsAppWebUrl,
  loadWhatsAppInviteSettings,
  phoneToWhatsAppRecipient,
  renderWhatsAppMessage,
} from "@/lib/whatsapp-invite";
import {
  buildGuestCreatePayload,
  buildGuestUpdatePayload,
  emptyGuestForm,
  type GuestFormState,
} from "@/lib/guest-form";
import { buildGuestOpsPayload, type GuestOpsFormState } from "@/components/domain/guests/guest-ops-fields";
import { normalizePhoneInput } from "@/lib/phone";
import { useApp } from "@/components/providers/app-provider";
import { useRealtimeBus } from "@/components/providers/realtime-provider";
import { useEventAccess } from "@/hooks/use-event-access";
import { mergeGuestFromRealtime } from "@/lib/realtime/types";
import { getApiErrorMessage } from "@/lib/api-error";
import { getVoiceCallErrorMessage } from "@/lib/voice-messages";
import { scopedEventHref } from "@/lib/design-tokens";
import { resolvePublicRsvpUrl } from "@/lib/public-rsvp-url";

const sampleCsv = `name,phone,email,category,group_size,pickup_location
Rahul Sharma,9876543210,rahul@email.com,VIP,3,Delhi Airport
Meera Patel,9876543211,meera@email.com,GENERAL,1,Mumbai Airport T2`;

const csvHeaders = ["name", "phone", "email", "category", "group_size", "pickup_location"] as const;
const rsvpFilterOptions = [
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Declined", value: "DECLINED" },
] as const;
const categoryFilterOptions = [
  { label: "VIP", value: "VIP" },
  { label: "Family", value: "FAMILY" },
  { label: "General", value: "GENERAL" },
] as const;
const followUpFilterOptions = [
  { label: "Needs follow-up", value: "NEEDS_FOLLOW_UP" },
  { label: "Callback later", value: "CALLBACK_LATER" },
  { label: "No answer", value: "NO_ANSWER" },
  { label: "Voicemail", value: "VOICEMAIL" },
] as const;

const csvGuestSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .transform((value) => {
      const result = normalizePhoneInput("IN", value);
      if ("error" in result) {
        throw new Error(result.error);
      }
      return result.e164;
    }),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  category: z.enum(["VIP", "FAMILY", "GENERAL"]).default("GENERAL"),
  group_size: z.coerce.number().int().min(1, "Minimum group size is 1").max(20, "Maximum group size is 20").default(1),
  pickup_location: z.string().trim().optional().default(""),
});

type CsvGuestRow = z.infer<typeof csvGuestSchema>;
type CsvPreviewRow = {
  rowNumber: number;
  row: Partial<Record<(typeof csvHeaders)[number], string>>;
  valid: boolean;
  errors: string[];
  data?: CsvGuestRow;
};

const guestTableQueryFields = [
  { type: "search" as const, key: "q" },
  { type: "filter" as const, key: "rsvpStatus", id: "rsvpStatus", label: "Status" },
  { type: "filter" as const, key: "category", id: "category", label: "Category" },
  { type: "filter" as const, key: "followUpStatus", id: "followUpStatus", label: "Follow-up" },
  { type: "filter" as const, key: "needsCab", id: "needsCab", label: "Needs cab" },
  { type: "filter" as const, key: "needsHotel", id: "needsHotel", label: "Needs hotel" },
  { type: "page" as const, defaultValue: 1 },
  { type: "pageSize" as const, defaultValue: 10 },
];

export default function GuestsPage() {
  const { token, currentEventId, currentEvent, eventsLoaded, eventsLoading } = useApp();
  const { subscribe: subscribeRealtime } = useRealtimeBus();
  const { canWrite, canTriggerVoice } = useEventAccess();
  const {
    search,
    setSearch,
    filters,
    setFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    resetFilters,
    isFiltered,
  } = useDataTableQuery(guestTableQueryFields);
  const selectedRsvpStatuses = filters.rsvpStatus ?? [];
  const rsvpTab =
    selectedRsvpStatuses.length === 1 ? selectedRsvpStatuses[0] : "all";
  const selectedCategories = filters.category ?? [];
  const selectedFollowUpStatuses = filters.followUpStatus ?? [];
  const selectedNeedsCab = filters.needsCab?.[0];
  const selectedNeedsHotel = filters.needsHotel?.[0];
  const rsvpFilter = selectedRsvpStatuses.join(",");
  const categoryFilter = selectedCategories.join(",");
  const followUpFilter = selectedFollowUpStatuses.join(",");
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [guestForm, setGuestForm] = useState(emptyGuestForm);
  const [csv, setCsv] = useState("name,phone,email,category,group_size,pickup_location\n");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [guestsLoaded, setGuestsLoaded] = useState(false);
  const [pendingRsvpTotal, setPendingRsvpTotal] = useState(0);
  const [eventMetrics, setEventMetrics] = useState({
    confirmed: 0,
    declined: 0,
    pendingRsvp: 0,
  });
  const fetchGenerationRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });

  const tableFilters: DataTableFilterConfig[] = [
    {
      id: "rsvpStatus",
      label: "Status",
      options: rsvpFilterOptions,
      selected: selectedRsvpStatuses,
      onChange: (values) => setFilter("rsvpStatus", values),
    },
    {
      id: "category",
      label: "Category",
      options: categoryFilterOptions,
      selected: selectedCategories,
      onChange: (values) => setFilter("category", values),
    },
    {
      id: "followUpStatus",
      label: "Follow-up",
      options: followUpFilterOptions,
      selected: selectedFollowUpStatuses,
      onChange: (values) => setFilter("followUpStatus", values),
    },
    {
      id: "needsCab",
      label: "Needs cab",
      options: [
        { label: "Yes", value: "true" },
        { label: "No", value: "false" },
      ],
      selected: selectedNeedsCab ? [selectedNeedsCab] : [],
      onChange: (values) => setFilter("needsCab", values.slice(-1)),
    },
    {
      id: "needsHotel",
      label: "Needs hotel",
      options: [
        { label: "Yes", value: "true" },
        { label: "No", value: "false" },
      ],
      selected: selectedNeedsHotel ? [selectedNeedsHotel] : [],
      onChange: (values) => setFilter("needsHotel", values.slice(-1)),
    },
  ];

  const handleRsvpTabChange = (value: string) => {
    if (value === "all") {
      setFilter("rsvpStatus", []);
      return;
    }
    setFilter("rsvpStatus", [value]);
  };

  const loadGuests = useCallback(async () => {
    if (!currentEventId) {
      hasLoadedOnceRef.current = false;
      setGuestsLoaded(false);
      return;
    }

    const generation = ++fetchGenerationRef.current;
    const showFullSkeleton = !hasLoadedOnceRef.current;

    if (showFullSkeleton) {
      setGuestsLoaded(false);
    }

    try {
      const result = await api.listGuestsPage(token, currentEventId, {
        page,
        pageSize,
        q: search,
        rsvpStatus: rsvpFilter,
        category: categoryFilter,
        followUpStatus: followUpFilter,
        needsCab: selectedNeedsCab,
        needsHotel: selectedNeedsHotel,
      });

      if (generation !== fetchGenerationRef.current) {
        return;
      }

      if (page > result.pagination.totalPages && result.pagination.totalPages > 0) {
        setPage(result.pagination.totalPages);
      } else {
        setGuests(result.items);
        setPagination(result.pagination);
        hasLoadedOnceRef.current = true;
      }
    } catch (err) {
      if (generation === fetchGenerationRef.current) {
        toast.error("We couldn't load guests right now.");
      }
    } finally {
      if (generation === fetchGenerationRef.current) {
        setGuestsLoaded(true);
      }
    }
  }, [
    categoryFilter,
    currentEventId,
    followUpFilter,
    page,
    pageSize,
    rsvpFilter,
    search,
    selectedNeedsCab,
    selectedNeedsHotel,
    setPage,
    token,
  ]);

  useEffect(() => {
    hasLoadedOnceRef.current = false;
    fetchGenerationRef.current += 1;
  }, [currentEventId]);

  useEffect(() => {
    void Promise.resolve().then(loadGuests);
  }, [loadGuests]);

  useEffect(() => {
    if (!currentEventId) {
      setPendingRsvpTotal(0);
      return;
    }

    void api
      .dashboardSummary(token, currentEventId)
      .then((result) => {
        setPendingRsvpTotal(result.pendingRsvp ?? 0);
        setEventMetrics({
          pendingRsvp: result.pendingRsvp ?? 0,
          confirmed: result.confirmed ?? 0,
          declined: result.declined ?? 0,
        });
      })
      .catch(() => {
        setPendingRsvpTotal(0);
        setEventMetrics({ pendingRsvp: 0, confirmed: 0, declined: 0 });
      });
  }, [currentEventId, token]);

  useEffect(() => {
    return subscribeRealtime((message) => {
      if (!message.guest?.id || message.eventId !== currentEventId) {
        return;
      }

      const guestTypes = new Set([
        "guest_added",
        "guest_updated",
        "rsvp_updated",
        "checkin",
        "call_started",
        "call_answered",
        "call_completed",
      ]);

      if (!guestTypes.has(message.type)) {
        return;
      }

      setGuests((current) => {
        const index = current.findIndex((row) => row.id === message.guest!.id);
        if (index === -1) {
          if (message.type === "guest_added") {
            return [message.guest as GuestRecord, ...current];
          }
          return current;
        }

        const next = [...current];
        next[index] = mergeGuestFromRealtime(current[index], message.guest!);
        return next;
      });
    });
  }, [currentEventId, subscribeRealtime]);

  const stats = useMemo(
    () => ({
      total: pagination.total,
      checkedIn: guests.filter((guest) => guest.checkins?.length).length,
      pending: guests.filter((guest) => guest.rsvpStatus === "PENDING").length,
    }),
    [guests, pagination.total]
  );
  const loading = !eventsLoaded || eventsLoading || !guestsLoaded;
  const currentPage = pagination.page;

  const addGuest = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = buildGuestCreatePayload(guestForm, currentEventId);
      const created = await api.createGuest(token, payload);
      setGuestForm(emptyGuestForm());

      const rsvpUrl = resolvePublicRsvpUrl(created.publicRsvpUrl, created.inviteCode);
      if (rsvpUrl) {
        try {
          await navigator.clipboard.writeText(rsvpUrl);
        } catch {
          // Clipboard may be blocked on some mobile browsers.
        }
      }

      const openWhatsApp = () => {
        if (!currentEventId || !currentEvent) return;
        try {
          const settings = loadWhatsAppInviteSettings(currentEventId);
          const context = buildTemplateContext(
            created,
            currentEvent,
            rsvpUrl || "",
          );
          const message = renderWhatsAppMessage(settings.messageTemplate, context, {
            includeRsvpLink: settings.includeRsvpLink,
          });
          const recipient = phoneToWhatsAppRecipient(created.phone);
          if (!recipient) {
            toast.error("Guest phone is not valid for WhatsApp");
            return;
          }
          window.open(buildWhatsAppWebUrl(recipient, message), "_blank", "noopener,noreferrer");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Could not open WhatsApp");
        }
      };

      toast.success(rsvpUrl ? "Guest created — RSVP link copied" : "Guest created", {
        action:
          currentEvent && created.phone
            ? { label: "Open WhatsApp", onClick: openWhatsApp }
            : undefined,
      });

      await loadGuests();
      return null;
    } catch (err) {
      return getApiErrorMessage(err, "We couldn't create this guest. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const updateGuest = async (guestId: string, form: GuestFormState, ops: GuestOpsFormState) => {
    try {
      const payload = { ...buildGuestUpdatePayload(form), ...buildGuestOpsPayload(ops) };
      await api.updateGuest(token, guestId, payload);
      await loadGuests();
      return null;
    } catch (err) {
      return "We couldn't save guest details. Please try again.";
    }
  };

  const uploadCsv = async (csvToImport: string) => {
    setBusy(true);
    try {
      const result = await api.uploadGuestCsv(token, currentEventId, csvToImport);
      if (result.inserted > 0) {
        toast.success(
          result.skipped?.length
            ? `${result.inserted} guest${result.inserted === 1 ? "" : "s"} imported (${result.skipped.length} skipped)`
            : `${result.inserted} guest${result.inserted === 1 ? "" : "s"} imported`,
        );
      }
      await loadGuests();

      if (currentEvent?.setting?.outreachEnabled && !currentEvent?.setting?.outreachAutoStart) {
        toast.message("Use Send invites when you're ready to message guests on WhatsApp.");
      }

      return result.skipped?.length ? { skipped: result.skipped } : null;
    } catch (err) {
      return { error: getApiErrorMessage(err, "We couldn't import this file. Please check it and try again.") };
    } finally {
      setBusy(false);
    }
  };

  const exportGuests = async () => {
    setBusy(true);
    try {
      const allGuests = await api.listGuests(token, currentEventId);
      const csvExport = buildGuestExportCsv(allGuests);
      const safeEventName = (currentEvent?.name || "event")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      downloadCsv(csvExport, `${safeEventName || "event"}-guests.csv`);
      toast.success("Guest export downloaded");
    } catch (err) {
      toast.error("We couldn't export guests right now.");
    } finally {
      setBusy(false);
    }
  };

  const triggerVoiceCall = async (guestId: string, callMode: "ai" | "ivr") => {
    try {
      await api.triggerVoiceCall(token, guestId, callMode);
      return null;
    } catch (err) {
      return getVoiceCallErrorMessage(err);
    }
  };

  const updateGuestRsvp = async (guestId: string, payload: { rsvpStatus: GuestRecord["rsvpStatus"]; groupSize: number }) => {
    try {
      await api.updateGuestRsvp(token, guestId, payload);
      await loadGuests();
      return null;
    } catch (err) {
      return "We couldn't update RSVP right now.";
    }
  };

  const refreshGuestList = async () => {
    setRefreshing(true);
    try {
      await loadGuests();
      toast.success("Guest list refreshed");
    } finally {
      setRefreshing(false);
    }
  };

  return loading ? (
    <GuestsSkeleton />
  ) : (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-bold text-foreground">Guests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {currentEvent?.name || "Your event"}
          {pagination.total > 0 ? (
            <>
              {" · "}
              {pagination.total} guest{pagination.total === 1 ? "" : "s"}
              {" · "}
              {eventMetrics.pendingRsvp} pending RSVP
              {" · "}
              {eventMetrics.confirmed} confirmed
            </>
          ) : (
            " — manage your guest list"
          )}
        </p>
      </div>

      {currentEventId &&
      canWrite &&
      currentEvent?.setting?.outreachEnabled &&
      !currentEvent?.setting?.outreachAutoStart ? (
        <OutreachStartBanner
          eventId={currentEventId}
          guestCount={pagination.total}
          onStarted={() => void refreshGuestList()}
        />
      ) : null}

      <DataTableShell
        tabs={{
          value: rsvpTab,
          onValueChange: handleRsvpTabChange,
          items: [
            { value: "all", label: "All guests" },
            { value: "PENDING", label: "Pending RSVP", badge: stats.pending },
            { value: "CONFIRMED", label: "Confirmed" },
            { value: "DECLINED", label: "Declined" },
          ],
        }}
        headerActions={
          <GuestListHeaderActions
            currentEventId={currentEventId}
            token={token}
            pendingRsvpTotal={pendingRsvpTotal}
            canTriggerVoice={canTriggerVoice}
            canWrite={canWrite}
            refreshing={refreshing}
            onRefresh={() => void refreshGuestList()}
            onCallAllQueued={() => {
              void loadGuests();
              void api
                .dashboardSummary(token, currentEventId)
                .then((result) => {
                  setPendingRsvpTotal(result.pendingRsvp ?? 0);
                  setEventMetrics({
                    pendingRsvp: result.pendingRsvp ?? 0,
                    confirmed: result.confirmed ?? 0,
                    declined: result.declined ?? 0,
                  });
                })
                .catch(() => undefined);
            }}
            importControl={
              <CsvSheet csv={csv} setCsv={setCsv} uploadCsv={uploadCsv} busy={busy} />
            }
            createControl={
              <GuestSheet
                form={guestForm}
                setForm={setGuestForm}
                onSubmit={addGuest}
                busy={busy}
              />
            }
          />
        }
        toolbar={
          <DataTableToolbar
            search={{
              value: search,
              onChange: setSearch,
              placeholder: "Search by name...",
              "aria-label": "Search guests",
            }}
            filters={tableFilters}
            isFiltered={isFiltered}
            onReset={resetFilters}
            actions={
              <GuestListSecondaryActions
                currentEventId={currentEventId}
                exportDisabled={!pagination.total}
                exportBusy={busy}
                onExport={() => void exportGuests()}
              />
            }
          />
        }
      >
        <GuestTable
          guests={guests}
          onTriggerVoiceCall={triggerVoiceCall}
          onUpdateRsvp={updateGuestRsvp}
          onUpdateGuest={updateGuest}
        />
        <GuestFooter
          stats={stats}
          page={currentPage}
          pageSize={pagination.pageSize}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </DataTableShell>
    </div>
  );
}

function GuestsSkeleton() {
  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-3">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-8 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card">
        <div className="grid grid-cols-6 gap-4 border-b border-border p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="grid grid-cols-6 gap-4 p-4">
              {Array.from({ length: 6 }).map((__, cellIndex) => (
                <Skeleton key={cellIndex} className="h-8 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="mt-4 h-14 w-full rounded-lg" />
    </div>
  );
}

function GuestSheet({
  form,
  setForm,
  onSubmit,
  busy,
}: {
  form: GuestFormState;
  setForm: (form: GuestFormState) => void;
  onSubmit: (event: FormEvent) => Promise<string | null>;
  busy: boolean;
}) {
  const handleSubmit = async (event: FormEvent) => {
    const errorMessage = await onSubmit(event);
    if (errorMessage) toast.error(errorMessage);
  };

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            className="h-9 shrink-0 gap-2 whitespace-nowrap rounded-md bg-foreground px-4 text-background hover:bg-foreground/90"
            type="button"
          />
        }
      >
        <Plus className="size-4" />
        Create Guest
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Add Guest</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <GuestFormFields form={form} onChange={setForm} />
          </SheetBody>
          <SheetFooter>
            <Button type="submit" loading={busy} loadingText="Creating guest">Create Guest</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

type CsvImportSkipped = {
  row: number;
  phone: string;
  name: string;
  reason: string;
};

function CsvSheet({
  csv,
  setCsv,
  uploadCsv,
  busy,
  iconOnly = false,
}: {
  csv: string;
  setCsv: (csv: string) => void;
  uploadCsv: (
    csvToImport: string,
  ) => Promise<{ skipped?: CsvImportSkipped[]; error?: string } | null>;
  busy: boolean;
  iconOnly?: boolean;
}) {
  const [pasteMode, setPasteMode] = useState(false);
  const [fileName, setFileName] = useState("");
  const [importSkipped, setImportSkipped] = useState<CsvImportSkipped[]>([]);
  const preview = useMemo(() => parseGuestCsv(csv), [csv]);
  const validRows = preview.filter((row) => row.valid && row.data);
  const invalidRows = preview.length - validRows.length;
  const canImport = validRows.length > 0;

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setCsv(await file.text());
  };

  const downloadTemplate = () => {
    downloadCsv(sampleCsv, "eventpilot-guests-sample.csv");
  };

  const importValidRows = async () => {
    const result = await uploadCsv(buildGuestCsv(validRows.map((row) => row.data as CsvGuestRow)));
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setImportSkipped(result?.skipped ?? []);
  };

  const importTrigger = (
    <SheetTrigger
      id="guest-import-trigger"
      render={
        <Button
          variant="outline"
          type="button"
          className={
            iconOnly
              ? "size-8 shrink-0"
              : "h-9 gap-2 rounded-md bg-card px-4"
          }
          size={iconOnly ? "icon-sm" : "default"}
          aria-label="Import guests"
        />
      }
    >
      <FileUp className="size-4" />
      {iconOnly ? null : "Import Guest"}
    </SheetTrigger>
  );

  return (
    <Sheet>
      {iconOnly ? (
        <Tooltip>
          <TooltipTrigger render={importTrigger} />
          <TooltipContent>Import guests</TooltipContent>
        </Tooltip>
      ) : (
        importTrigger
      )}
      <SheetContent className="flex w-[min(100vw,44rem)] max-w-none flex-col sm:max-w-none">
        <SheetHeader>
          <SheetTitle>Upload Guest CSV</SheetTitle>
        </SheetHeader>

        <SheetBody className="min-w-0 space-y-5 overflow-x-hidden">
          <div className="grid min-w-0 gap-3 rounded-lg border border-dashed border-border bg-surface-container-low p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Upload File</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Required: name and phone (India +91). Category defaults to GENERAL, group size defaults to 1.
              </p>
              {fileName && <p className="mt-2 text-xs font-medium text-primary">{fileName}</p>}
            </div>
            <Button
              className="w-full gap-2 sm:w-auto"
              type="button"
              onClick={() => document.getElementById("guest-csv-file")?.click()}
            >
              <Upload className="size-4" />
              Upload CSV File
            </Button>
            <Input
              id="guest-csv-file"
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={handleFile}
            />
          </div>

          <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
            <Button variant="outline" className="w-full min-w-0 gap-2 whitespace-normal md:whitespace-nowrap" type="button" onClick={downloadTemplate}>
              <Download className="size-4" />
              <span className="truncate">Download Sample CSV</span>
            </Button>
            <span className="text-center text-xs font-semibold uppercase text-muted-foreground">or</span>
            <Button variant="outline" className="w-full min-w-0 gap-2 whitespace-normal md:whitespace-nowrap" type="button" onClick={() => setPasteMode((value) => !value)}>
              <FileText className="size-4" />
              <span className="truncate">{pasteMode ? "Hide Paste CSV" : "Paste CSV manually"}</span>
            </Button>
          </div>

          {pasteMode && (
            <Textarea
              className="min-h-44 font-mono text-sm"
              value={csv}
              onChange={(event) => {
                setFileName("");
                setCsv(event.target.value);
              }}
              placeholder={sampleCsv}
            />
          )}

          <div className="rounded-lg border border-border bg-card">
            <div className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Preview before import</p>
                <p className="text-xs text-muted-foreground">
                  {preview.length
                    ? `${validRows.length} valid, ${invalidRows} will be skipped`
                    : "Upload or paste a CSV to preview rows."}
                </p>
              </div>
              {preview.length > 0 && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 text-status-success">
                    <CheckCircle2 className="size-4" />
                    Valid
                  </span>
                  <span className="inline-flex items-center gap-1 text-status-error">
                    <XCircle className="size-4" />
                    Error
                  </span>
                </div>
              )}
            </div>
            <div className="max-h-72 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.length ? (
                    preview.slice(0, 50).map((row) => (
                      <TableRow key={row.rowNumber}>
                        <TableCell>{row.row.name || "Missing"}</TableCell>
                        <TableCell>{row.row.phone || "Missing"}</TableCell>
                        <TableCell>{row.data?.category || row.row.category || "GENERAL"}</TableCell>
                        <TableCell>
                          {row.valid ? (
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-status-success">
                              <CheckCircle2 className="size-4" />
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex max-w-[18rem] items-center gap-1 text-sm font-medium text-status-error">
                              <XCircle className="size-4 shrink-0" />
                              <span className="truncate" title={row.errors.join(", ")}>
                                {row.errors.join(", ")}
                              </span>
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                        No CSV rows ready for preview.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          {importSkipped.length > 0 ? (
            <div className="rounded-lg border border-status-warning/30 bg-status-warning-bg/40 p-4">
              <p className="text-sm font-semibold text-foreground">
                Not imported ({importSkipped.length})
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                These rows were skipped because the phone number already exists for this event.
              </p>
              <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto text-sm">
                {importSkipped.map((row) => (
                  <li key={`${row.row}-${row.phone}`} className="rounded-md border border-border bg-card px-3 py-2">
                    <span className="font-medium">{row.name || "Unknown"}</span>
                    <span className="text-muted-foreground"> · row {row.row} · {row.phone}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </SheetBody>
        <SheetFooter>
          <Button className="w-full" type="button" onClick={importValidRows} disabled={!canImport} loading={busy} loadingText="Importing guests">
            Import {validRows.length} Guests
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function parseGuestCsv(csvText: string): CsvPreviewRow[] {
  const rows = parseCsvRows(csvText.trim());
  if (rows.length < 2) return [];

  const headers = rows[0].map((header) => normalizeCsvHeader(header));

  return rows.slice(1).flatMap((values, index) => {
    if (values.every((value) => !value.trim())) return [];

    const row = Object.fromEntries(
      headers.map((header, columnIndex) => [header, values[columnIndex]?.trim() || ""])
    ) as Partial<Record<(typeof csvHeaders)[number], string>>;

    const result = csvGuestSchema.safeParse({
      name: row.name,
      phone: row.phone,
      email: row.email || undefined,
      category: (row.category || "GENERAL").toUpperCase(),
      group_size: row.group_size || 1,
      pickup_location: row.pickup_location || "",
    });

    return [{
      rowNumber: index + 2,
      row,
      valid: result.success,
      errors: result.success ? [] : result.error.issues.map((issue) => issue.message),
      data: result.success ? result.data : undefined,
    }];
  });
}

function parseCsvRows(csvText: string) {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const next = csvText[index + 1];

    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field);
  rows.push(row);
  return rows;
}

function normalizeCsvHeader(header: string) {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
}

function escapeCsvValue(value: string | number | undefined) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadCsv(csvContent: string, fileName: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function buildGuestCsv(rows: CsvGuestRow[]) {
  return [
    csvHeaders.join(","),
    ...rows.map((row) =>
      csvHeaders
        .map((header) => escapeCsvValue(row[header]))
        .join(",")
    ),
  ].join("\n");
}

function buildGuestExportCsv(guests: GuestRecord[]) {
  const headers = [
    "name",
    "phone",
    "email",
    "category",
    "group_size",
    "pickup_location",
    "rsvp_status",
    "checkin_status",
    "qr_code",
  ];

  return [
    headers.join(","),
    ...guests.map((guest) =>
      [
        guest.name,
        guest.phone,
        guest.email || "",
        guest.category,
        guest.groupSize,
        guest.pickupLocation || "",
        guest.rsvpStatus,
        guest.checkins?.length ? "CHECKED_IN" : "PENDING",
        guest.qrCode,
      ].map(escapeCsvValue).join(",")
    ),
  ].join("\n");
}

function GuestFooter({
  stats,
  page,
  pageSize,
  totalPages,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: {
  stats: { total: number; checkedIn: number; pending: number };
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const start = totalItems ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-border px-4 py-3 sm:flex-row">
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <span>Total Guests: <strong>{stats.total.toLocaleString()}</strong></span>
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-status-success" />
          Checked-in on page: <strong>{stats.checkedIn}</strong>
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-status-warning" />
          Pending RSVP on page: <strong>{stats.pending}</strong>
        </span>
      </div>
      <div className="flex flex-col items-center gap-3 text-sm sm:flex-row">
        <span className="text-muted-foreground">
          Showing <strong className="text-foreground">{start}-{end}</strong> of{" "}
          <strong className="text-foreground">{totalItems}</strong>
        </span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Rows</span>
          <Select
            value={String(pageSize)}
            onValueChange={(next) => {
              if (next != null) onPageSizeChange(Number(next));
            }}
          >
            <SelectTrigger size="sm" className="w-20 justify-between font-normal">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            type="button"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-16 text-center text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
