import type { Margins } from '../types/tool';

// Re-export Margins so callers can import from one place
export type { Margins };

// ---------------------------------------------------------------------------
// Shared name type used across categories, items, options, and choices
// ---------------------------------------------------------------------------
export interface NamedItem {
  nl: string;
  en: string;
  es: string;
}

// ---------------------------------------------------------------------------
// Pricing meta
// ---------------------------------------------------------------------------
export interface PricingMeta {
  region: string;
  currency: string;
  vatRate: number;
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// Option choice (for select-type options)
// ---------------------------------------------------------------------------
export interface OptionChoice {
  id: string;
  label: NamedItem;
  priceModifier?: number;
  priceMultiplier?: number;
  price?: number;
}

// ---------------------------------------------------------------------------
// Individual option on an item
// ---------------------------------------------------------------------------
export interface ItemOption {
  label: NamedItem;
  type:
    | 'select'
    | 'boolean'
    | 'boolean_with_quantity'
    | 'select_with_boolean';
  choices?: OptionChoice[];
  /** Added to the per-unit price when a boolean option is true */
  pricePerM2WhenTrue?: number;
  /** Flat amount added per item (not per m²) when boolean is true */
  flatPriceWhenTrue?: number;
  /** Price per strekkende meter / unit when boolean_with_quantity is true */
  pricePerUnitWhenTrue?: number;
  unit?: string;
}

// ---------------------------------------------------------------------------
// Pricing item (e.g. bitumen, epdm, …)
// ---------------------------------------------------------------------------
export interface PricingItem {
  id: string;
  enabled: boolean;
  name: NamedItem;
  unit: string;
  basePrice: number;
  options?: Record<string, ItemOption>;
}

// ---------------------------------------------------------------------------
// Category (e.g. flat_roof, gutters, …)
// ---------------------------------------------------------------------------
export interface PricingCategory {
  id: string;
  enabled: boolean;
  name: NamedItem;
  items: PricingItem[];
}

// ---------------------------------------------------------------------------
// Equipment item
// ---------------------------------------------------------------------------
export interface EquipmentItem {
  id: string;
  enabled: boolean;
  name: NamedItem;
  unit: string;
  basePrice: number;
}

// ---------------------------------------------------------------------------
// Labor config
// ---------------------------------------------------------------------------
export interface LaborConfig {
  baseHourlyRate: number;
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// Full pricing data structure
// ---------------------------------------------------------------------------
export interface PricingData {
  meta: PricingMeta;
  labor: LaborConfig;
  categories: PricingCategory[];
  equipment: EquipmentItem[];
}

// ---------------------------------------------------------------------------
// applyMargins
// Stacking order: base → material → labor → universal
// ---------------------------------------------------------------------------

/**
 * Apply margin multipliers to a base price.
 *
 * @param basePrice  - Raw base price before any markup
 * @param margins    - The three margin multipliers (e.g. 1.2 = +20%)
 * @param type       - Which multipliers to apply:
 *                     'material' → basePrice × material × universal
 *                     'labor'    → basePrice × labor    × universal
 *                     'both'     → basePrice × material × labor × universal
 */
export function applyMargins(
  basePrice: number,
  margins: Margins,
  type: 'material' | 'labor' | 'both'
): number {
  switch (type) {
    case 'material':
      return basePrice * margins.material * margins.universal;
    case 'labor':
      return basePrice * margins.labor * margins.universal;
    case 'both':
      return basePrice * margins.material * margins.labor * margins.universal;
    default: {
      const _exhaustive: never = type;
      return basePrice;
    }
  }
}

