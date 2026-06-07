"use client";

import { useState } from "react";
import type { CustomerInfo } from "../../../types/tool";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CustomerInfoProps {
  value: CustomerInfo;
  onChange: (info: CustomerInfo) => void;
  language: "nl" | "en";
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const t = {
  nl: {
    title: "Klantgegevens",
    naam: "Naam",
    adres: "Adres",
    postcode: "Postcode",
    stad: "Stad",
    telefoon: "Telefoonnummer",
    email: "E-mailadres",
    required: "Dit veld is verplicht.",
    emailOptional: "(optioneel)",
  },
  en: {
    title: "Customer Details",
    naam: "Name",
    adres: "Address",
    postcode: "Postal code",
    stad: "City",
    telefoon: "Phone number",
    email: "Email address",
    required: "This field is required.",
    emailOptional: "(optional)",
  },
} as const;

// ---------------------------------------------------------------------------
// Sub-component: Field
// ---------------------------------------------------------------------------

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}

function Field({
  label,
  required = false,
  hint,
  value,
  onChange,
  type = "text",
  autoComplete,
  errorMsg,
  onBlur,
}: FieldProps & { errorMsg?: string; onBlur?: () => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-300">
        {label}
        {required && <span className="ml-1 text-[#cc0000]">*</span>}
        {hint && <span className="ml-1 text-xs text-gray-500">{hint}</span>}
      </label>
      <input
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`w-full rounded bg-gray-700 px-4 py-3 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37] min-h-12 ${
          errorMsg ? "ring-2 ring-[#cc0000]" : ""
        }`}
      />
      {errorMsg && (
        <p className="text-xs text-[#cc0000] mt-0.5">{errorMsg}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CustomerInfoForm({
  value,
  onChange,
  language,
}: CustomerInfoProps) {
  const labels = t[language];

  // Track which required fields have been blurred
  const [touched, setTouched] = useState<Partial<Record<keyof CustomerInfo, boolean>>>({});

  function touch(field: keyof CustomerInfo) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function requiredError(field: keyof CustomerInfo): string | undefined {
    if (touched[field] && !value[field].trim()) return labels.required;
    return undefined;
  }

  function set(field: keyof CustomerInfo) {
    return (v: string) => onChange({ ...value, [field]: v });
  }

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 flex flex-col gap-4">
      <h3 className="text-lg font-bold" style={{ color: "#d4af37" }}>
        {labels.title}
      </h3>

      <Field
        label={labels.naam}
        required
        value={value.naam}
        onChange={set("naam")}
        onBlur={() => touch("naam")}
        errorMsg={requiredError("naam")}
        autoComplete="name"
      />

      <Field
        label={labels.adres}
        required
        value={value.adres}
        onChange={set("adres")}
        onBlur={() => touch("adres")}
        errorMsg={requiredError("adres")}
        autoComplete="street-address"
      />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label={labels.postcode}
          required
          value={value.postcode}
          onChange={set("postcode")}
          onBlur={() => touch("postcode")}
          errorMsg={requiredError("postcode")}
          autoComplete="postal-code"
        />
        <Field
          label={labels.stad}
          required
          value={value.stad}
          onChange={set("stad")}
          onBlur={() => touch("stad")}
          errorMsg={requiredError("stad")}
          autoComplete="address-level2"
        />
      </div>

      <Field
        label={labels.telefoon}
        required
        value={value.telefoon}
        onChange={set("telefoon")}
        onBlur={() => touch("telefoon")}
        errorMsg={requiredError("telefoon")}
        type="tel"
        autoComplete="tel"
      />

      <Field
        label={labels.email}
        hint={labels.emailOptional}
        value={value.email}
        onChange={set("email")}
        type="email"
        autoComplete="email"
      />
    </div>
  );
}
