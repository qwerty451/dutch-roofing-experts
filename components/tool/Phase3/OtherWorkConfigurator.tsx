"use client";

import { useEffect, useState } from "react";
import type { LineItem, Margins } from "../../../types/tool";
import { applyMargins } from "../../../lib/pricing";
import pricingData from "../../../pricing.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConfiguratorProps {
  margins: Margins;
  onItemsChange: (items: LineItem[]) => void;
  language: "nl" | "en";
}

type CoatingWerk = "reiniging" | "anti_mos" | "coating";
type VogelType = "pennen" | "net" | "spikes";

interface CoatingState {
  enabled: boolean;
  m2: string;
  werkzaamheid: CoatingWerk;
}

interface VogelState {
  enabled: boolean;
  meters: string;
  type: VogelType;
}

// ---------------------------------------------------------------------------
// Pricing data
// ---------------------------------------------------------------------------

const VAT = pricingData.meta.vatRate;

const otherCategory = pricingData.categories.find((c) => c.id === "other_work")!;
const cleaningItem = otherCategory.items.find((i) => i.id === "roof_cleaning")!;
const birdItem = otherCategory.items.find((i) => i.id === "bird_proofing")!;

const coatingModifiers: Record<CoatingWerk, number> = {
  reiniging: 0,
  anti_mos: 4,
  coating: 12,
};

