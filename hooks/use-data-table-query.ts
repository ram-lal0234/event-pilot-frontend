"use client";

import { useCallback, useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function splitParam(value: string | null) {
  return value?.split(",").map((item) => item.trim()).filter(Boolean) || [];
}

export type DataTableQueryField =
  | { type: "search"; key: string; defaultValue?: string }
  | { type: "filter"; key: string; id: string; label: string }
  | { type: "page"; key?: string; defaultValue?: number }
  | { type: "pageSize"; key?: string; defaultValue?: number };

export function useDataTableQuery(fields: DataTableQueryField[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchParamsKey = searchParams.toString();

  const searchField = useMemo(
    () => fields.find((field) => field.type === "search"),
    [fields],
  );
  const filterFields = useMemo(
    () => fields.filter((field) => field.type === "filter"),
    [fields],
  );
  const pageField = useMemo(
    () => fields.find((field) => field.type === "page"),
    [fields],
  );
  const pageSizeField = useMemo(
    () => fields.find((field) => field.type === "pageSize"),
    [fields],
  );

  const searchKey = searchField?.type === "search" ? searchField.key : "q";
  const pageKey = pageField?.type === "page" ? pageField.key || "page" : "page";
  const pageSizeKey =
    pageSizeField?.type === "pageSize" ? pageSizeField.key || "pageSize" : "pageSize";

  const search = useMemo(
    () => searchParams.get(searchKey) || searchField?.defaultValue || "",
    [searchField?.defaultValue, searchKey, searchParams, searchParamsKey],
  );

  const filters = useMemo(
    () =>
      Object.fromEntries(
        filterFields.map((field) => [field.id, splitParam(searchParams.get(field.key))]),
      ),
    [filterFields, searchParams, searchParamsKey],
  );

  const page = useMemo(
    () => Number(searchParams.get(pageKey) || pageField?.defaultValue || 1),
    [pageField?.defaultValue, pageKey, searchParams, searchParamsKey],
  );

  const pageSize = useMemo(
    () =>
      Number(searchParams.get(pageSizeKey) || pageSizeField?.defaultValue || 10),
    [pageField?.defaultValue, pageSizeKey, searchParams, searchParamsKey],
  );

  const updateQueryParams = useCallback(
    (
      updates: Record<string, string | number | string[] | null>,
      resetPage = true,
    ) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        const normalized = Array.isArray(value) ? value.join(",") : value;
        if (normalized === null || normalized === "" || normalized === undefined) {
          params.delete(key);
        } else {
          params.set(key, String(normalized));
        }
      });

      if (resetPage) {
        params.delete(pageKey);
      }

      const next = params.toString();
      if (next === searchParamsKey) {
        return;
      }

      startTransition(() => {
        router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
      });
    },
    [pageKey, pathname, router, searchParams, searchParamsKey, startTransition],
  );

  const setSearch = useCallback(
    (value: string) => {
      updateQueryParams({ [searchKey]: value });
    },
    [searchKey, updateQueryParams],
  );

  const setFilter = useCallback(
    (id: string, values: string[]) => {
      const field = filterFields.find((item) => item.id === id);
      if (!field) return;

      updateQueryParams({ [field.key]: values, [pageKey]: null });
    },
    [filterFields, pageKey, updateQueryParams],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      const currentPage = Number(searchParams.get(pageKey) || pageField?.defaultValue || 1);
      if (currentPage === nextPage) {
        return;
      }
      updateQueryParams({ [pageKey]: nextPage }, false);
    },
    [pageField?.defaultValue, pageKey, searchParams, updateQueryParams],
  );

  const setPageSize = useCallback(
    (nextPageSize: number) => {
      updateQueryParams({ [pageSizeKey]: nextPageSize, [pageKey]: null }, false);
    },
    [pageKey, pageSizeKey, updateQueryParams],
  );

  const resetFilters = useCallback(() => {
    const updates: Record<string, string | number | string[] | null> = {
      [searchKey]: null,
      [pageKey]: null,
    };
    filterFields.forEach((field) => {
      updates[field.key] = null;
    });
    updateQueryParams(updates, false);
  }, [filterFields, pageKey, searchKey, updateQueryParams]);

  const isFiltered = useMemo(() => {
    const hasSearch = Boolean(search.trim());
    const hasFacetFilters = Object.values(filters).some((values) => values.length > 0);
    return hasSearch || hasFacetFilters;
  }, [filters, search]);

  return {
    search,
    setSearch,
    filters,
    setFilter,
    filterFields,
    page,
    setPage,
    pageSize,
    setPageSize,
    resetFilters,
    isFiltered,
    isPending,
  };
}
