"use client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaymentTermsProps {
  value: string;
  onChange: (value: string) => void;
  language: "nl" | "en";
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const t = {
  nl: { label: "Betalingsvoorwaarden" },
  en: { label: "Payment terms" },
} as const;

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PaymentTerms({
  value,
  onChange,
  language,
}: PaymentTermsProps) {
  const labels = t[language];

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-700 bg-gray-900 p-4">
      <label className="text-sm text-gray-400 font-medium">{labels.label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded bg-gray-700 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37] resize-y"
      />
    </div>
  );
}
