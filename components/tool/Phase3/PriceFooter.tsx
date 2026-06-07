"use client";

import type { LineItem } from "../../../types/tool";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PriceFooterProps {
  allItems: LineItem[];
  discount: number; // 0–0.05
  onFinalize: () => void;
  language: "nl" | "en";
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const t = {
  nl: {
    subtotal: "Subtotaal ex. BTW",
    vat: "BTW",
    discount: "Korting",
    total: "TOTAAL",
    finalize: "Offerte afronden →",
  },
  en: {
    subtotal: "Subtotal excl. VAT",
    vat: "VAT",
    discount: "Discount",
    total: "TOTAL",
    finalize: "Finalize quote →",
  },
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatEur(amount: number): string {
  return amount.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PriceFooter({
  allItems,
  discount,
  onFinalize,
  language,
}: PriceFooterProps) {
  const labels = t[language];

  // Correct per-item VAT calculation
  const subtotalExVat = allItems.reduce((sum, item) => sum + item.total, 0);
  const vatAmount = allItems.reduce((sum, item) => sum + item.total * item.vatRate, 0);
  const discountAmount = subtotalExVat * discount;
  const totalInclVat = subtotalExVat - discountAmount + vatAmount;

  const discountPct = Math.round(discount * 100);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 shadow-2xl">
      <div className="mx-auto max-w-5xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 justify-between">
        {/* Price cells */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {/* Subtotaal */}
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 uppercase tracking-wide">
              {labels.subtotal}
            </span>
            <span className="text-base font-semibold text-white">
              {formatEur(subtotalExVat)}
            </span>
          </div>

          {/* BTW */}
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 uppercase tracking-wide">
              {labels.vat}
            </span>
            <span className="text-base font-semibold text-white">
              {formatEur(vatAmount)}
            </span>
          </div>

          {/* Korting — only shown when discount > 0 */}
          {discount > 0 && (
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase tracking-wide">
                {labels.discount}
              </span>
              <span className="text-base font-semibold text-[#cc0000]">
                -{discountPct}% ({formatEur(discountAmount)})
              </span>
            </div>
          )}

          {/* Totaal */}
          <div className="flex flex-col">
            <span className="text-xs text-[#d4af37] uppercase tracking-wide font-semibold">
              {labels.total}
            </span>
            <span className="text-xl font-bold text-[#d4af37]">
              {formatEur(totalInclVat)}
            </span>
          </div>
        </div>

        {/* Finalize button */}
        <button
          type="button"
          onClick={onFinalize}
          className="min-h-12 shrink-0 rounded bg-[#d4af37] px-6 py-3 text-sm font-bold text-black hover:bg-yellow-400 transition-colors whitespace-nowrap"
        >
          {labels.finalize}
        </button>
      </div>
    </div>
  );
}
