"use client";

import { useEffect, useState } from "react";
import type { LineItem, Margins } from "../../../types/tool";
import { applyMargins } from "../../../lib/pricing";
import pricingData from "../../../pricing.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EquipmentRentalsProps {
  margins: Margins;
  onItemsChange: (items: LineItem[]) => void;
  language: "nl" | "en";
}

interface EquipmentRow {
  id: string;
  enabled: boolean;
  duration: string;
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const t = {
  nl: {
    title: "Materieel & Verhuur",
    duration: "Duur",
    days: "dag(en)",
    weeks: "week/weken",
    enable: "Toevoegen",
    remove: "Verwijderen",
    priceLabel: "Berekende prijs",
  },
  en: {
    title: "Equipment & Rentals",
    duration: "Duration",
    days: "day(s)",
    weeks: "week(s)",
    enable: "Add",
    remove: "Remove",
    priceLabel: "Computed price",
  },
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VAT = pricingData.meta.vatRate;

function formatEur(amount: number): string {
  return amount.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function NumInput({
  label,
  value,
  onChange,
  unit,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit: string;
}) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <label className="text-sm text-gray-400 w-16 shrink-0">{label}</label>
      <input
        type="number"
        min="1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-20 rounded bg-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
      />
      <span className="text-sm text-gray-400">{unit}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function EquipmentRentals({
  margins,
  onItemsChange,
  language,
}: EquipmentRentalsProps) {
  const lang = language;
  const labels = t[lang];

  // Initialise one row per enabled equipment item
  const [rows, setRows] = useState<EquipmentRow[]>(() =>
    pricingData.equipment
      .filter((e) => e.enabled)
      .map((e) => ({ id: e.id, enabled: false, duration: "1" }))
  );

  const enabledEquipment = pricingData.equipment.filter((e) => e.enabled);

  // -------------------------------------------------------------------------
  // Build LineItems
  // -------------------------------------------------------------------------

  useEffect(() => {
    const items: LineItem[] = [];

    for (const row of rows) {
      if (!row.enabled) continue;
      const duration = parseFloat(row.duration);
      if (!duration || duration <= 0) continue;

      const eq = enabledEquipment.find((e) => e.id === row.id);
      if (!eq) continue;

      const unitPrice = applyMargins(eq.basePrice, margins, "material");
      const total = unitPrice * duration;

      items.push({
        id: `equipment_${eq.id}`,
        description: {
          nl: eq.name.nl,
          en: eq.name.en,
          es: eq.name.es,
        },
        unit: eq.unit,
        quantity: duration,
        unitPrice,
        total,
        vatRate: VAT,
      });
    }

    onItemsChange(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, margins]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function toggleRow(id: string) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled, duration: "1" } : r))
    );
  }

  function setDuration(id: string, val: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, duration: val } : r)));
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-lg font-bold text-white">{labels.title}</h3>

      {enabledEquipment.map((eq) => {
        const row = rows.find((r) => r.id === eq.id)!;
        const duration = parseFloat(row.duration) || 0;
        const unitPrice = applyMargins(eq.basePrice, margins, "material");
        const total = unitPrice * duration;
        const unitLabel = eq.unit === "week" ? labels.weeks : labels.days;

        return (
          <div
            key={eq.id}
            className={`rounded-lg border transition-colors ${
              row.enabled
                ? "border-[#d4af37] bg-gray-800"
                : "border-gray-700 bg-gray-900"
            }`}
          >
            {/* Header row */}
            <button
              type="button"
              onClick={() => toggleRow(eq.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span
                className={`font-medium ${row.enabled ? "text-[#d4af37]" : "text-white"}`}
              >
                {lang === "nl" ? eq.name.nl : eq.name.en}
              </span>
              <span
                className={`rounded px-3 py-1 text-sm font-medium ${
                  row.enabled
                    ? "bg-red-700 text-white hover:bg-red-800"
                    : "bg-[#d4af37] text-black hover:bg-yellow-400"
                }`}
              >
                {row.enabled ? labels.remove : labels.enable}
              </span>
            </button>

            {/* Expanded controls */}
            {row.enabled && (
              <div className="border-t border-gray-700 px-4 pb-4 pt-3 flex flex-col gap-2">
                <NumInput
                  label={labels.duration}
                  value={row.duration}
                  onChange={(v) => setDuration(eq.id, v)}
                  unit={unitLabel}
                />
                {duration > 0 && (
                  <p className="text-sm text-gray-400 mt-1">
                    {labels.priceLabel}:{" "}
                    <span className="font-semibold text-white">{formatEur(total)}</span>{" "}
                    <span className="text-gray-500">
                      ({formatEur(unitPrice)}/{eq.unit} × {duration} {unitLabel})
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
