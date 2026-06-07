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

type BevestigingType = "op_pannen" | "op_folie" | "ballast_plat";

interface PrepState {
  enabled: boolean;
  aantalPanelen: string;
  constructieVersterken: boolean;
  doorvoerenAantal: string;
  bevestiging: BevestigingType;
}

interface InspectionState {
  enabled: boolean;
  m2: string;
  rapportage: boolean;
}

// ---------------------------------------------------------------------------
// Pricing helpers
// ---------------------------------------------------------------------------

const VAT = pricingData.meta.vatRate;

const solarCat = pricingData.categories.find((c) => c.id === "solar_prep")!;
const prepItem = solarCat.items.find((i) => i.id === "solar_roof_prep")!;
const inspectionItem = solarCat.items.find((i) => i.id === "roof_inspection_solar")!;

const CONSTRUCTIE_FLAT_PRICE = 350;
const DOORVOER_PER_UNIT = 95; // re-use roof_penetrations base as waterproof solar feed-through
const RAPPORTAGE_FLAT_PRICE = 150;

const BEVESTIGING_MOD: Record<BevestigingType, number> = {
  op_pannen: 0,
  op_folie: 3,
  ballast_plat: 5,
};

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const t = {
  nl: {
    title: "Zonnepanelen (gerelateerd dakwerk)",
    prep: "Dakvoorbereiding zonnepanelen",
    aantalPanelen: "Aantal zonnepanelen",
    constructie: "Dakconstructie versterken?",
    doorvoeren: "Waterdichte doorvoeren plaatsen — aantal",
    bevestiging: "Type bevestiging",
    inspection: "Dakinspectie voor solar",
    m2: "Oppervlakte inspectiegebied",
    rapportage: "Rapportage gewenst?",
    yes: "Ja",
    no: "Nee",
    bevestigingOpts: {
      op_pannen: "Op pannen",
      op_folie: "Op folie",
      ballast_plat: "Ballastsysteem (plat dak)",
    },
    enable: "Toevoegen",
    remove: "Verwijderen",
    panelen: "panelen",
    stuks: "stuks",
  },
  en: {
    title: "Solar Panels (related roofwork)",
    prep: "Roof preparation for solar",
    aantalPanelen: "Number of solar panels",
    constructie: "Reinforce roof structure?",
    doorvoeren: "Waterproof feed-throughs — quantity",
    bevestiging: "Fixing type",
    inspection: "Roof inspection for solar",
    m2: "Inspection area (m²)",
    rapportage: "Report required?",
    yes: "Yes",
    no: "No",
    bevestigingOpts: {
      op_pannen: "On tiles",
      op_folie: "On membrane",
      ballast_plat: "Ballast system (flat roof)",
    },
    enable: "Add",
    remove: "Remove",
    panelen: "panels",
    stuks: "pcs",
  },
} as const;

// ---------------------------------------------------------------------------
// Shared UI components
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

