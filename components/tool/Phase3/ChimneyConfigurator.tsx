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

type KapType = "geen" | "rvs" | "alu" | "keramisch";
type RidgeWerk = "voegen" | "vervangen" | "nokpannen";
type RidgeAfdichting = "traditioneel" | "ventilerend";
type FlashingMateriaal = "lood" | "zink" | "aluminium";

interface ChimneyState {
  enabled: boolean;
  voegenM2: string;
  loodwerk: boolean;
  loodwerkMeters: string;
  kap: KapType;
  veger: boolean;
}

interface RidgeState {
  enabled: boolean;
  meters: string;
  werkzaamheid: RidgeWerk;
  afdichting: RidgeAfdichting;
}

interface FlashingState {
  enabled: boolean;
  meters: string;
  materiaal: FlashingMateriaal;
}

// ---------------------------------------------------------------------------
// Pricing helpers
// ---------------------------------------------------------------------------

const VAT = pricingData.meta.vatRate;

const chimneyCategory = pricingData.categories.find((c) => c.id === "chimney")!;
const chimneyItem = chimneyCategory.items.find((i) => i.id === "chimney_work")!;
const ridgeItem = chimneyCategory.items.find((i) => i.id === "ridge_work")!;
const flashingItem = chimneyCategory.items.find((i) => i.id === "flashings")!;

// Flat prices from pricing.json
const KAP_PRICES: Record<KapType, number> = { geen: 0, rvs: 185, alu: 145, keramisch: 225 };
const VEGER_PRICE = 120;
const LOODWERK_PER_M = 85;

