"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type OptionDropdownOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type OptionDropdownProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly OptionDropdownOption[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  size?: "sm" | "default";
  disabled?: boolean;
  align?: "start" | "center" | "end";
};

/** Single-choice field built from shadcn DropdownMenu + radio items. */
export function OptionDropdown({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  className,
  triggerClassName,
  size = "default",
  disabled,
  align = "start",
}: OptionDropdownProps) {
  const selected = options.find((option) => option.value === value);
  const label = selected?.label ?? placeholder;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button
            type="button"
            variant="outline"
            size={size === "sm" ? "sm" : "default"}
            className={cn(
              "w-full justify-between gap-2 font-normal",
              !selected && "text-muted-foreground",
              triggerClassName,
              className,
            )}
          />
        }
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-[var(--anchor-width)]">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => {
            if (next != null) onValueChange(String(next));
          }}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value || "__empty__"}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
