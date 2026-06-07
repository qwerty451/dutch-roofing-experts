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

type VeluxMaat = "standaard_55x78" | "middel_78x118" | "groot_114x118" | "op_maat";
type VeluxWerk = "nieuw" | "vervangen" | "afdichten" | "onderhoud";
type DomeMaat = "60x60" | "80x80" | "100x100" | "op_maat";
type DomeType = "enkel" | "dubbel" | "triple_hr";
type PenetrationType = "ventilatie" | "elektra" | "data" | "warmtepomp";

interface VeluxState {
  enabled: boolean;
  maat: VeluxMaat;
  werkzaamheid: VeluxWerk;
  aantal: string;
  rolluik: boolean;
}

interface DomeState {
  enabled: boolean;
  maat: DomeMaat;
  type: DomeType;
  aantal: string;
  ventilerend: boolean;
  opstand: boolean;
}

interface PenetrationState {
  enabled: boolean;
  aantal: string;
  type: PenetrationType;
}

// ---------------------------------------------------------------------------
// Pricing helpers
// ---------------------------------------------------------------------------

const VAT = pricingData.meta.vatRate;

const skylightsCat = pricingData.categories.find((c) => c.id === "skylights")!;
const veluxItem = skylightsCat.items.find((i) => i.id === "velux_window")!;
const domeItem = skylightsCat.items.find((i) => i.id === "roof_dome")!;
const penetrationItem = skylightsCat.items.find((i) => i.id === "roof_penetrations")!;

const VELUX_MAAT_MOD: Record<VeluxMaat, number> = {
  standaard_55x78: 0,
  middel_78x118: 300,
  groot_114x118: 750,
  op_maat: 1350,
};
const VELUX_WERK_MOD: Record<VeluxWerk, number> = {
  nieuw: 0,
  vervangen: 80,
  afdichten: -280,
  onderhoud: -350,
};
const VELUX_ROLLUIK_PRICE = 225;

const DOME_MAAT_MOD: Record<DomeMaat, number> = {
  "60x60": 0,
  "80x80": 140,
  "100x100": 300,
  op_maat: 720,
};
const DOME_TYPE_MOD: Record<DomeType, number> = { enkel: 0, dubbel: 95, triple_hr: 195 };
const DOME_VENTILEREND_PRICE = 120;
const DOME_OPSTAND_PRICE = 185;

