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

type InsulationType = "eps" | "pir" | "pur" | "glaswol" | "rockwool";
type DikteId = "60mm" | "80mm" | "100mm" | "120mm" | "140mm" | "160mm";

interface InsulationState {
  m2: string;
  type: InsulationType;
  dikte: DikteId;
  damprem: boolean;
}

// ---------------------------------------------------------------------------
// Pricing data
// ---------------------------------------------------------------------------

const VAT = pricingData.meta.vatRate;

const insulationCategory = pricingData.categories.find((c) => c.id === "insulation")!;
const insulationItem = insulationCategory.items.find((i) => i.id === "roof_insulation")!;

// type modifiers from pricing.json insulation→type choices
const typeModifiers: Record<InsulationType, number> = {
  eps: 0,
  pir: 6,
  pur: 8,
  glaswol: -1,
  rockwool: 1,
};

// dikte multipliers from pricing.json
const dikteMultipliers: Record<DikteId, number> = {
  "60mm": 1.0,
  "80mm": 1.15,
  "100mm": 1.3,
  "120mm": 1.45,
  "140mm": 1.6,
  "160mm": 1.75,
};

const DAMPREM_PRICE = 3; // €/m² when damprem is true

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const t = {
  nl: {
    title: "Dakisolatie (los)",
    m2Label: "Oppervlakte (m²)",
    typeLabel: "Type isolatie",
    dikteLabel: "Dikte",
    dampremLabel: "Damprem / dampscherm meenemen?",
    yes: "Ja",
    no: "Nee",
    priceLabel: "Berekende prijs",
    typeOpts: {
      eps: "EPS (piepschuim)",
      pir: "PIR",
      pur: "PUR (gespoten)",
      glaswol: "Glaswol",
      rockwool: "Rockwool",
    },
  },
  en: {
    title: "Roof Insulation (standalone)",
    m2Label: "Surface area (m²)",
    typeLabel: "Insulation type",
    dikteLabel: "Thickness",
    dampremLabel: "Include vapour barrier?",
    yes: "Yes",
    no: "No",
    priceLabel: "Computed price",
    typeOpts: {
      eps: "EPS (polystyrene)",
      pir: "PIR",
      pur: "PUR (spray foam)",
      glaswol: "Glass wool",
      rockwool: "Rockwool",
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Reusable sub-components
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

function formatEur(amount: number): string {
  return amount.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function InsulationConfigurator({
  margins,
  onItemsChange,
  language,
}: ConfiguratorProps) {
  const lang = language;
  const labels = t[lang];

  const [state, setState] = useState<InsulationState>({
    m2: "",
    type: "eps",
    dikte: "100mm",
    damprem: false,
  });

  // -------------------------------------------------------------------------
  // Build LineItems
  // -------------------------------------------------------------------------

  useEffect(() => {
    const items: LineItem[] = [];
    const m2 = parseFloat(state.m2);
    if (m2 > 0) {
      const basePerM2 = insulationItem.basePrice + typeModifiers[state.type];
      const withDikte = basePerM2 * dikteMultipliers[state.dikte];
      const withDamprem = state.damprem ? withDikte + DAMPREM_PRICE : withDikte;
      const unitPrice = applyMargins(withDamprem, margins, "material");
      const total = unitPrice * m2;

      const typeNl = t.nl.typeOpts[state.type];
      const typeEn = t.en.typeOpts[state.type];
      const dampremSuffix = state.damprem ? " + damprem" : "";

      items.push({
        id: "insulation_standalone",
        description: {
          nl: `Dakisolatie - ${typeNl} - ${state.dikte}${dampremSuffix}`,
          en: `Roof insulation - ${typeEn} - ${state.dikte}${dampremSuffix}`,
          es: `Aislamiento cubierta - ${typeNl} - ${state.dikte}${dampremSuffix}`,
        },
        unit: "m²",
        quantity: m2,
        unitPrice,
        total,
        vatRate: VAT,
      });
    }

    onItemsChange(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, margins]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const m2 = parseFloat(state.m2) || 0;
  const basePerM2 = insulationItem.basePrice + typeModifiers[state.type];
  const withDikte = basePerM2 * dikteMultipliers[state.dikte];
  const withDamprem = state.damprem ? withDikte + DAMPREM_PRICE : withDikte;
  const unitPrice = applyMargins(withDamprem, margins, "material");
  const total = unitPrice * m2;

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 flex flex-col gap-4">
      <h3 className="text-lg font-bold text-white">{labels.title}</h3>

      {/* m² input */}
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-400">{labels.m2Label}</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={state.m2}
            onChange={(e) => setState((s) => ({ ...s, m2: e.target.value }))}
            className="w-28 rounded bg-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
          />
          <span className="text-sm text-gray-400">m²</span>
        </div>
      </div>

      {/* Type */}
      <ButtonGroup<InsulationType>
        label={labels.typeLabel}
        options={(["eps", "pir", "pur", "glaswol", "rockwool"] as InsulationType[]).map(
          (id) => ({ id, label: labels.typeOpts[id] })
        )}
        value={state.type}
        onChange={(v) => setState((s) => ({ ...s, type: v }))}
      />

      {/* Dikte */}
      <ButtonGroup<DikteId>
        label={labels.dikteLabel}
        options={(["60mm", "80mm", "100mm", "120mm", "140mm", "160mm"] as DikteId[]).map(
          (id) => ({ id, label: id })
        )}
        value={state.dikte}
        onChange={(v) => setState((s) => ({ ...s, dikte: v }))}
      />

      {/* Damprem */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-gray-400">{labels.dampremLabel}</span>
        <div className="flex gap-2">
          {([true, false] as const).map((val) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => setState((s) => ({ ...s, damprem: val }))}
              className={`min-h-12 rounded px-5 py-2 text-sm font-medium transition-colors ${
                state.damprem === val
                  ? "bg-[#d4af37] text-black"
                  : "bg-gray-700 text-white hover:bg-gray-600"
              }`}
            >
              {val ? labels.yes : labels.no}
            </button>
          ))}
        </div>
      </div>

      {/* Live price */}
      {m2 > 0 && (
        <p className="text-sm text-gray-400 border-t border-gray-700 pt-3">
          {labels.priceLabel}:{" "}
          <span className="font-semibold text-white">{formatEur(total)}</span>{" "}
          <span className="text-gray-500">
            ({formatEur(unitPrice)}/m² × {m2} m²)
          </span>
        </p>
      )}
    </div>
  );
}
