'use client';

import { useState } from 'react';
import type { Margins } from '../../types/tool';

interface Phase2MarginsProps {
  onComplete: (margins: Margins) => void;
  currentPhase?: 1 | 2 | 3 | 4;
  language?: 'nl' | 'en';
}

const PERCENT_OPTIONS = [0, 10, 20, 30, 40, 50] as const;
type PercentOption = typeof PERCENT_OPTIONS[number];

const t = {
  nl: {
    title: 'Marges instellen',
    description: 'Pas de marges aan op basis van de klant. Deze marges zijn alleen voor jou zichtbaar — ze worden niet getoond aan de klant of op de offerte.',
    material: 'Materiaalkosten',
    labor: 'Uurtarief per medewerker',
    universal: 'Alles (universeel)',
    universalNote: 'Stapelt op de bovenstaande marges.',
    activeMargins: 'Actieve marges',
    materialLabel: 'Materiaal',
    laborLabel: 'Arbeid',
    universalLabel: 'Universeel',
    continue: 'Doorgaan →',
  },
  en: {
    title: 'Set margins',
    description: 'Adjust the margins based on the customer. Only visible to you — not shown to the customer or on the quote.',
    material: 'Material costs',
    labor: 'Hourly rate per worker',
    universal: 'Everything (universal)',
    universalNote: 'Stacks on top of the margins above.',
    activeMargins: 'Active margins',
    materialLabel: 'Material',
    laborLabel: 'Labour',
    universalLabel: 'Universal',
    continue: 'Continue →',
  },
} as const;

interface MarginRowProps {
  label: string;
  note?: string;
  value: PercentOption;
  onChange: (val: PercentOption) => void;
}

function MarginRow({ label, note, value, onChange }: MarginRowProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <span className="text-white font-semibold text-base">{label}</span>
        {note && (
          <span className="text-gray-500 text-xs">{note}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {PERCENT_OPTIONS.map((pct) => {
          const isActive = value === pct;
          return (
            <button
              key={pct}
              onClick={() => onChange(pct)}
              className="h-12 px-4 rounded-lg font-semibold text-sm transition-colors min-w-[3.5rem]"
              style={
                isActive
                  ? { backgroundColor: '#d4af37', color: '#000' }
                  : { backgroundColor: '#1f2937', color: '#9ca3af' }
              }
              aria-pressed={isActive}
            >
              +{pct}%
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Phase2Margins({ onComplete, currentPhase = 2, language = 'nl' }: Phase2MarginsProps) {
  const [materialPct, setMaterialPct] = useState<PercentOption>(0);
  const [laborPct, setLaborPct] = useState<PercentOption>(0);
  const [universalPct, setUniversalPct] = useState<PercentOption>(0);

  const labels = t[language];

  function handleContinue() {
    const margins: Margins = {
      material: 1 + materialPct / 100,
      labor: 1 + laborPct / 100,
      universal: 1 + universalPct / 100,
    };
    onComplete(margins);
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white">
      <div className="flex flex-col flex-1 px-4 py-8 gap-8 max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{labels.title}</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            {labels.description}
          </p>
        </div>

        <div className="border-t border-gray-800" />

        {/* Margin rows */}
        <div className="flex flex-col gap-8">
          <MarginRow label={labels.material} value={materialPct} onChange={setMaterialPct} />
          <MarginRow label={labels.labor} value={laborPct} onChange={setLaborPct} />
          <MarginRow label={labels.universal} note={labels.universalNote} value={universalPct} onChange={setUniversalPct} />
        </div>

        {/* Summary */}
        {(materialPct > 0 || laborPct > 0 || universalPct > 0) && (
          <div className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 flex flex-col gap-1">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">
              {labels.activeMargins}
            </p>
            {materialPct > 0 && (
              <p className="text-sm text-gray-300">
                {labels.materialLabel}: <span className="font-semibold" style={{ color: '#d4af37' }}>+{materialPct}%</span>
              </p>
            )}
            {laborPct > 0 && (
              <p className="text-sm text-gray-300">
                {labels.laborLabel}: <span className="font-semibold" style={{ color: '#d4af37' }}>+{laborPct}%</span>
              </p>
            )}
            {universalPct > 0 && (
              <p className="text-sm text-gray-300">
                {labels.universalLabel}: <span className="font-semibold" style={{ color: '#d4af37' }}>+{universalPct}%</span>
              </p>
            )}
          </div>
        )}

        {/* Continue button */}
        <button
          onClick={handleContinue}
          className="w-full h-14 rounded-xl font-bold text-lg text-white transition-opacity active:opacity-80 mt-auto"
          style={{ backgroundColor: '#cc0000' }}
        >
          {labels.continue}
        </button>
      </div>
    </div>
  );
}
