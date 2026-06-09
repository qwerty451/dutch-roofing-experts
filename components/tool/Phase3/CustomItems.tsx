"use client";

import { useState } from "react";
import type { LineItem } from "../../../types/tool";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CustomItemsProps {
  onItemsChange: (items: LineItem[]) => void;
  language: "nl" | "en";
}

type VatRate = 0.21 | 0.09 | 0;

interface FormState {
  omschrijving: string;
  bedrag: string;
  vatRate: VatRate;
}

const DEFAULT_FORM: FormState = {
  omschrijving: "",
  bedrag: "",
  vatRate: 0.21,
};

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const t = {
  nl: {
    title: "Eigen posten",
    addButton: "+ Eigen post toevoegen",
    omschrijvingLabel: "Omschrijving",
    bedragLabel: "Bedrag excl. BTW",
    vatLabel: "BTW tarief",
    addConfirm: "Toevoegen",
    cancel: "Annuleren",
    omschrijvingPlaceholder: "Bijv. Aanvoer materiaal, Meerwerk...",
    noItems: "Nog geen eigen posten toegevoegd.",
  },
  en: {
    title: "Custom line items",
    addButton: "+ Add custom item",
    omschrijvingLabel: "Description",
    bedragLabel: "Amount excl. VAT",
    vatLabel: "VAT rate",
    addConfirm: "Add",
    cancel: "Cancel",
    omschrijvingPlaceholder: "E.g. Material delivery, Extra work...",
    noItems: "No custom items added yet.",
  },
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatEur(amount: number): string {
  return amount.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });
}

function generateId(): string {
  return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CustomItems({ onItemsChange, language }: CustomItemsProps) {
  const lang = language;
  const labels = t[lang];

  const [items, setItems] = useState<LineItem[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handleAdd() {
    const bedrag = parseFloat(form.bedrag);
    if (!form.omschrijving.trim()) {
      setError(lang === "nl" ? "Omschrijving is verplicht." : "Description is required.");
      return;
    }
    if (isNaN(bedrag) || bedrag <= 0) {
      setError(lang === "nl" ? "Voer een geldig bedrag in." : "Enter a valid amount.");
      return;
    }
    setError(null);

    const newItem: LineItem = {
      id: generateId(),
      description: {
        nl: form.omschrijving.trim(),
        en: form.omschrijving.trim(),
        es: form.omschrijving.trim(),
      },
      unit: "post",
      quantity: 1,
      unitPrice: bedrag,
      total: bedrag,
      vatRate: form.vatRate,
      isCustom: true,
    };

    const updated = [...items, newItem];
    setItems(updated);
    onItemsChange(updated);
    setForm(DEFAULT_FORM);
    setFormOpen(false);
  }

  function handleDelete(id: string) {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    onItemsChange(updated);
  }

  function handleCancel() {
    setForm(DEFAULT_FORM);
    setError(null);
    setFormOpen(false);
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-gray-700 bg-gray-900 p-4">
      <h3 className="text-lg font-bold text-white">{labels.title}</h3>

      {/* Existing items list */}
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">{labels.noItems}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded bg-gray-800 px-4 py-3"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-medium text-white truncate">
                  {item.description[lang]}
                </span>
                <span className="text-sm text-gray-400">
                  {formatEur(item.total)} {lang === 'nl' ? 'excl. BTW' : 'excl. VAT'} &mdash;{" "}
                  {Math.round(item.vatRate * 100)}% {lang === 'nl' ? 'BTW' : 'VAT'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="shrink-0 flex items-center justify-center w-9 h-9 rounded bg-gray-700 text-gray-300 hover:bg-red-700 hover:text-white transition-colors text-lg font-bold"
                aria-label="Verwijder"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add button / inline form */}
      {!formOpen ? (
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="min-h-12 w-full rounded border border-[#d4af37] bg-transparent px-4 py-3 text-sm font-semibold text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition-colors"
        >
          {labels.addButton}
        </button>
      ) : (
        <div className="flex flex-col gap-4 rounded-lg border border-[#d4af37] bg-gray-800 p-4">
          {/* Omschrijving */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-400">{labels.omschrijvingLabel}</label>
            <input
              type="text"
              value={form.omschrijving}
              onChange={(e) => setForm((s) => ({ ...s, omschrijving: e.target.value }))}
              placeholder={labels.omschrijvingPlaceholder}
              className="w-full rounded bg-gray-700 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
            />
          </div>

          {/* Bedrag */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-400">{labels.bedragLabel}</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">€</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.bedrag}
                onChange={(e) => setForm((s) => ({ ...s, bedrag: e.target.value }))}
                className="w-36 rounded bg-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              />
            </div>
          </div>

          {/* BTW tarief */}
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-400">{labels.vatLabel}</span>
            <div className="flex gap-2">
              {([0.21, 0.09, 0] as VatRate[]).map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setForm((s) => ({ ...s, vatRate: rate }))}
                  className={`min-h-12 rounded px-5 py-2 text-sm font-medium transition-colors ${
                    form.vatRate === rate
                      ? "bg-[#d4af37] text-black"
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  }`}
                >
                  {Math.round(rate * 100)}%
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && <p className="text-sm text-red-400">{error}</p>}

          {/* Actions */}
          <div className="flex items-center gap-3 border-t border-gray-700 pt-3">
            <button
              type="button"
              onClick={handleAdd}
              className="min-h-12 rounded bg-[#d4af37] px-6 py-2 text-sm font-semibold text-black hover:bg-yellow-400 transition-colors"
            >
              {labels.addConfirm}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="text-sm text-gray-400 hover:text-white underline"
            >
              {labels.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
