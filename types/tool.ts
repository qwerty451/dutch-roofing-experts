export interface Margins {
  material: number; // e.g. 1.2 for +20%
  labor: number;
  universal: number;
}

export interface CustomerInfo {
  naam: string;
  adres: string;
  postcode: string;
  stad: string;
  telefoon: string;
  email: string;
}

export interface BuildingInfo {
  verdiepingen: number;
  gebouwtype: string;
  bereikbaarheid: string;
  urgentie: string;
  notities: string;
}

export interface LineItem {
  id: string;
  description: { nl: string; en: string; es: string };
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
  vatRate: number;
  isCustom?: boolean; // exempt from Phase 2 margins
}

export interface Warranty {
  enabled: boolean;
  period: string;
}

export interface QuoteData {
  customer: CustomerInfo;
  building: BuildingInfo;
  items: LineItem[];
  discount: number; // 0–0.05
  paymentTerms: string;
  margins: Margins;
  language: 'nl' | 'en' | 'es';
  warranty: Warranty;
}

export interface SavedQuote {
  id: string;
  date: string;
  employee: string;
  customer: { name: string; address: string };
  totals: { subtotal: number; vat: number; discount: number; total: number };
  language: string;
}
