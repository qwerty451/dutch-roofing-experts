"use client";

import { useState, useEffect, useCallback } from "react";
import type { LineItem, Margins } from "../../../types/tool";
import { applyMargins } from "../../../lib/pricing";
import pricingData from "../../../pricing.json";

interface SpoedConfiguratorProps {
  margins: Margins;
  urgentie: string;
  onItemsChange: (items: LineItem[]) => void;
  language: "nl" | "en";
}

const IS_URGENT = (urgentie: string) =>
  urgentie.startsWith("Dringend") || urgentie.startsWith("Spoedreparatie");

const labels = {
  nl: {
    title: "Spoedreparaties",
    urgentAlert: (u: string) => `⚠️ Urgentie: ${u}`,
    noUrgency: "Items zijn altijd selecteerbaar. Stel urgentie in bij Gebouwinformatie om dit tabblad automatisch te activeren.",
    qty: "Aantal",
    meters: "Meter",
    sqm: "m²",
    unitPrice: "Prijs p/e",
  },
  en: {
    title: "Emergency Repairs",
    urgentAlert: (u: string) => `⚠️ Urgency: ${u}`,
    noUrgency: "Items can always be added. Set urgency in Building Information for automatic tab activation.",
    qty: "Qty",
    meters: "Metres",
    sqm: "m²",
    unitPrice: "Unit price",
  },
} as const;

type ItemState = { enabled: boolean; quantity: number };

function formatEur(n: number) {
  return n.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });
}

export default function SpoedConfigurator({
  margins,
  urgentie,
  onItemsChange,
  language,
}: SpoedConfiguratorProps) {
  const t = labels[language];
  const isUrgent = IS_URGENT(urgentie);

  const emergencyCategory = pricingData.categories.find(
    (c) => c.id === "emergency"
  );
  const items = emergencyCategory?.items.filter((i) => i.enabled) ?? [];

  const [states, setStates] = useState<Record<string, ItemState>>(() =>
    Object.fromEntries(items.map((i) => [i.id, { enabled: false, quantity: 1 }]))
  );

  const buildLineItems = useCallback(
    (s: Record<string, ItemState>): LineItem[] => {
      return items.flatMap((item) => {
        const st = s[item.id];
        if (!st?.enabled || st.quantity <= 0) return [];
        const unitPrice = applyMargins(item.basePrice, margins, "labor");
        return [
          {
            id: `emergency_${item.id}`,
            description: {
              nl: item.name.nl,
              en: item.name.en,
              es: item.name.es,
            },
            unit: item.unit,
            quantity: st.quantity,
            unitPrice,
            total: unitPrice * st.quantity,
            vatRate: 0.21,
          },
        ];
      });
    },
    [items, margins]
  );

  useEffect(() => {
    onItemsChange(buildLineItems(states));
  }, [states, buildLineItems, onItemsChange]);

  function toggle(id: string) {
    setStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], enabled: !prev[id].enabled },
    }));
  }

  function setQty(id: string, qty: number) {
    const clamped = Math.max(0, qty);
    setStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], quantity: clamped },
    }));
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Urgency banner */}
      {isUrgent ? (
        <div
          className="rounded-lg px-4 py-3 text-sm font-semibold text-white"
          style={{ backgroundColor: "#cc0000" }}
        >
          {t.urgentAlert(urgentie)}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-600 bg-gray-800 px-4 py-3 text-xs text-gray-400">
          {t.noUrgency}
        </div>
      )}

      {/* Item list */}
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const st = states[item.id] ?? { enabled: false, quantity: 1 };
          const unitPrice = applyMargins(item.basePrice, margins, "labor");
          const isQtyItem = item.unit === "m²" || item.unit === "m";

          return (
            <div
              key={item.id}
              className={`rounded-lg border transition-colors overflow-hidden ${
                st.enabled
                  ? "border-[#cc0000] bg-gray-800"
                  : "border-gray-700 bg-gray-900"
              }`}
            >
              {/* Toggle row */}
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className="w-full flex items-start justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span
                    className={`text-sm font-semibold ${
                      st.enabled ? "text-white" : "text-gray-300"
                    }`}
                  >
                    {language === "nl" ? item.name.nl : item.name.en}
                  </span>
                  {"description" in item && (
                    <span className="text-xs text-gray-500 leading-snug">
                      {(item as typeof item & { description: { nl: string; en: string } }).description[language]}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 mt-0.5">
                    {formatEur(unitPrice)} / {item.unit}
                  </span>
                </div>
                <div
                  className={`mt-0.5 shrink-0 w-6 h-6 rounded flex items-center justify-center font-bold text-sm transition-colors ${
                    st.enabled
                      ? "bg-[#cc0000] text-white"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {st.enabled ? "✓" : "+"}
                </div>
              </button>

              {/* Quantity input when enabled and item is measured */}
              {st.enabled && isQtyItem && (
                <div className="px-4 pb-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQty(item.id, st.quantity - 1)}
                    disabled={st.quantity <= 1}
                    className="w-10 h-10 rounded bg-gray-700 text-white font-bold disabled:opacity-40 hover:bg-gray-600 transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={st.quantity}
                    onChange={(e) =>
                      setQty(item.id, parseInt(e.target.value, 10) || 1)
                    }
                    className="w-20 h-10 rounded bg-gray-800 border border-gray-600 text-white text-center font-semibold focus:outline-none focus:border-[#cc0000]"
                  />
                  <button
                    type="button"
                    onClick={() => setQty(item.id, st.quantity + 1)}
                    className="w-10 h-10 rounded bg-gray-700 text-white font-bold hover:bg-gray-600 transition-colors"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-400">{item.unit}</span>
                  <span className="ml-auto text-sm font-semibold text-white">
                    {formatEur(unitPrice * st.quantity)}
                  </span>
                </div>
              )}

              {/* Total for flat-fee items */}
              {st.enabled && !isQtyItem && (
                <div className="px-4 pb-3 flex justify-between text-sm">
                  <span className="text-gray-400">1 × {item.unit}</span>
                  <span className="font-semibold text-white">
                    {formatEur(unitPrice)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
