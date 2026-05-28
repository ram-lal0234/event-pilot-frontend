"use client";

import type { GuestFormState } from "@/lib/guest-form";
import type { GuestCategory } from "@/lib/api";
import { PhoneInput } from "@/components/domain/guests/phone-input";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function GuestFormFields({
  form,
  onChange,
}: {
  form: GuestFormState;
  onChange: (form: GuestFormState) => void;
}) {
  return (
    <div className="space-y-3">
      <Input
        value={form.name}
        onChange={(event) => onChange({ ...form, name: event.target.value })}
        placeholder="Name"
        required
      />
      <PhoneInput
        country={form.phoneCountry}
        national={form.phoneNational}
        required
        onCountryChange={(phoneCountry) => onChange({ ...form, phoneCountry })}
        onNationalChange={(phoneNational) => onChange({ ...form, phoneNational })}
      />
      <Input
        type="email"
        value={form.email}
        onChange={(event) => onChange({ ...form, email: event.target.value })}
        placeholder="Email"
      />
      <Select
        value={form.category}
        onChange={(event) => onChange({ ...form, category: event.target.value as GuestCategory })}
      >
        <option value="GENERAL">General</option>
        <option value="FAMILY">Family</option>
        <option value="VIP">VIP</option>
      </Select>
      <Input
        type="number"
        min={1}
        value={form.groupSize}
        onChange={(event) => onChange({ ...form, groupSize: Number(event.target.value) })}
        placeholder="Group size"
      />
      <Input
        value={form.pickupLocation}
        onChange={(event) => onChange({ ...form, pickupLocation: event.target.value })}
        placeholder="Pickup location"
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          value={form.pickupLat}
          onChange={(event) => onChange({ ...form, pickupLat: event.target.value })}
          placeholder="Lat"
        />
        <Input
          value={form.pickupLng}
          onChange={(event) => onChange({ ...form, pickupLng: event.target.value })}
          placeholder="Lng"
        />
      </div>
    </div>
  );
}
