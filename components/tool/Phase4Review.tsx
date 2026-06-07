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
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return (
    "€ " +
    amount.toLocaleString("nl-NL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("nl-NL");
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
}: Phase4ReviewProps) {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(true);

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
  // Save quote on mount (once)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (hasSaved.current) return;
    hasSaved.current = true;

    const savedQuoteBody: Omit<SavedQuote, "id"> = {
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

    fetch("/api/tool/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(savedQuoteBody),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Server antwoordde met fout.");
        return res.json();
      })
      .then((data: { id: string }) => {
        setQuoteId(data.id);
        setIsSaving(false);
      })
      .catch((err: unknown) => {
        console.error("Save quote error:", err);
        setSaveError("Opslaan mislukt. Controleer de verbinding en probeer opnieuw.");
        setIsSaving(false);
      });
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
      setPdfError("PDF genereren mislukt. Probeer opnieuw.");
    } finally {
      setPdfLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  // Email send
  // -------------------------------------------------------------------------
  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!quoteId || !emailAddress.trim()) return;
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
          : "Versturen mislukt. Probeer opnieuw."
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
  // Loading / error state while saving
  // -------------------------------------------------------------------------
  if (isSaving) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-600 border-t-[#d4af37]" />
          <p className="text-gray-400">Offerte opslaan…</p>
        </div>
      </div>
    );
  }

  if (saveError) {
    return (
      <div className="rounded-lg border border-red-800 bg-gray-900 p-6 text-center">
        <p className="text-[#cc0000] font-semibold mb-4">{saveError}</p>
        <button
          type="button"
          onClick={() => {
            hasSaved.current = false;
            setIsSaving(true);
            setSaveError(null);
          }}
          className="rounded bg-[#cc0000] px-6 py-3 font-semibold text-white"
        >
          Opnieuw proberen
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-6 pb-12">

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
              OFFERTE
            </p>
            {quoteId && (
              <p className="text-sm text-gray-300 mt-1 font-mono">
                Nr: {quoteId}
              </p>
            )}
            <p className="text-sm text-gray-400 mt-1">
              Datum: {formatDate(today)}
            </p>
            <p className="text-sm text-gray-400">
              Geldig tot: {formatDate(validUntil)}
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
          Klantgegevens
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
          Werkzaamheden
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800">
                <th className="px-4 py-3 text-left font-semibold text-gray-300">
                  Omschrijving
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-300 whitespace-nowrap">
                  Eenheid
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-300 whitespace-nowrap">
                  Aantal
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-300 whitespace-nowrap">
                  P/E
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-300 whitespace-nowrap">
                  Totaal
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
                    Geen posten toegevoegd.
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
                      {item.description.nl}
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
            <span>Subtotaal ex. BTW:</span>
            <span className="font-mono">{formatCurrency(subtotalExVat)}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>BTW (21%):</span>
            <span className="font-mono">{formatCurrency(vatAmount)}</span>
          </div>
          {discount > 0 && (
            <div
              className="flex justify-between"
              style={{ color: "#cc0000" }}
            >
              <span>
                Klantkorting ({Math.round(discount * 100)}%):
              </span>
              <span className="font-mono">-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div
            className="flex justify-between border-t border-gray-700 pt-3 mt-1 text-base font-bold"
            style={{ color: "#d4af37" }}
          >
            <span>TOTAAL INCL. BTW:</span>
            <span className="font-mono">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 5: Betalingsvoorwaarden                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-lg border border-gray-700 bg-gray-900 px-6 py-5">
        <h3
          className="text-sm font-bold uppercase tracking-wider mb-2"
          style={{ color: "#d4af37" }}
        >
          Betalingsvoorwaarden
        </h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          {quoteState.paymentTerms}
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 6: Handtekening block                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-lg border border-gray-700 bg-gray-900 px-6 py-5">
        <div className="grid grid-cols-2 gap-8">
          {/* Left: customer */}
          <div>
            <p
              className="text-sm font-bold mb-6"
              style={{ color: "#d4af37" }}
            >
              Handtekening klant:
            </p>
            <div className="border-b border-gray-500 mb-3 h-8" />
            <p className="text-sm text-gray-400">
              Datum: ___________
            </p>
          </div>
          {/* Right: company */}
          <div>
            <p
              className="text-sm font-bold mb-6"
              style={{ color: "#d4af37" }}
            >
              Handtekening bedrijf:
            </p>
            <div className="border-b border-gray-500 mb-3 h-8" />
            <p className="text-sm text-gray-400">Dutch Roofing Experts</p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 7: Language selector                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-lg border border-gray-700 bg-gray-900 px-6 py-5">
        <p className="text-sm text-gray-400 mb-3">
          Taal voor offerte PDF:
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
          disabled={!quoteId || pdfLoading}
          className="min-h-12 rounded-lg px-6 py-3 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ backgroundColor: "#d4af37", color: "#000" }}
        >
          {pdfLoading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
              PDF genereren…
            </>
          ) : (
            "PDF Genereren"
          )}
        </button>
        {pdfError && (
          <p className="text-sm text-[#cc0000] px-1">{pdfError}</p>
        )}

        {/* --- Email --- */}
        {!showEmailForm ? (
          <button
            type="button"
            onClick={() => {
              setShowEmailForm(true);
              setEmailSuccess(false);
              setEmailError(null);
            }}
            disabled={!quoteId}
            className="min-h-12 rounded-lg px-6 py-3 font-semibold text-sm bg-gray-800 text-white border border-gray-600 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Per e-mail versturen
          </button>
        ) : (
          <form
            onSubmit={handleSendEmail}
            className="rounded-lg border border-gray-700 bg-gray-900 p-4 flex flex-col gap-3"
          >
            <label className="text-sm text-gray-400">E-mailadres klant:</label>
            <input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="naam@voorbeeld.com"
              required
              className="rounded bg-gray-800 border border-gray-600 px-4 py-3 text-white text-sm focus:border-[#d4af37] focus:outline-none"
            />
            {emailError && (
              <p className="text-sm text-[#cc0000]">{emailError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={emailLoading || !emailAddress.trim()}
                className="min-h-12 flex-1 rounded font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: "#d4af37", color: "#000" }}
              >
                {emailLoading ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                    Versturen…
                  </>
                ) : (
                  "Versturen"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEmailForm(false);
                  setEmailError(null);
                }}
                className="min-h-12 px-4 rounded bg-gray-800 border border-gray-600 text-gray-400 hover:text-white hover:bg-gray-700 text-sm transition-colors"
              >
                Annuleren
              </button>
            </div>
          </form>
        )}

        {emailSuccess && (
          <div className="rounded-lg border border-green-800 bg-green-900/30 px-4 py-3 text-sm text-green-400">
            Offerte succesvol verstuurd per e-mail.
          </div>
        )}

        {/* --- New quote / Reset --- */}
        {!showResetConfirm ? (
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="min-h-12 rounded-lg px-6 py-3 font-semibold text-sm bg-gray-900 text-gray-400 border border-gray-700 hover:bg-gray-800 hover:text-white transition-colors mt-2"
          >
            Nieuwe offerte
          </button>
        ) : (
          <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 flex flex-col gap-3">
            <p className="text-sm text-gray-300">
              Zeker weten? Dit wist de huidige offerte.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onReset}
                className="min-h-12 flex-1 rounded font-semibold text-sm text-white transition-colors"
                style={{ backgroundColor: "#cc0000" }}
              >
                Ja, nieuwe offerte
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="min-h-12 px-4 rounded bg-gray-800 border border-gray-600 text-gray-400 hover:text-white hover:bg-gray-700 text-sm transition-colors"
              >
                Annuleren
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
