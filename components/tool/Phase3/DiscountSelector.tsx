"use client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DiscountSelectorProps {
  value: number; // 0–0.05
  onChange: (value: number) => void;
  language: "nl" | "en";
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DISCOUNT_OPTIONS = [0, 0.01, 0.02, 0.03, 0.04, 0.05];

const t = {
  nl: { label: "Klantkorting" },
  en: { label: "Customer discount" },
} as const;

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DiscountSelector({
  value,
  onChange,
  language,
}: DiscountSelectorProps) {
  const labels = t[language];

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-700 bg-gray-900 p-4">
      <span className="text-sm text-gray-400 font-medium">{labels.label}</span>
      <div className="flex flex-wrap gap-2">
        {DISCOUNT_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`min-h-12 rounded px-5 py-2 text-sm font-semibold transition-colors ${
              value === opt
                ? "bg-[#d4af37] text-black"
                : "bg-gray-700 text-white hover:bg-gray-600"
            }`}
          >
            {Math.round(opt * 100)}%
          </button>
        ))}
      </div>
    </div>
  );
}
