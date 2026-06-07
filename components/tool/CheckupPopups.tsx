"use client";

import { useState, useMemo, useEffect } from "react";
import type { LineItem } from "../../types/tool";
import type { Phase3State } from "./Phase3/index";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CheckupPopupsProps {
  quoteState: Phase3State;
  onAddItem: (item: LineItem) => void;
  onReturnToPhase3: () => void;
  onComplete: () => void;
}

type CheckAction =
  | "return_to_phase3"
  | "add_item_and_return"
  | "add_item_and_continue";

interface Check {
  condition: (state: Phase3State) => boolean;
  message: (state: Phase3State) => string;
  onYes: CheckAction;
  itemToAdd?: (state: Phase3State) => LineItem;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasItem(items: LineItem[], ...fragments: string[]): boolean {
  return items.some((item) =>
    fragments.some((frag) => item.id.toLowerCase().includes(frag.toLowerCase()))
  );
}

function hasCustomItemMention(items: LineItem[], ...words: string[]): boolean {
  return items.some(
    (item) =>
      item.isCustom &&
      words.some(
        (w) =>
          item.description.nl.toLowerCase().includes(w.toLowerCase()) ||
          item.description.en.toLowerCase().includes(w.toLowerCase())
      )
  );
}

// ---------------------------------------------------------------------------
// The 7 checks
// ---------------------------------------------------------------------------

const CHECKS: Check[] = [
  // 1. Scaffolding check
  {
    condition: (state) =>
      state.building.verdiepingen >= 2 &&
      !hasItem(
        state.items,
        "scaffolding",
        "aerial_work",
        "hoogwerker",
        "steigers"
      ),
    message: (state) =>
      `Je hebt ${state.building.verdiepingen} verdiepingen opgegeven maar geen steigers of hoogwerker toegevoegd. Wil je dit alsnog toevoegen?`,
    onYes: "return_to_phase3",
  },

  // 2. Tile lift check
  {
    condition: (state) =>
      hasItem(
        state.items,
        "tile",
        "pannendak",
        "concrete_tiles",
        "ceramic",
        "leien",
        "metaaldak"
      ) && !hasItem(state.items, "tile_lift", "pannenlift"),
    message: () =>
      "Er is een pannendak geselecteerd maar geen pannenlift. Toevoegen?",
    onYes: "add_item_and_return",
    itemToAdd: () => ({
      id: "equipment_tile_lift",
      description: {
        nl: "Pannenlift huur",
        en: "Tile lift hire",
        es: "Alquiler elevador de tejas",
      },
      unit: "dag",
      quantity: 1,
      unitPrice: 95,
      total: 95,
      vatRate: 0.21,
    }),
  },

  // 3. Container check
  {
    condition: (state) =>
      state.items.length > 5 && !hasItem(state.items, "container"),
    message: () =>
      "Je hebt veel materiaal geselecteerd. Wil je een container toevoegen?",
    onYes: "return_to_phase3",
  },

  // 4. Primer/adhesive check
  {
    condition: (state) =>
      hasItem(state.items, "bitumen", "epdm") &&
      !hasCustomItemMention(state.items, "lijm", "primer"),
    message: () => "Heb je lijm/primer kosten meegenomen?",
    onYes: "return_to_phase3",
  },

  // 5. Lead work check
  {
    condition: (state) =>
      hasItem(state.items, "chimney", "schoorsteen") &&
      !hasItem(state.items, "lood", "flashing", "kilgoot"),
    message: () =>
      "Heb je loodwerkkosten meegenomen bij het schoorsteenwerk?",
    onYes: "return_to_phase3",
  },

  // 6. Solar penetrations check
  {
    condition: (state) =>
      hasItem(state.items, "solar") &&
      !hasItem(state.items, "penetrat", "doorvoer"),
    message: () => "Wil je waterdichte dakdoorvoeren toevoegen?",
    onYes: "return_to_phase3",
  },

  // 7. Accessibility check
  {
    condition: (state) =>
      state.building.bereikbaarheid ===
        "Zeer moeilijk (geen oprit/lift)" &&
      !hasItem(
        state.items,
        "aerial_work",
        "scaffolding",
        "hoogwerker",
        "steigers"
      ),
    message: () =>
      "Bereikbaarheid is als moeilijk gemarkeerd. Extra materieel toegevoegd?",
    onYes: "return_to_phase3",
  },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CheckupPopups({
  quoteState,
  onAddItem,
  onReturnToPhase3,
  onComplete,
}: CheckupPopupsProps) {
  // Pre-filter once on mount — only checks whose condition is currently true
  const activeChecks = useMemo(
    () => CHECKS.filter((c) => c.condition(quoteState)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // intentional: evaluate conditions against the snapshot taken at mount
  );

  const [step, setStep] = useState(0);

  // If no checks triggered at all, call onComplete immediately after mount
  useEffect(() => {
    if (activeChecks.length === 0) {
      onComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (activeChecks.length === 0 || step >= activeChecks.length) {
    return null;
  }

  const check = activeChecks[step];
  const message = check.message(quoteState);
  const isLast = step === activeChecks.length - 1;

  function advance() {
    if (isLast) {
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  }

  function handleYes() {
    if (check.onYes === "return_to_phase3") {
      onReturnToPhase3();
      return;
    }
    if (
      check.onYes === "add_item_and_return" ||
      check.onYes === "add_item_and_continue"
    ) {
      if (check.itemToAdd) {
        onAddItem(check.itemToAdd(quoteState));
      }
      if (check.onYes === "add_item_and_return") {
        onReturnToPhase3();
        return;
      }
    }
    advance();
  }

  function handleNo() {
    advance();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 shadow-2xl flex flex-col gap-5 p-6">
        {/* Title */}
        <h2 className="text-lg font-bold" style={{ color: "#d4af37" }}>
          Aandachtspunt
        </h2>

        {/* Message */}
        <p className="text-base text-white leading-relaxed">{message}</p>

        {/* Progress dots */}
        {activeChecks.length > 1 && (
          <div className="flex gap-1.5">
            {activeChecks.map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-colors"
                style={{
                  backgroundColor:
                    i < step
                      ? "#22c55e"
                      : i === step
                      ? "#d4af37"
                      : "#374151",
                }}
              />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleYes}
            className="min-h-12 w-full rounded bg-[#d4af37] px-6 py-3 text-sm font-bold text-black hover:bg-yellow-400 transition-colors"
          >
            Ja, toevoegen
          </button>
          <button
            type="button"
            onClick={handleNo}
            className="min-h-12 w-full rounded bg-gray-700 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-600 transition-colors"
          >
            Nee, doorgaan
          </button>
        </div>
      </div>
    </div>
  );
}
