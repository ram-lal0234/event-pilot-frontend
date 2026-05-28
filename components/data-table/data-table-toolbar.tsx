"use client"

import { X } from "lucide-react"

import type {
  DataTableFilterConfig,
  DataTableSearchConfig,
} from "@/lib/data-table/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter"

export type DataTableToolbarProps = {
  search?: DataTableSearchConfig
  filters?: DataTableFilterConfig[]
  isFiltered?: boolean
  onReset?: () => void
  actions?: React.ReactNode
  className?: string
}

export function DataTableToolbar({
  search,
  filters = [],
  isFiltered = false,
  onReset,
  actions,
  className,
}: DataTableToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {search ? (
          <Input
            value={search.value}
            onChange={(event) => search.onChange(event.target.value)}
            placeholder={search.placeholder ?? "Search..."}
            aria-label={search["aria-label"] ?? "Search"}
            className="h-8 w-full max-w-64"
          />
        ) : null}
        {filters.map((filter) => (
          <DataTableFacetedFilter
            key={filter.id}
            title={filter.label}
            options={filter.options}
            selected={filter.selected}
            onChange={filter.onChange}
          />
        ))}
        {isFiltered && onReset ? (
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="h-8 px-2"
            onClick={onReset}
          >
            Reset
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}
