'use client';

import { useState } from 'react';
import type { Margins, LineItem } from '../../types/tool';
import type { Phase3State } from '../../components/tool/Phase3/index';

import Phase1Login from '../../components/tool/Phase1Login';
import Phase2Margins from '../../components/tool/Phase2Margins';
import Phase3Quote from '../../components/tool/Phase3/index';
import CheckupPopups from '../../components/tool/CheckupPopups';
import Phase4Review from '../../components/tool/Phase4Review';
import LanguageToggle from '../../components/tool/LanguageToggle';

type Phase = 1 | 2 | 3 | 4;

const defaultMargins: Margins = {
  material: 1,
  labor: 1,
  universal: 1,
};

export default function ToolPage() {
  const [phase, setPhase] = useState<Phase>(1);
  const [employee, setEmployee] = useState<string>('');
  const [margins, setMargins] = useState<Margins>(defaultMargins);
  const [language, setLanguage] = useState<'nl' | 'en'>('nl');

  // Phase 3 snapshot (set when user hits "Offerte afronden")
  const [quoteState, setQuoteState] = useState<Phase3State | null>(null);
  // Items added by CheckupPopups — passed back to Phase3Quote as additionalItems
  const [checkupItems, setCheckupItems] = useState<LineItem[]>([]);
  // Whether checkup popups are running (overlaid on top of phase 3)
  const [showCheckup, setShowCheckup] = useState(false);

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
    // Phase stays at 3. checkupItems are passed as additionalItems to Phase3Quote
    // so they appear in the price footer and final state.
  }

  function handleCheckupComplete() {
    setShowCheckup(false);
    setPhase(4);
  }

  function handleReset() {
    setPhase(1);
    setEmployee('');
    setMargins(defaultMargins);
    setQuoteState(null);
    setCheckupItems([]);
    setShowCheckup(false);
  }

  return (
    <main className="min-h-screen relative">
      {/* Language toggle always visible (except Phase 1 which has its own minimal UI) */}
      {phase !== 1 && (
        <LanguageToggle language={language} onChange={setLanguage} />
      )}

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
