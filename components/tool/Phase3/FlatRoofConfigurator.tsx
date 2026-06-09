'use client';

import { useState, useCallback, useEffect } from 'react';
import type { LineItem, Margins } from '../../../types/tool';
import { applyMargins } from '../../../lib/pricing';
import pricingData from '../../../pricing.json';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FlatRoofConfiguratorProps {
  margins: Margins;
  onItemsChange: (items: LineItem[]) => void;
  language: 'nl' | 'en';
}

// ---------------------------------------------------------------------------
// Helper types for isolation sub-options
// ---------------------------------------------------------------------------

type IsolatieThickness = '60mm' | '80mm' | '100mm' | '120mm';
type IsolatieType = 'EPS' | 'PIR' | 'PUR';

interface IsolatieOptions {
  dikte: IsolatieThickness;
  type: IsolatieType;
}

// Per-section price multipliers for insulation thickness
const ISOLATIE_DIKTE_MULTIPLIER: Record<IsolatieThickness, number> = {
  '60mm': 1.0,
  '80mm': 1.15,
  '100mm': 1.3,
  '120mm': 1.45,
};

// Per-section price modifiers for insulation type (€/m²)
const ISOLATIE_TYPE_MODIFIER: Record<IsolatieType, number> = {
  EPS: 0,
  PIR: 6,
  PUR: 8,
};

const ISOLATIE_BASE_PRICE = 14; // €/m² base for insulation add-on

// ---------------------------------------------------------------------------
// Pricing look-ups from pricing.json
// ---------------------------------------------------------------------------

const flatRoofCat = pricingData.categories.find((c) => c.id === 'flat_roof');

function getItem(id: string) {
  return flatRoofCat?.items.find((i) => i.id === id);
}

function getOptionChoice(
  itemId: string,
  optionKey: string,
  choiceId: string
): number {
  const item = getItem(itemId);
  if (!item || !("options" in item) || !item.options) return 0;
  const opts = item.options as Record<string, { choices?: Array<{ id: string; priceModifier?: number }> }>;
  const option = opts[optionKey] as
    | { choices?: Array<{ id: string; priceModifier?: number }> }
    | undefined;
  const choice = option?.choices?.find((c) => c.id === choiceId);
  return choice?.priceModifier ?? 0;
}

// ---------------------------------------------------------------------------
// Accordion section wrapper
// ---------------------------------------------------------------------------

interface AccordionSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  hasValues: boolean;
  children: React.ReactNode;
}

function AccordionSection({
  title,
  isOpen,
  onToggle,
  hasValues,
  children,
}: AccordionSectionProps) {
  return (
    <div className="rounded-xl border border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-4 bg-gray-800 hover:bg-gray-750 transition-colors"
        style={{ minHeight: '3rem' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold text-base">{title}</span>
          {hasValues && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#d4af37', color: '#000' }}
            >
              ✓
            </span>
          )}
        </div>
        <span className="text-gray-400 text-lg">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="bg-gray-900 px-4 py-5 flex flex-col gap-5">{children}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared field components
// ---------------------------------------------------------------------------

interface LabelProps {
  children: React.ReactNode;
}
function FieldLabel({ children }: LabelProps) {
  return (
    <span className="text-gray-400 text-sm font-medium">{children}</span>
  );
}

interface NumberInputProps {
  value: number | '';
  onChange: (v: number | '') => void;
  label: string;
  unit?: string;
  min?: number;
  placeholder?: string;
}

function NumberInput({ value, onChange, label, unit, min = 0, placeholder }: NumberInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          value={value === '' ? '' : value}
          placeholder={placeholder ?? '0'}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '') {
              onChange('');
            } else {
              const n = parseFloat(raw);
              onChange(isNaN(n) ? '' : n);
            }
          }}
          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-base focus:outline-none focus:border-yellow-500 w-32"
          style={{ minHeight: '2.75rem' }}
        />
        {unit && <span className="text-gray-400 text-sm">{unit}</span>}
      </div>
    </div>
  );
}

interface ButtonGroupProps<T extends string> {
  label: string;
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}

function ButtonGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: ButtonGroupProps<T>) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isActive = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={
                isActive
                  ? { backgroundColor: '#d4af37', color: '#000' }
                  : { backgroundColor: '#1f2937', color: '#9ca3af' }
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface ToggleProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  note?: string;
  yes?: string;
  no?: string;
}