const RIDGE_WERK_MOD: Record<RidgeWerk, number> = { voegen: 0, vervangen: 12, nokpannen: 18 };
const RIDGE_AFD_MOD: Record<RidgeAfdichting, number> = { traditioneel: 0, ventilerend: 8 };
const FLASHING_MAT_MOD: Record<FlashingMateriaal, number> = { lood: 0, zink: -8, aluminium: -12 };

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const t = {
  nl: {
    title: "Schoorsteen & Nokwerk",
    schoorsteen: "Schoorsteen",
    voegenM2: "Voegen bijwerken (m²)",
    loodwerk: "Loodwerk vervangen?",
    loodwerkMeters: "Strekkende meters loodwerk",
    kap: "Schoorsteenkap plaatsen/vervangen?",
    veger: "Schoorsteenveger inschakelen?",
    ridge: "Nokvorsten / nokafdichting",
    meters: "Strekkende meters",
    werkzaamheid: "Werkzaamheid",
    afdichting: "Type afdichting",
    flashings: "Kilgoten / dakvoeten (loodwerk)",
    materiaal: "Materiaal",
    yes: "Ja",
    no: "Nee",
    kapOpts: { geen: "Geen", rvs: "RVS", alu: "Aluminium", keramisch: "Keramisch" },
    ridgeWerkOpts: {
      voegen: "Voegen bijwerken",
      vervangen: "Nokpannen vervangen",
      nokpannen: "Nokpannen plaatsen (nieuw)",
    },
    ridgeAfdOpts: { traditioneel: "Traditioneel (mortel)", ventilerend: "Ventilerend systeem" },
    flashingMatOpts: { lood: "Lood", zink: "Zink", aluminium: "Aluminium" },
    enable: "Toevoegen",
    remove: "Verwijderen",
  },
  en: {
    title: "Chimney & Ridge Work",
    schoorsteen: "Chimney",
    voegenM2: "Repoint joints (m²)",
    loodwerk: "Replace lead flashing?",
    loodwerkMeters: "Linear metres of lead flashing",
    kap: "Install/replace chimney cap?",
    veger: "Hire chimney sweep?",
    ridge: "Ridge / ridge sealing",
    meters: "Linear metres",
    werkzaamheid: "Work type",
    afdichting: "Sealing type",
    flashings: "Valley gutters / flashings",
    materiaal: "Material",
    yes: "Yes",
    no: "No",
    kapOpts: { geen: "None", rvs: "Stainless steel", alu: "Aluminium", keramisch: "Ceramic" },
    ridgeWerkOpts: {
      voegen: "Repoint mortar",
      vervangen: "Replace ridge tiles",
      nokpannen: "Install ridge tiles (new)",
    },
    ridgeAfdOpts: { traditioneel: "Traditional (mortar)", ventilerend: "Ventilated system" },
    flashingMatOpts: { lood: "Lead", zink: "Zinc", aluminium: "Aluminium" },
    enable: "Add",
    remove: "Remove",
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

export default function ChimneyConfigurator({
  margins,
  onItemsChange,
  language,
}: ConfiguratorProps) {
  const lang = language;
  const labels = t[lang];

  const [chimney, setChimney] = useState<ChimneyState>({
    enabled: false,
    voegenM2: "",
    loodwerk: false,
    loodwerkMeters: "",
    kap: "geen",
    veger: false,
  });

  const [ridge, setRidge] = useState<RidgeState>({
    enabled: false,
    meters: "",
    werkzaamheid: "voegen",
    afdichting: "traditioneel",
  });

  const [flashing, setFlashing] = useState<FlashingState>({
    enabled: false,
    meters: "",
    materiaal: "lood",
  });

  // -------------------------------------------------------------------------
  // Build LineItems
  // -------------------------------------------------------------------------

  useEffect(() => {
    const items: LineItem[] = [];

    // --- Schoorsteen: voegen bijwerken ---
    if (chimney.enabled && parseFloat(chimney.voegenM2) > 0) {
      const qty = parseFloat(chimney.voegenM2);
      const unitPrice = applyMargins(chimneyItem.basePrice, margins, "material");
      items.push({
        id: "chimney_voegen",
        description: {
          nl: "Schoorsteen - Voegen bijwerken",
          en: "Chimney - Repoint joints",
          es: "Chimenea - Rejuntar",
        },
        unit: "m²",
        quantity: qty,
        unitPrice,
        total: unitPrice * qty,
        vatRate: VAT,
      });
    }

    // --- Schoorsteen: loodwerk ---
    if (chimney.enabled && chimney.loodwerk && parseFloat(chimney.loodwerkMeters) > 0) {
      const qty = parseFloat(chimney.loodwerkMeters);
      const unitPrice = applyMargins(LOODWERK_PER_M, margins, "material");
      items.push({
        id: "chimney_loodwerk",
        description: {
          nl: "Schoorsteen - Loodwerk vervangen",
          en: "Chimney - Replace lead flashing",
          es: "Chimenea - Sustituir vierteaguas de plomo",
        },
        unit: "m",
        quantity: qty,
        unitPrice,
        total: unitPrice * qty,
        vatRate: VAT,
      });
    }

    // --- Schoorsteenkap ---
    if (chimney.enabled && chimney.kap !== "geen") {
      const kapPrice = KAP_PRICES[chimney.kap];
      const unitPrice = applyMargins(kapPrice, margins, "material");
      const kapNl = labels.kapOpts[chimney.kap];
      const kapEn = t.en.kapOpts[chimney.kap];
      items.push({
        id: "chimney_kap",
        description: {
          nl: `Schoorsteenkap - ${kapNl}`,
          en: `Chimney cap - ${kapEn}`,
          es: `Sombrero de chimenea - ${kapNl}`,
        },
        unit: "stuk",
        quantity: 1,
        unitPrice,
        total: unitPrice,
        vatRate: VAT,
      });
    }

    // --- Schoorsteenveger ---
    if (chimney.enabled && chimney.veger) {
      const unitPrice = applyMargins(VEGER_PRICE, margins, "labor");
      items.push({
        id: "chimney_veger",
        description: {
          nl: "Schoorsteenveger",
          en: "Chimney sweep",
          es: "Deshollinador",
        },
        unit: "stuk",
        quantity: 1,
        unitPrice,
        total: unitPrice,
        vatRate: VAT,
      });
    }

    // --- Nokvorsten / nokafdichting ---
    if (ridge.enabled && parseFloat(ridge.meters) > 0) {
      const qty = parseFloat(ridge.meters);
      const basePerM =
        ridgeItem.basePrice +
        RIDGE_WERK_MOD[ridge.werkzaamheid] +
        RIDGE_AFD_MOD[ridge.afdichting];
      const unitPrice = applyMargins(basePerM, margins, "material");
      const werkNl = t.nl.ridgeWerkOpts[ridge.werkzaamheid];
      const werkEn = t.en.ridgeWerkOpts[ridge.werkzaamheid];
      const afdNl = t.nl.ridgeAfdOpts[ridge.afdichting];
      const afdEn = t.en.ridgeAfdOpts[ridge.afdichting];
      items.push({
        id: "ridge_work",
        description: {
          nl: `Nokvorsten - ${werkNl} - ${afdNl}`,
          en: `Ridge work - ${werkEn} - ${afdEn}`,
          es: `Caballete - ${werkNl} - ${afdNl}`,
        },
        unit: "m",
        quantity: qty,
        unitPrice,
        total: unitPrice * qty,
        vatRate: VAT,
      });
    }

    // --- Kilgoten / loodwerk ---
    if (flashing.enabled && parseFloat(flashing.meters) > 0) {
      const qty = parseFloat(flashing.meters);
      const basePerM = flashingItem.basePrice + FLASHING_MAT_MOD[flashing.materiaal];
      const unitPrice = applyMargins(basePerM, margins, "material");
      const matNl = t.nl.flashingMatOpts[flashing.materiaal];
      const matEn = t.en.flashingMatOpts[flashing.materiaal];
      items.push({
        id: "flashings",
        description: {
          nl: `Kilgoten / dakvoeten - ${matNl}`,
          en: `Valley gutters / flashings - ${matEn}`,
          es: `Limahoyas / vierteaguas - ${matNl}`,
        },
        unit: "m",
        quantity: qty,
        unitPrice,
        total: unitPrice * qty,
        vatRate: VAT,
      });
    }

    onItemsChange(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chimney, ridge, flashing, margins]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-bold text-white">{labels.title}</h3>

      {/* Schoorsteen */}
      <Section
        title={labels.schoorsteen}
        enabled={chimney.enabled}
        onToggle={() => setChimney((s) => ({ ...s, enabled: !s.enabled }))}
        lang={lang}
      >
        <div className="flex flex-col gap-4">
          <NumInput
            label={labels.voegenM2}
            value={chimney.voegenM2}
            onChange={(v) => setChimney((s) => ({ ...s, voegenM2: v }))}
            unit="m²"
          />

          <YesNo
            label={labels.loodwerk}
            value={chimney.loodwerk}
            onChange={(v) => setChimney((s) => ({ ...s, loodwerk: v }))}
            lang={lang}
          />
          {chimney.loodwerk && (
            <NumInput
              label={labels.loodwerkMeters}
              value={chimney.loodwerkMeters}
              onChange={(v) => setChimney((s) => ({ ...s, loodwerkMeters: v }))}
              unit="m"
            />
          )}

          <ButtonGroup<KapType>
            label={labels.kap}
            options={[
              { id: "geen", label: labels.kapOpts.geen },
              { id: "rvs", label: labels.kapOpts.rvs },
              { id: "alu", label: labels.kapOpts.alu },
              { id: "keramisch", label: labels.kapOpts.keramisch },
            ]}
            value={chimney.kap}
            onChange={(v) => setChimney((s) => ({ ...s, kap: v }))}
          />

          <YesNo
            label={labels.veger}
            value={chimney.veger}
            onChange={(v) => setChimney((s) => ({ ...s, veger: v }))}
            lang={lang}
          />
        </div>
      </Section>

      {/* Nokvorsten / nokafdichting */}
      <Section
        title={labels.ridge}
        enabled={ridge.enabled}
        onToggle={() => setRidge((s) => ({ ...s, enabled: !s.enabled }))}
        lang={lang}
      >
        <div className="flex flex-col gap-4">
          <NumInput
            label={labels.meters}
            value={ridge.meters}
            onChange={(v) => setRidge((s) => ({ ...s, meters: v }))}
            unit="m"
          />
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">{labels.werkzaamheid}</label>
            <select
              value={ridge.werkzaamheid}
              onChange={(e) =>
                setRidge((s) => ({ ...s, werkzaamheid: e.target.value as RidgeWerk }))
              }
              className="w-full rounded bg-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
            >
              {(["voegen", "vervangen", "nokpannen"] as RidgeWerk[]).map((w) => (
                <option key={w} value={w}>
                  {labels.ridgeWerkOpts[w]}
                </option>
              ))}
            </select>
          </div>
          <ButtonGroup<RidgeAfdichting>
            label={labels.afdichting}
            options={[
              { id: "traditioneel", label: labels.ridgeAfdOpts.traditioneel },
              { id: "ventilerend", label: labels.ridgeAfdOpts.ventilerend },
            ]}
            value={ridge.afdichting}
            onChange={(v) => setRidge((s) => ({ ...s, afdichting: v }))}
          />
        </div>
      </Section>

      {/* Kilgoten / dakvoeten */}
      <Section
        title={labels.flashings}
        enabled={flashing.enabled}
        onToggle={() => setFlashing((s) => ({ ...s, enabled: !s.enabled }))}
        lang={lang}
      >
        <div className="flex flex-col gap-4">
          <NumInput
            label={labels.meters}
            value={flashing.meters}
            onChange={(v) => setFlashing((s) => ({ ...s, meters: v }))}
            unit="m"
          />
          <ButtonGroup<FlashingMateriaal>
            label={labels.materiaal}
            options={[
              { id: "lood", label: labels.flashingMatOpts.lood },
              { id: "zink", label: labels.flashingMatOpts.zink },
              { id: "aluminium", label: labels.flashingMatOpts.aluminium },
            ]}
            value={flashing.materiaal}
            onChange={(v) => setFlashing((s) => ({ ...s, materiaal: v }))}
          />
        </div>
      </Section>
    </div>
  );
}
