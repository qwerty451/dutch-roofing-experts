'use client';

import { useState, useEffect } from 'react';
import type { Margins, LineItem } from '../../types/tool';
import type { Phase3State } from '../../components/tool/Phase3/index';

import Phase1Login from '../../components/tool/Phase1Login';
import Phase2Margins from '../../components/tool/Phase2Margins';
import Phase3Quote from '../../components/tool/Phase3/index';
import CheckupPopups from '../../components/tool/CheckupPopups';
import Phase4Review from '../../components/tool/Phase4Review';
import LanguageToggle from '../../components/tool/LanguageToggle';

// ---------------------------------------------------------------------------
// Session persistence
// ---------------------------------------------------------------------------

const SESSION_KEY = 'dre_tool_session';
const PHASE3_SESSION_KEY = 'dre_tool_phase3';

type Phase = 1 | 2 | 3 | 4;

interface ToolSession {
  phase: Phase;
  employee: string;
  margins: Margins;
  language: 'nl' | 'en';
  quoteState: Phase3State | null;
  checkupItems: LineItem[];
}

const defaultMargins: Margins = { material: 1, labor: 1, universal: 1 };

const DEFAULT_SESSION: ToolSession = {
  phase: 1,
  employee: '',
  margins: defaultMargins,
  language: 'nl',
  quoteState: null,
  checkupItems: [],
};

function loadSession(): ToolSession {
  if (typeof window === 'undefined') return DEFAULT_SESSION;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return { ...DEFAULT_SESSION, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SESSION;
}

function saveSession(s: ToolSession) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {}
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(PHASE3_SESSION_KEY);
  } catch {}
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ToolPage() {
  const [phase, setPhase] = useState<Phase>(() => loadSession().phase);
  const [employee, setEmployee] = useState<string>(() => loadSession().employee);
  const [margins, setMargins] = useState<Margins>(() => loadSession().margins);
  const [language, setLanguage] = useState<'nl' | 'en'>(() => loadSession().language);
  const [quoteState, setQuoteState] = useState<Phase3State | null>(() => loadSession().quoteState);
  const [checkupItems, setCheckupItems] = useState<LineItem[]>(() => loadSession().checkupItems);
  const [showCheckup, setShowCheckup] = useState(false);

  // Confirm-dialog state for start over
  const [confirmReset, setConfirmReset] = useState(false);

  // Save session on every relevant change
  useEffect(() => {
    saveSession({ phase, employee, margins, language, quoteState, checkupItems });
  }, [phase, employee, margins, language, quoteState, checkupItems]);

  function handleLoginSuccess(employeeName: string) {
    setEmployee(employeeName);
    setPhase(2);
  }

  function handleMarginsConfirmed(confirmedMargins: Margins) {
    setMargins(confirmedMargins);
    setPhase(3);
  }

  function handleReadyForCheckup(state: Phase3State) {
    setQuoteState(state);
    setShowCheckup(true);
  }

  function handleCheckupAddItem(item: LineItem) {
    setCheckupItems((prev) => [...prev, item]);
    if (quoteState) {
      setQuoteState((prev) =>
        prev ? { ...prev, items: [...prev.items, item] } : prev
      );
    }
  }

  function handleCheckupReturnToPhase3() {
    setShowCheckup(false);
  }

  function handleCheckupComplete() {
    setShowCheckup(false);
    setPhase(4);
  }

  function handleReset() {
    clearSession();
    setPhase(1);
    setEmployee('');
    setMargins(defaultMargins);
    setQuoteState(null);
    setCheckupItems([]);
    setShowCheckup(false);
    setConfirmReset(false);
  }

  return (
    <main className="min-h-screen relative pt-14">

      {/* ── Start-over button ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setConfirmReset(true)}
        className="fixed top-4 left-4 z-50 flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs font-medium text-gray-400 hover:border-gray-500 hover:text-white transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Opnieuw
      </button>

      {/* ── Confirm reset dialog ──────────────────────────────────────────── */}
      {confirmReset && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-xs rounded-xl border border-gray-700 bg-gray-900 p-6 flex flex-col gap-5">
            <h2 className="text-base font-bold text-white">Opnieuw beginnen?</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Alle ingevoerde gegevens worden gewist. Dit kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="min-h-11 w-full rounded bg-[#cc0000] px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors"
              >
                Ja, opnieuw beginnen
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="min-h-11 w-full rounded bg-gray-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-600 transition-colors"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Language toggle ────────────────────────────────────────────────── */}
      {phase !== 1 && (
        <LanguageToggle language={language} onChange={setLanguage} />
      )}

      {/* ── Phases ────────────────────────────────────────────────────────── */}
      {phase === 1 && (
        <Phase1Login onLogin={handleLoginSuccess} currentPhase={1} />
      )}

      {phase === 2 && (
        <Phase2Margins onComplete={handleMarginsConfirmed} currentPhase={2} />
      )}

      {phase === 3 && (
        <>
          <Phase3Quote
            margins={margins}
            employee={employee}
            language={language}
            onLanguageChange={setLanguage}
            onReadyForCheckup={handleReadyForCheckup}
            additionalItems={checkupItems}
          />
          {showCheckup && quoteState && (
            <CheckupPopups
              quoteState={quoteState}
              onAddItem={handleCheckupAddItem}
              onReturnToPhase3={handleCheckupReturnToPhase3}
              onComplete={handleCheckupComplete}
            />
          )}
        </>
      )}

      {phase === 4 && quoteState && (
        <Phase4Review
          quoteState={quoteState}
          employee={employee}
          onReset={handleReset}
        />
      )}
    </main>
  );
}
