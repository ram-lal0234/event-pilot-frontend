"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { z } from "zod";
import { CheckCircle2, ChevronLeft, ChevronRight, Download, FileText, FileUp, Plus, RefreshCw, Upload, XCircle } from "lucide-react";
import { PageHeader } from "@/components/domain/page-header";
import { GuestTable } from "@/components/domain/guests/guest-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
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
import { api, type GuestCategory, type GuestRecord, type PaginationMeta } from "@/lib/api";
import { useApp } from "@/components/providers/app-provider";

const sampleCsv = `name,phone,email,category,group_size,pickup_location
Rahul Sharma,9876543210,rahul@email.com,VIP,3,Delhi Airport
Meera Patel,9876543211,meera@email.com,GENERAL,1,Mumbai Airport T2`;

const csvHeaders = ["name", "phone", "email", "category", "group_size", "pickup_location"] as const;

const csvGuestSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
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

const emptyGuest = {
  name: "",
  phone: "",
  email: "",
  category: "GENERAL" as GuestCategory,
  groupSize: 1,
  pickupLocation: "",
  pickupLat: "",
  pickupLng: "",
};

export default function GuestsPage() {
  const { token, currentEventId, currentEvent, eventsLoaded, eventsLoading } = useApp();
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [guestForm, setGuestForm] = useState(emptyGuest);
  const [csv, setCsv] = useState("name,phone,email,category,group_size,pickup_location\n");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [guestsLoaded, setGuestsLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });

  const loadGuests = useCallback(async () => {
    if (!currentEventId) {
      setGuestsLoaded(false);
      return;
    }
    try {
      setGuestsLoaded(false);
      const result = await api.listGuestsPage(token, currentEventId, { page, pageSize });
      if (page > result.pagination.totalPages && result.pagination.totalPages > 0) {
        setPage(result.pagination.totalPages);
        return;
      }
      setGuests(result.items);
      setPagination(result.pagination);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load guests");
    } finally {
      setGuestsLoaded(true);
    }
  }, [currentEventId, page, pageSize, token]);

  useEffect(() => {
    void Promise.resolve().then(loadGuests);
  }, [loadGuests]);

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
    setMessage("");
    try {
      await api.createGuest(token, {
        eventId: currentEventId,
        name: guestForm.name,
        phone: guestForm.phone,
        email: guestForm.email || undefined,
        category: guestForm.category,
        groupSize: Number(guestForm.groupSize),
        pickupLocation: guestForm.pickupLocation || undefined,
        pickupLat: guestForm.pickupLat ? Number(guestForm.pickupLat) : undefined,
        pickupLng: guestForm.pickupLng ? Number(guestForm.pickupLng) : undefined,
      });
      setGuestForm(emptyGuest);
      setMessage("Guest created");
      await loadGuests();
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Could not create guest";
    } finally {
      setBusy(false);
    }
  };

  const uploadCsv = async (csvToImport: string) => {
    setBusy(true);
    setMessage("");
    try {
      const result = await api.uploadGuestCsv(token, currentEventId, csvToImport);
      setMessage(`${result.inserted} guests imported`);
      await loadGuests();
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Could not upload CSV";
    } finally {
      setBusy(false);
    }
  };

  const exportGuests = async () => {
    setBusy(true);
    setError("");
    try {
      const allGuests = await api.listGuests(token, currentEventId);
      const csvExport = buildGuestExportCsv(allGuests);
      const safeEventName = (currentEvent?.name || "event")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      downloadCsv(csvExport, `${safeEventName || "event"}-guests.csv`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not export guests");
    } finally {
      setBusy(false);
    }
  };

  const triggerIvr = async (guestId: string) => {
    try {
      await api.triggerIvr(token, guestId);
      setMessage("IVR job queued");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not queue IVR");
    }
  };

  return loading ? (
    <GuestsSkeleton />
  ) : (
    <div>
      <PageHeader
        breadcrumb={`EVENTS / ${currentEvent?.name || "SELECTED EVENT"}`}
        title="Guest Management"
        actions={
          <>
            <Button variant="outline" type="button" className="gap-2" onClick={loadGuests}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button variant="outline" type="button" className="gap-2" onClick={exportGuests} disabled={!pagination.total || busy}>
              <Download className="size-4" />
              Export
            </Button>
            <CsvSheet csv={csv} setCsv={setCsv} uploadCsv={uploadCsv} busy={busy} />
            <GuestSheet
              form={guestForm}
              setForm={setGuestForm}
              onSubmit={addGuest}
              busy={busy}
            />
          </>
        }
      />
      {message && <p className="mb-3 rounded-md bg-status-success-bg p-3 text-sm text-status-success">{message}</p>}
      {error && <p className="mb-3 rounded-md bg-status-error-bg p-3 text-sm text-status-error">{error}</p>}
      <GuestTable guests={guests} onTriggerIvr={triggerIvr} />
      <GuestFooter
        stats={stats}
        page={currentPage}
        pageSize={pagination.pageSize}
        totalPages={pagination.totalPages}
        totalItems={pagination.total}
        onPageChange={setPage}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
        }}
      />
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
  form: typeof emptyGuest;
  setForm: (form: typeof emptyGuest) => void;
  onSubmit: (event: FormEvent) => Promise<string | null>;
  busy: boolean;
}) {
  const [sheetError, setSheetError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    setSheetError("");
    const errorMessage = await onSubmit(event);
    setSheetError(errorMessage || "");
  };

  return (
    <Sheet>
      <SheetTrigger
        render={<Button className="gap-2" type="button" />}
      >
        <Plus className="size-4" />
        Add Guest
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <form className="flex h-full flex-col" onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Add Guest</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 px-4">
            {sheetError && (
              <p className="rounded-md bg-status-error-bg p-3 text-sm text-status-error">
                {sheetError}
              </p>
            )}
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Name" required />
            <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Phone" required />
            <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email" />
            <Select
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value as GuestCategory })}
            >
              <option value="GENERAL">General</option>
              <option value="FAMILY">Family</option>
              <option value="VIP">VIP</option>
            </Select>
            <Input type="number" min={1} value={form.groupSize} onChange={(event) => setForm({ ...form, groupSize: Number(event.target.value) })} placeholder="Group size" />
            <Input value={form.pickupLocation} onChange={(event) => setForm({ ...form, pickupLocation: event.target.value })} placeholder="Pickup location" />
            <div className="grid grid-cols-2 gap-2">
              <Input value={form.pickupLat} onChange={(event) => setForm({ ...form, pickupLat: event.target.value })} placeholder="Lat" />
              <Input value={form.pickupLng} onChange={(event) => setForm({ ...form, pickupLng: event.target.value })} placeholder="Lng" />
            </div>
          </div>
          <SheetFooter>
            <Button type="submit" disabled={busy}>Create Guest</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function CsvSheet({
  csv,
  setCsv,
  uploadCsv,
  busy,
}: {
  csv: string;
  setCsv: (csv: string) => void;
  uploadCsv: (csvToImport: string) => Promise<string | null>;
  busy: boolean;
}) {
  const [pasteMode, setPasteMode] = useState(false);
  const [fileName, setFileName] = useState("");
  const [sheetError, setSheetError] = useState("");
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
    setSheetError("");
    const errorMessage = await uploadCsv(buildGuestCsv(validRows.map((row) => row.data as CsvGuestRow)));
    setSheetError(errorMessage || "");
  };

  return (
    <Sheet>
      <SheetTrigger
        render={<Button variant="outline" className="gap-2" type="button" />}
      >
        <FileUp className="size-4" />
        CSV
      </SheetTrigger>
      <SheetContent className="w-[min(100vw,44rem)] max-w-none sm:max-w-none">
        <SheetHeader>
          <SheetTitle>Upload Guest CSV</SheetTitle>
        </SheetHeader>

        <div className="min-w-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-4 pb-4">
          {sheetError && (
            <p className="rounded-md bg-status-error-bg p-3 text-sm text-status-error">
              {sheetError}
            </p>
          )}

          <div className="grid min-w-0 gap-3 rounded-lg border border-dashed border-border bg-surface-container-low p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Upload File</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Required: name and phone. Category defaults to GENERAL, group size defaults to 1.
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
        </div>
        <SheetFooter className="border-t border-border bg-popover">
          <Button className="w-full" type="button" onClick={importValidRows} disabled={busy || !canImport}>
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
    <div className="mt-4 flex flex-col items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 sm:flex-row">
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
            className="w-20"
            value={String(pageSize)}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
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
