"use client"

import type { DataTableTabConfig } from "@/lib/data-table/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type DataTableShellProps = {
  children: React.ReactNode
  toolbar?: React.ReactNode
  tabs?: {
    value: string
    onValueChange: (value: string) => void
    items: readonly DataTableTabConfig[]
  }
  headerActions?: React.ReactNode
  className?: string
}

export function DataTableShell({
  children,
  toolbar,
  tabs,
  headerActions,
  className,
}: DataTableShellProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card",
        className
      )}
    >
      {tabs || headerActions ? (
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          {tabs ? (
            <Tabs
              value={tabs.value}
              onValueChange={tabs.onValueChange}
              className="w-full sm:w-auto"
            >
              <TabsList variant="line" className="h-9 w-full justify-start sm:w-auto">
                {tabs.items.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                    {tab.label}
                    {tab.badge !== undefined ? (
                      <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
                        {tab.badge}
                      </Badge>
                    ) : null}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          ) : (
            <div />
          )}
          {headerActions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {headerActions}
            </div>
          ) : null}
        </div>
      ) : null}
      {toolbar ? (
        <div className="border-b border-border px-4 py-3">{toolbar}</div>
      ) : null}
      {children}
    </div>
  )
}
