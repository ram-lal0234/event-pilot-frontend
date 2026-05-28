import type { LucideIcon } from "lucide-react"

export type DataTableFilterOption = {
  label: string
  value: string
  icon?: LucideIcon
}

export type DataTableFilterConfig = {
  id: string
  label: string
  options: readonly DataTableFilterOption[]
  selected: string[]
  onChange: (values: string[]) => void
}

export type DataTableSearchConfig = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  "aria-label"?: string
}

export type DataTableTabConfig = {
  value: string
  label: string
  badge?: number
}