function YesNo({
  label,
  value,
  onChange,
  lang,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  lang: "nl" | "en";
}) {
  const labels = t[lang];
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-gray-400">{label}</span>
      <div className="flex gap-2">
        {([true, false] as const).map((val) => (
          <button
            key={String(val)}
            type="button"
            onClick={() => onChange(val)}
            className={`min-h-12 rounded px-5 py-2 text-sm font-medium transition-colors ${
              value === val
                ? "bg-[#d4af37] text-black"
                : "bg-gray-700 text-white hover:bg-gray-600"
            }`}
          >
            {val ? labels.yes : labels.no}
          </button>
        ))}
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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SolarConfigurator({
  margins,
  onItemsChange,
  language,
}: ConfiguratorProps) {
  const lang = language;
  const labels = t[lang];

  const [prep, setPrep] = useState<PrepState>({
    enabled: false,
    aantalPanelen: "",
    constructieVersterken: false,
    doorvoerenAantal: "",
    bevestiging: "op_pannen",
  });

  const [inspection, setInspection] = useState<InspectionState>({
    enabled: false,
    m2: "",
    rapportage: false,
  });

  // -------------------------------------------------------------------------
  // Build LineItems
  // -------------------------------------------------------------------------

  useEffect(() => {
    const items: LineItem[] = [];

    // --- Dakvoorbereiding per paneel ---
    if (prep.enabled && parseInt(prep.aantalPanelen) > 0) {
      const qty = parseInt(prep.aantalPanelen);
      const basePerPanel = prepItem.basePrice + BEVESTIGING_MOD[prep.bevestiging];
      const unitPrice = applyMargins(basePerPanel, margins, "material");
      const bevNl = t.nl.bevestigingOpts[prep.bevestiging];
      const bevEn = t.en.bevestigingOpts[prep.bevestiging];

      items.push({
        id: "solar_prep_panels",
        description: {
          nl: `Dakvoorbereiding zonnepanelen - ${bevNl}`,
          en: `Roof preparation solar panels - ${bevEn}`,
          es: `Preparación cubierta paneles solares - ${bevNl}`,
        },
        unit: "paneel",
        quantity: qty,
        unitPrice,
        total: unitPrice * qty,
        vatRate: VAT,
      });
    }

    // --- Dakconstructie versterken (flat fee) ---
    if (prep.enabled && prep.constructieVersterken) {
      const unitPrice = applyMargins(CONSTRUCTIE_FLAT_PRICE, margins, "both");
      items.push({
        id: "solar_constructie",
        description: {
          nl: "Dakconstructie versterken",
          en: "Roof structure reinforcement",
          es: "Refuerzo estructura cubierta",
        },
        unit: "stuk",
        quantity: 1,
        unitPrice,
        total: unitPrice,
        vatRate: VAT,
      });
    }

    // --- Waterdichte doorvoeren ---
    if (prep.enabled && parseInt(prep.doorvoerenAantal) > 0) {
      const qty = parseInt(prep.doorvoerenAantal);
      const unitPrice = applyMargins(DOORVOER_PER_UNIT, margins, "material");
      items.push({
        id: "solar_doorvoeren",
        description: {
          nl: "Waterdichte dakdoorvoer (solar)",
          en: "Waterproof roof feed-through (solar)",
          es: "Paso de cubierta estanco (solar)",
        },
        unit: "stuks",
        quantity: qty,
        unitPrice,
        total: unitPrice * qty,
        vatRate: VAT,
      });
    }

    // --- Dakinspectie ---
    if (inspection.enabled && parseFloat(inspection.m2) > 0) {
      const qty = parseFloat(inspection.m2);
      const unitPrice = applyMargins(inspectionItem.basePrice, margins, "labor");
      items.push({
        id: "solar_inspection",
        description: {
          nl: "Dakinspectie voor solar",
          en: "Roof inspection for solar",
          es: "Inspección cubierta para solar",
        },
        unit: "m²",
        quantity: qty,
        unitPrice,
        total: unitPrice * qty,
        vatRate: VAT,
      });
    }

    // --- Rapportage (flat fee) ---
    if (inspection.enabled && inspection.rapportage) {
      const unitPrice = applyMargins(RAPPORTAGE_FLAT_PRICE, margins, "labor");
      items.push({
        id: "solar_rapportage",
        description: {
          nl: "Inspectierapportage solar",
          en: "Solar inspection report",
          es: "Informe de inspección solar",
        },
        unit: "stuk",
        quantity: 1,
        unitPrice,
        total: unitPrice,
        vatRate: VAT,
      });
    }

    onItemsChange(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prep, inspection, margins]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-bold text-white">{labels.title}</h3>

      {/* Dakvoorbereiding zonnepanelen */}
      <Section
        title={labels.prep}
        enabled={prep.enabled}
        onToggle={() => setPrep((s) => ({ ...s, enabled: !s.enabled }))}
        lang={lang}
      >
        <div className="flex flex-col gap-4">
          <NumInput
            label={labels.aantalPanelen}
            value={prep.aantalPanelen}
            onChange={(v) => setPrep((s) => ({ ...s, aantalPanelen: v }))}
            unit={labels.panelen}
          />
          <YesNo
            label={labels.constructie}
            value={prep.constructieVersterken}
            onChange={(v) => setPrep((s) => ({ ...s, constructieVersterken: v }))}
            lang={lang}
          />
          <NumInput
            label={labels.doorvoeren}
            value={prep.doorvoerenAantal}
            onChange={(v) => setPrep((s) => ({ ...s, doorvoerenAantal: v }))}
            unit={labels.stuks}
          />
          <ButtonGroup<BevestigingType>
            label={labels.bevestiging}
            options={[
              { id: "op_pannen", label: labels.bevestigingOpts.op_pannen },
              { id: "op_folie", label: labels.bevestigingOpts.op_folie },
              { id: "ballast_plat", label: labels.bevestigingOpts.ballast_plat },
            ]}
            value={prep.bevestiging}
            onChange={(v) => setPrep((s) => ({ ...s, bevestiging: v }))}
          />
        </div>
      </Section>

      {/* Dakinspectie voor solar */}
      <Section
        title={labels.inspection}
        enabled={inspection.enabled}
        onToggle={() => setInspection((s) => ({ ...s, enabled: !s.enabled }))}
        lang={lang}
      >
        <div className="flex flex-col gap-4">
          <NumInput
            label={labels.m2}
            value={inspection.m2}
            onChange={(v) => setInspection((s) => ({ ...s, m2: v }))}
            unit="m²"
          />
          <YesNo
            label={labels.rapportage}
            value={inspection.rapportage}
            onChange={(v) => setInspection((s) => ({ ...s, rapportage: v }))}
            lang={lang}
          />
        </div>
      </Section>
    </div>
  );
}
