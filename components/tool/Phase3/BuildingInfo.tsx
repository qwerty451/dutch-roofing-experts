"use client";

import type { BuildingInfo } from "../../../types/tool";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BuildingInfoProps {
  value: BuildingInfo;
  onChange: (info: BuildingInfo) => void;
  language: "nl" | "en";
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GEBOUWTYPE_OPTIONS = [
  "Villa",
  "Appartement",
  "Commercieel",
  "Industrieel",
  "Anders",
] as const;

const BEREIKBAARHEID_OPTIONS = [
  "Goed bereikbaar",
  "Lastig bereikbaar",
  "Zeer moeilijk (geen oprit/lift)",
] as const;

const URGENTIE_OPTIONS = [
  { value: "Normaal / Gepland", emoji: "📅", color: "gray" },
  { value: "Zo snel mogelijk (1–2 weken)", emoji: "🔶", color: "yellow" },
  { value: "Dringend (2–3 dagen)", emoji: "🔴", color: "red" },
  { value: "Spoedreparatie (zelfde/volgende dag)", emoji: "🚨", color: "red" },
] as const;

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const t = {
  nl: {
    title: "Gebouwinformatie",
    verdiepingen: "Aantal verdiepingen",
    gebouwtype: "Gebouwtype",
    bereikbaarheid: "Bereikbaarheid dak",
    urgentie: "Hoe dringend?",
    urgentieNote: "Spoedreparaties worden automatisch in het offerte-onderdeel toegevoegd.",
    notities: "Bijzonderheden / notities",
    notitiesPlaceholder: "Bijv. smal straatje, geen parkeerplaats, hoge dakrand...",
    gebouwtypeLabels: {
      "Villa": "Villa",
      "Appartement": "Appartement",
      "Commercieel": "Commercieel",
      "Industrieel": "Industrieel",
      "Anders": "Anders",
    },
    bereikbaarheidLabels: {
      "Goed bereikbaar": "Goed bereikbaar",
      "Lastig bereikbaar": "Lastig bereikbaar",
      "Zeer moeilijk (geen oprit/lift)": "Zeer moeilijk (geen oprit/lift)",
    },
    urgentieLabels: {
      "Normaal / Gepland": "Normaal / Gepland",
      "Zo snel mogelijk (1–2 weken)": "Zo snel mogelijk (1–2 weken)",
      "Dringend (2–3 dagen)": "Dringend (2–3 dagen)",
      "Spoedreparatie (zelfde/volgende dag)": "Spoedreparatie (zelfde/volgende dag)",
    },
  },
  en: {
    title: "Building Information",
    verdiepingen: "Number of floors",
    gebouwtype: "Building type",
    bereikbaarheid: "Roof accessibility",
    urgentie: "How urgent?",
    urgentieNote: "Emergency repairs will be highlighted in the works section.",
    notities: "Notes / remarks",
    notitiesPlaceholder: "E.g. narrow street, no parking, high parapet...",
    gebouwtypeLabels: {
      "Villa": "Villa",
      "Appartement": "Apartment",
      "Commercieel": "Commercial",
      "Industrieel": "Industrial",
      "Anders": "Other",
    },
    bereikbaarheidLabels: {
      "Goed bereikbaar": "Easily accessible",
      "Lastig bereikbaar": "Difficult access",
      "Zeer moeilijk (geen oprit/lift)": "Very difficult (no driveway/lift)",
    },
    urgentieLabels: {
      "Normaal / Gepland": "Normal / Planned",
      "Zo snel mogelijk (1–2 weken)": "As soon as possible (1–2 weeks)",
      "Dringend (2–3 dagen)": "Urgent (2–3 days)",
      "Spoedreparatie (zelfde/volgende dag)": "Emergency (same/next day)",
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function BuildingInfoForm({
  value,
  onChange,
  language,
}: BuildingInfoProps) {
  const labels = t[language];

  function set<K extends keyof BuildingInfo>(field: K) {
    return (v: BuildingInfo[K]) => onChange({ ...value, [field]: v });
  }

  function increment() {
    onChange({ ...value, verdiepingen: Math.min(value.verdiepingen + 1, 10) });
  }

  function decrement() {
    onChange({ ...value, verdiepingen: Math.max(value.verdiepingen - 1, 1) });
  }

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 flex flex-col gap-5">
      <h3 className="text-lg font-bold" style={{ color: "#d4af37" }}>
        {labels.title}
      </h3>

      {/* Aantal verdiepingen — stepper */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-300">
          {labels.verdiepingen}
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={decrement}
            disabled={value.verdiepingen <= 1}
            className="flex items-center justify-center w-12 h-12 rounded bg-gray-700 text-white text-xl font-bold hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Verminder"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={10}
            value={value.verdiepingen}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (!isNaN(n) && n >= 1 && n <= 10) {
                set("verdiepingen")(n);
              }
            }}
            className="w-20 rounded bg-gray-700 px-3 py-3 text-center text-lg font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
          />
          <button
            type="button"
            onClick={increment}
            disabled={value.verdiepingen >= 10}
            className="flex items-center justify-center w-12 h-12 rounded bg-gray-700 text-white text-xl font-bold hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Verhoog"
          >
            +
          </button>
          {value.verdiepingen === 10 && (
            <span className="text-sm text-gray-400">10+</span>
          )}
        </div>
      </div>

      {/* Gebouwtype — button group */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray-300">
          {labels.gebouwtype}
        </span>
        <div className="flex flex-wrap gap-2">
          {GEBOUWTYPE_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => set("gebouwtype")(opt)}
              className={`min-h-12 rounded px-4 py-2 text-sm font-medium transition-colors ${
                value.gebouwtype === opt
                  ? "bg-[#d4af37] text-black"
                  : "bg-gray-700 text-white hover:bg-gray-600"
              }`}
            >
              {labels.gebouwtypeLabels[opt]}
            </button>
          ))}
        </div>
      </div>

      {/* Bereikbaarheid — button group */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray-300">
          {labels.bereikbaarheid}
        </span>
        <div className="flex flex-col gap-2">
          {BEREIKBAARHEID_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => set("bereikbaarheid")(opt)}
              className={`min-h-12 w-full rounded px-4 py-3 text-sm font-medium text-left transition-colors ${
                value.bereikbaarheid === opt
                  ? "bg-[#d4af37] text-black"
                  : "bg-gray-700 text-white hover:bg-gray-600"
              }`}
            >
              {labels.bereikbaarheidLabels[opt]}
            </button>
          ))}
        </div>
      </div>

      {/* Urgentie */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-gray-300">{labels.urgentie}</span>
          <span className="text-xs text-gray-500">{labels.urgentieNote}</span>
        </div>
        <div className="flex flex-col gap-2">
          {URGENTIE_OPTIONS.map((opt) => {
            const isActive = value.urgentie === opt.value;
            const isSpoed =
              opt.value.startsWith("Dringend") ||
              opt.value.startsWith("Spoedreparatie");
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("urgentie")(opt.value)}
                className={`min-h-12 w-full rounded px-4 py-3 text-sm font-medium text-left transition-colors ${
                  isActive
                    ? isSpoed
                      ? "bg-[#cc0000] text-white"
                      : "bg-[#d4af37] text-black"
                    : "bg-gray-700 text-white hover:bg-gray-600"
                }`}
              >
                {opt.emoji} {labels.urgentieLabels[opt.value]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notities — free text */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-300">
          {labels.notities}
        </label>
        <textarea
          value={value.notities}
          onChange={(e) => set("notities")(e.target.value)}
          rows={3}
          placeholder={labels.notitiesPlaceholder}
          className="w-full rounded bg-gray-700 px-4 py-3 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37] resize-y"
        />
      </div>
    </div>
  );
}
