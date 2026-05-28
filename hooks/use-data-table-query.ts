"use client"

import { useCallback, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

function splitParam(value: string | null) {
  return value?.split(",").map((item) => item.trim()).filter(Boolean) || []
}

export type DataTableQueryField =
  | { type: "search"; key: string; defaultValue?: string }
  | { type: "filter"; key: string; id: string; label: string }
  | { type: "page"; key?: string; defaultValue?: number }
  | { type: "pageSize"; key?: string; defaultValue?: number }

export function useDataTableQuery(fields: DataTableQueryField[]) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const searchField = fields.find((field) => field.type === "search")
  const filterFields = fields.filter((field) => field.type === "filter")
  const pageField = fields.find((field) => field.type === "page")
  const pageSizeField = fields.find((field) => field.type === "pageSize")

  const searchKey = searchField?.type === "search" ? searchField.key : "q"
  const pageKey = pageField?.type === "page" ? pageField.key || "page" : "page"
  const pageSizeKey =
    pageSizeField?.type === "pageSize" ? pageSizeField.key || "pageSize" : "pageSize"

  const [search, setSearchState] = useState(
    () => searchParams.get(searchKey) || searchField?.defaultValue || ""
  )
  const [filters, setFiltersState] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(
      filterFields.map((field) => [
        field.id,
        splitParam(searchParams.get(field.key)),
      ])
    )
  )
  const [page, setPageState] = useState(
    () => Number(searchParams.get(pageKey) || pageField?.defaultValue || 1)
  )
  const [pageSize, setPageSizeState] = useState(
    () =>
      Number(
        searchParams.get(pageSizeKey) || pageSizeField?.defaultValue || 10
      )
  )

  const updateQueryParams = useCallback(
    (
      updates: Record<string, string | number | string[] | null>,
      resetPage = true
    ) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        const normalized = Array.isArray(value) ? value.join(",") : value
        if (normalized === null || normalized === "" || normalized === undefined) {
          params.delete(key)
        } else {
          params.set(key, String(normalized))
        }
      })

      if (resetPage) {
        params.delete(pageKey)
      }

      const next = params.toString()
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
    },
    [pageKey, pathname, router, searchParams]
  )

  const setSearch = useCallback(
    (value: string) => {
      setSearchState(value)
      updateQueryParams({ [searchKey]: value })
    },
    [searchKey, updateQueryParams]
  )

  const setFilter = useCallback(
    (id: string, values: string[]) => {
      const field = filterFields.find((item) => item.id === id)
      if (!field) return

      setFiltersState((current) => ({ ...current, [id]: values }))
      updateQueryParams({ [field.key]: values })
    },
    [filterFields, updateQueryParams]
  )

  const setPage = useCallback(
    (nextPage: number) => {
      setPageState(nextPage)
      updateQueryParams({ [pageKey]: nextPage }, false)
    },
    [pageKey, updateQueryParams]
  )

  const setPageSize = useCallback(
    (nextPageSize: number) => {
      setPageSizeState(nextPageSize)
      setPageState(1)
      updateQueryParams({ [pageSizeKey]: nextPageSize, [pageKey]: null }, false)
    },
    [pageKey, pageSizeKey, updateQueryParams]
  )

  const resetFilters = useCallback(() => {
    setSearchState(searchField?.defaultValue || "")
    setFiltersState(
      Object.fromEntries(filterFields.map((field) => [field.id, []]))
    )
    setPageState(1)

    const updates: Record<string, string | number | string[] | null> = {
      [searchKey]: null,
      [pageKey]: null,
    }
    filterFields.forEach((field) => {
      updates[field.key] = null
    })
    updateQueryParams(updates, false)
  }, [
    filterFields,
    pageKey,
    searchField?.defaultValue,
    searchKey,
    updateQueryParams,
  ])

  const isFiltered = useMemo(() => {
    const hasSearch = Boolean(search.trim())
    const hasFacetFilters = Object.values(filters).some((values) => values.length > 0)
    return hasSearch || hasFacetFilters
  }, [filters, search])

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
  }
}
