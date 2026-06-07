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

type GutterSoort = "pvc" | "zink" | "aluminium" | "koper";
type GutterWerk = "nieuw" | "vervangen" | "reinigen" | "repareren";
type DrainType = "pvc" | "hdpe";

interface GutterState {
  enabled: boolean;
  soort: GutterSoort;
  meters: string;
  werkzaamheid: GutterWerk;
  hwaAantal: string;
}

interface ZinkState {
  enabled: boolean;
  meters: string;
  opMaat: boolean;
}

interface DrainState {
  enabled: boolean;
  aantal: string;
  type: DrainType;
}

// ---------------------------------------------------------------------------
// Pricing helpers
// ---------------------------------------------------------------------------

const VAT = pricingData.meta.vatRate;

const gutterItem = pricingData.categories
  .find((c) => c.id === "gutters")!
  .items.find((i) => i.id === "roof_gutters")!;

const zinkItem = pricingData.categories
  .find((c) => c.id === "gutters")!
  .items.find((i) => i.id === "custom_zinc_gutters")!;

const drainItem = pricingData.categories
  .find((c) => c.id === "gutters")!
  .items.find((i) => i.id === "internal_drainage")!;

// Price modifiers from pricing.json
const soortModifiers: Record<GutterSoort, number> = {
  pvc: 0,
  zink: 12,
  aluminium: 8,
  koper: 45,
};
const werkModifiers: Record<GutterWerk, number> = {
  nieuw: 0,
  vervangen: 5,
  reinigen: -18,
  repareren: -10,
};
const drainModifiers: Record<DrainType, number> = { pvc: 0, hdpe: 35 };

// HWA price: use the base gutter price as a per-unit install charge
const HWA_BASE_PRICE = 45;

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const t = {
  nl: {
    title: "Goten & Afwatering",
    dakgoten: "Dakgoten",
    soort: "Soort goot",
    meters: "Strekkende meters",
    werkzaamheid: "Werkzaamheid",
    hwa: "Hemelwaterafvoeren (HWA) — aantal",
    zinkGoten: "Zinken maatwerkgoten",
    opMaat: "Op maat gemaakt",
    inwendig: "Inwendige waterafvoer",
    aantalPunten: "Aantal afvoerpunten",
    typeAfvoer: "Type afvoer",
    yes: "Ja",
    no: "Nee",
    soortOpts: { pvc: "PVC", zink: "Zink", aluminium: "Aluminium", koper: "Koper" },
    werkOpts: {
      nieuw: "Nieuw plaatsen",
      vervangen: "Vervangen",
      reinigen: "Reinigen",
      repareren: "Repareren",
    },
    drainOpts: { pvc: "PVC", hdpe: "HDPE" },
    enable: "Toevoegen",
    remove: "Verwijderen",
  },
  en: {
    title: "Gutters & Drainage",
    dakgoten: "Roof Gutters",
    soort: "Gutter type",
    meters: "Linear metres",
    werkzaamheid: "Work type",
    hwa: "Downpipes (HWA) — quantity",
    zinkGoten: "Custom zinc gutters",
    opMaat: "Custom made",
    inwendig: "Internal drainage",
    aantalPunten: "Number of drain points",
    typeAfvoer: "Drain type",
    yes: "Yes",
    no: "No",
    soortOpts: { pvc: "PVC", zink: "Zinc", aluminium: "Aluminium", koper: "Copper" },
    werkOpts: {
      nieuw: "New installation",
      vervangen: "Replace",
      reinigen: "Clean",
      repareren: "Repair",
    },
    drainOpts: { pvc: "PVC", hdpe: "HDPE" },
    enable: "Add",
    remove: "Remove",
  },
} as const;

// ---------------------------------------------------------------------------
// Sub-section wrapper
// ---------------------------------------------------------------------------

