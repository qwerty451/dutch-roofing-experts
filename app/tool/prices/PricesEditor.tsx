'use client';

import { useState } from 'react';

interface Item {
  key: string;
  name: string;
  unit: string;
  basePrice: number;
}

interface Section {
  id: string;
  label: string;
  items: Item[];
}

interface Props {
  laborRate: number;
  sections: Section[];
}

export default function PricesEditor({ laborRate: initLaborRate, sections: initSections }: Props) {
  const [laborRate, setLaborRate] = useState(initLaborRate);
  const [prices, setPrices] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    for (const s of initSections) for (const i of s.items) m[i.key] = i.basePrice;
    return m;
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle');

  function setPrice(key: string, val: string) {
    const n = parseFloat(val);
    if (!isNaN(n) && n >= 0) setPrices((p) => ({ ...p, [key]: n }));
  }

  async function handleSave() {
    setSaving(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/tool/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ laborRate, items: prices }),
      });
      setStatus(res.ok ? 'ok' : 'err');
    } catch {
      setStatus('err');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-lg mx-auto px-4 py-6 pb-28 flex flex-col gap-6">

        <h1 className="text-xl font-bold" style={{ color: '#d4af37' }}>
          Prijsbeheer
        </h1>

        {/* Labor rate */}
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: '#d4af37' }}>
            Arbeid
          </h2>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-300">Uurtarief (per medewerker)</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">€</span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={laborRate}
                onChange={(e) => {
                  const n = parseFloat(e.target.value);
                  if (!isNaN(n) && n >= 0) setLaborRate(n);
                }}
                className="w-24 rounded bg-gray-800 border border-gray-600 px-3 py-2 text-right text-white focus:outline-none focus:border-[#d4af37]"
              />
              <span className="text-gray-500 text-sm">/ uur</span>
            </div>
          </div>
        </div>

        {/* Categories */}
        {initSections.map((section) => (
          <div key={section.id} className="rounded-lg border border-gray-700 bg-gray-900 p-4">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: '#d4af37' }}>
              {section.label}
            </h2>
            <div className="flex flex-col gap-3">
              {section.items.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-4">
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm text-gray-200 leading-snug">{item.name}</span>
                    <span className="text-xs text-gray-500">per {item.unit}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-gray-400 text-sm">€</span>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={prices[item.key] ?? item.basePrice}
                      onChange={(e) => setPrice(item.key, e.target.value)}
                      className="w-24 rounded bg-gray-800 border border-gray-600 px-3 py-2 text-right text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Fixed save footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-700 px-4 py-4 flex flex-col gap-2">
          {status === 'ok' && (
            <p className="text-center text-sm text-green-400">Prijzen opgeslagen.</p>
          )}
          {status === 'err' && (
            <p className="text-center text-sm text-[#cc0000]">Opslaan mislukt. Probeer opnieuw.</p>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full min-h-12 rounded-lg font-bold text-sm text-black disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            style={{ backgroundColor: '#d4af37' }}
          >
            {saving ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                Opslaan…
              </>
            ) : (
              'Prijzen opslaan'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