const PENETRATION_TYPE_MOD: Record<PenetrationType, number> = {
  ventilatie: 0,
  elektra: 15,
  data: 15,
  warmtepomp: 45,
};

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const t = {
  nl: {
    title: "Dakramen & Lichtkoepels",
    velux: "Velux / Dakraam",
    maat: "Maat",
    werkzaamheid: "Werkzaamheid",
    aantal: "Aantal",
    rolluik: "Rolluik / zonwering meenemen?",
    dome: "Lichtkoepel",
    typeGlass: "Type beglazing",
    ventilerend: "Ventilerend uitvoering?",
    opstand: "Inclusief opstand (opstort)?",
    penetrations: "Dakdoorvoeren",
    typeDoorvoer: "Type doorvoer",
    yes: "Ja",
    no: "Nee",
    veluxMaatOpts: {
      standaard_55x78: "Standaard (55×78cm)",
      middel_78x118: "Middel (78×118cm)",
      groot_114x118: "Groot (114×118cm)",
      op_maat: "Op maat",
    },
    veluxWerkOpts: {
      nieuw: "Nieuw plaatsen",
      vervangen: "Vervangen",
      afdichten: "Afdichten / repareren",
      onderhoud: "Onderhoud",
    },
    domeMaatOpts: {
      "60x60": "60×60cm",
      "80x80": "80×80cm",
      "100x100": "100×100cm",
      op_maat: "Op maat",
    },
    domeTypeOpts: { enkel: "Enkel", dubbel: "Dubbel", triple_hr: "Triple HR" },
    penetrationTypeOpts: {
      ventilatie: "Ventilatiedoorvoer",
      elektra: "Elektra",
      data: "Data / internet",
      warmtepomp: "Warmtepomp",
    },
    enable: "Toevoegen",
    remove: "Verwijderen",
    stuks: "stuks",
  },
  en: {
    title: "Skylights & Roof Domes",
    velux: "Velux / Roof Window",
    maat: "Size",
    werkzaamheid: "Work type",
    aantal: "Quantity",
    rolluik: "Include roller blind / shading?",
    dome: "Roof Dome",
    typeGlass: "Glazing type",
    ventilerend: "Ventilating model?",
    opstand: "Include upstand (kerb)?",
    penetrations: "Roof Penetrations",
    typeDoorvoer: "Penetration type",
    yes: "Yes",
    no: "No",
    veluxMaatOpts: {
      standaard_55x78: "Standard (55×78cm)",
      middel_78x118: "Medium (78×118cm)",
      groot_114x118: "Large (114×118cm)",
      op_maat: "Custom size",
    },
    veluxWerkOpts: {
      nieuw: "New installation",
      vervangen: "Replace",
      afdichten: "Seal / repair",
      onderhoud: "Maintenance",
    },
    domeMaatOpts: {
      "60x60": "60×60cm",
      "80x80": "80×80cm",
      "100x100": "100×100cm",
      op_maat: "Custom size",
    },
    domeTypeOpts: { enkel: "Single glazed", dubbel: "Double glazed", triple_hr: "Triple HR" },
    penetrationTypeOpts: {
      ventilatie: "Ventilation",
      elektra: "Electrical",
      data: "Data / internet",
      warmtepomp: "Heat pump",
    },
    enable: "Add",
    remove: "Remove",
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

export default function SkylightsConfigurator({
  margins,
  onItemsChange,
  language,
}: ConfiguratorProps) {
  const lang = language;
  const labels = t[lang];

  const [velux, setVelux] = useState<VeluxState>({
    enabled: false,
    maat: "standaard_55x78",
    werkzaamheid: "nieuw",
    aantal: "",
    rolluik: false,
  });

  const [dome, setDome] = useState<DomeState>({
    enabled: false,
    maat: "60x60",
    type: "enkel",
    aantal: "",
    ventilerend: false,
    opstand: false,
  });

  const [penetration, setPenetration] = useState<PenetrationState>({
    enabled: false,
    aantal: "",
    type: "ventilatie",
  });

  // -------------------------------------------------------------------------
  // Build LineItems
  // -------------------------------------------------------------------------

  useEffect(() => {
    const items: LineItem[] = [];

    // --- Velux / dakraam ---
    if (velux.enabled && parseInt(velux.aantal) > 0) {
      const qty = parseInt(velux.aantal);
      const basePerUnit =
        veluxItem.basePrice + VELUX_MAAT_MOD[velux.maat] + VELUX_WERK_MOD[velux.werkzaamheid];
      const unitPrice = applyMargins(Math.max(basePerUnit, 0), margins, "material");
      const maatNl = t.nl.veluxMaatOpts[velux.maat];
      const maatEn = t.en.veluxMaatOpts[velux.maat];
      const werkNl = t.nl.veluxWerkOpts[velux.werkzaamheid];
      const werkEn = t.en.veluxWerkOpts[velux.werkzaamheid];

      items.push({
        id: "skylight_velux",
        description: {
          nl: `Velux / Dakraam - ${maatNl} - ${werkNl}`,
          en: `Velux / Roof Window - ${maatEn} - ${werkEn}`,
          es: `Velux / Ventana de tejado - ${maatNl} - ${werkNl}`,
        },
        unit: "stuks",
        quantity: qty,
        unitPrice,
        total: unitPrice * qty,
        vatRate: VAT,
      });

      // Rolluik add-on (per unit)
      if (velux.rolluik) {
        const rolluikPrice = applyMargins(VELUX_ROLLUIK_PRICE, margins, "material");
        items.push({
          id: "skylight_velux_rolluik",
          description: {
            nl: "Rolluik / Zonwering (per dakraam)",
            en: "Roller blind / Shading (per window)",
            es: "Persiana / Protección solar (por ventana)",
          },
          unit: "stuks",
          quantity: qty,
          unitPrice: rolluikPrice,
          total: rolluikPrice * qty,
          vatRate: VAT,
        });
      }
    }

    // --- Lichtkoepel ---
    if (dome.enabled && parseInt(dome.aantal) > 0) {
      const qty = parseInt(dome.aantal);
      const basePerUnit =
        domeItem.basePrice + DOME_MAAT_MOD[dome.maat] + DOME_TYPE_MOD[dome.type];
      const unitPrice = applyMargins(basePerUnit, margins, "material");
      const maatNl = t.nl.domeMaatOpts[dome.maat];
      const maatEn = t.en.domeMaatOpts[dome.maat];
      const typeNl = t.nl.domeTypeOpts[dome.type];
      const typeEn = t.en.domeTypeOpts[dome.type];

      items.push({
        id: "skylight_dome",
        description: {
          nl: `Lichtkoepel - ${maatNl} - ${typeNl}`,
          en: `Roof Dome - ${maatEn} - ${typeEn}`,
          es: `Lucernario - ${maatNl} - ${typeNl}`,
        },
        unit: "stuks",
        quantity: qty,
        unitPrice,
        total: unitPrice * qty,
        vatRate: VAT,
      });

      // Ventilerend add-on
      if (dome.ventilerend) {
        const ventPrice = applyMargins(DOME_VENTILEREND_PRICE, margins, "material");
        items.push({
          id: "skylight_dome_ventilerend",
          description: {
            nl: "Lichtkoepel - Ventilerend (meerprijs per stuk)",
            en: "Roof Dome - Ventilating (surcharge per unit)",
            es: "Lucernario - Ventilado (suplemento por unidad)",
          },
          unit: "stuks",
          quantity: qty,
          unitPrice: ventPrice,
          total: ventPrice * qty,
          vatRate: VAT,
        });
      }

      // Opstand add-on
      if (dome.opstand) {
        const opstandPrice = applyMargins(DOME_OPSTAND_PRICE, margins, "material");
        items.push({
          id: "skylight_dome_opstand",
          description: {
            nl: "Lichtkoepel - Opstand / opstort (per stuk)",
            en: "Roof Dome - Upstand / kerb (per unit)",
            es: "Lucernario - Zócalo (por unidad)",
          },
          unit: "stuks",
          quantity: qty,
          unitPrice: opstandPrice,
          total: opstandPrice * qty,
          vatRate: VAT,
        });
      }
    }

    // --- Dakdoorvoeren ---
    if (penetration.enabled && parseInt(penetration.aantal) > 0) {
      const qty = parseInt(penetration.aantal);
      const basePerUnit = penetrationItem.basePrice + PENETRATION_TYPE_MOD[penetration.type];
      const unitPrice = applyMargins(basePerUnit, margins, "material");
      const typeNl = t.nl.penetrationTypeOpts[penetration.type];
      const typeEn = t.en.penetrationTypeOpts[penetration.type];

      items.push({
        id: "roof_penetrations",
        description: {
          nl: `Dakdoorvoer - ${typeNl}`,
          en: `Roof penetration - ${typeEn}`,
          es: `Paso de cubierta - ${typeNl}`,
        },
        unit: "stuks",
        quantity: qty,
        unitPrice,
        total: unitPrice * qty,
        vatRate: VAT,
      });
    }

    onItemsChange(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [velux, dome, penetration, margins]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-bold text-white">{labels.title}</h3>

      {/* Velux / dakraam */}
      <Section
        title={labels.velux}
        enabled={velux.enabled}
        onToggle={() => setVelux((s) => ({ ...s, enabled: !s.enabled }))}
        lang={lang}
      >
        <div className="flex flex-col gap-4">
          <ButtonGroup<VeluxMaat>
            label={labels.maat}
            options={[
              { id: "standaard_55x78", label: labels.veluxMaatOpts.standaard_55x78 },
              { id: "middel_78x118", label: labels.veluxMaatOpts.middel_78x118 },
              { id: "groot_114x118", label: labels.veluxMaatOpts.groot_114x118 },
              { id: "op_maat", label: labels.veluxMaatOpts.op_maat },
            ]}
            value={velux.maat}
            onChange={(v) => setVelux((s) => ({ ...s, maat: v }))}
          />
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">{labels.werkzaamheid}</label>
            <select
              value={velux.werkzaamheid}
              onChange={(e) =>
                setVelux((s) => ({ ...s, werkzaamheid: e.target.value as VeluxWerk }))
              }
              className="w-full rounded bg-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
            >
              {(["nieuw", "vervangen", "afdichten", "onderhoud"] as VeluxWerk[]).map((w) => (
                <option key={w} value={w}>
                  {labels.veluxWerkOpts[w]}
                </option>
              ))}
            </select>
          </div>
          <NumInput
            label={labels.aantal}
            value={velux.aantal}
            onChange={(v) => setVelux((s) => ({ ...s, aantal: v }))}
            unit={labels.stuks}
          />
          <YesNo
            label={labels.rolluik}
            value={velux.rolluik}
            onChange={(v) => setVelux((s) => ({ ...s, rolluik: v }))}
            lang={lang}
          />
        </div>
      </Section>

      {/* Lichtkoepel */}
      <Section
        title={labels.dome}
        enabled={dome.enabled}
        onToggle={() => setDome((s) => ({ ...s, enabled: !s.enabled }))}
        lang={lang}
      >
        <div className="flex flex-col gap-4">
          <ButtonGroup<DomeMaat>
            label={labels.maat}
            options={[
              { id: "60x60", label: labels.domeMaatOpts["60x60"] },
              { id: "80x80", label: labels.domeMaatOpts["80x80"] },
              { id: "100x100", label: labels.domeMaatOpts["100x100"] },
              { id: "op_maat", label: labels.domeMaatOpts.op_maat },
            ]}
            value={dome.maat}
            onChange={(v) => setDome((s) => ({ ...s, maat: v }))}
          />
          <ButtonGroup<DomeType>
            label={labels.typeGlass}
            options={[
              { id: "enkel", label: labels.domeTypeOpts.enkel },
              { id: "dubbel", label: labels.domeTypeOpts.dubbel },
              { id: "triple_hr", label: labels.domeTypeOpts.triple_hr },
            ]}
            value={dome.type}
            onChange={(v) => setDome((s) => ({ ...s, type: v }))}
          />
          <NumInput
            label={labels.aantal}
            value={dome.aantal}
            onChange={(v) => setDome((s) => ({ ...s, aantal: v }))}
            unit={labels.stuks}
          />
          <YesNo
            label={labels.ventilerend}
            value={dome.ventilerend}
            onChange={(v) => setDome((s) => ({ ...s, ventilerend: v }))}
            lang={lang}
          />
          <YesNo
            label={labels.opstand}
            value={dome.opstand}
            onChange={(v) => setDome((s) => ({ ...s, opstand: v }))}
            lang={lang}
          />
        </div>
      </Section>

      {/* Dakdoorvoeren */}
      <Section
        title={labels.penetrations}
        enabled={penetration.enabled}
        onToggle={() => setPenetration((s) => ({ ...s, enabled: !s.enabled }))}
        lang={lang}
      >
        <div className="flex flex-col gap-4">
          <NumInput
            label={labels.aantal}
            value={penetration.aantal}
            onChange={(v) => setPenetration((s) => ({ ...s, aantal: v }))}
            unit={labels.stuks}
          />
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">{labels.typeDoorvoer}</label>
            <select
              value={penetration.type}
              onChange={(e) =>
                setPenetration((s) => ({ ...s, type: e.target.value as PenetrationType }))
              }
              className="w-full rounded bg-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
            >
              {(["ventilatie", "elektra", "data", "warmtepomp"] as PenetrationType[]).map((t) => (
                <option key={t} value={t}>
                  {labels.penetrationTypeOpts[t]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Section>
    </div>
  );
}