function Section({
  title,
  enabled,
  onToggle,
  lang,
  children,
}: {
  title: string;
  enabled: boolean;
  onToggle: () => void;
  lang: "nl" | "en";
  children: React.ReactNode;
}) {
  const labels = t[lang];
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
          {enabled ? labels.remove : labels.enable}
        </span>
      </button>
      {enabled && <div className="border-t border-gray-700 px-4 pb-4 pt-3">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reusable input
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

// ---------------------------------------------------------------------------
// ButtonGroup
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function GuttersConfigurator({
  margins,
  onItemsChange,
  language,
}: ConfiguratorProps) {
  const lang = language;
  const labels = t[lang];

  const [gutters, setGutters] = useState<GutterState>({
    enabled: false,
    soort: "pvc",
    meters: "",
    werkzaamheid: "nieuw",
    hwaAantal: "",
  });

  const [zink, setZink] = useState<ZinkState>({
    enabled: false,
    meters: "",
    opMaat: false,
  });

  const [drain, setDrain] = useState<DrainState>({
    enabled: false,
    aantal: "",
    type: "pvc",
  });

  // -------------------------------------------------------------------------
  // Build LineItems whenever state changes
  // -------------------------------------------------------------------------

  useEffect(() => {
    const items: LineItem[] = [];

    // --- Dakgoten ---
    if (gutters.enabled && parseFloat(gutters.meters) > 0) {
      const qty = parseFloat(gutters.meters);
      const basePerM =
        gutterItem.basePrice +
        soortModifiers[gutters.soort] +
        werkModifiers[gutters.werkzaamheid];
      const unitPrice = applyMargins(basePerM, margins, "material");
      const soortNl = labels.soortOpts[gutters.soort];
      const werkNl = t.nl.werkOpts[gutters.werkzaamheid];
      const soortEn = t.en.soortOpts[gutters.soort];
      const werkEn = t.en.werkOpts[gutters.werkzaamheid];
      items.push({
        id: "gutters_roof",
        description: {
          nl: `Dakgoten - ${soortNl} - ${werkNl}`,
          en: `Roof Gutters - ${soortEn} - ${t.en.werkOpts[gutters.werkzaamheid]}`,
          es: `Canalones - ${soortNl} - ${werkNl}`,
        },
        unit: "m",
        quantity: qty,
        unitPrice,
        total: unitPrice * qty,
        vatRate: VAT,
      });
    }

    // --- HWA downpipes ---
    if (gutters.enabled && parseInt(gutters.hwaAantal) > 0) {
      const qty = parseInt(gutters.hwaAantal);
      const unitPrice = applyMargins(HWA_BASE_PRICE, margins, "material");
      items.push({
        id: "gutters_hwa",
        description: {
          nl: "Hemelwaterafvoeren (HWA)",
          en: "Downpipes (HWA)",
          es: "Bajantes pluviales (HWA)",
        },
        unit: "stuk",
        quantity: qty,
        unitPrice,
        total: unitPrice * qty,
        vatRate: VAT,
      });
    }

    // --- Zinken maatwerkgoten ---
    if (zink.enabled && parseFloat(zink.meters) > 0) {
      const qty = parseFloat(zink.meters);
      const basePerM = zinkItem.basePrice + (zink.opMaat ? 18 : 0);
      const unitPrice = applyMargins(basePerM, margins, "material");
      const suffix = zink.opMaat
        ? lang === "nl"
          ? " - Op maat"
          : " - Custom made"
        : "";
      items.push({
        id: "gutters_zinc_custom",
        description: {
          nl: `Zinken maatwerkgoten${suffix}`,
          en: `Custom zinc gutters${suffix}`,
          es: `Canalones de zinc a medida${suffix}`,
        },
        unit: "m",
        quantity: qty,
        unitPrice,
        total: unitPrice * qty,
        vatRate: VAT,
      });
    }

    // --- Inwendige waterafvoer ---
    if (drain.enabled && parseInt(drain.aantal) > 0) {
      const qty = parseInt(drain.aantal);
      const basePerPoint = drainItem.basePrice + drainModifiers[drain.type];
      const unitPrice = applyMargins(basePerPoint, margins, "material");
      const typeLabel = drain.type.toUpperCase();
      items.push({
        id: "gutters_internal_drain",
        description: {
          nl: `Inwendige waterafvoer - ${typeLabel}`,
          en: `Internal drainage - ${typeLabel}`,
          es: `Drenaje interno - ${typeLabel}`,
        },
        unit: "afvoerpunt",
        quantity: qty,
        unitPrice,
        total: unitPrice * qty,
        vatRate: VAT,
      });
    }

    onItemsChange(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gutters, zink, drain, margins]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-bold text-white">{labels.title}</h3>

      {/* Dakgoten */}
      <Section
        title={labels.dakgoten}
        enabled={gutters.enabled}
        onToggle={() => setGutters((s) => ({ ...s, enabled: !s.enabled }))}
        lang={lang}
      >
        <div className="flex flex-col gap-4">
          <ButtonGroup<GutterSoort>
            label={labels.soort}
            options={[
              { id: "pvc", label: labels.soortOpts.pvc },
              { id: "zink", label: labels.soortOpts.zink },
              { id: "aluminium", label: labels.soortOpts.aluminium },
              { id: "koper", label: labels.soortOpts.koper },
            ]}
            value={gutters.soort}
            onChange={(v) => setGutters((s) => ({ ...s, soort: v }))}
          />
          <NumInput
            label={labels.meters}
            value={gutters.meters}
            onChange={(v) => setGutters((s) => ({ ...s, meters: v }))}
            unit="m"
          />
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">{labels.werkzaamheid}</label>
            <select
              value={gutters.werkzaamheid}
              onChange={(e) =>
                setGutters((s) => ({ ...s, werkzaamheid: e.target.value as GutterWerk }))
              }
              className="w-full rounded bg-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
            >
              {(["nieuw", "vervangen", "reinigen", "repareren"] as GutterWerk[]).map((w) => (
                <option key={w} value={w}>
                  {labels.werkOpts[w]}
                </option>
              ))}
            </select>
          </div>
          <NumInput
            label={labels.hwa}
            value={gutters.hwaAantal}
            onChange={(v) => setGutters((s) => ({ ...s, hwaAantal: v }))}
            unit={lang === "nl" ? "stuks" : "pcs"}
          />
        </div>
      </Section>

      {/* Zinken goten */}
      <Section
        title={labels.zinkGoten}
        enabled={zink.enabled}
        onToggle={() => setZink((s) => ({ ...s, enabled: !s.enabled }))}
        lang={lang}
      >
        <div className="flex flex-col gap-4">
          <NumInput
            label={labels.meters}
            value={zink.meters}
            onChange={(v) => setZink((s) => ({ ...s, meters: v }))}
            unit="m"
          />
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-400">{labels.opMaat}?</span>
            <div className="flex gap-2">
              {([true, false] as const).map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => setZink((s) => ({ ...s, opMaat: val }))}
                  className={`min-h-12 rounded px-5 py-2 text-sm font-medium transition-colors ${
                    zink.opMaat === val
                      ? "bg-[#d4af37] text-black"
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  }`}
                >
                  {val ? labels.yes : labels.no}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Inwendige waterafvoer */}
      <Section
        title={labels.inwendig}
        enabled={drain.enabled}
        onToggle={() => setDrain((s) => ({ ...s, enabled: !s.enabled }))}
        lang={lang}
      >
        <div className="flex flex-col gap-4">
          <NumInput
            label={labels.aantalPunten}
            value={drain.aantal}
            onChange={(v) => setDrain((s) => ({ ...s, aantal: v }))}
            unit={lang === "nl" ? "afvoerpunten" : "drain points"}
          />
          <ButtonGroup<DrainType>
            label={labels.typeAfvoer}
            options={[
              { id: "pvc", label: labels.drainOpts.pvc },
              { id: "hdpe", label: labels.drainOpts.hdpe },
            ]}
            value={drain.type}
            onChange={(v) => setDrain((s) => ({ ...s, type: v }))}
          />
        </div>
      </Section>
    </div>
  );
}
