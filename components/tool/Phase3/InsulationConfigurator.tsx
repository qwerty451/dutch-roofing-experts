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

// Roof insulation (dakisolatie)
type InsulationType = "eps" | "pir" | "pur" | "glaswol" | "rockwool";
type DikteId = "60mm" | "80mm" | "100mm" | "120mm" | "140mm" | "160mm";

interface InsulationState {
  m2: string;
  type: InsulationType;
  dikte: DikteId;
  damprem: boolean;
}

// Interior insulation (binnenisolatie)
type BinnenType = "pir" | "glaswol" | "rockwool" | "pur";
type BinnenDikte = "60mm" | "80mm" | "100mm" | "120mm" | "150mm";

interface BinnenState {
  m2: string;
  type: BinnenType;
  dikte: BinnenDikte;
  gipsplaat: boolean;
  damprem: boolean;
}

// ---------------------------------------------------------------------------
// Pricing data
// ---------------------------------------------------------------------------

const VAT = pricingData.meta.vatRate;

const insulationCategory = pricingData.categories.find((c) => c.id === "insulation")!;
const insulationItem = insulationCategory.items.find((i) => i.id === "roof_insulation")!;

const typeModifiers: Record<InsulationType, number> = {
  eps: 0,
  pir: 6,
  pur: 8,
  glaswol: -1,
  rockwool: 1,
};

const dikteMultipliers: Record<DikteId, number> = {
  "60mm": 1.0,
  "80mm": 1.15,
  "100mm": 1.3,
  "120mm": 1.45,
  "140mm": 1.6,
  "160mm": 1.75,
};

const DAMPREM_PRICE = 3;