function Toggle({ label, value, onChange, note, yes = 'Ja', no = 'Nee' }: ToggleProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      {note && <span className="text-gray-500 text-xs">{note}</span>}
      <div className="flex gap-2">
        {[{ l: yes, v: true }, { l: no, v: false }].map(({ l, v }) => {
          const isActive = value === v;
          return (
            <button
              key={l}
              type="button"
              onClick={() => onChange(v)}
              className="h-11 px-5 rounded-lg text-sm font-semibold transition-colors"
              style={
                isActive
                  ? { backgroundColor: '#d4af37', color: '#000' }
                  : { backgroundColor: '#1f2937', color: '#9ca3af' }
              }
            >
              {l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Insulation sub-form (shared across Bitumen and EPDM)
// ---------------------------------------------------------------------------

interface InsulationFormProps {
  options: IsolatieOptions;
  onChange: (opts: IsolatieOptions) => void;
  lang?: 'nl' | 'en';
}

function InsulationForm({ options, onChange, lang = 'nl' }: InsulationFormProps) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-3 flex flex-col gap-4">
      <span className="text-gray-300 text-xs font-semibold uppercase tracking-wide">
        {lang === 'nl' ? 'Isolatie-opties' : 'Insulation options'}
      </span>
      <ButtonGroup<IsolatieThickness>
        label={lang === 'nl' ? 'Dikte' : 'Thickness'}
        options={[
          { id: '60mm', label: '60mm' },
          { id: '80mm', label: '80mm' },
          { id: '100mm', label: '100mm' },
          { id: '120mm', label: '120mm' },
        ]}
        value={options.dikte}
        onChange={(v) => onChange({ ...options, dikte: v })}
      />
      <ButtonGroup<IsolatieType>
        label={lang === 'nl' ? 'Type isolatie' : 'Insulation type'}
        options={[
          { id: 'EPS', label: 'EPS' },
          { id: 'PIR', label: 'PIR' },
          { id: 'PUR', label: 'PUR' },
        ]}
        value={options.type}
        onChange={(v) => onChange({ ...options, type: v })}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bitumen sub-section state + computation
// ---------------------------------------------------------------------------

type BitumenLagen = '1_laags' | '2_laags' | '3_laags';
type BitumenKwaliteit = 'standaard' | 'sbs' | 'app';
type BitumenDikte = '3mm' | '4mm' | '5mm';
type BitumenAfwerking = 'zand' | 'leisteen' | 'alu_folie';

interface BitumenState {
  m2: number | '';
  lagen: BitumenLagen;
  kwaliteit: BitumenKwaliteit;
  dikte: BitumenDikte;
  afwerking: BitumenAfwerking;
  isolatie: boolean;
  isolatieOpts: IsolatieOptions;
  verwijderen: boolean;
}

function computeBitumenItems(state: BitumenState, margins: Margins): LineItem[] {
  const m2 = state.m2 === '' ? 0 : state.m2;
  if (m2 <= 0) return [];

  const item = getItem('bitumen');
  const basePrice = item?.basePrice ?? 38;

  const lagenMod = getOptionChoice('bitumen', 'lagen', state.lagen);
  const kwalMod = getOptionChoice('bitumen', 'kwaliteit', state.kwaliteit);
  const dikteMod = getOptionChoice('bitumen', 'dikte', state.dikte);
  const afwMod = getOptionChoice('bitumen', 'afwerking', state.afwerking);

  const unitBase = basePrice + lagenMod + kwalMod + dikteMod + afwMod;
  const unitPrice = applyMargins(unitBase, margins, 'material');

  // Human-readable labels
  const lagenLabels: Record<BitumenLagen, { nl: string; en: string; es: string }> = {
    '1_laags': { nl: '1-laags', en: 'Single layer', es: '1 capa' },
    '2_laags': { nl: '2-laags', en: 'Double layer', es: '2 capas' },
    '3_laags': { nl: '3-laags', en: 'Triple layer', es: '3 capas' },
  };
  const kwalLabels: Record<BitumenKwaliteit, { nl: string; en: string; es: string }> = {
    standaard: { nl: 'Standaard', en: 'Standard', es: 'Estándar' },
    sbs: { nl: 'SBS Gemodificeerd', en: 'SBS Modified', es: 'SBS Modificado' },
    app: { nl: 'APP Gemodificeerd', en: 'APP Modified', es: 'APP Modificado' },
  };
  const afwLabels: Record<BitumenAfwerking, { nl: string; en: string; es: string }> = {
    zand: { nl: 'Zand', en: 'Sand', es: 'Arena' },
    leisteen: { nl: 'Leisteen', en: 'Slate finish', es: 'Pizarra' },
    alu_folie: { nl: 'Alu-folie', en: 'Aluminium foil', es: 'Papel aluminio' },
  };

  const items: LineItem[] = [
    {
      id: 'flatroof_bitumen_material',
      description: {
        nl: `Bitumen dakbedekking - ${lagenLabels[state.lagen].nl} ${kwalLabels[state.kwaliteit].nl} ${state.dikte} ${afwLabels[state.afwerking].nl}`,
        en: `Bitumen roofing - ${lagenLabels[state.lagen].en} ${kwalLabels[state.kwaliteit].en} ${state.dikte} ${afwLabels[state.afwerking].en}`,
        es: `Cubierta de betún - ${lagenLabels[state.lagen].es} ${kwalLabels[state.kwaliteit].es} ${state.dikte} ${afwLabels[state.afwerking].es}`,
      },
      unit: 'm²',
      quantity: m2,
      unitPrice,
      total: unitPrice * m2,
      vatRate: 0.21,
    },
  ];

  if (state.isolatie) {
    const isoBase =
      (ISOLATIE_BASE_PRICE + ISOLATIE_TYPE_MODIFIER[state.isolatieOpts.type]) *
      ISOLATIE_DIKTE_MULTIPLIER[state.isolatieOpts.dikte];
    const isoUnitPrice = applyMargins(isoBase, margins, 'material');
    items.push({
      id: 'flatroof_bitumen_insulation',
      description: {
        nl: `Isolatie (${state.isolatieOpts.type} ${state.isolatieOpts.dikte}) bij bitumen dak`,
        en: `Insulation (${state.isolatieOpts.type} ${state.isolatieOpts.dikte}) with bitumen roof`,
        es: `Aislamiento (${state.isolatieOpts.type} ${state.isolatieOpts.dikte}) con cubierta de betún`,
      },
      unit: 'm²',
      quantity: m2,
      unitPrice: isoUnitPrice,
      total: isoUnitPrice * m2,
      vatRate: 0.21,
    });
  }

  if (state.verwijderen) {
    const remMod = getOptionChoice('bitumen', 'verwijderen', 'verwijderen');
    // pricePerM2WhenTrue = 9
    const verwijderenBase = 9 + (remMod > 0 ? remMod : 0);
    const remUnitPrice = applyMargins(verwijderenBase, margins, 'labor');
    items.push({
      id: 'flatroof_bitumen_removal',
      description: {
        nl: 'Dakbedekking verwijderen (bitumen)',
        en: 'Remove existing roofing (bitumen)',
        es: 'Retirar cubierta existente (betún)',
      },
      unit: 'm²',
      quantity: m2,
      unitPrice: remUnitPrice,
      total: remUnitPrice * m2,
      vatRate: 0.21,
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// EPDM sub-section state + computation
// ---------------------------------------------------------------------------

type EpdmDikte = '1_0mm' | '1_2mm' | '1_5mm';
type EpdmBevestiging = 'gelijmd' | 'mechanisch' | 'ballast';

interface EpdmState {
  m2: number | '';
  dikte: EpdmDikte;
  bevestiging: EpdmBevestiging;
  isolatie: boolean;
  isolatieOpts: IsolatieOptions;
  verwijderen: boolean;
}

function computeEpdmItems(state: EpdmState, margins: Margins): LineItem[] {
  const m2 = state.m2 === '' ? 0 : state.m2;
  if (m2 <= 0) return [];

  const item = getItem('epdm');
  const basePrice = item?.basePrice ?? 42;

  const dikteMod = getOptionChoice('epdm', 'dikte', state.dikte);
  const bevMod = getOptionChoice('epdm', 'bevestiging', state.bevestiging);

  const unitBase = basePrice + dikteMod + bevMod;
  const unitPrice = applyMargins(unitBase, margins, 'material');

  const dikteLabels: Record<EpdmDikte, string> = {
    '1_0mm': '1.0mm',
    '1_2mm': '1.2mm',
    '1_5mm': '1.5mm',
  };
  const bevLabels: Record<EpdmBevestiging, { nl: string; en: string; es: string }> = {
    gelijmd: { nl: 'Gelijmd', en: 'Glued', es: 'Encolado' },
    mechanisch: { nl: 'Mechanisch', en: 'Mechanical', es: 'Mecánico' },
    ballast: { nl: 'Ballast', en: 'Ballast', es: 'Lastre' },
  };

  const items: LineItem[] = [
    {
      id: 'flatroof_epdm_material',
      description: {
        nl: `EPDM rubber dak - ${dikteLabels[state.dikte]} ${bevLabels[state.bevestiging].nl}`,
        en: `EPDM rubber roof - ${dikteLabels[state.dikte]} ${bevLabels[state.bevestiging].en}`,
        es: `Cubierta EPDM - ${dikteLabels[state.dikte]} ${bevLabels[state.bevestiging].es}`,
      },
      unit: 'm²',
      quantity: m2,
      unitPrice,
      total: unitPrice * m2,
      vatRate: 0.21,
    },
  ];

  if (state.isolatie) {
    const isoBase =
      (ISOLATIE_BASE_PRICE + ISOLATIE_TYPE_MODIFIER[state.isolatieOpts.type]) *
      ISOLATIE_DIKTE_MULTIPLIER[state.isolatieOpts.dikte];
    const isoUnitPrice = applyMargins(isoBase, margins, 'material');
    items.push({
      id: 'flatroof_epdm_insulation',
      description: {
        nl: `Isolatie (${state.isolatieOpts.type} ${state.isolatieOpts.dikte}) bij EPDM dak`,
        en: `Insulation (${state.isolatieOpts.type} ${state.isolatieOpts.dikte}) with EPDM roof`,
        es: `Aislamiento (${state.isolatieOpts.type} ${state.isolatieOpts.dikte}) con cubierta EPDM`,
      },
      unit: 'm²',
      quantity: m2,
      unitPrice: isoUnitPrice,
      total: isoUnitPrice * m2,
      vatRate: 0.21,
    });
  }

  if (state.verwijderen) {
    // pricePerM2WhenTrue = 9 (same as bitumen)
    const remUnitPrice = applyMargins(9, margins, 'labor');
    items.push({
      id: 'flatroof_epdm_removal',
      description: {
        nl: 'Oude bedekking verwijderen (EPDM)',
        en: 'Remove old roofing (EPDM)',
        es: 'Retirar cubierta antigua (EPDM)',
      },
      unit: 'm²',
      quantity: m2,
      unitPrice: remUnitPrice,
      total: remUnitPrice * m2,
      vatRate: 0.21,
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Grind/Ballast sub-section state + computation
// ---------------------------------------------------------------------------

type GrindlaagDikte = 'standaard' | 'extra_dik';

interface GrindState {
  m2: number | '';
  grindlaag: GrindlaagDikte;
  vlieslaag: boolean;
}

function computeGrindItems(state: GrindState, margins: Margins): LineItem[] {
  const m2 = state.m2 === '' ? 0 : state.m2;
  if (m2 <= 0) return [];

  const item = getItem('grind_ballast');
  const basePrice = item?.basePrice ?? 25;

  const grindMod = getOptionChoice('grind_ballast', 'grindlaag', state.grindlaag);
  let unitBase = basePrice + grindMod;
  if (state.vlieslaag) unitBase += 5; // pricePerM2WhenTrue: 5

  const unitPrice = applyMargins(unitBase, margins, 'material');

  const grindLabel: Record<GrindlaagDikte, { nl: string; en: string; es: string }> = {
    standaard: { nl: 'Standaard', en: 'Standard', es: 'Estándar' },
    extra_dik: { nl: 'Extra dik', en: 'Extra thick', es: 'Extra grueso' },
  };

  return [
    {
      id: 'flatroof_grind_material',
      description: {
        nl: `Grind / Ballastdak - ${grindLabel[state.grindlaag].nl}${state.vlieslaag ? ', vlieslaag vernieuwd' : ''}`,
        en: `Gravel / Ballast roof - ${grindLabel[state.grindlaag].en}${state.vlieslaag ? ', fleece layer renewed' : ''}`,
        es: `Cubierta de grava - ${grindLabel[state.grindlaag].es}${state.vlieslaag ? ', capa de fieltro renovada' : ''}`,
      },
      unit: 'm²',
      quantity: m2,
      unitPrice,
      total: unitPrice * m2,
      vatRate: 0.21,
    },
  ];
}

// ---------------------------------------------------------------------------
// Liquid coating sub-section state + computation
// ---------------------------------------------------------------------------

type CoatingType = 'pur' | 'pmma';
type CoatingLagen = '1' | '2' | '3';

interface CoatingState {
  m2: number | '';
  type: CoatingType;
  lagen: CoatingLagen;
}

function computeCoatingItems(state: CoatingState, margins: Margins): LineItem[] {
  const m2 = state.m2 === '' ? 0 : state.m2;
  if (m2 <= 0) return [];

  const item = getItem('liquid_coating');
  const basePrice = item?.basePrice ?? 18;

  const typeMod = getOptionChoice('liquid_coating', 'type', state.type);
  const lagenMod = getOptionChoice('liquid_coating', 'lagen', state.lagen);

  const unitBase = basePrice + typeMod + lagenMod;
  const unitPrice = applyMargins(unitBase, margins, 'material');

  const typeLabels: Record<CoatingType, { nl: string; en: string; es: string }> = {
    pur: { nl: 'Polyurethaan (PUR)', en: 'Polyurethane (PUR)', es: 'Poliuretano (PUR)' },
    pmma: { nl: 'PMMA acrylaat', en: 'PMMA acrylate', es: 'Acrilato PMMA' },
  };
  const lagenLabels: Record<CoatingLagen, { nl: string; en: string; es: string }> = {
    '1': { nl: '1 laag', en: '1 layer', es: '1 capa' },
    '2': { nl: '2 lagen', en: '2 layers', es: '2 capas' },
    '3': { nl: '3 lagen', en: '3 layers', es: '3 capas' },
  };

  return [
    {
      id: 'flatroof_coating_material',
      description: {
        nl: `Liquid roofing / coating - ${typeLabels[state.type].nl} ${lagenLabels[state.lagen].nl}`,
        en: `Liquid roofing / coating - ${typeLabels[state.type].en} ${lagenLabels[state.lagen].en}`,
        es: `Impermeabilización líquida - ${typeLabels[state.type].es} ${lagenLabels[state.lagen].es}`,
      },
      unit: 'm²',
      quantity: m2,
      unitPrice,
      total: unitPrice * m2,
      vatRate: 0.21,
    },
  ];
}

// ---------------------------------------------------------------------------
// Default isolation options
// ---------------------------------------------------------------------------

const DEFAULT_ISOLATIE: IsolatieOptions = { dikte: '80mm', type: 'PIR' };

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function FlatRoofConfigurator({
  margins,
  onItemsChange,
  language,
}: FlatRoofConfiguratorProps) {
  // Accordion open/close state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    bitumen: false,
    epdm: false,
    grind: false,
    coating: false,
  });

  // Sub-section states
  const [bitumen, setBitumen] = useState<BitumenState>({
    m2: '',
    lagen: '2_laags',
    kwaliteit: 'standaard',
    dikte: '3mm',
    afwerking: 'zand',
    isolatie: false,
    isolatieOpts: DEFAULT_ISOLATIE,
    verwijderen: false,
  });

  const [epdm, setEpdm] = useState<EpdmState>({
    m2: '',
    dikte: '1_2mm',
    bevestiging: 'gelijmd',
    isolatie: false,
    isolatieOpts: DEFAULT_ISOLATIE,
    verwijderen: false,
  });

  const [grind, setGrind] = useState<GrindState>({
    m2: '',
    grindlaag: 'standaard',
    vlieslaag: false,
  });

  const [coating, setCoating] = useState<CoatingState>({
    m2: '',
    type: 'pur',
    lagen: '1',
  });

  // Aggregate all items and notify parent
  const aggregateItems = useCallback(
    (
      b: BitumenState,
      e: EpdmState,
      g: GrindState,
      c: CoatingState
    ): LineItem[] => {
      return [
        ...computeBitumenItems(b, margins),
        ...computeEpdmItems(e, margins),
        ...computeGrindItems(g, margins),
        ...computeCoatingItems(c, margins),
      ];
    },
    [margins]
  );

  useEffect(() => {
    onItemsChange(aggregateItems(bitumen, epdm, grind, coating));
  }, [bitumen, epdm, grind, coating, aggregateItems, onItemsChange]);

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function hasValues(section: 'bitumen' | 'epdm' | 'grind' | 'coating'): boolean {
    switch (section) {
      case 'bitumen':
        return (bitumen.m2 !== '' && bitumen.m2 > 0);
      case 'epdm':
        return (epdm.m2 !== '' && epdm.m2 > 0);
      case 'grind':
        return (grind.m2 !== '' && grind.m2 > 0);
      case 'coating':
        return (coating.m2 !== '' && coating.m2 > 0);
    }
  }

  const nl = language === 'nl';
  const yes = nl ? 'Ja' : 'Yes';
  const no = nl ? 'Nee' : 'No';
  const removeNote = nl ? 'Verwijdering & afvoer van bestaande dakbedekking' : 'Removal & disposal of existing roofing';

  return (
    <div className="flex flex-col gap-4">
      {/* A. Bitumen */}
      <AccordionSection
        title={nl ? 'Bitumen dakbedekking' : 'Bitumen roofing'}
        isOpen={openSections.bitumen}
        onToggle={() => toggleSection('bitumen')}
        hasValues={hasValues('bitumen')}
      >
        <NumberInput label={nl ? 'Oppervlakte' : 'Surface area'} unit="m²" value={bitumen.m2} onChange={(v) => setBitumen((s) => ({ ...s, m2: v }))} />
        <ButtonGroup<BitumenLagen>
          label={nl ? 'Aantal lagen' : 'Number of layers'}
          options={[
            { id: '1_laags', label: nl ? '1-laags' : 'Single layer' },
            { id: '2_laags', label: nl ? '2-laags' : 'Double layer' },
            { id: '3_laags', label: nl ? '3-laags' : 'Triple layer' },
          ]}
          value={bitumen.lagen}
          onChange={(v) => setBitumen((s) => ({ ...s, lagen: v }))}
        />
        <ButtonGroup<BitumenKwaliteit>
          label={nl ? 'Kwaliteit' : 'Quality'}
          options={[
            { id: 'standaard', label: nl ? 'Standaard' : 'Standard' },
            { id: 'sbs', label: nl ? 'SBS Gemodificeerd' : 'SBS Modified' },
            { id: 'app', label: nl ? 'APP Gemodificeerd' : 'APP Modified' },
          ]}
          value={bitumen.kwaliteit}
          onChange={(v) => setBitumen((s) => ({ ...s, kwaliteit: v }))}
        />
        <ButtonGroup<BitumenDikte>
          label={nl ? 'Dikte' : 'Thickness'}
          options={[
            { id: '3mm', label: '3mm' },
            { id: '4mm', label: '4mm' },
            { id: '5mm', label: '5mm' },
          ]}
          value={bitumen.dikte}
          onChange={(v) => setBitumen((s) => ({ ...s, dikte: v }))}
        />
        <ButtonGroup<BitumenAfwerking>
          label={nl ? 'Afwerking' : 'Finish'}
          options={[
            { id: 'zand', label: nl ? 'Zand' : 'Sand' },
            { id: 'leisteen', label: nl ? 'Leisteen' : 'Slate finish' },
            { id: 'alu_folie', label: nl ? 'Alu-folie' : 'Aluminium foil' },
          ]}
          value={bitumen.afwerking}
          onChange={(v) => setBitumen((s) => ({ ...s, afwerking: v }))}
        />
        <Toggle label={nl ? 'Isolatie meenemen?' : 'Include insulation?'} value={bitumen.isolatie} onChange={(v) => setBitumen((s) => ({ ...s, isolatie: v }))} yes={yes} no={no} />
        {bitumen.isolatie && (
          <InsulationForm options={bitumen.isolatieOpts} onChange={(opts) => setBitumen((s) => ({ ...s, isolatieOpts: opts }))} lang={language} />
        )}
        <Toggle label={nl ? 'Dakbedekking verwijderen eerst?' : 'Remove existing roofing first?'} value={bitumen.verwijderen} onChange={(v) => setBitumen((s) => ({ ...s, verwijderen: v }))} note={removeNote} yes={yes} no={no} />
      </AccordionSection>

      {/* B. EPDM */}
      <AccordionSection
        title={nl ? 'EPDM (Rubber dak)' : 'EPDM (Rubber roof)'}
        isOpen={openSections.epdm}
        onToggle={() => toggleSection('epdm')}
        hasValues={hasValues('epdm')}
      >
        <NumberInput label={nl ? 'Oppervlakte' : 'Surface area'} unit="m²" value={epdm.m2} onChange={(v) => setEpdm((s) => ({ ...s, m2: v }))} />
        <ButtonGroup<EpdmDikte>
          label={nl ? 'Dikte' : 'Thickness'}
          options={[
            { id: '1_0mm', label: '1.0mm' },
            { id: '1_2mm', label: '1.2mm' },
            { id: '1_5mm', label: '1.5mm' },
          ]}
          value={epdm.dikte}
          onChange={(v) => setEpdm((s) => ({ ...s, dikte: v }))}
        />
        <ButtonGroup<EpdmBevestiging>
          label={nl ? 'Bevestiging' : 'Attachment'}
          options={[
            { id: 'gelijmd', label: nl ? 'Gelijmd' : 'Glued' },
            { id: 'mechanisch', label: nl ? 'Mechanisch' : 'Mechanical' },
            { id: 'ballast', label: 'Ballast' },
          ]}
          value={epdm.bevestiging}
          onChange={(v) => setEpdm((s) => ({ ...s, bevestiging: v }))}
        />
        <Toggle label={nl ? 'Isolatie meenemen?' : 'Include insulation?'} value={epdm.isolatie} onChange={(v) => setEpdm((s) => ({ ...s, isolatie: v }))} yes={yes} no={no} />
        {epdm.isolatie && (
          <InsulationForm options={epdm.isolatieOpts} onChange={(opts) => setEpdm((s) => ({ ...s, isolatieOpts: opts }))} lang={language} />
        )}
        <Toggle label={nl ? 'Oude bedekking verwijderen?' : 'Remove old roofing?'} value={epdm.verwijderen} onChange={(v) => setEpdm((s) => ({ ...s, verwijderen: v }))} note={removeNote} yes={yes} no={no} />
      </AccordionSection>

      {/* C. Grind / Ballastdak */}
      <AccordionSection
        title={nl ? 'Grind / Ballastdak' : 'Gravel / Ballast roof'}
        isOpen={openSections.grind}
        onToggle={() => toggleSection('grind')}
        hasValues={hasValues('grind')}
      >
        <NumberInput label={nl ? 'Oppervlakte' : 'Surface area'} unit="m²" value={grind.m2} onChange={(v) => setGrind((s) => ({ ...s, m2: v }))} />
        <ButtonGroup<GrindlaagDikte>
          label={nl ? 'Grindlaag dikte' : 'Gravel layer thickness'}
          options={[
            { id: 'standaard', label: nl ? 'Standaard' : 'Standard' },
            { id: 'extra_dik', label: nl ? 'Extra dik' : 'Extra thick' },
          ]}
          value={grind.grindlaag}
          onChange={(v) => setGrind((s) => ({ ...s, grindlaag: v }))}
        />
        <Toggle label={nl ? 'Vlieslaag vernieuwen?' : 'Renew fleece layer?'} value={grind.vlieslaag} onChange={(v) => setGrind((s) => ({ ...s, vlieslaag: v }))} yes={yes} no={no} />
      </AccordionSection>

      {/* D. Liquid roofing / coating */}
      <AccordionSection
        title="Liquid roofing / coating"
        isOpen={openSections.coating}
        onToggle={() => toggleSection('coating')}
        hasValues={hasValues('coating')}
      >
        <NumberInput label={nl ? 'Oppervlakte' : 'Surface area'} unit="m²" value={coating.m2} onChange={(v) => setCoating((s) => ({ ...s, m2: v }))} />
        <ButtonGroup<CoatingType>
          label={nl ? 'Type coating' : 'Coating type'}
          options={[
            { id: 'pur', label: nl ? 'Polyurethaan (PUR)' : 'Polyurethane (PUR)' },
            { id: 'pmma', label: nl ? 'PMMA acrylaat' : 'PMMA acrylate' },
          ]}
          value={coating.type}
          onChange={(v) => setCoating((s) => ({ ...s, type: v }))}
        />
        <ButtonGroup<CoatingLagen>
          label={nl ? 'Aantal lagen' : 'Number of layers'}
          options={[
            { id: '1', label: nl ? '1 laag' : '1 layer' },
            { id: '2', label: nl ? '2 lagen' : '2 layers' },
            { id: '3', label: nl ? '3 lagen' : '3 layers' },
          ]}
          value={coating.lagen}
          onChange={(v) => setCoating((s) => ({ ...s, lagen: v }))}
        />
      </AccordionSection>
    </div>
  );
}
