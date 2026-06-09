"use client";

import { useState, useEffect, useRef } from "react";
import type { Phase3State } from "./Phase3/index";
import type { QuoteData, SavedQuote } from "../../types/tool";
import { generatePDF } from "../../lib/pdfGenerator";
import type { Language } from "../../lib/quoteTranslations";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Phase4ReviewProps {
  quoteState: Phase3State;
  employee: string; // NEVER shown to customer or on PDF
  onReset: () => void;
  language?: 'nl' | 'en';
}

// ---------------------------------------------------------------------------
// UI translations (separate from PDF translations in quoteTranslations.ts)
// ---------------------------------------------------------------------------

const t = {
  nl: {
    saving: 'Offerte opslaan op server…',
    retryBtn: 'Opnieuw proberen',
    offerte: 'OFFERTE',
    nr: 'Nr:',
    datum: 'Datum:',
    geldigTot: 'Geldig tot:',
    klantgegevens: 'Klantgegevens',
    werkzaamheden: 'Werkzaamheden',
    colDesc: 'Omschrijving',
    colUnit: 'Eenheid',
    colQty: 'Aantal',
    colUnitPrice: 'P/E',
    colTotal: 'Totaal',
    noItems: 'Geen posten toegevoegd.',
    subtotal: 'Subtotaal ex. BTW:',
    vat: 'BTW (21%):',
    discount: 'Klantkorting',
    grandTotal: 'TOTAAL INCL. BTW:',
    paymentTerms: 'Betalingsvoorwaarden',
    signatureCustomer: 'Handtekening klant:',
    signatureCompany: 'Handtekening bedrijf:',
    dateLabel: 'Datum:',
    pdfLanguage: 'Taal voor offerte PDF:',
    pdfGenerate: 'PDF Genereren',
    pdfGenerating: 'PDF genereren…',
    pdfError: 'PDF genereren mislukt. Probeer opnieuw.',
    emailBtn: 'Per e-mail versturen',
    emailSuccess: 'Offerte succesvol verstuurd per e-mail.',
    newQuote: 'Nieuwe offerte',
    confirmQuestion: 'Zeker weten? Dit wist de huidige offerte.',
    confirmYes: 'Ja, nieuwe offerte',
    confirmCancel: 'Annuleren',
    saveError: 'Opslaan op server mislukt — offerte gebruikt lokaal nummer. PDF werkt gewoon.',
  },
  en: {
    saving: 'Saving quote to server…',
    retryBtn: 'Try again',
    offerte: 'QUOTATION',
    nr: 'No:',
    datum: 'Date:',
    geldigTot: 'Valid until:',
    klantgegevens: 'Customer Details',
    werkzaamheden: 'Work Items',
    colDesc: 'Description',
    colUnit: 'Unit',
    colQty: 'Qty',
    colUnitPrice: 'Unit Price',
    colTotal: 'Total',
    noItems: 'No items added.',
    subtotal: 'Subtotal excl. VAT:',
    vat: 'VAT (21%):',
    discount: 'Customer discount',
    grandTotal: 'TOTAL INCL. VAT:',
    paymentTerms: 'Payment Terms',
    signatureCustomer: 'Customer Signature:',
    signatureCompany: 'Company Signature:',
    dateLabel: 'Date:',
    pdfLanguage: 'Language for quote PDF:',
    pdfGenerate: 'Generate PDF',
    pdfGenerating: 'Generating PDF…',
    pdfError: 'Failed to generate PDF. Please try again.',
    emailBtn: 'Send by email',
    emailSuccess: 'Quote sent successfully by email.',
    newQuote: 'New quote',
    confirmQuestion: 'Are you sure? This clears the current quote.',
    confirmYes: 'Yes, new quote',
    confirmCancel: 'Cancel',
    saveError: 'Failed to save to server — quote uses local number. PDF still works.',
  },
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateLocalId(): string {
  const year = new Date().getFullYear();
  const ts = Date.now().toString(36).toUpperCase().slice(-5);
  return `DRE-${year}-${ts}`;
}

function formatCurrency(amount: number): string {
  return (
    "€ " +
    amount.toLocaleString("nl-NL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function formatDate(date: Date, language: 'nl' | 'en'): string {
  return date.toLocaleDateString(language === 'nl' ? 'nl-NL' : 'en-GB');
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      // Strip "data:application/pdf;base64," prefix
      resolve(dataUrl.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Phase4Review({
  quoteState,
  employee,
  onReset,
  language = 'nl',
}: Phase4ReviewProps) {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  // Always initialise with a local fallback ID so Phase 4 is never blocked.
  // The server save runs in the background and replaces it with a sequential ID.
  const [quoteId, setQuoteId] = useState<string>(() => generateLocalId());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedLanguage, setSelectedLanguage] = useState<Language>("nl");

  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailAddress, setEmailAddress] = useState(
    quoteState.customer.email ?? ""
  );
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const hasSaved = useRef(false);

  const labels = t[language];

  // -------------------------------------------------------------------------
  // Derived totals (used for both display and SavedQuote)
  // -------------------------------------------------------------------------
  const { items, discount } = quoteState;

  const subtotalExVat = items.reduce((sum, item) => sum + item.total, 0);
  const vatAmount = items.reduce(
    (sum, item) => sum + item.total * item.vatRate,
    0
  );
  const discountAmount = subtotalExVat * discount;
  const grandTotal = subtotalExVat + vatAmount - discountAmount;

  // -------------------------------------------------------------------------
  // Save quote — background best-effort (server assigns sequential ID)
  // Phase 4 is never blocked: a local fallback ID is always available.
  // -------------------------------------------------------------------------
  async function performSave() {
    setIsSaving(true);
    setSaveError(null);

    const body: Omit<SavedQuote, "id"> = {
      date: new Date().toISOString().slice(0, 10),
      employee,
      customer: {
        name: quoteState.customer.naam,
        address: `${quoteState.customer.adres}, ${quoteState.customer.postcode} ${quoteState.customer.stad}`.trim(),
      },
      totals: {
        subtotal: subtotalExVat,
        vat: vatAmount,
        discount,
        total: grandTotal,
      },
      language: selectedLanguage,
    };

    try {
      const res = await fetch("/api/tool/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Server fout (${res.status})`);
      const data = (await res.json()) as { id: string };
      setQuoteId(data.id);
      setSaveError(null);
    } catch (err: unknown) {
      console.error("Save quote error:", err);
      setSaveError(labels.saveError);
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    if (hasSaved.current) return;
    hasSaved.current = true;
    void performSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Build QuoteData for PDF
  // -------------------------------------------------------------------------
  const quoteData: QuoteData = {
    customer: quoteState.customer,
    building: quoteState.building,
    items: quoteState.items,
    discount: quoteState.discount,
    paymentTerms: quoteState.paymentTerms,
    margins: quoteState.margins,
    language: selectedLanguage,
    warranty: quoteState.warranty,
  };

  // -------------------------------------------------------------------------
  // PDF download
  // -------------------------------------------------------------------------
  async function handleDownloadPDF() {
    if (!quoteId) return;
    setPdfLoading(true);
    setPdfError(null);
    try {
      const blob = await generatePDF(quoteData, quoteId, selectedLanguage);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `offerte-${quoteId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error("PDF error:", err);
      setPdfError(labels.pdfError);
    } finally {
      setPdfLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  // Email send
  // -------------------------------------------------------------------------
  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!emailAddress.trim()) return;
    setEmailLoading(true);
    setEmailError(null);
    setEmailSuccess(false);
    try {
      const blob = await generatePDF(quoteData, quoteId, selectedLanguage);
      const pdfBase64 = await blobToBase64(blob);

      const res = await fetch("/api/tool/send-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfBase64,
          customerEmail: emailAddress.trim(),
          quoteId,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Onbekende fout");
      }

      setEmailSuccess(true);
      setShowEmailForm(false);
    } catch (err: unknown) {
      console.error("Email send error:", err);
      setEmailError(
        err instanceof Error
          ? err.message
          : language === 'nl' ? "Versturen mislukt. Probeer opnieuw." : "Failed to send. Please try again."
      );
    } finally {
      setEmailLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  // Dates for display
  // -------------------------------------------------------------------------
  const today = new Date();
  const validUntil = addDays(today, 14);

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-6 pb-12">

      {/* Save status banner — non-blocking */}
      {isSaving && (
        <div className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-gray-400">
          <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gray-600 border-t-[#d4af37]" />
          {labels.saving}
        </div>
      )}
      {saveError && !isSaving && (
        <div className="flex flex-col gap-2 rounded-lg border border-orange-800 bg-gray-900 px-4 py-3 text-sm">
          <p className="text-orange-400">{saveError}</p>
          <button
            type="button"
            onClick={() => void performSave()}
            className="self-start rounded bg-gray-700 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-600"
          >
            {labels.retryBtn}
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Section 1: Quote header                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-lg border border-gray-700 bg-gray-900 overflow-hidden">
        {/* Dark header bar */}
        <div className="bg-gray-950 px-6 py-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p
              className="text-xl font-bold tracking-wide"
              style={{ color: "#d4af37" }}
            >
              Dutch Roofing Experts
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Tel: +31 6 45577172 &nbsp;|&nbsp; dutchroofingexperts@yahoo.com
            </p>
            <p className="text-sm text-gray-400">Costa Blanca South</p>
          </div>

          <div className="text-right">
            <p
              className="text-2xl font-extrabold tracking-wider"
              style={{ color: "#cc0000" }}
            >
              {labels.offerte}
            </p>
            {quoteId && (
              <p className="text-sm text-gray-300 mt-1 font-mono">
                {labels.nr} {quoteId}
              </p>
            )}
            <p className="text-sm text-gray-400 mt-1">
              {labels.datum} {formatDate(today, language)}
            </p>
            <p className="text-sm text-gray-400">
              {labels.geldigTot} {formatDate(validUntil, language)}
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 2: Customer details                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-lg border border-gray-700 bg-gray-900 px-6 py-5">
        <h3
          className="text-sm font-bold uppercase tracking-wider mb-3"
          style={{ color: "#d4af37" }}
        >
          {labels.klantgegevens}
        </h3>
        <div className="text-sm text-gray-200 leading-relaxed space-y-0.5">
          <p className="font-semibold">{quoteState.customer.naam}</p>
          <p>{quoteState.customer.adres}</p>
          <p>
            {quoteState.customer.postcode} {quoteState.customer.stad}
          </p>
          {quoteState.customer.telefoon && (
            <p className="text-gray-400">{quoteState.customer.telefoon}</p>
          )}
          {quoteState.customer.email && (
            <p className="text-gray-400">{quoteState.customer.email}</p>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 3: Line items table                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-lg border border-gray-700 bg-gray-900 overflow-hidden">
        <h3
          className="text-sm font-bold uppercase tracking-wider px-6 py-4 border-b border-gray-700"
          style={{ color: "#d4af37" }}
        >
          {labels.werkzaamheden}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800">
                <th className="px-4 py-3 text-left font-semibold text-gray-300">
                  {labels.colDesc}
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-300 whitespace-nowrap">
                  {labels.colUnit}
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-300 whitespace-nowrap">
                  {labels.colQty}
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-300 whitespace-nowrap">
                  {labels.colUnitPrice}
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-300 whitespace-nowrap">
                  {labels.colTotal}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500 italic"
                  >
                    {labels.noItems}
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={
                      idx % 2 === 0 ? "bg-gray-900" : "bg-gray-800/60"
                    }
                  >
                    <td className="px-4 py-3 text-gray-200">
                      {item.description[language] ?? item.description.nl}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400">
                      {item.unit}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300 whitespace-nowrap">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-100 whitespace-nowrap">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 4: Totals                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-lg border border-gray-700 bg-gray-900 px-6 py-5">
        <div className="flex flex-col gap-2 max-w-xs ml-auto text-sm">
          <div className="flex justify-between text-gray-400">
            <span>{labels.subtotal}</span>
            <span className="font-mono">{formatCurrency(subtotalExVat)}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>{labels.vat}</span>
            <span className="font-mono">{formatCurrency(vatAmount)}</span>
          </div>
          {discount > 0 && (
            <div
              className="flex justify-between"
              style={{ color: "#cc0000" }}
            >
              <span>
                {labels.discount} ({Math.round(discount * 100)}%):
              </span>
              <span className="font-mono">-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div
            className="flex justify-between border-t border-gray-700 pt-3 mt-1 text-base font-bold"
            style={{ color: "#d4af37" }}
          >
            <span>{labels.grandTotal}</span>
            <span className="font-mono">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 5: Payment terms                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-lg border border-gray-700 bg-gray-900 px-6 py-5">
        <h3
          className="text-sm font-bold uppercase tracking-wider mb-2"
          style={{ color: "#d4af37" }}
        >
          {labels.paymentTerms}
        </h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          {quoteState.paymentTerms}
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 6: Signature block                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-lg border border-gray-700 bg-gray-900 px-6 py-5">
        <div className="grid grid-cols-2 gap-8">
          {/* Left: customer */}
          <div>
            <p
              className="text-sm font-bold mb-6"
              style={{ color: "#d4af37" }}
            >
              {labels.signatureCustomer}
            </p>
            <div className="border-b border-gray-500 mb-3 h-8" />
            <p className="text-sm text-gray-400">
              {labels.dateLabel} ___________
            </p>
          </div>
          {/* Right: company */}
          <div>
            <p
              className="text-sm font-bold mb-6"
              style={{ color: "#d4af37" }}
            >
              {labels.signatureCompany}
            </p>
            <div className="border-b border-gray-500 mb-3 h-8" />
            <p className="text-sm text-gray-400">Dutch Roofing Experts</p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 7: PDF language selector                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-lg border border-gray-700 bg-gray-900 px-6 py-5">
        <p className="text-sm text-gray-400 mb-3">
          {labels.pdfLanguage}
        </p>
        <div className="flex gap-2">
          {(["nl", "en", "es"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setSelectedLanguage(lang)}
              className={`min-h-12 px-5 rounded font-semibold text-sm transition-colors ${
                selectedLanguage === lang
                  ? "text-black"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-600"
              }`}
              style={
                selectedLanguage === lang
                  ? { backgroundColor: "#d4af37" }
                  : undefined
              }
            >
              {lang === "nl" ? "NL" : lang === "en" ? "EN" : "ES"}
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 8: Output actions                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-3">

        {/* --- PDF download --- */}
        <button
          type="button"
          onClick={handleDownloadPDF}
          disabled={pdfLoading}
          className="min-h-12 rounded-lg px-6 py-3 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ backgroundColor: "#d4af37", color: "#000" }}
        >
          {pdfLoading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
              {labels.pdfGenerating}
            </>
          ) : (
            labels.pdfGenerate
          )}
        </button>
        {pdfError && (
          <p className="text-sm text-[#cc0000] px-1">{pdfError}</p>
        )}

        {/* --- Email --- (disabled) */}
        <button
          type="button"
          disabled
          className="min-h-12 rounded-lg px-6 py-3 font-semibold text-sm bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed opacity-50"
          title={language === 'nl' ? 'E-mail functie tijdelijk niet beschikbaar' : 'Email function temporarily unavailable'}
        >
          {labels.emailBtn}
        </button>

        {emailSuccess && (
          <div className="rounded-lg border border-green-800 bg-green-900/30 px-4 py-3 text-sm text-green-400">
            {labels.emailSuccess}
          </div>
        )}

        {/* --- New quote / Reset --- */}
        {!showResetConfirm ? (
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="min-h-12 rounded-lg px-6 py-3 font-semibold text-sm bg-gray-900 text-gray-400 border border-gray-700 hover:bg-gray-800 hover:text-white transition-colors mt-2"
          >
            {labels.newQuote}
          </button>
        ) : (
          <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 flex flex-col gap-3">
            <p className="text-sm text-gray-300">
              {labels.confirmQuestion}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onReset}
                className="min-h-12 flex-1 rounded font-semibold text-sm text-white transition-colors"
                style={{ backgroundColor: "#cc0000" }}
              >
                {labels.confirmYes}
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="min-h-12 px-4 rounded bg-gray-800 border border-gray-600 text-gray-400 hover:text-white hover:bg-gray-700 text-sm transition-colors"
              >
                {labels.confirmCancel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