const vogelModifiers: Record<VogelType, number> = {
  pennen: 0,
  net: 6,
  spikes: 3,
};

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const t = {
  nl: {
    title: "Overig Dakwerk",
    coatingTitle: "Dakcoating / Dakreiniging",
    m2Label: "Oppervlakte (m²)",
    werkLabel: "Werkzaamheid",
    vogelTitle: "Vogelwering",
    metersLabel: "Strekkende meters",
    typeLabel: "Type vogelwering",
    priceLabel: "Berekende prijs",
    enable: "Toevoegen",
    remove: "Verwijderen",
    coatingOpts: {
      reiniging: "Reiniging (hogedruk)",
      anti_mos: "Anti-mosbehandeling",
      coating: "Dakcoating aanbrengen",
    },
    vogelOpts: {
      pennen: "Pennen",
      net: "Net",
      spikes: "Spikes (breed)",
    },
  },
  en: {
    title: "Other Roofwork",
    coatingTitle: "Roof Coating / Cleaning",
    m2Label: "Surface area (m²)",
    werkLabel: "Work type",
    vogelTitle: "Bird Proofing",
    metersLabel: "Linear metres",
    typeLabel: "Bird proofing type",
    priceLabel: "Computed price",
    enable: "Add",
    remove: "Remove",
    coatingOpts: {
      reiniging: "Cleaning (high pressure)",
      anti_mos: "Anti-moss treatment",
      coating: "Apply roof coating",
    },
    vogelOpts: {
      pennen: "Bird spikes (pin type)",
      net: "Bird net",
      spikes: "Wide spikes",
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Section({
  title,
  enabled,
  onToggle,
  enableLabel,
  removeLabel,
  children,
}: {
  title: string;
  enabled: boolean;
  onToggle: () => void;
  enableLabel: string;
  removeLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border transition-colors ${
        enabled ? "border-[#d4af37] bg-gray-800" : "border-gray-700 bg-gray-900"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className={`font-semibold ${enabled ? "text-[#d4af37]" : "text-white"}`}>
          {title}
        </span>
        <span
          className={`rounded px-3 py-1 text-sm font-medium ${
            enabled
              ? "bg-red-700 text-white hover:bg-red-800"
              : "bg-[#d4af37] text-black hover:bg-yellow-400"
          }`}
        >
          {enabled ? removeLabel : enableLabel}
        </span>
      </button>
      {enabled && (
        <div className="border-t border-gray-700 px-4 pb-4 pt-3">{children}</div>
      )}
    </div>
  );
}

function NumInput({
  label,
  value,
  onChange,
  unit,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-400">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-28 rounded bg-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
        />
        {unit && <span className="text-sm text-gray-400">{unit}</span>}
      </div>
    </div>
  );
}

function ButtonGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-gray-400">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`min-h-12 rounded px-4 py-2 text-sm font-medium transition-colors ${
              value === o.id
                ? "bg-[#d4af37] text-black"
                : "bg-gray-700 text-white hover:bg-gray-600"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatEur(amount: number): string {
  return amount.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function OtherWorkConfigurator({
  margins,
  onItemsChange,
  language,
}: ConfiguratorProps) {
  const lang = language;
  const labels = t[lang];

  const [coating, setCoating] = useState<CoatingState>({
    enabled: false,
    m2: "",
    werkzaamheid: "reiniging",
  });

  const [vogel, setVogel] = useState<VogelState>({
    enabled: false,
    meters: "",
    type: "pennen",
  });

  // -------------------------------------------------------------------------
  // Build LineItems
  // -------------------------------------------------------------------------

  useEffect(() => {
    const items: LineItem[] = [];

    // --- Dakcoating / dakreiniging ---
    if (coating.enabled) {
      const m2 = parseFloat(coating.m2);
      if (m2 > 0) {
        const basePerM2 = cleaningItem.basePrice + coatingModifiers[coating.werkzaamheid];
        const unitPrice = applyMargins(basePerM2, margins, "material");
        const werkNl = t.nl.coatingOpts[coating.werkzaamheid];
        const werkEn = t.en.coatingOpts[coating.werkzaamheid];
        items.push({
          id: "other_roof_cleaning",
          description: {
            nl: `Dakreiniging / coating - ${werkNl}`,
            en: `Roof cleaning / coating - ${werkEn}`,
            es: `Limpieza / revestimiento - ${werkNl}`,
          },
          unit: "m²",
          quantity: m2,
          unitPrice,
          total: unitPrice * m2,
          vatRate: VAT,
        });
      }
    }

    // --- Vogelwering ---
    if (vogel.enabled) {
      const meters = parseFloat(vogel.meters);
      if (meters > 0) {
        const basePerM = birdItem.basePrice + vogelModifiers[vogel.type];
        const unitPrice = applyMargins(basePerM, margins, "material");
        const typeNl = t.nl.vogelOpts[vogel.type];
        const typeEn = t.en.vogelOpts[vogel.type];
        items.push({
          id: "other_bird_proofing",
          description: {
            nl: `Vogelwering - ${typeNl}`,
            en: `Bird proofing - ${typeEn}`,
            es: `Protección contra pájaros - ${typeNl}`,
          },
          unit: "m",
          quantity: meters,
          unitPrice,
          total: unitPrice * meters,
          vatRate: VAT,
        });
      }
    }

    onItemsChange(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coating, vogel, margins]);

  // -------------------------------------------------------------------------
  // Computed display values
  // -------------------------------------------------------------------------

  const coatingM2 = parseFloat(coating.m2) || 0;
  const coatingUnitPrice = applyMargins(
    cleaningItem.basePrice + coatingModifiers[coating.werkzaamheid],
    margins,
    "material"
  );

  const vogelMeters = parseFloat(vogel.meters) || 0;
  const vogelUnitPrice = applyMargins(
    birdItem.basePrice + vogelModifiers[vogel.type],
    margins,
    "material"
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-bold text-white">{labels.title}</h3>

      {/* Dakcoating / dakreiniging */}
      <Section
        title={labels.coatingTitle}
        enabled={coating.enabled}
        onToggle={() => setCoating((s) => ({ ...s, enabled: !s.enabled }))}
        enableLabel={labels.enable}
        removeLabel={labels.remove}
      >
        <div className="flex flex-col gap-4">
          <NumInput
            label={labels.m2Label}
            value={coating.m2}
            onChange={(v) => setCoating((s) => ({ ...s, m2: v }))}
            unit="m²"
          />
          <ButtonGroup<CoatingWerk>
            label={labels.werkLabel}
            options={(["reiniging", "anti_mos", "coating"] as CoatingWerk[]).map((id) => ({
              id,
              label: labels.coatingOpts[id],
            }))}
            value={coating.werkzaamheid}
            onChange={(v) => setCoating((s) => ({ ...s, werkzaamheid: v }))}
          />
          {coatingM2 > 0 && (
            <p className="text-sm text-gray-400 border-t border-gray-700 pt-2">
              {labels.priceLabel}:{" "}
              <span className="font-semibold text-white">
                {formatEur(coatingUnitPrice * coatingM2)}
              </span>{" "}
              <span className="text-gray-500">
                ({formatEur(coatingUnitPrice)}/m² × {coatingM2} m²)
              </span>
            </p>
          )}
        </div>
      </Section>

      {/* Vogelwering */}
      <Section
        title={labels.vogelTitle}
        enabled={vogel.enabled}
        onToggle={() => setVogel((s) => ({ ...s, enabled: !s.enabled }))}
        enableLabel={labels.enable}
        removeLabel={labels.remove}
      >
        <div className="flex flex-col gap-4">
          <NumInput
            label={labels.metersLabel}
            value={vogel.meters}
            onChange={(v) => setVogel((s) => ({ ...s, meters: v }))}
            unit="m"
          />
          <ButtonGroup<VogelType>
            label={labels.typeLabel}
            options={(["pennen", "net", "spikes"] as VogelType[]).map((id) => ({
              id,
              label: labels.vogelOpts[id],
            }))}
            value={vogel.type}
            onChange={(v) => setVogel((s) => ({ ...s, type: v }))}
          />
          {vogelMeters > 0 && (
            <p className="text-sm text-gray-400 border-t border-gray-700 pt-2">
              {labels.priceLabel}:{" "}
              <span className="font-semibold text-white">
                {formatEur(vogelUnitPrice * vogelMeters)}
              </span>{" "}
              <span className="text-gray-500">
                ({formatEur(vogelUnitPrice)}/m × {vogelMeters} m)
              </span>
            </p>
          )}
        </div>
      </Section>
    </div>
  );
}
