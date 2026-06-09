"use client";

import { useState, useEffect, useCallback } from "react";
import type { LineItem, Margins } from "../../../types/tool";
import { applyMargins } from "../../../lib/pricing";
import pricingData from "../../../pricing.json";

interface LabourConfiguratorProps {
  margins: Margins;
  onItemsChange: (items: LineItem[]) => void;
  language: "nl" | "en";
}

const HOURS_PER_DAY = 8;

const labels = {
  nl: {
    title: "Personeel & Arbeid",
    workers: "Aantal medewerkers",
    days: "Aantal werkdagen",
    hoursNote: "(8 uur per dag)",
    summary: (workers: number, days: number, total: string) =>
      `${workers} medewerker${workers !== 1 ? "s" : ""} × ${days} dag${days !== 1 ? "en" : ""} × 8 uur = ${total}`,
    lineDesc: (workers: number, days: number) => ({
      nl: `Personeel – ${workers} medewerker${workers !== 1 ? "s" : ""} × ${days} dag${days !== 1 ? "en" : ""}`,
      en: `Labour – ${workers} worker${workers !== 1 ? "s" : ""} × ${days} day${days !== 1 ? "s" : ""}`,
      es: `Mano de obra – ${workers} trabajador${workers !== 1 ? "es" : ""} × ${days} día${days !== 1 ? "s" : ""}`,
    }),
    rateLabel: "Uurtarief (na marge)",
    totalLabel: "Totaal arbeidskosten",
  },
  en: {
    title: "Personnel & Labour",
    workers: "Number of workers",
    days: "Number of working days",
    hoursNote: "(8 hours per day)",
    summary: (workers: number, days: number, total: string) =>
      `${workers} worker${workers !== 1 ? "s" : ""} × ${days} day${days !== 1 ? "s" : ""} × 8 hrs = ${total}`,
    lineDesc: (workers: number, days: number) => ({
      nl: `Personeel – ${workers} medewerker${workers !== 1 ? "s" : ""} × ${days} dag${days !== 1 ? "en" : ""}`,
      en: `Labour – ${workers} worker${workers !== 1 ? "s" : ""} × ${days} day${days !== 1 ? "s" : ""}`,
      es: `Mano de obra – ${workers} trabajador${workers !== 1 ? "es" : ""} × ${days} día${days !== 1 ? "s" : ""}`,
    }),
    rateLabel: "Hourly rate (after margin)",
    totalLabel: "Total labour cost",
  },
} as const;

function formatEur(amount: number): string {
  return amount.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });
}

export default function LabourConfigurator({
  margins,
  onItemsChange,
  language,
}: LabourConfiguratorProps) {
  const [workers, setWorkers] = useState<number>(1);
  const [days, setDays] = useState<number>(1);

  const t = labels[language];
  const baseHourlyRate: number = pricingData.labor.baseHourlyRate;

  // Effective hourly rate after Phase 2 labor margin
  const effectiveHourlyRate = applyMargins(baseHourlyRate, margins, "labor");
  // Cost per person per day
  const costPerPersonDay = effectiveHourlyRate * HOURS_PER_DAY;
  // Total labour cost
  const totalLabour = workers * days * costPerPersonDay;

  const buildItems = useCallback(
    (w: number, d: number): LineItem[] => {
      if (w <= 0 || d <= 0) return [];
      const rate = applyMargins(baseHourlyRate, margins, "labor");
      const perDay = rate * HOURS_PER_DAY;
      const desc = t.lineDesc(w, d);
      return [
        {
          id: "labour_workers",
          description: desc,
          unit: "medewerker/dag",
          quantity: w * d,
          unitPrice: perDay,
          total: w * d * perDay,
          vatRate: 0.21,
        },
      ];
    },
    [baseHourlyRate, margins, t]
  );

  useEffect(() => {
    onItemsChange(buildItems(workers, days));
  }, [workers, days, buildItems, onItemsChange]);

  function handleWorkers(value: number) {
    const clamped = Math.max(0, Math.min(20, value));
    setWorkers(clamped);
  }

  function handleDays(value: number) {
    const clamped = Math.max(0, Math.min(365, value));
    setDays(clamped);
  }

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <h3 className="text-lg font-bold" style={{ color: "#d4af37" }}>
          {t.title}
        </h3>
      </div>

      <div className="p-4 flex flex-col gap-5">
        {/* Workers row */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">
            {t.workers}
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleWorkers(workers - 1)}
              disabled={workers <= 0}
              className="w-12 h-12 rounded bg-gray-700 text-white text-xl font-bold disabled:opacity-40 hover:bg-gray-600 transition-colors"
            >
              −
            </button>
            <input
              type="number"
              min={0}
              max={20}
              value={workers}
              onChange={(e) => { const v = parseInt(e.target.value, 10); handleWorkers(isNaN(v) ? 0 : v); }}
              className="w-20 h-12 rounded bg-gray-800 border border-gray-600 text-white text-center text-xl font-semibold focus:outline-none focus:border-[#d4af37]"
            />
            <button
              type="button"
              onClick={() => handleWorkers(workers + 1)}
              disabled={workers >= 20}
              className="w-12 h-12 rounded bg-gray-700 text-white text-xl font-bold disabled:opacity-40 hover:bg-gray-600 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Days row */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">
            {t.days}{" "}
            <span className="text-gray-500 font-normal">{t.hoursNote}</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleDays(days - 1)}
              disabled={days <= 0}
              className="w-12 h-12 rounded bg-gray-700 text-white text-xl font-bold disabled:opacity-40 hover:bg-gray-600 transition-colors"
            >
              −
            </button>
            <input
              type="number"
              min={0}
              max={365}
              value={days}
              onChange={(e) => { const v = parseInt(e.target.value, 10); handleDays(isNaN(v) ? 0 : v); }}
              className="w-20 h-12 rounded bg-gray-800 border border-gray-600 text-white text-center text-xl font-semibold focus:outline-none focus:border-[#d4af37]"
            />
            <button
              type="button"
              onClick={() => handleDays(days + 1)}
              disabled={days >= 365}
              className="w-12 h-12 rounded bg-gray-700 text-white text-xl font-bold disabled:opacity-40 hover:bg-gray-600 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Rate info */}
        <div className="flex flex-col gap-1 text-sm text-gray-400 border-t border-gray-700 pt-4">
          <div className="flex justify-between">
            <span>{t.rateLabel}</span>
            <span className="text-white font-medium">
              {formatEur(effectiveHourlyRate)}{language === 'nl' ? '/uur' : '/hr'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>
              {workers} × {days} {language === 'nl' ? `dag${days !== 1 ? 'en' : ''}` : `day${days !== 1 ? 's' : ''}`} × {HOURS_PER_DAY} {language === 'nl' ? 'uur' : 'hrs'}
            </span>
            <span className="text-white font-medium">
              = {workers * days * HOURS_PER_DAY} uur
            </span>
          </div>
        </div>

        {/* Total highlight */}
        <div
          className="flex justify-between items-center rounded-lg px-4 py-3"
          style={{ backgroundColor: "rgba(212,175,55,0.12)", border: "1px solid #d4af37" }}
        >
          <span className="font-semibold text-white">{t.totalLabel}</span>
          <span className="text-xl font-bold" style={{ color: "#d4af37" }}>
            {formatEur(totalLabour)}
          </span>
        </div>
      </div>
    </div>
  );
}
