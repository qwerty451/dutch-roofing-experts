export type Language = 'nl' | 'en' | 'es';

export interface PdfTranslations {
  offerteTitle: string;
  quoteNumber: string;
  date: string;
  validUntil: string;
  validDays: string; // "14 dagen" / "14 days" / "14 días"
  customer: string;
  description: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  total: string;
  subtotal: string;
  vat: string;
  discount: string;
  totalIncVat: string;
  paymentTerms: string;
  signatureCustomer: string;
  signatureCompany: string;
  dateLabel: string;
  // Company info
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  companyLocation: string;
  // Warranty
  warranty: string;
  warrantyPeriod: string;
}

export const translations: Record<Language, PdfTranslations> = {
  nl: {
    offerteTitle: 'OFFERTE',
    quoteNumber: 'Nr',
    date: 'Datum',
    validUntil: 'Geldig tot',
    validDays: '(14 dagen)',
    customer: 'Klantgegevens',
    description: 'Omschrijving',
    unit: 'Eenheid',
    quantity: 'Aantal',
    unitPrice: 'P/E',
    total: 'Totaal',
    subtotal: 'Subtotaal ex. BTW',
    vat: 'BTW 21%',
    discount: 'Klantkorting',
    totalIncVat: 'TOTAAL INCL. BTW',
    paymentTerms: 'Betalingsvoorwaarden',
    signatureCustomer: 'Handtekening klant',
    signatureCompany: 'Handtekening bedrijf',
    dateLabel: 'Datum',
    companyName: 'Dutch Roofing Experts',
    companyPhone: 'Tel: +31 6 45577172',
    companyEmail: 'dutchroofingexperts@yahoo.com',
    companyLocation: 'Costa Blanca South',
    warranty: 'Garantie',
    warrantyPeriod: 'Garantieperiode',
  },
  en: {
    offerteTitle: 'QUOTATION',
    quoteNumber: 'No',
    date: 'Date',
    validUntil: 'Valid until',
    validDays: '(14 days)',
    customer: 'Customer Details',
    description: 'Description',
    unit: 'Unit',
    quantity: 'Qty',
    unitPrice: 'Unit Price',
    total: 'Total',
    subtotal: 'Subtotal excl. VAT',
    vat: 'VAT 21%',
    discount: 'Customer Discount',
    totalIncVat: 'TOTAL INCL. VAT',
    paymentTerms: 'Payment Terms',
    signatureCustomer: 'Customer Signature',
    signatureCompany: 'Company Signature',
    dateLabel: 'Date',
    companyName: 'Dutch Roofing Experts',
    companyPhone: 'Tel: +31 6 45577172',
    companyEmail: 'dutchroofingexperts@yahoo.com',
    companyLocation: 'Costa Blanca South',
    warranty: 'Warranty',
    warrantyPeriod: 'Warranty period',
  },
  es: {
    offerteTitle: 'PRESUPUESTO',
    quoteNumber: 'Nº',
    date: 'Fecha',
    validUntil: 'Válido hasta',
    validDays: '(14 días)',
    customer: 'Datos del Cliente',
    description: 'Descripción',
    unit: 'Unidad',
    quantity: 'Cant.',
    unitPrice: 'P/U',
    total: 'Total',
    subtotal: 'Subtotal sin IVA',
    vat: 'IVA 21%',
    discount: 'Descuento cliente',
    totalIncVat: 'TOTAL INCL. IVA',
    paymentTerms: 'Condiciones de Pago',
    signatureCustomer: 'Firma del cliente',
    signatureCompany: 'Firma de la empresa',
    dateLabel: 'Fecha',
    companyName: 'Dutch Roofing Experts',
    companyPhone: 'Tel: +31 6 45577172',
    companyEmail: 'dutchroofingexperts@yahoo.com',
    companyLocation: 'Costa Blanca South',
    warranty: 'Garantía',
    warrantyPeriod: 'Período de garantía',
  },
};