// Binnenisolatie pricing
const BINNEN_BASE = 22; // €/m²
const binnenTypeModifiers: Record<BinnenType, number> = {
  pir: 4,
  glaswol: 0,
  rockwool: 1,
  pur: 8,
};
const binnenDikteMultipliers: Record<BinnenDikte, number> = {
  "60mm": 1.0,
  "80mm": 1.15,
  "100mm": 1.3,
  "120mm": 1.45,
  "150mm": 1.65,
};
const GIPSPLAAT_PRICE = 8; // €/m² extra for plasterboard finish

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const t = {
  nl: {
    dakTitle: "Dakisolatie (los)",
    binnenTitle: "Binnenisolatie",
    binnenDescription: "Isolatie aangebracht aan de binnenzijde van het dak.",
    m2Label: "Oppervlakte (m²)",
    typeLabel: "Type isolatie",
    dikteLabel: "Dikte",
    dampremLabel: "Damprem / dampscherm meenemen?",
    gipsplaatLabel: "Afwerking met gipsplaat?",
    yes: "Ja",
    no: "Nee",
    priceLabel: "Berekende prijs",
    dakTypeOpts: {
      eps: "EPS (piepschuim)",
      pir: "PIR",
      pur: "PUR (gespoten)",
      glaswol: "Glaswol",
      rockwool: "Rockwool",
    },
    binnenTypeOpts: {
      pir: "PIR platen",
      glaswol: "Glaswol",
      rockwool: "Rockwool",
      pur: "PUR (gespoten)",
    },
  },
  en: {
    dakTitle: "Roof Insulation (standalone)",
    binnenTitle: "Interior Insulation",
    binnenDescription: "Insulation applied to the interior side of the roof.",
    m2Label: "Surface area (m²)",
    typeLabel: "Insulation type",
    dikteLabel: "Thickness",
    dampremLabel: "Include vapour barrier?",
    gipsplaatLabel: "Plasterboard finish?",
    yes: "Yes",
    no: "No",
    priceLabel: "Computed price",
    dakTypeOpts: {
      eps: "EPS (polystyrene)",
      pir: "PIR",
      pur: "PUR (spray foam)",
      glaswol: "Glass wool",
      rockwool: "Rockwool",
    },
    binnenTypeOpts: {
      pir: "PIR boards",
      glaswol: "Glass wool",
      rockwool: "Rockwool",
      pur: "PUR (spray foam)",
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

function YesNoToggle({
  label,
  value,
  onChange,
  yes,
  no,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  yes: string;
  no: string;
}) {
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
            {val ? yes : no}
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
  const labels = t[language];

  const [dakState, setDakState] = useState<InsulationState>({
    m2: "",
    type: "eps",
    dikte: "100mm",
    damprem: false,
  });

  const [binnenState, setBinnenState] = useState<BinnenState>({
    m2: "",
    type: "pir",
    dikte: "100mm",
    gipsplaat: false,
    damprem: false,
  });

  // -------------------------------------------------------------------------
  // Build LineItems and emit on any change
  // -------------------------------------------------------------------------

  useEffect(() => {
    const items: LineItem[] = [];

    // --- Dakisolatie ---
    const dakM2 = parseFloat(dakState.m2);
    if (dakM2 > 0) {
      const basePerM2 = insulationItem.basePrice + typeModifiers[dakState.type];
      const withDikte = basePerM2 * dikteMultipliers[dakState.dikte];
      const withDamprem = dakState.damprem ? withDikte + DAMPREM_PRICE : withDikte;
      const unitPrice = applyMargins(withDamprem, margins, "material");
      const dampremSuffix = dakState.damprem ? " + damprem" : "";
      const typeNl = t.nl.dakTypeOpts[dakState.type];
      const typeEn = t.en.dakTypeOpts[dakState.type];

      items.push({
        id: "insulation_standalone",
        description: {
          nl: `Dakisolatie - ${typeNl} - ${dakState.dikte}${dampremSuffix}`,
          en: `Roof insulation - ${typeEn} - ${dakState.dikte}${dampremSuffix}`,
          es: `Aislamiento cubierta - ${typeNl} - ${dakState.dikte}${dampremSuffix}`,
        },
        unit: "m²",
        quantity: dakM2,
        unitPrice,
        total: unitPrice * dakM2,
        vatRate: VAT,
      });
    }

    // --- Binnenisolatie ---
    const binnenM2 = parseFloat(binnenState.m2);
    if (binnenM2 > 0) {
      const basePerM2 = BINNEN_BASE + binnenTypeModifiers[binnenState.type];
      const withDikte = basePerM2 * binnenDikteMultipliers[binnenState.dikte];
      const withExtras =
        withDikte +
        (binnenState.gipsplaat ? GIPSPLAAT_PRICE : 0) +
        (binnenState.damprem ? DAMPREM_PRICE : 0);
      const unitPrice = applyMargins(withExtras, margins, "material");
      const typeNl = t.nl.binnenTypeOpts[binnenState.type];
      const typeEn = t.en.binnenTypeOpts[binnenState.type];
      const extrasNl = [
        binnenState.gipsplaat ? "gipsplaat" : "",
        binnenState.damprem ? "damprem" : "",
      ].filter(Boolean).join(", ");
      const extrasEn = [
        binnenState.gipsplaat ? "plasterboard" : "",
        binnenState.damprem ? "vapour barrier" : "",
      ].filter(Boolean).join(", ");

      items.push({
        id: "insulation_interior",
        description: {
          nl: `Binnenisolatie - ${typeNl} - ${binnenState.dikte}${extrasNl ? ` + ${extrasNl}` : ""}`,
          en: `Interior insulation - ${typeEn} - ${binnenState.dikte}${extrasEn ? ` + ${extrasEn}` : ""}`,
          es: `Aislamiento interior - ${typeNl} - ${binnenState.dikte}${extrasNl ? ` + ${extrasNl}` : ""}`,
        },
        unit: "m²",
        quantity: binnenM2,
        unitPrice,
        total: unitPrice * binnenM2,
        vatRate: VAT,
      });
    }

    onItemsChange(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dakState, binnenState, margins]);

  // -------------------------------------------------------------------------
  // Live price helpers
  // -------------------------------------------------------------------------

  const dakM2num = parseFloat(dakState.m2) || 0;
  const dakUnitPrice = applyMargins(
    (insulationItem.basePrice + typeModifiers[dakState.type]) *
      dikteMultipliers[dakState.dikte] +
      (dakState.damprem ? DAMPREM_PRICE : 0),
    margins,
    "material"
  );

  const binnenM2num = parseFloat(binnenState.m2) || 0;
  const binnenUnitPrice = applyMargins(
    (BINNEN_BASE + binnenTypeModifiers[binnenState.type]) *
      binnenDikteMultipliers[binnenState.dikte] +
      (binnenState.gipsplaat ? GIPSPLAAT_PRICE : 0) +
      (binnenState.damprem ? DAMPREM_PRICE : 0),
    margins,
    "material"
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4">

      {/* ------------------------------------------------------------------ */}
      {/* 1. Dakisolatie (standalone roof insulation)                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 flex flex-col gap-4">
        <h3 className="text-lg font-bold text-white">{labels.dakTitle}</h3>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">{labels.m2Label}</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              value={dakState.m2}
              onChange={(e) => setDakState((s) => ({ ...s, m2: e.target.value }))}
              className="w-28 rounded bg-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
            />
            <span className="text-sm text-gray-400">m²</span>
          </div>
        </div>

        <ButtonGroup<InsulationType>
          label={labels.typeLabel}
          options={(["eps", "pir", "pur", "glaswol", "rockwool"] as InsulationType[]).map(
            (id) => ({ id, label: labels.dakTypeOpts[id] })
          )}
          value={dakState.type}
          onChange={(v) => setDakState((s) => ({ ...s, type: v }))}
        />

        <ButtonGroup<DikteId>
          label={labels.dikteLabel}
          options={(["60mm", "80mm", "100mm", "120mm", "140mm", "160mm"] as DikteId[]).map(
            (id) => ({ id, label: id })
          )}
          value={dakState.dikte}
          onChange={(v) => setDakState((s) => ({ ...s, dikte: v }))}
        />

        <YesNoToggle
          label={labels.dampremLabel}
          value={dakState.damprem}
          onChange={(v) => setDakState((s) => ({ ...s, damprem: v }))}
          yes={labels.yes}
          no={labels.no}
        />

        {dakM2num > 0 && (
          <p className="text-sm text-gray-400 border-t border-gray-700 pt-3">
            {labels.priceLabel}:{" "}
            <span className="font-semibold text-white">{formatEur(dakUnitPrice * dakM2num)}</span>{" "}
            <span className="text-gray-500">
              ({formatEur(dakUnitPrice)}/m² × {dakM2num} m²)
            </span>
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Binnenisolatie (interior insulation)                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-lg font-bold text-white">{labels.binnenTitle}</h3>
          <p className="text-sm text-gray-500">{labels.binnenDescription}</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">{labels.m2Label}</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              value={binnenState.m2}
              onChange={(e) => setBinnenState((s) => ({ ...s, m2: e.target.value }))}
              className="w-28 rounded bg-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
            />
            <span className="text-sm text-gray-400">m²</span>
          </div>
        </div>

        <ButtonGroup<BinnenType>
          label={labels.typeLabel}
          options={(["pir", "glaswol", "rockwool", "pur"] as BinnenType[]).map(
            (id) => ({ id, label: labels.binnenTypeOpts[id] })
          )}
          value={binnenState.type}
          onChange={(v) => setBinnenState((s) => ({ ...s, type: v }))}
        />

        <ButtonGroup<BinnenDikte>
          label={labels.dikteLabel}
          options={(["60mm", "80mm", "100mm", "120mm", "150mm"] as BinnenDikte[]).map(
            (id) => ({ id, label: id })
          )}
          value={binnenState.dikte}
          onChange={(v) => setBinnenState((s) => ({ ...s, dikte: v }))}
        />

        <YesNoToggle
          label={labels.gipsplaatLabel}
          value={binnenState.gipsplaat}
          onChange={(v) => setBinnenState((s) => ({ ...s, gipsplaat: v }))}
          yes={labels.yes}
          no={labels.no}
        />

        <YesNoToggle
          label={labels.dampremLabel}
          value={binnenState.damprem}
          onChange={(v) => setBinnenState((s) => ({ ...s, damprem: v }))}
          yes={labels.yes}
          no={labels.no}
        />

        {binnenM2num > 0 && (
          <p className="text-sm text-gray-400 border-t border-gray-700 pt-3">
            {labels.priceLabel}:{" "}
            <span className="font-semibold text-white">{formatEur(binnenUnitPrice * binnenM2num)}</span>{" "}
            <span className="text-gray-500">
              ({formatEur(binnenUnitPrice)}/m² × {binnenM2num} m²)
            </span>
          </p>
        )}
      </div>

    </div>
  );
}
