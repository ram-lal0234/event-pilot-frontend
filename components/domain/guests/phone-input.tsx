"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { OptionDropdown } from "@/components/ui/option-dropdown";
import { cn } from "@/lib/utils";
import { getPhoneCountry, PHONE_COUNTRIES, type PhoneCountryCode } from "@/lib/phone";

type PhoneInputProps = {
  country: PhoneCountryCode;
  national: string;
  onCountryChange: (country: PhoneCountryCode) => void;
  onNationalChange: (national: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

export function PhoneInput({
  country,
  national,
  onCountryChange,
  onNationalChange,
  required,
  disabled,
  className,
}: PhoneInputProps) {
  const countrySelectId = useId();
  const phoneInputId = useId();
  const selected = getPhoneCountry(country);
  const countryLocked = PHONE_COUNTRIES.length === 1;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={phoneInputId} className="text-sm font-medium text-foreground">
        Phone
      </label>
      <div className="flex gap-2">
        <div className="w-[8.5rem] shrink-0">
          <label htmlFor={countrySelectId} className="sr-only">
            Country
          </label>
          <OptionDropdown
            value={country}
            disabled={disabled || countryLocked}
            triggerClassName="h-9"
            onValueChange={(code) => onCountryChange(code as PhoneCountryCode)}
            options={PHONE_COUNTRIES.map((entry) => ({
              value: entry.code,
              label: `${entry.label} (+${entry.dialCode})`,
            }))}
            placeholder="Country"
          />
        </div>
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            +{selected.dialCode}
          </span>
          <Input
            id={phoneInputId}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            className="h-9 pl-11"
            placeholder="9351303055"
            value={national}
            required={required}
            disabled={disabled}
            maxLength={10}
            onChange={(event) => {
              const next = event.target.value.replace(/\D/g, "").slice(0, 10);
              onNationalChange(next);
            }}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        India mobile only for now. Saved as E.164 (e.g. +919351303055).
      </p>
    </div>
  );
};
