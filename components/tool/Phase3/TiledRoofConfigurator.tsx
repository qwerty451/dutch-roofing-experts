'use client';

import { useState, useCallback, useEffect } from 'react';
import type { LineItem, Margins } from '../../../types/tool';
import { applyMargins } from '../../../lib/pricing';
import pricingData from '../../../pricing.json';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TiledRoofConfiguratorProps {
  margins: Margins;
  onItemsChange: (items: LineItem[]) => void;
  language: 'nl' | 'en';
}

// ---------------------------------------------------------------------------
// Pricing look-ups from pricing.json
// ---------------------------------------------------------------------------

const pitchedCat = pricingData.categories.find((c) => c.id === 'pitched_roof');

function getItem(id: string) {
  return pitchedCat?.items.find((i) => i.id === id);
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
  note?: string;
}

function NumberInput({
  value,
  onChange,
  label,
  unit,
  min = 0,
  placeholder,
  note,
}: NumberInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      {note && <span className="text-gray-500 text-xs">{note}</span>}
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
// Toggle-with-quantity field
// ---------------------------------------------------------------------------

interface ToggleWithQtyProps {
  label: string;
  enabled: boolean;
  quantity: number | '';
  onEnabledChange: (v: boolean) => void;
  onQuantityChange: (v: number | '') => void;
  unit: string;
  note?: string;
  yes?: string;
  no?: string;
}

function ToggleWithQty({
  label,
  enabled,
  quantity,
  onEnabledChange,
  onQuantityChange,
  unit,
  note,
  yes,
  no,
}: ToggleWithQtyProps) {
  return (
    <div className="flex flex-col gap-2">
      <Toggle label={label} value={enabled} onChange={onEnabledChange} note={note} yes={yes} no={no} />
      {enabled && (
        <div className="pl-2 flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={quantity === '' ? '' : quantity}
            placeholder="0"
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === '') {
                onQuantityChange('');
              } else {
                const n = parseFloat(raw);
                onQuantityChange(isNaN(n) ? '' : n);
              }
            }}
            className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-base focus:outline-none focus:border-yellow-500 w-28"
            style={{ minHeight: '2.75rem' }}
          />
          <span className="text-gray-400 text-sm">{unit}</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Betonpannen section
// ---------------------------------------------------------------------------

type TileWerkzaamheid = 'volledig' | 'gedeeltelijk' | 'losse_pannen';

interface ConcreteState {
  m2: number | '';
  werkzaamheid: TileWerkzaamheid;
  nokvorsten: boolean;
  nokvorsteMeters: number | '';
  windveren: boolean;
  windverenAantal: number | '';
  folieLatRegelwerk: boolean;
  dakgoten: boolean; // informational only — no price here
}

function computeConcreteItems(state: ConcreteState, margins: Margins): LineItem[] {
  const m2 = state.m2 === '' ? 0 : state.m2;
  if (m2 <= 0) return [];

  const item = getItem('concrete_tiles');
  const basePrice = item?.basePrice ?? 32;

  const werkMod = getOptionChoice('concrete_tiles', 'werkzaamheid', state.werkzaamheid);
  let unitBase = basePrice + werkMod;

  // folie + lat + regelwerk: pricePerM2WhenTrue: 11
  if (state.folieLatRegelwerk) unitBase += 11;

  const unitPrice = applyMargins(unitBase, margins, 'material');

  const werkLabels: Record<TileWerkzaamheid, { nl: string; en: string; es: string }> = {
    volledig: { nl: 'Volledig vervangen', en: 'Full replacement', es: 'Sustitución completa' },
    gedeeltelijk: { nl: 'Gedeeltelijk repareren', en: 'Partial repair', es: 'Reparación parcial' },
    losse_pannen: { nl: 'Losse pannen vervangen', en: 'Replace loose tiles', es: 'Sustituir tejas sueltas' },
  };

  const items: LineItem[] = [
    {
      id: 'pitched_concrete_material',
      description: {
        nl: `Betonpannen - ${werkLabels[state.werkzaamheid].nl}${state.folieLatRegelwerk ? ', incl. folie/lat/regelwerk' : ''}`,
        en: `Concrete tiles - ${werkLabels[state.werkzaamheid].en}${state.folieLatRegelwerk ? ', incl. underlay/battens' : ''}`,
        es: `Tejas de hormigón - ${werkLabels[state.werkzaamheid].es}${state.folieLatRegelwerk ? ', incl. fieltro/rastreles' : ''}`,
      },
      unit: 'm²',
      quantity: m2,
      unitPrice,
      total: unitPrice * m2,
      vatRate: 0.21,
    },
  ];

  // Nokvorsten: pricePerUnitWhenTrue: 22
  const nokMeters = state.nokvorsteMeters === '' ? 0 : state.nokvorsteMeters;
  if (state.nokvorsten && nokMeters > 0) {
    const nokUnitPrice = applyMargins(22, margins, 'material');
    items.push({
      id: 'pitched_concrete_nokvorsten',
      description: {
        nl: 'Nokvorsten (betonpannen)',
        en: 'Ridge tiles (concrete)',
        es: 'Caballetes (hormigón)',
      },
      unit: 'm',
      quantity: nokMeters,
      unitPrice: nokUnitPrice,
      total: nokUnitPrice * nokMeters,
      vatRate: 0.21,
    });
  }

  // Windveren: pricePerUnitWhenTrue: 12
  const windAantal = state.windverenAantal === '' ? 0 : state.windverenAantal;
  if (state.windveren && windAantal > 0) {
    const windUnitPrice = applyMargins(12, margins, 'material');
    items.push({
      id: 'pitched_concrete_windveren',
      description: {
        nl: 'Windveren vervangen (betonpannen)',
        en: 'Replace verge tiles (concrete)',
        es: 'Sustituir tejas de alero (hormigón)',
      },
      unit: 'stuks',
      quantity: windAantal,
      unitPrice: windUnitPrice,
      total: windUnitPrice * windAantal,
      vatRate: 0.21,
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Keramische pannen section
// ---------------------------------------------------------------------------

type CeramicProfiel = 'romaans' | 'vlak' | 'golf';

interface CeramicState {
  m2: number | '';
  werkzaamheid: TileWerkzaamheid;
  profiel: CeramicProfiel;
  nokvorsten: boolean;
  nokvorsteMeters: number | '';
  windveren: boolean;
  windverenAantal: number | '';
  folieLatRegelwerk: boolean;
  dakgoten: boolean; // informational only
}

function computeCeramicItems(state: CeramicState, margins: Margins): LineItem[] {
  const m2 = state.m2 === '' ? 0 : state.m2;
  if (m2 <= 0) return [];

  const item = getItem('ceramic_tiles');
  const basePrice = item?.basePrice ?? 48;

  const werkMod = getOptionChoice('ceramic_tiles', 'werkzaamheid', state.werkzaamheid);
  const profielMod = getOptionChoice('ceramic_tiles', 'profiel', state.profiel);
  let unitBase = basePrice + werkMod + profielMod;

  if (state.folieLatRegelwerk) unitBase += 11;

  const unitPrice = applyMargins(unitBase, margins, 'material');

  const werkLabels: Record<TileWerkzaamheid, { nl: string; en: string; es: string }> = {
    volledig: { nl: 'Volledig vervangen', en: 'Full replacement', es: 'Sustitución completa' },
    gedeeltelijk: { nl: 'Gedeeltelijk repareren', en: 'Partial repair', es: 'Reparación parcial' },
    losse_pannen: { nl: 'Losse pannen vervangen', en: 'Replace loose tiles', es: 'Sustituir tejas sueltas' },
  };
  const profielLabels: Record<CeramicProfiel, { nl: string; en: string; es: string }> = {
    romaans: { nl: 'Romaans', en: 'Roman', es: 'Romano' },
    vlak: { nl: 'Vlak', en: 'Flat', es: 'Plano' },
    golf: { nl: 'Golf', en: 'Wave', es: 'Ola' },
  };

  const items: LineItem[] = [
    {
      id: 'pitched_ceramic_material',
      description: {
        nl: `Keramische pannen - ${werkLabels[state.werkzaamheid].nl} ${profielLabels[state.profiel].nl}${state.folieLatRegelwerk ? ', incl. folie/lat/regelwerk' : ''}`,
        en: `Ceramic tiles - ${werkLabels[state.werkzaamheid].en} ${profielLabels[state.profiel].en}${state.folieLatRegelwerk ? ', incl. underlay/battens' : ''}`,
        es: `Tejas cerámicas - ${werkLabels[state.werkzaamheid].es} ${profielLabels[state.profiel].es}${state.folieLatRegelwerk ? ', incl. fieltro/rastreles' : ''}`,
      },
      unit: 'm²',
      quantity: m2,
      unitPrice,
      total: unitPrice * m2,
      vatRate: 0.21,
    },
  ];

  // Nokvorsten: pricePerUnitWhenTrue: 28
  const nokMeters = state.nokvorsteMeters === '' ? 0 : state.nokvorsteMeters;
  if (state.nokvorsten && nokMeters > 0) {
    const nokUnitPrice = applyMargins(28, margins, 'material');
    items.push({
      id: 'pitched_ceramic_nokvorsten',
      description: {
        nl: 'Nokvorsten (keramische pannen)',
        en: 'Ridge tiles (ceramic)',
        es: 'Caballetes (cerámica)',
      },
      unit: 'm',
      quantity: nokMeters,
      unitPrice: nokUnitPrice,
      total: nokUnitPrice * nokMeters,
      vatRate: 0.21,
    });
  }

  // Windveren: pricePerUnitWhenTrue: 15
  const windAantal = state.windverenAantal === '' ? 0 : state.windverenAantal;
  if (state.windveren && windAantal > 0) {
    const windUnitPrice = applyMargins(15, margins, 'material');
    items.push({
      id: 'pitched_ceramic_windveren',
      description: {
        nl: 'Windveren vervangen (keramische pannen)',
        en: 'Replace verge tiles (ceramic)',
        es: 'Sustituir tejas de alero (cerámica)',
      },
      unit: 'stuks',
      quantity: windAantal,
      unitPrice: windUnitPrice,
      total: windUnitPrice * windAantal,
      vatRate: 0.21,
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Leien dak section
// ---------------------------------------------------------------------------

type LeienSoort = 'natuurleien' | 'kunststof';
type LeienFormaat = 'standaard' | 'groot';
type LeienBevestiging = 'spijkers' | 'haken' | 'dubbelgedekt';

interface SlateState {
  m2: number | '';
  soort: LeienSoort;
  formaat: LeienFormaat;
  bevestiging: LeienBevestiging;
}

function computeSlateItems(state: SlateState, margins: Margins): LineItem[] {
  const m2 = state.m2 === '' ? 0 : state.m2;
  if (m2 <= 0) return [];

  const item = getItem('slate_roof');
  const basePrice = item?.basePrice ?? 65;

  const soortMod = getOptionChoice('slate_roof', 'soort', state.soort);
  const formaatMod = getOptionChoice('slate_roof', 'formaat', state.formaat);
  const bevMod = getOptionChoice('slate_roof', 'bevestiging', state.bevestiging);

  const unitBase = basePrice + soortMod + formaatMod + bevMod;
  const unitPrice = applyMargins(unitBase, margins, 'material');

  const soortLabels: Record<LeienSoort, { nl: string; en: string; es: string }> = {
    natuurleien: { nl: 'Natuurleien', en: 'Natural slate', es: 'Pizarra natural' },
    kunststof: { nl: 'Kunststof leien', en: 'Synthetic slate', es: 'Pizarra sintética' },
  };
  const formaatLabels: Record<LeienFormaat, { nl: string; en: string; es: string }> = {
    standaard: { nl: 'Standaard formaat', en: 'Standard size', es: 'Tamaño estándar' },
    groot: { nl: 'Groot formaat', en: 'Large format', es: 'Formato grande' },
  };
  const bevLabels: Record<LeienBevestiging, { nl: string; en: string; es: string }> = {
    spijkers: { nl: 'Spijkers', en: 'Nails', es: 'Clavos' },
    haken: { nl: 'Haken', en: 'Hooks', es: 'Ganchos' },
    dubbelgedekt: { nl: 'Dubbelgedekt', en: 'Double lap', es: 'Doble solape' },
  };

  return [
    {
      id: 'pitched_slate_material',
      description: {
        nl: `Leien dak - ${soortLabels[state.soort].nl} ${formaatLabels[state.formaat].nl} ${bevLabels[state.bevestiging].nl}`,
        en: `Slate roof - ${soortLabels[state.soort].en} ${formaatLabels[state.formaat].en} ${bevLabels[state.bevestiging].en}`,
        es: `Tejado de pizarra - ${soortLabels[state.soort].es} ${formaatLabels[state.formaat].es} ${bevLabels[state.bevestiging].es}`,
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
// Metaaldak / Staande naad section
// ---------------------------------------------------------------------------

type MetaalMateriaal = 'zink' | 'titaanzink' | 'aluminium' | 'cortenstaal';

interface MetalRoofState {
  m2: number | '';
  materiaal: MetaalMateriaal;
  isolatie: boolean;
}

const METAL_ISOLATIE_PRICE = 16; // pricePerM2WhenTrue: 16

function computeMetalRoofItems(state: MetalRoofState, margins: Margins): LineItem[] {
  const m2 = state.m2 === '' ? 0 : state.m2;
  if (m2 <= 0) return [];

  const item = getItem('metal_roof');
  const basePrice = item?.basePrice ?? 75;

  const matMod = getOptionChoice('metal_roof', 'materiaal', state.materiaal);
  const unitBase = basePrice + matMod;
  const unitPrice = applyMargins(unitBase, margins, 'material');

  const matLabels: Record<MetaalMateriaal, { nl: string; en: string; es: string }> = {
    zink: { nl: 'Zink', en: 'Zinc', es: 'Zinc' },
    titaanzink: { nl: 'Titaanzink', en: 'Titanium zinc', es: 'Zinc titánio' },
    aluminium: { nl: 'Aluminium', en: 'Aluminium', es: 'Aluminio' },
    cortenstaal: { nl: 'Cortenstaal', en: 'Corten steel', es: 'Acero corten' },
  };

  const items: LineItem[] = [
    {
      id: 'pitched_metal_material',
      description: {
        nl: `Metaaldak / Staande naad - ${matLabels[state.materiaal].nl}`,
        en: `Metal roof / Standing seam - ${matLabels[state.materiaal].en}`,
        es: `Cubierta metálica / Junta alzada - ${matLabels[state.materiaal].es}`,
      },
      unit: 'm²',
      quantity: m2,
      unitPrice,
      total: unitPrice * m2,
      vatRate: 0.21,
    },
  ];

  if (state.isolatie) {
    const isoUnitPrice = applyMargins(METAL_ISOLATIE_PRICE, margins, 'material');
    items.push({
      id: 'pitched_metal_insulation',
      description: {
        nl: 'Isolatie bij metaaldak',
        en: 'Insulation with metal roof',
        es: 'Aislamiento con cubierta metálica',
      },
      unit: 'm²',
      quantity: m2,
      unitPrice: isoUnitPrice,
      total: isoUnitPrice * m2,
      vatRate: 0.21,
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TiledRoofConfigurator({
  margins,
  onItemsChange,
  language,
}: TiledRoofConfiguratorProps) {
  // Accordion open/close state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    concrete: false,
    ceramic: false,
    slate: false,
    metal: false,
  });

  // Sub-section states
  const [concrete, setConcrete] = useState<ConcreteState>({
    m2: '',
    werkzaamheid: 'volledig',
    nokvorsten: false,
    nokvorsteMeters: '',
    windveren: false,
    windverenAantal: '',
    folieLatRegelwerk: false,
    dakgoten: false,
  });

  const [ceramic, setCeramic] = useState<CeramicState>({
    m2: '',
    werkzaamheid: 'volledig',
    profiel: 'romaans',
    nokvorsten: false,
    nokvorsteMeters: '',
    windveren: false,
    windverenAantal: '',
    folieLatRegelwerk: false,
    dakgoten: false,
  });

  const [slate, setSlate] = useState<SlateState>({
    m2: '',
    soort: 'natuurleien',
    formaat: 'standaard',
    bevestiging: 'spijkers',
  });

  const [metalRoof, setMetalRoof] = useState<MetalRoofState>({
    m2: '',
    materiaal: 'zink',
    isolatie: false,
  });

  // Aggregate all items and notify parent
  const aggregateItems = useCallback(
    (
      con: ConcreteState,
      cer: CeramicState,
      sl: SlateState,
      mt: MetalRoofState
    ): LineItem[] => {
      return [
        ...computeConcreteItems(con, margins),
        ...computeCeramicItems(cer, margins),
        ...computeSlateItems(sl, margins),
        ...computeMetalRoofItems(mt, margins),
      ];
    },
    [margins]
  );

  useEffect(() => {
    onItemsChange(aggregateItems(concrete, ceramic, slate, metalRoof));
  }, [concrete, ceramic, slate, metalRoof, aggregateItems, onItemsChange]);

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function hasValues(section: 'concrete' | 'ceramic' | 'slate' | 'metal'): boolean {
    switch (section) {
      case 'concrete':
        return concrete.m2 !== '' && concrete.m2 > 0;
      case 'ceramic':
        return ceramic.m2 !== '' && ceramic.m2 > 0;
      case 'slate':
        return slate.m2 !== '' && slate.m2 > 0;
      case 'metal':
        return metalRoof.m2 !== '' && metalRoof.m2 > 0;
    }
  }

  const nl = language === 'nl';
  const yes = nl ? 'Ja' : 'Yes';
  const no = nl ? 'Nee' : 'No';

  const tilecountInfo = (m2: number | '') =>
    m2 !== '' && m2 > 0
      ? `≈ ${Math.round((m2 as number) * 10)} ${nl ? 'pannen' : 'tiles'}`
      : undefined;

  const werkOptions = [
    { id: 'volledig' as const, label: nl ? 'Volledig vervangen' : 'Full replacement' },
    { id: 'gedeeltelijk' as const, label: nl ? 'Gedeeltelijk repareren' : 'Partial repair' },
    { id: 'losse_pannen' as const, label: nl ? 'Losse pannen vervangen' : 'Replace loose tiles' },
  ];

  const gutterNote = nl
    ? 'Verwijs naar de sectie Goten & Afwatering voor prijsberekening'
    : 'Refer to the Gutters & Drainage section for pricing';
  const gutterPrompt = nl
    ? 'Voeg dakgoten toe via de categorie "Goten & Afwatering" hieronder.'
    : 'Add gutters via the "Gutters & Drainage" category below.';

  return (
    <div className="flex flex-col gap-4">
      {/* A. Concrete tiles */}
      <AccordionSection
        title={nl ? 'Betonpannen' : 'Concrete tiles'}
        isOpen={openSections.concrete}
        onToggle={() => toggleSection('concrete')}
        hasValues={hasValues('concrete')}
      >
        <NumberInput label={nl ? 'Oppervlakte' : 'Surface area'} unit="m²" value={concrete.m2} note={tilecountInfo(concrete.m2)} onChange={(v) => setConcrete((s) => ({ ...s, m2: v }))} />
        <ButtonGroup<TileWerkzaamheid> label={nl ? 'Werkzaamheid' : 'Work type'} options={werkOptions} value={concrete.werkzaamheid} onChange={(v) => setConcrete((s) => ({ ...s, werkzaamheid: v }))} />
        <ToggleWithQty label={nl ? 'Nokvorsten meenemen?' : 'Include ridge tiles?'} enabled={concrete.nokvorsten} quantity={concrete.nokvorsteMeters} onEnabledChange={(v) => setConcrete((s) => ({ ...s, nokvorsten: v }))} onQuantityChange={(v) => setConcrete((s) => ({ ...s, nokvorsteMeters: v }))} unit="m" yes={yes} no={no} />
        <ToggleWithQty label={nl ? 'Windveren vervangen?' : 'Replace verge tiles?'} enabled={concrete.windveren} quantity={concrete.windverenAantal} onEnabledChange={(v) => setConcrete((s) => ({ ...s, windveren: v }))} onQuantityChange={(v) => setConcrete((s) => ({ ...s, windverenAantal: v }))} unit={nl ? 'stuks' : 'pcs'} yes={yes} no={no} />
        <Toggle label={nl ? 'Folie + lat + regelwerk vernieuwen?' : 'Renew underlay + battens?'} value={concrete.folieLatRegelwerk} onChange={(v) => setConcrete((s) => ({ ...s, folieLatRegelwerk: v }))} yes={yes} no={no} />
        <div className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-3">
          <Toggle label={nl ? 'Dakgoten meenemen?' : 'Include gutters?'} value={concrete.dakgoten} onChange={(v) => setConcrete((s) => ({ ...s, dakgoten: v }))} note={gutterNote} yes={yes} no={no} />
          {concrete.dakgoten && <p className="mt-2 text-xs text-yellow-400">{gutterPrompt}</p>}
        </div>
      </AccordionSection>

      {/* B. Ceramic tiles */}
      <AccordionSection
        title={nl ? 'Keramische pannen' : 'Ceramic tiles'}
        isOpen={openSections.ceramic}
        onToggle={() => toggleSection('ceramic')}
        hasValues={hasValues('ceramic')}
      >
        <NumberInput label={nl ? 'Oppervlakte' : 'Surface area'} unit="m²" value={ceramic.m2} note={tilecountInfo(ceramic.m2)} onChange={(v) => setCeramic((s) => ({ ...s, m2: v }))} />
        <ButtonGroup<TileWerkzaamheid> label={nl ? 'Werkzaamheid' : 'Work type'} options={werkOptions} value={ceramic.werkzaamheid} onChange={(v) => setCeramic((s) => ({ ...s, werkzaamheid: v }))} />
        <ButtonGroup<CeramicProfiel>
          label={nl ? 'Type profiel' : 'Profile type'}
          options={[
            { id: 'romaans', label: nl ? 'Romaans' : 'Roman' },
            { id: 'vlak', label: nl ? 'Vlak' : 'Flat' },
            { id: 'golf', label: nl ? 'Golf' : 'Wave' },
          ]}
          value={ceramic.profiel}
          onChange={(v) => setCeramic((s) => ({ ...s, profiel: v }))}
        />
        <ToggleWithQty label={nl ? 'Nokvorsten meenemen?' : 'Include ridge tiles?'} enabled={ceramic.nokvorsten} quantity={ceramic.nokvorsteMeters} onEnabledChange={(v) => setCeramic((s) => ({ ...s, nokvorsten: v }))} onQuantityChange={(v) => setCeramic((s) => ({ ...s, nokvorsteMeters: v }))} unit="m" yes={yes} no={no} />
        <ToggleWithQty label={nl ? 'Windveren vervangen?' : 'Replace verge tiles?'} enabled={ceramic.windveren} quantity={ceramic.windverenAantal} onEnabledChange={(v) => setCeramic((s) => ({ ...s, windveren: v }))} onQuantityChange={(v) => setCeramic((s) => ({ ...s, windverenAantal: v }))} unit={nl ? 'stuks' : 'pcs'} yes={yes} no={no} />
        <Toggle label={nl ? 'Folie + lat + regelwerk vernieuwen?' : 'Renew underlay + battens?'} value={ceramic.folieLatRegelwerk} onChange={(v) => setCeramic((s) => ({ ...s, folieLatRegelwerk: v }))} yes={yes} no={no} />
        <div className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-3">
          <Toggle label={nl ? 'Dakgoten meenemen?' : 'Include gutters?'} value={ceramic.dakgoten} onChange={(v) => setCeramic((s) => ({ ...s, dakgoten: v }))} note={gutterNote} yes={yes} no={no} />
          {ceramic.dakgoten && <p className="mt-2 text-xs text-yellow-400">{gutterPrompt}</p>}
        </div>
      </AccordionSection>

      {/* C. Slate roof */}
      <AccordionSection
        title={nl ? 'Leien dak' : 'Slate roof'}
        isOpen={openSections.slate}
        onToggle={() => toggleSection('slate')}
        hasValues={hasValues('slate')}
      >
        <NumberInput label={nl ? 'Oppervlakte' : 'Surface area'} unit="m²" value={slate.m2} onChange={(v) => setSlate((s) => ({ ...s, m2: v }))} />
        <ButtonGroup<LeienSoort>
          label={nl ? 'Soort leien' : 'Slate type'}
          options={[
            { id: 'natuurleien', label: nl ? 'Natuurleien' : 'Natural slate' },
            { id: 'kunststof', label: nl ? 'Kunststof leien' : 'Synthetic slate' },
          ]}
          value={slate.soort}
          onChange={(v) => setSlate((s) => ({ ...s, soort: v }))}
        />
        <ButtonGroup<LeienFormaat>
          label={nl ? 'Formaat' : 'Format'}
          options={[
            { id: 'standaard', label: nl ? 'Standaard formaat' : 'Standard size' },
            { id: 'groot', label: nl ? 'Groot formaat' : 'Large format' },
          ]}
          value={slate.formaat}
          onChange={(v) => setSlate((s) => ({ ...s, formaat: v }))}
        />
        <ButtonGroup<LeienBevestiging>
          label={nl ? 'Bevestigingsmethode' : 'Fixing method'}
          options={[
            { id: 'spijkers', label: nl ? 'Spijkers' : 'Nails' },
            { id: 'haken', label: nl ? 'Haken' : 'Hooks' },
            { id: 'dubbelgedekt', label: nl ? 'Dubbelgedekt' : 'Double lap' },
          ]}
          value={slate.bevestiging}
          onChange={(v) => setSlate((s) => ({ ...s, bevestiging: v }))}
        />
      </AccordionSection>

      {/* D. Metal roof / Standing seam */}
      <AccordionSection
        title={nl ? 'Metaaldak / Staande naad' : 'Metal roof / Standing seam'}
        isOpen={openSections.metal}
        onToggle={() => toggleSection('metal')}
        hasValues={hasValues('metal')}
      >
        <NumberInput label={nl ? 'Oppervlakte' : 'Surface area'} unit="m²" value={metalRoof.m2} onChange={(v) => setMetalRoof((s) => ({ ...s, m2: v }))} />
        <ButtonGroup<MetaalMateriaal>
          label={nl ? 'Materiaal' : 'Material'}
          options={[
            { id: 'zink', label: 'Zinc' },
            { id: 'titaanzink', label: nl ? 'Titaanzink' : 'Titanium zinc' },
            { id: 'aluminium', label: 'Aluminium' },
            { id: 'cortenstaal', label: nl ? 'Cortenstaal' : 'Corten steel' },
          ]}
          value={metalRoof.materiaal}
          onChange={(v) => setMetalRoof((s) => ({ ...s, materiaal: v }))}
        />
        <Toggle label={nl ? 'Isolatie meenemen?' : 'Include insulation?'} value={metalRoof.isolatie} onChange={(v) => setMetalRoof((s) => ({ ...s, isolatie: v }))} yes={yes} no={no} />
      </AccordionSection>
    </div>
  );
}
